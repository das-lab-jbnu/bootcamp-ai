const SPREADSHEET_ID = "1IYVPZ9OC4PF9d-KqnRUDiMt7aX2i46cDq8lB7kIwwptY8GeTb1F0mgYJ";
const SHEET_NAME = "applications";
const APPLICATION_ID_PREFIX = "BOOT-2026";
const TIMEZONE = "Asia/Seoul";

const HEADERS = [
  "timestamp",
  "application_id",
  "name",
  "student_id",
  "email",
  "organization",
  "phone",
  "program",
  "motivation",
  "status"
];

function doGet(e) {
  const action = getAction(e, "status");

  try {
    if (action === "status") {
      return jsonResponse({
        result: "success",
        applications: getApplicationsByEmail(e.parameter.email)
      });
    }

    return jsonResponse({ result: "error", message: "Unknown action" });
  } catch (error) {
    return jsonResponse({ result: "error", message: error.message });
  }
}

function doPost(e) {
  const payload = parsePayload(e);
  const action = payload.action || "submit";

  try {
    if (action === "status") {
      return jsonResponse({
        result: "success",
        applications: getApplicationsByEmail(payload.email)
      });
    }

    if (action === "submit") {
      return jsonResponse(submitApplication(payload));
    }

    if (action === "update") {
      return jsonResponse(updateApplication(payload));
    }

    return jsonResponse({ result: "error", message: "Unknown action" });
  } catch (error) {
    return jsonResponse({ result: "error", message: error.message });
  }
}

function submitApplication(payload) {
  validatePayload(payload, ["name", "student_id", "email", "organization", "phone", "program", "motivation"]);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet();
    const rows = getRows(sheet);
    const duplicate = rows.find((row) => {
      return normalize(row.email) === normalize(payload.email) && row.program === payload.program;
    });

    if (duplicate) {
      return { result: "duplicate" };
    }

    const timestamp = new Date();
    const applicationId = generateApplicationId(sheet);
    const status = "접수";

    sheet.appendRow([
      timestamp,
      applicationId,
      payload.name,
      payload.student_id,
      payload.email,
      payload.organization,
      payload.phone,
      payload.program,
      payload.motivation,
      status
    ]);

    let emailSent = true;
    try {
      sendSubmissionEmail({
        email: payload.email,
        name: payload.name,
        program: payload.program,
        timestamp,
        application_id: applicationId,
        status
      });
    } catch (error) {
      emailSent = false;
      console.error(`Submission email failed for ${applicationId}: ${error.message}`);
    }

    return {
      result: "success",
      application_id: applicationId,
      timestamp: timestamp.toISOString(),
      status,
      email_sent: emailSent
    };
  } finally {
    lock.releaseLock();
  }
}

function updateApplication(payload) {
  validatePayload(payload, [
    "application_id",
    "name",
    "student_id",
    "email",
    "organization",
    "phone",
    "program",
    "motivation"
  ]);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headerMap = getHeaderMap(data[0]);
    const rowIndex = findRowIndex(data, headerMap, payload.application_id, payload.email);

    if (rowIndex === -1) {
      return { result: "not_found" };
    }

    const duplicate = getRows(sheet).find((row) => {
      return (
        row.application_id !== payload.application_id &&
        normalize(row.email) === normalize(payload.email) &&
        row.program === payload.program
      );
    });

    if (duplicate) {
      return { result: "duplicate" };
    }

    const rowNumber = rowIndex + 1;
    setCell(sheet, rowNumber, headerMap, "name", payload.name);
    setCell(sheet, rowNumber, headerMap, "student_id", payload.student_id);
    setCell(sheet, rowNumber, headerMap, "organization", payload.organization);
    setCell(sheet, rowNumber, headerMap, "phone", payload.phone);
    setCell(sheet, rowNumber, headerMap, "program", payload.program);
    setCell(sheet, rowNumber, headerMap, "motivation", payload.motivation);

    return { result: "success", application_id: payload.application_id };
  } finally {
    lock.releaseLock();
  }
}

function getApplicationsByEmail(email) {
  if (!email) return [];

  return getRows(getSheet())
    .filter((row) => normalize(row.email) === normalize(email))
    .map((row) => ({
      timestamp: toIsoString(row.timestamp),
      application_id: row.application_id,
      name: row.name,
      student_id: row.student_id,
      email: row.email,
      organization: row.organization,
      phone: row.phone,
      program: row.program,
      motivation: row.motivation,
      status: row.status || "접수"
    }));
}

function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME) || findSheetByHeaders(spreadsheet);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  ensureHeaders(sheet);
  return sheet;
}

function findSheetByHeaders(spreadsheet) {
  const sheets = spreadsheet.getSheets();

  return sheets.find((sheet) => {
    const lastColumn = sheet.getLastColumn();
    if (lastColumn === 0) return false;

    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    return headers.includes("timestamp") && headers.includes("email") && headers.includes("program");
  });
}

function ensureHeaders(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  const currentHeaders = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
  const isEmptySheet = currentHeaders.every((header) => !header);
  const hasApplicationId = currentHeaders.includes("application_id");

  if (!isEmptySheet && !hasApplicationId && currentHeaders[0] === "timestamp") {
    sheet.insertColumnAfter(1);
  }

  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  backfillApplicationIds(sheet);
}

function backfillApplicationIds(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;

  const idColumn = HEADERS.indexOf("application_id") + 1;
  const idRange = sheet.getRange(2, idColumn, lastRow - 1, 1);
  const ids = idRange.getValues();
  let maxNumber = getMaxApplicationNumber(ids.flat());
  let changed = false;

  const nextIds = ids.map(([id]) => {
    if (id) return [id];

    maxNumber += 1;
    changed = true;
    return [`${APPLICATION_ID_PREFIX}-${String(maxNumber).padStart(4, "0")}`];
  });

  if (changed) {
    idRange.setValues(nextIds);
  }
}

function getRows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headerMap = getHeaderMap(data[0]);
  return data.slice(1).map((row) => {
    return HEADERS.reduce((record, header) => {
      record[header] = row[headerMap[header]];
      return record;
    }, {});
  });
}

function getHeaderMap(headers) {
  return headers.reduce((map, header, index) => {
    map[header] = index;
    return map;
  }, {});
}

function generateApplicationId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return `${APPLICATION_ID_PREFIX}-0001`;

  const idColumn = HEADERS.indexOf("application_id") + 1;
  const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues().flat();
  const maxNumber = getMaxApplicationNumber(ids);

  return `${APPLICATION_ID_PREFIX}-${String(maxNumber + 1).padStart(4, "0")}`;
}

function getMaxApplicationNumber(ids) {
  const pattern = new RegExp(`^${APPLICATION_ID_PREFIX}-(\\d{4})$`);

  return ids.reduce((max, id) => {
    const match = String(id || "").match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
}

function findRowIndex(data, headerMap, applicationId, email) {
  for (let index = 1; index < data.length; index += 1) {
    const row = data[index];
    const sameId = row[headerMap.application_id] === applicationId;
    const sameEmail = normalize(row[headerMap.email]) === normalize(email);

    if (sameId && sameEmail) {
      return index;
    }
  }

  return -1;
}

function setCell(sheet, rowNumber, headerMap, header, value) {
  sheet.getRange(rowNumber, headerMap[header] + 1).setValue(value);
}

function sendSubmissionEmail(application) {
  const subject = `[전북대 방산 AI 부트캠프] ${application.program} 신청 접수 안내`;
  const timestamp = Utilities.formatDate(application.timestamp, TIMEZONE, "yyyy-MM-dd HH:mm:ss");
  const body = [
    `${application.name}님, 신청이 정상적으로 접수되었습니다.`,
    "",
    `신청 프로그램: ${application.program}`,
    `신청 시간: ${timestamp}`,
    `신청 ID: ${application.application_id}`,
    `신청 상태: ${application.status}`,
    "",
    "신청 내역 조회 페이지에서 신청 내용을 확인하거나 수정할 수 있습니다."
  ].join("\n");

  GmailApp.sendEmail(application.email, subject, body);
}

function validatePayload(payload, requiredFields) {
  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new Error(`Missing field: ${field}`);
    }
  });
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) return {};
  return JSON.parse(e.postData.contents);
}

function getAction(e, fallback) {
  return e && e.parameter && e.parameter.action ? e.parameter.action : fallback;
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function toIsoString(value) {
  if (Object.prototype.toString.call(value) === "[object Date]" && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }

  return String(value || "");
}

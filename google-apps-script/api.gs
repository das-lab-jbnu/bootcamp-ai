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

    if (action === "getProgramSettings") {
      return jsonResponse(getProgramSettings(payload));
    }

    if (action === "updateProgramSetting") {
      return jsonResponse(updateProgramSetting(payload));
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
 if (!isProgramOpen(payload.program)) {
  return {
    result: "closed",
    message: "해당 과목은 접수가 종료되었습니다."
  };
 }
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
function getProgramSettings(payload) {
  if (payload.password !== CONFIG.ADMIN_PASSWORD) {
    return { result: "error", message: "관리자 비밀번호가 올바르지 않습니다." };
  }

  const sheet = getSettingsSheet();
  const rows = sheet.getDataRange().getValues();
  const settings = {};

  for (let i = 1; i < rows.length; i++) {
    settings[rows[i][0]] = rows[i][1] === true || rows[i][1] === "TRUE";
  }

  return { result: "success", settings };
}

function updateProgramSetting(payload) {
  if (payload.password !== CONFIG.ADMIN_PASSWORD) {
    return { result: "error", message: "관리자 비밀번호가 올바르지 않습니다." };
  }

  const sheet = getSettingsSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === payload.program) {
      sheet.getRange(i + 1, 2).setValue(payload.isOpen === true);
      return { result: "success" };
    }
  }

  sheet.appendRow([payload.program, payload.isOpen === true]);
  return { result: "success" };
}

function getSettingsSheet() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SETTINGS_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SETTINGS_SHEET_NAME);
    sheet.appendRow(["program", "is_open"]);
  }

  return sheet;
}

function isProgramOpen(program) {
  const sheet = getSettingsSheet();
  const rows = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === program) {
      return rows[i][1] === true || rows[i][1] === "TRUE";
    }
  }

  return true;
}
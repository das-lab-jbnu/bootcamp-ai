function getSheet() {
  const spreadsheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(CONFIG.SHEET_NAME) || findSheetByHeaders(spreadsheet);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(CONFIG.SHEET_NAME);
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
    return [`${CONFIG.APPLICATION_ID_PREFIX}-${String(maxNumber).padStart(4, "0")}`];
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

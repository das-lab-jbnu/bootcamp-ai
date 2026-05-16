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

function validatePayload(payload, requiredFields) {
  requiredFields.forEach((field) => {
    if (!payload[field]) {
      throw new Error(`Missing field: ${field}`);
    }
  });
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

function getHeaderMap(headers) {
  return headers.reduce((map, header, index) => {
    map[header] = index;
    return map;
  }, {});
}

function generateApplicationId(sheet) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return `${CONFIG.APPLICATION_ID_PREFIX}-0001`;

  const idColumn = HEADERS.indexOf("application_id") + 1;
  const ids = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues().flat();
  const maxNumber = getMaxApplicationNumber(ids);

  return `${CONFIG.APPLICATION_ID_PREFIX}-${String(maxNumber + 1).padStart(4, "0")}`;
}

function getMaxApplicationNumber(ids) {
  const pattern = new RegExp(`^${CONFIG.APPLICATION_ID_PREFIX}-(\\d{4})$`);

  return ids.reduce((max, id) => {
    const match = String(id || "").match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
}

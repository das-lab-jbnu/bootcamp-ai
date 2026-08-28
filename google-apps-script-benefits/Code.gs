const BENEFITS_CONFIG = {
  SHEET_NAME: "benefits",
  APPLICATION_SHEET_NAME: "scholarship_applications",
  UPLOAD_FOLDER_NAME: "[비공개] 학생 장학금 통장사본 (웹신청 전용)",
  TIMEZONE: "Asia/Seoul",
  OTP_TTL_SECONDS: 600,
  OTP_RESEND_SECONDS: 60,
  SESSION_TTL_SECONDS: 900,
  MAX_OTP_ATTEMPTS: 5,
  MAX_BANKBOOK_FILE_BYTES: 5 * 1024 * 1024
};

const BANKBOOK_FILE_TYPES = {
  "application/pdf": { extension: "pdf", signature: [0x25, 0x50, 0x44, 0x46] },
  "image/jpeg": { extension: "jpg", signature: [0xff, 0xd8, 0xff] },
  "image/png": { extension: "png", signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }
};

const BENEFITS_HEADERS = [
  "email",
  "name",
  "basic_completion_status",
  "basic_completion_date",
  "basic_certificate_url",
  "intermediate_completion_status",
  "intermediate_completion_date",
  "intermediate_certificate_url",
  "scholarship_eligibility",
  "scholarship_round",
  "scholarship_application_status",
  "scholarship_apply_start",
  "scholarship_apply_end",
  "scholarship_applied_at",
  "updated_at",
  "internal_note"
];

const SCHOLARSHIP_APPLICATION_HEADERS = [
  "application_id",
  "email",
  "name",
  "scholarship_round",
  "bank_name",
  "account_holder",
  "account_number",
  "bankbook_file_id",
  "bankbook_file_name",
  "bankbook_mime_type",
  "bankbook_file_size",
  "submitted_at",
  "application_status",
  "reviewed_at",
  "internal_note"
];

function doGet() {
  return jsonResponse_({
    result: "success",
    service: "bootcamp-ai-student-benefits"
  });
}

function doPost(e) {
  try {
    const payload = parsePayload_(e);
    const action = String(payload.action || "").trim();

    if (action === "sendCode") {
      return jsonResponse_(sendVerificationCode_(payload.email));
    }

    if (action === "verifyCode") {
      return jsonResponse_(verifyCode_(payload.email, payload.code));
    }

    if (action === "getBenefits") {
      return jsonResponse_(getBenefitsBySession_(payload.session_token));
    }

    if (action === "submitScholarshipApplication") {
      return jsonResponse_(submitScholarshipApplication_(payload.session_token, payload));
    }

    throwPublicError_("invalid_request", "지원하지 않는 요청입니다.");
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return jsonResponse_({
      result: "error",
      code: error.publicCode || "server_error",
      message: error.publicMessage || "요청을 처리하지 못했습니다."
    });
  }
}

/**
 * 새 Google Sheet에서 확장 프로그램 > Apps Script를 열고 이 함수를 한 번 실행합니다.
 * benefits 탭, 헤더, 드롭다운과 날짜 형식을 자동으로 준비합니다.
 */
function setupBenefitsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error("Google Sheet에 연결된 Apps Script에서 실행해주세요.");
  }

  PropertiesService.getScriptProperties().setProperty(
    "BENEFITS_SPREADSHEET_ID",
    spreadsheet.getId()
  );

  let sheet = spreadsheet.getSheetByName(BENEFITS_CONFIG.SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(BENEFITS_CONFIG.SHEET_NAME);
  }

  const headerRange = sheet.getRange(1, 1, 1, BENEFITS_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0].map(String);
  const hasExistingHeaders = currentHeaders.some((value) => value.trim());

  if (hasExistingHeaders && currentHeaders.join("|") !== BENEFITS_HEADERS.join("|")) {
    throw new Error("benefits 시트의 첫 행이 비어 있지 않습니다. 새 빈 시트에서 다시 실행해주세요.");
  }

  headerRange.setValues([BENEFITS_HEADERS]);
  headerRange
    .setBackground("#002d56")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");

  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 34);
  [
    220, 110, 140, 130, 240, 150, 130, 240,
    140, 130, 170, 145, 145, 165, 165, 250
  ].forEach((width, index) => sheet.setColumnWidth(index + 1, width));

  const editableRows = Math.max(sheet.getMaxRows() - 1, 1);
  setListValidation_(sheet, "basic_completion_status", ["심사중", "이수", "미이수"], editableRows);
  setListValidation_(sheet, "intermediate_completion_status", ["심사중", "이수", "미이수"], editableRows);
  setListValidation_(sheet, "scholarship_eligibility", ["심사중", "대상", "비대상"], editableRows);
  setListValidation_(
    sheet,
    "scholarship_application_status",
    ["신청 전", "신청완료", "접수", "보완요청", "승인", "반려", "지급완료"],
    editableRows
  );

  [
    "basic_completion_date",
    "intermediate_completion_date",
    "scholarship_apply_start",
    "scholarship_apply_end",
    "scholarship_applied_at",
    "updated_at"
  ].forEach((header) => {
    const column = BENEFITS_HEADERS.indexOf(header) + 1;
    sheet.getRange(2, column, editableRows, 1).setNumberFormat("yyyy-mm-dd hh:mm");
  });

  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, sheet.getMaxRows(), BENEFITS_HEADERS.length).createFilter();
  }

  setupScholarshipApplicationsSheet_(spreadsheet);
  const uploadFolder = getScholarshipUploadFolder_();
  return `설정 완료: ${spreadsheet.getName()} / ${BENEFITS_CONFIG.SHEET_NAME}, ${BENEFITS_CONFIG.APPLICATION_SHEET_NAME} / ${uploadFolder.name}`;
}

function setupScholarshipApplicationsSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(BENEFITS_CONFIG.APPLICATION_SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(BENEFITS_CONFIG.APPLICATION_SHEET_NAME);
  }
  if (sheet.getMaxColumns() < SCHOLARSHIP_APPLICATION_HEADERS.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      SCHOLARSHIP_APPLICATION_HEADERS.length - sheet.getMaxColumns()
    );
  }

  const headerRange = sheet.getRange(1, 1, 1, SCHOLARSHIP_APPLICATION_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0].map(String);
  const hasExistingHeaders = currentHeaders.some((value) => value.trim());
  if (
    hasExistingHeaders &&
    currentHeaders.join("|") !== SCHOLARSHIP_APPLICATION_HEADERS.join("|")
  ) {
    throw new Error(
      "scholarship_applications 시트의 첫 행 구조가 다릅니다. 헤더를 확인해주세요."
    );
  }

  headerRange.setValues([SCHOLARSHIP_APPLICATION_HEADERS]);
  headerRange
    .setBackground("#193356")
    .setFontColor("#ffffff")
    .setFontWeight("bold")
    .setHorizontalAlignment("center")
    .setVerticalAlignment("middle")
    .setWrap(true);

  sheet.setFrozenRows(1);
  sheet.setHiddenGridlines(true);
  sheet.setRowHeight(1, 42);
  [
    180, 150, 150, 140, 130, 130, 150, 190,
    190, 170, 120, 150, 150, 150, 260
  ].forEach((width, index) => sheet.setColumnWidth(index + 1, width));

  const editableRows = Math.max(sheet.getMaxRows() - 1, 1);
  const headerMap = getHeaderMap_(SCHOLARSHIP_APPLICATION_HEADERS);
  sheet
    .getRange(2, headerMap.account_number + 1, editableRows, 1)
    .setNumberFormat("@");
  sheet
    .getRange(2, headerMap.bankbook_file_size + 1, editableRows, 1)
    .setNumberFormat("0");
  ["submitted_at", "reviewed_at"].forEach((header) => {
    sheet
      .getRange(2, headerMap[header] + 1, editableRows, 1)
      .setNumberFormat("yyyy-mm-dd hh:mm");
  });

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["신청완료", "접수", "보완요청", "승인", "반려", "지급완료"], true)
    .setAllowInvalid(false)
    .build();
  sheet
    .getRange(2, headerMap.application_status + 1, editableRows, 1)
    .setDataValidation(statusRule);

  if (!sheet.getFilter()) {
    sheet
      .getRange(1, 1, sheet.getMaxRows(), SCHOLARSHIP_APPLICATION_HEADERS.length)
      .createFilter();
  }
  return sheet;
}

/**
 * 배포 전 데이터 구조와 공개 응답을 점검하는 읽기 전용 스모크 테스트입니다.
 * setupBenefitsSheet 실행 후 Apps Script 편집기에서 한 번 실행합니다.
 */
function runBenefitsSmokeTest() {
  const sheet = getBenefitsSheet_();
  const headerMap = getHeaderMap_(sheet.getRange(1, 1, 1, BENEFITS_HEADERS.length).getValues()[0]);
  const missingHeaders = BENEFITS_HEADERS.filter((header) => headerMap[header] === undefined);
  if (missingHeaders.length) {
    throw new Error(`benefits 시트 헤더 누락: ${missingHeaders.join(", ")}`);
  }

  const sampleEmail = normalizeEmail_(sheet.getRange(2, headerMap.email + 1).getValue());
  const record = findBenefitRecordByEmail_(sampleEmail);
  if (!record) {
    throw new Error("스모크 테스트용 benefits 2행을 찾을 수 없습니다.");
  }

  const benefits = toPublicBenefits_(record.values);
  const applicationsSheet = getScholarshipApplicationsSheet_();
  const applicationHeaders = applicationsSheet
    .getRange(1, 1, 1, SCHOLARSHIP_APPLICATION_HEADERS.length)
    .getValues()[0]
    .map(String);
  const uploadFolder = getScholarshipUploadFolder_();
  const expectedCanApply =
    normalizeText_(record.values.scholarship_eligibility) === "대상" &&
    !isScholarshipSubmitted_(record.values.scholarship_application_status) &&
    isScholarshipWindowOpen_(record.values);
  const checks = {
    sample_name_present: Boolean(benefits.name && benefits.name !== "학생"),
    basic_completion_status_valid: ["심사중", "이수", "미이수"].includes(
      benefits.basic.status
    ),
    intermediate_completion_status_valid: ["심사중", "이수", "미이수"].includes(
      benefits.intermediate.status
    ),
    scholarship_eligibility_valid: ["심사중", "대상", "비대상"].includes(
      benefits.scholarship.eligibility
    ),
    scholarship_can_apply_consistent:
      benefits.scholarship.can_apply === expectedCanApply,
    internal_note_hidden: benefits.internal_note === undefined,
    application_sheet_ready:
      applicationHeaders.join("|") === SCHOLARSHIP_APPLICATION_HEADERS.join("|"),
    upload_folder_ready:
      uploadFolder.id ===
      PropertiesService.getScriptProperties().getProperty("SCHOLARSHIP_UPLOAD_FOLDER_ID")
  };
  const failed = Object.keys(checks).filter((key) => !checks[key]);
  if (failed.length) {
    throw new Error(`스모크 테스트 실패: ${failed.join(", ")}`);
  }

  const result = {
    result: "success",
    service: "bootcamp-ai-student-benefits",
    sheet: sheet.getName(),
    checks
  };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

function onEdit(e) {
  if (!e || !e.range) return;
  const sheet = e.range.getSheet();
  if (e.range.getRow() < 2) return;

  if (sheet.getName() === BENEFITS_CONFIG.APPLICATION_SHEET_NAME) {
    handleScholarshipApplicationEdit_(e);
    return;
  }

  if (sheet.getName() !== BENEFITS_CONFIG.SHEET_NAME) return;

  const headerMap = getHeaderMap_(BENEFITS_HEADERS);
  const updatedAtColumn = headerMap.updated_at + 1;
  const emailColumn = headerMap.email + 1;
  const firstColumn = e.range.getColumn();
  const lastColumn = firstColumn + e.range.getNumColumns() - 1;
  const rowCount = e.range.getNumRows();

  if (firstColumn <= emailColumn && lastColumn >= emailColumn) {
    const emailRange = sheet.getRange(e.range.getRow(), emailColumn, rowCount, 1);
    const normalizedEmails = emailRange.getValues().map(([value]) => [normalizeEmail_(value)]);
    emailRange.setValues(normalizedEmails);
  }

  if (!(firstColumn === updatedAtColumn && e.range.getNumColumns() === 1)) {
    const now = new Date();
    sheet
      .getRange(e.range.getRow(), updatedAtColumn, rowCount, 1)
      .setValues(Array.from({ length: rowCount }, () => [now]));
  }
}

function handleScholarshipApplicationEdit_(e) {
  const sheet = e.range.getSheet();
  const headerMap = getHeaderMap_(SCHOLARSHIP_APPLICATION_HEADERS);
  const statusColumn = headerMap.application_status + 1;
  const firstColumn = e.range.getColumn();
  const lastColumn = firstColumn + e.range.getNumColumns() - 1;
  if (firstColumn > statusColumn || lastColumn < statusColumn) return;

  const rowCount = e.range.getNumRows();
  const firstRow = e.range.getRow();
  const now = new Date();
  sheet
    .getRange(firstRow, headerMap.reviewed_at + 1, rowCount, 1)
    .setValues(Array.from({ length: rowCount }, () => [now]));

  const rows = sheet
    .getRange(firstRow, 1, rowCount, SCHOLARSHIP_APPLICATION_HEADERS.length)
    .getValues();
  const benefitsSheet = e.source.getSheetByName(BENEFITS_CONFIG.SHEET_NAME);
  if (!benefitsSheet) return;
  rows.forEach((values) => {
    const email = normalizeEmail_(values[headerMap.email]);
    const round = String(values[headerMap.scholarship_round] || "").trim();
    const status = String(values[headerMap.application_status] || "").trim();
    if (!email || !status) return;

    const benefitRecord = findBenefitRecordByEmail_(email, benefitsSheet);
    if (!benefitRecord) return;
    if (String(benefitRecord.values.scholarship_round || "").trim() !== round) return;

    benefitRecord.sheet
      .getRange(benefitRecord.rowNumber, benefitRecord.headerMap.scholarship_application_status + 1)
      .setValue(status);
    benefitRecord.sheet
      .getRange(benefitRecord.rowNumber, benefitRecord.headerMap.updated_at + 1)
      .setValue(now);
  });
}

function sendVerificationCode_(emailValue) {
  const email = normalizeEmail_(emailValue);
  if (!isValidEmail_(email)) {
    throwPublicError_("invalid_request", "이메일 형식을 확인해주세요.");
  }

  const cache = CacheService.getScriptCache();
  const emailKey = hashKey_(email);
  const resendKey = `benefits_resend_${emailKey}`;
  const standardResponse = {
    result: "success",
    message: "등록된 이메일인 경우 인증번호가 발송되었습니다."
  };

  if (cache.get(resendKey)) {
    return standardResponse;
  }
  cache.put(resendKey, "1", BENEFITS_CONFIG.OTP_RESEND_SECONDS);

  const record = findBenefitRecordByEmail_(email);
  if (!record) {
    return standardResponse;
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  cache.put(
    `benefits_otp_${emailKey}`,
    JSON.stringify({ code, attempts: 0 }),
    BENEFITS_CONFIG.OTP_TTL_SECONDS
  );

  const recipientName = String(record.values.name || "학생").trim();
  MailApp.sendEmail({
    to: email,
    subject: "[전북대 방산 AI 부트캠프] 학생 지원 조회 인증번호",
    body: [
      `${recipientName}님, 안녕하세요.`,
      "",
      `학생 지원 혜택 조회 인증번호는 ${code}입니다.`,
      `인증번호는 ${Math.floor(BENEFITS_CONFIG.OTP_TTL_SECONDS / 60)}분 동안 유효합니다.`,
      "",
      "본인이 요청하지 않았다면 이 메일을 무시해주세요."
    ].join("\n"),
    name: "전북대 방산 AI 부트캠프"
  });

  return standardResponse;
}

function verifyCode_(emailValue, codeValue) {
  const email = normalizeEmail_(emailValue);
  const code = String(codeValue || "").trim();
  if (!isValidEmail_(email) || !/^\d{6}$/.test(code)) {
    throwPublicError_("invalid_code", "인증번호가 올바르지 않거나 만료되었습니다.");
  }

  const cache = CacheService.getScriptCache();
  const otpKey = `benefits_otp_${hashKey_(email)}`;
  const cachedValue = cache.get(otpKey);
  if (!cachedValue) {
    throwPublicError_("invalid_code", "인증번호가 올바르지 않거나 만료되었습니다.");
  }

  const otp = JSON.parse(cachedValue);
  if (otp.attempts >= BENEFITS_CONFIG.MAX_OTP_ATTEMPTS || otp.code !== code) {
    otp.attempts += 1;
    if (otp.attempts >= BENEFITS_CONFIG.MAX_OTP_ATTEMPTS) {
      cache.remove(otpKey);
    } else {
      cache.put(otpKey, JSON.stringify(otp), BENEFITS_CONFIG.OTP_TTL_SECONDS);
    }
    throwPublicError_("invalid_code", "인증번호가 올바르지 않거나 만료되었습니다.");
  }

  const record = findBenefitRecordByEmail_(email);
  if (!record) {
    cache.remove(otpKey);
    throwPublicError_("invalid_code", "인증번호가 올바르지 않거나 만료되었습니다.");
  }

  cache.remove(otpKey);
  const sessionToken = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "");
  cache.put(
    `benefits_session_${sessionToken}`,
    email,
    BENEFITS_CONFIG.SESSION_TTL_SECONDS
  );

  return {
    result: "success",
    session_token: sessionToken,
    expires_in: BENEFITS_CONFIG.SESSION_TTL_SECONDS,
    benefits: toPublicBenefits_(record.values)
  };
}

function getBenefitsBySession_(sessionTokenValue) {
  const email = getSessionEmail_(sessionTokenValue);
  const record = findBenefitRecordByEmail_(email);
  if (!record) {
    throwPublicError_("session_expired", "인증 시간이 만료되었습니다.");
  }

  return {
    result: "success",
    benefits: toPublicBenefits_(record.values)
  };
}

function submitScholarshipApplication_(sessionTokenValue, payloadValue) {
  const email = getSessionEmail_(sessionTokenValue);
  const payload = payloadValue || {};
  if (payload.privacy_consent !== true) {
    throwPublicError_("consent_required", "개인정보 수집·이용 동의가 필요합니다.");
  }
  const bankInfo = validateBankInfo_(payload);
  const bankbook = validateBankbookFile_(payload.file);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let uploadedFile = null;
  let applicationSheet = null;
  let applicationRow = 0;
  let applicationId = "";
  let benefitRecord = null;
  let benefitUpdated = false;

  try {
    const record = findBenefitRecordByEmail_(email);
    benefitRecord = record;
    if (!record) {
      throwPublicError_("session_expired", "인증 시간이 만료되었습니다.");
    }

    const eligibility = normalizeText_(record.values.scholarship_eligibility);
    const applicationStatus = normalizeText_(record.values.scholarship_application_status);
    if (eligibility !== "대상") {
      throwPublicError_("not_eligible", "현재 장학금 신청 대상이 아닙니다.");
    }

    if (isScholarshipSubmitted_(applicationStatus)) {
      throwPublicError_("already_applied", "이미 장학금 신청이 접수되었습니다.");
    }

    if (!isScholarshipWindowOpen_(record.values)) {
      throwPublicError_("application_closed", "현재 장학금 신청 기간이 아닙니다.");
    }

    const scholarshipRound = String(record.values.scholarship_round || "").trim();
    if (!scholarshipRound) {
      throwPublicError_("not_configured", "장학금 선발 회차 정보가 아직 입력되지 않았습니다.");
    }

    if (findScholarshipApplication_(email, scholarshipRound)) {
      throwPublicError_("already_applied", "이미 장학금 신청이 접수되었습니다.");
    }

    const now = new Date();
    applicationId = createScholarshipApplicationId_(now);
    const storedFileName = `${applicationId}.${bankbook.extension}`;
    try {
      const blob = Utilities.newBlob(bankbook.bytes, bankbook.mimeType, storedFileName);
      const uploadFolder = getScholarshipUploadFolder_();
      uploadedFile = Drive.Files.create(
        {
          name: storedFileName,
          parents: [uploadFolder.id],
          description: `장학금 신청 통장사본 / 신청번호 ${applicationId}`,
          appProperties: { scholarshipApplicationId: applicationId }
        },
        blob,
        { fields: "id,name,size,mimeType" }
      );
    } catch (error) {
      console.error(error && error.stack ? error.stack : error);
      throwPublicError_("upload_failed", "통장사본 파일을 저장하지 못했습니다.");
    }

    applicationSheet = getScholarshipApplicationsSheet_();
    applicationSheet.appendRow([
      applicationId,
      email,
      String(record.values.name || "").trim(),
      scholarshipRound,
      bankInfo.bankName,
      bankInfo.accountHolder,
      bankInfo.accountNumber,
      uploadedFile.id,
      storedFileName,
      bankbook.mimeType,
      bankbook.bytes.length,
      now,
      "신청완료",
      "",
      ""
    ]);
    applicationRow = applicationSheet.getLastRow();

    const headerMap = record.headerMap;
    record.sheet
      .getRange(record.rowNumber, headerMap.scholarship_application_status + 1)
      .setValue("신청완료");
    record.sheet
      .getRange(record.rowNumber, headerMap.scholarship_applied_at + 1)
      .setValue(now);
    record.sheet
      .getRange(record.rowNumber, headerMap.updated_at + 1)
      .setValue(now);
    benefitUpdated = true;

    const refreshed = findBenefitRecordByEmail_(email);
    try {
      sendScholarshipConfirmation_(email, record.values.name, {
        applicationId,
        scholarshipRound,
        bankName: bankInfo.bankName,
        accountNumber: bankInfo.accountNumber,
        submittedAt: now
      });
    } catch (mailError) {
      console.error(mailError && mailError.stack ? mailError.stack : mailError);
    }

    return {
      result: "success",
      benefits: toPublicBenefits_(refreshed.values),
      application: {
        application_id: applicationId,
        scholarship_round: scholarshipRound,
        application_status: "신청완료",
        submitted_at: formatDate_(now, "yyyy-MM-dd HH:mm")
      }
    };
  } catch (error) {
    rollbackScholarshipApplication_(applicationSheet, applicationRow, applicationId, uploadedFile);
    rollbackBenefitApplicationStatus_(benefitRecord, benefitUpdated);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function validateBankInfo_(payload) {
  const bankName = normalizeSingleLine_(payload.bank_name);
  const accountHolder = normalizeSingleLine_(payload.account_holder);
  const accountNumber = String(payload.account_number || "").replace(/[\s-]/g, "");

  const validBankName = /^[0-9A-Za-z가-힣\s().·-]{2,40}$/.test(bankName);
  const validAccountHolder = /^[A-Za-z가-힣\s·]{2,40}$/.test(accountHolder);
  if (!validBankName || !validAccountHolder || !/^\d{8,20}$/.test(accountNumber)) {
    throwPublicError_("invalid_bank_info", "은행, 예금주, 계좌번호를 확인해주세요.");
  }

  return { bankName, accountHolder, accountNumber };
}

function validateBankbookFile_(fileValue) {
  const file = fileValue && typeof fileValue === "object" ? fileValue : null;
  if (!file) {
    throwPublicError_("invalid_file", "통장사본 파일을 첨부해주세요.");
  }

  const mimeType = String(file.mime_type || "").toLowerCase();
  const fileType = BANKBOOK_FILE_TYPES[mimeType];
  if (!fileType) {
    throwPublicError_("invalid_file", "PDF, JPG, PNG 파일만 제출할 수 있습니다.");
  }

  const declaredSize = Number(file.size);
  if (!Number.isInteger(declaredSize) || declaredSize <= 0) {
    throwPublicError_("invalid_file", "첨부파일이 비어 있거나 올바르지 않습니다.");
  }
  if (declaredSize > BENEFITS_CONFIG.MAX_BANKBOOK_FILE_BYTES) {
    throwPublicError_("file_too_large", "통장사본 파일은 5MB 이하로 제출해주세요.");
  }

  const base64 = String(file.base64 || "").trim();
  const maxBase64Length = Math.ceil(BENEFITS_CONFIG.MAX_BANKBOOK_FILE_BYTES / 3) * 4 + 4;
  if (base64.length > maxBase64Length) {
    throwPublicError_("file_too_large", "통장사본 파일은 5MB 이하로 제출해주세요.");
  }
  if (!base64 || base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throwPublicError_("invalid_file", "첨부파일 형식이 올바르지 않습니다.");
  }

  let bytes;
  try {
    bytes = Utilities.base64Decode(base64);
  } catch (error) {
    throwPublicError_("invalid_file", "첨부파일 형식이 올바르지 않습니다.");
  }
  if (bytes.length !== declaredSize || !hasFileSignature_(bytes, fileType.signature)) {
    throwPublicError_("invalid_file", "파일 내용과 확장자가 일치하지 않습니다.");
  }

  return {
    bytes,
    mimeType,
    extension: fileType.extension
  };
}

function hasFileSignature_(bytes, signature) {
  if (!bytes || bytes.length < signature.length) return false;
  return signature.every((expected, index) => ((bytes[index] + 256) % 256) === expected);
}

function findScholarshipApplication_(email, scholarshipRound) {
  const sheet = getScholarshipApplicationsSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  const headerMap = getHeaderMap_(data[0]);
  const missingHeaders = SCHOLARSHIP_APPLICATION_HEADERS.filter(
    (header) => headerMap[header] === undefined
  );
  if (missingHeaders.length) {
    throw new Error(`scholarship_applications 시트 헤더 누락: ${missingHeaders.join(", ")}`);
  }

  for (let index = 1; index < data.length; index += 1) {
    if (normalizeEmail_(data[index][headerMap.email]) !== email) continue;
    if (String(data[index][headerMap.scholarship_round] || "").trim() !== scholarshipRound) continue;
    return { rowNumber: index + 1 };
  }
  return null;
}

function createScholarshipApplicationId_(now) {
  const timestamp = Utilities.formatDate(now, BENEFITS_CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
  const suffix = Utilities.getUuid().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `SCH-${timestamp}-${suffix}`;
}

function sendScholarshipConfirmation_(email, nameValue, application) {
  MailApp.sendEmail({
    to: email,
    subject: "[전북대 방산 AI 부트캠프] 장학금 신청 접수 안내",
    body: [
      `${String(nameValue || "학생").trim()}님, 안녕하세요.`,
      "",
      "장학금 신청서와 통장사본이 정상적으로 접수되었습니다.",
      `신청번호: ${application.applicationId}`,
      `선발 회차: ${application.scholarshipRound}`,
      `은행: ${application.bankName}`,
      `계좌번호: ${maskAccountNumber_(application.accountNumber)}`,
      `접수 시각: ${formatDate_(application.submittedAt, "yyyy-MM-dd HH:mm")}`,
      "",
      "입력 정보의 수정이 필요한 경우 사업단 담당자에게 문의해주세요."
    ].join("\n"),
    name: "전북대 방산 AI 부트캠프"
  });
}

function rollbackScholarshipApplication_(sheet, rowNumber, applicationId, uploadedFile) {
  try {
    if (sheet && rowNumber > 1 && sheet.getRange(rowNumber, 1).getValue() === applicationId) {
      sheet.deleteRow(rowNumber);
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
  }
  try {
    if (uploadedFile && uploadedFile.id) {
      Drive.Files.update({ trashed: true }, uploadedFile.id, null, { fields: "id,trashed" });
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
  }
}

function rollbackBenefitApplicationStatus_(record, benefitUpdated) {
  if (!record || !benefitUpdated) return;
  try {
    const headerMap = record.headerMap;
    record.sheet
      .getRange(record.rowNumber, headerMap.scholarship_application_status + 1)
      .setValue(record.values.scholarship_application_status || "신청 전");
    record.sheet
      .getRange(record.rowNumber, headerMap.scholarship_applied_at + 1)
      .setValue(record.values.scholarship_applied_at || "");
    record.sheet
      .getRange(record.rowNumber, headerMap.updated_at + 1)
      .setValue(record.values.updated_at || "");
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
  }
}

function toPublicBenefits_(values) {
  const scholarship = {
    eligibility: displayValue_(values.scholarship_eligibility, "정보 없음"),
    round: displayValue_(values.scholarship_round, "-"),
    application_status: displayValue_(values.scholarship_application_status, "신청 전")
  };
  scholarship.can_apply =
    normalizeText_(scholarship.eligibility) === "대상" &&
    !isScholarshipSubmitted_(scholarship.application_status) &&
    isScholarshipWindowOpen_(values);
  scholarship.guidance = getScholarshipGuidance_(scholarship, values);

  return {
    name: displayValue_(values.name, "학생"),
    basic: {
      status: displayValue_(values.basic_completion_status, "정보 없음"),
      date: formatDate_(values.basic_completion_date, "yyyy-MM-dd"),
      certificate_url: safeHttpsUrl_(values.basic_certificate_url)
    },
    intermediate: {
      status: displayValue_(values.intermediate_completion_status, "정보 없음"),
      date: formatDate_(values.intermediate_completion_date, "yyyy-MM-dd"),
      certificate_url: safeHttpsUrl_(values.intermediate_certificate_url)
    },
    scholarship
  };
}

function getScholarshipGuidance_(scholarship, values) {
  if (scholarship.can_apply) {
    return "장학금 대상자로 확인되었습니다. 계좌정보와 통장사본을 제출해주세요.";
  }
  if (isScholarshipSubmitted_(scholarship.application_status)) {
    return "장학금 신청서와 통장사본이 접수되었거나 사업단에서 처리 중입니다.";
  }
  if (normalizeText_(scholarship.eligibility) === "대상" && !isScholarshipWindowOpen_(values)) {
    return "장학금 대상자이지만 현재 신청 기간이 아닙니다.";
  }
  if (normalizeText_(scholarship.eligibility) === "비대상") {
    return "현재 장학금 지원 대상이 아닙니다.";
  }
  if (normalizeText_(scholarship.eligibility) === "심사중") {
    return "사업단에서 장학금 대상 여부를 심사하고 있습니다.";
  }
  return "장학금 대상 여부는 사업단 입력 후 표시됩니다.";
}

function findBenefitRecordByEmail_(email, sheetValue) {
  const sheet = sheetValue || getBenefitsSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;

  const headerMap = getHeaderMap_(data[0]);
  const missingHeaders = BENEFITS_HEADERS.filter((header) => headerMap[header] === undefined);
  if (missingHeaders.length) {
    throw new Error(`benefits 시트 헤더 누락: ${missingHeaders.join(", ")}`);
  }

  for (let index = 1; index < data.length; index += 1) {
    if (normalizeEmail_(data[index][headerMap.email]) !== email) continue;

    const values = {};
    BENEFITS_HEADERS.forEach((header) => {
      values[header] = data[index][headerMap[header]];
    });
    return {
      sheet,
      headerMap,
      rowNumber: index + 1,
      values
    };
  }
  return null;
}

function getBenefitsSheet_() {
  const spreadsheet = getBenefitsSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(BENEFITS_CONFIG.SHEET_NAME);
  if (!sheet) {
    throwPublicError_("not_configured", "benefits 시트를 찾을 수 없습니다.");
  }
  return sheet;
}

function getScholarshipApplicationsSheet_() {
  const spreadsheet = getBenefitsSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(BENEFITS_CONFIG.APPLICATION_SHEET_NAME);
  if (!sheet) {
    throwPublicError_("not_configured", "장학금 신청 시트를 찾을 수 없습니다.");
  }
  return sheet;
}

function getBenefitsSpreadsheet_() {
  const spreadsheetId = PropertiesService.getScriptProperties().getProperty("BENEFITS_SPREADSHEET_ID");
  if (!spreadsheetId) {
    throwPublicError_("not_configured", "학생 지원 시트가 아직 설정되지 않았습니다.");
  }
  return SpreadsheetApp.openById(spreadsheetId);
}

function getScholarshipUploadFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty("SCHOLARSHIP_UPLOAD_FOLDER_ID");
  if (existingId) {
    try {
      const existingFolder = Drive.Files.get(existingId, {
        fields: "id,name,mimeType,trashed"
      });
      if (
        !existingFolder.trashed &&
        existingFolder.mimeType === "application/vnd.google-apps.folder"
      ) {
        return existingFolder;
      }
    } catch (error) {
      console.warn("기존 업로드 폴더를 찾지 못해 새 폴더를 생성합니다.");
    }
    properties.deleteProperty("SCHOLARSHIP_UPLOAD_FOLDER_ID");
  }

  try {
    const folder = Drive.Files.create({
      name: BENEFITS_CONFIG.UPLOAD_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
      description: "학생 장학금 신청 통장사본 비공개 보관 폴더",
      appProperties: { purpose: "bootcamp-scholarship-bankbook-uploads" }
    });
    properties.setProperty("SCHOLARSHIP_UPLOAD_FOLDER_ID", folder.id);
    return folder;
  } catch (error) {
    throwPublicError_("not_configured", "통장사본 보관 폴더에 접근할 수 없습니다.");
  }
}

function getSessionEmail_(sessionTokenValue) {
  const sessionToken = String(sessionTokenValue || "").trim();
  if (!/^[a-f0-9]{64}$/i.test(sessionToken)) {
    throwPublicError_("session_expired", "인증 시간이 만료되었습니다.");
  }

  const cache = CacheService.getScriptCache();
  const key = `benefits_session_${sessionToken}`;
  const email = cache.get(key);
  if (!email) {
    throwPublicError_("session_expired", "인증 시간이 만료되었습니다.");
  }

  cache.put(key, email, BENEFITS_CONFIG.SESSION_TTL_SECONDS);
  return email;
}

function isScholarshipSubmitted_(statusValue) {
  return ["신청완료", "접수", "보완요청", "승인", "반려", "지급완료"].includes(
    normalizeText_(statusValue)
  );
}

function isScholarshipWindowOpen_(values) {
  const now = new Date();
  const start = toDate_(values.scholarship_apply_start);
  const end = toDate_(values.scholarship_apply_end);

  if (start) {
    start.setHours(0, 0, 0, 0);
    if (now < start) return false;
  }
  if (end) {
    end.setHours(23, 59, 59, 999);
    if (now > end) return false;
  }
  return true;
}

function setListValidation_(sheet, header, values, rowCount) {
  const column = BENEFITS_HEADERS.indexOf(header) + 1;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, column, rowCount, 1).setDataValidation(rule);
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throwPublicError_("invalid_request", "요청 본문이 없습니다.");
  }
  try {
    return JSON.parse(e.postData.contents);
  } catch (error) {
    throwPublicError_("invalid_request", "요청 형식이 올바르지 않습니다.");
  }
}

function jsonResponse_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function throwPublicError_(code, message) {
  const error = new Error(message);
  error.publicCode = code;
  error.publicMessage = message;
  throw error;
}

function getHeaderMap_(headers) {
  return headers.reduce((map, header, index) => {
    map[String(header).trim()] = index;
    return map;
  }, {});
}

function normalizeEmail_(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeText_(value) {
  return String(value || "").replace(/\s/g, "").trim();
}

function normalizeSingleLine_(value) {
  return String(value || "").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function maskAccountNumber_(value) {
  const accountNumber = String(value || "").replace(/\D/g, "");
  return accountNumber ? `****-****-${accountNumber.slice(-4)}` : "-";
}

function isValidEmail_(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function displayValue_(value, fallback) {
  const text = String(value || "").trim();
  return text || fallback;
}

function safeHttpsUrl_(value) {
  const text = String(value || "").trim();
  return /^https:\/\//i.test(text) ? text : "";
}

function hashKey_(value) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );
  return Utilities.base64EncodeWebSafe(digest).replace(/=+$/g, "").slice(0, 40);
}

function toDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === "[object Date]" && !Number.isNaN(value.getTime())) {
    return new Date(value.getTime());
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate_(value, pattern) {
  const date = toDate_(value);
  return date ? Utilities.formatDate(date, BENEFITS_CONFIG.TIMEZONE, pattern) : "-";
}

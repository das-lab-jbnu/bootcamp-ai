const BENEFITS_CONFIG = {
  SHEET_NAME: "benefits",
  APPLICATION_SHEET_NAME: "scholarship_applications",
  CERTIFICATE_LOG_SHEET_NAME: "certificate_issuance_log",
  IDEA_CONTEST_TEAM_SHEET_NAME: "idea_contest_teams",
  IDEA_CONTEST_MEMBER_SHEET_NAME: "idea_contest_members",
  IDEA_CONTEST_INDIVIDUAL_SHEET_NAME: "idea_contest_individuals",
  PROGRAM_APPLICATION_SHEET_NAME: "program_applications",
  APPLICATION_CHANGE_LOG_SHEET_NAME: "application_change_log",
  APPLICATION_SPREADSHEET_ID: "1aRNgmAqS6IbRbn5Q-PBqnticH1gJ45c_-sahOs9nDRc",
  UPLOAD_FOLDER_NAME: "[비공개] 학생 장학금 통장사본 (웹신청 전용)",
  CERTIFICATE_TEMPLATE_ID: "19QCbrjGHuGVqJdfFldOcowVsEftsd_2y8qhFuB5NpmI",
  CERTIFICATE_OUTPUT_FOLDER_NAME: "[비공개] 학생 이수증 PDF (웹발급 전용)",
  TIMEZONE: "Asia/Seoul",
  APPLICATIONS_OPEN: true,
  SCHOLARSHIP_APPLICATIONS_OPEN: false,
  OTP_TTL_SECONDS: 600,
  OTP_RESEND_SECONDS: 60,
  SESSION_TTL_SECONDS: 900,
  MAX_OTP_ATTEMPTS: 5,
  MAX_BANKBOOK_FILE_BYTES: 5 * 1024 * 1024,
  MAX_CERTIFICATE_PDF_BYTES: 5 * 1024 * 1024
};

/**
 * 사업단 직접 발급 설정
 * 1) ROW_NUMBER에 benefits 시트의 학생 행 번호를 입력합니다.
 * 2) LEVEL에 "초급" 또는 "중급"을 입력합니다.
 * 3) Apps Script 함수 목록에서 issueCertificateForAdmin을 실행합니다.
 * 사업단 직접 발급은 항상 내부 보관용으로 처리하며 학생에게 공유·알림하지 않습니다.
 */
const ADMIN_CERTIFICATE_ISSUE = {
  ROW_NUMBER: 2,
  LEVEL: "초급"
};

/**
 * 사업단 중급 이수증 일괄 발급 대상
 * benefits 시트 2행부터 50행까지 총 49명을 중급으로 발급합니다.
 */
const ADMIN_CERTIFICATE_ISSUE_LIST = Array.from(
  { length: 49 },
  (_, index) => ({
    ROW_NUMBER: index + 2,
    LEVEL: "중급"
  })
);

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
  "internal_note",
  "affiliation",
  "student_id",
  "basic_course_name",
  "basic_course_period",
  "basic_certificate_number",
  "basic_certificate_file_id",
  "basic_certificate_issued_at",
  "intermediate_course_name",
  "intermediate_course_period",
  "intermediate_certificate_number",
  "intermediate_certificate_file_id",
  "intermediate_certificate_issued_at"
];

const CERTIFICATE_ISSUANCE_HEADERS = [
  "issued_at",
  "certificate_number",
  "email",
  "name",
  "level",
  "course_name",
  "course_period",
  "template_file_id",
  "presentation_file_id",
  "pdf_file_id",
  "pdf_url",
  "status",
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

const IDEA_CONTEST_TEAM_HEADERS = [
  "submitted_at",
  "application_id",
  "team_name",
  "representative_name",
  "representative_student_id",
  "representative_department",
  "representative_phone",
  "representative_email",
  "idea_topic",
  "member_count",
  "privacy_consent",
  "security_ethics_pledge",
  "application_status",
  "reviewed_at",
  "internal_note",
  "defense_industry_course_summary"
];

const IDEA_CONTEST_MEMBER_HEADERS = [
  "application_id",
  "team_name",
  "member_role",
  "name",
  "student_id",
  "department",
  "phone",
  "email",
  "defense_industry_course_status"
];

const IDEA_CONTEST_INDIVIDUAL_HEADERS = [
  "submitted_at",
  "application_id",
  "name",
  "student_id",
  "department",
  "phone",
  "email",
  "privacy_consent",
  "application_status",
  "reviewed_at",
  "matched_team_name",
  "internal_note",
  "defense_industry_course_status",
  "idea_interest_fields"
];

const PROGRAM_APPLICATION_HEADERS = [
  "submitted_at",
  "application_id",
  "program",
  "student_id",
  "name",
  "phone",
  "email",
  "gender",
  "university",
  "department",
  "major_field",
  "course_years",
  "birth_date",
  "admission_month",
  "graduation_month",
  "application_motivation",
  "ai_experience",
  "preferred_ai_service",
  "ai_invitation_email",
  "privacy_consent",
  "application_status",
  "reviewed_at",
  "internal_note"
];

const APPLICATION_CHANGE_LOG_HEADERS = [
  "changed_at",
  "application_id",
  "application_type",
  "email",
  "action",
  "changed_fields",
  "status_before",
  "status_after"
];

const BEGINNER_PROGRAMS = [
  "[초급프로그램] AI Agent 마스터",
  "[초급프로그램] 바이브코딩 입문",
  "[초급프로그램] 생성형 AI 첫걸음: 원리부터 실전 활용까지"
];

const GENDER_OPTIONS = ["남성", "여성"];
const MAJOR_FIELD_OPTIONS = ["공학", "예체능", "자연과학", "의학", "인문사회"];
const COURSE_YEAR_OPTIONS = ["2년", "3년", "4년", "5년", "6년"];
const AI_SERVICE_OPTIONS = ["ChatGPT", "Claude", "신청하지 않음"];
const DEFENSE_INDUSTRY_COURSE_STATUS_OPTIONS = ["수강완료", "수강중", "미수강"];
const IDEA_INTEREST_FIELD_OPTIONS = [
  "방산 제조 및 품질관리",
  "정비 및 군수지원",
  "공급망 및 산업 생태계",
  "안전 및 위험관리",
  "교육훈련 및 지식관리",
  "정보보안 및 AI 신뢰성",
  "아직 정하지 못함"
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

    if (action === "issueCertificate") {
      return jsonResponse_(
        issueCertificate_(payload.session_token, payload.level)
      );
    }

    if (action === "submitScholarshipApplication") {
      ensureScholarshipApplicationsOpen_();
      return jsonResponse_(submitScholarshipApplication_(payload.session_token, payload));
    }

    if (action === "submitIdeaContestApplication") {
      ensureApplicationsOpen_(payload);
      return jsonResponse_(submitIdeaContestApplication_(payload));
    }

    if (action === "submitIdeaContestIndividualApplication") {
      ensureApplicationsOpen_(payload);
      return jsonResponse_(submitIdeaContestIndividualApplication_(payload));
    }

    if (action === "submitProgramApplication") {
      ensureApplicationsOpen_(payload);
      return jsonResponse_(submitProgramApplication_(payload));
    }

    if (action === "sendApplicationCode") {
      return jsonResponse_(sendApplicationVerificationCode_(payload.email));
    }

    if (action === "verifyApplicationCode") {
      return jsonResponse_(
        verifyApplicationCode_(payload.email, payload.code)
      );
    }

    if (action === "getApplications") {
      return jsonResponse_(
        getManagedApplicationsBySession_(payload.session_token)
      );
    }

    if (action === "updateApplication") {
      return jsonResponse_(
        updateManagedApplication_(payload.session_token, payload)
      );
    }

    if (action === "cancelApplication") {
      return jsonResponse_(
        cancelManagedApplication_(payload.session_token, payload.application_id)
      );
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

  if (sheet.getMaxColumns() < BENEFITS_HEADERS.length) {
    sheet.insertColumnsAfter(
      sheet.getMaxColumns(),
      BENEFITS_HEADERS.length - sheet.getMaxColumns()
    );
  }

  const headerRange = sheet.getRange(1, 1, 1, BENEFITS_HEADERS.length);
  const currentHeaders = headerRange.getValues()[0].map(String);
  const hasExistingHeaders = currentHeaders.some((value) => value.trim());
  const legacyHeaders = BENEFITS_HEADERS.slice(0, 16);
  const hasLegacyHeaders =
    currentHeaders.slice(0, legacyHeaders.length).join("|") ===
      legacyHeaders.join("|") &&
    currentHeaders.slice(legacyHeaders.length).every((value) => !value.trim());
  const hasCurrentHeaders =
    currentHeaders.join("|") === BENEFITS_HEADERS.join("|");
  const previousCertificateHeaders = BENEFITS_HEADERS.map((header) =>
    header === "student_id" ? "birth_date" : header
  );
  const hasPreviousCertificateHeaders =
    currentHeaders.join("|") === previousCertificateHeaders.join("|");

  if (
    hasExistingHeaders &&
    !hasLegacyHeaders &&
    !hasCurrentHeaders &&
    !hasPreviousCertificateHeaders
  ) {
    throw new Error(
      "benefits 시트의 헤더 구조가 예상과 다릅니다. 첫 행을 확인해주세요."
    );
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
    140, 130, 170, 145, 145, 165, 165, 250,
    220, 130, 260, 240, 190, 220, 165,
    260, 240, 190, 220, 165
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
    "basic_certificate_issued_at",
    "intermediate_certificate_issued_at",
    "scholarship_apply_start",
    "scholarship_apply_end",
    "scholarship_applied_at",
    "updated_at"
  ].forEach((header) => {
    const column = BENEFITS_HEADERS.indexOf(header) + 1;
    sheet.getRange(2, column, editableRows, 1).setNumberFormat("yyyy-mm-dd hh:mm");
  });

  sheet
    .getRange(2, BENEFITS_HEADERS.indexOf("student_id") + 1, editableRows, 1)
    .setNumberFormat("@");

  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet
    .getRange(1, 1, sheet.getMaxRows(), BENEFITS_HEADERS.length)
    .createFilter();

  setupScholarshipApplicationsSheet_(spreadsheet);
  setupCertificateIssuanceLogSheet_(spreadsheet);
  setupApplicationSheets();
  const uploadFolder = getScholarshipUploadFolder_();
  const certificateFolder = getCertificateOutputFolder_();
  return `설정 완료: ${spreadsheet.getName()} / 학생지원·이수증·장학금 탭 / 별도 경진대회·초급과정 접수 관리대장 / ${uploadFolder.name} / ${certificateFolder.name}`;
}

/** 별도 경진대회·초급과정 접수 관리대장의 탭과 편집 트리거를 설정합니다. */
function setupApplicationSheets() {
  const spreadsheet = getApplicationSpreadsheet_();
  setupIdeaContestSheets_(spreadsheet);
  setupProgramApplicationsSheet_(spreadsheet);
  setupApplicationChangeLogSheet_(spreadsheet);
  ensureApplicationEditTrigger_(spreadsheet);
  return `설정 완료: ${spreadsheet.getName()} / 경진대회·초급과정 접수 탭`;
}

function setupApplicationChangeLogSheet_(spreadsheet) {
  const sheet = prepareApplicationSheet_(
    spreadsheet,
    BENEFITS_CONFIG.APPLICATION_CHANGE_LOG_SHEET_NAME,
    APPLICATION_CHANGE_LOG_HEADERS,
    [170, 200, 150, 220, 110, 320, 130, 130]
  );
  const rows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet.getRange(2, 1, rows, 1).setNumberFormat("yyyy-mm-dd hh:mm");
  return sheet;
}

function ensureApplicationEditTrigger_(spreadsheet) {
  const handlerName = "onApplicationSpreadsheetEdit";
  const spreadsheetId = spreadsheet.getId();
  const exists = ScriptApp.getProjectTriggers().some((trigger) =>
    trigger.getHandlerFunction() === handlerName &&
    trigger.getTriggerSourceId() === spreadsheetId
  );
  if (!exists) {
    ScriptApp.newTrigger(handlerName)
      .forSpreadsheet(spreadsheet)
      .onEdit()
      .create();
  }
}

function setupCertificateIssuanceLogSheet_(spreadsheet) {
  const sheet = prepareApplicationSheet_(
    spreadsheet,
    BENEFITS_CONFIG.CERTIFICATE_LOG_SHEET_NAME,
    CERTIFICATE_ISSUANCE_HEADERS,
    [165, 190, 220, 120, 100, 280, 240, 220, 220, 220, 260, 130, 260]
  );
  const rows = Math.max(sheet.getMaxRows() - 1, 1);
  const headerMap = getHeaderMap_(CERTIFICATE_ISSUANCE_HEADERS);
  sheet
    .getRange(2, headerMap.issued_at + 1, rows, 1)
    .setNumberFormat("yyyy-mm-dd hh:mm");
  setSheetListValidation_(
    sheet,
    CERTIFICATE_ISSUANCE_HEADERS,
    "status",
    ["발급완료", "폐기"],
    rows
  );
  return sheet;
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

function setupIdeaContestSheets_(spreadsheet) {
  const teamSheet = prepareApplicationSheet_(
    spreadsheet,
    BENEFITS_CONFIG.IDEA_CONTEST_TEAM_SHEET_NAME,
    IDEA_CONTEST_TEAM_HEADERS,
    [170, 190, 160, 130, 170, 180, 150, 210, 320, 110, 130, 160, 150, 160, 260, 420],
    [IDEA_CONTEST_TEAM_HEADERS.slice(0, -1)]
  );
  const memberSheet = prepareApplicationSheet_(
    spreadsheet,
    BENEFITS_CONFIG.IDEA_CONTEST_MEMBER_SHEET_NAME,
    IDEA_CONTEST_MEMBER_HEADERS,
    [190, 160, 100, 120, 140, 180, 150, 210, 190],
    [IDEA_CONTEST_MEMBER_HEADERS.slice(0, -1)]
  );
  const individualSheet = prepareApplicationSheet_(
    spreadsheet,
    BENEFITS_CONFIG.IDEA_CONTEST_INDIVIDUAL_SHEET_NAME,
    IDEA_CONTEST_INDIVIDUAL_HEADERS,
    [170, 190, 120, 140, 180, 150, 210, 130, 160, 160, 180, 260, 190, 320],
    [
      IDEA_CONTEST_INDIVIDUAL_HEADERS.slice(0, -1),
      IDEA_CONTEST_INDIVIDUAL_HEADERS.slice(0, -2)
    ]
  );

  const teamRows = Math.max(teamSheet.getMaxRows() - 1, 1);
  const teamMap = getHeaderMap_(IDEA_CONTEST_TEAM_HEADERS);
  ["representative_student_id", "representative_phone"].forEach((header) => {
    teamSheet.getRange(2, teamMap[header] + 1, teamRows, 1).setNumberFormat("@");
  });
  ["submitted_at", "reviewed_at"].forEach((header) => {
    teamSheet.getRange(2, teamMap[header] + 1, teamRows, 1).setNumberFormat("yyyy-mm-dd hh:mm");
  });
  setSheetListValidation_(
    teamSheet,
    IDEA_CONTEST_TEAM_HEADERS,
    "application_status",
    ["접수", "검토중", "최종참가확정", "반려", "취소"],
    teamRows
  );

  const memberRows = Math.max(memberSheet.getMaxRows() - 1, 1);
  ["student_id", "phone"].forEach((header) => {
    const column = IDEA_CONTEST_MEMBER_HEADERS.indexOf(header) + 1;
    memberSheet.getRange(2, column, memberRows, 1).setNumberFormat("@");
  });
  setSheetListValidation_(memberSheet, IDEA_CONTEST_MEMBER_HEADERS, "member_role", ["대표자", "팀원"], memberRows);
  setSheetListValidation_(
    memberSheet,
    IDEA_CONTEST_MEMBER_HEADERS,
    "defense_industry_course_status",
    DEFENSE_INDUSTRY_COURSE_STATUS_OPTIONS,
    memberRows
  );

  const individualRows = Math.max(individualSheet.getMaxRows() - 1, 1);
  const individualMap = getHeaderMap_(IDEA_CONTEST_INDIVIDUAL_HEADERS);
  ["student_id", "phone"].forEach((header) => {
    individualSheet.getRange(2, individualMap[header] + 1, individualRows, 1).setNumberFormat("@");
  });
  ["submitted_at", "reviewed_at"].forEach((header) => {
    individualSheet
      .getRange(2, individualMap[header] + 1, individualRows, 1)
      .setNumberFormat("yyyy-mm-dd hh:mm");
  });
  setSheetListValidation_(
    individualSheet,
    IDEA_CONTEST_INDIVIDUAL_HEADERS,
    "application_status",
    ["접수", "매칭검토중", "팀매칭완료", "취소"],
    individualRows
  );
  setSheetListValidation_(
    individualSheet,
    IDEA_CONTEST_INDIVIDUAL_HEADERS,
    "defense_industry_course_status",
    DEFENSE_INDUSTRY_COURSE_STATUS_OPTIONS,
    individualRows
  );
  return { teamSheet, memberSheet, individualSheet };
}

/**
 * 실제 홈페이지 접수는 닫아둔 채 로컬 실전 테스트에 사용할 임시 키를 생성합니다.
 * 실행 로그에 표시된 키를 로컬 URL의 testKey 값으로 사용하세요.
 */
function createApplicationTestKey() {
  const testKey =
    Utilities.getUuid().replace(/-/g, "") +
    Utilities.getUuid().replace(/-/g, "");
  PropertiesService.getScriptProperties().setProperty(
    "APPLICATION_TEST_KEY",
    testKey
  );
  console.log(`로컬 접수 테스트 키: ${testKey}`);
  return testKey;
}

/** 로컬 실전 테스트가 끝난 뒤 실행하여 임시 키를 폐기합니다. */
function clearApplicationTestKey() {
  PropertiesService.getScriptProperties().deleteProperty(
    "APPLICATION_TEST_KEY"
  );
  console.log("로컬 접수 테스트 키를 삭제했습니다.");
  return true;
}

function setupProgramApplicationsSheet_(spreadsheet) {
  const sheet = prepareApplicationSheet_(
    spreadsheet,
    BENEFITS_CONFIG.PROGRAM_APPLICATION_SHEET_NAME,
    PROGRAM_APPLICATION_HEADERS,
    [170, 190, 280, 140, 120, 150, 210, 120, 150, 180, 130, 110, 130, 140, 140, 280, 280, 180, 220, 130, 150, 160, 260]
  );
  const rows = Math.max(sheet.getMaxRows() - 1, 1);
  const headerMap = getHeaderMap_(PROGRAM_APPLICATION_HEADERS);
  ["student_id", "phone", "birth_date", "admission_month", "graduation_month"].forEach((header) => {
    sheet.getRange(2, headerMap[header] + 1, rows, 1).setNumberFormat("@");
  });
  ["submitted_at", "reviewed_at"].forEach((header) => {
    sheet.getRange(2, headerMap[header] + 1, rows, 1).setNumberFormat("yyyy-mm-dd hh:mm");
  });
  setSheetListValidation_(sheet, PROGRAM_APPLICATION_HEADERS, "program", BEGINNER_PROGRAMS, rows);
  setSheetListValidation_(sheet, PROGRAM_APPLICATION_HEADERS, "gender", GENDER_OPTIONS, rows);
  setSheetListValidation_(sheet, PROGRAM_APPLICATION_HEADERS, "major_field", MAJOR_FIELD_OPTIONS, rows);
  setSheetListValidation_(sheet, PROGRAM_APPLICATION_HEADERS, "course_years", COURSE_YEAR_OPTIONS, rows);
  setSheetListValidation_(sheet, PROGRAM_APPLICATION_HEADERS, "preferred_ai_service", AI_SERVICE_OPTIONS, rows);
  setSheetListValidation_(
    sheet,
    PROGRAM_APPLICATION_HEADERS,
    "application_status",
    ["접수", "검토중", "승인", "반려", "취소"],
    rows
  );
  return sheet;
}

function prepareApplicationSheet_(spreadsheet, sheetName, headers, widths, compatibleHeaderSets) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }
  if (sheet.getMaxColumns() < headers.length) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), headers.length - sheet.getMaxColumns());
  }

  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  const currentHeaders = headerRange.getValues()[0].map(String);
  const hasExistingHeaders = currentHeaders.some((value) => value.trim());
  const hasCompatibleHeaders = (compatibleHeaderSets || []).some((compatibleHeaders) =>
    currentHeaders.slice(0, compatibleHeaders.length).join("|") ===
      compatibleHeaders.join("|") &&
    currentHeaders.slice(compatibleHeaders.length).every((value) => !value.trim())
  );
  if (
    hasExistingHeaders &&
    currentHeaders.join("|") !== headers.join("|") &&
    !hasCompatibleHeaders
  ) {
    throw new Error(`${sheetName} 시트의 첫 행 구조가 다릅니다. 헤더를 확인해주세요.`);
  }

  headerRange.setValues([headers]);
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
  widths.forEach((width, index) => sheet.setColumnWidth(index + 1, width));
  if (!sheet.getFilter()) {
    sheet.getRange(1, 1, sheet.getMaxRows(), headers.length).createFilter();
  }
  return sheet;
}

function setSheetListValidation_(sheet, headers, header, values, rowCount) {
  const column = headers.indexOf(header) + 1;
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
  sheet.getRange(2, column, rowCount, 1).setDataValidation(rule);
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

  const smokeValues = {
    name: "스모크 테스트",
    affiliation: "전북대학교 테스트학과",
    student_id: "202600001",
    basic_completion_status: "이수",
    basic_course_name: "방산AI부트캠프사업단 초급프로그램",
    basic_course_period: "2026. 06. 29. ~ 07. 17. (총 40시간)",
    intermediate_completion_status: "심사중",
    scholarship_eligibility: "대상",
    scholarship_application_status: "신청 전",
    scholarship_apply_start: "",
    scholarship_apply_end: "",
    internal_note: "외부 응답에 포함되면 안 되는 테스트 메모"
  };
  const benefits = toPublicBenefits_(smokeValues);
  const applicationsSheet = getScholarshipApplicationsSheet_();
  const applicationHeaders = applicationsSheet
    .getRange(1, 1, 1, SCHOLARSHIP_APPLICATION_HEADERS.length)
    .getValues()[0]
    .map(String);
  const contestTeamHeaders = getIdeaContestTeamSheet_()
    .getRange(1, 1, 1, IDEA_CONTEST_TEAM_HEADERS.length)
    .getValues()[0]
    .map(String);
  const contestMemberHeaders = getIdeaContestMemberSheet_()
    .getRange(1, 1, 1, IDEA_CONTEST_MEMBER_HEADERS.length)
    .getValues()[0]
    .map(String);
  const contestTeamHeaderMap = getHeaderMap_(contestTeamHeaders);
  const contestTeamPhoneFormat = getIdeaContestTeamSheet_()
    .getRange(2, contestTeamHeaderMap.representative_phone + 1)
    .getNumberFormat();
  const contestTeamStudentIdFormat = getIdeaContestTeamSheet_()
    .getRange(2, contestTeamHeaderMap.representative_student_id + 1)
    .getNumberFormat();
  const contestIndividualHeaders = getIdeaContestIndividualSheet_()
    .getRange(1, 1, 1, IDEA_CONTEST_INDIVIDUAL_HEADERS.length)
    .getValues()[0]
    .map(String);
  const programApplicationHeaders = getProgramApplicationsSheet_()
    .getRange(1, 1, 1, PROGRAM_APPLICATION_HEADERS.length)
    .getValues()[0]
    .map(String);
  const applicationChangeLogHeaders = getApplicationChangeLogSheet_()
    .getRange(1, 1, 1, APPLICATION_CHANGE_LOG_HEADERS.length)
    .getValues()[0]
    .map(String);
  const certificateLogHeaders = getCertificateIssuanceLogSheet_()
    .getRange(1, 1, 1, CERTIFICATE_ISSUANCE_HEADERS.length)
    .getValues()[0]
    .map(String);
  const uploadFolder = getScholarshipUploadFolder_();
  const certificateFolder = getCertificateOutputFolder_();
  const templateCheck = validateCertificateTemplate_();
  const expectedCanApply =
    BENEFITS_CONFIG.SCHOLARSHIP_APPLICATIONS_OPEN &&
    normalizeText_(smokeValues.scholarship_eligibility) === "대상" &&
    !isScholarshipSubmitted_(smokeValues.scholarship_application_status) &&
    isScholarshipWindowOpen_(smokeValues);
  const checks = {
    public_name_present: Boolean(benefits.name && benefits.name !== "학생"),
    basic_completion_status_valid: ["심사중", "이수", "미이수"].includes(
      benefits.basic.status
    ),
    basic_certificate_can_issue: benefits.basic.can_issue === true,
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
    idea_contest_team_sheet_ready:
      contestTeamHeaders.join("|") === IDEA_CONTEST_TEAM_HEADERS.join("|"),
    idea_contest_team_identity_text_format:
      contestTeamPhoneFormat === "@" && contestTeamStudentIdFormat === "@",
    idea_contest_member_sheet_ready:
      contestMemberHeaders.join("|") === IDEA_CONTEST_MEMBER_HEADERS.join("|"),
    idea_contest_individual_sheet_ready:
      contestIndividualHeaders.join("|") ===
      IDEA_CONTEST_INDIVIDUAL_HEADERS.join("|"),
    program_application_sheet_ready:
      programApplicationHeaders.join("|") === PROGRAM_APPLICATION_HEADERS.join("|"),
    application_change_log_sheet_ready:
      applicationChangeLogHeaders.join("|") ===
      APPLICATION_CHANGE_LOG_HEADERS.join("|"),
    certificate_log_sheet_ready:
      certificateLogHeaders.join("|") ===
      CERTIFICATE_ISSUANCE_HEADERS.join("|"),
    certificate_template_ready: templateCheck.missing.length === 0,
    upload_folder_ready:
      uploadFolder.id ===
      PropertiesService.getScriptProperties().getProperty("SCHOLARSHIP_UPLOAD_FOLDER_ID"),
    certificate_folder_ready:
      certificateFolder.id ===
      PropertiesService.getScriptProperties().getProperty("CERTIFICATE_OUTPUT_FOLDER_ID")
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

  if (sheet.getName() === BENEFITS_CONFIG.IDEA_CONTEST_TEAM_SHEET_NAME) {
    handleApplicationReviewEdit_(e, IDEA_CONTEST_TEAM_HEADERS);
    return;
  }

  if (sheet.getName() === BENEFITS_CONFIG.IDEA_CONTEST_INDIVIDUAL_SHEET_NAME) {
    handleApplicationReviewEdit_(e, IDEA_CONTEST_INDIVIDUAL_HEADERS);
    return;
  }

  if (sheet.getName() === BENEFITS_CONFIG.PROGRAM_APPLICATION_SHEET_NAME) {
    handleApplicationReviewEdit_(e, PROGRAM_APPLICATION_HEADERS);
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

function handleApplicationReviewEdit_(e, headers) {
  const headerMap = getHeaderMap_(headers);
  const statusColumn = headerMap.application_status + 1;
  const firstColumn = e.range.getColumn();
  const lastColumn = firstColumn + e.range.getNumColumns() - 1;
  if (firstColumn > statusColumn || lastColumn < statusColumn) return;

  const rowCount = e.range.getNumRows();
  e.range
    .getSheet()
    .getRange(e.range.getRow(), headerMap.reviewed_at + 1, rowCount, 1)
    .setValues(Array.from({ length: rowCount }, () => [new Date()]));
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

function issueCertificate_(sessionTokenValue, levelValue) {
  const email = getSessionEmail_(sessionTokenValue);
  const levelConfig = getCertificateLevelConfig_(levelValue);
  const issueResult = issueCertificateForRecord_(email, levelConfig.level, null);
  const record = findBenefitRecordByEmail_(email);
  if (!record) {
    throwPublicError_("session_expired", "인증 시간이 만료되었습니다.");
  }

  const certificateNumber = displayValue_(
    record.values[levelConfig.numberHeader],
    issueResult.certificate.number
  );
  const download = buildCertificateDownloadPayload_(
    record.values[levelConfig.fileIdHeader],
    certificateNumber,
    record.values.name
  );

  return {
    result: "success",
    reused: issueResult.reused,
    certificate: {
      level: levelConfig.level,
      number: certificateNumber,
      file_name: download.fileName,
      mime_type: download.mimeType,
      byte_size: download.byteSize,
      base64: download.base64
    },
    benefits: toPublicBenefits_(record.values)
  };
}

/**
 * 사업단이 이메일 인증 없이 시트의 특정 행을 직접 발급하는 전용 함수입니다.
 * 위 ADMIN_CERTIFICATE_ISSUE의 ROW_NUMBER와 LEVEL을 수정한 뒤,
 * Apps Script 함수 목록에서 이 함수를 선택해 실행하세요.
 */
function issueCertificateForAdmin() {
  const rowNumber = Number(ADMIN_CERTIFICATE_ISSUE.ROW_NUMBER);
  if (!Number.isInteger(rowNumber) || rowNumber < 2) {
    throw new Error("발급할 학생의 benefits 시트 행 번호를 2 이상으로 입력해주세요.");
  }

  const level = normalizeAdminCertificateLevel_(ADMIN_CERTIFICATE_ISSUE.LEVEL);
  const record = findBenefitRecordByRow_(rowNumber);
  if (!record) {
    throw new Error(`benefits 시트 ${rowNumber}행에 발급할 학생 정보가 없습니다.`);
  }

  const email = normalizeEmail_(record.values.email);
  if (!isValidEmail_(email)) {
    throw new Error(`benefits 시트 ${rowNumber}행의 email을 확인해주세요.`);
  }

  const result = issueCertificateForRecord_(email, level, rowNumber);
  const actionText = result.reused ? "기존 PDF 확인" : "새 PDF 발급";
  const message = `${rowNumber}행 ${getCertificateLevelConfig_(level).label} 이수증 ${actionText} 완료: ${result.certificate.number}`;
  console.log(`${message}\n${result.certificate.url}`);
  getBenefitsSpreadsheet_().toast(message, "이수증 발급", 8);
  return result;
}

/**
 * ADMIN_CERTIFICATE_ISSUE_LIST의 이수증을 사업단 보관용으로 일괄 발급합니다.
 * 학생에게 Drive 공유 권한이나 이메일 알림을 보내지 않습니다.
 * 이미 발급된 PDF가 있으면 기존 PDF를 재사용합니다.
 */
function issueCertificatesForAdmin() {
  const summary = {
    newlyIssued: 0,
    reused: 0,
    failed: 0,
    failures: []
  };

  ADMIN_CERTIFICATE_ISSUE_LIST.forEach((item) => {
    const rowNumber = Number(item.ROW_NUMBER);

    try {
      if (!Number.isInteger(rowNumber) || rowNumber < 2) {
        throw new Error("행 번호는 2 이상의 정수여야 합니다.");
      }

      const level = normalizeAdminCertificateLevel_(item.LEVEL);
      const record = findBenefitRecordByRow_(rowNumber);
      if (!record) {
        throw new Error(`benefits 시트 ${rowNumber}행에 학생 정보가 없습니다.`);
      }

      const email = normalizeEmail_(record.values.email);
      if (!isValidEmail_(email)) {
        throw new Error(`benefits 시트 ${rowNumber}행의 email을 확인해주세요.`);
      }

      const result = issueCertificateForRecord_(email, level, rowNumber);
      if (result.reused) {
        summary.reused += 1;
      } else {
        summary.newlyIssued += 1;
      }

      console.log(
        `${rowNumber}행 발급 완료: ${result.certificate.number}` +
          ` (${result.reused ? "기존 PDF 재사용" : "새 PDF 발급"})`
      );
    } catch (error) {
      const message = error && error.message ? error.message : String(error);
      summary.failed += 1;
      summary.failures.push({ rowNumber, message });
      console.error(`${rowNumber}행 발급 실패: ${message}`);
    }
  });

  const succeeded = summary.newlyIssued + summary.reused;
  const message =
    `중급 이수증 일괄 발급 완료: 성공 ${succeeded}명` +
    ` (신규 ${summary.newlyIssued}명, 기존 ${summary.reused}명), ` +
    `실패 ${summary.failed}명`;

  console.log(message);
  if (summary.failures.length) {
    console.log(`실패 내역: ${JSON.stringify(summary.failures)}`);
  }
  getBenefitsSpreadsheet_().toast(message, "이수증 일괄 발급", 10);
  return summary;
}

function normalizeAdminCertificateLevel_(levelValue) {
  const level = String(levelValue || "").trim().toLowerCase();
  const aliases = {
    "초급": "basic",
    basic: "basic",
    "중급": "intermediate",
    intermediate: "intermediate"
  };
  if (!aliases[level]) {
    throw new Error('ADMIN_CERTIFICATE_ISSUE.LEVEL에 "초급" 또는 "중급"을 입력해주세요.');
  }
  return aliases[level];
}

function issueCertificateForRecord_(
  email,
  levelValue,
  rowNumberValue
) {
  const levelConfig = getCertificateLevelConfig_(levelValue);
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);

  let generatedFile = null;
  let benefitRecord = null;
  let previousValues = null;
  let logRowNumber = 0;

  try {
    benefitRecord = rowNumberValue
      ? findBenefitRecordByRow_(rowNumberValue)
      : findBenefitRecordByEmail_(email);
    if (!benefitRecord) {
      if (rowNumberValue) {
        throwPublicError_("certificate_not_ready", "발급할 학생 정보를 찾을 수 없습니다.");
      }
      throwPublicError_("session_expired", "인증 시간이 만료되었습니다.");
    }

    const status = normalizeText_(
      benefitRecord.values[levelConfig.statusHeader]
    );
    if (!isCompletedStatus_(status)) {
      throwPublicError_(
        "completion_not_confirmed",
        "사업단의 이수 확인이 완료된 학생만 이수증을 발급할 수 있습니다."
      );
    }

    const certificateData = getCertificateData_(
      benefitRecord.values,
      levelConfig
    );
    const existingFile = getExistingCertificateFile_(
      benefitRecord.values[levelConfig.fileIdHeader]
    );

    if (existingFile) {
      const existingUrl =
        safeHttpsUrl_(benefitRecord.values[levelConfig.urlHeader]) ||
        existingFile.webViewLink ||
        buildDriveFileUrl_(existingFile.id);
      benefitRecord.values[levelConfig.urlHeader] = existingUrl;
      return {
        result: "success",
        reused: true,
        certificate: {
          level: levelConfig.level,
          number: displayValue_(
            benefitRecord.values[levelConfig.numberHeader],
            "-"
          ),
          url: existingUrl
        },
        benefits: toPublicBenefits_(benefitRecord.values)
      };
    }

    const hadDeletedCertificate = Boolean(
      String(benefitRecord.values[levelConfig.numberHeader] || "").trim() ||
        String(benefitRecord.values[levelConfig.fileIdHeader] || "").trim() ||
        safeHttpsUrl_(benefitRecord.values[levelConfig.urlHeader])
    );
    const certificateNumber =
      normalizeSingleLine_(benefitRecord.values[levelConfig.numberHeader]) ||
      generateCertificateNumber_(levelConfig);
    const issuedAt = new Date();
    generatedFile = createCertificatePdf_({
      email,
      name: certificateData.name,
      affiliation: certificateData.affiliation,
      studentId: certificateData.studentId,
      courseName: certificateData.courseName,
      coursePeriod: certificateData.coursePeriod,
      certificateNumber,
      issuedAt
    });

    const updates = {};
    updates[levelConfig.numberHeader] = certificateNumber;
    updates[levelConfig.fileIdHeader] = generatedFile.pdfFileId;
    updates[levelConfig.urlHeader] = generatedFile.pdfUrl;
    updates[levelConfig.issuedAtHeader] = issuedAt;
    updates.updated_at = issuedAt;

    previousValues = {};
    Object.keys(updates).forEach((header) => {
      previousValues[header] = benefitRecord.values[header] || "";
    });
    setBenefitRecordValues_(benefitRecord, updates);

    const logSheet = getCertificateIssuanceLogSheet_();
    logSheet.appendRow([
      issuedAt,
      certificateNumber,
      email,
      certificateData.name,
      levelConfig.label,
      certificateData.courseName,
      certificateData.coursePeriod,
      BENEFITS_CONFIG.CERTIFICATE_TEMPLATE_ID,
      generatedFile.presentationFileId,
      generatedFile.pdfFileId,
      generatedFile.pdfUrl,
      "발급완료",
      hadDeletedCertificate ? "기존 PDF 파일 삭제·유실 후 새 PDF 생성" : ""
    ]);
    logRowNumber = logSheet.getLastRow();

    const updatedRecord = rowNumberValue
      ? findBenefitRecordByRow_(rowNumberValue)
      : findBenefitRecordByEmail_(email);
    return {
      result: "success",
      reused: false,
      certificate: {
        level: levelConfig.level,
        number: certificateNumber,
        url: generatedFile.pdfUrl
      },
      benefits: toPublicBenefits_(updatedRecord.values)
    };
  } catch (error) {
    if (benefitRecord && previousValues) {
      try {
        setBenefitRecordValues_(benefitRecord, previousValues);
      } catch (rollbackError) {
        console.error(rollbackError && rollbackError.stack ? rollbackError.stack : rollbackError);
      }
    }
    if (logRowNumber > 1) {
      try {
        getCertificateIssuanceLogSheet_().deleteRow(logRowNumber);
      } catch (rollbackError) {
        console.error(rollbackError && rollbackError.stack ? rollbackError.stack : rollbackError);
      }
    }
    if (generatedFile && generatedFile.pdfFileId) {
      trashDriveFileQuietly_(generatedFile.pdfFileId);
    }
    if (error && error.publicCode) throw error;
    console.error(error && error.stack ? error.stack : error);
    throwPublicError_(
      "certificate_generation_failed",
      "이수증 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    );
  } finally {
    lock.releaseLock();
  }
}

function getCertificateLevelConfig_(levelValue) {
  const level = String(levelValue || "").trim().toLowerCase();
  const configs = {
    basic: {
      level: "basic",
      label: "초급",
      statusHeader: "basic_completion_status",
      courseNameHeader: "basic_course_name",
      coursePeriodHeader: "basic_course_period",
      numberHeader: "basic_certificate_number",
      fileIdHeader: "basic_certificate_file_id",
      urlHeader: "basic_certificate_url",
      issuedAtHeader: "basic_certificate_issued_at"
    },
    intermediate: {
      level: "intermediate",
      label: "중급",
      statusHeader: "intermediate_completion_status",
      courseNameHeader: "intermediate_course_name",
      coursePeriodHeader: "intermediate_course_period",
      numberHeader: "intermediate_certificate_number",
      fileIdHeader: "intermediate_certificate_file_id",
      urlHeader: "intermediate_certificate_url",
      issuedAtHeader: "intermediate_certificate_issued_at"
    }
  };
  if (!configs[level]) {
    throwPublicError_("invalid_request", "이수증 과정 구분이 올바르지 않습니다.");
  }
  return configs[level];
}

function getCertificateData_(values, levelConfig) {
  const data = {
    name: normalizeSingleLine_(values.name),
    affiliation: normalizeSingleLine_(values.affiliation),
    studentId: normalizeSingleLine_(values.student_id),
    courseName: normalizeSingleLine_(values[levelConfig.courseNameHeader]),
    coursePeriod: normalizeSingleLine_(values[levelConfig.coursePeriodHeader])
  };
  const missing = [];
  if (!data.name) missing.push("성명");
  if (!data.affiliation) missing.push("소속");
  if (!data.studentId) missing.push("학번");
  if (!data.courseName) missing.push("교육과정명");
  if (!data.coursePeriod) missing.push("교육기간");
  if (missing.length) {
    throwPublicError_(
      "certificate_not_ready",
      `이수증 발급 정보가 준비되지 않았습니다: ${missing.join(", ")}`
    );
  }
  return data;
}

function createCertificatePdf_(data) {
  let presentationCopy = null;
  let pdfFile = null;

  try {
    const templateCheck = validateCertificateTemplate_();
    if (templateCheck.missing.length) {
      throwPublicError_(
        "certificate_template_missing",
        `이수증 양식 치환문구를 확인해주세요: ${templateCheck.missing.join(", ")}`
      );
    }
    const outputFolder = getCertificateOutputFolder_();
    const safeName = sanitizeDriveFileName_(data.name) || "학생";
    const baseName = `${data.certificateNumber}_${safeName}_이수증`;
    presentationCopy = Drive.Files.copy(
      {
        name: `${baseName}_생성원본`,
        parents: [outputFolder.id]
      },
      BENEFITS_CONFIG.CERTIFICATE_TEMPLATE_ID,
      { fields: "id,name,mimeType" }
    );

    const presentation = SlidesApp.openById(presentationCopy.id);
    const replacements = {
      "{{CERT_NO}}": data.certificateNumber,
      "{{NAME}}": data.name,
      "{{AFFILIATION}}": data.affiliation,
      "{{STUDENT_ID}}": data.studentId,
      "{{COURSE_NAME}}": data.courseName,
      "{{COURSE_PERIOD}}": data.coursePeriod,
      "{{ISSUE_DATE_KR}}": formatKoreanIssueDate_(data.issuedAt)
    };
    presentation.getSlides().forEach((slide) => {
      Object.keys(replacements).forEach((token) => {
        slide.replaceAllText(token, replacements[token]);
      });
    });
    presentation.saveAndClose();

    const pdfBlob = DriveApp.getFileById(presentationCopy.id)
      .getAs(MimeType.PDF)
      .setName(`${baseName}.pdf`);
    pdfFile = Drive.Files.create(
      {
        name: `${baseName}.pdf`,
        parents: [outputFolder.id],
        mimeType: MimeType.PDF,
        description: `학생 이수증 / 발급번호 ${data.certificateNumber}`,
        appProperties: {
          certificateNumber: data.certificateNumber,
          studentEmail: data.email
        }
      },
      pdfBlob,
      { fields: "id,name,mimeType,webViewLink" }
    );
    return {
      presentationFileId: presentationCopy.id,
      pdfFileId: pdfFile.id,
      pdfUrl: pdfFile.webViewLink || buildDriveFileUrl_(pdfFile.id)
    };
  } catch (error) {
    if (pdfFile) trashDriveFileQuietly_(pdfFile.id);
    throw error;
  } finally {
    if (presentationCopy) trashDriveFileQuietly_(presentationCopy.id);
  }
}

function validateCertificateTemplate_() {
  const requiredTokens = [
    "{{CERT_NO}}",
    "{{NAME}}",
    "{{AFFILIATION}}",
    "{{STUDENT_ID}}",
    "{{COURSE_NAME}}",
    "{{COURSE_PERIOD}}",
    "{{ISSUE_DATE_KR}}"
  ];
  let templateText = "";
  try {
    const presentation = SlidesApp.openById(
      BENEFITS_CONFIG.CERTIFICATE_TEMPLATE_ID
    );
    templateText = presentation
      .getSlides()
      .map((slide) =>
        slide
          .getShapes()
          .map((shape) => shape.getText().asString())
          .join("\n")
      )
      .join("\n");
  } catch (error) {
    throw new Error(
      `이수증 Google 슬라이드 양식에 접근할 수 없습니다: ${error.message}`
    );
  }
  return {
    template_id: BENEFITS_CONFIG.CERTIFICATE_TEMPLATE_ID,
    missing: requiredTokens.filter((token) => !templateText.includes(token))
  };
}

function generateCertificateNumber_(levelConfig) {
  const year = Utilities.formatDate(new Date(), BENEFITS_CONFIG.TIMEZONE, "yyyy");
  const prefix = `${year}-${levelConfig.label}-`;
  const pattern = new RegExp(`^${escapeRegex_(prefix)}(\\d{4})$`);
  const numbers = [];
  const logSheet = getCertificateIssuanceLogSheet_();
  const logLastRow = logSheet.getLastRow();
  if (logLastRow >= 2) {
    const logColumn = CERTIFICATE_ISSUANCE_HEADERS.indexOf("certificate_number") + 1;
    numbers.push(
      ...logSheet.getRange(2, logColumn, logLastRow - 1, 1).getValues().flat()
    );
  }

  const benefitsSheet = getBenefitsSheet_();
  const benefitsLastRow = benefitsSheet.getLastRow();
  if (benefitsLastRow >= 2) {
    ["basic_certificate_number", "intermediate_certificate_number"].forEach(
      (header) => {
        const column = BENEFITS_HEADERS.indexOf(header) + 1;
        numbers.push(
          ...benefitsSheet
            .getRange(2, column, benefitsLastRow - 1, 1)
            .getValues()
            .flat()
        );
      }
    );
  }

  const maxNumber = numbers.reduce((max, value) => {
    const match = String(value || "").trim().match(pattern);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}${String(maxNumber + 1).padStart(4, "0")}`;
}

function getExistingCertificateFile_(fileIdValue) {
  const fileId = String(fileIdValue || "").trim();
  if (!fileId) return null;
  try {
    const file = Drive.Files.get(fileId, {
      fields: "id,name,mimeType,trashed,webViewLink"
    });
    if (file.trashed || file.mimeType !== MimeType.PDF) return null;
    return file;
  } catch (error) {
    console.warn(`기존 이수증 파일을 찾지 못했습니다: ${fileId}`);
    return null;
  }
}

function buildCertificateDownloadPayload_(fileIdValue, certificateNumber, studentName) {
  const fileId = String(fileIdValue || "").trim();
  if (!fileId) {
    throwPublicError_(
      "certificate_generation_failed",
      "발급된 이수증 PDF를 찾을 수 없습니다."
    );
  }

  try {
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    const bytes = blob.getBytes();
    if (!bytes.length) {
      throwPublicError_(
        "certificate_generation_failed",
        "발급된 이수증 PDF가 비어 있습니다."
      );
    }
    if (bytes.length > BENEFITS_CONFIG.MAX_CERTIFICATE_PDF_BYTES) {
      throwPublicError_(
        "certificate_file_too_large",
        "이수증 PDF 용량이 너무 커서 홈페이지에서 전달할 수 없습니다."
      );
    }

    const safeName = sanitizeDriveFileName_(studentName) || "학생";
    const fallbackFileName = `${certificateNumber}_${safeName}_이수증.pdf`;
    return {
      fileName: sanitizeDriveFileName_(file.getName()) || fallbackFileName,
      mimeType: MimeType.PDF,
      byteSize: bytes.length,
      base64: Utilities.base64Encode(bytes)
    };
  } catch (error) {
    if (error && error.publicCode) throw error;
    console.error(error && error.stack ? error.stack : error);
    throwPublicError_(
      "certificate_generation_failed",
      "발급된 이수증 PDF를 불러오지 못했습니다."
    );
  }
}

function setBenefitRecordValues_(record, values) {
  Object.keys(values).forEach((header) => {
    if (record.headerMap[header] === undefined) {
      throw new Error(`benefits 시트 헤더 누락: ${header}`);
    }
    record.sheet
      .getRange(record.rowNumber, record.headerMap[header] + 1)
      .setValue(values[header]);
    record.values[header] = values[header];
  });
}

function formatKoreanIssueDate_(value) {
  return Utilities.formatDate(
    value,
    BENEFITS_CONFIG.TIMEZONE,
    "yyyy년 M월 d일"
  );
}

function buildDriveFileUrl_(fileId) {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

function sanitizeDriveFileName_(value) {
  return normalizeSingleLine_(value)
    .replace(/[\\/:*?"<>|]+/g, "_")
    .slice(0, 80);
}

function escapeRegex_(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isCompletedStatus_(statusValue) {
  return ["이수", "이수완료"].includes(normalizeText_(statusValue));
}

function trashDriveFileQuietly_(fileId) {
  try {
    Drive.Files.update({ trashed: true }, fileId, null, {
      fields: "id,trashed"
    });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
  }
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

function submitIdeaContestApplication_(payloadValue) {
  const payload = payloadValue || {};
  rejectBotSubmission_(payload);
  if (payload.privacy_consent !== true || payload.security_ethics_pledge !== true) {
    throwPublicError_("consent_required", "개인정보 수집·이용 동의와 보안·윤리 서약이 필요합니다.");
  }

  const teamName = validateTextField_(payload.team_name, "팀명", 2, 60);
  const ideaTopic = validateTextField_(payload.idea_topic, "아이디어 주제", 10, 600);
  const representative = validateContestParticipant_(payload.representative, "대표자");
  const memberValues = Array.isArray(payload.members) ? payload.members : [];
  if (memberValues.length < 2 || memberValues.length > 4) {
    throwPublicError_("invalid_team", "대표자를 포함하여 3~5명으로 팀을 구성해주세요.");
  }
  const members = memberValues.map((member, index) =>
    validateContestParticipant_(member, `팀원 ${index + 1}`)
  );
  const participants = [representative].concat(members);
  validateUniqueParticipants_(participants);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let teamSheet = null;
  let memberSheet = null;
  let teamRow = 0;
  let memberStartRow = 0;
  let applicationId = "";
  try {
    if (findIdeaContestApplication_(representative.email, teamName)) {
      throwPublicError_("duplicate", "이미 접수된 대표자 이메일 또는 팀명입니다.");
    }
    if (findActiveIdeaContestParticipantConflict_(participants, "")) {
      throwPublicError_(
        "duplicate",
        "대표자 또는 팀원 중 이미 다른 팀에 접수된 학생이 있습니다."
      );
    }

    const now = new Date();
    applicationId = createPublicApplicationId_("IDEA", now);
    teamSheet = getIdeaContestTeamSheet_();
    memberSheet = getIdeaContestMemberSheet_();

    teamRow = teamSheet.getLastRow() + 1;
    teamSheet.getRange(teamRow, 1, 1, IDEA_CONTEST_TEAM_HEADERS.length).setValues([[
      now,
      applicationId,
      teamName,
      representative.name,
      representative.studentId,
      representative.department,
      representative.phone,
      representative.email,
      ideaTopic,
      participants.length,
      "동의",
      "동의",
      "접수",
      "",
      "",
      formatDefenseIndustryCourseSummary_(participants)
    ]]);

    const participantRows = participants.map((participant, index) => [
      applicationId,
      teamName,
      index === 0 ? "대표자" : "팀원",
      participant.name,
      participant.studentId,
      participant.department,
      participant.phone,
      participant.email,
      participant.defenseIndustryCourseStatus
    ]);
    memberStartRow = memberSheet.getLastRow() + 1;
    memberSheet
      .getRange(memberStartRow, 1, participantRows.length, IDEA_CONTEST_MEMBER_HEADERS.length)
      .setValues(participantRows);

    try {
      sendIdeaContestConfirmation_(representative.email, representative.name, {
        applicationId,
        teamName,
        memberCount: participants.length,
        ideaTopic,
        submittedAt: now
      });
    } catch (mailError) {
      console.error(mailError && mailError.stack ? mailError.stack : mailError);
    }

    return {
      result: "success",
      application_id: applicationId,
      team_name: teamName,
      application_status: "접수",
      submitted_at: formatDate_(now, "yyyy-MM-dd HH:mm")
    };
  } catch (error) {
    rollbackApplicationRows_(memberSheet, memberStartRow, participants.length, applicationId, 1);
    rollbackApplicationRows_(teamSheet, teamRow, 1, applicationId, 2);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

/** 별도 접수 관리대장에서 실행되는 설치형 편집 트리거입니다. */
function onApplicationSpreadsheetEdit(e) {
  onEdit(e);
}

function submitIdeaContestIndividualApplication_(payloadValue) {
  const payload = payloadValue || {};
  rejectBotSubmission_(payload);
  if (payload.privacy_consent !== true) {
    throwPublicError_("consent_required", "개인정보 수집·이용 동의가 필요합니다.");
  }

  const applicant = validateContestParticipant_(payload.applicant, "신청자");
  const ideaInterestFields = validateIdeaInterestFields_(payload.idea_interest_fields);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let sheet = null;
  let rowNumber = 0;
  let applicationId = "";
  try {
    if (findIdeaContestIndividualApplication_(applicant.email, applicant.studentId)) {
      throwPublicError_("duplicate", "이미 팀 매칭을 신청하셨습니다.");
    }

    const now = new Date();
    applicationId = createPublicApplicationId_("MATCH", now);
    sheet = getIdeaContestIndividualSheet_();
    rowNumber = sheet.getLastRow() + 1;
    sheet
      .getRange(rowNumber, 1, 1, IDEA_CONTEST_INDIVIDUAL_HEADERS.length)
      .setValues([[
        now,
        applicationId,
        applicant.name,
        applicant.studentId,
        applicant.department,
        applicant.phone,
        applicant.email,
        "동의",
        "접수",
        "",
        "",
        "",
        applicant.defenseIndustryCourseStatus,
        ideaInterestFields.join(", ")
      ]]);

    try {
      sendIdeaContestIndividualConfirmation_(applicant.email, applicant.name, {
        applicationId,
        ideaInterestFields,
        submittedAt: now
      });
    } catch (mailError) {
      console.error(mailError && mailError.stack ? mailError.stack : mailError);
    }

    return {
      result: "success",
      application_id: applicationId,
      application_type: "individual_matching",
      application_status: "접수",
      submitted_at: formatDate_(now, "yyyy-MM-dd HH:mm")
    };
  } catch (error) {
    rollbackApplicationRows_(sheet, rowNumber, 1, applicationId, 2);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function ensureApplicationsOpen_(payloadValue) {
  if (BENEFITS_CONFIG.APPLICATIONS_OPEN) return;

  const payload = payloadValue || {};
  const configuredTestKey = String(
    PropertiesService.getScriptProperties().getProperty(
      "APPLICATION_TEST_KEY"
    ) || ""
  );
  const suppliedTestKey = String(payload.test_key || "");
  const validTestRequest =
    payload.test_mode === true &&
    configuredTestKey.length >= 20 &&
    suppliedTestKey.length >= 20 &&
    hashKey_(configuredTestKey) === hashKey_(suppliedTestKey);
  if (validTestRequest) return;

  throwPublicError_(
    "applications_not_open",
    "현재 모집예정 상태입니다. 접수 일정 확정 후 신청해주세요."
  );
}

function ensureScholarshipApplicationsOpen_() {
  if (!BENEFITS_CONFIG.SCHOLARSHIP_APPLICATIONS_OPEN) {
    throwPublicError_(
      "scholarship_applications_closed",
      "현재 장학금 접수 준비 중입니다."
    );
  }
}

function submitProgramApplication_(payloadValue) {
  const payload = payloadValue || {};
  rejectBotSubmission_(payload);
  if (payload.privacy_consent !== true) {
    throwPublicError_("consent_required", "개인정보 수집·이용 동의가 필요합니다.");
  }

  const program = normalizeSingleLine_(payload.program);
  if (!BEGINNER_PROGRAMS.includes(program)) {
    throwPublicError_("invalid_program", "신청 가능한 초급과정을 확인해주세요.");
  }
  const applicant = validateApplicant_(payload.applicant, "신청자");
  const motivation = validateTextField_(payload.application_motivation, "수강 목적", 10, 1000);
  const aiExperience = validateOptionalTextField_(payload.ai_experience, "AI 활용 경험", 1000);
  const aiSupport = validateAiSupport_(payload, "신청자");

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  let sheet = null;
  let rowNumber = 0;
  let applicationId = "";
  try {
    if (findProgramApplication_(program, applicant.email, applicant.studentId)) {
      throwPublicError_("duplicate", "이미 해당 초급과정에 신청하셨습니다.");
    }

    const now = new Date();
    applicationId = createPublicApplicationId_("EDU", now);
    sheet = getProgramApplicationsSheet_();
    rowNumber = sheet.getLastRow() + 1;
    sheet.getRange(rowNumber, 1, 1, PROGRAM_APPLICATION_HEADERS.length).setValues([[
      now,
      applicationId,
      program,
      applicant.studentId,
      applicant.name,
      applicant.phone,
      applicant.email,
      applicant.gender,
      applicant.university,
      applicant.department,
      applicant.majorField,
      applicant.courseYears,
      applicant.birthDate,
      applicant.admissionMonth,
      applicant.graduationMonth,
      motivation,
      aiExperience,
      aiSupport.preferredAiService,
      aiSupport.aiInvitationEmail,
      "동의",
      "접수",
      "",
      ""
    ]]);

    try {
      sendProgramApplicationConfirmation_(applicant.email, applicant.name, {
        applicationId,
        program,
        preferredAiService: aiSupport.preferredAiService,
        submittedAt: now
      });
    } catch (mailError) {
      console.error(mailError && mailError.stack ? mailError.stack : mailError);
    }

    return {
      result: "success",
      application_id: applicationId,
      program,
      application_status: "접수",
      submitted_at: formatDate_(now, "yyyy-MM-dd HH:mm")
    };
  } catch (error) {
    rollbackApplicationRows_(sheet, rowNumber, 1, applicationId, 2);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function sendApplicationVerificationCode_(emailValue) {
  const email = normalizeEmail_(emailValue);
  if (!isValidEmail_(email)) {
    throwPublicError_("invalid_request", "이메일 형식을 확인해주세요.");
  }

  const cache = CacheService.getScriptCache();
  const emailKey = hashKey_(email);
  const resendKey = `application_resend_${emailKey}`;
  const standardResponse = {
    result: "success",
    message: "신청 내역이 있는 이메일인 경우 인증번호가 발송되었습니다."
  };
  if (cache.get(resendKey)) return standardResponse;
  cache.put(resendKey, "1", BENEFITS_CONFIG.OTP_RESEND_SECONDS);

  const applications = collectManagedApplicationsByEmail_(email);
  if (!applications.length) return standardResponse;

  const code = String(Math.floor(100000 + Math.random() * 900000));
  cache.put(
    `application_otp_${emailKey}`,
    JSON.stringify({ code, attempts: 0 }),
    BENEFITS_CONFIG.OTP_TTL_SECONDS
  );
  MailApp.sendEmail({
    to: email,
    subject: "[전북대 방산 AI 부트캠프] 신청 확인 인증번호",
    body: [
      "안녕하세요.",
      "",
      `프로그램 신청 확인 인증번호는 ${code}입니다.`,
      `인증번호는 ${Math.floor(BENEFITS_CONFIG.OTP_TTL_SECONDS / 60)}분 동안 유효합니다.`,
      "",
      "본인이 요청하지 않았다면 이 메일을 무시해주세요."
    ].join("\n"),
    name: "전북대 방산 AI 부트캠프"
  });
  return standardResponse;
}

function verifyApplicationCode_(emailValue, codeValue) {
  const email = normalizeEmail_(emailValue);
  const code = String(codeValue || "").trim();
  if (!isValidEmail_(email) || !/^\d{6}$/.test(code)) {
    throwPublicError_("invalid_code", "인증번호가 올바르지 않거나 만료되었습니다.");
  }

  const cache = CacheService.getScriptCache();
  const otpKey = `application_otp_${hashKey_(email)}`;
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

  const applications = collectManagedApplicationsByEmail_(email);
  if (!applications.length) {
    cache.remove(otpKey);
    throwPublicError_("invalid_code", "인증번호가 올바르지 않거나 만료되었습니다.");
  }

  cache.remove(otpKey);
  const sessionToken =
    Utilities.getUuid().replace(/-/g, "") +
    Utilities.getUuid().replace(/-/g, "");
  cache.put(
    `application_session_${sessionToken}`,
    email,
    BENEFITS_CONFIG.SESSION_TTL_SECONDS
  );
  return {
    result: "success",
    session_token: sessionToken,
    expires_in: BENEFITS_CONFIG.SESSION_TTL_SECONDS,
    applications
  };
}

function getManagedApplicationsBySession_(sessionTokenValue) {
  const email = getApplicationSessionEmail_(sessionTokenValue);
  return {
    result: "success",
    applications: collectManagedApplicationsByEmail_(email)
  };
}

function collectManagedApplicationsByEmail_(emailValue) {
  const email = normalizeEmail_(emailValue);
  const applications = [];

  const teamSheet = getIdeaContestTeamSheet_();
  const teamData = teamSheet.getDataRange().getValues();
  if (teamData.length > 1) {
    const teamMap = getHeaderMap_(teamData[0]);
    teamData.slice(1).forEach((values) => {
      if (normalizeEmail_(values[teamMap.representative_email]) !== email) return;
      applications.push(toPublicManagedTeamApplication_(values, teamMap));
    });
  }

  const individualSheet = getIdeaContestIndividualSheet_();
  const individualData = individualSheet.getDataRange().getValues();
  if (individualData.length > 1) {
    const individualMap = getHeaderMap_(individualData[0]);
    individualData.slice(1).forEach((values) => {
      if (normalizeEmail_(values[individualMap.email]) !== email) return;
      applications.push(
        toPublicManagedIndividualApplication_(values, individualMap)
      );
    });
  }

  const programSheet = getProgramApplicationsSheet_();
  const programData = programSheet.getDataRange().getValues();
  if (programData.length > 1) {
    const programMap = getHeaderMap_(programData[0]);
    programData.slice(1).forEach((values) => {
      if (normalizeEmail_(values[programMap.email]) !== email) return;
      applications.push(toPublicManagedProgramApplication_(values, programMap));
    });
  }

  return applications.sort((a, b) =>
    String(b.submitted_at || "").localeCompare(String(a.submitted_at || ""))
  );
}

function toPublicManagedTeamApplication_(values, headerMap) {
  const applicationId = String(values[headerMap.application_id] || "").trim();
  const participants = getContestParticipants_(applicationId).map(
    toPublicContestParticipant_
  );
  const representative = participants.find((item) => item.member_role === "대표자") || {
    member_role: "대표자",
    name: String(values[headerMap.representative_name] || ""),
    student_id: String(values[headerMap.representative_student_id] || ""),
    department: String(values[headerMap.representative_department] || ""),
    phone: String(values[headerMap.representative_phone] || ""),
    email: normalizeEmail_(values[headerMap.representative_email]),
    defense_industry_course_status: ""
  };
  const status = String(values[headerMap.application_status] || "접수").trim();
  return {
    application_id: applicationId,
    application_type: "team",
    application_type_label: "경진대회 팀 신청",
    program: "2026 전북대학교 방산 AI 아이디어 경진대회",
    application_status: status,
    submitted_at: formatApplicationDate_(values[headerMap.submitted_at]),
    can_manage: status === "접수",
    data: {
      team_name: String(values[headerMap.team_name] || ""),
      idea_topic: String(values[headerMap.idea_topic] || ""),
      representative,
      members: participants.filter((item) => item.member_role !== "대표자")
    }
  };
}

function toPublicContestParticipant_(participant) {
  return {
    member_role: participant.member_role,
    name: participant.name,
    student_id: participant.student_id,
    department: participant.department,
    phone: participant.phone,
    email: participant.email,
    defense_industry_course_status:
      participant.defense_industry_course_status
  };
}

function toPublicManagedIndividualApplication_(values, headerMap) {
  const status = String(values[headerMap.application_status] || "접수").trim();
  return {
    application_id: String(values[headerMap.application_id] || "").trim(),
    application_type: "individual",
    application_type_label: "경진대회 개인 신청",
    program: "2026 전북대학교 방산 AI 아이디어 경진대회 팀 매칭",
    application_status: status,
    submitted_at: formatApplicationDate_(values[headerMap.submitted_at]),
    can_manage: status === "접수",
    data: {
      applicant: {
        name: String(values[headerMap.name] || ""),
        student_id: String(values[headerMap.student_id] || ""),
        department: String(values[headerMap.department] || ""),
        phone: String(values[headerMap.phone] || ""),
        email: normalizeEmail_(values[headerMap.email]),
        defense_industry_course_status: String(
          values[headerMap.defense_industry_course_status] || ""
        )
      },
      idea_interest_fields: String(values[headerMap.idea_interest_fields] || "")
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
    }
  };
}

function toPublicManagedProgramApplication_(values, headerMap) {
  const status = String(values[headerMap.application_status] || "접수").trim();
  return {
    application_id: String(values[headerMap.application_id] || "").trim(),
    application_type: "program",
    application_type_label: "초급과정 신청",
    program: String(values[headerMap.program] || ""),
    application_status: status,
    submitted_at: formatApplicationDate_(values[headerMap.submitted_at]),
    can_manage: status === "접수",
    data: {
      applicant: {
        student_id: String(values[headerMap.student_id] || ""),
        name: String(values[headerMap.name] || ""),
        phone: String(values[headerMap.phone] || ""),
        email: normalizeEmail_(values[headerMap.email]),
        gender: String(values[headerMap.gender] || ""),
        university: String(values[headerMap.university] || ""),
        department: String(values[headerMap.department] || ""),
        major_field: String(values[headerMap.major_field] || ""),
        course_years: String(values[headerMap.course_years] || ""),
        birth_date: formatApplicationDateValue_(values[headerMap.birth_date]),
        admission_month: formatApplicationMonthValue_(values[headerMap.admission_month]),
        graduation_month: formatApplicationMonthValue_(values[headerMap.graduation_month])
      },
      application_motivation: String(values[headerMap.application_motivation] || ""),
      ai_experience: String(values[headerMap.ai_experience] || ""),
      preferred_ai_service: String(values[headerMap.preferred_ai_service] || ""),
      ai_invitation_email: normalizeEmail_(values[headerMap.ai_invitation_email])
    }
  };
}

function getContestParticipants_(applicationId) {
  const sheet = getIdeaContestMemberSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headerMap = getHeaderMap_(data[0]);
  return data
    .slice(1)
    .map((values, index) => ({ values, rowNumber: index + 2 }))
    .filter((record) =>
      String(record.values[headerMap.application_id] || "").trim() === applicationId
    )
    .map((record) => ({
      row_number: record.rowNumber,
      member_role: String(record.values[headerMap.member_role] || ""),
      name: String(record.values[headerMap.name] || ""),
      student_id: String(record.values[headerMap.student_id] || ""),
      department: String(record.values[headerMap.department] || ""),
      phone: String(record.values[headerMap.phone] || ""),
      email: normalizeEmail_(record.values[headerMap.email]),
      defense_industry_course_status: String(
        record.values[headerMap.defense_industry_course_status] || ""
      )
    }))
    .sort((a, b) => {
      if (a.member_role === "대표자") return -1;
      if (b.member_role === "대표자") return 1;
      return a.row_number - b.row_number;
    });
}

function updateManagedApplication_(sessionTokenValue, payloadValue) {
  const email = getApplicationSessionEmail_(sessionTokenValue);
  const payload = payloadValue || {};
  const applicationId = normalizeSingleLine_(payload.application_id);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const record = findManagedApplication_(applicationId, email);
    ensureManagedApplicationEditable_(record);
    if (record.type === "team") updateManagedTeamApplication_(record, payload, email);
    if (record.type === "individual") updateManagedIndividualApplication_(record, payload, email);
    if (record.type === "program") updateManagedProgramApplication_(record, payload, email);
    appendApplicationChangeLog_(record, email, "변경", "신청자 입력정보", "접수", "접수");
    try {
      sendApplicationManagementConfirmation_(email, record, "변경");
    } catch (mailError) {
      console.error(mailError && mailError.stack ? mailError.stack : mailError);
    }
    return {
      result: "success",
      applications: collectManagedApplicationsByEmail_(email)
    };
  } finally {
    lock.releaseLock();
  }
}

function updateManagedTeamApplication_(record, payload, email) {
  const teamName = validateTextField_(payload.team_name, "팀명", 2, 60);
  const ideaTopic = validateTextField_(payload.idea_topic, "아이디어 주제", 10, 600);
  const representative = validateContestParticipant_(
    Object.assign({}, payload.representative || {}, { email }),
    "대표자"
  );
  const memberValues = Array.isArray(payload.members) ? payload.members : [];
  const existingParticipants = getContestParticipants_(record.applicationId);
  if (
    memberValues.length < 2 ||
    memberValues.length > 4 ||
    memberValues.length + 1 !== existingParticipants.length
  ) {
    throwPublicError_(
      "invalid_team",
      "온라인 변경에서는 기존 팀원 수를 유지해주세요. 팀원 수 변경은 사업단에 문의해주세요."
    );
  }
  const members = memberValues.map((value, index) =>
    validateContestParticipant_(value, `팀원 ${index + 1}`)
  );
  const participants = [representative].concat(members);
  validateUniqueParticipants_(participants);
  if (isIdeaContestTeamNameUsed_(teamName, record.applicationId)) {
    throwPublicError_("duplicate", "이미 사용 중인 팀명입니다.");
  }
  if (findActiveIdeaContestParticipantConflict_(participants, record.applicationId)) {
    throwPublicError_(
      "duplicate",
      "대표자 또는 팀원 중 이미 다른 팀에 접수된 학생이 있습니다."
    );
  }

  const values = record.values.slice();
  const map = record.headerMap;
  values[map.team_name] = teamName;
  values[map.representative_name] = representative.name;
  values[map.representative_student_id] = representative.studentId;
  values[map.representative_department] = representative.department;
  values[map.representative_phone] = representative.phone;
  values[map.idea_topic] = ideaTopic;
  values[map.member_count] = participants.length;
  values[map.defense_industry_course_summary] =
    formatDefenseIndustryCourseSummary_(participants);
  record.sheet
    .getRange(record.rowNumber, 1, 1, IDEA_CONTEST_TEAM_HEADERS.length)
    .setValues([values]);

  const memberSheet = getIdeaContestMemberSheet_();
  existingParticipants.forEach((existing, index) => {
    const participant = participants[index];
    memberSheet
      .getRange(existing.row_number, 1, 1, IDEA_CONTEST_MEMBER_HEADERS.length)
      .setValues([[
        record.applicationId,
        teamName,
        index === 0 ? "대표자" : "팀원",
        participant.name,
        participant.studentId,
        participant.department,
        participant.phone,
        participant.email,
        participant.defenseIndustryCourseStatus
      ]]);
  });
}

function updateManagedIndividualApplication_(record, payload, email) {
  const applicant = validateContestParticipant_(
    Object.assign({}, payload.applicant || {}, { email }),
    "신청자"
  );
  if (isIndividualStudentIdUsed_(applicant.studentId, record.applicationId)) {
    throwPublicError_("duplicate", "해당 학번으로 이미 개인 신청이 등록되어 있습니다.");
  }
  const interests = validateIdeaInterestFields_(payload.idea_interest_fields);
  const values = record.values.slice();
  const map = record.headerMap;
  values[map.name] = applicant.name;
  values[map.student_id] = applicant.studentId;
  values[map.department] = applicant.department;
  values[map.phone] = applicant.phone;
  values[map.defense_industry_course_status] =
    applicant.defenseIndustryCourseStatus;
  values[map.idea_interest_fields] = interests.join(", ");
  record.sheet
    .getRange(record.rowNumber, 1, 1, IDEA_CONTEST_INDIVIDUAL_HEADERS.length)
    .setValues([values]);
}

function updateManagedProgramApplication_(record, payload, email) {
  const applicant = validateApplicant_(
    Object.assign({}, payload.applicant || {}, { email }),
    "신청자"
  );
  const program = String(record.values[record.headerMap.program] || "").trim();
  if (isProgramStudentIdUsed_(program, applicant.studentId, record.applicationId)) {
    throwPublicError_("duplicate", "해당 학번으로 이미 같은 과정에 신청되어 있습니다.");
  }
  const motivation = validateTextField_(
    payload.application_motivation,
    "수강 목적",
    10,
    1000
  );
  const aiExperience = validateOptionalTextField_(
    payload.ai_experience,
    "AI 활용 경험",
    1000
  );
  const aiSupport = validateAiSupport_(payload, "신청자");
  const values = record.values.slice();
  const map = record.headerMap;
  values[map.student_id] = applicant.studentId;
  values[map.name] = applicant.name;
  values[map.phone] = applicant.phone;
  values[map.gender] = applicant.gender;
  values[map.university] = applicant.university;
  values[map.department] = applicant.department;
  values[map.major_field] = applicant.majorField;
  values[map.course_years] = applicant.courseYears;
  values[map.birth_date] = applicant.birthDate;
  values[map.admission_month] = applicant.admissionMonth;
  values[map.graduation_month] = applicant.graduationMonth;
  values[map.application_motivation] = motivation;
  values[map.ai_experience] = aiExperience;
  values[map.preferred_ai_service] = aiSupport.preferredAiService;
  values[map.ai_invitation_email] = aiSupport.aiInvitationEmail;
  record.sheet
    .getRange(record.rowNumber, 1, 1, PROGRAM_APPLICATION_HEADERS.length)
    .setValues([values]);
}

function cancelManagedApplication_(sessionTokenValue, applicationIdValue) {
  const email = getApplicationSessionEmail_(sessionTokenValue);
  const applicationId = normalizeSingleLine_(applicationIdValue);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const record = findManagedApplication_(applicationId, email);
    ensureManagedApplicationEditable_(record);
    const previousStatus = String(
      record.values[record.headerMap.application_status] || "접수"
    ).trim();
    const now = new Date();
    record.sheet
      .getRange(record.rowNumber, record.headerMap.application_status + 1)
      .setValue("취소");
    record.sheet
      .getRange(record.rowNumber, record.headerMap.reviewed_at + 1)
      .setValue(now);
    appendApplicationChangeLog_(
      record,
      email,
      "취소",
      "application_status",
      previousStatus,
      "취소"
    );
    try {
      sendApplicationManagementConfirmation_(email, record, "취소");
    } catch (mailError) {
      console.error(mailError && mailError.stack ? mailError.stack : mailError);
    }
    return {
      result: "success",
      applications: collectManagedApplicationsByEmail_(email)
    };
  } finally {
    lock.releaseLock();
  }
}

function findManagedApplication_(applicationId, email) {
  const definitions = [
    {
      type: "team",
      sheet: getIdeaContestTeamSheet_(),
      headers: IDEA_CONTEST_TEAM_HEADERS,
      emailHeader: "representative_email"
    },
    {
      type: "individual",
      sheet: getIdeaContestIndividualSheet_(),
      headers: IDEA_CONTEST_INDIVIDUAL_HEADERS,
      emailHeader: "email"
    },
    {
      type: "program",
      sheet: getProgramApplicationsSheet_(),
      headers: PROGRAM_APPLICATION_HEADERS,
      emailHeader: "email"
    }
  ];
  for (const definition of definitions) {
    const data = definition.sheet.getDataRange().getValues();
    if (data.length < 2) continue;
    const headerMap = getHeaderMap_(data[0]);
    for (let index = 1; index < data.length; index += 1) {
      if (String(data[index][headerMap.application_id] || "").trim() !== applicationId) continue;
      if (normalizeEmail_(data[index][headerMap[definition.emailHeader]]) !== email) continue;
      return {
        type: definition.type,
        applicationId,
        sheet: definition.sheet,
        rowNumber: index + 1,
        headerMap,
        values: data[index]
      };
    }
  }
  throwPublicError_("not_found", "신청 내역을 찾을 수 없습니다.");
}

function ensureManagedApplicationEditable_(record) {
  const status = String(
    record.values[record.headerMap.application_status] || ""
  ).trim();
  if (status !== "접수") {
    throwPublicError_(
      "application_locked",
      "현재 상태에서는 온라인 변경이나 취소를 할 수 없습니다."
    );
  }
}

function isIdeaContestTeamNameUsed_(teamName, excludedApplicationId) {
  const sheet = getIdeaContestTeamSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  const map = getHeaderMap_(data[0]);
  return data.slice(1).some((values) => {
    const applicationId = String(values[map.application_id] || "").trim();
    const status = String(values[map.application_status] || "").trim();
    return (
      applicationId !== excludedApplicationId &&
      status !== "취소" &&
      normalizeLookupText_(values[map.team_name]) === normalizeLookupText_(teamName)
    );
  });
}

function isIndividualStudentIdUsed_(studentId, excludedApplicationId) {
  const sheet = getIdeaContestIndividualSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  const map = getHeaderMap_(data[0]);
  return data.slice(1).some((values) => {
    const applicationId = String(values[map.application_id] || "").trim();
    const status = String(values[map.application_status] || "").trim();
    return (
      applicationId !== excludedApplicationId &&
      status !== "취소" &&
      normalizeLookupText_(values[map.student_id]) === normalizeLookupText_(studentId)
    );
  });
}

function isProgramStudentIdUsed_(program, studentId, excludedApplicationId) {
  const sheet = getProgramApplicationsSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return false;
  const map = getHeaderMap_(data[0]);
  return data.slice(1).some((values) => {
    const applicationId = String(values[map.application_id] || "").trim();
    const status = String(values[map.application_status] || "").trim();
    return (
      applicationId !== excludedApplicationId &&
      status !== "취소" &&
      String(values[map.program] || "").trim() === program &&
      normalizeLookupText_(values[map.student_id]) === normalizeLookupText_(studentId)
    );
  });
}

function appendApplicationChangeLog_(
  record,
  email,
  action,
  changedFields,
  statusBefore,
  statusAfter
) {
  getApplicationChangeLogSheet_().appendRow([
    new Date(),
    record.applicationId,
    record.type,
    email,
    action,
    changedFields,
    statusBefore,
    statusAfter
  ]);
}

function sendApplicationManagementConfirmation_(email, record, action) {
  const labels = {
    team: "경진대회 팀 신청",
    individual: "경진대회 개인 신청",
    program: "초급과정 신청"
  };
  MailApp.sendEmail({
    to: email,
    subject: `[전북대 방산 AI 부트캠프] 신청 ${action} 안내`,
    body: [
      "안녕하세요.",
      "",
      `${labels[record.type] || "프로그램 신청"}이(가) ${action} 처리되었습니다.`,
      `접수번호: ${record.applicationId}`,
      `처리 시각: ${formatDate_(new Date(), "yyyy-MM-dd HH:mm")}`,
      "",
      "본인이 처리하지 않았다면 사업단으로 문의해주세요."
    ].join("\n"),
    name: "전북대 방산 AI 부트캠프"
  });
}

function getApplicationSessionEmail_(sessionTokenValue) {
  const sessionToken = String(sessionTokenValue || "").trim();
  if (!/^[a-f0-9]{64}$/i.test(sessionToken)) {
    throwPublicError_("session_expired", "인증 시간이 만료되었습니다.");
  }
  const cache = CacheService.getScriptCache();
  const key = `application_session_${sessionToken}`;
  const email = cache.get(key);
  if (!email) {
    throwPublicError_("session_expired", "인증 시간이 만료되었습니다.");
  }
  cache.put(key, email, BENEFITS_CONFIG.SESSION_TTL_SECONDS);
  return email;
}

function formatApplicationDate_(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || "");
  return formatDate_(date, "yyyy-MM-dd HH:mm");
}

function formatApplicationDateValue_(value) {
  if (!value) return "";
  if (value instanceof Date) return formatDate_(value, "yyyy-MM-dd");
  return String(value).slice(0, 10);
}

function formatApplicationMonthValue_(value) {
  if (!value) return "";
  if (value instanceof Date) return formatDate_(value, "yyyy-MM");
  return String(value).slice(0, 7);
}

function findIdeaContestApplication_(representativeEmail, teamName) {
  const sheet = getIdeaContestTeamSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  const headerMap = getHeaderMap_(data[0]);
  for (let index = 1; index < data.length; index += 1) {
    if (String(data[index][headerMap.application_status] || "").trim() === "취소") continue;
    const sameEmail = normalizeEmail_(data[index][headerMap.representative_email]) === representativeEmail;
    const sameTeam = normalizeLookupText_(data[index][headerMap.team_name]) === normalizeLookupText_(teamName);
    if (sameEmail || sameTeam) return { rowNumber: index + 1 };
  }
  return null;
}

function findIdeaContestIndividualApplication_(email, studentId) {
  const sheet = getIdeaContestIndividualSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  const headerMap = getHeaderMap_(data[0]);
  for (let index = 1; index < data.length; index += 1) {
    if (String(data[index][headerMap.application_status] || "").trim() === "취소") continue;
    const sameEmail =
      normalizeEmail_(data[index][headerMap.email]) === email;
    const sameStudentId =
      normalizeLookupText_(data[index][headerMap.student_id]) ===
      normalizeLookupText_(studentId);
    if (sameEmail || sameStudentId) return { rowNumber: index + 1 };
  }
  return null;
}

function findProgramApplication_(program, email, studentId) {
  const sheet = getProgramApplicationsSheet_();
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  const headerMap = getHeaderMap_(data[0]);
  for (let index = 1; index < data.length; index += 1) {
    if (String(data[index][headerMap.application_status] || "").trim() === "취소") continue;
    if (String(data[index][headerMap.program] || "").trim() !== program) continue;
    const sameEmail = normalizeEmail_(data[index][headerMap.email]) === email;
    const sameStudentId = normalizeLookupText_(data[index][headerMap.student_id]) === normalizeLookupText_(studentId);
    if (sameEmail || sameStudentId) return { rowNumber: index + 1 };
  }
  return null;
}

function findActiveIdeaContestParticipantConflict_(participants, excludedApplicationId) {
  const participantEmails = new Set(
    participants.map((participant) => normalizeEmail_(participant.email))
  );
  const participantStudentIds = new Set(
    participants.map((participant) => normalizeLookupText_(participant.studentId))
  );
  const teamSheet = getIdeaContestTeamSheet_();
  const teamData = teamSheet.getDataRange().getValues();
  if (teamData.length < 2) return null;
  const teamMap = getHeaderMap_(teamData[0]);
  const activeApplicationIds = new Set();
  teamData.slice(1).forEach((values) => {
    const applicationId = String(values[teamMap.application_id] || "").trim();
    const status = String(values[teamMap.application_status] || "").trim();
    if (applicationId && applicationId !== excludedApplicationId && status !== "취소") {
      activeApplicationIds.add(applicationId);
    }
  });
  if (!activeApplicationIds.size) return null;

  const memberSheet = getIdeaContestMemberSheet_();
  const memberData = memberSheet.getDataRange().getValues();
  if (memberData.length < 2) return null;
  const memberMap = getHeaderMap_(memberData[0]);
  for (let index = 1; index < memberData.length; index += 1) {
    const values = memberData[index];
    const applicationId = String(values[memberMap.application_id] || "").trim();
    if (!activeApplicationIds.has(applicationId)) continue;
    const email = normalizeEmail_(values[memberMap.email]);
    const studentId = normalizeLookupText_(values[memberMap.student_id]);
    if (participantEmails.has(email) || participantStudentIds.has(studentId)) {
      return { applicationId, rowNumber: index + 1 };
    }
  }
  return null;
}

function createPublicApplicationId_(prefix, now) {
  const timestamp = Utilities.formatDate(now, BENEFITS_CONFIG.TIMEZONE, "yyyyMMdd-HHmmss");
  const suffix = Utilities.getUuid().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `${prefix}-${timestamp}-${suffix}`;
}

function sendIdeaContestConfirmation_(email, nameValue, application) {
  MailApp.sendEmail({
    to: email,
    subject: "[전북대 방산 AI 부트캠프] 방산 AI 아이디어 경진대회 접수 안내",
    body: [
      `${String(nameValue || "대표자").trim()}님, 안녕하세요.`,
      "",
      "2026 전북대학교 방산 AI 아이디어 경진대회 참가신청이 접수되었습니다.",
      `접수번호: ${application.applicationId}`,
      `팀명: ${application.teamName}`,
      `팀원 수: ${application.memberCount}명`,
      `아이디어 주제: ${application.ideaTopic}`,
      `접수 시각: ${formatDate_(application.submittedAt, "yyyy-MM-dd HH:mm")}`,
      "",
      "아이디어 제안서는 사업단 지정 양식으로 작성하여 별도 안내되는 기한까지 yimjc@jbnu.ac.kr로 제출해주세요.",
      "대표자를 포함한 모든 팀원은 초급과정 3개 중 1개를 홈페이지에서 개인별로 신청해야 합니다."
    ].join("\n"),
    name: "전북대 방산 AI 부트캠프"
  });
}

function sendIdeaContestIndividualConfirmation_(email, nameValue, application) {
  MailApp.sendEmail({
    to: email,
    subject: "[전북대 방산 AI 부트캠프] 방산 AI 아이디어 경진대회 팀 매칭 신청 안내",
    body: [
      `${String(nameValue || "학생").trim()}님, 안녕하세요.`,
      "",
      "2026 전북대학교 방산 AI 아이디어 경진대회 팀 매칭 신청이 접수되었습니다.",
      `접수번호: ${application.applicationId}`,
      `관심 분야: ${application.ideaInterestFields.join(", ")}`,
      `접수 시각: ${formatDate_(application.submittedAt, "yyyy-MM-dd HH:mm")}`,
      "",
      "개인 접수는 참가팀 확정을 의미하지 않습니다.",
      "팀 매칭 검토 후 입력하신 이메일 또는 전화번호로 별도 안내드립니다."
    ].join("\n"),
    name: "전북대 방산 AI 부트캠프"
  });
}

function sendProgramApplicationConfirmation_(email, nameValue, application) {
  MailApp.sendEmail({
    to: email,
    subject: `[전북대 방산 AI 부트캠프] ${application.program} 접수 안내`,
    body: [
      `${String(nameValue || "학생").trim()}님, 안녕하세요.`,
      "",
      "초급과정 신청이 정상적으로 접수되었습니다.",
      `접수번호: ${application.applicationId}`,
      `신청과정: ${application.program}`,
      `생성형 AI 서비스 지원: ${application.preferredAiService}`,
      `접수 시각: ${formatDate_(application.submittedAt, "yyyy-MM-dd HH:mm")}`,
      "",
      "교육 일정과 수강 방법은 사업단 공지를 통해 안내드립니다."
    ].join("\n"),
    name: "전북대 방산 AI 부트캠프"
  });
}

function rollbackApplicationRows_(sheet, firstRow, rowCount, applicationId, idColumn) {
  if (!sheet || firstRow < 2 || rowCount < 1 || !applicationId) return;
  try {
    const ids = sheet.getRange(firstRow, idColumn, rowCount, 1).getValues().flat().map(String);
    if (ids.every((id) => id === applicationId)) {
      sheet.deleteRows(firstRow, rowCount);
    }
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
  }
}

function validateApplicant_(value, label) {
  const applicant = value && typeof value === "object" ? value : {};
  const name = validateTextField_(applicant.name, `${label} 성명`, 2, 50);
  const studentId = normalizeSingleLine_(applicant.student_id);
  const phone = normalizeSingleLine_(applicant.phone);
  const email = normalizeEmail_(applicant.email);
  const gender = normalizeSingleLine_(applicant.gender);
  const university = validateTextField_(applicant.university, `${label} 대학명`, 2, 100);
  const department = validateTextField_(applicant.department, `${label} 소속학과`, 2, 100);
  const majorField = normalizeSingleLine_(applicant.major_field);
  const courseYears = normalizeSingleLine_(applicant.course_years);
  const birthDate = validateDateText_(applicant.birth_date, `${label} 생년월일`);
  const admissionMonth = validateMonthText_(applicant.admission_month, `${label} 입학연월`);
  const graduationMonth = validateMonthText_(applicant.graduation_month, `${label} 졸업연월`);

  if (!/^[0-9A-Za-z-]{4,20}$/.test(studentId)) {
    throwPublicError_("invalid_applicant", `${label} 학번을 확인해주세요.`);
  }
  if (!/^[0-9+()\s-]{8,20}$/.test(phone)) {
    throwPublicError_("invalid_applicant", `${label} 전화번호를 확인해주세요.`);
  }
  if (!isValidEmail_(email)) {
    throwPublicError_("invalid_applicant", `${label} 이메일을 확인해주세요.`);
  }
  if (!GENDER_OPTIONS.includes(gender)) {
    throwPublicError_("invalid_applicant", `${label} 성별 항목을 확인해주세요.`);
  }
  if (!MAJOR_FIELD_OPTIONS.includes(majorField)) {
    throwPublicError_("invalid_applicant", `${label} 전공분야를 확인해주세요.`);
  }
  if (!COURSE_YEAR_OPTIONS.includes(courseYears)) {
    throwPublicError_("invalid_applicant", `${label} 수업연한을 확인해주세요.`);
  }
  if (graduationMonth < admissionMonth) {
    throwPublicError_("invalid_applicant", `${label} 졸업연월은 입학연월 이후여야 합니다.`);
  }

  return {
    name,
    studentId,
    phone,
    email,
    gender,
    university,
    department,
    majorField,
    courseYears,
    birthDate,
    admissionMonth,
    graduationMonth
  };
}

function validateContestParticipant_(value, label) {
  const participantValue = value && typeof value === "object" ? value : {};
  const name = validateTextField_(participantValue.name, `${label} 성명`, 2, 50);
  const studentId = normalizeSingleLine_(participantValue.student_id);
  const phone = normalizeSingleLine_(participantValue.phone);
  const email = normalizeEmail_(participantValue.email);
  const department = validateTextField_(participantValue.department, `${label} 학과`, 2, 100);
  const defenseIndustryCourseStatus = normalizeSingleLine_(
    participantValue.defense_industry_course_status
  );
  if (!/^[0-9A-Za-z-]{4,20}$/.test(studentId)) {
    throwPublicError_("invalid_team", `${label} 학번을 확인해주세요.`);
  }
  if (!/^[0-9+()\s-]{8,20}$/.test(phone)) {
    throwPublicError_("invalid_team", `${label} 전화번호를 확인해주세요.`);
  }
  if (!isValidEmail_(email)) {
    throwPublicError_("invalid_team", `${label} 이메일을 확인해주세요.`);
  }
  if (!DEFENSE_INDUSTRY_COURSE_STATUS_OPTIONS.includes(defenseIndustryCourseStatus)) {
    throwPublicError_(
      "invalid_team",
      `${label}의 방위산업육성개론 수강 여부를 확인해주세요.`
    );
  }
  return {
    name,
    studentId,
    phone,
    email,
    department,
    defenseIndustryCourseStatus
  };
}

function validateAiSupport_(value, label) {
  const source = value && typeof value === "object" ? value : {};
  const preferredAiService = normalizeSingleLine_(source.preferred_ai_service);
  const aiInvitationEmail = normalizeEmail_(source.ai_invitation_email);
  if (!AI_SERVICE_OPTIONS.includes(preferredAiService)) {
    throwPublicError_("invalid_applicant", `${label}의 생성형 AI 희망 서비스를 확인해주세요.`);
  }
  if (preferredAiService !== "신청하지 않음" && !isValidEmail_(aiInvitationEmail)) {
    throwPublicError_("invalid_applicant", `${label}의 AI 서비스 초대용 이메일을 확인해주세요.`);
  }
  return {
    preferredAiService,
    aiInvitationEmail: preferredAiService === "신청하지 않음" ? "" : aiInvitationEmail
  };
}

function validateUniqueParticipants_(participants) {
  const emailSet = new Set();
  const studentIdSet = new Set();
  participants.forEach((participant) => {
    const emailKey = normalizeEmail_(participant.email);
    const studentIdKey = normalizeLookupText_(participant.studentId);
    if (emailSet.has(emailKey) || studentIdSet.has(studentIdKey)) {
      throwPublicError_("invalid_team", "팀 내 이메일 또는 학번이 중복되어 있습니다.");
    }
    emailSet.add(emailKey);
    studentIdSet.add(studentIdKey);
  });
}

function formatDefenseIndustryCourseSummary_(participants) {
  const displayNames = {
    수강완료: "수강 완료",
    수강중: "현재 수강 중",
    미수강: "미수강"
  };
  return participants
    .map((participant, index) => {
      const role = index === 0 ? "대표자" : `팀원 ${index}`;
      const status =
        displayNames[participant.defenseIndustryCourseStatus] ||
        participant.defenseIndustryCourseStatus;
      return `${role} ${participant.name}: ${status}`;
    })
    .join(" / ");
}

function validateIdeaInterestFields_(values) {
  const interests = Array.isArray(values)
    ? values.map(normalizeSingleLine_).filter(Boolean)
    : [];
  const uniqueInterests = Array.from(new Set(interests));
  if (
    uniqueInterests.length < 1 ||
    uniqueInterests.length > 2 ||
    uniqueInterests.some((interest) => !IDEA_INTEREST_FIELD_OPTIONS.includes(interest))
  ) {
    throwPublicError_(
      "invalid_request",
      "관심 있는 아이디어 분야를 1개 이상, 최대 2개까지 선택해주세요."
    );
  }
  if (
    uniqueInterests.includes("아직 정하지 못함") &&
    uniqueInterests.length > 1
  ) {
    throwPublicError_(
      "invalid_request",
      "아직 정하지 못함은 다른 관심 분야와 함께 선택할 수 없습니다."
    );
  }
  return uniqueInterests;
}

function validateTextField_(value, label, minLength, maxLength) {
  const text = normalizeSingleLine_(value);
  if (text.length < minLength || text.length > maxLength) {
    throwPublicError_("invalid_request", `${label}은(는) ${minLength}~${maxLength}자로 입력해주세요.`);
  }
  return text;
}

function validateOptionalTextField_(value, label, maxLength) {
  const text = String(value || "").replace(/\r\n?/g, "\n").trim();
  if (text.length > maxLength) {
    throwPublicError_("invalid_request", `${label}은(는) ${maxLength}자 이내로 입력해주세요.`);
  }
  return text;
}

function validateDateText_(value, label) {
  const text = normalizeSingleLine_(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    throwPublicError_("invalid_applicant", `${label}을(를) 확인해주세요.`);
  }
  const date = new Date(`${text}T00:00:00+09:00`);
  if (Number.isNaN(date.getTime()) || Utilities.formatDate(date, BENEFITS_CONFIG.TIMEZONE, "yyyy-MM-dd") !== text) {
    throwPublicError_("invalid_applicant", `${label}을(를) 확인해주세요.`);
  }
  return text;
}

function validateMonthText_(value, label) {
  const text = normalizeSingleLine_(value);
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(text)) {
    throwPublicError_("invalid_applicant", `${label}을(를) 확인해주세요.`);
  }
  return text;
}

function rejectBotSubmission_(payload) {
  if (normalizeSingleLine_(payload.website)) {
    throwPublicError_("invalid_request", "요청을 처리할 수 없습니다.");
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
    BENEFITS_CONFIG.SCHOLARSHIP_APPLICATIONS_OPEN &&
    normalizeText_(scholarship.eligibility) === "대상" &&
    !isScholarshipSubmitted_(scholarship.application_status) &&
    isScholarshipWindowOpen_(values);
  scholarship.guidance = getScholarshipGuidance_(scholarship, values);

  return {
    name: displayValue_(values.name, "학생"),
    basic: toPublicCompletion_(values, "basic"),
    intermediate: toPublicCompletion_(values, "intermediate"),
    scholarship
  };
}

function toPublicCompletion_(values, level) {
  const config = getCertificateLevelConfig_(level);
  const status = displayValue_(values[config.statusHeader], "정보 없음");
  const fileId = String(values[config.fileIdHeader] || "").trim();
  const certificateFile = fileId ? getExistingCertificateFile_(fileId) : null;
  const hasMissingManagedFile = Boolean(fileId && !certificateFile);
  return {
    status,
    date: formatDate_(
      values[`${config.level}_completion_date`],
      "yyyy-MM-dd"
    ),
    // Drive URL과 파일 ID는 학생 브라우저에 전달하지 않습니다.
    certificate_url: "",
    certificate_number: hasMissingManagedFile
      ? ""
      : displayValue_(values[config.numberHeader], ""),
    issued_at: hasMissingManagedFile
      ? "-"
      : formatDate_(values[config.issuedAtHeader], "yyyy-MM-dd HH:mm"),
    can_issue:
      isCompletedStatus_(status) &&
      isCertificateDataReady_(values, config)
  };
}

function isCertificateDataReady_(values, config) {
  return Boolean(
    normalizeSingleLine_(values.name) &&
      normalizeSingleLine_(values.affiliation) &&
      normalizeSingleLine_(values.student_id) &&
      normalizeSingleLine_(values[config.courseNameHeader]) &&
      normalizeSingleLine_(values[config.coursePeriodHeader])
  );
}

function getScholarshipGuidance_(scholarship, values) {
  if (!BENEFITS_CONFIG.SCHOLARSHIP_APPLICATIONS_OPEN) {
    return "현재 장학금 접수 준비 중입니다.";
  }
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

function findBenefitRecordByRow_(rowNumberValue, sheetValue) {
  const rowNumber = Number(rowNumberValue);
  const sheet = sheetValue || getBenefitsSheet_();
  if (!Number.isInteger(rowNumber) || rowNumber < 2 || rowNumber > sheet.getLastRow()) {
    return null;
  }

  const headers = sheet
    .getRange(1, 1, 1, BENEFITS_HEADERS.length)
    .getValues()[0];
  const headerMap = getHeaderMap_(headers);
  const missingHeaders = BENEFITS_HEADERS.filter((header) => headerMap[header] === undefined);
  if (missingHeaders.length) {
    throw new Error(`benefits 시트 헤더 누락: ${missingHeaders.join(", ")}`);
  }

  const row = sheet
    .getRange(rowNumber, 1, 1, BENEFITS_HEADERS.length)
    .getValues()[0];
  if (!row.some((value) => String(value || "").trim())) return null;

  const values = {};
  BENEFITS_HEADERS.forEach((header) => {
    values[header] = row[headerMap[header]];
  });
  return {
    sheet,
    headerMap,
    rowNumber,
    values
  };
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

function getCertificateIssuanceLogSheet_() {
  const spreadsheet = getBenefitsSpreadsheet_();
  const sheet = spreadsheet.getSheetByName(
    BENEFITS_CONFIG.CERTIFICATE_LOG_SHEET_NAME
  );
  if (!sheet) {
    throwPublicError_(
      "not_configured",
      "이수증 발급 이력 시트를 찾을 수 없습니다."
    );
  }
  return sheet;
}

function getIdeaContestTeamSheet_() {
  return getConfiguredApplicationSheet_(
    BENEFITS_CONFIG.IDEA_CONTEST_TEAM_SHEET_NAME,
    "경진대회 팀 접수 시트를 찾을 수 없습니다."
  );
}

function getIdeaContestMemberSheet_() {
  return getConfiguredApplicationSheet_(
    BENEFITS_CONFIG.IDEA_CONTEST_MEMBER_SHEET_NAME,
    "경진대회 팀원 시트를 찾을 수 없습니다."
  );
}

function getIdeaContestIndividualSheet_() {
  return getConfiguredApplicationSheet_(
    BENEFITS_CONFIG.IDEA_CONTEST_INDIVIDUAL_SHEET_NAME,
    "경진대회 팀 매칭 신청 시트를 찾을 수 없습니다."
  );
}

function getProgramApplicationsSheet_() {
  return getConfiguredApplicationSheet_(
    BENEFITS_CONFIG.PROGRAM_APPLICATION_SHEET_NAME,
    "초급과정 신청 시트를 찾을 수 없습니다."
  );
}

function getApplicationChangeLogSheet_() {
  return getConfiguredApplicationSheet_(
    BENEFITS_CONFIG.APPLICATION_CHANGE_LOG_SHEET_NAME,
    "신청 변경 이력 시트를 찾을 수 없습니다."
  );
}

function getConfiguredApplicationSheet_(sheetName, errorMessage) {
  const sheet = getApplicationSpreadsheet_().getSheetByName(sheetName);
  if (!sheet) {
    throwPublicError_("not_configured", errorMessage);
  }
  return sheet;
}

function getApplicationSpreadsheet_() {
  try {
    return SpreadsheetApp.openById(BENEFITS_CONFIG.APPLICATION_SPREADSHEET_ID);
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    throwPublicError_(
      "not_configured",
      "경진대회·초급과정 접수 관리대장에 접근할 수 없습니다."
    );
  }
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

function getCertificateOutputFolder_() {
  const properties = PropertiesService.getScriptProperties();
  const existingId = properties.getProperty("CERTIFICATE_OUTPUT_FOLDER_ID");
  if (existingId) {
    try {
      const folder = Drive.Files.get(existingId, {
        fields: "id,name,mimeType,trashed"
      });
      if (
        !folder.trashed &&
        folder.mimeType === "application/vnd.google-apps.folder"
      ) {
        return folder;
      }
    } catch (error) {
      console.warn("기존 이수증 폴더를 찾지 못해 새 폴더를 생성합니다.");
    }
    properties.deleteProperty("CERTIFICATE_OUTPUT_FOLDER_ID");
  }

  try {
    const folder = Drive.Files.create({
      name: BENEFITS_CONFIG.CERTIFICATE_OUTPUT_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
      description: "학생별 자동 생성 이수증 PDF 비공개 보관 폴더",
      appProperties: { purpose: "bootcamp-certificate-pdf-output" }
    });
    properties.setProperty("CERTIFICATE_OUTPUT_FOLDER_ID", folder.id);
    return folder;
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    throwPublicError_(
      "not_configured",
      `이수증 보관 폴더에 접근할 수 없습니다: ${error && error.message ? error.message : error}`
    );
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

function normalizeLookupText_(value) {
  return normalizeSingleLine_(value).toLowerCase().replace(/\s+/g, "");
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

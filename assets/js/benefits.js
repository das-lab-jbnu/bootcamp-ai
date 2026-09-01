const StudentBenefits = (() => {
  const ENDPOINT = window.getBenefitsApiEndpoint ? window.getBenefitsApiEndpoint() : "";
  const BENEFITS_SERVICE_OPEN = false;
  const ENDPOINT_READY =
    /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(ENDPOINT) &&
    !ENDPOINT.includes("PASTE_");
  const MAX_BANKBOOK_FILE_BYTES = 5 * 1024 * 1024;
  const BANKBOOK_MIME_BY_EXTENSION = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png"
  };

  const SELECTORS = {
    setupNotice: "#benefits-setup-notice",
    previewButton: "#benefits-preview-button",
    authPanel: "#benefits-auth-panel",
    emailForm: "#benefits-email-form",
    emailInput: "#benefits-email",
    emailSubmit: "#benefits-email-submit",
    codeForm: "#benefits-code-form",
    codeInput: "#benefits-code",
    codeSubmit: "#benefits-code-submit",
    changeEmail: "#benefits-change-email",
    authMessage: "#benefits-auth-message",
    dashboard: "#benefits-dashboard",
    reset: "#benefits-reset",
    applyButton: "#scholarship-apply-button",
    applyMessage: "#scholarship-apply-message",
    applicationForm: "#scholarship-application-form",
    applicationCancel: "#scholarship-application-cancel",
    applicationSubmit: "#scholarship-application-submit",
    bankName: "#scholarship-bank-name",
    accountHolder: "#scholarship-account-holder",
    accountNumber: "#scholarship-account-number",
    bankbookFile: "#scholarship-bankbook-file",
    fileGuidance: "#scholarship-file-guidance"
  };

  const state = {
    email: "",
    sessionToken: "",
    benefits: null,
    previewMode: false
  };

  function init() {
    const emailForm = document.querySelector(SELECTORS.emailForm);
    const codeForm = document.querySelector(SELECTORS.codeForm);
    if (!emailForm || !codeForm) return;

    emailForm.addEventListener("submit", requestVerificationCode);
    codeForm.addEventListener("submit", verifyCode);
    document.querySelector(SELECTORS.changeEmail).addEventListener("click", resetVerification);
    document.querySelector(SELECTORS.reset).addEventListener("click", resetAll);
    document.querySelector(SELECTORS.applyButton).addEventListener("click", openScholarshipApplication);
    document.querySelector(SELECTORS.applicationForm).addEventListener("submit", submitScholarshipApplication);
    document.querySelector(SELECTORS.applicationCancel).addEventListener("click", closeScholarshipApplication);
    document.querySelector(SELECTORS.previewButton).addEventListener("click", showLocalPreview);
    document.querySelector(SELECTORS.codeInput).addEventListener("input", keepDigitsOnly);
    document.querySelector(SELECTORS.accountNumber).addEventListener("input", keepAccountDigitsOnly);
    document.querySelector(SELECTORS.bankbookFile).addEventListener("change", validateSelectedFile);

    if (!BENEFITS_SERVICE_OPEN) {
      document.querySelector(SELECTORS.setupNotice).classList.remove("hidden");
      document.querySelector("#benefits-setup-message").textContent =
        "이수증 발급·장학금 접수 준비 중입니다. 서비스 활성화 전에는 이메일 인증과 신청을 이용할 수 없습니다.";
      document.querySelector(SELECTORS.emailInput).disabled = true;
      document.querySelector(SELECTORS.emailSubmit).disabled = true;
      return;
    }

    if (isLocalHost()) {
      document.querySelector(SELECTORS.setupNotice).classList.remove("hidden");
      document.querySelector(SELECTORS.previewButton).classList.remove("hidden");
      document.querySelector("#benefits-setup-message").textContent =
        "라이브 서버에서 계좌 입력·통장사본 제출 화면을 샘플 데이터로 미리 확인할 수 있습니다.";
    }

    if (!ENDPOINT_READY) {
      document.querySelector(SELECTORS.setupNotice).classList.remove("hidden");
      document.querySelector(SELECTORS.emailSubmit).disabled = true;
    }
  }

  async function requestVerificationCode(event) {
    event.preventDefault();
    const form = event.currentTarget;
    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage(SELECTORS.authMessage, "이메일 형식을 확인해주세요.", "error");
      return;
    }

    const email = document.querySelector(SELECTORS.emailInput).value.trim();
    setButtonLoading(SELECTORS.emailSubmit, form, true, "발송 중", "인증번호 받기");
    hideMessage(SELECTORS.authMessage);

    try {
      const result = await postJson({ action: "sendCode", email });
      ensureSuccess(result);
      state.email = email;
      document.querySelector(SELECTORS.emailInput).disabled = true;
      document.querySelector(SELECTORS.codeForm).classList.remove("hidden");
      showMessage(
        SELECTORS.authMessage,
        "등록된 이메일인 경우 인증번호가 발송되었습니다. 메일함을 확인해주세요.",
        "success"
      );
      document.querySelector(SELECTORS.codeInput).focus();
    } catch (error) {
      console.error("Benefits verification email failed:", error);
      showMessage(SELECTORS.authMessage, getFriendlyMessage(error), "error");
    } finally {
      setButtonLoading(SELECTORS.emailSubmit, form, false, "발송 중", "인증번호 받기");
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    const form = event.currentTarget;
    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage(SELECTORS.authMessage, "6자리 인증번호를 입력해주세요.", "error");
      return;
    }

    const code = document.querySelector(SELECTORS.codeInput).value.trim();
    setButtonLoading(SELECTORS.codeSubmit, form, true, "확인 중", "인증하고 조회");
    hideMessage(SELECTORS.authMessage);

    try {
      const result = await postJson({
        action: "verifyCode",
        email: state.email,
        code
      });
      ensureSuccess(result);
      state.sessionToken = result.session_token || "";
      state.benefits = result.benefits || {};
      renderDashboard();
    } catch (error) {
      console.error("Benefits verification failed:", error);
      showMessage(SELECTORS.authMessage, getFriendlyMessage(error), "error");
    } finally {
      setButtonLoading(SELECTORS.codeSubmit, form, false, "확인 중", "인증하고 조회");
    }
  }

  function openScholarshipApplication() {
    const canApply = Boolean(
      state.benefits && state.benefits.scholarship && state.benefits.scholarship.can_apply
    );
    if (!canApply) return;

    hideMessage(SELECTORS.applyMessage);
    document.querySelector(SELECTORS.applyButton).classList.add("hidden");
    document.querySelector(SELECTORS.applicationForm).classList.remove("hidden");
    document.querySelector(SELECTORS.bankName).focus();
  }

  function closeScholarshipApplication() {
    resetApplicationForm();
    const canApply = Boolean(
      state.benefits && state.benefits.scholarship && state.benefits.scholarship.can_apply
    );
    document.querySelector(SELECTORS.applyButton).classList.toggle("hidden", !canApply);
  }

  async function submitScholarshipApplication(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fileInput = document.querySelector(SELECTORS.bankbookFile);
    form.classList.add("was-validated");
    validateSelectedFile();

    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage(SELECTORS.applyMessage, "입력 항목과 첨부파일을 확인해주세요.", "error");
      return;
    }

    const file = fileInput.files && fileInput.files[0];
    const mimeType = getBankbookMimeType(file);
    const accountNumber = document.querySelector(SELECTORS.accountNumber).value.replace(/\D/g, "");
    if (!/^\d{8,20}$/.test(accountNumber)) {
      document.querySelector(SELECTORS.accountNumber).setCustomValidity("계좌번호 숫자 8~20자리를 입력해주세요.");
      form.reportValidity();
      showMessage(SELECTORS.applyMessage, "계좌번호 숫자 8~20자리를 입력해주세요.", "error");
      return;
    }

    setButtonLoading(SELECTORS.applicationSubmit, form, true, "제출 중", "신청서 제출");
    document.querySelector(SELECTORS.applicationCancel).disabled = true;
    hideMessage(SELECTORS.applyMessage);

    try {
      if (state.previewMode) {
        await Promise.resolve();
        state.benefits.scholarship.application_status = "신청완료";
        state.benefits.scholarship.can_apply = false;
        state.benefits.scholarship.guidance = "계좌정보와 통장사본이 제출된 상태의 미리보기입니다.";
        resetApplicationForm();
        renderScholarship(state.benefits.scholarship);
        showMessage(
          SELECTORS.applyMessage,
          "미리보기 완료: 실제 정보와 파일은 전송되거나 저장되지 않았습니다.",
          "success"
        );
        return;
      }

      const fileBase64 = await readFileAsBase64(file);
      const result = await postJson({
        action: "submitScholarshipApplication",
        session_token: state.sessionToken,
        bank_name: document.querySelector(SELECTORS.bankName).value.trim(),
        account_holder: document.querySelector(SELECTORS.accountHolder).value.trim(),
        account_number: accountNumber,
        privacy_consent: true,
        file: {
          name: file.name,
          mime_type: mimeType,
          size: file.size,
          base64: fileBase64
        }
      });
      ensureSuccess(result);
      state.benefits = result.benefits || state.benefits;
      resetApplicationForm();
      renderScholarship(state.benefits.scholarship || {});
      showMessage(
        SELECTORS.applyMessage,
        "장학금 신청서와 통장사본이 정상적으로 접수되었습니다.",
        "success"
      );
    } catch (error) {
      console.error("Scholarship application failed:", error);
      showMessage(SELECTORS.applyMessage, getFriendlyMessage(error), "error");
    } finally {
      document.querySelector(SELECTORS.applicationCancel).disabled = false;
      setButtonLoading(SELECTORS.applicationSubmit, form, false, "제출 중", "신청서 제출");
    }
  }

  function renderDashboard() {
    const benefits = state.benefits || {};
    document.querySelector(SELECTORS.authPanel).classList.add("hidden");
    document.querySelector(SELECTORS.dashboard).classList.remove("hidden");
    document.querySelector("#benefits-student-name").textContent = benefits.name || "학생";
    document.querySelector("#benefits-session-email").textContent = state.email;

    renderCompletion("basic", benefits.basic || {});
    renderCompletion("intermediate", benefits.intermediate || {});
    renderScholarship(benefits.scholarship || {});
    document.querySelector(SELECTORS.reset).focus();
  }

  function renderCompletion(level, completion) {
    const status = completion.status || "정보 없음";
    const statusElement = document.querySelector(`#${level}-completion-status`);
    statusElement.textContent = status;
    setBadgeTone(statusElement, status);
    document.querySelector(`#${level}-completion-date`).textContent = completion.date || "-";

    const link = document.querySelector(`#${level}-certificate-link`);
    const empty = document.querySelector(`#${level}-certificate-empty`);
    const certificateUrl = getSafeCertificateUrl(completion.certificate_url);
    const canIssue = isCompleted(status) && Boolean(certificateUrl);

    link.classList.toggle("hidden", !canIssue);
    empty.classList.toggle("hidden", canIssue);
    if (canIssue) {
      link.href = certificateUrl;
    } else {
      link.removeAttribute("href");
      empty.textContent = isCompleted(status)
        ? "이수증 발급 준비 중입니다."
        : "발급 가능한 이수증이 없습니다.";
    }
  }

  function renderScholarship(scholarship) {
    const eligibility = scholarship.eligibility || "정보 없음";
    const eligibilityElement = document.querySelector("#scholarship-eligibility");
    eligibilityElement.textContent = eligibility;
    setBadgeTone(eligibilityElement, eligibility);

    document.querySelector("#scholarship-round").textContent = scholarship.round || "-";
    document.querySelector("#scholarship-application-status").textContent = scholarship.application_status || "-";
    document.querySelector("#scholarship-guidance").textContent =
      scholarship.guidance || getScholarshipGuidance(scholarship);

    const button = document.querySelector(SELECTORS.applyButton);
    const canApply = Boolean(scholarship.can_apply);
    const applicationForm = document.querySelector(SELECTORS.applicationForm);
    if (!canApply) {
      resetApplicationForm();
    }
    button.classList.toggle("hidden", !canApply || !applicationForm.classList.contains("hidden"));
    button.disabled = !canApply;
  }

  function resetVerification() {
    const emailInput = document.querySelector(SELECTORS.emailInput);
    const codeForm = document.querySelector(SELECTORS.codeForm);
    emailInput.disabled = false;
    codeForm.reset();
    codeForm.classList.add("hidden");
    codeForm.classList.remove("was-validated");
    state.email = "";
    hideMessage(SELECTORS.authMessage);
    emailInput.focus();
  }

  function resetAll() {
    state.email = "";
    state.sessionToken = "";
    state.benefits = null;
    state.previewMode = false;
    document.querySelector(SELECTORS.emailForm).reset();
    document.querySelector(SELECTORS.codeForm).reset();
    document.querySelector(SELECTORS.emailForm).classList.remove("was-validated");
    document.querySelector(SELECTORS.codeForm).classList.remove("was-validated");
    document.querySelector(SELECTORS.emailInput).disabled = false;
    document.querySelector(SELECTORS.codeForm).classList.add("hidden");
    document.querySelector(SELECTORS.dashboard).classList.add("hidden");
    document.querySelector(SELECTORS.authPanel).classList.remove("hidden");
    resetApplicationForm();
    hideMessage(SELECTORS.authMessage);
    hideMessage(SELECTORS.applyMessage);
    document.querySelector(SELECTORS.emailInput).focus();
  }

  function resetApplicationForm() {
    const form = document.querySelector(SELECTORS.applicationForm);
    form.reset();
    form.classList.add("hidden");
    form.classList.remove("was-validated", "is-submitting");
    document.querySelector(SELECTORS.accountNumber).setCustomValidity("");
    document.querySelector(SELECTORS.bankbookFile).setCustomValidity("");
    document.querySelector(SELECTORS.fileGuidance).textContent =
      "PDF, JPG, PNG 파일만 가능하며 최대 5MB까지 제출할 수 있습니다.";
  }

  function showLocalPreview() {
    state.email = "student@jbnu.ac.kr";
    state.sessionToken = "";
    state.previewMode = true;
    state.benefits = {
      name: "김학생",
      basic: {
        status: "이수",
        date: "2026-08-20",
        certificate_url: "https://drive.google.com/"
      },
      intermediate: {
        status: "심사중",
        date: "-",
        certificate_url: ""
      },
      scholarship: {
        eligibility: "대상",
        round: "2026학년도 1차",
        application_status: "신청 전",
        can_apply: true,
        guidance: "장학금 대상자로 확인되었습니다. 계좌정보와 통장사본을 제출해주세요."
      }
    };
    renderDashboard();
  }

  function validateSelectedFile() {
    const input = document.querySelector(SELECTORS.bankbookFile);
    const guidance = document.querySelector(SELECTORS.fileGuidance);
    const file = input.files && input.files[0];
    input.setCustomValidity("");

    if (!file) {
      guidance.textContent = "PDF, JPG, PNG 파일만 가능하며 최대 5MB까지 제출할 수 있습니다.";
      return false;
    }

    if (!getBankbookMimeType(file)) {
      input.setCustomValidity("PDF, JPG, PNG 파일만 선택할 수 있습니다.");
      guidance.textContent = "지원하지 않는 파일 형식입니다. PDF, JPG, PNG 파일을 선택해주세요.";
      return false;
    }

    if (file.size <= 0 || file.size > MAX_BANKBOOK_FILE_BYTES) {
      input.setCustomValidity("파일 크기는 5MB 이하여야 합니다.");
      guidance.textContent = "파일 크기는 5MB 이하여야 합니다.";
      return false;
    }

    guidance.textContent = `${file.name} · ${formatFileSize(file.size)}`;
    return true;
  }

  function getBankbookMimeType(file) {
    if (!file) return "";
    const extension = String(file.name || "").split(".").pop().toLowerCase();
    const inferredType = BANKBOOK_MIME_BY_EXTENSION[extension] || "";
    const reportedType = String(file.type || "").toLowerCase();
    if (reportedType && Object.values(BANKBOOK_MIME_BY_EXTENSION).includes(reportedType)) {
      return reportedType;
    }
    return inferredType;
  }

  function formatFileSize(bytes) {
    return bytes >= 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)}MB`
      : `${Math.ceil(bytes / 1024)}KB`;
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || "");
        const base64 = result.includes(",") ? result.split(",", 2)[1] : "";
        if (!base64) {
          const error = new Error("첨부파일을 읽지 못했습니다.");
          error.code = "file_read_error";
          reject(error);
          return;
        }
        resolve(base64);
      };
      reader.onerror = () => {
        const error = new Error("첨부파일을 읽지 못했습니다.");
        error.code = "file_read_error";
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }

  async function postJson(payload) {
    if (!ENDPOINT_READY) {
      const error = new Error("학생 지원 조회 서비스가 아직 연결되지 않았습니다.");
      error.code = "not_configured";
      throw error;
    }

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Invalid JSON response: ${text.slice(0, 120)}`);
    }
  }

  function ensureSuccess(result) {
    if (result && result.result === "success") return;
    const error = new Error((result && result.message) || "요청을 처리하지 못했습니다.");
    error.code = result && result.code;
    throw error;
  }

  function getFriendlyMessage(error) {
    if (error.code === "invalid_request") {
      return isLocalHost()
        ? "현재 Apps Script 배포가 이전 버전입니다. 새 버전으로 재배포해주세요."
        : "서비스 업데이트가 아직 적용되지 않았습니다. 사업단에 문의해주세요.";
    }
    if (error.code === "invalid_code") return "인증번호가 올바르지 않거나 만료되었습니다.";
    if (error.code === "session_expired") return "인증 시간이 만료되었습니다. 이메일 인증을 다시 진행해주세요.";
    if (error.code === "not_eligible") return "현재 장학금 신청 대상이 아닙니다.";
    if (error.code === "application_closed") return "현재 장학금 신청 기간이 아닙니다.";
    if (error.code === "already_applied") return "이미 장학금 신청이 접수되었습니다.";
    if (error.code === "invalid_bank_info") return "은행, 예금주, 계좌번호를 다시 확인해주세요.";
    if (error.code === "consent_required") return "개인정보 수집·이용 동의가 필요합니다.";
    if (error.code === "invalid_file") return "PDF, JPG, PNG 통장사본 파일을 선택해주세요.";
    if (error.code === "file_too_large") return "통장사본 파일은 5MB 이하로 제출해주세요.";
    if (error.code === "file_read_error") return "첨부파일을 읽지 못했습니다. 파일을 다시 선택해주세요.";
    if (error.code === "upload_failed") return "통장사본 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    if (error.code === "not_configured") return error.message;
    return "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  function keepDigitsOnly(event) {
    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 6);
  }

  function keepAccountDigitsOnly(event) {
    event.currentTarget.value = event.currentTarget.value.replace(/\D/g, "").slice(0, 20);
    event.currentTarget.setCustomValidity("");
  }

  function setButtonLoading(buttonSelector, form, isLoading, loadingText, idleText) {
    const button = document.querySelector(buttonSelector);
    const text = button.querySelector("[data-button-text]");
    button.disabled = isLoading;
    form.classList.toggle("is-submitting", isLoading);
    text.textContent = isLoading ? loadingText : idleText;
  }

  function showMessage(selector, message, type) {
    const element = document.querySelector(selector);
    element.textContent = message;
    element.classList.remove("hidden", "text-red-600", "text-green-700");
    element.classList.add(type === "success" ? "text-green-700" : "text-red-600");
  }

  function hideMessage(selector) {
    const element = document.querySelector(selector);
    element.textContent = "";
    element.classList.add("hidden");
    element.classList.remove("text-red-600", "text-green-700");
  }

  function setBadgeTone(element, status) {
    element.classList.remove(
      "benefit-badge--success",
      "benefit-badge--pending",
      "benefit-badge--info",
      "benefit-badge--muted",
      "benefit-badge--danger"
    );

    const value = String(status || "").replace(/\s/g, "");
    let tone = "benefit-badge--muted";
    if (["이수", "이수완료", "대상", "승인", "지급완료", "신청완료"].includes(value)) {
      tone = "benefit-badge--success";
    } else if (["심사중", "발급대기", "접수", "보완요청", "신청전"].includes(value)) {
      tone = "benefit-badge--pending";
    } else if (["발급가능", "선발"].includes(value)) {
      tone = "benefit-badge--info";
    } else if (["미이수", "비대상", "반려"].includes(value)) {
      tone = "benefit-badge--danger";
    }
    element.classList.add(tone);
  }

  function isCompleted(status) {
    const value = String(status || "").replace(/\s/g, "");
    return value === "이수" || value === "이수완료";
  }

  function getSafeCertificateUrl(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      return url.protocol === "https:" ? url.toString() : "";
    } catch (error) {
      return "";
    }
  }

  function getScholarshipGuidance(scholarship) {
    if (scholarship.can_apply) return "장학금 대상자로 확인되었습니다. 계좌정보와 통장사본을 제출해주세요.";
    if (scholarship.application_status === "신청완료") return "장학금 신청서와 통장사본이 접수되었습니다.";
    if (scholarship.eligibility === "비대상") return "현재 장학금 지원 대상이 아닙니다.";
    if (scholarship.eligibility === "심사중") return "사업단에서 장학금 대상 여부를 심사하고 있습니다.";
    return "장학금 대상 여부와 신청 상태는 사업단 입력 후 표시됩니다.";
  }

  function isLocalHost() {
    return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", StudentBenefits.init);

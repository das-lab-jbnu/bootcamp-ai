const StudentBenefits = (() => {
  const ENDPOINT = window.getBenefitsApiEndpoint ? window.getBenefitsApiEndpoint() : "";
  const SERVICE_OPEN = {
    certificate: true,
    scholarship: false
  };
  const ENDPOINT_READY =
    /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(ENDPOINT) &&
    !ENDPOINT.includes("PASTE_");
  const MAX_BANKBOOK_FILE_BYTES = 5 * 1024 * 1024;
  const MAX_CERTIFICATE_PDF_BYTES = 5 * 1024 * 1024;
  const BANKBOOK_MIME_BY_EXTENSION = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png"
  };
  const SERVICE_KEYS = ["certificate", "scholarship"];

  const AUTH_SELECTORS = {
    certificate: createAuthSelectors("certificate"),
    scholarship: createAuthSelectors("scholarship")
  };

  const SELECTORS = {
    tabs: "[data-benefits-tab]",
    panels: "[data-benefits-panel]",
    certificateActionMessage: "#certificate-action-message",
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

  const serviceState = {
    certificate: createServiceState(),
    scholarship: createServiceState()
  };

  function createAuthSelectors(service) {
    return {
      setupNotice: `#${service}-setup-notice`,
      setupMessage: `#${service}-setup-message`,
      previewButton: `#${service}-preview-button`,
      authPanel: `#${service}-auth-panel`,
      emailForm: `#${service}-email-form`,
      emailInput: `#${service}-email`,
      emailSubmit: `#${service}-email-submit`,
      codeForm: `#${service}-code-form`,
      codeInput: `#${service}-code`,
      codeSubmit: `#${service}-code-submit`,
      changeEmail: `#${service}-change-email`,
      authMessage: `#${service}-auth-message`,
      dashboard: `#${service}-dashboard`,
      studentName: `#${service}-student-name`,
      sessionEmail: `#${service}-session-email`,
      reset: `#${service}-reset`
    };
  }

  function createServiceState() {
    return {
      email: "",
      sessionToken: "",
      benefits: null,
      previewMode: false,
      certificateFiles: {
        basic: null,
        intermediate: null
      }
    };
  }

  function init() {
    initServiceTabs();
    SERVICE_KEYS.forEach(bindServiceAuthentication);
    bindCertificateIssuance();
    bindScholarshipApplication();

    SERVICE_KEYS.forEach((service) => {
      if (!SERVICE_OPEN[service]) {
        configureUnavailableService(service, true);
        return;
      }
      if (!ENDPOINT_READY) {
        configureUnavailableService(service, false);
        return;
      }
      if (isLocalHost()) {
        const auth = AUTH_SELECTORS[service];
        document.querySelector(auth.setupNotice).classList.remove("hidden");
        document.querySelector(auth.previewButton).classList.remove("hidden");
        document.querySelector(auth.setupMessage).textContent =
          service === "certificate"
            ? "라이브 서버에서 이수 결과와 이수증 발급 화면을 샘플 데이터로 미리 확인할 수 있습니다."
            : "라이브 서버에서 장학금 대상 확인과 신청 화면을 샘플 데이터로 미리 확인할 수 있습니다.";
      }
    });
  }

  function initServiceTabs() {
    const tabs = Array.from(document.querySelectorAll(SELECTORS.tabs));
    if (!tabs.length) return;

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activateServiceTab(tab.dataset.benefitsTab, true));
      tab.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        else return;

        event.preventDefault();
        activateServiceTab(tabs[nextIndex].dataset.benefitsTab, true);
      });
    });

    activateServiceTab("certificate", false);
  }

  function activateServiceTab(service, shouldFocus) {
    if (!SERVICE_KEYS.includes(service)) return;

    document.querySelectorAll(SELECTORS.tabs).forEach((tab) => {
      const isActive = tab.dataset.benefitsTab === service;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
      if (isActive && shouldFocus) tab.focus();
    });

    document.querySelectorAll(SELECTORS.panels).forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.benefitsPanel !== service);
    });
  }

  function bindServiceAuthentication(service) {
    const auth = AUTH_SELECTORS[service];
    const emailForm = document.querySelector(auth.emailForm);
    const codeForm = document.querySelector(auth.codeForm);
    if (!emailForm || !codeForm) return;

    emailForm.addEventListener("submit", (event) => requestVerificationCode(event, service));
    codeForm.addEventListener("submit", (event) => verifyCode(event, service));
    document.querySelector(auth.changeEmail).addEventListener("click", () => resetVerification(service));
    document.querySelector(auth.reset).addEventListener("click", () => resetService(service));
    document.querySelector(auth.previewButton).addEventListener("click", () => showLocalPreview(service));
    document.querySelector(auth.codeInput).addEventListener("input", keepDigitsOnly);
  }

  function bindScholarshipApplication() {
    document.querySelector(SELECTORS.applyButton).addEventListener("click", openScholarshipApplication);
    document.querySelector(SELECTORS.applicationForm).addEventListener("submit", submitScholarshipApplication);
    document.querySelector(SELECTORS.applicationCancel).addEventListener("click", closeScholarshipApplication);
    document.querySelector(SELECTORS.accountNumber).addEventListener("input", keepAccountDigitsOnly);
    document.querySelector(SELECTORS.bankbookFile).addEventListener("change", validateSelectedFile);
  }

  function bindCertificateIssuance() {
    ["basic", "intermediate"].forEach((level) => {
      document
        .querySelector(`#${level}-certificate-issue`)
        .addEventListener("click", () => issueCertificate(level));
    });
  }

  function configureUnavailableService(service, serviceClosed) {
    const auth = AUTH_SELECTORS[service];
    const serviceLabel = service === "certificate" ? "이수증 발급" : "장학금 신청";
    document.querySelector(auth.setupNotice).classList.remove("hidden");
    document.querySelector(auth.setupMessage).textContent = serviceClosed
      ? `${serviceLabel} 준비 중입니다. 서비스 활성화 전에는 이메일 인증을 이용할 수 없습니다.`
      : `${serviceLabel} 서비스 연결을 준비 중입니다. 관리자 설정 후 이용할 수 있습니다.`;
    document.querySelector(auth.emailInput).disabled = true;
    document.querySelector(auth.emailSubmit).disabled = true;

    if (isLocalHost()) {
      document.querySelector(auth.previewButton).classList.remove("hidden");
    }
  }

  async function requestVerificationCode(event, service) {
    event.preventDefault();
    const auth = AUTH_SELECTORS[service];
    if (!SERVICE_OPEN[service]) {
      const serviceLabel = service === "certificate" ? "이수증 발급" : "장학금 접수";
      showMessage(auth.authMessage, `현재 ${serviceLabel} 준비 중입니다.`, "error");
      return;
    }
    const state = serviceState[service];
    const form = event.currentTarget;
    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage(auth.authMessage, "이메일 형식을 확인해주세요.", "error");
      return;
    }

    const email = document.querySelector(auth.emailInput).value.trim();
    setButtonLoading(auth.emailSubmit, form, true, "발송 중", "인증번호 받기");
    hideMessage(auth.authMessage);

    try {
      const result = await postJson({ action: "sendCode", email });
      ensureSuccess(result);
      state.email = email;
      document.querySelector(auth.emailInput).disabled = true;
      document.querySelector(auth.codeForm).classList.remove("hidden");
      showMessage(auth.authMessage, "등록된 이메일인 경우 인증번호가 발송되었습니다. 메일함을 확인해주세요.", "success");
      document.querySelector(auth.codeInput).focus();
    } catch (error) {
      console.error(`${service} verification email failed:`, error);
      showMessage(auth.authMessage, getFriendlyMessage(error), "error");
    } finally {
      setButtonLoading(auth.emailSubmit, form, false, "발송 중", "인증번호 받기");
    }
  }

  async function verifyCode(event, service) {
    event.preventDefault();
    const auth = AUTH_SELECTORS[service];
    if (!SERVICE_OPEN[service]) {
      const serviceLabel = service === "certificate" ? "이수증 발급" : "장학금 접수";
      showMessage(auth.authMessage, `현재 ${serviceLabel} 준비 중입니다.`, "error");
      return;
    }
    const state = serviceState[service];
    const form = event.currentTarget;
    form.classList.add("was-validated");

    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage(auth.authMessage, "6자리 인증번호를 입력해주세요.", "error");
      return;
    }

    const code = document.querySelector(auth.codeInput).value.trim();
    setButtonLoading(auth.codeSubmit, form, true, "확인 중", "인증하고 조회");
    hideMessage(auth.authMessage);

    try {
      const result = await postJson({ action: "verifyCode", email: state.email, code });
      ensureSuccess(result);
      state.sessionToken = result.session_token || "";
      state.benefits = result.benefits || {};
      renderServiceDashboard(service);
    } catch (error) {
      console.error(`${service} verification failed:`, error);
      showMessage(auth.authMessage, getFriendlyMessage(error), "error");
    } finally {
      setButtonLoading(auth.codeSubmit, form, false, "확인 중", "인증하고 조회");
    }
  }

  function renderServiceDashboard(service) {
    const auth = AUTH_SELECTORS[service];
    const state = serviceState[service];
    const benefits = state.benefits || {};

    document.querySelector(auth.authPanel).classList.add("hidden");
    document.querySelector(auth.dashboard).classList.remove("hidden");
    document.querySelector(auth.studentName).textContent = benefits.name || "학생";
    document.querySelector(auth.sessionEmail).textContent = state.email;

    if (service === "certificate") {
      hideMessage(SELECTORS.certificateActionMessage);
      renderCompletion("basic", benefits.basic || {});
      renderCompletion("intermediate", benefits.intermediate || {});
    } else {
      renderScholarship(benefits.scholarship || {});
    }

    document.querySelector(auth.reset).focus();
  }

  function renderCompletion(level, completion) {
    const status = completion.status || "정보 없음";
    const statusElement = document.querySelector(`#${level}-completion-status`);
    statusElement.textContent = status;
    setBadgeTone(statusElement, status);
    document.querySelector(`#${level}-completion-date`).textContent = completion.date || "-";
    document.querySelector(`#${level}-certificate-number`).textContent =
      completion.certificate_number || "-";

    const link = document.querySelector(`#${level}-certificate-link`);
    const downloadLink = document.querySelector(`#${level}-certificate-download`);
    const issueButton = document.querySelector(`#${level}-certificate-issue`);
    const empty = document.querySelector(`#${level}-certificate-empty`);
    const certificateFile = serviceState.certificate.certificateFiles[level];
    const certificateUrl = getCertificateObjectUrl(
      certificateFile && certificateFile.url
    );
    const canDownload = isCompleted(status) && Boolean(certificateUrl);
    const canGenerate =
      isCompleted(status) && !canDownload && Boolean(completion.can_issue);

    link.classList.toggle("hidden", !canDownload);
    downloadLink.classList.toggle("hidden", !canDownload);
    issueButton.classList.toggle("hidden", !canGenerate);
    issueButton.disabled = false;
    issueButton.querySelector("[data-button-text]").textContent =
      `${level === "basic" ? "초급" : "중급"} 이수증 발급`;
    empty.classList.toggle("hidden", canDownload || canGenerate);
    if (canDownload) {
      link.href = certificateUrl;
      downloadLink.href = certificateUrl;
      downloadLink.download = certificateFile.fileName;
    } else {
      link.removeAttribute("href");
      downloadLink.removeAttribute("href");
      downloadLink.removeAttribute("download");
      empty.textContent = isCompleted(status)
        ? "사업단에서 이수증 발급 정보를 입력 중입니다."
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
    document.querySelector("#scholarship-guidance").textContent = scholarship.guidance || getScholarshipGuidance(scholarship);

    const button = document.querySelector(SELECTORS.applyButton);
    const canApply = Boolean(scholarship.can_apply);
    const applicationForm = document.querySelector(SELECTORS.applicationForm);
    if (!canApply) resetApplicationForm();
    button.classList.toggle("hidden", !canApply || !applicationForm.classList.contains("hidden"));
    button.disabled = !canApply;
  }

  function resetVerification(service) {
    const auth = AUTH_SELECTORS[service];
    const state = serviceState[service];
    const emailInput = document.querySelector(auth.emailInput);
    const codeForm = document.querySelector(auth.codeForm);
    emailInput.disabled = !SERVICE_OPEN[service] || !ENDPOINT_READY;
    codeForm.reset();
    codeForm.classList.add("hidden");
    codeForm.classList.remove("was-validated");
    state.email = "";
    hideMessage(auth.authMessage);
    emailInput.focus();
  }

  function resetService(service) {
    const auth = AUTH_SELECTORS[service];
    const state = serviceState[service];
    if (service === "certificate") {
      releaseAllCertificateObjectUrls();
    }
    state.email = "";
    state.sessionToken = "";
    state.benefits = null;
    state.previewMode = false;

    document.querySelector(auth.emailForm).reset();
    document.querySelector(auth.codeForm).reset();
    document.querySelector(auth.emailForm).classList.remove("was-validated");
    document.querySelector(auth.codeForm).classList.remove("was-validated");
    document.querySelector(auth.emailInput).disabled = !SERVICE_OPEN[service] || !ENDPOINT_READY;
    document.querySelector(auth.codeForm).classList.add("hidden");
    document.querySelector(auth.dashboard).classList.add("hidden");
    document.querySelector(auth.authPanel).classList.remove("hidden");
    hideMessage(auth.authMessage);

    if (service === "scholarship") {
      resetApplicationForm();
      hideMessage(SELECTORS.applyMessage);
    } else {
      hideMessage(SELECTORS.certificateActionMessage);
    }

    document.querySelector(auth.emailInput).focus();
  }

  function showLocalPreview(service) {
    const state = serviceState[service];
    state.email = "student@jbnu.ac.kr";
    state.sessionToken = "";
    state.previewMode = true;
    state.benefits =
      service === "certificate"
        ? {
            name: "김학생",
            basic: {
              status: "이수",
              date: "2026-08-20",
              certificate_url: "",
              certificate_number: "",
              can_issue: true
            },
            intermediate: {
              status: "심사중",
              date: "-",
              certificate_url: "",
              certificate_number: "",
              can_issue: false
            }
          }
        : {
            name: "김학생",
            scholarship: {
              eligibility: "대상",
              round: "2026학년도 1차",
              application_status: "신청 전",
              can_apply: true,
              guidance: "장학금 대상자로 확인되었습니다. 계좌정보와 통장사본을 제출해주세요."
            }
          };
    renderServiceDashboard(service);
  }

  async function issueCertificate(level) {
    const state = serviceState.certificate;
    const button = document.querySelector(`#${level}-certificate-issue`);
    const levelLabel = level === "basic" ? "초급" : "중급";
    hideMessage(SELECTORS.certificateActionMessage);
    setCertificateButtonLoading(button, true, `${levelLabel} 이수증 생성 중`);

    try {
      if (state.previewMode) {
        await Promise.resolve();
        state.benefits[level] = {
          ...state.benefits[level],
          certificate_number: level === "basic" ? "2026-초-0001" : "2026-중-0001",
          can_issue: true
        };
        renderCompletion(level, state.benefits[level]);
        showMessage(
          SELECTORS.certificateActionMessage,
          "미리보기 완료: 실제 이수증 파일은 생성되거나 저장되지 않았습니다.",
          "success"
        );
        return;
      }

      const result = await postJson({
        action: "issueCertificate",
        session_token: state.sessionToken,
        level
      });
      ensureSuccess(result);
      const certificateFile = createCertificateObjectUrl(result.certificate);
      releaseCertificateObjectUrl(level);
      state.certificateFiles[level] = certificateFile;
      state.benefits = result.benefits || state.benefits;
      renderCompletion("basic", state.benefits.basic || {});
      renderCompletion("intermediate", state.benefits.intermediate || {});

    } catch (error) {
      console.error("Certificate issuance failed:", error);
      showMessage(
        SELECTORS.certificateActionMessage,
        getFriendlyMessage(error),
        "error"
      );
    } finally {
      setCertificateButtonLoading(
        button,
        false,
        `${levelLabel} 이수증 발급`
      );
    }
  }

  function setCertificateButtonLoading(button, isLoading, label) {
    button.disabled = isLoading;
    button.classList.toggle("is-submitting", isLoading);
    button.querySelector("[data-button-text]").textContent = label;
  }

  function createCertificateObjectUrl(certificateValue) {
    const certificate = certificateValue || {};
    const mimeType = String(certificate.mime_type || "").toLowerCase();
    const base64 = String(certificate.base64 || "").trim();
    const declaredSize = Number(certificate.byte_size || 0);
    if (mimeType !== "application/pdf" || !base64) {
      const error = new Error("이수증 PDF 응답이 올바르지 않습니다.");
      error.code = "invalid_certificate_file";
      throw error;
    }
    if (
      !Number.isFinite(declaredSize) ||
      declaredSize <= 0 ||
      declaredSize > MAX_CERTIFICATE_PDF_BYTES
    ) {
      const error = new Error("이수증 PDF 용량을 확인할 수 없습니다.");
      error.code = "certificate_file_too_large";
      throw error;
    }

    let binary;
    try {
      binary = window.atob(base64);
    } catch (decodeError) {
      const error = new Error("이수증 PDF를 복원하지 못했습니다.");
      error.code = "invalid_certificate_file";
      throw error;
    }
    if (binary.length !== declaredSize || binary.length > MAX_CERTIFICATE_PDF_BYTES) {
      const error = new Error("이수증 PDF 크기가 올바르지 않습니다.");
      error.code = "invalid_certificate_file";
      throw error;
    }

    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    if (
      bytes.length < 4 ||
      bytes[0] !== 0x25 ||
      bytes[1] !== 0x50 ||
      bytes[2] !== 0x44 ||
      bytes[3] !== 0x46
    ) {
      const error = new Error("전달받은 파일이 PDF 형식이 아닙니다.");
      error.code = "invalid_certificate_file";
      throw error;
    }

    const fallbackName = `${certificate.number || "이수증"}.pdf`;
    const fileName = sanitizeCertificateFileName(certificate.file_name) || fallbackName;
    return {
      url: URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })),
      fileName
    };
  }

  function releaseCertificateObjectUrl(level) {
    const file = serviceState.certificate.certificateFiles[level];
    if (file && getCertificateObjectUrl(file.url)) {
      URL.revokeObjectURL(file.url);
    }
    serviceState.certificate.certificateFiles[level] = null;
  }

  function releaseAllCertificateObjectUrls() {
    ["basic", "intermediate"].forEach(releaseCertificateObjectUrl);
  }

  function sanitizeCertificateFileName(value) {
    const fileName = String(value || "")
      .replace(/[\\/:*?"<>|]+/g, "_")
      .trim()
      .slice(0, 120);
    if (!fileName) return "";
    return fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  }

  function openScholarshipApplication() {
    const state = serviceState.scholarship;
    const canApply = Boolean(state.benefits && state.benefits.scholarship && state.benefits.scholarship.can_apply);
    if (!canApply) return;

    hideMessage(SELECTORS.applyMessage);
    document.querySelector(SELECTORS.applyButton).classList.add("hidden");
    document.querySelector(SELECTORS.applicationForm).classList.remove("hidden");
    document.querySelector(SELECTORS.bankName).focus();
  }

  function closeScholarshipApplication() {
    const state = serviceState.scholarship;
    resetApplicationForm();
    const canApply = Boolean(state.benefits && state.benefits.scholarship && state.benefits.scholarship.can_apply);
    document.querySelector(SELECTORS.applyButton).classList.toggle("hidden", !canApply);
  }

  async function submitScholarshipApplication(event) {
    event.preventDefault();
    const state = serviceState.scholarship;
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
        showMessage(SELECTORS.applyMessage, "미리보기 완료: 실제 정보와 파일은 전송되거나 저장되지 않았습니다.", "success");
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
        file: { name: file.name, mime_type: mimeType, size: file.size, base64: fileBase64 }
      });
      ensureSuccess(result);
      state.benefits = result.benefits || state.benefits;
      resetApplicationForm();
      renderScholarship(state.benefits.scholarship || {});
      showMessage(SELECTORS.applyMessage, "장학금 신청서와 통장사본이 정상적으로 접수되었습니다.", "success");
    } catch (error) {
      console.error("Scholarship application failed:", error);
      showMessage(SELECTORS.applyMessage, getFriendlyMessage(error), "error");
    } finally {
      document.querySelector(SELECTORS.applicationCancel).disabled = false;
      setButtonLoading(SELECTORS.applicationSubmit, form, false, "제출 중", "신청서 제출");
    }
  }

  function resetApplicationForm() {
    const form = document.querySelector(SELECTORS.applicationForm);
    form.reset();
    form.classList.add("hidden");
    form.classList.remove("was-validated", "is-submitting");
    document.querySelector(SELECTORS.accountNumber).setCustomValidity("");
    document.querySelector(SELECTORS.bankbookFile).setCustomValidity("");
    document.querySelector(SELECTORS.fileGuidance).textContent = "PDF, JPG, PNG 파일만 가능하며 최대 5MB까지 제출할 수 있습니다.";
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
    return reportedType && Object.values(BANKBOOK_MIME_BY_EXTENSION).includes(reportedType) ? reportedType : inferredType;
  }

  function formatFileSize(bytes) {
    return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)}MB` : `${Math.ceil(bytes / 1024)}KB`;
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
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);
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
    if (error.code === "invalid_request") return isLocalHost() ? "현재 Apps Script 배포가 이전 버전입니다. 새 버전으로 재배포해주세요." : "서비스 업데이트가 아직 적용되지 않았습니다. 사업단에 문의해주세요.";
    if (error.code === "invalid_code") return "인증번호가 올바르지 않거나 만료되었습니다.";
    if (error.code === "session_expired") return "인증 시간이 만료되었습니다. 이메일 인증을 다시 진행해주세요.";
    if (error.code === "completion_not_confirmed") return "사업단의 이수 확인이 완료된 후 이수증을 발급할 수 있습니다.";
    if (error.code === "certificate_not_ready") return "사업단에서 이수증 발급 정보를 입력 중입니다. 잠시 후 다시 확인해주세요.";
    if (error.code === "certificate_template_missing") return "이수증 양식 설정을 확인하고 있습니다. 사업단에 문의해주세요.";
    if (error.code === "certificate_generation_failed") return "이수증 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
    if (error.code === "certificate_file_too_large") return "이수증 PDF 용량이 너무 커서 전달할 수 없습니다. 사업단에 문의해주세요.";
    if (error.code === "invalid_certificate_file") return "이수증 PDF를 열 수 없습니다. 잠시 후 다시 시도해주세요.";
    if (error.code === "not_eligible") return "현재 장학금 신청 대상이 아닙니다.";
    if (error.code === "scholarship_applications_closed") return "현재 장학금 접수 준비 중입니다.";
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
    button.disabled = isLoading;
    form.classList.toggle("is-submitting", isLoading);
    button.querySelector("[data-button-text]").textContent = isLoading ? loadingText : idleText;
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
    element.classList.remove("benefit-badge--success", "benefit-badge--pending", "benefit-badge--info", "benefit-badge--muted", "benefit-badge--danger");
    const value = String(status || "").replace(/\s/g, "");
    let tone = "benefit-badge--muted";
    if (["이수", "이수완료", "대상", "승인", "지급완료", "신청완료"].includes(value)) tone = "benefit-badge--success";
    else if (["심사중", "발급대기", "접수", "보완요청", "신청전"].includes(value)) tone = "benefit-badge--pending";
    else if (["발급가능", "선발"].includes(value)) tone = "benefit-badge--info";
    else if (["미이수", "비대상", "반려"].includes(value)) tone = "benefit-badge--danger";
    element.classList.add(tone);
  }

  function isCompleted(status) {
    const value = String(status || "").replace(/\s/g, "");
    return value === "이수" || value === "이수완료";
  }

  function getCertificateObjectUrl(value) {
    return typeof value === "string" && value.startsWith("blob:") ? value : "";
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

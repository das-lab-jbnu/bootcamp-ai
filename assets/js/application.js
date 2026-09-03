const ProgramApplication = (() => {
  const ENDPOINT = window.getBenefitsApiEndpoint ? window.getBenefitsApiEndpoint() : "";
  const LOCAL_PREVIEW =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const URL_PARAMETERS = new URLSearchParams(window.location.search);
  const LIVE_TEST_REQUESTED =
    LOCAL_PREVIEW && URL_PARAMETERS.get("liveTest") === "1";
  const APPLICATION_TEST_KEY = URL_PARAMETERS.get("testKey") || "";
  const LIVE_TEST_MODE =
    LIVE_TEST_REQUESTED && APPLICATION_TEST_KEY.length >= 20;
  const APPLICATIONS_OPEN =
    Boolean(window.BOOTCAMP_CONFIG && window.BOOTCAMP_CONFIG.applicationsOpen) ||
    LOCAL_PREVIEW;

  const BEGINNER_PROGRAMS = [
    "[초급프로그램] AI Agent 마스터",
    "[초급프로그램] 바이브코딩 입문",
    "[초급프로그램] 생성형 AI 첫걸음: 원리부터 실전 활용까지"
  ];
  const AI_SERVICES = ["ChatGPT", "Claude", "신청하지 않음"];
  const DEFENSE_INDUSTRY_COURSE_STATUSES = ["수강완료", "수강중", "미수강"];

  const PROGRAMS = {
    "idea-contest": {
      type: "contest",
      title: "2026 전북대학교 방산 AI 아이디어 경진대회",
      label: "Defense AI Idea Challenge",
      description: "전북대학교 재학생이 방위산업 분야의 문제를 발굴하고 AI·LLM을 활용한 해결 아이디어를 제안하는 팀 경진대회입니다.",
      guidance: "팀 대표자 1명이 대표자를 포함한 3~5명의 기본정보를 제출합니다. 아이디어 제안서는 지정 양식으로 별도 제출합니다."
    },
    "ai-agent": {
      type: "course",
      title: BEGINNER_PROGRAMS[0],
      label: "40시간 초급과정",
      description: "AI Agent의 기본 개념부터 활용 흐름까지 학습하는 초급 비교과프로그램입니다.",
      guidance: "신청은 개인 단위로 진행합니다. 경진대회 참가자는 팀원별로 서로 다른 초급과정을 선택할 수 있으며, 수료 기준은 출석 80% 이상 및 미니프로젝트 제출입니다."
    },
    "vibe-coding": {
      type: "course",
      title: BEGINNER_PROGRAMS[1],
      label: "40시간 초급과정",
      description: "생성형 AI와 자연어를 활용해 아이디어를 빠르게 구현하는 바이브코딩 입문 과정입니다.",
      guidance: "신청은 개인 단위로 진행합니다. 경진대회 참가자는 팀원별로 서로 다른 초급과정을 선택할 수 있으며, 수료 기준은 출석 80% 이상 및 미니프로젝트 제출입니다."
    },
    "generative-ai": {
      type: "course",
      title: BEGINNER_PROGRAMS[2],
      label: "60시간 초급과정",
      description: "LLM·생성형 AI의 기본 개념, 작동 원리와 올바른 활용 방법을 배우는 초급과정입니다.",
      guidance: "신청은 개인 단위로 진행합니다. 경진대회 참가자는 팀원별로 서로 다른 초급과정을 선택할 수 있으며, 수료 기준은 전체 진도율 80% 이상입니다."
    }
  };

  const SELECTORS = {
    form: "#application-form",
    title: "#application-title",
    typeLabel: "#application-type-label",
    description: "#application-description",
    guidance: "#application-guidance",
    liveTestNotice: "#live-test-notice",
    slug: "#program-slug",
    defenseIndustryCourseField: "#defense-industry-course-field",
    contestEntryType: "#contest-entry-type",
    contestIndividualFields: "#contest-individual-fields",
    ideaInterestFields: "[data-idea-interest]",
    ideaInterestGuidance: "#idea-interest-guidance",
    contestFields: "#contest-fields",
    courseFields: "#course-fields",
    members: "#team-members",
    addMember: "#add-team-member",
    message: "#application-message",
    submit: "#application-submit"
  };

  let currentProgram = null;
  let memberSequence = 0;
  let applicationComplete = false;

  function init() {
    const form = document.querySelector(SELECTORS.form);
    if (!form) return;

    const slug = new URLSearchParams(window.location.search).get("program") || "";
    currentProgram = PROGRAMS[slug] || null;
    if (!currentProgram) {
      showInvalidProgram();
      return;
    }

    document.title = `${currentProgram.title} 접수 | 전북대 방산 AI 부트캠프`;
    document.querySelector(SELECTORS.title).textContent = currentProgram.title;
    document.querySelector(SELECTORS.typeLabel).textContent = currentProgram.label;
    document.querySelector(SELECTORS.description).textContent = currentProgram.description;
    document.querySelector(SELECTORS.guidance).textContent = currentProgram.guidance;
    document.querySelector(SELECTORS.slug).value = slug;
    configureLiveTestNotice();

    if (currentProgram.type === "contest") {
      setupContestForm();
    } else {
      setupCourseForm();
    }

    if (!APPLICATIONS_OPEN) {
      setApplicationPending(form);
      return;
    }
    form.addEventListener("submit", submitApplication);
  }

  function setApplicationPending(form) {
    form.querySelectorAll("input, select, textarea, button").forEach((element) => {
      const isContestTypePreview =
        currentProgram &&
        currentProgram.type === "contest" &&
        element.matches('[name="contest_entry_type"]');
      element.disabled = !isContestTypePreview;
    });
    const submitText = form.querySelector("[data-submit-text]");
    if (submitText) submitText.textContent = "접수예정";
    const message = document.querySelector(SELECTORS.message);
    message.textContent = "현재 모집예정 상태입니다. 접수 일정이 확정되면 신청할 수 있습니다.";
    message.classList.remove("hidden", "bg-red-50", "text-red-700", "bg-emerald-50", "text-emerald-800");
    message.classList.add("bg-slate-100", "text-slate-700");
  }

  function setupContestForm() {
    const entryTypeSection = document.querySelector(SELECTORS.contestEntryType);
    const contestFields = document.querySelector(SELECTORS.contestFields);
    entryTypeSection.classList.remove("hidden");
    document.querySelector(SELECTORS.defenseIndustryCourseField).classList.remove("hidden");
    document.querySelector("#defense-industry-course-status").required = true;
    document.querySelector("#department-label").textContent = "학과";

    entryTypeSection.querySelectorAll('[name="contest_entry_type"]').forEach((radio) => {
      radio.addEventListener("change", updateContestEntryType);
    });
    document.querySelectorAll(SELECTORS.ideaInterestFields).forEach((checkbox) => {
      checkbox.addEventListener("change", handleIdeaInterestChange);
    });
    document.querySelector(SELECTORS.addMember).addEventListener("click", addMember);
    addMember();
    addMember();

    const requestedEntryType = new URLSearchParams(window.location.search).get("entry");
    if (requestedEntryType === "individual") {
      entryTypeSection.querySelector('[value="individual"]').checked = true;
    }
    updateContestEntryType();
  }

  function configureLiveTestNotice() {
    if (!LIVE_TEST_REQUESTED) return;
    const notice = document.querySelector(SELECTORS.liveTestNotice);
    notice.classList.remove("hidden");
    if (LIVE_TEST_MODE) {
      notice.textContent =
        "로컬 실전 테스트 모드입니다. 접수하기를 누르면 입력 정보가 실제 Google Sheet에 저장되고 접수 확인 이메일이 발송됩니다.";
      notice.classList.add("border-red-300", "bg-red-50", "text-red-800");
      return;
    }
    notice.textContent =
      "실전 테스트 키가 없거나 올바르지 않습니다. 현재 제출은 미리보기로만 처리되며 Google Sheet에 저장되지 않습니다.";
    notice.classList.add("border-amber-300", "bg-amber-50", "text-amber-900");
  }

  function updateContestEntryType() {
    const selected = document.querySelector('[name="contest_entry_type"]:checked');
    const entryType = selected ? selected.value : "team";
    const isTeam = entryType === "team";
    const contestFields = document.querySelector(SELECTORS.contestFields);
    const individualFields = document.querySelector(SELECTORS.contestIndividualFields);
    const securityWrap = document.querySelector("#security-pledge-wrap");
    const securityPledge = document.querySelector("#security-pledge");

    contestFields.classList.toggle("hidden", !isTeam);
    individualFields.classList.toggle("hidden", isTeam);
    setRequired(contestFields, isTeam);
    securityWrap.classList.toggle("hidden", !isTeam);
    securityPledge.required = isTeam;
    if (!isTeam) securityPledge.checked = false;

    document.querySelector("#common-info-title").textContent =
      isTeam ? "대표자 기본정보" : "개인 신청자 기본정보";
    document.querySelector("#applicant-role-help").textContent = isTeam
      ? "팀 대표자 본인의 정보를 입력해주세요."
      : "팀 매칭 안내를 받을 학생 본인의 정보를 입력해주세요.";
    document.querySelector(SELECTORS.guidance).textContent = isTeam
      ? "팀 대표자 1명이 대표자를 포함한 3~5명의 기본정보를 제출합니다. 아이디어 제안서는 지정 양식으로 별도 제출합니다."
      : "아직 팀을 편성하지 못한 학생은 개인 기본정보를 제출하면 사업단에서 팀 매칭 절차를 별도로 안내합니다.";
    validateIdeaInterestFields();
  }

  function handleIdeaInterestChange(event) {
    const selectedCheckbox = event.currentTarget;
    const checkboxes = Array.from(document.querySelectorAll(SELECTORS.ideaInterestFields));
    const undecided = checkboxes.find((checkbox) => checkbox.hasAttribute("data-undecided"));

    if (selectedCheckbox === undecided && selectedCheckbox.checked) {
      checkboxes.forEach((checkbox) => {
        if (checkbox !== undecided) checkbox.checked = false;
      });
    } else if (selectedCheckbox.checked && undecided) {
      undecided.checked = false;
    }

    const selected = checkboxes.filter((checkbox) => checkbox.checked);
    if (selected.length > 2) {
      selectedCheckbox.checked = false;
      setIdeaInterestGuidance("관심 분야는 최대 2개까지 선택할 수 있습니다.", true);
      return;
    }
    validateIdeaInterestFields();
  }

  function validateIdeaInterestFields() {
    const checkboxes = Array.from(document.querySelectorAll(SELECTORS.ideaInterestFields));
    if (!checkboxes.length) return true;
    const selectedEntryType = document.querySelector('[name="contest_entry_type"]:checked');
    const isIndividual =
      currentProgram &&
      currentProgram.type === "contest" &&
      selectedEntryType &&
      selectedEntryType.value === "individual";
    const selected = checkboxes.filter((checkbox) => checkbox.checked);
    const isValid = !isIndividual || (selected.length >= 1 && selected.length <= 2);

    checkboxes[0].setCustomValidity(
      isValid ? "" : "관심 있는 아이디어 분야를 1개 이상 선택해주세요."
    );
    setIdeaInterestGuidance(
      isValid
        ? "※ 팀 매칭을 위한 참고자료로 활용되며, 최대 2개까지 선택할 수 있습니다."
        : "관심 있는 아이디어 분야를 1개 이상 선택해주세요.",
      !isValid
    );
    return isValid;
  }

  function setIdeaInterestGuidance(message, isError) {
    const guidance = document.querySelector(SELECTORS.ideaInterestGuidance);
    guidance.textContent = message;
    guidance.classList.toggle("font-semibold", isError);
    guidance.classList.toggle("text-red-700", isError);
    guidance.classList.toggle("text-slate-600", !isError);
  }

  function setupCourseForm() {
    const courseFields = document.querySelector(SELECTORS.courseFields);
    courseFields.classList.remove("hidden");
    setRequired(courseFields, true);
    document.querySelector("#ai-experience").required = false;
    fillSelect(document.querySelector("#course-ai-service"), AI_SERVICES, "희망 서비스 선택");
    bindAiEmailToggle(
      document.querySelector("#course-ai-service"),
      document.querySelector("#course-ai-email")
    );
  }

  function addMember() {
    const container = document.querySelector(SELECTORS.members);
    if (container.children.length >= 4) return;
    memberSequence += 1;
    const card = document.createElement("fieldset");
    card.className = "grid gap-4 border border-slate-200 bg-slate-50 p-4 md:p-5";
    card.dataset.memberCard = "";
    card.innerHTML = memberCardMarkup(memberSequence);
    container.appendChild(card);

    card.querySelector("[data-remove-member]").addEventListener("click", () => {
      if (container.children.length <= 2) return;
      card.remove();
      updateMemberControls();
    });
    updateMemberControls();
  }

  function memberCardMarkup(index) {
    return `
      <div class="flex items-center justify-between gap-3">
        <legend class="font-bold text-slate-950" data-member-title>팀원</legend>
        <button class="text-sm font-semibold text-red-700 hover:underline" type="button" data-remove-member>삭제</button>
      </div>
      <div class="grid gap-4 md:grid-cols-2">
        ${memberInput(index, "student_id", "학번", "text", 20)}
        ${memberInput(index, "name", "성명", "text", 50)}
        ${memberInput(index, "phone", "전화번호", "tel", 20, "010-0000-0000")}
        ${memberInput(index, "email", "이메일", "email", 254)}
        ${memberInput(index, "department", "학과", "text", 100)}
        ${memberCourseStatusSelect(index)}
      </div>
    `;
  }

  function memberCourseStatusSelect(index) {
    const options = DEFENSE_INDUSTRY_COURSE_STATUSES
      .map((status) => `<option value="${status}">${status === "수강중" ? "현재 수강 중" : status === "수강완료" ? "수강 완료" : status}</option>`)
      .join("");
    return `
      <div class="grid gap-2">
        <label class="text-sm font-semibold text-slate-800" for="member-${index}-defense-industry-course-status">방위산업육성개론 수강 여부</label>
        <select class="apply-field" id="member-${index}-defense-industry-course-status" data-field="defense_industry_course_status" required>
          <option value="">선택</option>
          ${options}
        </select>
      </div>
    `;
  }

  function memberInput(index, field, label, type, maxLength, placeholder, value) {
    const max = maxLength ? ` maxlength="${maxLength}"` : "";
    const hint = placeholder ? ` placeholder="${placeholder}"` : "";
    const initial = value ? ` value="${value}"` : "";
    return `
      <div class="grid gap-2">
        <label class="text-sm font-semibold text-slate-800" for="member-${index}-${field}">${label}</label>
        <input class="apply-field" id="member-${index}-${field}" data-field="${field}" type="${type}"${max}${hint}${initial} required />
      </div>
    `;
  }

  function updateMemberControls() {
    const cards = Array.from(document.querySelectorAll("[data-member-card]"));
    cards.forEach((card, index) => {
      card.querySelector("[data-member-title]").textContent = `팀원 ${index + 1}`;
      const removeButton = card.querySelector("[data-remove-member]");
      removeButton.disabled = cards.length <= 2;
      removeButton.classList.toggle("invisible", cards.length <= 2);
    });
    document.querySelector(SELECTORS.addMember).disabled = cards.length >= 4;
  }

  async function submitApplication(event) {
    event.preventDefault();
    const form = event.currentTarget;
    form.classList.add("was-validated");
    resetMessage();

    const datesValid = validateMonthOrder(form);
    const ideaInterestsValid = validateIdeaInterestFields();
    if (!datesValid || !ideaInterestsValid || !form.checkValidity()) {
      form.reportValidity();
      showMessage(
        ideaInterestsValid
          ? "필수 항목과 날짜 형식을 확인해주세요."
          : "관심 있는 아이디어 분야를 1개 이상 선택해주세요.",
        "error"
      );
      return;
    }

    const payload = buildPayload(form);
    if (LOCAL_PREVIEW && !LIVE_TEST_MODE) {
      showMessage(
        "로컬 미리보기 확인이 완료되었습니다. 입력 정보는 Google Sheet로 전송되지 않았습니다.",
        "success"
      );
      return;
    }
    if (!ENDPOINT) {
      showMessage("접수 서버 주소가 설정되지 않았습니다.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const result = await postJson(payload);
      if (result.result === "duplicate" || result.code === "duplicate") {
        showMessage(result.message || "이미 접수된 신청입니다.", "error");
        return;
      }
      if (result.result !== "success") {
        throw new ErrorWithCode(result.code || "server_error", result.message || "접수에 실패했습니다.");
      }
      finishSuccess(result);
    } catch (error) {
      showMessage(getErrorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  }

  function buildPayload(form) {
    const formData = new FormData(form);
    const basicApplicant = buildBasicApplicant(formData);
    const common = {
      website: field(formData, "website"),
      privacy_consent: formData.get("privacy_consent") === "on",
      test_mode: LIVE_TEST_MODE,
      test_key: LIVE_TEST_MODE ? APPLICATION_TEST_KEY : ""
    };

    if (currentProgram.type === "contest") {
      const entryType = field(formData, "contest_entry_type") || "team";
      if (entryType === "individual") {
        return {
          action: "submitIdeaContestIndividualApplication",
          ...common,
          applicant: basicApplicant,
          idea_interest_fields: formData
            .getAll("idea_interest_fields")
            .filter((value) => typeof value === "string")
            .map((value) => value.trim())
        };
      }
      return {
        action: "submitIdeaContestApplication",
        ...common,
        security_ethics_pledge: formData.get("security_ethics_pledge") === "on",
        team_name: field(formData, "team_name"),
        idea_topic: field(formData, "idea_topic"),
        representative: basicApplicant,
        members: Array.from(document.querySelectorAll("[data-member-card]")).map(buildMember)
      };
    }

    const applicant = buildApplicant(formData);
    return {
      action: "submitProgramApplication",
      ...common,
      program: currentProgram.title,
      applicant,
      application_motivation: field(formData, "application_motivation"),
      ai_experience: field(formData, "ai_experience"),
      preferred_ai_service: field(formData, "preferred_ai_service"),
      ai_invitation_email: field(formData, "ai_invitation_email")
    };
  }

  function buildBasicApplicant(formData) {
    return {
      student_id: field(formData, "student_id"),
      name: field(formData, "name"),
      phone: field(formData, "phone"),
      email: field(formData, "email"),
      department: field(formData, "department"),
      defense_industry_course_status: field(formData, "defense_industry_course_status")
    };
  }

  function buildApplicant(formData) {
    return {
      ...buildBasicApplicant(formData),
      gender: field(formData, "gender"),
      university: field(formData, "university"),
      major_field: field(formData, "major_field"),
      course_years: field(formData, "course_years"),
      birth_date: field(formData, "birth_date"),
      admission_month: field(formData, "admission_month"),
      graduation_month: field(formData, "graduation_month")
    };
  }

  function buildMember(card) {
    const value = (name) => String(card.querySelector(`[data-field="${name}"]`)?.value || "").trim();
    return {
      student_id: value("student_id"),
      name: value("name"),
      phone: value("phone"),
      email: value("email"),
      department: value("department"),
      defense_industry_course_status: value("defense_industry_course_status")
    };
  }

  async function postJson(payload) {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 25000);
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      if (!response.ok) throw new ErrorWithCode("network_error", `HTTP ${response.status}`);
      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch (error) {
        throw new ErrorWithCode("invalid_response", "접수 서버 응답을 확인할 수 없습니다.");
      }
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function finishSuccess(result) {
    applicationComplete = true;
    const applicationId = result.application_id || "-";
    showMessage(`접수가 완료되었습니다. 접수번호: ${applicationId}`, "success");
    const form = document.querySelector(SELECTORS.form);
    form.querySelectorAll("input, select, textarea, button").forEach((element) => {
      element.disabled = true;
    });
    form.classList.remove("was-validated");
    document.querySelector(SELECTORS.message).scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function validateMonthOrder(form) {
    if (!currentProgram || currentProgram.type !== "course") return true;
    const admission = form.querySelector("#admission-month");
    const graduation = form.querySelector("#graduation-month");
    graduation.setCustomValidity(graduation.value && admission.value && graduation.value < admission.value ? "졸업연월은 입학연월 이후여야 합니다." : "");
    return !graduation.validationMessage;
  }

  function bindAiEmailToggle(serviceSelect, emailInput) {
    const update = () => {
      const needsEmail = serviceSelect.value !== "" && serviceSelect.value !== "신청하지 않음";
      emailInput.required = needsEmail;
      emailInput.disabled = serviceSelect.value === "신청하지 않음";
      if (emailInput.disabled) emailInput.value = "";
    };
    serviceSelect.addEventListener("change", update);
    update();
  }

  function fillSelect(select, options, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>${options
      .map((option) => `<option value="${option}">${option}</option>`)
      .join("")}`;
  }

  function setRequired(section, required) {
    section.querySelectorAll("input, select, textarea").forEach((fieldElement) => {
      if (fieldElement.type !== "button") fieldElement.required = required;
    });
  }

  function setSubmitting(isSubmitting) {
    const form = document.querySelector(SELECTORS.form);
    const button = document.querySelector(SELECTORS.submit);
    const text = button.querySelector("[data-submit-text]");
    button.disabled = applicationComplete || isSubmitting;
    form.classList.toggle("is-submitting", isSubmitting);
    text.textContent = applicationComplete ? "접수완료" : isSubmitting ? "접수 중" : "접수하기";
  }

  function showMessage(message, type) {
    const element = document.querySelector(SELECTORS.message);
    element.textContent = message;
    element.classList.remove("hidden", "bg-red-50", "text-red-700", "bg-emerald-50", "text-emerald-800");
    element.classList.add(type === "success" ? "bg-emerald-50" : "bg-red-50");
    element.classList.add(type === "success" ? "text-emerald-800" : "text-red-700");
  }

  function resetMessage() {
    const element = document.querySelector(SELECTORS.message);
    element.textContent = "";
    element.classList.add("hidden");
  }

  function showInvalidProgram() {
    document.querySelector(SELECTORS.title).textContent = "신청할 프로그램을 찾을 수 없습니다.";
    document.querySelector(SELECTORS.description).textContent = "프로그램 목록에서 접수하기 버튼을 다시 선택해주세요.";
    document.querySelector(SELECTORS.form).hidden = true;
  }

  function getErrorMessage(error) {
    const code = error && error.code ? error.code : "";
    if (code === "duplicate") return error.message || "이미 접수된 신청입니다.";
    if (code === "invalid_applicant" || code === "invalid_team" || code === "invalid_request") {
      return error.message || "입력 내용을 확인해주세요.";
    }
    if (code === "consent_required") return "필수 동의 항목을 확인해주세요.";
    if (code === "invalid_program") return "현재 신청할 수 없는 프로그램입니다.";
    if (code === "applications_not_open") {
      return LIVE_TEST_REQUESTED
        ? "Apps Script의 테스트 키가 일치하지 않습니다. 테스트 키 생성과 웹 앱 새 버전 배포 여부를 확인해주세요."
        : "현재 모집예정 상태입니다.";
    }
    if (error && error.name === "AbortError") return "접수 확인 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
    return "접수 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  function field(formData, name) {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  }

  class ErrorWithCode extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", ProgramApplication.init);

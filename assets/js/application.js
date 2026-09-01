const ProgramApplication = (() => {
  const ENDPOINT = window.getBenefitsApiEndpoint ? window.getBenefitsApiEndpoint() : "";
  const APPLICATIONS_OPEN = false;

  const BEGINNER_PROGRAMS = [
    "[초급프로그램] AI Agent 마스터",
    "[초급프로그램] 바이브코딩 입문",
    "[초급프로그램] 생성형 AI의 기본 개념·작동 원리·활용"
  ];
  const AI_SERVICES = ["ChatGPT", "Claude", "Gemini", "서비스 종류 무관", "신청하지 않음"];

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
      guidance: "신청은 개인 단위로 진행합니다. 경진대회 참가자는 팀원별로 서로 다른 초급과정을 선택할 수 있으며, 수료 기준은 전체 진도율 80% 이상입니다."
    },
    "vibe-coding": {
      type: "course",
      title: BEGINNER_PROGRAMS[1],
      label: "40시간 초급과정",
      description: "생성형 AI와 자연어를 활용해 아이디어를 빠르게 구현하는 바이브코딩 입문 과정입니다.",
      guidance: "신청은 개인 단위로 진행합니다. 경진대회 참가자는 팀원별로 서로 다른 초급과정을 선택할 수 있으며, 수료 기준은 전체 진도율 80% 이상입니다."
    },
    "generative-ai": {
      type: "course",
      title: BEGINNER_PROGRAMS[2],
      label: "40시간 초급과정",
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
    slug: "#program-slug",
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
      element.disabled = true;
    });
    const submitText = form.querySelector("[data-submit-text]");
    if (submitText) submitText.textContent = "접수예정";
    const message = document.querySelector(SELECTORS.message);
    message.textContent = "현재 모집예정 상태입니다. 접수 일정이 확정되면 신청할 수 있습니다.";
    message.classList.remove("hidden", "bg-red-50", "text-red-700", "bg-emerald-50", "text-emerald-800");
    message.classList.add("bg-slate-100", "text-slate-700");
  }

  function setupContestForm() {
    const contestFields = document.querySelector(SELECTORS.contestFields);
    contestFields.classList.remove("hidden");
    setRequired(contestFields, true);
    document.querySelector("#applicant-role-help").textContent = "팀 대표자 본인의 정보를 입력해주세요.";
    document.querySelector("#department-label").textContent = "학과";

    document.querySelector("#security-pledge-wrap").classList.remove("hidden");
    document.querySelector("#security-pledge").required = true;
    document.querySelector(SELECTORS.addMember).addEventListener("click", addMember);
    addMember();
    addMember();
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
    if (!datesValid || !form.checkValidity()) {
      form.reportValidity();
      showMessage("필수 항목과 날짜 형식을 확인해주세요.", "error");
      return;
    }
    if (!ENDPOINT) {
      showMessage("접수 서버 주소가 설정되지 않았습니다.", "error");
      return;
    }

    const payload = buildPayload(form);
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
      privacy_consent: formData.get("privacy_consent") === "on"
    };

    if (currentProgram.type === "contest") {
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
      department: field(formData, "department")
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
      department: value("department")
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

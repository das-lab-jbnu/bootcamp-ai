const ApplicationManagement = (() => {
  const ENDPOINT = window.getBenefitsApiEndpoint
    ? window.getBenefitsApiEndpoint()
    : "";
  const DEFENSE_STATUSES = ["수강완료", "수강중", "미수강"];
  const IDEA_INTERESTS = [
    "방산 제조 및 품질관리",
    "정비 및 군수지원",
    "공급망 및 산업 생태계",
    "안전 및 위험관리",
    "교육훈련 및 지식관리",
    "정보보안 및 AI 신뢰성",
    "아직 정하지 못함"
  ];
  const GENDERS = ["남성", "여성"];
  const MAJOR_FIELDS = ["공학", "예체능", "자연과학", "의학", "인문사회"];
  const COURSE_YEARS = ["2년", "3년", "4년", "5년", "6년"];
  const AI_SERVICES = ["ChatGPT", "Claude", "신청하지 않음"];

  const SELECTORS = {
    emailForm: "#email-form",
    email: "#lookup-email",
    sendCodeButton: "#send-code-button",
    codeForm: "#code-form",
    code: "#verification-code",
    verifyCodeButton: "#verify-code-button",
    statusMessage: "#status-message",
    results: "#status-results",
    list: "#status-list",
    refreshButton: "#refresh-button",
    editModal: "#edit-modal",
    editDialog: ".apply-modal__dialog",
    editForm: "#edit-form",
    editFields: "#edit-fields",
    editDescription: "#edit-modal-description",
    editMessage: "#edit-message",
    editSubmit: "#edit-submit",
    editClose: "[data-edit-close]"
  };

  let sessionToken = "";
  let applications = [];
  let activeApplication = null;
  let activeEditButton = null;

  function init() {
    const emailForm = document.querySelector(SELECTORS.emailForm);
    const codeForm = document.querySelector(SELECTORS.codeForm);
    const editForm = document.querySelector(SELECTORS.editForm);
    if (!emailForm || !codeForm || !editForm) return;

    emailForm.addEventListener("submit", sendVerificationCode);
    codeForm.addEventListener("submit", verifyCode);
    editForm.addEventListener("submit", updateApplication);
    document.querySelector(SELECTORS.refreshButton).addEventListener("click", refreshApplications);
    document.querySelector(SELECTORS.list).addEventListener("click", handleListClick);
    document.querySelectorAll(SELECTORS.editClose).forEach((button) => {
      button.addEventListener("click", closeEditModal);
    });
    document.addEventListener("keydown", handleKeydown);
  }

  async function sendVerificationCode(event) {
    event.preventDefault();
    const form = event.currentTarget;
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage(SELECTORS.statusMessage, "이메일 형식을 확인해주세요.", "error");
      return;
    }
    if (!ENDPOINT) {
      showMessage(SELECTORS.statusMessage, "접수 관리 서버 주소가 설정되지 않았습니다.", "error");
      return;
    }

    resetManagementSession();
    setLoading(SELECTORS.sendCodeButton, true, "발송 중", "인증번호 받기");
    try {
      const email = document.querySelector(SELECTORS.email).value.trim();
      const result = await postJson({ action: "sendApplicationCode", email });
      document.querySelector(SELECTORS.codeForm).classList.remove("hidden");
      document.querySelector(SELECTORS.code).focus();
      showMessage(
        SELECTORS.statusMessage,
        result.message || "신청 내역이 있는 이메일인 경우 인증번호가 발송되었습니다.",
        "success"
      );
    } catch (error) {
      showMessage(SELECTORS.statusMessage, getErrorMessage(error), "error");
    } finally {
      setLoading(SELECTORS.sendCodeButton, false, "발송 중", "인증번호 받기");
    }
  }

  async function verifyCode(event) {
    event.preventDefault();
    const form = event.currentTarget;
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage(SELECTORS.statusMessage, "인증번호 6자리를 확인해주세요.", "error");
      return;
    }

    setLoading(SELECTORS.verifyCodeButton, true, "인증 중", "인증하기");
    try {
      const result = await postJson({
        action: "verifyApplicationCode",
        email: document.querySelector(SELECTORS.email).value.trim(),
        code: document.querySelector(SELECTORS.code).value.trim()
      });
      sessionToken = result.session_token || "";
      applications = Array.isArray(result.applications) ? result.applications : [];
      renderApplications();
      lockVerificationForms();
      showMessage(
        SELECTORS.statusMessage,
        applications.length
          ? `${applications.length}건의 신규 신청 내역을 확인했습니다.`
          : "신규 신청 내역이 없습니다.",
        applications.length ? "success" : "error"
      );
    } catch (error) {
      showMessage(SELECTORS.statusMessage, getErrorMessage(error), "error");
    } finally {
      setLoading(SELECTORS.verifyCodeButton, false, "인증 중", "인증하기");
    }
  }

  function lockVerificationForms() {
    document.querySelectorAll(`${SELECTORS.emailForm} input, ${SELECTORS.emailForm} button, ${SELECTORS.codeForm} input, ${SELECTORS.codeForm} button`).forEach((element) => {
      element.disabled = true;
    });
  }

  function resetManagementSession() {
    sessionToken = "";
    applications = [];
    activeApplication = null;
    document.querySelector(SELECTORS.results).classList.add("hidden");
    document.querySelector(SELECTORS.list).innerHTML = "";
    document.querySelector(SELECTORS.codeForm).classList.add("hidden");
    document.querySelector(SELECTORS.code).value = "";
  }

  async function refreshApplications() {
    if (!sessionToken) return;
    const button = document.querySelector(SELECTORS.refreshButton);
    button.disabled = true;
    try {
      const result = await postJson({
        action: "getApplications",
        session_token: sessionToken
      });
      applications = Array.isArray(result.applications) ? result.applications : [];
      renderApplications();
      showMessage(SELECTORS.statusMessage, "최신 신청 상태를 불러왔습니다.", "success");
    } catch (error) {
      showMessage(SELECTORS.statusMessage, getErrorMessage(error), "error");
    } finally {
      button.disabled = false;
    }
  }

  function renderApplications() {
    const results = document.querySelector(SELECTORS.results);
    const list = document.querySelector(SELECTORS.list);
    results.classList.toggle("hidden", applications.length === 0);
    list.innerHTML = applications.map((application) => {
      const canManage = application.can_manage === true;
      return `
        <tr>
          <td class="whitespace-nowrap px-4 py-3 text-slate-700">${escapeHtml(application.application_id)}</td>
          <td class="whitespace-nowrap px-4 py-3 font-semibold text-slate-900">${escapeHtml(application.application_type_label)}</td>
          <td class="min-w-64 px-4 py-3 text-slate-800">${escapeHtml(application.program)}</td>
          <td class="whitespace-nowrap px-4 py-3"><span class="inline-flex bg-slate-100 px-3 py-1 font-semibold text-slate-800">${escapeHtml(application.application_status || "접수")}</span></td>
          <td class="whitespace-nowrap px-4 py-3 text-slate-700">${escapeHtml(application.submitted_at)}</td>
          <td class="whitespace-nowrap px-4 py-3">
            ${canManage ? `
              <div class="flex gap-2">
                <button class="bg-blue-900 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800" type="button" data-edit-id="${escapeAttribute(application.application_id)}">변경</button>
                <button class="border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50" type="button" data-cancel-id="${escapeAttribute(application.application_id)}">취소</button>
              </div>
            ` : `<span class="text-xs text-slate-500">온라인 변경 불가</span>`}
          </td>
        </tr>
      `;
    }).join("");
  }

  function handleListClick(event) {
    const editButton = event.target.closest("[data-edit-id]");
    if (editButton) {
      const application = findApplication(editButton.dataset.editId);
      if (application) openEditModal(application, editButton);
      return;
    }
    const cancelButton = event.target.closest("[data-cancel-id]");
    if (cancelButton) cancelApplication(cancelButton.dataset.cancelId, cancelButton);
  }

  function findApplication(applicationId) {
    return applications.find((item) => item.application_id === applicationId);
  }

  function openEditModal(application, button) {
    activeApplication = application;
    activeEditButton = button;
    const modal = document.querySelector(SELECTORS.editModal);
    const form = document.querySelector(SELECTORS.editForm);
    form.classList.remove("was-validated");
    resetMessage(SELECTORS.editMessage);
    document.querySelector("#edit-application-id").value = application.application_id;
    document.querySelector(SELECTORS.editDescription).textContent = `${application.application_type_label} · ${application.application_id}`;
    document.querySelector(SELECTORS.editFields).innerHTML = buildEditFields(application);
    bindDynamicEditFields(application);
    modal.hidden = false;
    document.body.classList.add("apply-modal-open");
    modal.querySelector(SELECTORS.editDialog).focus();
  }

  function closeEditModal() {
    const modal = document.querySelector(SELECTORS.editModal);
    modal.hidden = true;
    document.body.classList.remove("apply-modal-open");
    document.querySelector(SELECTORS.editForm).classList.remove("was-validated");
    resetMessage(SELECTORS.editMessage);
    activeApplication = null;
    if (activeEditButton) activeEditButton.focus();
  }

  function handleKeydown(event) {
    const modal = document.querySelector(SELECTORS.editModal);
    if (event.key === "Escape" && modal && !modal.hidden) closeEditModal();
  }

  function buildEditFields(application) {
    if (application.application_type === "team") return buildTeamFields(application.data || {});
    if (application.application_type === "individual") return buildIndividualFields(application.data || {});
    return buildProgramFields(application);
  }

  function buildTeamFields(data) {
    const representative = data.representative || {};
    const members = Array.isArray(data.members) ? data.members : [];
    return `
      <section class="grid gap-4 border-b border-slate-200 pb-5">
        <h3 class="text-lg font-bold text-slate-950">팀 신청정보</h3>
        <div class="grid gap-4 md:grid-cols-2">
          ${inputField("team_name", "팀명", data.team_name, "text", "required minlength=\"2\" maxlength=\"60\"")}
          ${readonlyField("representative_email", "대표자 이메일", representative.email)}
        </div>
        ${textareaField("idea_topic", "아이디어 주제", data.idea_topic, 600, true)}
      </section>
      <section class="grid gap-4 border-b border-slate-200 pb-5">
        <h3 class="text-lg font-bold text-slate-950">대표자 정보</h3>
        <div class="grid gap-4 md:grid-cols-2">
          ${contestParticipantFields("representative", representative, true)}
        </div>
      </section>
      <section class="grid gap-4">
        <div>
          <h3 class="text-lg font-bold text-slate-950">팀원 정보</h3>
          <p class="mt-1 text-sm text-slate-600">온라인에서는 현재 팀원 수를 유지한 상태로 정보만 변경할 수 있습니다.</p>
        </div>
        ${members.map((member, index) => `
          <div class="grid gap-4 border border-slate-200 bg-slate-50 p-4" data-edit-member>
            <h4 class="font-bold text-slate-900">팀원 ${index + 1}</h4>
            <div class="grid gap-4 md:grid-cols-2">${contestParticipantFields(`member_${index}`, member, false)}</div>
          </div>
        `).join("")}
      </section>
    `;
  }

  function buildIndividualFields(data) {
    const applicant = data.applicant || {};
    const selected = Array.isArray(data.idea_interest_fields) ? data.idea_interest_fields : [];
    return `
      <section class="grid gap-4">
        <h3 class="text-lg font-bold text-slate-950">개인 신청정보</h3>
        <div class="grid gap-4 md:grid-cols-2">
          ${contestParticipantFields("applicant", applicant, true)}
        </div>
        <fieldset class="grid gap-3 border-t border-slate-200 pt-4">
          <legend class="font-semibold text-slate-900">관심 있는 아이디어 분야 · 최대 2개</legend>
          <div class="grid gap-2 md:grid-cols-2">
            ${IDEA_INTERESTS.map((interest) => `
              <label class="benefit-consent">
                <input name="idea_interest_fields" type="checkbox" value="${escapeAttribute(interest)}" data-edit-interest ${selected.includes(interest) ? "checked" : ""} />
                <span>${escapeHtml(interest)}</span>
              </label>
            `).join("")}
          </div>
          <p class="text-sm text-slate-600" id="edit-interest-message">팀 매칭을 위한 참고자료로 활용됩니다.</p>
        </fieldset>
      </section>
    `;
  }

  function buildProgramFields(application) {
    const data = application.data || {};
    const applicant = data.applicant || {};
    return `
      <section class="grid gap-4">
        ${readonlyField("program", "신청과정", application.program)}
        <div class="grid gap-4 md:grid-cols-2">
          ${inputField("student_id", "학번", applicant.student_id, "text", "required maxlength=\"20\"")}
          ${inputField("name", "성명", applicant.name, "text", "required maxlength=\"50\"")}
          ${inputField("phone", "전화번호", applicant.phone, "tel", "required maxlength=\"20\"")}
          ${readonlyField("email", "신청 이메일", applicant.email)}
          ${selectField("gender", "성별", GENDERS, applicant.gender, true)}
          ${inputField("university", "대학명", applicant.university, "text", "required maxlength=\"100\"")}
          ${inputField("department", "소속학과(전공)", applicant.department, "text", "required maxlength=\"100\"")}
          ${selectField("major_field", "전공분야", MAJOR_FIELDS, applicant.major_field, true)}
          ${selectField("course_years", "수업연한", COURSE_YEARS, applicant.course_years, true)}
          ${inputField("birth_date", "생년월일", applicant.birth_date, "date", "required")}
          ${inputField("admission_month", "입학연월", applicant.admission_month, "month", "required")}
          ${inputField("graduation_month", "졸업연월", applicant.graduation_month, "month", "required")}
        </div>
        ${textareaField("application_motivation", "수강 목적", data.application_motivation, 1000, true)}
        ${textareaField("ai_experience", "AI 활용 경험", data.ai_experience, 1000, false)}
        <div class="grid gap-4 md:grid-cols-2">
          ${selectField("preferred_ai_service", "생성형 AI 서비스 지원", AI_SERVICES, data.preferred_ai_service, true)}
          ${inputField("ai_invitation_email", "AI 서비스 초대용 이메일", data.ai_invitation_email, "email", "maxlength=\"254\"")}
        </div>
      </section>
    `;
  }

  function contestParticipantFields(prefix, participant, emailReadonly) {
    return `
      ${inputField(`${prefix}_name`, "성명", participant.name, "text", "required maxlength=\"50\"")}
      ${inputField(`${prefix}_student_id`, "학번", participant.student_id, "text", "required maxlength=\"20\"")}
      ${inputField(`${prefix}_phone`, "전화번호", participant.phone, "tel", "required maxlength=\"20\"")}
      ${emailReadonly
        ? readonlyField(`${prefix}_email`, "이메일", participant.email)
        : inputField(`${prefix}_email`, "이메일", participant.email, "email", "required maxlength=\"254\"")}
      ${inputField(`${prefix}_department`, "학과", participant.department, "text", "required maxlength=\"100\"")}
      ${selectField(`${prefix}_defense_status`, "방위산업육성개론 수강 여부", DEFENSE_STATUSES, participant.defense_industry_course_status, true)}
    `;
  }

  function inputField(name, label, value, type, attributes) {
    return `<div class="grid gap-2"><label class="text-sm font-semibold text-slate-800" for="edit-${escapeAttribute(name)}">${escapeHtml(label)}</label><input class="apply-field" id="edit-${escapeAttribute(name)}" name="${escapeAttribute(name)}" type="${escapeAttribute(type)}" value="${escapeAttribute(value)}" ${attributes || ""} /></div>`;
  }

  function readonlyField(name, label, value) {
    return `<div class="grid gap-2"><label class="text-sm font-semibold text-slate-800" for="edit-${escapeAttribute(name)}">${escapeHtml(label)}</label><input class="apply-field bg-slate-100 text-slate-700" id="edit-${escapeAttribute(name)}" name="${escapeAttribute(name)}" type="text" value="${escapeAttribute(value)}" readonly /></div>`;
  }

  function selectField(name, label, options, selected, required) {
    return `<div class="grid gap-2"><label class="text-sm font-semibold text-slate-800" for="edit-${escapeAttribute(name)}">${escapeHtml(label)}</label><select class="apply-field" id="edit-${escapeAttribute(name)}" name="${escapeAttribute(name)}" ${required ? "required" : ""}><option value="">선택</option>${options.map((option) => `<option value="${escapeAttribute(option)}" ${option === selected ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}</select></div>`;
  }

  function textareaField(name, label, value, maxLength, required) {
    return `<div class="grid gap-2"><label class="text-sm font-semibold text-slate-800" for="edit-${escapeAttribute(name)}">${escapeHtml(label)}</label><textarea class="apply-field min-h-28 resize-y" id="edit-${escapeAttribute(name)}" name="${escapeAttribute(name)}" maxlength="${maxLength}" ${required ? "required minlength=\"10\"" : ""}>${escapeHtml(value)}</textarea></div>`;
  }

  function bindDynamicEditFields(application) {
    if (application.application_type === "individual") {
      document.querySelectorAll("[data-edit-interest]").forEach((checkbox) => {
        checkbox.addEventListener("change", handleInterestChange);
      });
    }
    if (application.application_type === "program") {
      const service = document.querySelector("#edit-preferred_ai_service");
      const invitationEmail = document.querySelector("#edit-ai_invitation_email");
      const update = () => {
        const needsEmail = service.value && service.value !== "신청하지 않음";
        invitationEmail.required = needsEmail;
        invitationEmail.disabled = service.value === "신청하지 않음";
        if (invitationEmail.disabled) invitationEmail.value = "";
      };
      service.addEventListener("change", update);
      update();
    }
  }

  function handleInterestChange(event) {
    const checkboxes = Array.from(document.querySelectorAll("[data-edit-interest]"));
    const changed = event.currentTarget;
    const undecided = checkboxes.find((checkbox) => checkbox.value === "아직 정하지 못함");
    if (changed === undecided && changed.checked) {
      checkboxes.forEach((checkbox) => {
        if (checkbox !== undecided) checkbox.checked = false;
      });
    } else if (changed.checked && undecided) {
      undecided.checked = false;
    }
    const selected = checkboxes.filter((checkbox) => checkbox.checked);
    if (selected.length > 2) {
      changed.checked = false;
      showInterestMessage("관심 분야는 최대 2개까지 선택할 수 있습니다.", true);
    } else {
      showInterestMessage("팀 매칭을 위한 참고자료로 활용됩니다.", false);
    }
  }

  function showInterestMessage(message, error) {
    const element = document.querySelector("#edit-interest-message");
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("font-semibold", error);
    element.classList.toggle("text-red-700", error);
    element.classList.toggle("text-slate-600", !error);
  }

  async function updateApplication(event) {
    event.preventDefault();
    const form = event.currentTarget;
    form.classList.add("was-validated");
    if (!activeApplication) return;
    if (!validateDynamicEditForm(form, activeApplication) || !form.checkValidity()) {
      form.reportValidity();
      showMessage(SELECTORS.editMessage, "필수 항목과 입력 형식을 확인해주세요.", "error");
      return;
    }

    setLoading(SELECTORS.editSubmit, true, "저장 중", "변경 저장");
    try {
      const payload = buildEditPayload(form, activeApplication);
      const result = await postJson({
        action: "updateApplication",
        session_token: sessionToken,
        ...payload
      });
      applications = Array.isArray(result.applications) ? result.applications : [];
      renderApplications();
      showMessage(SELECTORS.statusMessage, "신청 내용이 변경되었습니다.", "success");
      closeEditModal();
    } catch (error) {
      showMessage(SELECTORS.editMessage, getErrorMessage(error), "error");
    } finally {
      setLoading(SELECTORS.editSubmit, false, "저장 중", "변경 저장");
    }
  }

  function validateDynamicEditForm(form, application) {
    if (application.application_type === "individual") {
      const selected = form.querySelectorAll("[data-edit-interest]:checked");
      if (selected.length < 1 || selected.length > 2) {
        showInterestMessage("관심 분야를 1개 이상, 최대 2개까지 선택해주세요.", true);
        return false;
      }
    }
    if (application.application_type === "program") {
      const admission = form.elements.admission_month.value;
      const graduation = form.elements.graduation_month.value;
      if (admission && graduation && graduation < admission) {
        form.elements.graduation_month.setCustomValidity("졸업연월은 입학연월 이후여야 합니다.");
        return false;
      }
      form.elements.graduation_month.setCustomValidity("");
    }
    return true;
  }

  function buildEditPayload(form, application) {
    const data = new FormData(form);
    const base = { application_id: application.application_id };
    if (application.application_type === "team") {
      return {
        ...base,
        team_name: getField(data, "team_name"),
        idea_topic: getField(data, "idea_topic"),
        representative: buildParticipant(data, "representative"),
        members: Array.from(form.querySelectorAll("[data-edit-member]")).map((card) => buildParticipantFromCard(card))
      };
    }
    if (application.application_type === "individual") {
      return {
        ...base,
        applicant: buildParticipant(data, "applicant"),
        idea_interest_fields: data.getAll("idea_interest_fields").map((value) => String(value).trim())
      };
    }
    return {
      ...base,
      applicant: {
        student_id: getField(data, "student_id"),
        name: getField(data, "name"),
        phone: getField(data, "phone"),
        email: getField(data, "email"),
        gender: getField(data, "gender"),
        university: getField(data, "university"),
        department: getField(data, "department"),
        major_field: getField(data, "major_field"),
        course_years: getField(data, "course_years"),
        birth_date: getField(data, "birth_date"),
        admission_month: getField(data, "admission_month"),
        graduation_month: getField(data, "graduation_month")
      },
      application_motivation: getField(data, "application_motivation"),
      ai_experience: getField(data, "ai_experience"),
      preferred_ai_service: getField(data, "preferred_ai_service"),
      ai_invitation_email: getField(data, "ai_invitation_email")
    };
  }

  function buildParticipant(data, prefix) {
    return {
      name: getField(data, `${prefix}_name`),
      student_id: getField(data, `${prefix}_student_id`),
      phone: getField(data, `${prefix}_phone`),
      email: getField(data, `${prefix}_email`),
      department: getField(data, `${prefix}_department`),
      defense_industry_course_status: getField(data, `${prefix}_defense_status`)
    };
  }

  function buildParticipantFromCard(card) {
    const value = (name) => String(card.querySelector(`[name$="_${name}"]`)?.value || "").trim();
    return {
      name: value("name"),
      student_id: value("student_id"),
      phone: value("phone"),
      email: value("email"),
      department: value("department"),
      defense_industry_course_status: value("defense_status")
    };
  }

  async function cancelApplication(applicationId, button) {
    const application = findApplication(applicationId);
    if (!application || !application.can_manage) return;
    const confirmed = window.confirm(`접수번호 ${applicationId} 신청을 취소하시겠습니까?\n취소 후에는 온라인에서 되돌릴 수 없습니다.`);
    if (!confirmed) return;
    button.disabled = true;
    try {
      const result = await postJson({
        action: "cancelApplication",
        session_token: sessionToken,
        application_id: applicationId
      });
      applications = Array.isArray(result.applications) ? result.applications : [];
      renderApplications();
      showMessage(SELECTORS.statusMessage, "신청이 취소되었습니다.", "success");
    } catch (error) {
      button.disabled = false;
      showMessage(SELECTORS.statusMessage, getErrorMessage(error), "error");
    }
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
      let result;
      try {
        result = JSON.parse(text);
      } catch (error) {
        throw new ErrorWithCode("invalid_response", "서버 응답을 확인할 수 없습니다.");
      }
      if (result.result !== "success") {
        throw new ErrorWithCode(result.code || "server_error", result.message || "요청을 처리하지 못했습니다.");
      }
      return result;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function getErrorMessage(error) {
    const code = error && error.code ? error.code : "";
    if (code === "invalid_code") return "인증번호가 올바르지 않거나 만료되었습니다.";
    if (code === "session_expired") return "인증 시간이 만료되었습니다. 페이지를 새로고침하고 다시 인증해주세요.";
    if (code === "application_locked") return error.message || "현재 상태에서는 온라인 변경이나 취소를 할 수 없습니다.";
    if (["invalid_request", "invalid_applicant", "invalid_team", "duplicate"].includes(code)) return error.message || "입력 내용을 확인해주세요.";
    if (error && error.name === "AbortError") return "처리 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.";
    return "처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  }

  function setLoading(buttonSelector, loading, loadingText, idleText) {
    const button = document.querySelector(buttonSelector);
    if (!button) return;
    button.disabled = loading;
    const text = button.querySelector("[data-send-code-text], [data-verify-code-text], [data-edit-text]");
    if (text) text.textContent = loading ? loadingText : idleText;
    button.closest("form")?.classList.toggle("is-submitting", loading);
  }

  function showMessage(selector, message, type) {
    const element = document.querySelector(selector);
    element.textContent = message;
    element.classList.remove("hidden", "bg-red-50", "text-red-700", "bg-emerald-50", "text-emerald-800");
    element.classList.add(type === "success" ? "bg-emerald-50" : "bg-red-50");
    element.classList.add(type === "success" ? "text-emerald-800" : "text-red-700");
  }

  function resetMessage(selector) {
    const element = document.querySelector(selector);
    element.textContent = "";
    element.classList.add("hidden");
  }

  function getField(formData, name) {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  class ErrorWithCode extends Error {
    constructor(code, message) {
      super(message);
      this.code = code;
    }
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", ApplicationManagement.init);

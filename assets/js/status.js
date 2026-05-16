const ApplicationStatus = (() => {
  const ENDPOINT =
    window.getBootcampApiEndpoint ? window.getBootcampApiEndpoint() : "";

  const SELECTORS = {
    lookupForm: "#status-form",
    lookupEmail: "#lookup-email",
    lookupSubmit: "#status-submit",
    statusMessage: "#status-message",
    results: "#status-results",
    list: "#status-list",
    editModal: "#edit-modal",
    editDialog: ".apply-modal__dialog",
    editForm: "#edit-form",
    editMessage: "#edit-message",
    editSubmit: "#edit-submit",
    editClose: "[data-edit-close]"
  };

  let applications = [];
  let activeEditButton = null;

  function init() {
    const lookupForm = document.querySelector(SELECTORS.lookupForm);
    const editForm = document.querySelector(SELECTORS.editForm);
    if (!lookupForm || !editForm) return;

    lookupForm.addEventListener("submit", lookupApplications);
    editForm.addEventListener("submit", updateApplication);
    document.querySelector(SELECTORS.list).addEventListener("click", handleListClick);
    document.querySelectorAll(SELECTORS.editClose).forEach((button) => {
      button.addEventListener("click", closeEditModal);
    });
    document.addEventListener("keydown", handleKeydown);
  }

  async function lookupApplications(event) {
    event.preventDefault();

    const form = event.currentTarget;
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage(SELECTORS.statusMessage, "이메일 형식을 확인해주세요.", "error");
      return;
    }

    setLookupLoading(true);
    resetMessage(SELECTORS.statusMessage);

    try {
      const email = document.querySelector(SELECTORS.lookupEmail).value.trim();
      const result = await getJson({ action: "status", email });
      if (result.result !== "success") {
        throw new Error(result.message || "Lookup failed");
      }

      applications = Array.isArray(result.applications) ? result.applications : [];
      renderApplications();

      if (applications.length === 0) {
        showMessage(SELECTORS.statusMessage, "해당 이메일로 신청된 내역이 없습니다.", "error");
      } else {
        showMessage(SELECTORS.statusMessage, `${applications.length}건의 신청 내역을 찾았습니다.`, "success");
      }
    } catch (error) {
      console.error("Application lookup failed:", error);
      showMessage(SELECTORS.statusMessage, "조회 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", "error");
    } finally {
      setLookupLoading(false);
    }
  }

  function renderApplications() {
    const results = document.querySelector(SELECTORS.results);
    const list = document.querySelector(SELECTORS.list);

    results.classList.toggle("hidden", applications.length === 0);
    list.innerHTML = applications
      .map(
        (application) => `
          <tr>
            <td class="px-4 py-3 text-slate-700">${escapeHtml(application.application_id)}</td>
            <td class="px-4 py-3 font-semibold text-slate-900">${escapeHtml(application.program)}</td>
            <td class="px-4 py-3 text-slate-700">${escapeHtml(application.status || "접수")}</td>
            <td class="px-4 py-3 text-slate-700">${formatTimestamp(application.timestamp)}</td>
            <td class="px-4 py-3">
              <button
                class="inline-flex items-center justify-center bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                type="button"
                data-edit-id="${escapeHtml(application.application_id)}"
              >
                수정
              </button>
            </td>
          </tr>
        `
      )
      .join("");
  }

  function handleListClick(event) {
    const button = event.target.closest("[data-edit-id]");
    if (!button) return;

    const application = applications.find((item) => item.application_id === button.dataset.editId);
    if (application) {
      openEditModal(application, button);
    }
  }

  function openEditModal(application, button) {
    const modal = document.querySelector(SELECTORS.editModal);
    const dialog = modal.querySelector(SELECTORS.editDialog);
    const form = document.querySelector(SELECTORS.editForm);

    activeEditButton = button;
    form.classList.remove("was-validated");
    resetMessage(SELECTORS.editMessage);
    setFormValue("edit-application-id", application.application_id);
    setFormValue("edit-program", application.program);
    setFormValue("edit-name", application.name);
    setFormValue("edit-student-id", application.student_id);
    setFormValue("edit-email", application.email);
    setFormValue("edit-organization", application.organization);
    setFormValue("edit-phone", application.phone);
    setFormValue("edit-motivation", application.motivation);

    modal.hidden = false;
    document.body.classList.add("apply-modal-open");
    dialog.focus();
  }

  function closeEditModal() {
    const modal = document.querySelector(SELECTORS.editModal);
    const form = document.querySelector(SELECTORS.editForm);

    modal.hidden = true;
    document.body.classList.remove("apply-modal-open");
    form.classList.remove("was-validated");
    resetMessage(SELECTORS.editMessage);

    if (activeEditButton) {
      activeEditButton.focus();
    }
  }

  function handleKeydown(event) {
    const modal = document.querySelector(SELECTORS.editModal);
    if (event.key === "Escape" && modal && !modal.hidden) {
      closeEditModal();
    }
  }

  async function updateApplication(event) {
    event.preventDefault();

    const form = event.currentTarget;
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage(SELECTORS.editMessage, "필수 항목과 이메일 형식을 확인해주세요.", "error");
      return;
    }

    setEditLoading(true);
    resetMessage(SELECTORS.editMessage);

    try {
      const result = await postJson({ action: "update", ...buildPayload(form) });
      if (result.result === "duplicate") {
        showMessage(SELECTORS.editMessage, "이미 해당 프로그램에 신청하셨습니다.", "error");
        return;
      }

      if (result.result !== "success") {
        throw new Error(result.message || "Update failed");
      }

      showMessage(SELECTORS.editMessage, "신청 내용이 수정되었습니다.", "success");
      await refreshApplications();

      window.setTimeout(() => {
        closeEditModal();
      }, 700);
    } catch (error) {
      console.error("Application update failed:", error);
      showMessage(SELECTORS.editMessage, "수정 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", "error");
    } finally {
      setEditLoading(false);
    }
  }

  async function refreshApplications() {
    const email = document.querySelector(SELECTORS.lookupEmail).value.trim();
    if (!email) return;

    const result = await getJson({ action: "status", email });
    if (result.result !== "success") {
      throw new Error(result.message || "Lookup failed");
    }

    applications = Array.isArray(result.applications) ? result.applications : [];
    renderApplications();
  }

  function buildPayload(form) {
    const formData = new FormData(form);
    return {
      application_id: getField(formData, "application_id"),
      name: getField(formData, "name"),
      student_id: getField(formData, "student_id"),
      email: getField(formData, "email"),
      organization: getField(formData, "organization"),
      phone: getField(formData, "phone"),
      program: getField(formData, "program"),
      motivation: getField(formData, "motivation")
    };
  }

  async function postJson(payload) {
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

  async function getJson(params) {
    const url = new URL(ENDPOINT);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      method: "GET"
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

  function setLookupLoading(isLoading) {
    const button = document.querySelector(SELECTORS.lookupSubmit);
    const form = document.querySelector(SELECTORS.lookupForm);
    const text = button.querySelector("[data-status-text]");

    button.disabled = isLoading;
    form.classList.toggle("is-submitting", isLoading);
    text.textContent = isLoading ? "조회 중" : "신청 조회";
  }

  function setEditLoading(isLoading) {
    const button = document.querySelector(SELECTORS.editSubmit);
    const form = document.querySelector(SELECTORS.editForm);
    const text = button.querySelector("[data-edit-text]");

    button.disabled = isLoading;
    form.classList.toggle("is-submitting", isLoading);
    text.textContent = isLoading ? "저장 중" : "수정 저장";
  }

  function setFormValue(id, value) {
    document.getElementById(id).value = value || "";
  }

  function getField(formData, name) {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  }

  function showMessage(selector, message, type) {
    const messageEl = document.querySelector(selector);
    messageEl.textContent = message;
    messageEl.classList.remove("hidden", "text-red-600", "text-green-700");
    messageEl.classList.add(type === "success" ? "text-green-700" : "text-red-600");
  }

  function resetMessage(selector) {
    const messageEl = document.querySelector(selector);
    messageEl.textContent = "";
    messageEl.classList.add("hidden");
    messageEl.classList.remove("text-red-600", "text-green-700");
  }

  function formatTimestamp(timestamp) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return escapeHtml(timestamp);
    return date.toLocaleString("ko-KR");
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", ApplicationStatus.init);

const ApplyForm = (() => {
  const ENDPOINT =
    window.getBootcampApiEndpoint ? window.getBootcampApiEndpoint() : "";

  const SELECTORS = {
    button: ".apply-btn",
    close: "[data-apply-close]",
    modal: "#apply-modal",
    dialog: ".apply-modal__dialog",
    form: "#apply-form",
    message: "#apply-message",
    program: "#program-name",
    submit: "#apply-submit"
  };

  let activeApplyButton = null;

  function init() {
    const modal = document.querySelector(SELECTORS.modal);
    const form = document.querySelector(SELECTORS.form);
    if (!modal || !form) return;

    document.querySelectorAll(SELECTORS.button).forEach((button) => {
      button.addEventListener("click", () => openModal(button));
    });

    document.querySelectorAll(SELECTORS.close).forEach((button) => {
      button.addEventListener("click", closeModal);
    });

    form.addEventListener("submit", submitApplication);
    document.addEventListener("keydown", handleKeydown);
  }

  function openModal(button) {
    const modal = document.querySelector(SELECTORS.modal);
    const dialog = modal.querySelector(SELECTORS.dialog);
    const form = document.querySelector(SELECTORS.form);
    const programInput = document.querySelector(SELECTORS.program);

    activeApplyButton = button;
    form.classList.remove("was-validated");
    resetMessage();
    programInput.value = button.dataset.program || "";
    modal.hidden = false;
    document.body.classList.add("apply-modal-open");
    dialog.focus();
  }

  function closeModal() {
    const modal = document.querySelector(SELECTORS.modal);
    const form = document.querySelector(SELECTORS.form);

    modal.hidden = true;
    document.body.classList.remove("apply-modal-open");
    form.classList.remove("was-validated");
    resetMessage();

    if (activeApplyButton) {
      activeApplyButton.focus();
    }
  }

  function handleKeydown(event) {
    const modal = document.querySelector(SELECTORS.modal);
    if (event.key === "Escape" && modal && !modal.hidden) {
      closeModal();
    }
  }

  async function submitApplication(event) {
    event.preventDefault();

    const form = event.currentTarget;
    form.classList.add("was-validated");
    if (!form.checkValidity()) {
      form.reportValidity();
      showMessage("필수 항목과 이메일 형식을 확인해주세요.", "error");
      return;
    }

    setSubmitting(true);
    resetMessage();

    try {
      const payload = buildPayload(form);
      const result = await postJson({ action: "submit", ...payload });

      if (result.result === "duplicate") {
        showMessage("이미 해당 프로그램에 신청하셨습니다.", "error");
        return;
      }

      if (result.result !== "success") {
        throw new Error(result.message || "Submit failed");
      }

      showMessage("신청이 정상적으로 접수되었습니다.", "success");
      form.reset();

      window.setTimeout(() => {
        closeModal();
      }, 900);
    } catch (error) {
      console.error("Application submit failed:", error);
      showMessage("제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function buildPayload(form) {
    const formData = new FormData(form);
    const name = getField(formData, "name");
    const studentId = getField(formData, "student_id");
    const email = getField(formData, "email");
    const organization = getField(formData, "organization");
    const phone = getField(formData, "phone");
    const program = getField(formData, "program");
    const motivation = getField(formData, "motivation");

    return {
      name,
      student_id: studentId,
      email,
      organization,
      phone,
      program,
      motivation,
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

  function getField(formData, name) {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  }

  function setSubmitting(isSubmitting) {
    const submitButton = document.querySelector(SELECTORS.submit);
    const form = document.querySelector(SELECTORS.form);
    const text = submitButton.querySelector("[data-submit-text]");

    submitButton.disabled = isSubmitting;
    form.classList.toggle("is-submitting", isSubmitting);
    text.textContent = isSubmitting ? "제출 중" : "제출하기";
  }

  function showMessage(message, type) {
    const messageEl = document.querySelector(SELECTORS.message);
    messageEl.textContent = message;
    messageEl.classList.remove("hidden", "text-red-600", "text-green-700");
    messageEl.classList.add(type === "success" ? "text-green-700" : "text-red-600");
  }

  function resetMessage() {
    const messageEl = document.querySelector(SELECTORS.message);
    messageEl.textContent = "";
    messageEl.classList.add("hidden");
    messageEl.classList.remove("text-red-600", "text-green-700");
  }

  return { init };
})();

document.addEventListener("DOMContentLoaded", ApplyForm.init);

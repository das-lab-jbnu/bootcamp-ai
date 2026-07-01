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

    let payload = null;
    try {
      payload = buildPayload(form);
      const result = await postJson({ action: "submit", ...payload });

      if (result.result === "duplicate") {
        showMessage("이미 해당 프로그램에 신청하셨습니다.", "error");
        return;
      }

      if (result.result === "closed") {
        showMessage("해당 과목은 접수가 종료되었습니다.", "error");
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
      if (payload && (await wasApplicationSaved(payload))) {
        showMessage("신청이 정상적으로 접수되었습니다.", "success");
        form.reset();

        window.setTimeout(() => {
          closeModal();
        }, 900);
        return;
      }

      showMessage("제출 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function buildPayload(form) {
    const formData = new FormData(form);
    const name = getField(formData, "name");
    const studentId = getField(formData, "student_id");
    const grade = getField(formData, "grade");
    const email = getField(formData, "email");
    const organization = getField(formData, "organization");
    const phone = getField(formData, "phone");
    const program = getField(formData, "program");
    const motivation = getField(formData, "motivation");

    return {
      name,
      student_id: studentId,
      grade,
      email,
      organization,
      phone,
      program,
      motivation,
    };
  }

  async function postJson(payload) {
    await fetch(ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload)
    });

    return {
      result: "success"
    };
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

  async function wasApplicationSaved(payload) {
    return false;
  }

  function getField(formData, name) {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  }

  function normalizeValue(value) {
    return String(value || "").trim().toLowerCase();
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

document.addEventListener("DOMContentLoaded", () => {
  renderAdminProgramsOnApplyPage();
  ApplyForm.init();
});

function renderAdminProgramsOnApplyPage() {
  const programList = document.querySelector("#program-card-list");

  if (!programList) {
    return;
  }

  const savedData = localStorage.getItem("bootcampPrograms");

  if (!savedData) {
    return;
  }

  const programs = JSON.parse(savedData);

  programList.innerHTML = "";

  Object.keys(programs).forEach((key) => {
    const program = programs[key];

    if (program.isVisible === false) {
      return;
    }

    const isOpen = program.isOpen !== false;
    const programName = program.name || key;
    const syllabusUrl = program.syllabusUrl || "#";

    const article = document.createElement("article");
    article.className =
      "border-t-2 border-slate-500 bg-slate-50 px-4 py-5 md:px-6";

    article.innerHTML = `
      <div class="grid gap-6 md:grid-cols-[150px_minmax(0,1fr)_120px] md:items-start">

        <div class="program-action-group">
          <span class="program-action ${isOpen ? "bg-emerald-600" : "bg-slate-400"} text-white">
            ${isOpen ? "모집중" : "접수종료"}
          </span>

          <a
            href="${syllabusUrl}"
            target="_blank"
            rel="noopener noreferrer"
            class="program-action border border-blue-900 bg-white text-blue-900 hover:bg-blue-50"
          >
            강의계획서
          </a>

          <button
            class="program-action ${isOpen
        ? "apply-btn bg-blue-900 hover:bg-blue-800"
        : "bg-slate-400 cursor-not-allowed"
      } text-white"
            type="button"
            data-program="${programName}"
            ${isOpen ? "" : "disabled"}
          >
            ${isOpen ? "신청하기" : "접수종료"}
          </button>
        </div>

        <div>
  <a
    href="${syllabusUrl}"
    target="_blank"
    rel="noopener noreferrer"
    class="text-2xl font-bold text-slate-900 hover:text-blue-900"
  >
    ${programName}
  </a>

  <p class="mt-1 text-lg font-bold text-slate-600">
    ${program.description || ""}
  </p>

  <div class="mt-6 grid gap-3 md:max-w-xl">
    <div class="grid grid-cols-[120px_1fr] items-center border-b border-slate-300 pb-2">
  <span class="text-sm font-semibold text-slate-800">
    접수기간
  </span>

  <span class="text-sm text-slate-800 whitespace-nowrap">
    ${program.applyStartDate || ""} ~ ${program.applyEndDate || ""}
  </span>
</div>

    <div class="grid grid-cols-[120px_1fr] items-center border-b border-slate-300 pb-2">
      <span class="text-sm font-semibold text-slate-800">
        교육기간
      </span>

      <span class="text-sm text-slate-800">
  ${Array.isArray(program.schedulePeriods) && program.schedulePeriods.length > 0
        ? program.schedulePeriods
          .map((period) => `${period.startDate || ""} ~ ${period.endDate || ""}`)
          .join("<br>")
        : `${program.startDate || ""} ~ ${program.endDate || ""}`
      }
</span>
    </div>

    <div class="grid grid-cols-[120px_1fr] items-center border-b border-slate-300 pb-2">
      <span class="text-sm font-semibold text-slate-800">
        교육시간
      </span>

      <span class="text-sm text-slate-800 whitespace-nowrap">
        ${program.time || ""}
      </span>
    </div>

  </div>

</div>

      </div>
    `;

    programList.appendChild(article);
  });
}

let currentCalendarDate = new Date(2026, 6, 1); // 2026년 7월

function formatDateKey(date) {
  return date.toISOString().slice(0, 10);
}

function getDatesBetween(start, end) {
  const dates = [];
  const current = new Date(start);
  const last = new Date(end);

  while (current <= last) {
    dates.push(formatDateKey(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

function renderCalendar() {
  const calendarArea = document.querySelector("#calendar-area");
  const calendarTitle = document.querySelector("#calendar-title");

  if (!calendarArea || !calendarTitle) return;

  const year = currentCalendarDate.getFullYear();
  const month = currentCalendarDate.getMonth();

  calendarTitle.textContent = `${year}년 ${month + 1}월`;

  const savedData = localStorage.getItem("bootcampPrograms");
  const programs = savedData ? JSON.parse(savedData) : {};

  const scheduleMap = {};

  Object.keys(programs).forEach((key) => {
    const program = programs[key];

    if (program.isVisible === false) return;

    const periods =
      Array.isArray(program.schedulePeriods) && program.schedulePeriods.length > 0
        ? program.schedulePeriods
        : [
          {
            startDate: program.startDate,
            endDate: program.endDate
          }
        ];

    periods.forEach((period) => {
      if (!period.startDate || !period.endDate) return;

      getDatesBetween(period.startDate, period.endDate).forEach((dateKey) => {
        if (!scheduleMap[dateKey]) {
          scheduleMap[dateKey] = [];
        }

        scheduleMap[dateKey].push({
          name: program.name || key,
          shortName: program.calendarName || program.name || key,
          color: program.calendarColor || "bg-slate-600"
        });
      });
    });
  });

  const firstDay = new Date(year, month, 1);
  const lastDate = new Date(year, month + 1, 0).getDate();
  const startWeekDay = firstDay.getDay();

  let html = `
    <article class="border border-slate-200 bg-slate-50 p-4">
      <div class="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-500">
        <div>일</div>
        <div>월</div>
        <div>화</div>
        <div>수</div>
        <div>목</div>
        <div>금</div>
        <div>토</div>
      </div>

      <div class="mt-1 grid grid-cols-7 gap-1 text-xs">
  `;

  for (let i = 0; i < startWeekDay; i++) {
    html += `<div class="min-h-16 bg-transparent"></div>`;
  }

  for (let day = 1; day <= lastDate; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const schedules = scheduleMap[dateKey] || [];

    html += `
      <div class="min-h-16 border border-slate-200 bg-white p-1">
        <div class="font-bold text-slate-900">${day}</div>
        <div class="mt-1 space-y-1">
          ${schedules.map((schedule) => `
            <div class="${schedule.color} px-1 py-0.5 font-bold text-white">
              ${schedule.shortName}
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  html += `
      </div>
    </article>
  `;

  calendarArea.innerHTML = html;
}

document.querySelector("#prev-month-btn")?.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
  renderCalendar();
});

document.querySelector("#next-month-btn")?.addEventListener("click", () => {
  currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
  renderCalendar();
});

renderCalendar();
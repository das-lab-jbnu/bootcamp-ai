let selectedCalendarColor = "bg-blue-600";

const ENDPOINT = window.getBootcampApiEndpoint();

const PROGRAMS = [
  "[사이버보안 Track] 방산 AI 보안",
  "[사이버보안 Track] AI 기반 자율무인체계 공방 실습",
  "[크라우드 아카데미] LLM 인스트럭션",
  "[자율이동체계 Track] 방산개방형아키텍처(MOSA SDK실습)",
  "[자율이동체계 Track] 이동형 로봇 설계",
  "[군수 AX 전환 Track] 첨단소재 군수 AX"
];

let adminPassword = "";

document.getElementById("login-btn").addEventListener("click", async () => {
  adminPassword = document.getElementById("admin-password").value.trim();

  if (!adminPassword) {
    showMessage("관리자 비밀번호를 입력하세요.");
    return;
  }

  document.getElementById("login-area").hidden = true;
  document.getElementById("admin-area").hidden = false;

  // await loadSettings();
});

async function loadSettings() {
  const result = await postJson({
    action: "getProgramSettings",
    password: adminPassword
  });

  if (result.result !== "success") {
    showMessage(result.message || "권한이 없습니다.");
    document.getElementById("login-area").hidden = false;
    document.getElementById("admin-area").hidden = true;
    return;
  }

  renderPrograms(result.settings || {});
}

function renderPrograms(settings) {
  const list = document.getElementById("program-list");
  list.innerHTML = "";

  PROGRAMS.forEach((program) => {
    const isOpen = settings[program] !== false;

    const row = document.createElement("div");
    row.style.margin = "12px 0";

    row.innerHTML = `
      <strong>${program}</strong>
      <button type="button" data-program="${program}" data-open="${isOpen}">
        ${isOpen ? "접수중" : "접수종료"}
      </button>
    `;

    row.querySelector("button").addEventListener("click", async (event) => {
      const current = event.target.dataset.open === "true";
      await updateSetting(program, !current);
    });

    list.appendChild(row);
  });
}

async function updateSetting(program, isOpen) {
  showMessage("임시 테스트 모드입니다. 실제 저장은 확인하지 않습니다.");

  const currentSettings = {};

  document.querySelectorAll("#program-list button").forEach((button) => {
    currentSettings[button.dataset.program] = button.dataset.open === "true";
  });

  currentSettings[program] = isOpen;

  renderPrograms(currentSettings);
}

async function postJson(payload) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    mode: "no-cors",
    body: JSON.stringify(payload)
  });

  return {
    result: "success",
    settings: {}
  };
}

function showMessage(message) {
  document.getElementById("message").textContent = message;
}

const savedPrograms = {};

const defaultPrograms = {
  "[사이버보안 Track] 방산 AI 보안": {
    name: "[사이버보안 Track] 방산 AI 보안",
    calendarName: "보안",
    description: "국방 AI 드론 Red Team / Blue Team 공격 방어 실습",
    startDate: "2026-06-29",
    endDate: "2026-07-16",
    time: "",
    location: ""
  },
  "[사이버보안 Track] AI 기반 자율무인체계 공방 실습": {
    name: "[사이버보안 Track] AI 기반 자율무인체계 공방 실습",
    calendarName: "공방",
    description: "ROS2 · UAV/UGV Cyber Range 기반 공격·방어 실습",
    startDate: "",
    endDate: "",
    time: "상시 운영",
    location: ""
  },
  "[크라우드 아카데미] LLM 인스트럭션": {
    name: "[크라우드 아카데미] LLM 인스트럭션",
    calendarName: "LLM",
    description: "LLM 인스트럭션 교육과정",
    startDate: "2026-08-17",
    endDate: "2026-08-28",
    time: "오후 1시 ~ 5시",
    location: ""
  },
  "[자율이동체계 Track] 방산개방형아키텍처(MOSA SDK실습)": {
    name: "[자율이동체계 Track] 방산개방형아키텍처(MOSA SDK실습)",
    calendarName: "MOSA",
    description: "MOSA SDK 실습 교육과정",
    startDate: "2026-06-29",
    endDate: "2026-07-17",
    time: "",
    location: ""
  },
  "[자율이동체계 Track] 이동형 로봇 설계": {
    name: "[자율이동체계 Track] 이동형 로봇 설계",
    calendarName: "로봇",
    description: "자율주행대회 참석까지 상시 운영",
    startDate: "",
    endDate: "",
    time: "상시 운영",
    location: ""
  },
  "[군수 AX 전환 Track] 첨단소재 군수 AX": {
    name: "[군수 AX 전환 Track] 첨단소재 군수 AX",
    calendarName: "군수",
    description: "첨단소재 군수 AX 교육과정",
    startDate: "2026-07-06",
    endDate: "2026-07-10",
    time: "",
    location: ""
  }
};

const savedData = localStorage.getItem("bootcampPrograms");

if (savedData) {
  Object.assign(savedPrograms, JSON.parse(savedData));
} else {
  Object.assign(savedPrograms, defaultPrograms);
  localStorage.setItem("bootcampPrograms", JSON.stringify(savedPrograms));
}

renderProgramList();

function clearForm(title) {
  document.querySelector("#selected-program-title").textContent = title;
  document.querySelector("#program-name").value = "";
  document.querySelector("#program-calendar-name").value = "";
  document.querySelector("#program-description").value = "";
  document.querySelector("#program-time").value = "";
  document.querySelector("#program-location").value = "";
  renderSchedulePeriods();
  document.querySelector("#apply-start-date").value = "";
  document.querySelector("#apply-end-date").value = "";
  selectedCalendarColor = "bg-blue-600";

  document.querySelectorAll(".calendar-color").forEach((button) => {

    button.classList.toggle(
      "active",
      button.dataset.color === "bg-blue-600"
    );

  });

  document.querySelector("#program-syllabus").value = "";
  document.querySelector("#syllabus-check-message").textContent = "";
}

function renderProgramList() {
  const menu = document.querySelector("#program-menu");
  menu.innerHTML = "";

  Object.keys(savedPrograms).forEach((title) => {
    const newButton = document.createElement("button");

    newButton.className = "program-btn";
    newButton.dataset.title = title;
    newButton.type = "button";
    newButton.style.width = "100%";
    newButton.style.marginBottom = "8px";
    newButton.textContent = title;

    newButton.addEventListener("click", () => {
      loadProgram(title);
    });

    menu.appendChild(newButton);
  });
}

function renderSchedulePeriods(periods = []) {
  const list = document.querySelector("#schedule-period-list");
  list.innerHTML = "";

  const targetPeriods = periods.length > 0 ? periods : [
    { startDate: "", endDate: "" }
  ];

  targetPeriods.forEach((period) => {
    const row = document.createElement("div");
    row.className = "schedule-period";
    row.style.display = "flex";
    row.style.gap = "8px";
    row.style.marginBottom = "8px";

    row.innerHTML = `
      <input class="period-start-date" type="date" value="${period.startDate || ""}">
      <span>~</span>
      <input class="period-end-date" type="date" value="${period.endDate || ""}">
      <button class="remove-period-btn" type="button">삭제</button>
    `;

    row.querySelector(".remove-period-btn").addEventListener("click", () => {
      row.remove();
    });

    list.appendChild(row);
  });
}


function loadProgram(title) {
  const data = savedPrograms[title];

  document.querySelector("#selected-program-title").textContent = title;

  if (!data) {
    clearForm(title);
    document.querySelector("#program-name").value = title;
    return;
  }

  document.querySelector("#program-name").value = data.name || "";
  document.querySelector("#program-calendar-name").value =
    data.calendarName || data.track || "";
  document.querySelector("#program-description").value = data.description || "";
  renderSchedulePeriods(data.schedulePeriods || [
    {
      startDate: data.startDate || "",
      endDate: data.endDate || ""
    }
  ]);
  document.querySelector("#program-time").value = data.time || "";
  document.querySelector("#program-location").value = data.location || "";

  document.querySelector("#program-open").checked =
    data.isOpen !== false;
  document.querySelector("#program-visible").checked =
    data.isVisible !== false;
  document.querySelector("#apply-start-date").value = data.applyStartDate || "";
  document.querySelector("#apply-end-date").value = data.applyEndDate || "";
  selectedCalendarColor =
    data.calendarColor || "bg-blue-600";

  document.querySelectorAll(".calendar-color").forEach((button) => {

    button.classList.toggle(
      "active",
      button.dataset.color === selectedCalendarColor
    );

  });

  document.querySelector("#program-syllabus").value = data.syllabus || "";
  document.querySelector("#syllabus-check-message").textContent = "";

}

let newProgramCount = 0;

function saveCurrentProgram() {


  const schedulePeriods = Array.from(document.querySelectorAll(".schedule-period"))
    .map((row) => {
      return {
        startDate: row.querySelector(".period-start-date").value,
        endDate: row.querySelector(".period-end-date").value
      };
    })
    .filter((period) => period.startDate && period.endDate);

  const title = document.querySelector("#selected-program-title").textContent;
  const newTitle = document.querySelector("#program-name").value.trim() || title;

  savedPrograms[newTitle] = {
    name: document.querySelector("#program-name").value,
    calendarName: document.querySelector("#program-calendar-name").value,
    description: document.querySelector("#program-description").value,
    schedulePeriods,
    startDate: schedulePeriods[0]?.startDate || "",
    endDate: schedulePeriods[0]?.endDate || "",
    time: document.querySelector("#program-time").value,
    location: document.querySelector("#program-location").value,
    isOpen: document.querySelector("#program-open").checked,
    isVisible: document.querySelector("#program-visible").checked,
    applyStartDate: document.querySelector("#apply-start-date").value,
    applyEndDate: document.querySelector("#apply-end-date").value,
    calendarColor: selectedCalendarColor,
    syllabus: document.querySelector("#program-syllabus").value.trim(),
  };

  if (newTitle !== title) {
    delete savedPrograms[title];
  }

  localStorage.setItem("bootcampPrograms", JSON.stringify(savedPrograms));
  document.querySelector("#selected-program-title").textContent = newTitle;

  renderProgramList();
  loadProgram(newTitle);

  alert("저장되었습니다.");

  
}

document.querySelector("#save-program-btn").addEventListener("click", saveCurrentProgram);

document.querySelector("#add-program-btn").addEventListener("click", () => {
  newProgramCount++;

  const newProgramName = `새 교과목 ${newProgramCount}`;

  savedPrograms[newProgramName] = {
    name: newProgramName,
    calendarName: "",
    description: "",
    startDate: "",
    endDate: "",
    time: "",
    location: ""
  };

  localStorage.setItem("bootcampPrograms", JSON.stringify(savedPrograms));

  const newButton = document.createElement("button");
  newButton.className = "program-btn";
  newButton.dataset.title = newProgramName;
  newButton.type = "button";
  newButton.style.width = "100%";
  newButton.style.marginBottom = "8px";
  newButton.textContent = newProgramName;

  newButton.addEventListener("click", () => {
    loadProgram(newProgramName);
  });

  document.querySelector("#program-menu").appendChild(newButton);

  loadProgram(newProgramName);
});

document.querySelector("#delete-program-btn").addEventListener("click", () => {
  const title = document.querySelector("#selected-program-title").textContent;

  if (!confirm(`${title} 과목을 삭제하시겠습니까?`)) {
    return;
  }

  delete savedPrograms[title];

  localStorage.setItem("bootcampPrograms", JSON.stringify(savedPrograms));

  document.querySelectorAll(".program-btn").forEach((button) => {
    if (button.dataset.title === title) {
      button.remove();
    }
  });

  clearForm("교과목을 선택하세요");

  alert("삭제되었습니다.");
});

document.querySelectorAll(".tab-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const selectedTab = button.dataset.tab;

    document.querySelectorAll(".tab-content").forEach((content) => {
      content.hidden = true;
    });

    const selectedContent = document.querySelector("#tab-" + selectedTab);

    if (selectedContent) {
      selectedContent.hidden = false;
    }
  });
});

document.querySelector("#add-period-btn").addEventListener("click", () => {
  const currentPeriods = Array.from(document.querySelectorAll(".schedule-period"))
    .map((row) => {
      return {
        startDate: row.querySelector(".period-start-date").value,
        endDate: row.querySelector(".period-end-date").value
      };
    });

  currentPeriods.push({
    startDate: "",
    endDate: ""
  });

  renderSchedulePeriods(currentPeriods);
});

document.querySelectorAll(".calendar-color").forEach((button) => {

  button.addEventListener("click", () => {

    document.querySelectorAll(".calendar-color").forEach((c) => {
      c.classList.remove("active");
    });

    button.classList.add("active");

    selectedCalendarColor = button.dataset.color;

  });

});

document.querySelector("#check-syllabus-btn").addEventListener("click", async () => {
  const filename = document.querySelector("#program-syllabus").value.trim();
  const message = document.querySelector("#syllabus-check-message");

  if (!filename) {
    message.textContent = "파일명을 입력하세요.";
    message.style.color = "#dc2626";
    return;
  }

  const url = `../curriculum/syllabi/${filename}`;

  try {
    const response = await fetch(url, { method: "HEAD" });

    if (response.ok) {
      message.textContent = `연결 확인됨: ${url}`;
      message.style.color = "#15803d";
    } else {
      message.textContent = `파일을 찾을 수 없습니다: ${url}`;
      message.style.color = "#dc2626";
    }
  } catch (error) {
    message.textContent = "파일 연결 확인 중 오류가 발생했습니다.";
    message.style.color = "#dc2626";
  }
});
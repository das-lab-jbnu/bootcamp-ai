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

  await loadSettings();
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
  const result = await postJson({
    action: "updateProgramSetting",
    password: adminPassword,
    program,
    isOpen
  });

  if (result.result !== "success") {
    showMessage(result.message || "변경 실패");
    return;
  }

  showMessage("변경되었습니다.");
  await loadSettings();
}

async function postJson(payload) {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  });

  return await response.json();
}

function showMessage(message) {
  document.getElementById("message").textContent = message;
}
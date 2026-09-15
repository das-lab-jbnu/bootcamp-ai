(async () => {
  const isLocalPreview =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const currentParameters = new URLSearchParams(window.location.search);
  const liveTestRequested = currentParameters.get("liveTest") === "1";
  const testKey = currentParameters.get("testKey") || "";
  const liveTestMode = liveTestRequested && testKey.length >= 20;

  const guidance = document.querySelector("#new-programs-guidance");
  const settings = window.getApplicationSettings
    ? await window.getApplicationSettings()
    : { available: false, programs: {}, applicationManagementOpen: false };

  if (!settings.available) {
    if (guidance) {
      guidance.textContent =
        "접수 상태를 불러오지 못했습니다. 잠시 후 페이지를 새로고침해주세요.";
    }
    document.querySelectorAll("[data-local-application-status]").forEach((status) => {
      status.textContent = "상태확인중";
      status.classList.remove("bg-emerald-600");
      status.classList.add("bg-slate-500");
    });
    document.querySelectorAll("[data-local-application-link]").forEach((button) => {
      button.textContent = "확인중";
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
    });
    return;
  }

  const openProgramCount = Object.values(settings.programs).filter(Boolean).length;
  if (guidance) {
    guidance.textContent = openProgramCount === 0
      ? "신규 접수가 종료되었습니다. 기존 신청자는 신청 확인/변경/취소 메뉴를 이용해주세요."
      : liveTestMode
      ? "로컬 실전 테스트 모드입니다. 제출하면 실제 Google Sheet에 저장되고 접수 확인 이메일이 발송됩니다."
      : isLocalPreview
        ? "로컬 미리보기에서는 신청 화면과 입력 검증을 확인할 수 있으며, 별도 실전 테스트 모드가 아니면 Google Sheet로 전송되지 않습니다."
        : "현재 접수 중입니다. 프로그램별 접수하기 버튼을 눌러 신청해주세요.";
  }

  document.querySelectorAll("[data-local-application-link]").forEach((button) => {
    const targetUrl = new URL(button.dataset.localApplicationLink, window.location.href);
    const programSlug = targetUrl.searchParams.get("program") || "";
    const programOpen = settings.programs[programSlug] === true;
    const status = button.closest("article")?.querySelector(
      "[data-local-application-status]"
    );
    if (status) {
      status.textContent = programOpen ? "모집중" : "모집종료";
      status.classList.toggle("bg-emerald-600", programOpen);
      status.classList.toggle("bg-slate-500", !programOpen);
    }
    if (!programOpen) {
      button.textContent = "접수종료";
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      return;
    }

    const link = document.createElement("a");
    link.className = button.className;
    link.classList.remove("cursor-not-allowed", "bg-slate-400");
    link.classList.add("bg-blue-900", "hover:bg-blue-800");
    if (liveTestMode) {
      targetUrl.searchParams.set("liveTest", "1");
      targetUrl.searchParams.set("testKey", testKey);
    }
    link.href = `${targetUrl.pathname}${targetUrl.search}`;
    link.textContent = "접수하기";
    button.replaceWith(link);
  });

  const managementLink = document.querySelector(
    "[data-application-management-link]"
  );
  if (managementLink && !settings.applicationManagementOpen) {
    managementLink.removeAttribute("href");
    managementLink.setAttribute("aria-disabled", "true");
    managementLink.classList.add(
      "cursor-not-allowed",
      "border-slate-300",
      "text-slate-400"
    );
    managementLink.classList.remove(
      "border-blue-900",
      "text-blue-900",
      "hover:bg-blue-50"
    );
    managementLink.textContent = "신청 관리 일시중지";
  }
})();

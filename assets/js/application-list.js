(() => {
  const isLocalPreview =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const applicationsOpen = Boolean(
    window.BOOTCAMP_CONFIG && window.BOOTCAMP_CONFIG.applicationsOpen
  );
  if (!applicationsOpen && !isLocalPreview) return;
  const currentParameters = new URLSearchParams(window.location.search);
  const liveTestRequested = currentParameters.get("liveTest") === "1";
  const testKey = currentParameters.get("testKey") || "";
  const liveTestMode = liveTestRequested && testKey.length >= 20;

  const guidance = document.querySelector("#new-programs-guidance");
  if (guidance) {
    guidance.textContent = liveTestMode
      ? "로컬 실전 테스트 모드입니다. 제출하면 실제 Google Sheet에 저장되고 접수 확인 이메일이 발송됩니다."
      : isLocalPreview
        ? "로컬 미리보기에서는 신청 화면과 입력 검증을 확인할 수 있으며, 별도 실전 테스트 모드가 아니면 Google Sheet로 전송되지 않습니다."
        : "현재 접수 중입니다. 프로그램별 접수하기 버튼을 눌러 신청해주세요.";
  }

  document.querySelectorAll("[data-local-application-status]").forEach((status) => {
    status.textContent = "모집중";
    status.classList.remove("bg-slate-500");
    status.classList.add("bg-emerald-600");
  });

  document.querySelectorAll("[data-local-application-link]").forEach((button) => {
    const link = document.createElement("a");
    link.className = button.className;
    link.classList.remove("cursor-not-allowed", "bg-slate-400");
    link.classList.add("bg-blue-900", "hover:bg-blue-800");
    const targetUrl = new URL(button.dataset.localApplicationLink, window.location.href);
    if (liveTestMode) {
      targetUrl.searchParams.set("liveTest", "1");
      targetUrl.searchParams.set("testKey", testKey);
    }
    link.href = `${targetUrl.pathname}${targetUrl.search}`;
    link.textContent = "접수하기";
    button.replaceWith(link);
  });
})();

(async () => {
  const isLocalPreview =
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1";
  const previewMode = window.isIntermediateApplicationPreview?.() === true;
  const currentParameters = new URLSearchParams(window.location.search);
  const liveTestRequested = currentParameters.get("liveTest") === "1";
  const testKey = currentParameters.get("testKey") || "";
  const liveTestMode = !previewMode && liveTestRequested && testKey.length >= 20;
  const previewEntry = document.querySelector("#local-preview-entry");
  if (previewEntry && isLocalPreview && !previewMode) {
    previewEntry.classList.remove("hidden");
  }

  const guidance = document.querySelector("#new-programs-guidance");
  const settings = window.getApplicationSettings
    ? await window.getApplicationSettings()
    : { available: false, programs: {}, applicationManagementOpen: false };

  const setCardPalette = (article, isOpen) => {
    if (!article) return;
    const palettePairs = [
      ["border-emerald-600", "border-blue-700"],
      ["bg-emerald-50", "bg-blue-50"],
      ["border-emerald-500", "border-blue-500"],
      ["border-emerald-700", "border-blue-900"],
      ["border-emerald-200", "border-blue-200"],
      ["bg-emerald-200", "bg-blue-200"],
      ["text-emerald-800", "text-blue-800"],
      ["hover:bg-emerald-100", "hover:bg-blue-50"]
    ];
    [article, ...article.querySelectorAll("*")].forEach((element) => {
      palettePairs.forEach(([greenClass, blueClass]) => {
        const from = isOpen ? blueClass : greenClass;
        const to = isOpen ? greenClass : blueClass;
        if (element.classList.contains(from)) element.classList.replace(from, to);
      });
    });
  };

  if (!settings.available) {
    if (guidance) {
      guidance.textContent =
        "접수 상태를 불러오지 못했습니다. 잠시 후 페이지를 새로고침해주세요.";
    }
    document.querySelectorAll("[data-local-application-status]").forEach((status) => {
      status.textContent = "상태확인중";
      status.classList.remove("bg-emerald-600", "bg-blue-700", "bg-amber-600");
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
  const hasUnknownPrograms = [...document.querySelectorAll("[data-local-application-link]")]
    .some((button) => {
      const url = new URL(button.dataset.localApplicationLink, window.location.href);
      const slug = url.searchParams.get("program") || "";
      return !Object.prototype.hasOwnProperty.call(settings.programs, slug);
    });
  if (guidance) {
    guidance.textContent = previewMode
      ? "로컬 배포 전 미리보기입니다. 세 과목의 화면과 입력 검증을 확인할 수 있으며 Google Sheet로 전송되지 않습니다."
      : liveTestMode
      ? "로컬 실전 테스트 모드입니다. 제출하면 실제 Google Sheet에 저장되고 접수 확인 이메일이 발송됩니다."
      : openProgramCount === 0 && hasUnknownPrograms
      ? "일부 과목의 접수 상태를 확인하고 있습니다. 잠시 후 다시 확인해주세요."
      : openProgramCount === 0
      ? "신규 접수가 종료되었습니다. 기존 신청자는 신청 확인/변경/취소 메뉴를 이용해주세요."
      : isLocalPreview
        ? "로컬 미리보기에서는 신청 화면과 입력 검증을 확인할 수 있으며, 별도 실전 테스트 모드가 아니면 Google Sheet로 전송되지 않습니다."
        : "현재 접수 중입니다. 프로그램별 접수하기 버튼을 눌러 신청해주세요.";
  }

  document.querySelectorAll("[data-local-application-link]").forEach((button) => {
    const targetUrl = new URL(button.dataset.localApplicationLink, window.location.href);
    const programSlug = targetUrl.searchParams.get("program") || "";
    const article = button.closest("article");
    if (!Object.prototype.hasOwnProperty.call(settings.programs, programSlug)) {
      const status = article?.querySelector("[data-local-application-status]");
      if (status) status.textContent = "상태 확인 중";
      button.textContent = "상태 확인 중";
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      return;
    }
    const publiclyOpen = settings.programs[programSlug] === true;
    const programOpen = publiclyOpen || liveTestMode;
    setCardPalette(article, publiclyOpen);
    const status = article?.querySelector(
      "[data-local-application-status]"
    );
    if (status) {
      status.classList.remove("bg-slate-500");
      status.textContent = publiclyOpen ? "접수중" : liveTestMode ? "테스트" : "접수종료";
      status.classList.toggle("bg-emerald-600", publiclyOpen);
      status.classList.toggle("bg-amber-600", !publiclyOpen && liveTestMode);
      status.classList.toggle("bg-blue-700", !programOpen);
    }
    if (!programOpen) {
      button.textContent = "접수종료";
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
      return;
    }

    const link = document.createElement("a");
    link.className = button.className;
    link.classList.remove(
      "cursor-not-allowed", "bg-slate-400", "bg-blue-200", "bg-emerald-200",
      "text-blue-800", "text-emerald-800"
    );
    link.classList.add("bg-emerald-700", "hover:bg-emerald-800", "text-white");
    if (liveTestMode) {
      targetUrl.searchParams.set("liveTest", "1");
      targetUrl.searchParams.set("testKey", testKey);
    }
    if (previewMode) targetUrl.searchParams.set("preview", "1");
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

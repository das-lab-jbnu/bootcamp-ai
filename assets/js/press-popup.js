(() => {
  const popup = document.getElementById("press-popup");
  const closeButton = document.getElementById("press-popup-close");
  const hideTodayButton = document.getElementById("press-popup-hide-today");
  const storageKey = "jbnu-defense-ai-press-popup-634111-hidden-date";
  let previousFocus = null;

  if (!popup || !closeButton || !hideTodayButton) return;

  function todayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function closePopup() {
    popup.classList.add("hidden");
    popup.classList.remove("flex");
    document.body.style.overflow = "";
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  }

  function openPopup() {
    try {
      if (window.localStorage.getItem(storageKey) === todayKey()) return;
    } catch (error) {
      // 저장소를 사용할 수 없어도 팝업은 표시합니다.
    }
    previousFocus = document.activeElement;
    popup.classList.remove("hidden");
    popup.classList.add("flex");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  closeButton.addEventListener("click", closePopup);
  hideTodayButton.addEventListener("click", () => {
    try {
      window.localStorage.setItem(storageKey, todayKey());
    } catch (error) {
      // 저장소를 사용할 수 없으면 현재 팝업만 닫습니다.
    }
    closePopup();
  });
  popup.addEventListener("click", (event) => {
    if (event.target === popup) closePopup();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !popup.classList.contains("hidden")) closePopup();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", openPopup, { once: true });
  } else {
    openPopup();
  }
})();

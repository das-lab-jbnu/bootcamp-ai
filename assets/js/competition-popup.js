(() => {
  const popup = document.getElementById("competition-popup");
  const closeButton = document.getElementById("competition-popup-close");
  const hideTodayButton = document.getElementById("competition-popup-hide-today");
  const storageKey = "jbnu-defense-ai-competition-popup-hidden-date";
  let previousFocus = null;

  if (!popup || !closeButton || !hideTodayButton) return;

  function getTodayKey() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function isHiddenToday() {
    try {
      return window.localStorage.getItem(storageKey) === getTodayKey();
    } catch (error) {
      return false;
    }
  }

  function openPopup() {
    if (isHiddenToday()) return;
    previousFocus = document.activeElement;
    popup.classList.remove("hidden");
    popup.classList.add("flex");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  function closePopup() {
    popup.classList.add("hidden");
    popup.classList.remove("flex");
    document.body.style.overflow = "";
    if (previousFocus instanceof HTMLElement) previousFocus.focus();
  }

  function hideForToday() {
    try {
      window.localStorage.setItem(storageKey, getTodayKey());
    } catch (error) {
      // 저장소를 사용할 수 없는 환경에서는 현재 팝업만 닫습니다.
    }
    closePopup();
  }

  closeButton.addEventListener("click", closePopup);
  hideTodayButton.addEventListener("click", hideForToday);
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

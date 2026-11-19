const NOTICES = window.BOOTCAMP_NOTICES || [];
const NOTICE_CATEGORIES = ["전체", "언론보도", "프로그램 신청", "특강", "세미나"];
let activeNoticeCategory = "전체";

function renderNoticeFilters() {
  const container = document.getElementById("notice-filters");
  container.replaceChildren();
  NOTICE_CATEGORIES.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = category;
    button.setAttribute("aria-pressed", String(category === activeNoticeCategory));
    button.className = category === activeNoticeCategory
      ? "rounded-full border border-blue-900 bg-blue-900 px-4 py-2 text-sm font-bold text-white"
      : "rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-blue-700 hover:text-blue-900";
    button.addEventListener("click", () => {
      activeNoticeCategory = category;
      renderNoticeFilters();
      renderNotices();
    });
    container.append(button);
  });
}

function renderNotices() {
  const list = document.getElementById("notice-list");
  const count = document.getElementById("notice-count");
  const empty = document.getElementById("notice-empty");
  const visible = NOTICES
    .filter((notice) => activeNoticeCategory === "전체" || notice.category === activeNoticeCategory)
    .sort((a, b) => b.date.localeCompare(a.date));

  list.replaceChildren();
  count.textContent = `${visible.length}건의 공지`;
  empty.classList.toggle("hidden", visible.length > 0);

  visible.forEach((notice) => {
    const article = document.createElement("article");
    article.className = "grid gap-3 py-6 sm:grid-cols-[8rem_1fr] sm:gap-6";

    const meta = document.createElement("div");
    meta.className = "flex items-center gap-3 sm:block";
    const category = document.createElement("span");
    category.className = "inline-block rounded bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800";
    category.textContent = notice.category;
    const date = document.createElement("time");
    date.className = "text-sm text-slate-500 sm:mt-3 sm:block";
    date.dateTime = notice.date;
    date.textContent = notice.date.replaceAll("-", ".");
    meta.append(category, date);

    const body = document.createElement("div");
    const title = document.createElement("h2");
    const titleLink = document.createElement("a");
    titleLink.className = "text-lg font-bold leading-7 text-slate-900 hover:text-blue-800 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-700";
    titleLink.href = `./detail.html?id=${encodeURIComponent(notice.id)}`;
    titleLink.textContent = notice.title;
    title.append(titleLink);
    const summary = document.createElement("p");
    summary.className = "mt-2 break-keep text-sm leading-6 text-slate-600";
    summary.textContent = notice.summary;
    const detailLink = document.createElement("a");
    detailLink.className = "mt-3 inline-flex font-semibold text-blue-800 underline underline-offset-4 hover:text-blue-600";
    detailLink.href = titleLink.href;
    detailLink.textContent = "자세히 보기 →";
    body.append(title, summary, detailLink);

    article.append(meta, body);
    list.append(article);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderNoticeFilters();
  renderNotices();
});

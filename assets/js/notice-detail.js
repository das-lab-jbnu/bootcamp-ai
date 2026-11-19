function makeNoticeLink(item, isAttachment) {
  const row = document.createElement("li");
  const link = document.createElement("a");
  const href = isAttachment ? item.file : item.url;
  link.href = href;
  link.textContent = `${isAttachment ? "📎 " : "↗ "}${item.name || item.label}`;
  link.className = "inline-flex break-all font-semibold text-blue-800 underline underline-offset-4 hover:text-blue-600";
  if (/^https?:\/\//.test(href)) {
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  }
  if (isAttachment) link.download = item.name || "";
  row.append(link);
  return row;
}

document.addEventListener("DOMContentLoaded", () => {
  const id = new URLSearchParams(window.location.search).get("id");
  const notice = (window.BOOTCAMP_NOTICES || []).find((item) => item.id === id);
  if (!notice) {
    document.getElementById("notice-not-found").classList.remove("hidden");
    return;
  }

  document.title = `${notice.title} | 공지사항 | 전북대 방산 AI 부트캠프`;
  document.getElementById("notice-detail").classList.remove("hidden");
  document.getElementById("notice-category").textContent = notice.category;
  const date = document.getElementById("notice-date");
  date.dateTime = notice.date;
  date.textContent = notice.date.replaceAll("-", ".");
  document.getElementById("notice-title").textContent = notice.title;
  document.getElementById("notice-summary").textContent = notice.summary;

  const facts = notice.facts || [];
  if (facts.length) {
    document.getElementById("notice-facts-section").classList.remove("hidden");
    const list = document.getElementById("notice-facts");
    facts.forEach((item) => {
      const row = document.createElement("div");
      row.className = "grid gap-1 py-4 sm:grid-cols-[9rem_1fr] sm:gap-5";
      const term = document.createElement("dt");
      term.className = "font-bold text-slate-900";
      term.textContent = item.label;
      const value = document.createElement("dd");
      value.className = "break-keep leading-7 text-slate-700";
      value.textContent = item.value;
      row.append(term, value);
      list.append(row);
    });
  }

  const content = document.getElementById("notice-content");
  (notice.content || []).forEach((paragraph) => {
    const element = document.createElement("p");
    element.className = "whitespace-pre-line break-keep";
    element.textContent = paragraph;
    content.append(element);
  });

  const images = notice.images || [];
  if (images.length) {
    document.getElementById("notice-images-section").classList.remove("hidden");
    const gallery = document.getElementById("notice-images");
    images.forEach((item) => {
      const figure = document.createElement("figure");
      const link = document.createElement("a");
      link.href = item.file;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.setAttribute("aria-label", `${item.caption || "카드뉴스"} 원본 보기`);
      const image = document.createElement("img");
      image.src = item.file;
      image.alt = item.alt || item.caption || "카드뉴스";
      image.loading = "lazy";
      image.className = "mx-auto h-auto w-full max-w-2xl rounded-lg border border-slate-200";
      link.append(image);
      figure.append(link);
      if (item.caption) {
        const caption = document.createElement("figcaption");
        caption.className = "mt-2 text-center text-sm text-slate-600";
        caption.textContent = item.caption;
        figure.append(caption);
      }
      gallery.append(figure);
    });
  }

  const links = notice.links || [];
  if (links.length) {
    document.getElementById("notice-links-section").classList.remove("hidden");
    document.getElementById("notice-links").append(...links.map((item) => makeNoticeLink(item, false)));
  }

  const attachments = notice.attachments || [];
  if (attachments.length) {
    document.getElementById("notice-attachments-section").classList.remove("hidden");
    document.getElementById("notice-attachments").append(...attachments.map((item) => makeNoticeLink(item, true)));
  }
});

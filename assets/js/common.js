const NAV_ITEMS = [
  { href: "index.html", label: "홈" },
  { href: "about/index.html", label: "사업단 소개" },
  { href: "curriculum/index.html", label: "교육과정" },
  { href: "partners/index.html", label: "참여기업" },
  { href: "faculty/index.html", label: "교수진/인프라" },
  { href: "support/index.html", label: "학생 지원 혜택" },
  { href: "apply/index.html", label: "프로그램 신청/접수" }
];

function getBasePrefix() {
  const path = window.location.pathname.replace(/\\/g, "/");
  const isSubPage =
    path.includes("/about/") ||
    path.includes("/curriculum/") ||
    path.includes("/partners/") ||
    path.includes("/faculty/") ||
    path.includes("/support/") ||
    path.includes("/apply/");
  return isSubPage ? "../" : "./";
}

function renderHeaderFooter() {
  const year = new Date().getFullYear();
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  if (!header || !footer) return;
  const basePrefix = getBasePrefix();

  const navLinks = NAV_ITEMS.map(
    (item) =>
      `<a class="text-base md:text-lg font-semibold text-slate-700 hover:text-blue-900" href="${basePrefix}${item.href}">${item.label}</a>`
  ).join("");

  header.innerHTML = `
    <div class="bg-white border-b border-slate-200">
      <div class="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <a href="${basePrefix}index.html" class="flex items-center gap-3 font-bold text-blue-950">
          <img
            src="${basePrefix}assets/images/jbnu-logo.png"
            alt="전북대학교 로고"
            class="h-10 w-auto object-contain"
            onerror="this.style.display='none'"
          />
          <span class="text-xl md:text-2xl">방산AI부트캠프</span>
        </a>
        <nav class="flex flex-wrap gap-x-5 gap-y-2">${navLinks}</nav>
      </div>
    </div>
  `;

  footer.innerHTML = `
    <div class="bg-slate-950 text-slate-100 mt-16">
      <div class="max-w-6xl mx-auto px-4 py-8 text-sm">
        <p class="font-semibold">전북대학교 방산 AI 인재양성 부트캠프 사업단</p>
        <p class="mt-2 text-slate-300">전북특별자치도 전주시 덕진구 백제대로 567</p>
        <p class="mt-1 text-slate-400">© ${year} Jeonbuk National University. All rights reserved.</p>
      </div>
    </div>
  `;
}

function renderCards(targetId, items, mapper) {
  const target = document.getElementById(targetId);
  if (!target) return;
  target.innerHTML = items.map(mapper).join("");
}

document.addEventListener("DOMContentLoaded", renderHeaderFooter);

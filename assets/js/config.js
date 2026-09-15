window.BOOTCAMP_CONFIG = {
  // 운영설정 API를 불러오지 못한 경우 신규 접수는 안전하게 차단합니다.
  applicationsOpen: false,
  appsScriptEndpoints: {
    production: "https://script.google.com/macros/s/AKfycbzeUIxoYLxWC8_X0KJ4DPCP70DXp6cmuYXBRHya6bFX7qUXFzqOxmk7tw6Cq1J0ADN0/exec",
    development: "https://script.google.com/macros/s/PASTE_DEV_DEPLOYMENT_ID/exec"
  },
  benefitsEndpoint: "https://script.google.com/macros/s/AKfycby-DKWk2UF_FKw10kzC_oUOMmijOQGpLloC_nyYHQRKyg_gos9TVTpz1CKMVfH3ZytQ/exec",
  activeEndpoint: "production"
};

window.getBootcampApiEndpoint = function getBootcampApiEndpoint() {
  const config = window.BOOTCAMP_CONFIG;
  return config.appsScriptEndpoints[config.activeEndpoint];
};

window.getBenefitsApiEndpoint = function getBenefitsApiEndpoint() {
  return window.BOOTCAMP_CONFIG.benefitsEndpoint;
};

window.getApplicationSettings = async function getApplicationSettings() {
  const closedPrograms = {
    "idea-contest": false,
    "ai-agent": false,
    "vibe-coding": false,
    "generative-ai": false
  };
  const fallback = {
    available: false,
    programs: closedPrograms,
    applicationManagementOpen: false,
    scholarshipApplicationsOpen: false
  };
  const endpoint = window.getBenefitsApiEndpoint();
  if (!endpoint) return fallback;

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 8000);
  try {
    const url = new URL(endpoint);
    url.searchParams.set("action", "getApplicationSettings");
    url.searchParams.set("_", String(Date.now()));
    const response = await fetch(url.toString(), {
      method: "GET",
      cache: "no-store",
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    if (result.result !== "success" || !result.settings) {
      throw new Error("운영설정 응답이 올바르지 않습니다.");
    }
    const settings = result.settings;
    return {
      available: true,
      programs: {
        "idea-contest": settings.programs?.["idea-contest"] === true,
        "ai-agent": settings.programs?.["ai-agent"] === true,
        "vibe-coding": settings.programs?.["vibe-coding"] === true,
        "generative-ai": settings.programs?.["generative-ai"] === true
      },
      applicationManagementOpen:
        settings.applicationManagementOpen === true,
      scholarshipApplicationsOpen:
        settings.scholarshipApplicationsOpen === true
    };
  } catch (error) {
    console.error("운영설정을 불러오지 못했습니다.", error);
    return fallback;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

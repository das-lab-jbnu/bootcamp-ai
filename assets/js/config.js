window.BOOTCAMP_CONFIG = {
  applicationsOpen: true,
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

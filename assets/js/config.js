window.BOOTCAMP_CONFIG = {
  appsScriptEndpoints: {
    production: "https://script.google.com/macros/s/AKfycbzeUIxoYLxWC8_X0KJ4DPCP70DXp6cmuYXBRHya6bFX7qUXFzqOxmk7tw6Cq1J0ADN0/exec",
    development: "https://script.google.com/macros/s/PASTE_DEV_DEPLOYMENT_ID/exec"
  },
  activeEndpoint: "production"
};

window.getBootcampApiEndpoint = function getBootcampApiEndpoint() {
  const config = window.BOOTCAMP_CONFIG;
  return config.appsScriptEndpoints[config.activeEndpoint];
};

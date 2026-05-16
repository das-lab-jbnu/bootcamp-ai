window.BOOTCAMP_CONFIG = {
  appsScriptEndpoints: {
    production: "https://script.google.com/macros/s/AKfycbzcVjY83Gws1kzkNN8S5s0fZSvlTLUbqc8ZRsYWuMf_ip_LW5H71o9VGFGYDd1OQHIR/exec",
    development: "https://script.google.com/macros/s/PASTE_DEV_DEPLOYMENT_ID/exec"
  },
  activeEndpoint: "production"
};

window.getBootcampApiEndpoint = function getBootcampApiEndpoint() {
  const config = window.BOOTCAMP_CONFIG;
  return config.appsScriptEndpoints[config.activeEndpoint];
};

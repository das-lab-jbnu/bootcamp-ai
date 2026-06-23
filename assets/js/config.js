window.BOOTCAMP_CONFIG = {
  appsScriptEndpoints: {
    production: "https://script.google.com/macros/s/AKfycbyZDkceoDVZmJ37yWwiKmlcEHSp8ef13NVVxAo38x5-vjPmE-HlgaBrWLw9BdRNXNEBGw/exec",
    development: "https://script.google.com/macros/s/AKfycbyZDkceoDVZmJ37yWwiKmlcEHSp8ef13NVVxAo38x5-vjPmE-HlgaBrWLw9BdRNXNEBGw/exec"
  },
  activeEndpoint: "development"
};

window.getBootcampApiEndpoint = function getBootcampApiEndpoint() {
  const config = window.BOOTCAMP_CONFIG;
  return config.appsScriptEndpoints[config.activeEndpoint];
};

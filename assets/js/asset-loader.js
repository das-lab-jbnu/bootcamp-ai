function loadBootcampAssets(options) {
  const config = options || {};
  const basePath = config.basePath || "./";
  const version = window.ASSET_VERSION || "1";
  const loadData = !!config.loadData;

  document.write(`<link rel="stylesheet" href="${basePath}assets/css/style.css?v=${version}" />`);

  if (loadData) {
    document.write(`<script src="${basePath}assets/js/data.js?v=${version}"><\/script>`);
  }

  document.write(`<script src="${basePath}assets/js/common.js?v=${version}"><\/script>`);
}

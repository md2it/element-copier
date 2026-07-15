var SUPPORT_SURVEY_STORAGE_KEY = "ec:support-survey";

var SUPPORT_SURVEY_THRESHOLD = 25;

var SUPPORT_SURVEY_COOLDOWN_MS = 60 * 24 * 60 * 60 * 1e3;

var SUPPORT_SURVEY_GITHUB_URL = "https://github.com/md2it/browser-extension-element-copier";

var SUPPORT_SURVEY_CHROME_STORE_URL = "https://chromewebstore.google.com/detail/element-copier/gdcdnijkedjdjighmalgialikcgkibel";

var SUPPORT_SURVEY_FIREFOX_STORE_URL = "https://addons.mozilla.org/firefox/addon/element-copier/";

var SUPPORT_SURVEY_FEEDBACK_EMAIL = "contact@md2it.com";

/** True for Firefox/Gecko extension runtime; not fooled by a `browser` polyfill on Chromium. */
function isFirefoxExtensionRuntime() {
  try {
    const chromeApi = globalThis.chrome;
    const browserApi = globalThis.browser;
    const runtime = chromeApi?.runtime || browserApi?.runtime || null;
    if (runtime && typeof runtime.getURL === "function") {
      return String(runtime.getURL("/")).startsWith("moz-extension:");
    }
  } catch {
  }
  return /Firefox\//.test(String(globalThis.navigator?.userAgent || ""));
}

function getSupportSurveyStoreListingUrl() {
  return isFirefoxExtensionRuntime()
    ? SUPPORT_SURVEY_FIREFOX_STORE_URL
    : SUPPORT_SURVEY_CHROME_STORE_URL;
}

function getSupportSurveyStoreRateLabel() {
  return isFirefoxExtensionRuntime()
    ? "Rate in Firefox store"
    : "Rate in Chrome web store";
}

export {
  SUPPORT_SURVEY_CHROME_STORE_URL,
  SUPPORT_SURVEY_COOLDOWN_MS,
  SUPPORT_SURVEY_FEEDBACK_EMAIL,
  SUPPORT_SURVEY_FIREFOX_STORE_URL,
  SUPPORT_SURVEY_GITHUB_URL,
  SUPPORT_SURVEY_STORAGE_KEY,
  SUPPORT_SURVEY_THRESHOLD,
  getSupportSurveyStoreRateLabel,
  getSupportSurveyStoreListingUrl,
  isFirefoxExtensionRuntime
};

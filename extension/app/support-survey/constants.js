var SUPPORT_SURVEY_STORAGE_KEY = "ec:support-survey";

var SUPPORT_SURVEY_THRESHOLD = 3;

var SUPPORT_SURVEY_COOLDOWN_MS = 60 * 24 * 60 * 60 * 1e3;

var SUPPORT_SURVEY_GITHUB_URL = "https://github.com/md2it/browser-extension-element-copier";

var SUPPORT_SURVEY_CHROME_STORE_URL = "https://chromewebstore.google.com/detail/element-copier/gdcdnijkedjdjighmalgialikcgkibel";

var SUPPORT_SURVEY_FIREFOX_STORE_URL = "https://addons.mozilla.org/firefox/addon/element-copier/";

var SUPPORT_SURVEY_FEEDBACK_EMAIL = "contact@md2it.com";

function getSupportSurveyStoreListingUrl() {
  if (typeof browser !== "undefined") {
    return SUPPORT_SURVEY_FIREFOX_STORE_URL;
  }
  return SUPPORT_SURVEY_CHROME_STORE_URL;
}

export {
  SUPPORT_SURVEY_CHROME_STORE_URL,
  SUPPORT_SURVEY_COOLDOWN_MS,
  SUPPORT_SURVEY_FEEDBACK_EMAIL,
  SUPPORT_SURVEY_FIREFOX_STORE_URL,
  SUPPORT_SURVEY_GITHUB_URL,
  SUPPORT_SURVEY_STORAGE_KEY,
  SUPPORT_SURVEY_THRESHOLD,
  getSupportSurveyStoreListingUrl
};

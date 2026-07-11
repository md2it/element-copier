import { createSupportSurveyModal } from "./modal.js";
import { shouldShowSupportSurveyAfterDownload } from "./state.js";

async function maybeShowSupportSurveyAfterDownload(mountRoot, strings) {
  if (!mountRoot || mountRoot.querySelector(".ec-support-survey-overlay")) {
    return false;
  }
  let shouldShow = false;
  try {
    shouldShow = await shouldShowSupportSurveyAfterDownload();
  } catch {
    return false;
  }
  if (!shouldShow) {
    return false;
  }
  createSupportSurveyModal(mountRoot, strings);
  return true;
}

export { maybeShowSupportSurveyAfterDownload };

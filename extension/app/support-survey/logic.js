import { SUPPORT_SURVEY_COOLDOWN_MS, SUPPORT_SURVEY_THRESHOLD } from "./constants.js";

function createDefaultSupportSurveyState() {
  return {
    successCount: 0,
    neverAsk: false,
    completed: false,
    lastShownAt: null
  };
}

function normalizeSupportSurveyState(raw) {
  const defaults = createDefaultSupportSurveyState();
  if (!raw || typeof raw !== "object") {
    return defaults;
  }
  const successCount = raw.successCount;
  const neverAsk = raw.neverAsk;
  const completed = raw.completed;
  const lastShownAt = raw.lastShownAt;
  return {
    successCount: typeof successCount === "number" && Number.isFinite(successCount) && successCount >= 0
      ? Math.floor(successCount)
      : defaults.successCount,
    neverAsk: neverAsk === true,
    completed: completed === true,
    lastShownAt: typeof lastShownAt === "number" && Number.isFinite(lastShownAt) && lastShownAt > 0
      ? lastShownAt
      : null
  };
}

function canShowSupportSurvey(state, nowMs = Date.now()) {
  if (state.neverAsk || state.completed) {
    return false;
  }
  if (state.successCount < SUPPORT_SURVEY_THRESHOLD) {
    return false;
  }
  if (state.lastShownAt !== null && nowMs - state.lastShownAt < SUPPORT_SURVEY_COOLDOWN_MS) {
    return false;
  }
  return true;
}

export {
  SUPPORT_SURVEY_THRESHOLD,
  canShowSupportSurvey,
  createDefaultSupportSurveyState,
  normalizeSupportSurveyState
};

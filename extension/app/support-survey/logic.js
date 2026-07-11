import "../../lib/our/support-survey/logic.js";
import { SUPPORT_SURVEY_COOLDOWN_MS, SUPPORT_SURVEY_THRESHOLD } from "./constants.js";

const supportSurveyLogic = globalThis.createSupportSurveyLogic({
  threshold: SUPPORT_SURVEY_THRESHOLD,
  cooldownMs: SUPPORT_SURVEY_COOLDOWN_MS,
});

const {
  addSuccessfulActions,
  canShow: canShowSupportSurvey,
  createDefaultState: createDefaultSupportSurveyState,
  defer: deferSupportSurvey,
  disableForever: disableSupportSurveyForever,
  markCompleted: markSupportSurveyCompleted,
  markShown: markSupportSurveyShown,
  normalizeState: normalizeSupportSurveyState,
} = supportSurveyLogic;

export {
  SUPPORT_SURVEY_THRESHOLD,
  addSuccessfulActions,
  canShowSupportSurvey,
  createDefaultSupportSurveyState,
  deferSupportSurvey,
  disableSupportSurveyForever,
  markSupportSurveyCompleted,
  markSupportSurveyShown,
  normalizeSupportSurveyState,
};

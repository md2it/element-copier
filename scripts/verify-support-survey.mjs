import assert from "node:assert/strict";
import {
  SUPPORT_SURVEY_COOLDOWN_MS,
  SUPPORT_SURVEY_THRESHOLD
} from "../extension/app/support-survey/constants.js";
import {
  canShowSupportSurvey,
  createDefaultSupportSurveyState,
  normalizeSupportSurveyState
} from "../extension/app/support-survey/logic.js";

assert.equal(SUPPORT_SURVEY_THRESHOLD, 3, "threshold must be 3 for testing");

const defaults = createDefaultSupportSurveyState();
assert.deepEqual(defaults, {
  successCount: 0,
  neverAsk: false,
  completed: false,
  lastShownAt: null
});

assert.equal(canShowSupportSurvey({ ...defaults, successCount: 2 }), false);
assert.equal(canShowSupportSurvey({ ...defaults, successCount: 3 }), true);
assert.equal(canShowSupportSurvey({ ...defaults, successCount: 3, neverAsk: true }), false);
assert.equal(canShowSupportSurvey({ ...defaults, successCount: 3, completed: true }), false);

const now = Date.now();
assert.equal(
  canShowSupportSurvey({ ...defaults, successCount: 3, lastShownAt: now - 1000 }, now),
  false
);
assert.equal(
  canShowSupportSurvey(
    { ...defaults, successCount: 3, lastShownAt: now - SUPPORT_SURVEY_COOLDOWN_MS },
    now
  ),
  true
);

assert.deepEqual(
  normalizeSupportSurveyState({ successCount: 4.9, neverAsk: 1, completed: 0, lastShownAt: -1 }),
  {
    successCount: 4,
    neverAsk: false,
    completed: false,
    lastShownAt: null
  }
);

console.log("support-survey logic checks passed");

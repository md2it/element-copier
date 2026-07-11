import assert from "node:assert/strict";
import {
  SUPPORT_SURVEY_COOLDOWN_MS,
  SUPPORT_SURVEY_THRESHOLD
} from "../extension/app/support-survey/constants.js";
import {
  addSuccessfulActions,
  canShowSupportSurvey,
  createDefaultSupportSurveyState,
  deferSupportSurvey,
  normalizeSupportSurveyState
} from "../extension/app/support-survey/logic.js";

assert.equal(SUPPORT_SURVEY_THRESHOLD, 25, "threshold must be 25");

const defaults = createDefaultSupportSurveyState();
assert.deepEqual(defaults, {
  actionCount: 0,
  actionCountAtLastDeferral: 0,
  neverAsk: false,
  completed: false,
  lastShownAt: null
});

assert.equal(canShowSupportSurvey({ ...defaults, actionCount: 24 }), false);
assert.equal(canShowSupportSurvey({ ...defaults, actionCount: 25 }), true);
assert.equal(canShowSupportSurvey({ ...defaults, actionCount: 25, neverAsk: true }), false);
assert.equal(canShowSupportSurvey({ ...defaults, actionCount: 25, completed: true }), false);

const deferredAtHundred = deferSupportSurvey({ ...defaults, actionCount: 100 });
assert.equal(deferredAtHundred.actionCount, 100);
assert.equal(deferredAtHundred.actionCountAtLastDeferral, 100);
assert.equal(canShowSupportSurvey(addSuccessfulActions(deferredAtHundred, 24)), false);
assert.equal(canShowSupportSurvey(addSuccessfulActions(deferredAtHundred, 25)), true);

const now = Date.now();
assert.equal(
  canShowSupportSurvey({ ...defaults, actionCount: 25, lastShownAt: now - 1000 }, now),
  false
);
assert.equal(
  canShowSupportSurvey(
    { ...defaults, actionCount: 25, lastShownAt: now - SUPPORT_SURVEY_COOLDOWN_MS },
    now
  ),
  true
);

assert.deepEqual(
  normalizeSupportSurveyState({ actionCount: 4.9, actionCountAtLastDeferral: 2.9, neverAsk: 1, completed: 0, lastShownAt: -1 }),
  {
    actionCount: 4,
    actionCountAtLastDeferral: 2,
    neverAsk: false,
    completed: false,
    lastShownAt: null
  }
);

console.log("support-survey logic checks passed");

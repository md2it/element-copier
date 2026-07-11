import { ext } from "../../lib/our/api.js";
import { SUPPORT_SURVEY_STORAGE_KEY } from "./constants.js";
import {
  addSuccessfulActions,
  canShowSupportSurvey,
  createDefaultSupportSurveyState,
  deferSupportSurvey,
  disableSupportSurveyForever as disableForever,
  markSupportSurveyCompleted as markCompleted,
  markSupportSurveyShown,
  normalizeSupportSurveyState
} from "./logic.js";

async function readSupportSurveyState() {
  try {
    const data = await ext.storage.local.get(SUPPORT_SURVEY_STORAGE_KEY);
    return normalizeSupportSurveyState(data[SUPPORT_SURVEY_STORAGE_KEY]);
  } catch {
    return createDefaultSupportSurveyState();
  }
}

async function writeSupportSurveyState(state) {
  try {
    await ext.storage.local.set({
      [SUPPORT_SURVEY_STORAGE_KEY]: normalizeSupportSurveyState(state)
    });
    return true;
  } catch {
    return false;
  }
}

async function updateSupportSurveyState(mutator) {
  const current = await readSupportSurveyState();
  const next = normalizeSupportSurveyState(mutator(current));
  await writeSupportSurveyState(next);
  return next;
}

async function incrementSupportSurveySuccessCount() {
  try {
    await updateSupportSurveyState((state) => addSuccessfulActions(state));
  } catch {
  }
}

async function shouldShowSupportSurveyAfterDownload() {
  try {
    const state = await readSupportSurveyState();
    return canShowSupportSurvey(state);
  } catch {
    return false;
  }
}

async function recordSupportSurveyShown() {
  try {
    await updateSupportSurveyState((state) => markSupportSurveyShown(state));
  } catch {
  }
}

async function deferSupportSurveyUntilNextThreshold() {
  try {
    await updateSupportSurveyState((state) => deferSupportSurvey(state));
  } catch {
  }
}

async function disableSupportSurveyForever() {
  try {
    await updateSupportSurveyState((state) => disableForever(state));
  } catch {
  }
}

async function markSupportSurveyCompleted() {
  try {
    await updateSupportSurveyState((state) => markCompleted(state));
  } catch {
  }
}

export {
  disableSupportSurveyForever,
  deferSupportSurveyUntilNextThreshold,
  incrementSupportSurveySuccessCount,
  markSupportSurveyCompleted,
  readSupportSurveyState,
  recordSupportSurveyShown,
  shouldShowSupportSurveyAfterDownload,
  writeSupportSurveyState
};

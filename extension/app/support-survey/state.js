import { ext } from "../../lib/our/api.js";
import { SUPPORT_SURVEY_STORAGE_KEY } from "./constants.js";
import {
  canShowSupportSurvey,
  createDefaultSupportSurveyState,
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
    await updateSupportSurveyState((state) => ({
      ...state,
      successCount: state.successCount + 1
    }));
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
    await updateSupportSurveyState((state) => ({
      ...state,
      lastShownAt: Date.now()
    }));
  } catch {
  }
}

async function resetSupportSurveyCounter() {
  try {
    await updateSupportSurveyState((state) => ({
      ...state,
      successCount: 0
    }));
  } catch {
  }
}

async function disableSupportSurveyForever() {
  try {
    await updateSupportSurveyState((state) => ({
      ...state,
      neverAsk: true
    }));
  } catch {
  }
}

async function markSupportSurveyCompleted() {
  try {
    await updateSupportSurveyState((state) => ({
      ...state,
      completed: true
    }));
  } catch {
  }
}

export {
  disableSupportSurveyForever,
  incrementSupportSurveySuccessCount,
  markSupportSurveyCompleted,
  readSupportSurveyState,
  recordSupportSurveyShown,
  resetSupportSurveyCounter,
  shouldShowSupportSurveyAfterDownload,
  writeSupportSurveyState
};

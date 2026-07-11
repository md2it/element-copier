"use strict";

// Copied into extensions from lib/our/support-survey/ without local changes.
(function () {
  function toCount(value, fallback) {
    return typeof value === "number" && Number.isFinite(value) && value >= 0
      ? Math.floor(value)
      : fallback;
  }

  function createSupportSurveyLogic(options) {
    const threshold = toCount(options?.threshold, 0);
    const cooldownMs = toCount(options?.cooldownMs, 0);

    function createDefaultState() {
      return {
        actionCount: 0,
        actionCountAtLastDeferral: 0,
        neverAsk: false,
        completed: false,
        lastShownAt: null,
      };
    }

    function normalizeState(raw) {
      const defaults = createDefaultState();
      if (!raw || typeof raw !== "object") return defaults;
      const actionCount = toCount(raw.actionCount, defaults.actionCount);
      const actionCountAtLastDeferral = toCount(
        raw.actionCountAtLastDeferral,
        defaults.actionCountAtLastDeferral,
      );
      return {
        actionCount,
        actionCountAtLastDeferral:
          actionCountAtLastDeferral <= actionCount
            ? actionCountAtLastDeferral
            : defaults.actionCountAtLastDeferral,
        neverAsk: raw.neverAsk === true,
        completed: raw.completed === true,
        lastShownAt:
          typeof raw.lastShownAt === "number" &&
          Number.isFinite(raw.lastShownAt) &&
          raw.lastShownAt > 0
            ? raw.lastShownAt
            : null,
      };
    }

    function addSuccessfulActions(state, amount = 1) {
      const normalized = normalizeState(state);
      const increment = toCount(amount, 0);
      return {
        ...normalized,
        actionCount: normalized.actionCount + increment,
      };
    }

    function canShow(state, now = Date.now()) {
      const normalized = normalizeState(state);
      if (normalized.neverAsk || normalized.completed) return false;
      if (normalized.actionCount < normalized.actionCountAtLastDeferral + threshold) return false;
      return (
        normalized.lastShownAt === null ||
        now - normalized.lastShownAt >= cooldownMs
      );
    }

    function markShown(state, now = Date.now()) {
      return { ...normalizeState(state), lastShownAt: now };
    }

    function defer(state) {
      const normalized = normalizeState(state);
      return {
        ...normalized,
        actionCountAtLastDeferral: normalized.actionCount,
      };
    }

    function disableForever(state) {
      return { ...normalizeState(state), neverAsk: true };
    }

    function markCompleted(state) {
      return { ...normalizeState(state), completed: true };
    }

    return {
      addSuccessfulActions,
      canShow,
      createDefaultState,
      defer,
      disableForever,
      markCompleted,
      markShown,
      normalizeState,
    };
  }

  globalThis.createSupportSurveyLogic = createSupportSurveyLogic;
})();

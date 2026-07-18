import {
  SUPPORT_SURVEY_FEEDBACK_EMAIL,
  SUPPORT_SURVEY_GITHUB_URL,
  getSupportSurveyStoreListingUrl,
  getSupportSurveyStoreRateLabel
} from "./constants.js";
import {
  disableSupportSurveyForever,
  deferSupportSurveyUntilNextThreshold,
  markSupportSurveyCompleted,
  recordSupportSurveyShown,
} from "./state.js";

function createSurveyButton(label, className = "ec-support-survey-btn") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  return button;
}

function openExternalUrl(url) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

function createSupportSurveyModal(mountRoot, strings) {
  let step = "useful";
  let closed = false;
  const overlay = document.createElement("div");
  overlay.className = "ec-support-survey-overlay";
  const windowEl = document.createElement("div");
  windowEl.className = "ec-support-survey-window";
  windowEl.setAttribute("role", "dialog");
  windowEl.setAttribute("aria-modal", "true");
  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "ec-support-survey-close";
  closeBtn.setAttribute("aria-label", strings.infoWindowCloseLabel);
  closeBtn.innerHTML = "&times;";
  const title = document.createElement("h3");
  title.className = "ec-support-survey-title";
  title.style.whiteSpace = "pre-line";
  const actions = document.createElement("div");
  actions.className = "ec-support-survey-actions";
  windowEl.append(closeBtn, title, actions);
  overlay.append(windowEl);

  const remove = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKeyDown, true);
    overlay.remove();
  };

  const dismissLater = async () => {
    await deferSupportSurveyUntilNextThreshold();
    remove();
  };

  const dismissNever = async () => {
    await disableSupportSurveyForever();
    remove();
  };

  const completeWithUrl = async (url) => {
    await markSupportSurveyCompleted();
    openExternalUrl(url);
    remove();
  };

  function onKeyDown(event) {
    if (event.key === "Escape") {
      event.stopPropagation();
    }
  }

  function renderUsefulStep() {
    step = "useful";
    title.textContent = strings.supportSurveyUsefulQuestion;
    actions.replaceChildren();
    const askLater = createSurveyButton(strings.supportSurveyAskMeLater, "ec-support-survey-btn ec-support-survey-btn--secondary");
    askLater.addEventListener("click", () => {
      void dismissLater();
    });
    const neverAsk = createSurveyButton(strings.supportSurveyNeverAsk, "ec-support-survey-btn ec-support-survey-btn--secondary");
    neverAsk.addEventListener("click", () => {
      void dismissNever();
    });
    const noBtn = createSurveyButton(strings.supportSurveyNo, "ec-support-survey-btn ec-support-survey-btn--secondary");
    noBtn.addEventListener("click", () => {
      renderFeedbackStep();
    });
    const yesBtn = createSurveyButton(strings.supportSurveyYes);
    yesBtn.addEventListener("click", () => {
      renderSupportStep();
    });
    actions.append(askLater, neverAsk, noBtn, yesBtn);
  }

  function renderSupportStep() {
    step = "support";
    title.textContent = strings.supportSurveyThankYouTitle;
    actions.replaceChildren();
    const later = createSurveyButton(strings.supportSurveyLater, "ec-support-survey-btn ec-support-survey-btn--secondary");
    later.addEventListener("click", () => {
      void dismissLater();
    });
    const star = createSurveyButton(strings.supportSurveyStarOnGitHub);
    star.addEventListener("click", () => {
      void completeWithUrl(SUPPORT_SURVEY_GITHUB_URL);
    });
    const rate = createSurveyButton(getSupportSurveyStoreRateLabel());
    rate.addEventListener("click", () => {
      void completeWithUrl(getSupportSurveyStoreListingUrl());
    });
    actions.append(later, star, rate);
  }

  function renderFeedbackStep() {
    step = "feedback";
    title.textContent = strings.supportSurveySorryTitle;
    actions.replaceChildren();
    const email = createSurveyButton(strings.supportSurveySendEmail);
    email.addEventListener("click", () => {
      openExternalUrl(`mailto:${SUPPORT_SURVEY_FEEDBACK_EMAIL}`);
    });
    const later = createSurveyButton(strings.supportSurveyLater, "ec-support-survey-btn ec-support-survey-btn--secondary");
    later.addEventListener("click", () => {
      void dismissLater();
    });
    const neverAsk = createSurveyButton(strings.supportSurveyNeverAsk, "ec-support-survey-btn ec-support-survey-btn--secondary");
    neverAsk.addEventListener("click", () => {
      void dismissNever();
    });
    actions.append(email, later, neverAsk);
  }

  closeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    void dismissLater();
  });

  overlay.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  windowEl.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  renderUsefulStep();
  mountRoot.append(overlay);
  document.addEventListener("keydown", onKeyDown, true);
  void recordSupportSurveyShown();

  return { close: remove };
}

export { createSupportSurveyModal };

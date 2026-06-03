"use strict";
(() => {
  // src/lib/src/api.ts
  var ext = typeof browser !== "undefined" ? browser : chrome;

  // src/lib/src/i18n/locale-code.ts
  function localeToHtmlLang(locale) {
    return locale.replace(/_/g, "-");
  }

  // src/lib/src/panel-header/header.ts
  function createPanelDivider() {
    const divider = document.createElement("div");
    divider.className = "dd-panel-divider";
    divider.setAttribute("aria-hidden", "true");
    return divider;
  }
  function createPanelHeader(options) {
    const header = document.createElement("div");
    header.className = "dd-panel-header";
    const titleRow = document.createElement("div");
    titleRow.className = "dd-panel-title-row";
    const logo = document.createElement("span");
    logo.className = "dd-panel-logo";
    logo.setAttribute("aria-hidden", "true");
    if (options.logoSvg) {
      logo.innerHTML = options.logoSvg;
    }
    const heading = document.createElement("div");
    heading.className = "dd-panel-heading";
    const title = document.createElement("p");
    title.className = "dd-panel-title";
    title.textContent = options.title;
    const subtitle = document.createElement("p");
    subtitle.className = "dd-panel-subtitle";
    subtitle.textContent = options.subtitle;
    heading.append(title, subtitle);
    titleRow.append(logo, heading);
    header.append(titleRow);
    return header;
  }

  // src/lib/src/welcome/page.ts
  var WELCOME_BODY_MIN_VAR = "--welcome-body-min";
  var WELCOME_PROBE_WIDTH = "360px";
  var PANEL_HEADER_STYLE_ID = "dd-panel-header-styles";
  function ensurePanelHeaderStyles() {
    if (document.getElementById(PANEL_HEADER_STYLE_ID)) return;
    const css = '.ec-panel-header,\n.dd-panel-header {\n  flex: 0 0 auto;\n  padding: 1.125rem 1.125rem 0;\n}\n\n.ec-panel-divider,\n.dd-panel-divider {\n  flex: 0 0 auto;\n  width: 90%;\n  height: 1px;\n  margin-inline: auto;\n  background: #012292;\n}\n\n.dd-panel-title-row {\n  display: grid;\n  grid-template-columns: 1fr;\n  grid-template-areas: "stack";\n  align-items: center;\n}\n\n.dd-panel-logo,\n.dd-panel-heading {\n  grid-area: stack;\n}\n\n.dd-panel-logo {\n  display: flex;\n  align-items: stretch;\n  align-self: stretch;\n  justify-self: start;\n  line-height: 0;\n  z-index: 1;\n}\n\n.dd-panel-logo svg {\n  display: block;\n  height: 100%;\n  width: auto;\n  aspect-ratio: 1;\n  flex-shrink: 0;\n}\n\n.dd-panel-heading {\n  justify-self: center;\n  align-self: center;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  gap: 0.12rem;\n  min-width: 0;\n  max-width: 100%;\n  font-size: 0.82rem;\n}\n\n.dd-panel-title {\n  margin: 0;\n  font-size: inherit;\n  font-weight: 800;\n  letter-spacing: 0.14em;\n  text-align: center;\n  text-transform: uppercase;\n  color: #012292;\n}\n\n.dd-panel-subtitle {\n  margin: 0;\n  font-size: 0.68rem;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n  line-height: 1.2;\n  white-space: nowrap;\n  text-align: center;\n  color: #666666;\n}\n';
    if (!css) return;
    const style = document.createElement("style");
    style.id = PANEL_HEADER_STYLE_ID;
    style.textContent = css;
    document.head.append(style);
  }
  var welcomeHeaderEl = null;
  var welcomeBodyMinPx = null;
  var welcomePinHintRtl = false;
  function stepIcon(iconHtml) {
    const span = document.createElement("span");
    span.className = "step-icon";
    span.innerHTML = iconHtml;
    span.setAttribute("aria-hidden", "true");
    return span;
  }
  function stepWithIcon(text, iconHtml) {
    const li = document.createElement("li");
    li.append(document.createTextNode(`${text} `), stepIcon(iconHtml));
    return li;
  }
  function stepWithExtension(text, iconSvg, iconUrl, name) {
    const li = document.createElement("li");
    const icon = document.createElement("span");
    icon.className = "step-icon step-icon--ext";
    icon.setAttribute("aria-hidden", "true");
    if (iconSvg) {
      icon.innerHTML = iconSvg;
    } else if (iconUrl) {
      const img = document.createElement("img");
      img.className = "ext-icon";
      img.src = iconUrl;
      img.alt = "";
      img.width = 16;
      img.height = 16;
      icon.append(img);
    }
    li.append(document.createTextNode(`${text} `), icon, document.createTextNode(` ${name}`));
    return li;
  }
  function createAboutItem(item) {
    const li = document.createElement("li");
    li.className = `about-item about-item--${item.iconKind}`;
    const mark = document.createElement("span");
    mark.className = item.iconKind === "toolbar" ? "about-icon about-icon--toolbar" : "about-icon";
    mark.setAttribute("aria-hidden", "true");
    mark.innerHTML = item.iconHtml;
    const label = document.createElement("span");
    label.className = "about-text";
    label.textContent = item.text;
    li.append(mark, label);
    return li;
  }
  function mergeWelcomeLocale(base, localeCode) {
    const localePayload = base.perLocale?.[localeCode];
    if (!localePayload) return base;
    return { ...base, ...localePayload, locale: localeCode };
  }
  function mountWelcomeHeader(data) {
    const mount = document.getElementById("welcome-header-mount");
    if (!mount) return;
    if (!welcomeHeaderEl) {
      welcomeHeaderEl = createPanelHeader({
        title: data.headerTitle,
        subtitle: data.headerSubtitle,
        logoSvg: data.headerLogoSvg
      });
      mount.replaceWith(welcomeHeaderEl, createPanelDivider());
      return;
    }
    welcomeHeaderEl.querySelector(".dd-panel-title").textContent = data.headerTitle;
    welcomeHeaderEl.querySelector(".dd-panel-subtitle").textContent = data.headerSubtitle;
  }
  function fillLangRow(langRow, data, onSelect) {
    if (!data.hasLocales || !Array.isArray(data.locales)) return;
    langRow.setAttribute("aria-label", data.langAriaLabel ?? "");
    langRow.replaceChildren();
    for (const code of data.locales) {
      const langBtn = document.createElement("button");
      langBtn.type = "button";
      langBtn.className = "dd-chip dd-lang-btn";
      langBtn.textContent = data.localeLabels?.[code] ?? code;
      langBtn.classList.toggle("is-active", code === data.locale);
      if (onSelect) {
        langBtn.addEventListener("click", () => {
          onSelect(code);
        });
      }
      langRow.appendChild(langBtn);
    }
  }
  function populateWelcomeBody(body, data) {
    const langBlock = document.createElement("div");
    langBlock.className = "lang-block";
    const langRow = document.createElement("div");
    langRow.className = "dd-lang-row";
    langRow.id = "lang-row";
    langRow.setAttribute("role", "group");
    fillLangRow(langRow, data);
    langBlock.appendChild(langRow);
    const pinSep = document.createElement("hr");
    pinSep.className = "welcome-sep";
    pinSep.id = "pin-sep";
    const pinBlock = document.createElement("div");
    pinBlock.className = "pin-block";
    const pinHeading = document.createElement("p");
    pinHeading.className = "pin-heading";
    pinHeading.id = "pin-heading";
    pinHeading.textContent = data.pinHeading;
    const steps = document.createElement("ol");
    steps.className = "pin-steps";
    steps.id = "pin-steps";
    steps.append(
      stepWithIcon(data.pinStep1, data.puzzleIcon),
      stepWithExtension(data.pinStep2, data.iconSvg, void 0, data.extensionName),
      stepWithIcon(data.pinStep3, data.pinIcon)
    );
    pinBlock.append(pinHeading, steps);
    const nodes = [langBlock, pinSep, pinBlock];
    const aboutItems = data.aboutItems;
    if (data.hasAbout && Array.isArray(aboutItems) && aboutItems.length > 0) {
      const aboutSep = document.createElement("hr");
      aboutSep.className = "welcome-sep";
      aboutSep.id = "about-sep";
      const aboutHeading = document.createElement("p");
      aboutHeading.className = "about-heading";
      aboutHeading.id = "about-heading";
      aboutHeading.textContent = data.aboutHeading;
      const aboutList = document.createElement("ul");
      aboutList.className = "about-list";
      aboutList.id = "about-list";
      aboutList.append(...aboutItems.map(createAboutItem));
      nodes.push(aboutSep, aboutHeading, aboutList);
    }
    body.replaceChildren(...nodes);
  }
  function renderWelcomeContent(data, config) {
    document.documentElement.lang = localeToHtmlLang(data.locale);
    welcomePinHintRtl = data.dir === "rtl" || config.isRtlLocale(data.locale);
    document.documentElement.dir = welcomePinHintRtl ? "rtl" : "ltr";
    mountWelcomeHeader(data);
    const body = document.querySelector(".welcome-body");
    if (body) populateWelcomeBody(body, data);
  }
  function syncLangButtons(data, config) {
    const langRow = document.getElementById("lang-row");
    if (!langRow) return;
    fillLangRow(langRow, data, (code) => {
      void switchWelcomeLocale(data, code, config);
    });
  }
  async function switchWelcomeLocale(base, localeCode, config) {
    if (localeCode === base.locale) return;
    await ext.storage.local.set({
      [config.localeStorageKey]: localeCode,
      [config.localeUserSelectedKey]: true
    });
    const next = mergeWelcomeLocale(base, localeCode);
    renderWelcomeContent(next, config);
    syncLangButtons(next, config);
    requestAnimationFrame(() => positionPinHint());
  }
  function measureWelcomeBodyHeight(base, localeCode) {
    const data = mergeWelcomeLocale(base, localeCode);
    const shell = document.createElement("div");
    shell.className = "welcome";
    shell.style.cssText = `position:fixed;left:-9999px;width:${WELCOME_PROBE_WIDTH};visibility:hidden;pointer-events:none;`;
    const body = document.createElement("div");
    body.className = "welcome-body";
    shell.appendChild(body);
    document.body.appendChild(shell);
    populateWelcomeBody(body, data);
    const height = body.getBoundingClientRect().height;
    shell.remove();
    return height;
  }
  function measureMaxWelcomeBodyHeight(base) {
    let max = 0;
    for (const code of base.locales ?? []) {
      max = Math.max(max, measureWelcomeBodyHeight(base, code));
    }
    return max;
  }
  function applyWelcomeBodyMinHeight(base) {
    const body = document.querySelector(".welcome-body");
    if (!body) return;
    if (welcomeBodyMinPx == null) {
      welcomeBodyMinPx = measureMaxWelcomeBodyHeight(base);
    }
    body.style.setProperty(WELCOME_BODY_MIN_VAR, `${welcomeBodyMinPx}px`);
  }
  var PIN_HINT_EDGE = 24;
  var PIN_HINT_EDGE_RATIO = 0.2;
  function positionPinHint() {
    const hint = document.getElementById("pin-hint");
    const welcome = document.querySelector(".welcome");
    if (!hint || !welcome || hint.hidden || hint.getAttribute("aria-hidden") === "true") return;
    const rect = welcome.getBoundingClientRect();
    const rtl = welcomePinHintRtl;
    const viewportCornerX = rtl ? PIN_HINT_EDGE : window.innerWidth - PIN_HINT_EDGE;
    const gap = rtl ? Math.max(0, rect.left - PIN_HINT_EDGE) : Math.max(0, viewportCornerX - rect.right);
    const x = rtl ? PIN_HINT_EDGE + gap * PIN_HINT_EDGE_RATIO : viewportCornerX - gap * PIN_HINT_EDGE_RATIO;
    hint.style.direction = "ltr";
    hint.style.transform = "translateX(-50%)";
    hint.style.left = `${Math.round(x)}px`;
    hint.style.right = "auto";
  }
  function bindPinHintPosition() {
    const welcome = document.querySelector(".welcome");
    if (!welcome) return;
    const reposition = () => positionPinHint();
    window.addEventListener("resize", reposition, { passive: true });
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(reposition);
      observer.observe(welcome);
    }
    requestAnimationFrame(reposition);
  }
  function syncPinHintVariant(pinned) {
    const hint = document.getElementById("pin-hint");
    const guide = document.getElementById("pin-hint-guide");
    const pinnedBlock = document.getElementById("pin-hint-pinned");
    if (!hint || !guide || !pinnedBlock) return;
    hint.hidden = false;
    hint.setAttribute("aria-hidden", "false");
    guide.hidden = pinned;
    pinnedBlock.hidden = !pinned;
    requestAnimationFrame(() => positionPinHint());
  }
  function setupPinHint(data, config) {
    const arrowEl = document.getElementById("pin-hint-arrow");
    const pinEl = document.getElementById("pin-hint-pin");
    const heartEl = document.getElementById("pin-hint-heart");
    if (arrowEl && data.arrowUpIcon) arrowEl.innerHTML = data.arrowUpIcon;
    if (pinEl && data.pinHintIcon) pinEl.innerHTML = data.pinHintIcon;
    if (heartEl && data.heartIcon) heartEl.innerHTML = data.heartIcon;
    const pinned = data.isPinned === true;
    syncPinHintVariant(pinned);
    bindPinHintPosition();
    ext.runtime.onMessage.addListener((message) => {
      if (message?.type === config.pinStatusChangedMessageType && message.pinned) {
        syncPinHintVariant(true);
      }
    });
    if (!pinned) {
      void ext.runtime.sendMessage({ type: config.watchPinStatusMessageType });
    }
  }
  async function bootstrapWelcomePage(config) {
    ensurePanelHeaderStyles();
    const { [config.sessionDataKey]: welcomeData } = await ext.storage.session.get(
      config.sessionDataKey
    );
    if (!welcomeData?.locale) return;
    const data = welcomeData;
    renderWelcomeContent(data, config);
    applyWelcomeBodyMinHeight(data);
    syncLangButtons(data, config);
    setupPinHint(data, config);
  }

  // src/lib/src/i18n/rtl.ts
  var RTL_LOCALES = /* @__PURE__ */ new Set(["ar"]);
  function isRtlLocale(locale) {
    return RTL_LOCALES.has(locale);
  }

  // src/welcome/constants.ts
  var WELCOME_SESSION_DATA_KEY = "welcomeData";

  // src/welcome/page.ts
  void bootstrapWelcomePage({
    sessionDataKey: WELCOME_SESSION_DATA_KEY,
    localeStorageKey: "locale",
    localeUserSelectedKey: "localeUserSelected",
    pinStatusChangedMessageType: "PIN_STATUS_CHANGED",
    watchPinStatusMessageType: "WATCH_PIN_STATUS",
    isRtlLocale
  });
})();

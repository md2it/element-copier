import { PANEL_BODY_CENTERED_CLASS, buildAboutPanelBody, buildCopiedPanelBody, buildLoadingPanelBody, buildSettingsPanelBody, buildShortcutsPanelBody, buildStartPanelBody } from "./panel-body.js";
import { PANEL_MENU_TABS } from "./constants.js";
import { createPanelSurface } from "./build-panel-surface.js";
import { hasPickCopyCacheInStorage } from "../pick-mode/pick-copy-cache-storage.js";
import { isRtlLocale } from "../../lib/our/i18n/rtl.js";
import { localeToHtmlLang } from "../../lib/our/i18n/locale-code.js";
import { notifyCopyPage, notifyPanelClosed, notifyPanelTabChanged, notifyStartPickMode } from "./lifecycle.js";
import { setLocale } from "../storage.js";
import { syncPanelThemeFromStorage } from "./panel-theme.js";
import { t } from "../i18n/strings.js";

function isMenuTab(tab) {
  return PANEL_MENU_TABS.includes(tab);
}

var CopierPanelWindow = class {
  constructor(host) {
    this.host = host;
  }
  panelRoot = null;
  body = null;
  menu = null;
  isOpen() {
    return this.panelRoot !== null && this.body !== null;
  }
  async openPanel(tab) {
    this.close();
    const locale = this.host.getLocale();
    const { panelRoot, body, menu } = await createPanelSurface(locale, this.host.surface);
    this.panelRoot = panelRoot;
    this.body = body;
    this.menu = menu;
    if (menu) {
      menu.onSelect = (nextTab) => {
        void this.showTab(nextTab);
      };
    }
    this.host.shadow.appendChild(panelRoot);
    await syncPanelThemeFromStorage();
    await this.renderTab(tab);
  }
  async showTab(tab) {
    if (!this.body || !this.panelRoot) return;
    await this.renderTab(tab);
  }
  close() {
    this.panelRoot = null;
    this.body = null;
    this.menu = null;
    const panelRoots = Array.from(
      this.host.shadow.querySelectorAll(".ec-panel")
    );
    if (!panelRoots.length) return;
    panelRoots.forEach((node) => node.remove());
    notifyPanelClosed();
    this.host.onClose?.();
  }
  syncPickModeForTab(tab) {
    notifyPanelTabChanged(tab);
  }
  /** CAPTURE PAGE — copy full page without pick mode, keep popup open. */
  copyPageInPopup() {
    notifyCopyPage();
  }
  /** PICK ELEMENT — enable pick mode and close the panel. */
  startPickModeAndClose() {
    notifyStartPickMode();
    this.close();
  }
  applyLocaleToPanelChrome() {
    if (!this.panelRoot) return;
    const locale = this.host.getLocale();
    const strings = t(locale);
    this.panelRoot.lang = localeToHtmlLang(locale);
    this.panelRoot.dir = isRtlLocale(locale) ? "rtl" : "ltr";
    const subtitle = this.panelRoot.querySelector(".dd-panel-subtitle");
    if (subtitle) subtitle.textContent = strings.panelSubtitle;
    this.menu?.syncStrings(strings);
  }
  async changeSettingsLocale(code) {
    if (code === this.host.getLocale()) return;
    await setLocale(code);
    this.host.setLocale?.(code);
    this.applyLocaleToPanelChrome();
    await this.showTab("settings");
  }
  async renderTab(tab) {
    if (!this.body) return;
    this.applyLocaleToPanelChrome();
    const strings = t(this.host.getLocale());
    const centered = tab === "start" || tab === "loading";
    this.body.classList.toggle(PANEL_BODY_CENTERED_CLASS, centered);
    switch (tab) {
      case "start":
        buildStartPanelBody(this.body, strings, {
          onStart: () => {
            this.startPickModeAndClose();
          },
          onCopyPage: () => {
            this.copyPageInPopup();
          }
        });
        break;
      case "copied":
        await buildCopiedPanelBody(this.body, strings, {
          enableSupportSurvey: this.host.surface === "popup",
          onStartOver: () => {
            this.startPickModeAndClose();
          },
          onNewPage: () => {
            this.copyPageInPopup();
          }
        });
        break;
      case "settings":
        await buildSettingsPanelBody(this.body, strings, {
          getLocale: () => this.host.getLocale(),
          onLocaleSelect: (code) => this.changeSettingsLocale(code)
        });
        break;
      case "shortcuts":
        buildShortcutsPanelBody(this.body, strings);
        break;
      case "about":
        buildAboutPanelBody(this.body, strings);
        break;
      case "loading":
        buildLoadingPanelBody(this.body, strings);
        break;
    }
    if (this.menu) {
      const hasCache = await hasPickCopyCacheInStorage();
      this.menu.setCacheState(hasCache);
      this.menu.setActive(isMenuTab(tab) ? tab : null);
    }
    this.syncPickModeForTab(tab);
    await this.host.onAfterTabRender?.();
  }
};

export { CopierPanelWindow, isMenuTab };

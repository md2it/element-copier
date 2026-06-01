import { isRtlLocale, t, type Locale } from "../i18n";
import { localeToHtmlLang } from "../../../lib/src/i18n/locale-code";
import { setLocale } from "../storage";
import { createPanelSurface } from "./build-panel-surface";
import type { PanelMenuTab, PanelPopupTab } from "./constants";
import { PANEL_MENU_TABS } from "./constants";
import {
  buildAboutPanelBody,
  buildCopiedPanelBody,
  buildLoadingPanelBody,
  buildSettingsPanelBody,
  buildStartPanelBody,
  buildShortcutsPanelBody,
  PANEL_BODY_CENTERED_CLASS,
} from "./panel-body";
import { hasPickCopyCacheInStorage } from "../pick-mode/pick-copy-cache-storage";
import type { PanelMenuHandle } from "./panel-menu";
import {
  notifyPanelClosed,
  notifyPanelTabChanged,
  notifyCopyPage,
  notifyStartPickMode,
} from "./lifecycle";
import { syncPanelThemeFromStorage } from "./panel-theme";

export type CopierPanelHost = {
  shadow: ShadowRoot;
  surface?: "popup";
  onClose?: () => void;
  getLocale: () => Locale;
  setLocale?: (locale: Locale) => void;
  onAfterTabRender?: () => void | Promise<void>;
};

function isMenuTab(tab: PanelPopupTab): tab is PanelMenuTab {
  return (PANEL_MENU_TABS as readonly string[]).includes(tab);
}

export class CopierPanelWindow {
  private panelRoot: HTMLDivElement | null = null;
  private body: HTMLDivElement | null = null;
  private menu: PanelMenuHandle | null = null;

  constructor(private readonly host: CopierPanelHost) {}

  isOpen(): boolean {
    return this.panelRoot !== null && this.body !== null;
  }

  async openPanel(tab: PanelPopupTab): Promise<void> {
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

  async showTab(tab: PanelPopupTab): Promise<void> {
    if (!this.body || !this.panelRoot) return;
    await this.renderTab(tab);
  }

  close(): void {
    this.panelRoot = null;
    this.body = null;
    this.menu = null;

    const panelRoots = Array.from(
      this.host.shadow.querySelectorAll<HTMLElement>(".ec-panel"),
    );
    if (!panelRoots.length) return;
    panelRoots.forEach((node) => node.remove());
    notifyPanelClosed();
    this.host.onClose?.();
  }

  private syncPickModeForTab(tab: PanelPopupTab): void {
    notifyPanelTabChanged(tab);
  }

  /** CAPTURE PAGE — copy full page without pick mode, keep popup open. */
  private copyPageInPopup(): void {
    notifyCopyPage();
  }

  /** PICK ELEMENT — enable pick mode and close the panel. */
  private startPickModeAndClose(): void {
    notifyStartPickMode();
    this.close();
  }

  private applyLocaleToPanelChrome(): void {
    if (!this.panelRoot) return;

    const locale = this.host.getLocale();
    const strings = t(locale);
    this.panelRoot.lang = localeToHtmlLang(locale);
    this.panelRoot.dir = isRtlLocale(locale) ? "rtl" : "ltr";

    const subtitle = this.panelRoot.querySelector(".dd-panel-subtitle");
    if (subtitle) subtitle.textContent = strings.panelSubtitle;

    this.menu?.syncStrings(strings);
  }

  private async changeSettingsLocale(code: Locale): Promise<void> {
    if (code === this.host.getLocale()) return;

    await setLocale(code);
    this.host.setLocale?.(code);
    this.applyLocaleToPanelChrome();
    await this.showTab("settings");
  }

  private async renderTab(tab: PanelPopupTab): Promise<void> {
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
          },
        });
        break;
      case "copied":
        await buildCopiedPanelBody(this.body, strings, {
          onStartOver: () => {
            this.startPickModeAndClose();
          },
          onNewPage: () => {
            this.copyPageInPopup();
          },
        });
        break;
      case "settings":
        await buildSettingsPanelBody(this.body, strings, {
          getLocale: () => this.host.getLocale(),
          onLocaleSelect: (code) => this.changeSettingsLocale(code),
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
}

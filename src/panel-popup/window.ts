import type { Locale } from "../i18n";
import { t } from "../i18n";
import { createPanelSurface } from "./build-panel-surface";
import type { PanelMenuTab, PanelPopupTab } from "./constants";
import { PANEL_MENU_TABS } from "./constants";
import { bindDismissOnLeave, type DismissOnLeaveHandle } from "./dismiss-on-leave";
import {
  buildAboutPanelBody,
  buildCopiedPanelBody,
  buildLanguagePanelBody,
  buildSettingsPanelBody,
  buildStartPanelBody,
  buildShortcutsPanelBody,
  PANEL_BODY_CENTERED_CLASS,
} from "./panel-body";
import type { PanelMenuHandle } from "./panel-menu";
import {
  notifyPanelClosed,
  notifyPanelTabChanged,
  notifyStartPickMode,
} from "./lifecycle";

export type CopierPanelHost = {
  shadow: ShadowRoot;
  surface?: "popup";
  onClose?: () => void;
  getLocale: () => Locale;
  onAfterTabRender?: () => void | Promise<void>;
};

function isMenuTab(tab: PanelPopupTab): tab is PanelMenuTab {
  return (PANEL_MENU_TABS as readonly string[]).includes(tab);
}

export class CopierPanelWindow {
  private dismissHandle: DismissOnLeaveHandle | null = null;
  private panelRoot: HTMLDivElement | null = null;
  private body: HTMLDivElement | null = null;
  private menu: PanelMenuHandle | null = null;

  constructor(private readonly host: CopierPanelHost) {}

  async openPanel(tab: PanelPopupTab): Promise<void> {
    this.close();

    const locale = this.host.getLocale();
    const { panelRoot, body, menu } = createPanelSurface(locale, this.host.surface);

    this.panelRoot = panelRoot;
    this.body = body;
    this.menu = menu;

    if (menu) {
      menu.onSelect = (nextTab) => {
        void this.showTab(nextTab);
      };
    }

    this.host.shadow.appendChild(panelRoot);
    await this.renderTab(tab);
    this.dismissHandle = bindDismissOnLeave(panelRoot, () => this.close());
  }

  async showTab(tab: PanelPopupTab): Promise<void> {
    if (!this.body || !this.panelRoot) return;
    await this.renderTab(tab);
  }

  close(): void {
    this.dismissHandle?.unbind();
    this.dismissHandle = null;
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

  private async renderTab(tab: PanelPopupTab): Promise<void> {
    if (!this.body) return;

    const strings = t(this.host.getLocale());

    const centered = tab === "start" || tab === "copied";
    this.body.classList.toggle(PANEL_BODY_CENTERED_CLASS, centered);

    switch (tab) {
      case "start":
        buildStartPanelBody(this.body, strings, {
          onStart: () => {
            notifyStartPickMode();
            this.close();
          },
        });
        break;
      case "copied":
        await buildCopiedPanelBody(this.body, strings, {
          onOpenSettings: () => {
            void this.showTab("settings");
          },
        });
        break;
      case "settings":
        await buildSettingsPanelBody(this.body, strings);
        break;
      case "shortcuts":
        buildShortcutsPanelBody(this.body, strings);
        break;
      case "language":
        buildLanguagePanelBody(this.body, strings);
        break;
      case "about":
        buildAboutPanelBody(this.body, strings);
        break;
    }

    if (this.menu) {
      this.menu.setActive(isMenuTab(tab) ? tab : null);
    }

    this.syncPickModeForTab(tab);
    await this.host.onAfterTabRender?.();
  }
}

import type { Strings } from "../i18n";
import { FILES, HISTORY, INFO, SETTINGS } from "../icons";
import type { PanelMenuTab } from "./constants";

type MenuItemDef = {
  tab: PanelMenuTab;
  iconSvg: string;
  label: (strings: Strings) => string;
};

const MENU_ITEMS: readonly MenuItemDef[] = [
  { tab: "start", iconSvg: FILES, label: (s) => s.titleSettings },
  { tab: "settings", iconSvg: SETTINGS, label: (s) => s.pageSettingsTitle },
  { tab: "history", iconSvg: HISTORY, label: (s) => s.pageHistoryTitle },
  { tab: "about", iconSvg: INFO, label: (s) => s.tabAbout },
];

export type PanelMenuHandle = {
  root: HTMLElement;
  setActive: (tab: PanelMenuTab | null) => void;
  onSelect: (tab: PanelMenuTab) => void;
};

export function createPanelMenu(strings: Strings): PanelMenuHandle {
  const nav = document.createElement("nav");
  nav.className = "ec-panel-menu";
  nav.setAttribute("aria-label", "Panel pages");

  const buttons = new Map<PanelMenuTab, HTMLButtonElement>();

  for (const item of MENU_ITEMS) {
    const label = item.label(strings);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ec-panel-menu-btn";
    button.innerHTML = item.iconSvg;
    button.setAttribute("aria-label", label);
    button.dataset.tooltip = label;
    buttons.set(item.tab, button);
    nav.append(button);
  }

  const handle: PanelMenuHandle = {
    root: nav,
    setActive(tab) {
      for (const [menuTab, button] of buttons) {
        const active = tab !== null && menuTab === tab;
        button.classList.toggle("ec-panel-menu-btn--active", active);
        button.setAttribute("aria-current", active ? "page" : "false");
      }
    },
    onSelect: () => {},
  };

  nav.addEventListener("click", (event) => {
    const target = (event.target as Element | null)?.closest<HTMLButtonElement>(
      ".ec-panel-menu-btn",
    );
    if (!target) return;
    for (const [tab, button] of buttons) {
      if (button === target) {
        handle.onSelect(tab);
        return;
      }
    }
  });

  return handle;
}

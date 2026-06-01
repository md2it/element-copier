import type { Strings } from "../i18n";
import { FILES, INFO, KEYBOARD, PLAY, SETTINGS } from "../icons";
import type { PanelMenuTab } from "./constants";

type MenuItemDef = {
  tab: PanelMenuTab;
  iconSvg: string;
  label: (strings: Strings) => string;
};

const START_ITEM: MenuItemDef = {
  tab: "start",
  iconSvg: PLAY,
  label: (s) => s.titleSettings,
};

const COPIED_ITEM: MenuItemDef = {
  tab: "copied",
  iconSvg: FILES,
  label: (s) => s.tabCopied,
};

const SECONDARY_MENU_ITEMS: readonly MenuItemDef[] = [
  { tab: "settings", iconSvg: SETTINGS, label: (s) => s.pageSettingsTitle },
  { tab: "shortcuts", iconSvg: KEYBOARD, label: (s) => s.tabShortcuts },
  { tab: "about", iconSvg: INFO, label: (s) => s.tabAbout },
];

function resolvePrimaryItem(hasCache: boolean): MenuItemDef {
  return hasCache ? COPIED_ITEM : START_ITEM;
}

function resolveMenuItems(hasCache: boolean): readonly MenuItemDef[] {
  return [resolvePrimaryItem(hasCache), ...SECONDARY_MENU_ITEMS];
}

function createMenuButton(item: MenuItemDef, strings: Strings): HTMLButtonElement {
  const label = item.label(strings);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ec-panel-menu-btn";
  button.innerHTML = item.iconSvg;
  button.setAttribute("aria-label", label);
  button.dataset.tooltip = label;
  return button;
}

export type PanelMenuHandle = {
  root: HTMLElement;
  setActive: (tab: PanelMenuTab | null) => void;
  setCacheState: (hasCache: boolean) => void;
  syncStrings: (strings: Strings) => void;
  onSelect: (tab: PanelMenuTab) => void;
};

export function createPanelMenu(strings: Strings, hasCache: boolean): PanelMenuHandle {
  const nav = document.createElement("nav");
  nav.className = "ec-panel-menu";
  nav.setAttribute("aria-label", "Panel pages");

  const buttons = new Map<PanelMenuTab, HTMLButtonElement>();
  let primaryHasCache = hasCache;

  function mountItems(nextHasCache: boolean): void {
    nav.replaceChildren();
    buttons.clear();
    for (const item of resolveMenuItems(nextHasCache)) {
      const button = createMenuButton(item, strings);
      buttons.set(item.tab, button);
      nav.append(button);
    }
    primaryHasCache = nextHasCache;
  }

  mountItems(hasCache);

  function syncStrings(nextStrings: Strings): void {
    for (const item of resolveMenuItems(primaryHasCache)) {
      const button = buttons.get(item.tab);
      if (!button) continue;
      const label = item.label(nextStrings);
      button.setAttribute("aria-label", label);
      button.dataset.tooltip = label;
    }
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
    syncStrings,
    setCacheState(nextHasCache) {
      if (nextHasCache === primaryHasCache) return;
      const activeTab =
        [...buttons.entries()].find(([, button]) =>
          button.classList.contains("ec-panel-menu-btn--active"),
        )?.[0] ?? null;
      mountItems(nextHasCache);
      handle.setActive(activeTab);
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

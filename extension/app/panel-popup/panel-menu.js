import { FILES, INFO, KEYBOARD, PLAY, SETTINGS } from "../../lib/vendor/icons/index.js";

var START_ITEM = {
  tab: "start",
  iconSvg: PLAY,
  label: (s) => s.titleSettings
};

var COPIED_ITEM = {
  tab: "copied",
  iconSvg: FILES,
  label: (s) => s.tabCopied
};

var SECONDARY_MENU_ITEMS = [
  { tab: "settings", iconSvg: SETTINGS, label: (s) => s.pageSettingsTitle },
  { tab: "shortcuts", iconSvg: KEYBOARD, label: (s) => s.tabShortcuts },
  { tab: "about", iconSvg: INFO, label: (s) => s.tabAbout }
];

function resolvePrimaryItem(hasCache) {
  return hasCache ? COPIED_ITEM : START_ITEM;
}

function resolveMenuItems(hasCache) {
  return [resolvePrimaryItem(hasCache), ...SECONDARY_MENU_ITEMS];
}

function createMenuButton(item, strings) {
  const label = item.label(strings);
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ec-panel-menu-btn";
  button.innerHTML = item.iconSvg;
  button.setAttribute("aria-label", label);
  button.dataset.tooltip = label;
  return button;
}

function createPanelMenu(strings, hasCache) {
  const nav = document.createElement("nav");
  nav.className = "ec-panel-menu";
  nav.setAttribute("aria-label", "Panel pages");
  const buttons = /* @__PURE__ */ new Map();
  let primaryHasCache = hasCache;
  function mountItems(nextHasCache) {
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
  function syncStrings(nextStrings) {
    for (const item of resolveMenuItems(primaryHasCache)) {
      const button = buttons.get(item.tab);
      if (!button) continue;
      const label = item.label(nextStrings);
      button.setAttribute("aria-label", label);
      button.dataset.tooltip = label;
    }
  }
  const handle = {
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
      const activeTab = [...buttons.entries()].find(
        ([, button]) => button.classList.contains("ec-panel-menu-btn--active")
      )?.[0] ?? null;
      mountItems(nextHasCache);
      handle.setActive(activeTab);
    },
    onSelect: () => {
    }
  };
  nav.addEventListener("click", (event) => {
    const target = event.target?.closest(
      ".ec-panel-menu-btn"
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

export { COPIED_ITEM, SECONDARY_MENU_ITEMS, START_ITEM, createMenuButton, createPanelMenu, resolveMenuItems, resolvePrimaryItem };

import { ext } from "./api";
import { hasPickCopyCacheInStorage } from "./pick-mode/pick-copy-cache-storage";
import { type PanelMenuTab } from "./panel-popup";
import { isRtlLocale, t, type Locale } from "./i18n";
import type { Strings } from "./i18n/types";
import { getLocale } from "./storage";

const CONTEXT_MENU_START = "element-copier-start";
const CONTEXT_MENU_COPIED = "element-copier-copied";
const CONTEXT_MENU_SETTINGS = "element-copier-settings";
const CONTEXT_MENU_SHORTCUTS = "element-copier-shortcuts";
const CONTEXT_MENU_ABOUT = "element-copier-about";

const ACTION_MENU_EMOJI = {
  start: "▶️",
  copied: "🗂️",
  settings: "⚙️",
  shortcuts: "⌨️",
  about: "ℹ️",
} as const;

const CONTEXT_MENU_START_ITEM = {
  id: CONTEXT_MENU_START,
  tab: "start" as const,
  emoji: ACTION_MENU_EMOJI.start,
  title: (strings: Strings) => strings.titleSettings,
};

const CONTEXT_MENU_COPIED_ITEM = {
  id: CONTEXT_MENU_COPIED,
  tab: "copied" as const,
  emoji: ACTION_MENU_EMOJI.copied,
  title: (strings: Strings) => strings.tabCopied,
};

const CONTEXT_MENU_SECONDARY_ITEMS: readonly {
  id: string;
  tab: PanelMenuTab;
  emoji: string;
  title: (strings: Strings) => string;
}[] = [
  {
    id: CONTEXT_MENU_SETTINGS,
    tab: "settings",
    emoji: ACTION_MENU_EMOJI.settings,
    title: (strings) => strings.pageSettingsTitle,
  },
  {
    id: CONTEXT_MENU_SHORTCUTS,
    tab: "shortcuts",
    emoji: ACTION_MENU_EMOJI.shortcuts,
    title: (strings) => strings.tabShortcuts,
  },
  {
    id: CONTEXT_MENU_ABOUT,
    tab: "about",
    emoji: ACTION_MENU_EMOJI.about,
    title: (strings) => strings.tabAbout,
  },
];

type ContextMenuCreateProps = chrome.contextMenus.CreateProperties;

let ensureContextMenuChain: Promise<void> = Promise.resolve();

async function createContextMenuItem(props: ContextMenuCreateProps): Promise<void> {
  try {
    await ext.contextMenus.create(props);
  } catch (err) {
    console.error("[Element Copier] contextMenus.create failed:", err, props);
  }
}

function actionMenuTitle(title: string, emoji: string, locale: Locale): string {
  // RTL labels + leading LTR emoji reorder inconsistently in native menus (bidi).
  return isRtlLocale(locale) ? `${title} ${emoji}` : `${emoji} ${title}`;
}

export async function ensureContextMenu(): Promise<void> {
  ensureContextMenuChain = ensureContextMenuChain.then(async () => {
    const locale = await getLocale();
    const strings = t(locale);

    try {
      await ext.contextMenus.removeAll();
    } catch (err) {
      console.error("[Element Copier] contextMenus.removeAll failed:", err);
    }

    const hasCache = await hasPickCopyCacheInStorage();
    const primaryItem = hasCache ? CONTEXT_MENU_COPIED_ITEM : CONTEXT_MENU_START_ITEM;
    const contextMenuItems = [primaryItem, ...CONTEXT_MENU_SECONDARY_ITEMS];

    for (const item of contextMenuItems) {
      await createContextMenuItem({
        id: item.id,
        title: actionMenuTitle(item.title(strings), item.emoji, locale),
        contexts: ["action"],
      });
    }
  });

  await ensureContextMenuChain;
}

export function findContextMenuTab(
  menuItemId: string | number,
): PanelMenuTab | undefined {
  if (menuItemId === CONTEXT_MENU_START) return "start";
  if (menuItemId === CONTEXT_MENU_COPIED) return "copied";
  return CONTEXT_MENU_SECONDARY_ITEMS.find((item) => item.id === menuItemId)?.tab;
}

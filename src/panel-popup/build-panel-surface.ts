import { PANEL_TITLE } from "../brand";
import { toolbarWelcomeIconSvg } from "../icons";
import { localeToHtmlLang } from "../lib/src/i18n/locale-code";
import { createPanelFooter } from "../lib/src/panel-footer";
import { createPanelDivider, createPanelHeader } from "../lib/src/panel-header";
import { isRtlLocale, t, type Locale } from "../i18n";
import { PANEL_FOOTER_CONFIG } from "../ui-config";
import { PANEL_POPUP_HOST_ATTR } from "./constants";
import { hasPickCopyCacheInStorage } from "../pick-mode/pick-copy-cache-storage";
import { getDarkThemeEnabled } from "../settings/theme-settings";
import { createPanelMenu, type PanelMenuHandle } from "./panel-menu";

const PANEL_DARK_CLASS = "ec-panel--dark";

export type PanelSurfaceParts = {
  panelRoot: HTMLDivElement;
  body: HTMLDivElement;
  menu: PanelMenuHandle | null;
};

export async function createPanelSurface(
  locale: Locale,
  surface?: "popup",
): Promise<PanelSurfaceParts> {
  const panelRoot = document.createElement("div");
  panelRoot.className = "ec-panel";
  if (surface === "popup") {
    panelRoot.classList.add("ec-panel--surface-popup");
  }
  panelRoot.lang = localeToHtmlLang(locale);
  panelRoot.dir = isRtlLocale(locale) ? "rtl" : "ltr";

  const strings = t(locale);
  const header = createPanelHeader({
    title: PANEL_TITLE,
    subtitle: strings.panelSubtitle,
    logoSvg: toolbarWelcomeIconSvg(),
  });

  const body = document.createElement("div");
  body.className = "ec-panel-body";

  const footer = createPanelFooter(PANEL_FOOTER_CONFIG);
  const topDivider = createPanelDivider();
  const bottomDivider = createPanelDivider();

  let menu: PanelMenuHandle | null = null;

  if (surface === "popup") {
    const hasCache = await hasPickCopyCacheInStorage();
    menu = createPanelMenu(strings, hasCache);
    const main = document.createElement("div");
    main.className = "ec-panel-main";

    const content = document.createElement("div");
    content.className = "ec-panel-content";
    content.append(topDivider, body, bottomDivider);

    main.append(menu.root, content);
    panelRoot.append(header, main, footer);
  } else {
    panelRoot.append(header, topDivider, body, bottomDivider, footer);
  }

  panelRoot.setAttribute(PANEL_POPUP_HOST_ATTR, "true");

  if (await getDarkThemeEnabled()) {
    panelRoot.classList.add(PANEL_DARK_CLASS);
  }

  return { panelRoot, body, menu };
}

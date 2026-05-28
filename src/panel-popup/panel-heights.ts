import { t, type Locale } from "../i18n";
import { createPanelSurface } from "./build-panel-surface";
import { PANEL_POPUP_PROBE_WIDTH } from "./constants";
import type { PanelPopupTab } from "./constants";
import { PANEL_POPUP_TABS } from "./constants";
import {
  buildAboutPanelBody,
  buildCopiedPanelBody,
  buildPlaceholderPanelBody,
  buildSettingsPanelBody,
  buildStartPanelBody,
  buildShortcutsPanelBody,
  PANEL_BODY_CENTERED_CLASS,
} from "./panel-body";

let cachedMaxPopupHeightPx: number | null = null;

function measurePanelBodyHeight(
  locale: Locale,
  fillBody: (body: HTMLDivElement) => void,
): number {
  const probeHost = document.createElement("div");
  probeHost.className = "ec-panel-popup";
  probeHost.style.cssText = `position:fixed;left:-9999px;width:${PANEL_POPUP_PROBE_WIDTH};visibility:hidden;pointer-events:none;`;
  const shadow = probeHost.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = process.env.PANEL_CSS_CONTENT ?? "";
  shadow.append(style);

  const { panelRoot, body } = createPanelSurface(locale, "popup");
  fillBody(body);
  shadow.appendChild(panelRoot);

  document.body.appendChild(probeHost);
  const height = Math.ceil(panelRoot.getBoundingClientRect().height);
  probeHost.remove();
  return height;
}

function fillPanelTabBody(body: HTMLDivElement, tab: PanelPopupTab, strings: ReturnType<typeof t>): void {
  body.classList.toggle(PANEL_BODY_CENTERED_CLASS, tab === "start" || tab === "copied");

  switch (tab) {
    case "start":
      buildStartPanelBody(body, strings, { onStart: () => {} });
      break;
    case "copied":
      buildCopiedPanelBody(body, strings);
      break;
    case "settings":
      buildSettingsPanelBody(body, strings);
      break;
    case "history":
      buildPlaceholderPanelBody(body, tab, strings);
      break;
    case "shortcuts":
      buildShortcutsPanelBody(body, strings);
      break;
    case "about":
      buildAboutPanelBody(body, strings);
      break;
  }
}

/** Max toolbar popup height across all panel tabs (cached). */
export function getMaxActionPopupHeightPx(locale: Locale): number {
  if (cachedMaxPopupHeightPx !== null) {
    return cachedMaxPopupHeightPx;
  }

  const strings = t(locale);
  cachedMaxPopupHeightPx = PANEL_POPUP_TABS.reduce(
    (max, tab) =>
      Math.max(
        max,
        measurePanelBodyHeight(locale, (body) => {
          fillPanelTabBody(body, tab, strings);
        }),
      ),
    0,
  );
  return cachedMaxPopupHeightPx;
}

import { PANEL_TITLE } from "../brand";
import { toolbarWelcomeIconSvg } from "../icons";
import { localeToHtmlLang } from "../../../lib/src/i18n/locale-code";
import { createPanelFooter } from "../../../lib/src/panel-footer";
import { createPanelDivider, createPanelHeader } from "../../../lib/src/panel-header";
import { isRtlLocale, t, type Locale } from "../i18n";
import { PANEL_FOOTER_CONFIG } from "../ui-config";
import { PANEL_POPUP_HOST_ATTR } from "./constants";

const START_DISMISS_DELAY_MS = 1000;

export type StartPanelHost = {
  shadow: ShadowRoot;
  surface?: "popup";
  onClose?: () => void;
  getLocale: () => Locale;
};

function createStartActionButton(
  label: string,
  comingSoonLabel: string,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "ec-start-action";
  button.textContent = label;
  button.disabled = true;
  button.setAttribute("aria-disabled", "true");
  button.title = comingSoonLabel;
  button.setAttribute("aria-label", `${label} (${comingSoonLabel})`);
  return button;
}

export class StartPanelWindow {
  private dismissListeners: (() => void) | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly host: StartPanelHost) {}

  private clearDismissTimer(): void {
    if (this.dismissTimer === null) return;
    clearTimeout(this.dismissTimer);
    this.dismissTimer = null;
  }

  openStartPanel(): void {
    this.close();

    const panelRoot = document.createElement("div");
    panelRoot.className = "ec-panel";
    if (this.host.surface === "popup") {
      panelRoot.classList.add("ec-panel--surface-popup");
    }
    const locale = this.host.getLocale();
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

    const instruction = document.createElement("div");
    instruction.className = "ec-start-instruction";

    const lead = document.createElement("p");
    lead.className = "ec-start-instruction-lead";
    lead.textContent = strings.startBodyLead;

    const action = document.createElement("p");
    action.className = "ec-start-instruction-action";
    action.textContent = strings.startBodyAction;

    instruction.append(lead, action);

    const actions = document.createElement("div");
    actions.className = "ec-start-actions";
    actions.append(
      createStartActionButton(strings.startSettings, strings.startButtonComingSoon),
      createStartActionButton(strings.startHistory, strings.startButtonComingSoon),
    );

    const footer = createPanelFooter(PANEL_FOOTER_CONFIG);

    body.append(instruction, actions);
    panelRoot.append(
      header,
      createPanelDivider(),
      body,
      createPanelDivider(),
      footer,
    );
    panelRoot.setAttribute(PANEL_POPUP_HOST_ATTR, "true");
    this.host.shadow.appendChild(panelRoot);
    this.bindDismissOnLeave(panelRoot);
  }

  private bindDismissOnLeave(panel: HTMLElement): void {
    let hasEntered = false;

    const onEnter = (): void => {
      hasEntered = true;
      this.clearDismissTimer();
    };
    const onLeave = (): void => {
      if (!hasEntered) return;
      this.clearDismissTimer();
      this.dismissTimer = setTimeout(() => {
        this.dismissTimer = null;
        this.close();
      }, START_DISMISS_DELAY_MS);
    };

    panel.addEventListener("mouseenter", onEnter);
    panel.addEventListener("mouseleave", onLeave);
    this.dismissListeners = () => {
      panel.removeEventListener("mouseenter", onEnter);
      panel.removeEventListener("mouseleave", onLeave);
      this.clearDismissTimer();
    };
  }

  close(): void {
    this.clearDismissTimer();
    this.dismissListeners?.();
    this.dismissListeners = null;

    const panelRoots = Array.from(
      this.host.shadow.querySelectorAll<HTMLElement>(".ec-panel"),
    );
    if (!panelRoots.length) return;
    panelRoots.forEach((node) => node.remove());
    this.host.onClose?.();
  }
}

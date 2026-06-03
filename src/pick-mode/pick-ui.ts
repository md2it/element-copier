import {
  findIframeAtPoint,
  isPointInElement,
} from "../lib/src/element-under-cursor";
import { HighlightSystem } from "../lib/src/highlight";
import { sendToBackground } from "../messages";
import { formatFrameElementLabel } from "./element-label";
import {
  getCachedFrameClickToCopyLabel,
  getCachedFrameLabelStyle,
  subscribeFrameLabelStyleChange,
} from "../settings/format-settings-cache";
import { PICK_HOST_ATTR, PICK_ROOT_ID } from "./constants";
import { COPIER_HIGHLIGHT_PAGE_STYLE, HIGHLIGHT_UI } from "./page-styles";

type OnPickFn = (element: Element) => void;

export class CopierPickUI {
  private readonly host: HTMLElement;
  private readonly shadow: ShadowRoot;
  private readonly highlight: HighlightSystem;
  private readonly onPick: OnPickFn;
  private readonly boundClick: (e: MouseEvent) => void;
  private readonly unsubscribeFrameLabelStyle: () => void;

  constructor(onPick: OnPickFn) {
    this.onPick = onPick;
    this.boundClick = (e) => this.handleClick(e);

    const existing = document.getElementById(PICK_ROOT_ID);
    if (existing?.isConnected) {
      this.host = existing;
      this.shadow =
        existing.shadowRoot ?? existing.attachShadow({ mode: "open" });
    } else {
      existing?.remove();
      const root = document.documentElement ?? document.body;
      if (!root) {
        throw new Error("document has no mount root");
      }
      this.host = document.createElement("div");
      this.host.id = PICK_ROOT_ID;
      this.host.setAttribute(PICK_HOST_ATTR, "true");
      this.host.style.cssText =
        "position:fixed;inset:0;z-index:2147483645;pointer-events:none;";
      root.appendChild(this.host);
      this.shadow = this.host.attachShadow({ mode: "open" });
    }

    let style = this.shadow.querySelector("style");
    if (!style) {
      style = document.createElement("style");
      this.shadow.appendChild(style);
    }
    style.textContent = process.env.PICK_CSS_CONTENT ?? "";

    const existingLabel = this.shadow.querySelector(".ec-element-label");
    const existingFrame = this.shadow.querySelector(".ec-highlight-frame");

    this.highlight = new HighlightSystem({
      host: {
        shadow: this.shadow,
        isOurNode: (node) => this.isOurNode(node),
        getElementLabelEnabled: () => getCachedFrameLabelStyle() !== "none",
        formatElementLabel: (target) =>
          formatFrameElementLabel(
            target,
            getCachedFrameLabelStyle(),
            getCachedFrameClickToCopyLabel(),
          ),
        hostAttr: PICK_HOST_ATTR,
        classes: HIGHLIGHT_UI,
      },
      pageStyles: COPIER_HIGHLIGHT_PAGE_STYLE,
    });
    this.highlight.bindExistingElements(
      existingLabel instanceof HTMLElement ? existingLabel : null,
      existingFrame instanceof HTMLElement ? existingFrame : null,
    );
    this.unsubscribeFrameLabelStyle = subscribeFrameLabelStyleChange(() => {
      this.syncFrameLabel();
    });
  }

  syncFrameLabel(): void {
    this.highlight.syncElementLabel();
  }

  isHostConnected(): boolean {
    return this.host.isConnected;
  }

  isOurNode(node: Node | null): boolean {
    if (!node) return true;
    if (node === this.host || this.host.contains(node)) return true;
    return !!(node as Element).closest?.(`[${PICK_HOST_ATTR}]`);
  }

  activate(): void {
    this.highlight.activate();
    document.addEventListener("click", this.boundClick, true);
  }

  deactivate(): void {
    document.removeEventListener("click", this.boundClick, true);
    this.highlight.deactivate();
  }

  dispose(): void {
    this.unsubscribeFrameLabelStyle();
    this.deactivate();
  }

  private handleClick(e: MouseEvent): void {
    const pickOptions = { isOurNode: (node: Node | null) => this.isOurNode(node) };
    const iframeAtPoint = findIframeAtPoint(e.clientX, e.clientY, pickOptions);
    const target = iframeAtPoint ?? this.highlight.getHighlighted();
    if (!target) return;

    const hit = e.target;
    if (hit instanceof Element && this.isOurNode(hit)) return;

    const onTarget =
      hit === target ||
      (hit instanceof Element && target.contains(hit)) ||
      isPointInElement(target, e.clientX, e.clientY);

    if (!onTarget) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    this.onPick(target);
  }
}

export function notifyElementPicked(element: Element): void {
  sendToBackground({
    type: "ELEMENT_PICKED",
    tagName: element.tagName,
    id: element.id,
    className: element.className,
  });
}

import {
  isIframeHitTestable,
  isSignificantIframe,
  listIframesWithin,
} from "../element-under-cursor";
import {
  ensurePageHighlightStyles,
  removePageHighlightStyles,
} from "./page-styles";
import type {
  ElementHighlightHost,
  HighlightPageStyleConfig,
  HighlightRenderOptions,
} from "./types";

/** Visual gap between target box and highlight outline (see highlight-frame outline-offset). */
export const HIGHLIGHT_FRAME_INSET = 2;

/**
 * Shadow overlay (frame, label), page target classes, and highlight-mode page CSS.
 * No pointer/pick logic; no delete/restore animation.
 */
export class ElementHighlightVisual {
  private elementLabelEl: HTMLElement | null = null;
  private highlightFrameEl: HTMLElement | null = null;
  private highlightTransitionToken = 0;
  private highlightTransitionCleanup: (() => void) | null = null;

  constructor(
    private readonly host: ElementHighlightHost,
    private readonly pageStyles: HighlightPageStyleConfig,
  ) {}

  bindExistingElements(
    elementLabelEl: HTMLElement | null,
    highlightFrameEl: HTMLElement | null,
  ): void {
    this.elementLabelEl = elementLabelEl;
    this.highlightFrameEl = highlightFrameEl;
  }

  installPageStyles(): void {
    ensurePageHighlightStyles(this.pageStyles);
  }

  uninstallPageStyles(): void {
    removePageHighlightStyles(this.pageStyles.styleId);
  }

  clear(): void {
    this.cancelHighlightTransition();
    this.clearTargetMarkers();
    this.hideHighlightFrame();
    this.hideElementLabel();
  }

  syncElementLabel(target: Element | null): void {
    if (!this.host.getElementLabelEnabled() || !target) {
      this.hideElementLabel();
      return;
    }

    const label = this.ensureElementLabel();
    label.textContent = this.host.formatElementLabel(target);
    label.style.display = "block";
    this.syncElementLabelPosition(target);
  }

  render(target: Element, options: HighlightRenderOptions): void {
    const { animateFrom } = options;
    const targetClass = this.host.classes.highlightTarget;
    this.cancelHighlightTransition();
    this.hideElementLabel();

    const animate =
      animateFrom !== null &&
      animateFrom.isConnected &&
      animateFrom !== target;

    if (!animate) {
      this.showHighlightFrameFor(target);
      target.classList.add(targetClass);
      this.syncIframeFill(target);
      this.syncElementLabel(target);
      return;
    }

    this.runHighlightTransition(animateFrom, target, options.isStillTarget);
    this.syncElementLabel(target);
  }

  refresh(target: Element): void {
    this.syncIframeFill(target);
    this.syncHighlightOverlay(target);
    this.syncElementLabel(target);
  }

  removeTargetClass(target: Element): void {
    target.classList.remove(this.host.classes.highlightTarget);
  }

  private clearTargetMarkers(): void {
    this.clearIframeFill();
  }

  private clearIframeFill(): void {
    const fillClass = this.host.classes.highlightFill;
    for (const node of Array.from(
      document.querySelectorAll(`iframe.${fillClass}`),
    )) {
      node.classList.remove(fillClass);
    }
  }

  private rectOverlapArea(a: DOMRect, b: DOMRect): number {
    const left = Math.max(a.left, b.left);
    const right = Math.min(a.right, b.right);
    const top = Math.max(a.top, b.top);
    const bottom = Math.min(a.bottom, b.bottom);
    if (right <= left || bottom <= top) return 0;
    return (right - left) * (bottom - top);
  }

  private collectIframeFillTargets(target: Element): HTMLIFrameElement[] {
    if (target instanceof HTMLIFrameElement) {
      return isIframeHitTestable(target) && isSignificantIframe(target)
        ? [target]
        : [];
    }

    const out: HTMLIFrameElement[] = [];
    const targetRect = target.getBoundingClientRect();
    for (const node of listIframesWithin(target, (n) => this.host.isOurNode(n))) {
      if (!isIframeHitTestable(node) || !isSignificantIframe(node)) {
        continue;
      }
      const rect = node.getBoundingClientRect();
      const iframeArea = rect.width * rect.height;
      if (iframeArea <= 0) continue;
      if (this.rectOverlapArea(targetRect, rect) / iframeArea >= 0.5) {
        out.push(node);
      }
    }
    return out;
  }

  private syncIframeFill(target: Element): void {
    const fillClass = this.host.classes.highlightFill;
    this.clearIframeFill();
    for (const iframe of this.collectIframeFillTargets(target)) {
      iframe.classList.add(fillClass);
    }
  }

  private cancelHighlightTransition(): void {
    this.highlightTransitionToken += 1;
    this.highlightTransitionCleanup?.();
    this.highlightTransitionCleanup = null;
  }

  private ensureHighlightFrame(): HTMLElement {
    if (!this.highlightFrameEl) {
      const el = document.createElement("div");
      el.className = this.host.classes.highlightFrame;
      el.setAttribute(this.host.hostAttr, "true");
      el.setAttribute("aria-hidden", "true");
      this.host.shadow.insertBefore(el, this.host.shadow.firstChild);
      this.highlightFrameEl = el;
    }
    return this.highlightFrameEl;
  }

  private hideHighlightFrame(): void {
    if (!this.highlightFrameEl) return;
    this.highlightFrameEl.style.display = "none";
  }

  private showHighlightFrameFor(target: Element): void {
    const frame = this.ensureHighlightFrame();
    frame.style.display = "block";
    this.applyHighlightFrame(frame, target);
  }

  private syncHighlightFrame(target: Element): void {
    const frame = this.highlightFrameEl;
    if (!frame || frame.style.display === "none") return;
    this.applyHighlightFrame(frame, target);
  }

  private syncHighlightOverlay(target: Element): void {
    this.syncHighlightFrame(target);
    this.syncElementLabelPosition(target);
  }

  private applyHighlightFrame(frame: HTMLElement, target: Element): void {
    const rect = target.getBoundingClientRect();
    frame.style.top = `${rect.top}px`;
    frame.style.left = `${rect.left}px`;
    frame.style.width = `${rect.width}px`;
    frame.style.height = `${rect.height}px`;

    const style = getComputedStyle(target);
    frame.style.borderRadius = style.borderRadius;
    const clipPath = style.clipPath;
    frame.style.clipPath =
      clipPath && clipPath !== "none" ? clipPath : "";
  }

  private runHighlightTransition(
    from: Element,
    to: Element,
    isStillTarget?: (target: Element) => boolean,
  ): void {
    const frame = this.ensureHighlightFrame();
    const targetClass = this.host.classes.highlightTarget;
    const token = this.highlightTransitionToken;
    let done = false;

    if (frame.style.display !== "block") {
      frame.classList.add("is-instant");
      frame.style.display = "block";
      this.applyHighlightFrame(frame, from);
      frame.classList.remove("is-instant");
      void frame.offsetWidth;
    } else {
      frame.style.display = "block";
    }
    this.applyHighlightFrame(frame, to);

    const finish = (): void => {
      if (done) return;
      if (token !== this.highlightTransitionToken) return;
      if (isStillTarget && !isStillTarget(to)) return;
      done = true;
      this.highlightTransitionCleanup?.();
      this.highlightTransitionCleanup = null;
      this.showHighlightFrameFor(to);
      to.classList.add(targetClass);
      this.syncIframeFill(to);
      this.syncElementLabel(to);
    };

    const onTransitionEnd = (event: TransitionEvent): void => {
      if (event.target !== frame) return;
      if (event.propertyName !== "width") return;
      finish();
    };

    frame.addEventListener("transitionend", onTransitionEnd);
    const timeoutId = window.setTimeout(finish, 225);
    this.highlightTransitionCleanup = () => {
      frame.removeEventListener("transitionend", onTransitionEnd);
      window.clearTimeout(timeoutId);
    };
  }

  private ensureElementLabel(): HTMLElement {
    if (!this.elementLabelEl) {
      const el = document.createElement("div");
      el.className = this.host.classes.elementLabel;
      el.setAttribute(this.host.hostAttr, "true");
      el.setAttribute("aria-hidden", "true");
      this.host.shadow.appendChild(el);
      this.elementLabelEl = el;
    }
    return this.elementLabelEl;
  }

  private hideElementLabel(): void {
    if (!this.elementLabelEl) return;
    this.elementLabelEl.style.display = "none";
  }

  private syncElementLabelPosition(target: Element): void {
    const el = this.elementLabelEl;
    if (!el || el.style.display === "none") return;

    const rect = target.getBoundingClientRect();
    const frameTop = rect.top - HIGHLIGHT_FRAME_INSET;
    const frameLeft = rect.left - HIGHLIGHT_FRAME_INSET;
    el.style.top = `${frameTop}px`;
    el.style.left = `${frameLeft}px`;
  }
}

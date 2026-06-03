export type InfoWindowClasses = {
  overlay: string;
  window: string;
  close: string;
  content: string;
};

export function createInfoWindowClasses(prefix: string): InfoWindowClasses {
  return {
    overlay: `${prefix}-info-window-overlay`,
    window: `${prefix}-info-window`,
    close: `${prefix}-info-window-close`,
    content: `${prefix}-info-window-content`,
  };
}

export type InfoWindowOptions = {
  classes: InfoWindowClasses;
  /** Trusted simple HTML rendered inside the window body. */
  contentHtml: string;
  /** Accessible label for the close (X) button. */
  closeLabel: string;
  /** Markup for the close button; defaults to a × glyph. */
  closeIconHtml?: string;
  onClose?: () => void;
};

export type InfoWindowHandle = {
  /** Overlay root; append to a positioned container to display the window. */
  root: HTMLElement;
  close: () => void;
};

/** Simplest in-page info window: backdrop, close button, and Escape to dismiss. */
export function createInfoWindow(options: InfoWindowOptions): InfoWindowHandle {
  const { classes } = options;

  const overlay = document.createElement("div");
  overlay.className = classes.overlay;

  const windowEl = document.createElement("div");
  windowEl.className = classes.window;
  windowEl.setAttribute("role", "dialog");
  windowEl.setAttribute("aria-modal", "true");

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = classes.close;
  closeBtn.setAttribute("aria-label", options.closeLabel);
  closeBtn.innerHTML = options.closeIconHtml ?? "&times;";

  const content = document.createElement("div");
  content.className = classes.content;
  content.innerHTML = options.contentHtml;

  windowEl.append(closeBtn, content);
  overlay.append(windowEl);

  let closed = false;
  const close = (): void => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKeyDown, true);
    overlay.remove();
    options.onClose?.();
  };

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.stopPropagation();
      close();
    }
  }

  closeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    close();
  });
  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) close();
  });
  document.addEventListener("keydown", onKeyDown, true);

  return { root: overlay, close };
}

function createInfoWindowClasses(prefix) {
  return {
    overlay: `${prefix}-info-window-overlay`,
    window: `${prefix}-info-window`,
    close: `${prefix}-info-window-close`,
    content: `${prefix}-info-window-content`
  };
}

function createInfoWindow(options) {
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
  closeBtn.textContent = options.closeIconText ?? "\u00D7";
  const content = document.createElement("div");
  content.className = classes.content;
  if (options.contentNode) {
    content.append(options.contentNode);
  } else if (typeof options.contentText === "string") {
    content.textContent = options.contentText;
  }
  windowEl.append(closeBtn, content);
  overlay.append(windowEl);
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKeyDown, true);
    overlay.remove();
    options.onClose?.();
  };
  function onKeyDown(event) {
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

export { createInfoWindow, createInfoWindowClasses };

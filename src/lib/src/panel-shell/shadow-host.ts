export type PanelShadowHostOptions = {
  rootId: string;
  hostClassName: string;
  hostAttr: string;
  hostStyle: string;
  cssContent: string;
};

/** Mounts a full-page panel host with an open shadow root and injected CSS. */
export function mountPanelShadowHost(options: PanelShadowHostOptions): {
  host: HTMLElement;
  shadow: ShadowRoot;
} {
  const host = document.createElement("div");
  host.id = options.rootId;
  host.className = options.hostClassName;
  host.setAttribute(options.hostAttr, "true");
  host.style.cssText = options.hostStyle;
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = options.cssContent;
  shadow.appendChild(style);

  return { host, shadow };
}

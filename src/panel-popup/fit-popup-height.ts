/** Sizes the toolbar action popup to the mounted panel host (no extra min-height). */
export function fitActionPopupToHost(host: HTMLElement): void {
  const apply = (): void => {
    const height = Math.ceil(host.getBoundingClientRect().height);
    if (height <= 0) return;
    const px = `${height}px`;
    document.documentElement.style.height = px;
    document.body.style.height = px;
    host.style.height = px;
    host.style.minHeight = "0";
  };

  requestAnimationFrame(() => {
    requestAnimationFrame(apply);
  });
}

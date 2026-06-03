/** Appends or updates a <style> at the end of the page (body, else documentElement). */
export function setAllElementsStyleAtEnd(styleId: string, css: string): void {
  const existing = document.getElementById(styleId);
  if (existing instanceof HTMLStyleElement) {
    existing.textContent = css;
    return;
  }
  const style = document.createElement("style");
  style.id = styleId;
  style.textContent = css;
  const anchor = document.body ?? document.documentElement;
  anchor.appendChild(style);
}

export function removeAllElementsStyle(styleId: string): void {
  document.getElementById(styleId)?.remove();
}

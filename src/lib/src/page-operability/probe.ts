/**
 * Runs inside the page via `scripting.executeScript`.
 * True when the browser allows creating and attaching a DOM node (not chrome://, store, etc.).
 */
export function probeDocumentOperability(): boolean {
  try {
    const root = document.documentElement ?? document.body;
    if (!root) return false;
    const probe = document.createElement("div");
    probe.style.display = "none";
    root.appendChild(probe);
    const ok = probe.isConnected;
    probe.remove();
    return ok;
  } catch {
    return false;
  }
}

import { clearPickCopyCache } from "./pick-copy-cache";

/** Clear pick copy cache on navigation away from the picked page. */
export function bindPickCopyCacheLifecycle(): void {
  window.addEventListener("pagehide", () => clearPickCopyCache());

  let lastHref = location.href;

  const onNavigate = (): void => {
    if (location.href === lastHref) return;
    lastHref = location.href;
    clearPickCopyCache();
  };

  window.addEventListener("popstate", onNavigate);

  const { pushState, replaceState } = history;
  history.pushState = function pushStatePatched(...args) {
    pushState.apply(this, args);
    onNavigate();
  };
  history.replaceState = function replaceStatePatched(...args) {
    replaceState.apply(this, args);
    onNavigate();
  };
}

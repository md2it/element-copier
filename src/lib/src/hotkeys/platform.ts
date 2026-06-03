/** Mac vs Win/Linux for modifier keys and display labels. */
export function isMacPlatform(): boolean {
  return (
    /Mac|iPhone|iPad|iPod/.test(navigator.userAgent) ||
    navigator.platform.toUpperCase().includes("MAC")
  );
}

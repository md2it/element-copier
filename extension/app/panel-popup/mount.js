import { mountPanelSurface } from "./mount-panel-surface.js";
import { panelPopupHostStyle } from "./constants.js";

async function mountPanelPopup(initialTab) {
  await mountPanelSurface(initialTab, {
    hostStyle: panelPopupHostStyle(),
    surface: "popup"
  });
}

export { mountPanelPopup };

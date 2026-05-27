import { mountPanelSurface } from "./mount-panel-surface";

const PANEL_POPUP_HOST_STYLE =
  "display:block;width:360px;min-height:0;height:auto;position:relative;pointer-events:auto;";

export async function mountPanelPopup(_initialTab: "start"): Promise<void> {
  await mountPanelSurface("start", {
    hostStyle: PANEL_POPUP_HOST_STYLE,
    surface: "popup",
  });
}

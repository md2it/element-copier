import {
  removeAllElementsStyle,
  setAllElementsStyleAtEnd,
} from "../all-elements-style-inject";
import { buildAllElementsOutlineCss } from "./css";
import type { AllElementsOutlineConfig } from "./types";

export function enableAllElementsOutline(
  config: AllElementsOutlineConfig,
): void {
  setAllElementsStyleAtEnd(
    config.styleId,
    buildAllElementsOutlineCss(config),
  );
}

export function disableAllElementsOutline(styleId: string): void {
  removeAllElementsStyle(styleId);
}

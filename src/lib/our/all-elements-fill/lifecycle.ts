import {
  removeAllElementsStyle,
  setAllElementsStyleAtEnd,
} from "../all-elements-style-inject";
import { buildAllElementsFillCss } from "./css";
import type { AllElementsFillConfig } from "./types";

export function enableAllElementsFill(config: AllElementsFillConfig): void {
  setAllElementsStyleAtEnd(config.styleId, buildAllElementsFillCss(config));
}

export function disableAllElementsFill(styleId: string): void {
  removeAllElementsStyle(styleId);
}

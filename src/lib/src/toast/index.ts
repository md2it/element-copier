import type { ToastUiClasses } from "./types";

export { ToastStack } from "./stack";
export type {
  ToastAppendOptions,
  ToastFillTargets,
  ToastStackConfig,
  ToastStackHost,
  ToastUiClasses,
} from "./types";

export function createToastUiClasses(prefix: string): ToastUiClasses {
  return {
    toast: `${prefix}-toast`,
    toastLabel: `${prefix}-toast-label`,
    toastStatus: `${prefix}-toast-status`,
    toastTarget: `${prefix}-toast-target`,
    toastLeading: `${prefix}-toast-leading`,
    toastMark: `${prefix}-toast-mark`,
    toastActions: `${prefix}-toast-actions`,
    toastStack: `${prefix}-toast-stack`,
  };
}

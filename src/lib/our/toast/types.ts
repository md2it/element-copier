export type ToastFillTargets = {
  toast: HTMLDivElement;
  leading: HTMLDivElement;
  actions: HTMLDivElement;
};

/** Shadow root + timing/RTL for toast stack (no i18n or app actions). */
export type ToastStackHost = {
  shadow: ShadowRoot;
  getNotificationSeconds: () => number;
  isRtl: () => boolean;
};

export type ToastAppendOptions = {
  className: string;
  markInnerHtml: string;
  fill: (targets: ToastFillTargets) => void;
};

export type ToastUiClasses = {
  toast: string;
  toastLabel: string;
  toastStatus: string;
  toastTarget: string;
  toastLeading: string;
  toastMark: string;
  toastActions: string;
  toastStack: string;
};

export type ToastStackConfig = {
  stackId: string;
  hostAttr: string;
  classes: ToastUiClasses;
};

import type {
  ToastAppendOptions,
  ToastFillTargets,
  ToastStackConfig,
  ToastStackHost,
} from "./types";

export class ToastStack {
  constructor(
    private readonly host: ToastStackHost,
    private readonly config: ToastStackConfig,
  ) {}

  hide(): void {
    const { toast } = this.config.classes;
    this.host.shadow.querySelectorAll(`.${toast}`).forEach((n) => n.remove());
    this.host.shadow.getElementById(this.config.stackId)?.remove();
  }

  createStatusLabel(status: string, elementLabel: string): HTMLSpanElement {
    const { toastLabel, toastStatus, toastTarget } = this.config.classes;
    const label = document.createElement("span");
    label.className = toastLabel;

    const statusEl = document.createElement("span");
    statusEl.className = toastStatus;
    statusEl.textContent = `${status}:`;

    const targetEl = document.createElement("span");
    targetEl.className = toastTarget;
    targetEl.textContent = elementLabel;
    if (elementLabel) {
      targetEl.title = elementLabel;
    }

    label.append(statusEl, targetEl);
    return label;
  }

  append(options: ToastAppendOptions): HTMLDivElement | null {
    const dismissSeconds = this.host.getNotificationSeconds();
    if (dismissSeconds <= 0) {
      return null;
    }

    const { className, markInnerHtml, fill } = options;
    const stack = this.ensureToastStack();
    stack.dir = this.host.isRtl() ? "rtl" : "ltr";

    const { toastLeading, toastMark, toastActions } = this.config.classes;

    const toast = document.createElement("div");
    toast.className = className;
    toast.setAttribute(this.config.hostAttr, "true");
    toast.style.pointerEvents = "auto";
    toast.dir = "ltr";

    const leading = document.createElement("div");
    leading.className = toastLeading;

    const mark = document.createElement("span");
    mark.className = toastMark;
    mark.innerHTML = markInnerHtml;
    leading.appendChild(mark);

    const actions = document.createElement("div");
    actions.className = toastActions;

    toast.append(leading, actions);
    fill({ toast, leading, actions });
    stack.appendChild(toast);

    const timer = setTimeout(() => {
      this.remove(toast);
    }, dismissSeconds * 1000);
    toast.dataset.timerId = String(timer);

    return toast;
  }

  remove(toast: HTMLElement): void {
    const id = toast.dataset.timerId;
    if (id) clearTimeout(Number(id));
    toast.remove();
    const stack = this.host.shadow.getElementById(this.config.stackId);
    if (!stack) return;
    if (stack.childElementCount === 0) {
      stack.remove();
    }
  }

  private ensureToastStack(): HTMLElement {
    const { toastStack } = this.config.classes;
    let stack = this.host.shadow.getElementById(this.config.stackId);
    if (!stack) {
      stack = document.createElement("div");
      stack.id = this.config.stackId;
      stack.className = toastStack;
      stack.setAttribute(this.config.hostAttr, "true");
      stack.style.pointerEvents = "none";
    }
    this.host.shadow.appendChild(stack);
    return stack;
  }
}

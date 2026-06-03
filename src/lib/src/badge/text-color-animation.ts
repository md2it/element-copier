export type RgbColor = readonly [number, number, number];

export type BadgeTextColorAnimationMode = "ping-pong" | "loop";

/** Linear gradient between start/end across all steps. */
export type BadgeTextColorAnimationTwoColorOptions = {
  startColor: RgbColor;
  endColor: RgbColor;
  steps: number;
  stepIntervalMs: number;
  mode?: BadgeTextColorAnimationMode;
};

/** Two-phase gradient: start -> mid -> end. */
export type BadgeTextColorAnimationThreeColorOptions = {
  startColor: RgbColor;
  midColor: RgbColor;
  endColor: RgbColor;
  steps: number;
  stepIntervalMs: number;
  mode?: BadgeTextColorAnimationMode;
};

export type BadgeTextColorAnimationOptions =
  | BadgeTextColorAnimationTwoColorOptions
  | BadgeTextColorAnimationThreeColorOptions;

export type BadgeTextColorAnimation = {
  totalFrames: number;
  stepIntervalMs: number;
  nextFrame: (frame: number) => number;
  getColor: (frame: number) => string;
};

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

function mixColor(
  from: RgbColor,
  to: RgbColor,
  ratio: number,
): string {
  const normalizedRatio = Math.max(0, Math.min(1, ratio));
  const r = Math.round(from[0] + (to[0] - from[0]) * normalizedRatio);
  const g = Math.round(from[1] + (to[1] - from[1]) * normalizedRatio);
  const b = Math.round(from[2] + (to[2] - from[2]) * normalizedRatio);
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function normalizeFrame(frame: number, totalFrames: number): number {
  return ((frame % totalFrames) + totalFrames) % totalFrames;
}

function resolveStep(frame: number, steps: number, mode: BadgeTextColorAnimationMode): number {
  const totalFrames = mode === "ping-pong" ? steps * 2 : steps;
  const normalizedFrame = normalizeFrame(frame, totalFrames);
  if (mode === "loop") return normalizedFrame + 1;
  if (normalizedFrame < steps) return normalizedFrame + 1;
  return totalFrames - normalizedFrame;
}

export function createBadgeTextColorAnimation(
  options: BadgeTextColorAnimationOptions,
): BadgeTextColorAnimation {
  const steps = Math.max(2, Math.floor(options.steps));
  const mode = options.mode ?? "ping-pong";
  const totalFrames = mode === "ping-pong" ? steps * 2 : steps;
  const hasMidColor = "midColor" in options;
  const midStep = hasMidColor
    ? Math.min(steps - 1, Math.max(1, Math.floor(steps / 2)))
    : 1;
  const firstSpan = Math.max(1, midStep - 1);
  const secondSpan = Math.max(1, steps - midStep);

  return {
    totalFrames,
    stepIntervalMs: Math.max(1, Math.floor(options.stepIntervalMs)),
    nextFrame: (frame: number) =>
      (normalizeFrame(frame, totalFrames) + 1) % totalFrames,
    getColor: (frame: number) => {
      const step = resolveStep(frame, steps, mode);
      if (!hasMidColor) {
        const ratio = (step - 1) / Math.max(1, steps - 1);
        return mixColor(options.startColor, options.endColor, ratio);
      }
      if (step <= midStep) {
        const ratio = (step - 1) / firstSpan;
        return mixColor(options.startColor, options.midColor, ratio);
      }
      const ratio = (step - midStep) / secondSpan;
      return mixColor(options.midColor, options.endColor, ratio);
    },
  };
}

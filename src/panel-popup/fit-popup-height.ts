import type { Locale } from "../i18n";
import { getMaxActionPopupHeightPx } from "./panel-heights";

/** Sizes the toolbar action popup to the tallest panel variant across all tabs. */
export async function fitActionPopupToHost(host: HTMLElement, locale: Locale): Promise<void> {
  const maxVariant = await getMaxActionPopupHeightPx(locale);
  if (maxVariant <= 0) return;

  const apply = (): void => {
    const px = `${maxVariant}px`;
    document.documentElement.style.height = px;
    document.body.style.height = px;
    host.style.height = px;
    host.style.minHeight = px;
  };

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        apply();
        resolve();
      });
    });
  });
}

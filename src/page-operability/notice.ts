import { t } from "../i18n";
import { getLocale, getNotificationSeconds } from "../storage";
import {
  showBlockedNotice,
  type BlockedNoticePayload,
} from "../lib/our/page-operability";
import {
  RESTRICTED_NOTICE_CONFIG,
  RESTRICTED_NOTICE_MIN_MS,
} from "./constants";

export type { BlockedNoticePayload as RestrictedNoticePayload };

let restrictedNoticeCache: BlockedNoticePayload | null = null;

async function restrictedNoticeDismissMs(): Promise<number> {
  const seconds = await getNotificationSeconds();
  if (seconds <= 0) return RESTRICTED_NOTICE_MIN_MS;
  return seconds * 1000;
}

export async function getRestrictedNoticeDismissMs(): Promise<number> {
  return restrictedNoticeDismissMs();
}

export async function refreshRestrictedNoticeCache(): Promise<void> {
  const [locale, dismissMs] = await Promise.all([
    getLocale(),
    restrictedNoticeDismissMs(),
  ]);
  restrictedNoticeCache = { text: t(locale).restrictedPageNotice, dismissMs };
}

export async function showRestrictedNotice(
  tabId: number,
  windowId?: number,
): Promise<void> {
  if (!restrictedNoticeCache) {
    await refreshRestrictedNoticeCache();
  }
  await showBlockedNotice(
    tabId,
    RESTRICTED_NOTICE_CONFIG,
    restrictedNoticeCache!,
    windowId,
  );
}

import { ext } from "../api";
import {
  PREFIX_HINT_HIDE,
  PREFIX_HINT_SHOW,
} from "./prefix-hint-messages";
import type { PrefixHintSink } from "./prefix-hint";

/** Sends badge show/hide to the extension service worker (content has no `action` API). */
export function createContentPrefixHintSink(): PrefixHintSink {
  return {
    show(letter: string): void {
      void ext.runtime.sendMessage({ type: PREFIX_HINT_SHOW, letter }).catch(() => {
        /* background unavailable */
      });
    },
    hide(): void {
      void ext.runtime.sendMessage({ type: PREFIX_HINT_HIDE }).catch(() => {
        /* background unavailable */
      });
    },
  };
}

/** Content → background: show prefix letter on toolbar badge. */
export const PREFIX_HINT_SHOW = "PREFIX_HINT_SHOW" as const;

/** Content → background: clear prefix badge. */
export const PREFIX_HINT_HIDE = "PREFIX_HINT_HIDE" as const;

/** Content → background: may prefix badge appear on this tab? */
export const PREFIX_HINT_CAN_SHOW = "PREFIX_HINT_CAN_SHOW" as const;

/** Content → background: user completed prefix flow on a blocked page. */
export const PREFIX_HINT_BLOCKED = "PREFIX_HINT_BLOCKED" as const;

export type PrefixHintShowMessage = {
  type: typeof PREFIX_HINT_SHOW;
  letter: string;
};

export type PrefixHintHideMessage = {
  type: typeof PREFIX_HINT_HIDE;
};

export type PrefixHintCanShowMessage = {
  type: typeof PREFIX_HINT_CAN_SHOW;
};

export type PrefixHintBlockedMessage = {
  type: typeof PREFIX_HINT_BLOCKED;
};

export type PrefixHintContentToBg =
  | PrefixHintShowMessage
  | PrefixHintHideMessage
  | PrefixHintCanShowMessage
  | PrefixHintBlockedMessage;

export function isPrefixHintShowMessage(
  msg: { type?: string },
): msg is PrefixHintShowMessage {
  return msg.type === PREFIX_HINT_SHOW;
}

export function isPrefixHintHideMessage(
  msg: { type?: string },
): msg is PrefixHintHideMessage {
  return msg.type === PREFIX_HINT_HIDE;
}

/** Show/hide prefix letter hint (toolbar badge from background). */
export type PrefixHintSink = {
  show: (letter: string) => void;
  hide: () => void;
};

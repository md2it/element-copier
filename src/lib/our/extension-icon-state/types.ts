export type ToolbarIconMode = "active" | "inactive";

export type ToolbarIconPaths = Record<
  ToolbarIconMode,
  Record<string, string>
>;

export type ToolbarIconImageSets = Record<
  ToolbarIconMode,
  Record<string, ImageData>
>;

/** Project paths, storage key, optional dynamic ImageData sets. */
export type ExtensionIconStateConfig = {
  paths: ToolbarIconPaths;
  syncedTabIdsStorageKey: string;
  logLabel: string;
  getImageSets?: () => ToolbarIconImageSets | null;
};

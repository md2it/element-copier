import { getToolbarIconSets } from "../src/icons";

export type ManifestIconRaster = {
  size: number;
  data: Buffer;
};

export function getInactiveManifestRasters(): ManifestIconRaster[] {
  const sets = getToolbarIconSets().inactive;
  return ([16, 32, 48, 128] as const).map((size) => ({
    size,
    data: Buffer.from(sets[String(size)].data),
  }));
}

export const manifestIconOutputs = [
  { prefix: "icon", getRasters: getInactiveManifestRasters },
] as const;

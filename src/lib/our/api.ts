/** Chrome / Firefox MV3 */
export const ext: typeof chrome =
  typeof browser !== "undefined" ? browser : chrome;

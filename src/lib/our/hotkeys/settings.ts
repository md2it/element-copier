export function readBooleanSetting(
  data: Record<string, unknown>,
  key: string,
): boolean {
  const raw = data[key];
  return raw !== false;
}

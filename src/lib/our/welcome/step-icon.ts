/** Lucide or inline SVG for welcome onboarding steps. */
export function welcomeStepIcon(raw: string, size = 14): string {
  return raw.replace("<svg ", `<svg width="${size}" height="${size}" `);
}

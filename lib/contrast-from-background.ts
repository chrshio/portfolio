/**
 * Compute average background color from a list of hex colors (optionally weighted),
 * then return a color with maximum contrast for text.
 *
 * Uses:
 * - Weighted average RGB by area (or equal weight)
 * - Relative luminance (WCAG) to choose black vs white for best contrast
 * - Optional: RGB inverse for a single "opposite" color
 */

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = hex.replace(/^#/, "");
  const v = parseInt(n, 16);
  return {
    r: (v >> 16) & 0xff,
    g: (v >> 8) & 0xff,
    b: v & 0xff,
  };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0"))
      .join("")
  );
}

/** WCAG relative luminance (0 = black, 1 = white) */
export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Average of hex colors. Weights are optional (same order as hexes).
 */
export function averageColor(
  hexes: string[],
  weights?: number[]
): { r: number; g: number; b: number } {
  const rgbs = hexes.map(hexToRgb);
  const w = weights ?? hexes.map(() => 1);
  const total = w.reduce((a, b) => a + b, 0);
  let r = 0,
    g = 0,
    b = 0;
  rgbs.forEach((rgb, i) => {
    const t = w[i] / total;
    r += rgb.r * t;
    g += rgb.g * t;
    b += rgb.b * t;
  });
  return { r, g, b };
}

/**
 * Color with maximum contrast against the given RGB.
 * Returns black or white depending on which has higher contrast (by luminance).
 */
export function maxContrastColor(r: number, g: number, b: number): string {
  const L = relativeLuminance(r, g, b);
  return L > 0.5 ? "#000000" : "#ffffff";
}

/**
 * RGB inverse: the color that is farthest in RGB space (not always best perceived contrast).
 */
export function rgbInverse(r: number, g: number, b: number): string {
  return rgbToHex(255 - r, 255 - g, 255 - b);
}

// Landing page background colors (from the three ovals)
const LANDING_BG_HEX = [
  "#04DCFF", // gradient top
  "#475ACB", // gradient bottom
  "#FFF991", // yellow oval
  "#EADFD9", // beige oval
];
// Approximate vertical band heights (vh) so we can weight by area
const LANDING_BG_WEIGHTS = [30, 30, 50, 28]; // gradient counts as two bands

const avg = averageColor(LANDING_BG_HEX, LANDING_BG_WEIGHTS);

/** Precomputed: use this for text on the landing background for max contrast */
export const LANDING_TEXT_COLOR = maxContrastColor(avg.r, avg.g, avg.b);

/** Precomputed average background color (hex) for reference */
export const LANDING_AVERAGE_BG_HEX = rgbToHex(
  Math.round(avg.r),
  Math.round(avg.g),
  Math.round(avg.b)
);

// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Valesor Development
//
// WCAG 2.1 relative-luminance and contrast-ratio math. Standard-library only —
// no color dependency, because the palette is fixed hex and needs no manipulation,
// only measurement. Both the build (nothing) and the contrast gate consume this.

/** Parse a #rgb or #rrggbb string into [r, g, b] bytes (0–255). */
export function parseHex(hex) {
  const s = hex.trim().replace(/^#/, '');
  const full = s.length === 3 ? s.replace(/(.)/g, '$1$1') : s;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Not a hex color: "${hex}"`);
  }
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
}

/** WCAG relative luminance of a hex color. */
export function relativeLuminance(hex) {
  const [r, g, b] = parseHex(hex).map((byte) => {
    const c = byte / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG contrast ratio between two hex colors, in [1, 21]. Order-independent. */
export function contrastRatio(a, b) {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

// WCAG 2.1 AA thresholds.
export const AA_BODY = 4.5; // normal-size text
export const AA_LARGE = 3.0; // >=24px, or >=18.66px bold; also UI/graphical accents

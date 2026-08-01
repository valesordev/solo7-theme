// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Valesor Development
//
// Accessibility build GATE. Enumerates every token pairing we intend to render as
// foreground-on-background and fails the build if any falls below its WCAG 2.1 AA
// threshold (4.5:1 body, 3:1 large/UI). Reads the SAME resolved tokens the CSS is
// generated from, so a passing gate is a real guarantee about what ships — not a
// separate spreadsheet that can drift. Gruvbox accents on gruvbox surfaces do NOT
// all pass; that is the point.

import { loadRawTokens, semanticColors, accentColors, SCHEMES, IMPRINTS } from './lib/tokens.mjs';
import { contrastRatio, AA_BODY, AA_LARGE } from './lib/color.mjs';

const tree = loadRawTokens();

/** @type {{scheme:string, imprint?:string, label:string, fg:string, bg:string, min:number}[]} */
const pairings = [];

for (const scheme of SCHEMES) {
  const s = semanticColors(tree, scheme);

  // Body text must be readable on every surface it can land on.
  for (const bgRole of ['bg', 'surface', 'well']) {
    pairings.push(pair(scheme, `fg on ${bgRole}`, s.fg, s[bgRole], AA_BODY));
  }
  // Secondary text: on page and panels (not inside code wells).
  for (const bgRole of ['bg', 'surface']) {
    pairings.push(pair(scheme, `fg-muted on ${bgRole}`, s['fg-muted'], s[bgRole], AA_BODY));
  }
  // Tertiary text is declared large-only (3:1) — the CSS never uses it at body size.
  for (const bgRole of ['bg', 'surface']) {
    pairings.push(pair(scheme, `fg-subtle on ${bgRole}`, s['fg-subtle'], s[bgRole], AA_LARGE));
  }

  // Per-imprint accents.
  for (const imprint of IMPRINTS) {
    const a = accentColors(tree, imprint, scheme);
    for (const bgRole of ['bg', 'surface']) {
      // Inline links + hover render at body size → full AA. (Hover only adds underline
      // weight, so accent-text is the single color that must clear 4.5:1 here.)
      pairings.push(
        pair(
          scheme,
          `${imprint}: accent-text on ${bgRole}`,
          a['accent-text'],
          s[bgRole],
          AA_BODY,
          imprint,
        ),
      );
      // The decorative accent (large headings, marks, rules, UI) → AA-large / non-text 3:1.
      pairings.push(
        pair(scheme, `${imprint}: accent on ${bgRole}`, a.accent, s[bgRole], AA_LARGE, imprint),
      );
    }
  }
}

function pair(scheme, label, fg, bg, min, imprint) {
  return { scheme, imprint, label, fg, bg, min };
}

let failures = 0;
const rows = pairings.map((p) => {
  const ratio = contrastRatio(p.fg, p.bg);
  const ok = ratio >= p.min;
  if (!ok) failures++;
  return { ...p, ratio, ok };
});

// Report grouped by scheme, failures flagged.
for (const scheme of SCHEMES) {
  process.stdout.write(`\n  [${scheme}]\n`);
  for (const r of rows.filter((r) => r.scheme === scheme)) {
    const mark = r.ok ? '  ok ' : 'FAIL ';
    const ratio = r.ratio.toFixed(2).padStart(5);
    process.stdout.write(`  ${mark} ${ratio}:1  (min ${r.min})  ${r.label}  ${r.fg} on ${r.bg}\n`);
  }
}

process.stdout.write(`\ncheck-contrast: ${rows.length} pairings, ${failures} failure(s)\n`);
if (failures > 0) {
  process.stderr.write(
    `\ncheck-contrast: FAILED — ${failures} pairing(s) below WCAG AA. Adjust tokens/accents.json or tokens/semantic.json.\n`,
  );
  process.exit(1);
}

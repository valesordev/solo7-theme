// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Valesor Development
//
// Generates demo/index.html — the kitchen sink. Every token and every component is
// rendered under all five imprint accents in BOTH color schemes, side by side, so a
// visual diff catches regressions the contrast gate can't (layout, spacing, borders).
// It is generated from the same token source the CSS is, so it can never fall out of
// sync with the real imprint list: add an imprint, the demo grows a column set.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { loadRawTokens, semanticColors, accentColors, SCHEMES, IMPRINTS } from './lib/tokens.mjs';
import { contrastRatio } from './lib/color.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'demo', 'index.html');
const tree = loadRawTokens();

// Per-imprint identity for the demo renders only (real sites supply their own copy).
const META = {
  valesor: {
    name: 'Valesor Development',
    site: 'valesordev.com',
    tag: 'Engineering · open source',
    hue: 'aqua',
  },
  system9: {
    name: 'System 9 Studios',
    site: 'system9studios.com',
    tag: 'Visual production · pipeline',
    hue: 'purple',
  },
  solo7productions: {
    name: 'Solo7 Productions',
    site: 'solo7productions.com',
    tag: 'Narrative label · fiction',
    hue: 'orange',
  },
  solo7media: { name: 'solo7.media', site: 'solo7.media', tag: 'Art portfolio', hue: 'green' },
  bashburn: {
    name: 'bashburn',
    site: 'bashburn.com',
    tag: 'Technical blog · terminal',
    hue: 'neutral',
  },
};

const esc = (s) =>
  String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const r2 = (n) => n.toFixed(2);

// ---- small render helpers -----------------------------------------------------

function swatch(name, hex, on) {
  const ratio = on ? ` <span class="d-ratio">${r2(contrastRatio(hex, on))}:1</span>` : '';
  return `<div class="d-swatch"><span class="d-chip" style="background:${hex}"></span>
    <code>${esc(name)}</code><span class="d-hex">${hex}</span>${ratio}</div>`;
}

function semanticSwatches(scheme) {
  const s = semanticColors(tree, scheme);
  return Object.entries(s)
    .map(([k, hex]) => swatch(`--color-${k}`, hex))
    .join('\n');
}

function accentSwatches(imprint, scheme) {
  const s = semanticColors(tree, scheme);
  const a = accentColors(tree, imprint, scheme);
  return [
    swatch('--color-accent', a.accent, s.bg),
    swatch('--color-accent-text', a['accent-text'], s.bg),
  ].join('\n');
}

// A full component render for one imprint in one scheme.
function cell(imprint, scheme) {
  const m = META[imprint];
  return `<div class="d-cell imprint-${imprint}" data-scheme="${scheme}">
  <header class="site-header">
    <div class="site-header__inner">
      <a class="brand" href="#"><span class="brand__mark" aria-hidden="true"></span>
        <span>${esc(m.name)}</span><span class="brand__note">${esc(m.tag)}</span></a>
      <nav class="site-nav" aria-label="Primary"><ul>
        <li><a href="#" aria-current="page">Home</a></li>
        <li><a href="#">Writing</a></li><li><a href="#">About</a></li>
      </ul></nav>
    </div>
  </header>

  <div class="region stack">
    <div class="stack stack--tight">
      <p class="eyebrow">${esc(scheme)} · ${esc(m.hue)}</p>
      <h2>The quiet part, out loud</h2>
      <p>Body copy with an <a href="#">inline link</a>, some <strong>strong emphasis</strong>,
        a bit of <code>inline_code()</code>, and a <mark>highlighted phrase</mark>. Press
        <kbd>⌘</kbd><kbd>K</kbd> to do nothing at all.</p>
    </div>

    <blockquote><p>One system, five marks — not one template, not five strangers.</p>
      <cite>${esc(m.site)}</cite></blockquote>

    <pre><code>export function build() {
  return tokens.map(emit); // ${esc(imprint)}
}</code></pre>

    <table>
      <caption>A small table</caption>
      <thead><tr><th>Token</th><th>Role</th></tr></thead>
      <tbody>
        <tr><td>accent</td><td>decoration</td></tr>
        <tr><td>accent-text</td><td>links</td></tr>
        <tr><td>fg-muted</td><td>secondary</td></tr>
      </tbody>
    </table>

    <p class="production-credits">Soft Disclosure — written and produced by
      <b>Solo7 Productions</b>. Animated by <b>System 9 Studios</b>. Tooling by
      <b>Valesor Development</b>.</p>

    <footer class="footer-credit">
      <p class="footer-credit__imprint"><b>${esc(m.name)}</b> — an imprint of Solo7.</p>
      <ul class="footer-credit__siblings">
        ${IMPRINTS.map((o) =>
          o === imprint
            ? `<li aria-current="true">${esc(META[o].name)}</li>`
            : `<li><a href="#">${esc(META[o].name)}</a></li>`,
        ).join('\n        ')}
      </ul>
      <p class="license-block"><span>Content under</span>
        <a href="#" rel="license"><b>CC BY 4.0</b></a> <code>CC-BY-4.0</code></p>
    </footer>
  </div>
</div>`;
}

// ---- scale references (rendered once, in both schemes) ------------------------

function typeScale() {
  return [6, 5, 4, 3, 2, 1, 0]
    .map(
      (n) =>
        `<p style="font-size:var(--font-size-${n});margin:0"><code>--font-size-${n}</code> Grumpy wizards</p>`,
    )
    .join('\n');
}
function spaceScale() {
  return [1, 2, 3, 4, 5, 6, 7, 8, 9]
    .map(
      (n) =>
        `<div class="d-bar"><span style="inline-size:var(--space-${n})"></span><code>--space-${n}</code></div>`,
    )
    .join('\n');
}
function radiiScale() {
  return ['sm', 'md', 'lg', 'full']
    .map(
      (k) =>
        `<div class="d-radius" style="border-radius:var(--radius-${k})"><code>${k}</code></div>`,
    )
    .join('\n');
}

// ---- assemble page ------------------------------------------------------------

const schemeCols = (render) =>
  `<div class="d-grid">${SCHEMES.map(
    (sc) =>
      `<div class="d-col" data-scheme="${sc}"><p class="d-colhdr">${sc}</p>${render(sc)}</div>`,
  ).join('')}</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>solo7-theme — kitchen sink</title>
<link rel="stylesheet" href="../dist/solo7.css">
<style>
  /* Demo scaffolding only — NOT part of the shipped stylesheet. */
  body { padding: var(--space-6) 0; }
  .d-wrap { max-inline-size: var(--breakpoint-xl); margin-inline: auto; padding-inline: var(--space-4); }
  .d-section { margin-block: var(--space-8); }
  .d-section > h2 { border-block-end: var(--border-width-thick) solid var(--color-border-strong); padding-block-end: var(--space-2); }
  .d-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); align-items: start; }
  .d-col { background: var(--color-bg); color: var(--color-fg); border: var(--border-width-thin) solid var(--color-border); border-radius: var(--radius-lg); padding: var(--space-4); }
  .d-colhdr { font-family: var(--font-mono); text-transform: uppercase; letter-spacing: var(--tracking-wide); color: var(--color-fg-muted); margin: 0 0 var(--space-3); }
  .d-cell { background: var(--color-bg); color: var(--color-fg); border: var(--border-width-thin) solid var(--color-border); border-radius: var(--radius-lg); overflow: hidden; }
  .d-cell .region { padding: var(--space-5); }
  .d-swatch { display: grid; grid-template-columns: 1.4em 1fr auto auto; align-items: center; gap: var(--space-2); font-size: var(--font-size-0); margin-block-end: var(--space-1); }
  .d-chip { inline-size: 1.4em; block-size: 1.4em; border-radius: var(--radius-sm); border: 1px solid rgba(128,128,128,.4); }
  .d-hex { font-family: var(--font-mono); color: var(--color-fg-muted); }
  .d-ratio { font-family: var(--font-mono); color: var(--color-fg-subtle); }
  .d-bar { display: flex; align-items: center; gap: var(--space-3); margin-block-end: var(--space-1); }
  .d-bar span { block-size: var(--space-3); background: var(--color-accent, var(--color-border-strong)); border-radius: var(--radius-sm); }
  .d-radius { display: grid; place-items: center; inline-size: 4rem; block-size: 3rem; background: var(--color-well); border: var(--border-width-thin) solid var(--color-border); font-size: var(--font-size-0); }
  .d-radii { display: flex; gap: var(--space-3); flex-wrap: wrap; }
  .d-legend { display: flex; flex-wrap: wrap; gap: var(--space-2) var(--space-4); font-size: var(--font-size-0); color: var(--color-fg-muted); }
  @media (max-width: 48rem) { .d-grid { grid-template-columns: 1fr; } }
</style>
</head>
<body>
<div class="d-wrap stack stack--loose">

  <header class="stack stack--tight">
    <p class="eyebrow">Valesor Development · Apache-2.0</p>
    <h1>solo7-theme — kitchen sink</h1>
    <p>Every token and component, under all ${IMPRINTS.length} imprint accents, in both color
      schemes. Left column is forced <code>light</code>, right is forced <code>dark</code>
      (via <code>data-scheme</code>) — independent of your OS setting, so both are always
      visible for regression diffing. Contrast ratios shown next to accent swatches are the
      same numbers <code>make check</code> gates on.</p>
    <p class="d-legend">
      <span>Swatch ratios are foreground-on-bg.</span>
      <span>AA body ≥ 4.5:1 · AA large/UI ≥ 3:1.</span>
    </p>
  </header>

  <section class="d-section">
    <h2>Semantic color roles</h2>
    ${schemeCols((sc) => semanticSwatches(sc))}
  </section>

  <section class="d-section">
    <h2>Type scale</h2>
    ${schemeCols(() => typeScale())}
  </section>

  <section class="d-section">
    <h2>Spacing &amp; radii</h2>
    ${schemeCols(() => spaceScale() + '<div class="d-radii" style="margin-block-start:var(--space-4)">' + radiiScale() + '</div>')}
  </section>

  <section class="d-section">
    <h2>Imprint accents</h2>
    ${IMPRINTS.map(
      (imp) => `<div class="imprint-${imp}" style="margin-block-end:var(--space-5)">
      <h3>${esc(META[imp].name)} — ${esc(META[imp].hue)}</h3>
      <div class="d-grid">
        ${SCHEMES.map((sc) => `<div class="d-col" data-scheme="${sc}"><p class="d-colhdr">${sc}</p>${accentSwatches(imp, sc)}</div>`).join('')}
      </div></div>`,
    ).join('\n')}
  </section>

  <section class="d-section">
    <h2>Components — every imprint, both schemes</h2>
    ${IMPRINTS.map(
      (imp) => `<div style="margin-block-end:var(--space-6)">
      <h3>${esc(META[imp].name)}</h3>
      <div class="d-grid">${SCHEMES.map((sc) => cell(imp, sc)).join('')}</div>
      </div>`,
    ).join('\n')}
  </section>

</div>
</body>
</html>
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
// eslint-disable-next-line no-console
console.log(`build-demo: wrote ${OUT} (${IMPRINTS.length} imprints × ${SCHEMES.length} schemes)`);

<!-- SPDX-License-Identifier: Apache-2.0 -->

# ADR-002: Token authoring format and build pipeline

- Status: Accepted
- Date: 2026-08-01

## Context

The design tokens need a machine-readable source of truth (hard requirement) that a build
step turns into CSS custom properties. The same source must feed the accessibility gate:
every foreground/background pairing is checked against WCAG AA, and that check must read
the _same_ values the CSS is generated from, or it is measuring a different artifact than
the one that ships.

Constraints:

- **Keep the dependency count low.** This is an open-source release; a small, auditable
  toolchain is a feature.
- **Consumers do no build.** The build here is authoring-only (ADR-001); its output is two
  static files.
- **The CSS budget is a promise** (~15KB minified, stated in the README), so the pipeline
  must produce real minification we can measure and gate on.

## Decision

**JSON token source in a DTCG-shaped format → a small Node standard-library generator →
esbuild as the single bundler/minifier.**

- **Source format:** `tokens/*.json`, using the W3C Design Tokens Community Group shape
  (`$type` / `$value`, `{group.token}` references). Self-describing and tool-agnostic.
  Color-scheme-specific values are expressed as `light` / `dark` sub-nodes; references are
  resolved at build time.
- **Generator:** `tools/build-tokens.mjs`, Node stdlib only — no dependency. It emits
  `src/css/_tokens.generated.css` (custom properties for both schemes, plus forced
  `[data-scheme]` variants for the demo). Gruvbox hexes are fixed constants, so there is
  no color-math dependency; the only color computation anywhere is WCAG luminance/contrast
  in `tools/lib/color.mjs` (~30 lines, stdlib).
- **Contrast gate:** `tools/check-contrast.mjs` reads tokens through the _same_
  `tools/lib/tokens.mjs` loader the generator uses, so a passing gate is a real guarantee
  about the shipped CSS, not a parallel spreadsheet.
- **Bundler/minifier:** esbuild inlines every `@import` into one minified `dist/solo7.css`
  and bundles the Faro SDK into one `dist/solo7.mjs`. One fast dependency does both jobs
  and makes the budget claim measurable (`tools/check-budget.mjs`).

Total footprint: `esbuild`, `prettier`, `stylelint` (dev) + `@grafana/faro-web-sdk`
(the one bundled runtime dependency).

## Consequences

Positive:

- One reader, one truth: CSS and the a11y gate can't diverge.
- Tiny, auditable generator with zero runtime deps of its own.
- Real, measured minification backs the CSS budget promise.
- DTCG shape keeps the door open to other tooling later without a rewrite.

Negative / costs accepted:

- The generator is bespoke code we own, rather than an off-the-shelf tool — but it is
  small, and the alternative (below) was heavier than the job.
- esbuild is a build-time dependency. Judged worth it: hand-rolled minification could not
  honestly back the budget number.
- The DTCG scheme-as-sub-node convention is a light local extension, not strict DTCG modes.

## Alternatives considered

- **Style Dictionary.** The obvious off-the-shelf choice, but heavyweight and
  configuration-heavy for what is one CSS output plus a bespoke contrast gate. It would add
  a large dependency and its own config surface to save ~150 lines of generator we fully
  control. Rejected on the low-dependency constraint.
- **Zero build-time dependencies (hand-rolled concat + naive minify).** Considered so the
  authoring side would have no deps at all. Rejected: without a real minifier we could not
  stand behind the <15KB _minified_ budget claim, and CSS `@import` inlining + JS SDK
  bundling are exactly what esbuild does well in one step.
- **Plain ad-hoc JSON (no DTCG).** Simpler to write, but throws away the self-describing
  `$type` metadata and a migration path to standard tooling for no real saving.

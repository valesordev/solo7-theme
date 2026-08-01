<!-- SPDX-License-Identifier: Apache-2.0 -->

# solo7-theme

A shared design system and instrumentation layer for the **Solo7** family of static
personal websites. One system, five marks — a shared type scale, spacing, grid, and
components, with a per-imprint accent color, so the sites read as a label family (like a
record label's imprints) rather than one corporate template or five unrelated sites.

An open-source release under the **Valesor Development** imprint
([github.com/valesordev](https://github.com/valesordev)), licensed **Apache-2.0**.

**CSS budget: the entire system ships in under 15KB minified.** The current build is
~11.3KB minified (~2.7KB gzipped), and `make check` fails the build if it ever crosses
15KB.

## The family

| Domain               | Imprint / identity  | Accent             |
| -------------------- | ------------------- | ------------------ |
| valesordev.com       | Valesor Development | aqua               |
| system9studios.com   | System 9 Studios    | purple             |
| solo7productions.com | Solo7 Productions   | orange             |
| solo7.media          | Solo7 (personal)    | green              |
| bashburn.com         | bashburn            | neutral (terminal) |

None of these sites sell anything — no CTAs, no forms, no signups. Everything published
under them is open-licensed.

## What you get

- **Design tokens** — a JSON source of truth (`tokens/`) built into CSS custom properties:
  gruvbox light+dark palettes, per-imprint accents, a modular type scale, spacing, radii,
  borders, shadows, z-index, and breakpoints.
- **A base stylesheet** — modern reset, prose-first typography, links, lists, tables,
  blockquotes, code/pre (these are technical sites), figures, and layout primitives
  (`container`, `stack`, `cluster`).
- **Shared components** — site header/nav, the imprint **footer credit block**, the fixed
  **production credits block**, a parameterized license block, and shared `/privacy`
  content.
- **Faro instrumentation** — an opt-in Grafana Faro module with privacy constraints baked
  in (volatile sessions, **no session replay**, no user identification, no PII). See below.
- **An accessibility gate** — every intended foreground/background pairing is checked
  against WCAG AA and **fails the build** on violation.

## Adopting it on a site

Distribution is CI-published to GitHub Pages (versioned paths) and GitHub Releases; this
repo never commits `dist/`. See [ADR-001](docs/adr/0001-distribution-mechanism.md). Two
supported modes:

### Zero-build (hot-link) — for hand-written HTML with no tooling

```html
<!doctype html>
<html lang="en" class="imprint-valesor">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="stylesheet" href="https://valesordev.github.io/solo7-theme/@1/solo7.css" />
  </head>
  <body>
    <!-- your content -->
    <script type="module">
      import { initFaro } from 'https://valesordev.github.io/solo7-theme/@1/solo7.mjs';
      initFaro({
        appName: 'valesordev.com',
        appVersion: '1.0.0',
        endpoint: 'https://<your-faro-collector>/collect',
        appKey: '<your-public-app-key>',
      });
    </script>
  </body>
</html>
```

- Set the imprint by putting `class="imprint-<name>"` on `<html>` — one of `imprint-valesor`,
  `imprint-system9`, `imprint-solo7productions`, `imprint-solo7media`, `imprint-bashburn`.
- Use `@1` to track the latest v1, or `@1.2.0` to pin exact bytes.
- **The stylesheet needs no JavaScript.** `initFaro` is entirely optional (see below).

### Offline-reproducible (vendored) — pin exact bytes into your repo

Download the pinned assets from a [GitHub Release](../../releases) into your site repo and
commit them, then link relative paths:

```html
<link rel="stylesheet" href="/vendor/solo7-theme/solo7.css" />
```

This removes any serve-time dependency on this repo and makes the site buildable offline.
Update by re-downloading the newer release and committing it — a deliberate, per-site act.

### Light & dark

The palette is gruvbox-derived and supports both schemes via `prefers-color-scheme`
automatically — no JS, no toggle required. bashburn is dark-first/terminal in character;
the others lean light. Both are first-class.

## The Faro instrumentation (privacy)

The JS module is **opt-in and a graceful no-op without config** — a site works fully
uninstrumented. When configured, it applies these constraints (see
[`src/js/faro.mjs`](src/js/faro.mjs)):

- **Volatile sessions only** (sessionStorage) — no persistent/sticky sessions.
- **Session Replay is OFF** and the package is not even a dependency. These sites publish
  about health conditions; replay would record which posts a stranger lingers on.
- **No user identification** — the user-meta API is never called. No accounts exist.
- **No PII** in attributes or events; console capture and geolocation are off.
- **Explicit sampling** — set deliberately, never left to a default.
- **Per-site config** (name, version, endpoint, app key) is injected by the consumer. The
  app key ships to the browser so it is not a secret, but it is kept out of this repo.

## Local development

Everything is Makefile-driven — no hidden steps (`make help` lists targets):

```
make build     # regenerate tokens, bundle + minify dist/, generate the demo
make check     # the full gate: contrast (WCAG AA) + stylelint + prettier + CSS budget
make serve     # build, then serve the kitchen-sink demo at http://localhost:8791/demo/
make release   # run the gate, build artifacts, print the tag-to-publish steps
```

Requires Node 22+. `make check` is exactly what CI runs on every PR
([.github/workflows/check.yml](.github/workflows/check.yml)).

## Repository layout

```
tokens/         JSON token source of truth (DTCG-shaped)
tools/          authoring build scripts (Node stdlib) + esbuild bundler
src/css/        hand-written CSS (reset, base, code, layout, components)
src/js/         Faro instrumentation module
src/partials/   HTML partials (header, footer credit, production credits, license, privacy)
demo/           generated kitchen-sink page (every token + component, 5 imprints × 2 schemes)
docs/adr/       architecture decision records
```

## Decisions

- [ADR-001: Distribution mechanism](docs/adr/0001-distribution-mechanism.md)
- [ADR-002: Token authoring format and build pipeline](docs/adr/0002-token-authoring-and-build.md)

## Accessibility

`tools/check-contrast.mjs` enumerates every intended foreground-on-background pairing and
fails the build if any falls below WCAG AA (4.5:1 body, 3:1 large/UI). Gruvbox accents on
gruvbox surfaces do **not** all pass at their canonical values — five accent variants are
minimally tuned (documented in `tokens/palette.gruvbox.json` under `gruvbox.accent.tuned`)
so every pairing clears AA. The demo shows the live ratios next to each accent.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for the workflow and the
design constraints the CI enforces (accessibility gate, CSS budget, zero-build consumption,
Faro privacy rules). Participation is covered by our
[Code of Conduct](CODE_OF_CONDUCT.md). To report a vulnerability, see
[SECURITY.md](SECURITY.md).

## License

Apache-2.0 — see [LICENSE](LICENSE) and [NOTICE](NOTICE). The color palette derives from
[gruvbox](https://github.com/morhetz/gruvbox) (MIT).

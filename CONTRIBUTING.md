<!-- SPDX-License-Identifier: Apache-2.0 -->

# Contributing to solo7-theme

Thanks for your interest. This is the shared design system and instrumentation layer for
the Solo7 family of static sites — small, dependency-light, and accessibility-gated by
design. Contributions that keep it that way are very welcome.

By participating you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ground rules the CI enforces

`make check` is the gate — it runs on every PR and must pass. It bundles four checks:

1. **Accessibility (WCAG AA).** Every intended foreground-on-background pairing is verified
   (4.5:1 body, 3:1 large/UI). New colors that don't clear AA fail the build — that's
   intentional. See `tools/check-contrast.mjs`.
2. **CSS budget.** The minified stylesheet must stay under 15KB (`tools/check-budget.mjs`).
   New CSS should earn its bytes.
3. **stylelint** over the hand-written CSS.
4. **prettier** formatting (`npm run format:write` to fix).

## Design constraints (please don't regress these)

- **Tokens are the source of truth.** Edit `tokens/*.json`, never the generated
  `src/css/_tokens.generated.css`. The CSS and the a11y gate both read the same tokens.
- **No framework dependency.** Plain CSS custom properties and standards-compliant ES
  modules — no React, Tailwind, or CSS-in-JS.
- **Zero-build consumption must keep working.** A hand-written HTML file must be able to
  `<link>` one stylesheet and `<script type="module">` one JS file and get the system.
  Build tooling here is for _authoring_, never required of consumers.
- **Light and dark are both first-class.** Any color change must hold up in both schemes.
- **Faro privacy constraints are hard requirements, not defaults to revisit:** volatile
  sessions only, **no session replay** (the package must not be added), no user
  identification, no PII in events/attributes, explicit sampling. See `src/js/faro.mjs`.
- **Scope:** this is the shared layer only. Per-site content, copy, and page templates live
  in the individual site repos, not here.

## Development

Requires **Node 22+** and `make`.

```
make build     # regenerate tokens, bundle + minify dist/, generate the demo
make check     # the full gate (run this before opening a PR)
make serve     # serve the kitchen-sink demo at http://localhost:8791/demo/
make help      # list all targets
```

The demo (`make serve`) renders every token and component across all five imprints in both
schemes — use it to eyeball changes. Add a token or an imprint and the demo grows to cover
it automatically.

### Adding or changing an accent

1. Edit `tokens/accents.json` (and `tokens/palette.gruvbox.json` if a new hue variant is
   needed). Reference canonical gruvbox where it clears AA; add a documented entry under
   `gruvbox.accent.tuned` only when a canonical hue can't.
2. Run `make check`. If a pairing fails AA, adjust the value — don't lower the threshold.
3. Check the demo in both schemes.

## Pull requests

- Branch from `main`; keep PRs focused.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for messages
  (`feat:`, `fix:`, `docs:`, `chore:`, …).
- Run `make check` locally first.
- **Architectural decisions get an ADR.** If you're changing how distribution, the build
  pipeline, or a core constraint works, add a record in `docs/adr/` (context, decision,
  consequences, alternatives) following the existing format.
- Fill out the PR template checklist.

## Licensing

This project is Apache-2.0. By contributing, you agree your contributions are licensed
under the same terms. Add the SPDX header (`SPDX-License-Identifier: Apache-2.0`) to new
source files, matching the surrounding files.

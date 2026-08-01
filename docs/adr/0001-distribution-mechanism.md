<!-- SPDX-License-Identifier: Apache-2.0 -->

# ADR-001: Distribution mechanism

- Status: Accepted
- Date: 2026-08-01

## Context

`solo7-theme` is a shared design system consumed by five static personal websites
(valesordev.com, system9studios.com, solo7productions.com, solo7.media, bashburn.com).
All five are static, hosted on GitHub Pages, with DNS via Cloudflare. **At least some of
them have no build step at all** — a plain, hand-written HTML file must be able to
`<link>` one stylesheet and `<script type="module">` one JS file and get the whole
system (hard constraint #1).

We need to decide how those five sites obtain the built `solo7.css` and `solo7.mjs`.
The forces that matter:

- **Zero-build consumption must work.** No `npm install`, no bundler required on the
  consumer side.
- **Offline reproducibility.** A site should be buildable/previewable, and pinnable to an
  exact version, without a live dependency on this repo at serve time.
- **Update friction.** Updating the shared layer should be a deliberate, per-site act —
  not an invisible change that restyles five sites at once (some of which publish about
  health topics and should not shift under people mid-read).
- **Single point of failure.** A shared runtime dependency that can take down all five
  sites' styling at once is a liability.

## Decision

**CI publishes the built artifacts to two GitHub-native, unauthenticated locations on
each version tag; `dist/` is never committed to the default branch.**

On push of a `v*` tag, `.github/workflows/release.yml` runs `make check` + `make build`,
then:

1. **GitHub Pages**, at immutable versioned paths plus a moving major alias:
   - `https://valesordev.github.io/solo7-theme/@X.Y.Z/solo7.css` — pin exact
   - `https://valesordev.github.io/solo7-theme/@X/solo7.css` — track a major line

   Publishing is additive (`keep_files: true` on the `gh-pages` branch): each release
   adds its `@X.Y.Z/` directory without deleting older ones, so an exact pin never
   changes bytes under a site.

2. **A GitHub Release**, with `solo7.css` and `solo7.mjs` attached — hard-immutable per
   tag, with generated notes for provenance.

Two consumption modes, both first-class and documented in the README:

- **Zero-build / lowest friction:** hot-link the versioned Pages URL. Works in a bare
  HTML file with no tooling.
- **Offline-reproducible:** download a pinned Release asset once and commit it into the
  _site's own_ repo (e.g. `/vendor/solo7-theme/`). The site then builds and previews with
  no network dependency; updating is an explicit re-download + commit.

`dist/` is `.gitignore`d. This CI workflow is the only producer of published artifacts.

## Consequences

Positive:

- A hand-written HTML page can adopt the system with two tags and zero tooling.
- Exact-version pins are immutable; sites choose when to move.
- The offline mode gives full reproducibility with no serve-time dependency on this repo.
- No build artifacts pollute the default branch history.
- Both endpoints are unauthenticated for a public repo — no tokens, no `.npmrc`.

Negative / costs accepted:

- Requires a one-time repo setting: GitHub Pages source = `gh-pages` branch.
- The moving `@X` alias _is_ a live dependency for sites that choose it (mitigated by
  offering exact pins and the vendored/offline mode).
- Two publish targets to keep working in CI instead of one.
- Hot-linking sites take a soft dependency on this repo's Pages availability; the vendored
  mode exists precisely for sites that can't accept that.

## Alternatives considered

- **npm / GitHub Packages (registry install).** Rejected as the consumption path.
  Installing from GitHub Packages' npm registry requires an authenticated `.npmrc` with a
  PAT _even for public packages_, and it is not proxied by jsDelivr/unpkg — so a zero-build
  HTML file cannot consume it. It fails hard constraint #1. (An optional public-npm publish
  remains available as an authoring-side extra — it would unlock jsDelivr/unpkg CDN URLs —
  but it is explicitly not what the five sites link.)
- **git submodule vendoring a committed `dist/`.** Viable and offline-reproducible, but
  requires committing build artifacts to this repo's git history, and the maintainer
  preferred keeping `dist/` out of git. The Release-asset "download + commit into the site
  repo" mode preserves the same offline-reproducibility benefit without that cost.
- **CDN-primary with a single unversioned URL.** Lowest friction but fails offline
  reproducibility and makes this repo a single point of failure across all five sites.
  Versioned Pages paths + the vendored mode give the friction benefit without that risk.

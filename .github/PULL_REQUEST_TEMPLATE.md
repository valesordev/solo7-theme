<!-- SPDX-License-Identifier: Apache-2.0 -->

## What & why

<!-- What does this change, and what problem does it solve? Link any related issue. -->

## Checklist

- [ ] `make check` passes locally (contrast + stylelint + prettier + CSS budget)
- [ ] Conventional Commit title (`feat:`, `fix:`, `docs:`, `chore:`, …)
- [ ] Tokens edited in `tokens/*.json` (not the generated CSS), if colors/scales changed
- [ ] Verified in both light and dark schemes (checked the demo where relevant)
- [ ] No new framework/runtime dependencies; zero-build consumption still works
- [ ] Faro privacy constraints preserved (no session replay, volatile sessions, no PII, no user id)
- [ ] SPDX header on any new source files
- [ ] Added/updated an ADR in `docs/adr/` if this is an architectural decision

## Notes for reviewers

<!-- Anything worth calling out: trade-offs, follow-ups, screenshots for visual changes. -->

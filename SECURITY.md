<!-- SPDX-License-Identifier: Apache-2.0 -->

# Security Policy

## Reporting a vulnerability

Please report suspected vulnerabilities privately — do **not** open a public issue for them.

- Preferred: use GitHub's [private vulnerability reporting](https://github.com/valesordev/solo7-theme/security/advisories/new)
  ("Report a vulnerability" under the Security tab).
- Or email **security@valesordev.com**.

We'll acknowledge receipt within a few days and keep you updated on the fix. Once resolved,
we're happy to credit you unless you'd prefer to remain anonymous.

## Scope notes

This project ships CSS and a small browser instrumentation module.

- **The Faro app key is not a secret.** It necessarily ships to the browser (see
  `src/js/faro.mjs` and the README). Reporting it as "exposed" is expected behavior, not a
  vulnerability. Each consuming site supplies its own key; keys are kept out of this repo.
- The instrumentation is deliberately privacy-constrained (volatile sessions, no session
  replay, no user identification, no PII). Reports that these constraints can be bypassed —
  for example, a way the module could leak PII or persist a session — are in scope and
  valued.
- Reports about the build/release supply chain (token generation, esbuild bundling, the
  GitHub Actions release workflow) are in scope.

## Supported versions

This is a rolling release; security fixes land on the latest tagged version. Consumers are
encouraged to track the current major (`@0`) or pin an exact version and update promptly.

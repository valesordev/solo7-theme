// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Valesor Development
//
// The consumer-facing build. Produces exactly two files a zero-build site links:
//   dist/solo7.css  — every stylesheet @import-bundled + minified (the whole system)
//   dist/solo7.mjs  — the Faro instrumentation entry, with the SDK bundled in
// esbuild is the single bundler/minifier (ADR-002). Token CSS is regenerated first so
// the bundle always reflects tokens/*.json.

import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const DIST = join(ROOT, 'dist');

// 1. Regenerate token CSS from JSON.
execFileSync('node', [join(HERE, 'build-tokens.mjs')], { stdio: 'inherit' });

mkdirSync(DIST, { recursive: true });

// 2. Bundle + minify the stylesheet (index.css @imports tokens + all partials of CSS).
await build({
  entryPoints: [join(ROOT, 'src', 'css', 'index.css')],
  bundle: true,
  minify: true,
  outfile: join(DIST, 'solo7.css'),
  loader: { '.css': 'css' },
  logLevel: 'info',
});

// 3. Bundle + minify the JS entry (Faro SDK bundled in, ESM out, no external deps).
await build({
  entryPoints: [join(ROOT, 'src', 'js', 'index.mjs')],
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  outfile: join(DIST, 'solo7.mjs'),
  logLevel: 'info',
});

// 4. Stamp the version for provenance in the published artifacts.
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
writeFileSync(join(DIST, 'VERSION'), `${pkg.version}\n`);

// eslint-disable-next-line no-console
console.log(`build: wrote dist/solo7.css, dist/solo7.mjs, dist/VERSION (v${pkg.version})`);

// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Valesor Development
//
// CSS budget GATE. The README promises the whole system ships in a small stylesheet;
// this makes the promise enforceable. Fails the build if minified dist/solo7.css
// exceeds the budget. Gzip size is reported for information (that is what the wire
// actually carries) but the gate is on raw minified bytes, matching the README claim.

import { readFileSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const CSS = join(HERE, '..', 'dist', 'solo7.css');

const BUDGET_BYTES = 15 * 1024; // ~15KB minified — keep in sync with README.

let size;
try {
  size = statSync(CSS).size;
} catch {
  process.stderr.write(`check-budget: ${CSS} not found — run \`make build\` first.\n`);
  process.exit(1);
}

const gz = gzipSync(readFileSync(CSS)).length;
const kb = (n) => (n / 1024).toFixed(2) + 'KB';

process.stdout.write(
  `check-budget: dist/solo7.css = ${kb(size)} minified (${kb(gz)} gzipped), budget ${kb(BUDGET_BYTES)}\n`,
);

if (size > BUDGET_BYTES) {
  process.stderr.write(
    `check-budget: FAILED — minified CSS ${kb(size)} exceeds ${kb(BUDGET_BYTES)} budget.\n`,
  );
  process.exit(1);
}

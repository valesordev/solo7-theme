// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 Valesor Development
//
// Loads the JSON token source (tokens/*.json), merges it into one tree, and
// resolves DTCG-style "{path.to.token}" references to concrete values. This is
// the single reader shared by the CSS emitter and the contrast gate, so the two
// can never disagree about what a color actually is.

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
export const TOKENS_DIR = join(HERE, '..', '..', 'tokens');

/** The two color schemes we build for. Both are first-class. */
export const SCHEMES = ['light', 'dark'];

/** Imprint keys in canonical order, matched to tokens/accents.json. */
export const IMPRINTS = ['valesor', 'system9', 'solo7productions', 'solo7media', 'bashburn'];

/** Load and shallow-merge every tokens/*.json into one tree (drops top-level $keys). */
export function loadRawTokens() {
  const tree = {};
  for (const file of readdirSync(TOKENS_DIR).sort()) {
    if (!file.endsWith('.json')) continue;
    const doc = JSON.parse(readFileSync(join(TOKENS_DIR, file), 'utf8'));
    for (const [key, value] of Object.entries(doc)) {
      if (key.startsWith('$')) continue;
      if (key in tree) {
        throw new Error(`Duplicate top-level token group "${key}" (in ${file})`);
      }
      tree[key] = value;
    }
  }
  return tree;
}

const REF = /^\{([^}]+)\}$/;

/** Follow a dotted path to a node in the tree. */
function nodeAt(tree, path) {
  return path.split('.').reduce((node, key) => {
    if (node == null || !(key in node)) {
      throw new Error(`Unknown token reference: "${path}"`);
    }
    return node[key];
  }, tree);
}

/**
 * Resolve a token $value to a concrete primitive, chasing "{ref}" chains.
 * A referenced node is expected to carry its own $value.
 */
export function resolveValue(tree, value, seen = new Set()) {
  if (typeof value !== 'string') return value;
  const m = value.match(REF);
  if (!m) return value;
  const path = m[1];
  if (seen.has(path)) throw new Error(`Circular token reference at "${path}"`);
  seen.add(path);
  const node = nodeAt(tree, path);
  if (node == null || !('$value' in node)) {
    throw new Error(`Reference "${path}" does not point at a token with $value`);
  }
  return resolveValue(tree, node.$value, seen);
}

/**
 * Semantic color roles resolved to hex for one scheme.
 * Shape: { bg, surface, well, fg, "fg-muted", "fg-subtle", border, "border-strong" }
 */
export function semanticColors(tree, scheme) {
  const out = {};
  for (const [role, node] of Object.entries(tree.color)) {
    if (role.startsWith('$')) continue;
    out[role] = resolveValue(tree, node[scheme].$value);
  }
  return out;
}

/**
 * Accent roles resolved to hex for one imprint + scheme.
 * Shape: { accent, "accent-text", "accent-strong" }
 */
export function accentColors(tree, imprint, scheme) {
  const node = tree.imprint[imprint];
  const out = {};
  for (const [role, roleNode] of Object.entries(node)) {
    if (role.startsWith('$')) continue;
    out[role] = resolveValue(tree, roleNode[scheme].$value);
  }
  return out;
}

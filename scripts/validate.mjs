#!/usr/bin/env node
/**
 * validate.mjs
 *
 * Lightweight structural validation of the built sitemap BEFORE anyone pastes it
 * into Data Cloud. Data Cloud only reports errors after upload; this catches the
 * obvious breakage in CI so bad configs never reach the connector.
 *
 * This is a syntax + shape check, not a semantic guarantee. Extend REQUIRED_CALLS
 * and the checks below to match your org's sitemap conventions.
 *
 * USAGE
 *   node scripts/validate.mjs        # validates build/sitemap.js
 *
 * EXIT CODES
 *   0  valid   1  validation failed   2  operational error
 */

import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const TARGET = process.env.LOCAL_SITEMAP ?? 'build/sitemap.js';

// Tokens the sitemap is expected to contain. Adjust to your SDK namespace
// (SalesforceInteractions vs Evergage) and your required wiring.
const REQUIRED_CALLS = [
  'SalesforceInteractions', // SDK namespace present
  'init', //  sitemap init call
];

async function main() {
  let source;
  try {
    source = await readFile(TARGET, 'utf8');
  } catch (err) {
    console.error(`ERROR: cannot read ${TARGET}: ${err.message}`);
    process.exit(2);
  }

  const errors = [];

  // 1. Must parse as valid JS. new Script() compiles without executing.
  try {
    new vm.Script(source, { filename: TARGET });
  } catch (err) {
    errors.push(`Syntax error: ${err.message}`);
  }

  // 2. Required tokens must be present.
  for (const token of REQUIRED_CALLS) {
    if (!source.includes(token)) {
      errors.push(`Missing required token: "${token}"`);
    }
  }

  // 3. Balanced braces/parens as a cheap structural sanity check.
  const pairs = { '{': '}', '(': '(' };
  void pairs; // placeholder if you extend structural checks
  const open = (source.match(/\{/g) || []).length;
  const close = (source.match(/\}/g) || []).length;
  if (open !== close) {
    errors.push(`Unbalanced braces: ${open} "{" vs ${close} "}"`);
  }

  if (errors.length) {
    console.error(`✗ Validation failed for ${TARGET}:`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`✓ ${TARGET} passed structural validation.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(`ERROR: ${err.stack ?? err}`);
  process.exit(2);
});

#!/usr/bin/env node
/**
 * build.mjs
 *
 * Bundles the modular sitemap source (src/) into the single sitemap.js file
 * that gets pasted into the Data Cloud website connector.
 *
 * Data Cloud's connector expects ONE sitemap.js. Authoring in one giant file is
 * unreviewable, so we author in modules and concatenate here in a deterministic
 * order. The emitted build/sitemap.js is the artifact you paste AND the artifact
 * drift-check.mjs compares against, so the build must be reproducible.
 *
 * This intentionally does no minification: the more the local artifact resembles
 * what the CDN serves, the fewer false positives in drift detection. If your SDK
 * setup serves a minified file, either (a) minify identically here, or (b) rely
 * on normalize() in drift-check.mjs.
 *
 * USAGE
 *   node scripts/build.mjs        # writes build/sitemap.js
 */

import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const SRC = 'src';
const OUT_DIR = 'build';
const OUT_FILE = join(OUT_DIR, 'sitemap.js');

async function readModulesFrom(dir) {
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }
  // Deterministic order: sort by filename so builds are byte-stable.
  const files = entries.filter((f) => f.endsWith('.js')).sort();
  const parts = [];
  for (const f of files) {
    const body = await readFile(join(dir, f), 'utf8');
    parts.push(`/* ---- ${join(dir, f)} ---- */\n${body.trim()}\n`);
  }
  return parts;
}

async function main() {
  const header =
    '/* GENERATED FILE — do not edit by hand.\n' +
    ' * Built from src/ by scripts/build.mjs. Edit the source modules instead.\n' +
    ' * This is the artifact pasted into the Data Cloud website connector. */\n\n';

  // Order matters: shared helpers first, then page-type instrumentation,
  // then the top-level sitemap.js entry that wires it together.
  const shared = await readModulesFrom(join(SRC, 'shared'));
  const pageTypes = await readModulesFrom(join(SRC, 'pageTypes'));

  let entry = '';
  try {
    entry = await readFile(join(SRC, 'sitemap.js'), 'utf8');
  } catch {
    console.error(`ERROR: missing entry module ${join(SRC, 'sitemap.js')}`);
    process.exit(1);
  }

  const bundle =
    header +
    shared.join('\n') +
    '\n' +
    pageTypes.join('\n') +
    '\n/* ---- entry: src/sitemap.js ---- */\n' +
    entry.trim() +
    '\n';

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(OUT_FILE, bundle, 'utf8');
  console.log(`✓ Built ${OUT_FILE} (${bundle.length} bytes)`);
}

main().catch((err) => {
  console.error(`Build failed: ${err.stack ?? err}`);
  process.exit(1);
});

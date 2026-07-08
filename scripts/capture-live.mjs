#!/usr/bin/env node
/**
 * capture-live.mjs — AUTO-CAPTURE MODE
 *
 * Reads the live sitemap from Data Cloud via the official Connect API and, if
 * it differs from what's committed, writes it into the repo so a dated snapshot
 * gets committed to Git. Safety net for direct edits made in the Data Cloud UI:
 * you keep versioning + backup + diff even when someone bypasses Git.
 *
 * WHAT IT CANNOT DO
 * Data Cloud records no author for UI edits, so a captured change shows WHAT
 * changed and WHEN, but never WHO/WHY. Changes made through the PR flow carry
 * who/why; this only backfills the ones that didn't.
 *
 * USAGE
 *   SF_INSTANCE_URL=... SF_ACCESS_TOKEN=... SF_CONNECTION_ID=... \
 *     node scripts/capture-live.mjs
 *
 * EXIT CODES
 *   0  no change, or change captured & written
 *   2  operational error
 *
 * Prints "CAPTURED_CHANGE=true|false" on the last line for the workflow.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getSitemap, normalize } from './lib/sfapi.mjs';

const CONNECTION_ID = process.env.SF_CONNECTION_ID;
const LOCAL_PATH = process.env.LOCAL_SITEMAP ?? 'build/sitemap.js';

const sha256 = (t) => createHash('sha256').update(t, 'utf8').digest('hex');

function fail(msg) {
  console.error(msg);
  console.log('CAPTURED_CHANGE=false');
  process.exit(2);
}

async function main() {
  if (!CONNECTION_ID) fail('ERROR: SF_CONNECTION_ID env var is required.');

  let live;
  try {
    const res = await getSitemap(CONNECTION_ID);
    live = res.sitemap ?? '';
  } catch (err) {
    fail(`ERROR: ${err.message}`);
  }

  let localRaw = '';
  try {
    localRaw = await readFile(LOCAL_PATH, 'utf8');
  } catch {
    localRaw = ''; // no committed file yet — treat as first capture
  }

  if (localRaw && sha256(normalize(localRaw)) === sha256(normalize(live))) {
    console.log('✓ No change: live sitemap already matches the committed version.');
    console.log('CAPTURED_CHANGE=false');
    process.exit(0);
  }

  await writeFile(LOCAL_PATH, live.endsWith('\n') ? live : live + '\n', 'utf8');
  console.log(`⬇ Captured live sitemap into ${LOCAL_PATH} (${live.length} bytes).`);
  console.log('   This reflects a change made directly in the Data Cloud UI.');
  console.log('CAPTURED_CHANGE=true');
  process.exit(0);
}

main().catch((err) => fail(`ERROR: unexpected failure: ${err.stack ?? err}`));

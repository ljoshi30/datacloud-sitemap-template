#!/usr/bin/env node
/**
 * capture-live.mjs  —  AUTO-CAPTURE MODE
 *
 * Fetches the sitemap currently LIVE in Data Cloud (via the beacon CDN) and, if
 * it differs from what's committed, writes it into the repo so a dated snapshot
 * gets committed to Git. This is the safety net for direct edits made in the
 * Data Cloud UI: even when someone bypasses Git, you still get versioning,
 * backup, and a diff — automatically, with zero manual steps.
 *
 * WHAT IT CANNOT DO
 * -----------------
 * Data Cloud records no author for UI edits, so a captured change can show WHAT
 * changed (the diff) and WHEN, but never WHO or WHY. That information was thrown
 * away by the UI and cannot be recovered by any tool. Changes made through Git
 * (the normal PR flow) DO carry who/why — this only backfills the ones that
 * didn't.
 *
 * HOW IT'S USED
 * -------------
 * Run by .github/workflows/capture.yml on a schedule. The workflow commits and
 * pushes whatever this script writes. Locally you can dry-run it too.
 *
 * USAGE
 *   SITEMAP_CDN_URL="https://cdn.c360a.salesforce.com/beacon/c360a/<id>/scripts/c360a.min.js" \
 *     node scripts/capture-live.mjs
 *
 * Env:
 *   SITEMAP_CDN_URL  (required) the beacon bundle URL
 *   LOCAL_SITEMAP    committed artifact to compare/update (default build/sitemap.js)
 *   SITEMAP_MARKER   boundary marker (default "// SITEMAP AND INIT")
 *   USER_AGENT       override request UA if the CDN is picky
 *
 * EXIT CODES
 *   0  no change (live already matches repo) OR change captured & written
 *   2  operational error (bad config, fetch failed, marker missing)
 *
 * OUTPUT
 *   Prints "CAPTURED_CHANGE=true" or "CAPTURED_CHANGE=false" on the last line so
 *   the workflow knows whether there's anything to commit.
 */

import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { DEFAULT_MARKER, extractSitemap, normalize, fetchBundle } from './lib/extract.mjs';

const CDN_URL = process.env.SITEMAP_CDN_URL;
const LOCAL_PATH = process.env.LOCAL_SITEMAP ?? 'build/sitemap.js';
const MARKER = process.env.SITEMAP_MARKER ?? DEFAULT_MARKER;
const USER_AGENT = process.env.USER_AGENT ?? 'datacloud-sitemap-capture/1.0';

const sha256 = (t) => createHash('sha256').update(t, 'utf8').digest('hex');

function fail(msg) {
  console.error(msg);
  console.log('CAPTURED_CHANGE=false');
  process.exit(2);
}

async function main() {
  if (!CDN_URL) fail('ERROR: SITEMAP_CDN_URL env var is required.');

  let bundle;
  try {
    bundle = await fetchBundle(CDN_URL, USER_AGENT);
  } catch (err) {
    fail(`ERROR: ${err.message}`);
  }

  const live = extractSitemap(bundle, MARKER);
  if (live === null) {
    fail(
      `ERROR: marker ${JSON.stringify(MARKER)} not found in CDN bundle ` +
        `(${bundle.length} bytes). Sitemap may not be deployed, or the marker changed.`,
    );
  }

  let localRaw = '';
  try {
    localRaw = await readFile(LOCAL_PATH, 'utf8');
  } catch {
    // No committed file yet — treat as first capture.
    localRaw = '';
  }

  if (localRaw && sha256(normalize(localRaw)) === sha256(normalize(live))) {
    console.log('✓ No change: live sitemap already matches the committed version.');
    console.log('CAPTURED_CHANGE=false');
    process.exit(0);
  }

  // Live differs (or nothing committed yet) → write the live version so the
  // workflow can commit it as a dated snapshot.
  await writeFile(LOCAL_PATH, live.endsWith('\n') ? live : live + '\n', 'utf8');
  console.log(`⬇ Captured live sitemap into ${LOCAL_PATH} (${live.length} bytes).`);
  console.log('   This reflects a change made directly in the Data Cloud UI.');
  console.log('CAPTURED_CHANGE=true');
  process.exit(0);
}

main().catch((err) => fail(`ERROR: unexpected failure: ${err.stack ?? err}`));

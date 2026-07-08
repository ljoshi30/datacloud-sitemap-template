#!/usr/bin/env node
/**
 * drift-check.mjs
 *
 * Detects whether the Web SDK sitemap currently live in Data Cloud has drifted
 * from the version committed to this repo.
 *
 * WHY THIS EXISTS
 * ---------------
 * Data Cloud provides NO supported API to read the Web SDK sitemap back out of
 * the website connector (verified against Metadata API, Connect REST API, and
 * the Data 360 API). But the saved sitemap IS observable: the c360a beacon CDN
 * serves it appended to the SDK bundle. This script fetches that artifact,
 * extracts just the sitemap portion, and diffs it against the Git source.
 *
 * CDN ARTIFACT SHAPE (verified against a live c360a beacon URL)
 * ------------------------------------------------------------
 * The file at .../scripts/c360a.min.js is TWO things concatenated:
 *   [ minified Salesforce SDK bundle ]  // interactions-bundle.min.js [x.y.z]
 *   // SITEMAP AND INIT                  <-- boundary marker
 *   [ YOUR sitemap source, unminified ]
 *
 * We compare ONLY the portion after the marker. Diffing the whole file would
 * false-positive on every Salesforce SDK version bump (the SDK half changes on
 * Salesforce's schedule, not yours). The marker string is configurable in case
 * Salesforce changes it.
 *
 * Because this is an UNDOCUMENTED artifact layout, treat it as best-effort
 * monitoring, not a guaranteed contract. If Salesforce ships a real read API,
 * swap out fetchLiveSitemap()/extractSitemap() and keep everything else.
 *
 * USAGE
 *   SITEMAP_CDN_URL="https://cdn.c360a.salesforce.com/beacon/c360a/<id>/scripts/c360a.min.js" \
 *     node scripts/drift-check.mjs
 *
 * Optional env:
 *   LOCAL_SITEMAP     path to the committed artifact (default: build/sitemap.js)
 *   SITEMAP_MARKER    boundary marker (default: "// SITEMAP AND INIT")
 *   ALERT_WEBHOOK     Slack/Teams incoming-webhook URL; posted to on drift
 *   USER_AGENT        override the request UA if the CDN is picky
 *   DUMP_LIVE         if set, write the extracted live sitemap here for inspection
 *
 * EXIT CODES
 *   0  live matches repo (no drift)
 *   1  drift detected (live differs from repo)
 *   2  operational error (bad config, fetch failed, missing file)
 *
 * The nonzero exit on drift is what fails your CI job / cron and triggers alerts.
 */

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { DEFAULT_MARKER, extractSitemap, normalize, fetchBundle } from './lib/extract.mjs';

const CDN_URL = process.env.SITEMAP_CDN_URL;
const LOCAL_PATH = process.env.LOCAL_SITEMAP ?? 'build/sitemap.js';
const MARKER = process.env.SITEMAP_MARKER ?? DEFAULT_MARKER;
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK;
const USER_AGENT = process.env.USER_AGENT ?? 'datacloud-sitemap-drift-check/1.0';
const DUMP_LIVE = process.env.DUMP_LIVE;

// extractSitemap() and normalize() are shared with capture-live.mjs — see
// scripts/lib/extract.mjs for the documented beacon-bundle handling.

function sha256(text) {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

async function fetchLiveSitemap(url) {
  return fetchBundle(url, USER_AGENT);
}

async function postAlert(message) {
  if (!ALERT_WEBHOOK) return;
  try {
    await fetch(ALERT_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: message }),
    });
  } catch (err) {
    console.error(`Failed to post alert: ${err.message}`);
  }
}

function fail(code, message) {
  console.error(message);
  process.exit(code);
}

async function main() {
  if (!CDN_URL) {
    fail(2, 'ERROR: SITEMAP_CDN_URL env var is required. See script header.');
  }

  // Fetch + extract the live sitemap first, so DUMP_LIVE (seeding/inspection)
  // works even before a local artifact exists.
  let bundle;
  try {
    bundle = await fetchLiveSitemap(CDN_URL);
  } catch (err) {
    fail(2, `ERROR: ${err.message}`);
  }

  const liveRaw = extractSitemap(bundle, MARKER);
  if (liveRaw === null) {
    fail(
      2,
      `ERROR: boundary marker ${JSON.stringify(MARKER)} not found in the CDN ` +
        `bundle (${bundle.length} bytes). The sitemap may be empty/not deployed, ` +
        `or Salesforce changed the marker. Set SITEMAP_MARKER to override.`,
    );
  }

  // Seed/inspect mode: write the extracted live sitemap and exit 0 without
  // requiring a committed artifact. Use this to bootstrap the repo.
  if (DUMP_LIVE) {
    const { writeFile } = await import('node:fs/promises');
    await writeFile(DUMP_LIVE, liveRaw, 'utf8');
    console.log(`Wrote extracted live sitemap (${liveRaw.length} bytes) to ${DUMP_LIVE}`);
    process.exit(0);
  }

  let localRaw;
  try {
    localRaw = await readFile(LOCAL_PATH, 'utf8');
  } catch (err) {
    fail(2, `ERROR: could not read local sitemap at "${LOCAL_PATH}": ${err.message}`);
  }

  const localNorm = normalize(localRaw);
  const liveNorm = normalize(liveRaw);
  const localHash = sha256(localNorm);
  const liveHash = sha256(liveNorm);

  console.log(`Local (${LOCAL_PATH}) sha256: ${localHash}`);
  console.log(`Live  (CDN)            sha256: ${liveHash}`);

  if (localHash === liveHash) {
    console.log('✓ No drift: live sitemap matches the committed version.');
    process.exit(0);
  }

  const alert =
    '⚠️ Data Cloud sitemap DRIFT detected.\n' +
    `The live sitemap served from the CDN no longer matches ${LOCAL_PATH} on main.\n` +
    'Someone likely edited the sitemap directly in the Data Cloud UI. ' +
    'Reconcile by re-deploying from Git or committing the intended change.';

  console.error(alert);
  await postAlert(alert);
  process.exit(1);
}

main().catch((err) => fail(2, `ERROR: unexpected failure: ${err.stack ?? err}`));

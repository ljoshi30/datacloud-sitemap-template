#!/usr/bin/env node
/**
 * drift-check.mjs — ALERT MODE
 *
 * Reads the sitemap currently live in Data Cloud via the official Connect API
 * and compares it to the committed build/sitemap.js. Exits nonzero (and can
 * alert) if they differ — i.e. someone edited the sitemap in the Data Cloud UI
 * instead of through Git.
 *
 * This uses the supported API (GET /ssot/connections/{id}/sitemap), not the old
 * CDN-scraping workaround. Clean JSON in, no marker/wrapper parsing.
 *
 * USAGE
 *   SF_INSTANCE_URL=... SF_ACCESS_TOKEN=... SF_CONNECTION_ID=... \
 *     node scripts/drift-check.mjs
 *
 * Env:
 *   SF_INSTANCE_URL, SF_ACCESS_TOKEN   (required — see lib/sfapi.mjs)
 *   SF_CONNECTION_ID                   (required) the StreamingApp connection ID
 *   SF_API_VERSION                     (optional, default v60.0)
 *   LOCAL_SITEMAP                      (optional, default build/sitemap.js)
 *   ALERT_WEBHOOK                      (optional) Slack/Teams webhook on drift
 *
 * EXIT CODES
 *   0  live matches repo (no drift)
 *   1  drift detected
 *   2  operational error (bad config, API failure, missing file)
 */

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getSitemap, normalize } from './lib/sfapi.mjs';

const CONNECTION_ID = process.env.SF_CONNECTION_ID;
const LOCAL_PATH = process.env.LOCAL_SITEMAP ?? 'build/sitemap.js';
const ALERT_WEBHOOK = process.env.ALERT_WEBHOOK;

const sha256 = (t) => createHash('sha256').update(t, 'utf8').digest('hex');

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
  if (!CONNECTION_ID) fail(2, 'ERROR: SF_CONNECTION_ID env var is required.');

  let localRaw;
  try {
    localRaw = await readFile(LOCAL_PATH, 'utf8');
  } catch (err) {
    fail(2, `ERROR: could not read local sitemap at "${LOCAL_PATH}": ${err.message}`);
  }

  let live;
  try {
    const res = await getSitemap(CONNECTION_ID);
    live = res.sitemap ?? '';
  } catch (err) {
    fail(2, `ERROR: ${err.message}`);
  }

  const localHash = sha256(normalize(localRaw));
  const liveHash = sha256(normalize(live));
  console.log(`Local (${LOCAL_PATH}) sha256: ${localHash}`);
  console.log(`Live  (Connect API)    sha256: ${liveHash}`);

  if (localHash === liveHash) {
    console.log('✓ No drift: live sitemap matches the committed version.');
    process.exit(0);
  }

  const alert =
    '⚠️ Data Cloud sitemap DRIFT detected.\n' +
    `The live sitemap (Connect API) no longer matches ${LOCAL_PATH} on main.\n` +
    'Someone likely edited the sitemap in the Data Cloud UI. Reconcile by ' +
    'redeploying from Git (npm run deploy) or committing the intended change.';
  console.error(alert);
  await postAlert(alert);
  process.exit(1);
}

main().catch((err) => fail(2, `ERROR: unexpected failure: ${err.stack ?? err}`));

#!/usr/bin/env node
/**
 * deploy.mjs — FULL AUTOMATION
 *
 * Deploys the committed build/sitemap.js to Data Cloud via the official Connect
 * API (PUT /ssot/connections/{id}/sitemap). This replaces the manual
 * copy-paste into the Data Cloud UI — a merge to main can now auto-deploy.
 *
 * Idempotent: reads the live sitemap first and skips the PUT if it already
 * matches, so re-runs are safe and quiet.
 *
 * USAGE
 *   SF_INSTANCE_URL=... SF_ACCESS_TOKEN=... SF_CONNECTION_ID=... \
 *     node scripts/deploy.mjs
 *
 * Env: same as drift-check.mjs (SF_INSTANCE_URL, SF_ACCESS_TOKEN,
 *      SF_CONNECTION_ID, optional SF_API_VERSION, LOCAL_SITEMAP).
 *
 * EXIT CODES
 *   0  deployed, or already in sync (no-op)
 *   2  operational error
 */

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { getSitemap, putSitemap, normalize } from './lib/sfapi.mjs';

const CONNECTION_ID = process.env.SF_CONNECTION_ID;
const LOCAL_PATH = process.env.LOCAL_SITEMAP ?? 'build/sitemap.js';

const sha256 = (t) => createHash('sha256').update(t, 'utf8').digest('hex');

function fail(message) {
  console.error(message);
  process.exit(2);
}

async function main() {
  if (!CONNECTION_ID) fail('ERROR: SF_CONNECTION_ID env var is required.');

  let localRaw;
  try {
    localRaw = await readFile(LOCAL_PATH, 'utf8');
  } catch (err) {
    fail(`ERROR: could not read local sitemap at "${LOCAL_PATH}": ${err.message}`);
  }

  // Idempotency check: don't PUT if live already matches.
  try {
    const { sitemap: live } = await getSitemap(CONNECTION_ID);
    if (sha256(normalize(live ?? '')) === sha256(normalize(localRaw))) {
      console.log('✓ Live sitemap already matches build/sitemap.js — nothing to deploy.');
      process.exit(0);
    }
  } catch (err) {
    // A read failure shouldn't block a deploy; log and continue to PUT.
    console.error(`Warning: could not read live sitemap before deploy: ${err.message}`);
  }

  try {
    await putSitemap(CONNECTION_ID, localRaw);
    console.log(`✓ Deployed ${LOCAL_PATH} (${localRaw.length} bytes) to connection ${CONNECTION_ID}.`);
    process.exit(0);
  } catch (err) {
    fail(`ERROR: deploy failed: ${err.message}`);
  }
}

main().catch((err) => fail(`ERROR: unexpected failure: ${err.stack ?? err}`));

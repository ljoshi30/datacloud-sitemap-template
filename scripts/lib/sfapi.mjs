/**
 * sfapi.mjs — Salesforce Data 360 Connect REST API client for the Web SDK sitemap.
 *
 * This replaces the old CDN-scraping approach. Salesforce provides official,
 * supported endpoints for the sitemap (available since API v60.0):
 *
 *   GET  /services/data/vXX.X/ssot/connections/{connectionId}/sitemap
 *        -> { "sitemap": "<js>", "sitemapPath": "<url>" }   (read)
 *
 *   PUT  /services/data/vXX.X/ssot/connections/{connectionId}/sitemap
 *        body: { "sitemap": "<js>" }                         (deploy/upsert)
 *
 * List connections (to discover a connectionId) — StreamingApp = the Web SDK app:
 *   GET  /services/data/vXX.X/ssot/connections?connectorType=StreamingApp
 *        -> { connections: [ { id, label, sourceId, streamingAppType, ... } ] }
 *
 * AUTH (env vars, set as CI secrets):
 *   SF_INSTANCE_URL   e.g. https://storm-xxxx.my.salesforce.com   (no trailing slash)
 *   SF_ACCESS_TOKEN   a valid OAuth/session bearer token
 *   SF_API_VERSION    optional, default v60.0
 *
 * Get a token locally with the Salesforce CLI:
 *   sf org display --json         # accessToken + instanceUrl
 * In CI, use the JWT Bearer flow (sf org login jwt) so no human is in the loop.
 */

const INSTANCE_URL = (process.env.SF_INSTANCE_URL || '').replace(/\/+$/, '');
const ACCESS_TOKEN = process.env.SF_ACCESS_TOKEN || '';
const API_VERSION = process.env.SF_API_VERSION || 'v60.0';

export function assertAuth() {
  const missing = [];
  if (!INSTANCE_URL) missing.push('SF_INSTANCE_URL');
  if (!ACCESS_TOKEN) missing.push('SF_ACCESS_TOKEN');
  if (missing.length) {
    throw new Error(
      `Missing required env var(s): ${missing.join(', ')}. ` +
        `Set them (locally: sf org display --json; in CI: repo secrets).`,
    );
  }
}

function base() {
  return `${INSTANCE_URL}/services/data/${API_VERSION}/ssot`;
}

async function call(method, path, body) {
  assertAuth();
  const res = await fetch(`${base()}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${path} -> HTTP ${res.status}: ${text.slice(0, 500)}`);
  }
  return text ? JSON.parse(text) : {};
}

/** List StreamingApp (Web SDK) connections. Returns the connections array. */
export async function listWebSdkConnections() {
  const data = await call('GET', '/connections?connectorType=StreamingApp');
  return data.connections || [];
}

/** Read the sitemap for a connection. Returns { sitemap, sitemapPath }. */
export async function getSitemap(connectionId) {
  return call('GET', `/connections/${connectionId}/sitemap`);
}

/** Deploy (upsert) the sitemap for a connection. Returns { sitemap, sitemapPath }. */
export async function putSitemap(connectionId, sitemap) {
  return call('PUT', `/connections/${connectionId}/sitemap`, { sitemap });
}

/**
 * Normalize before comparison so cosmetic differences (whitespace/comments the
 * platform may reformat) don't register as drift. Heuristic, not a JS parser.
 */
export function normalize(source) {
  return String(source)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

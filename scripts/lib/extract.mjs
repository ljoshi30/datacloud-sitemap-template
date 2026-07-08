/**
 * Shared logic for pulling the customer sitemap out of the c360a beacon bundle.
 * Used by both drift-check.mjs (alert mode) and capture-live.mjs (auto-capture
 * mode) so the extraction/normalization stays identical between them.
 */

export const DEFAULT_MARKER = '// SITEMAP AND INIT';

/**
 * Extract just the customer sitemap from the concatenated CDN bundle.
 *
 * The bundle is:  [ minified SDK ] + MARKER + [ beacon-wrapped sitemap ].
 * The beacon WRAPS the uploaded file:
 *
 *   // SITEMAP AND INIT
 *   try {
 *     (function () {
 *         <-- your uploaded sitemap.js (re-indented) -->
 *     })()
 *   } catch (e) { console.error("[Salesforce Data Cloud] Error loading sitemap:", e); }
 *
 * We strip the marker + try/IIFE prefix and the })()/catch suffix so the result
 * equals what was uploaded. Returns null if the marker is absent (SDK-only
 * bundle, sitemap not deployed, or Salesforce changed the marker).
 */
export function extractSitemap(bundle, marker = DEFAULT_MARKER) {
  const idx = bundle.indexOf(marker);
  if (idx === -1) return null;
  let body = bundle.slice(idx + marker.length);

  const prefix = /^\s*try\s*\{\s*\(function\s*\(\)\s*\{/;
  const m = body.match(prefix);
  if (m) {
    body = body.slice(m[0].length);
    const suffix = body.lastIndexOf('})()');
    if (suffix !== -1) body = body.slice(0, suffix);
  }
  return body.trim();
}

/**
 * Normalize before comparison: strip comments, collapse whitespace. This is why
 * the beacon re-indenting your code never registers as a change. Heuristic, not
 * a JS parser.
 */
export function normalize(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchBundle(url, userAgent = 'datacloud-sitemap-tools/1.0') {
  const res = await fetch(url, {
    headers: { 'User-Agent': userAgent, 'Cache-Control': 'no-cache' },
    redirect: 'follow',
  });
  if (!res.ok) {
    throw new Error(`CDN fetch failed: HTTP ${res.status} ${res.statusText}`);
  }
  return res.text();
}

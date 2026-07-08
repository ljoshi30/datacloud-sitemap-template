# Data Cloud Web SDK Sitemap — Template Repo

Version control, review, validation, and **drift detection** for the Data Cloud
Web SDK sitemap (`sitemap.js`).

## Why this exists

The Data Cloud website connector stores the Web SDK sitemap only in its UI. There
is **no version history, no author/change tracking, and no rollback** — and after
checking the Metadata API, Connect REST API, and Data 360 API, **there is no
supported API to deploy or read the sitemap.** The only interaction is manual
`Upload | Replace Sitemap`, which silently overwrites.

This repo makes **Git the source of truth**. The copy in Data Cloud is treated as
a deployment artifact that is never edited directly. That gives you:

| Missing today | Provided by this repo |
|---|---|
| Who/what/when/why changed | `git blame`, PR author + reviewers, PR template |
| Change approval | Pull requests + CODEOWNERS required review |
| Versioning + rollback | Git tags/commits; revert = redeploy an older commit |
| Diffs before go-live | PR diff of `build/sitemap.js` |
| Catching out-of-band UI edits | Scheduled **drift check** vs. the live CDN |

## Layout

```
src/
  sitemap.js          entry module (init + wiring) — built LAST
  pageTypes/*.js      one file per page type
  shared/*.js         reusable helpers (consider publishing as internal npm pkg)
build/
  sitemap.js          GENERATED, COMMITTED artifact you paste into Data Cloud
scripts/
  build.mjs           bundles src/ -> build/sitemap.js (deterministic)
  validate.mjs        structural check before upload
  drift-check.mjs     fetches live CDN sitemap, diffs vs build/sitemap.js
.github/
  workflows/ci.yml    build + validate + "artifact is committed" gate on PRs
  workflows/drift.yml scheduled drift check
  CODEOWNERS          required reviewers
  PULL_REQUEST_TEMPLATE.md
```

## Everyday workflow

1. Edit the sitemap under `src/`.
2. `npm run build` → regenerates `build/sitemap.js`.
3. `npm run validate` → structural sanity check.
4. Commit both `src/` and `build/sitemap.js`, open a PR. CI enforces that the
   committed artifact matches the source, and CODEOWNERS enforces review.
5. After merge, **deploy manually**: in Data Cloud Setup → Websites & Mobile Apps
   → your website → Sitemap → `Upload | Replace Sitemap` → paste
   `build/sitemap.js` → review → Save.
6. Confirm the drift check passes.

> **The one rule:** never edit the sitemap in the Data Cloud UI. Edit in Git,
> then deploy. UI edits break the audit trail and trigger drift alerts.

## Deployment (manual — there is no API)

No push API exists. A human pastes `build/sitemap.js` into the connector. Tag the
commit you deploy so rollback is unambiguous:

```bash
git tag -a deploy-2026-07-08 -m "Deployed to <website connector name>"
git push --tags
```

## Rollback

1. `git checkout <previous tag>` (or `git revert`).
2. `npm run build`.
3. Paste `build/sitemap.js` via `Upload | Replace Sitemap`.
4. Re-run the drift check to confirm.

## Drift detection

Because deploy is manual, someone *can* still edit in the UI. There is no read API
either — but the saved sitemap is served over the **c360a beacon CDN** appended to
the SDK bundle, so we fetch that, extract the sitemap portion, and diff it.

**Find your CDN URL (from Data Cloud Setup):**
1. Go to **Data Cloud Setup** and search for **Website and Mobile App Connections**.
2. Open the relevant connection.
3. Find the **Integration Guide** section and copy the script code / CDN script.

The URL you want looks like:
```
https://cdn.c360a.salesforce.com/beacon/c360a/<beacon-id>/scripts/c360a.min.js
```

### What that file actually contains

It is **two things concatenated**, and your part is **wrapped** by the beacon:
```
[ minified Salesforce SDK bundle ]   // interactions-bundle.min.js [x.y.z]  (~400KB, Salesforce owns this)
// SITEMAP AND INIT                   <-- boundary marker
try {
  (function () {
      <-- YOUR uploaded sitemap.js goes here (re-indented) -->  (~23KB, you own this)
  })()
} catch (e) { console.error("[Salesforce Data Cloud] Error loading sitemap:", e); }
```

You commit the file you **upload** (no wrapper). So `drift-check.mjs`:
1. slices from the `// SITEMAP AND INIT` marker (ignores the ~400KB SDK — no
   false positives on Salesforce SDK version bumps), then
2. **strips the beacon's `try { (function(){ ... })() } catch` wrapper**, leaving
   exactly what you uploaded, then
3. normalizes whitespace/comments and hashes.

Verified against a live beacon **and a real uploaded sitemap**: committed-vs-live
matches (no drift), a one-character edit is caught as drift, an SDK version bump
alone is not, and the beacon's added wrapper does not cause a false positive.

**Run locally:**
```bash
SITEMAP_CDN_URL="https://cdn.c360a.salesforce.com/beacon/c360a/<id>/scripts/c360a.min.js" \
  npm run drift-check
```
Exit `0` = in sync, `1` = drift (live differs from repo), `2` = config/fetch/marker error.

Override the marker if Salesforce ever changes it: `SITEMAP_MARKER="..."`.
Dump the extracted live sitemap for inspection: `DUMP_LIVE=/tmp/live.js`.

### Seeding the repo from what's already deployed

Because the CDN serves your sitemap unminified, you don't have to re-author it —
extract the currently-live version as your first commit:
```bash
SITEMAP_CDN_URL="...c360a.min.js" DUMP_LIVE=build/sitemap.js \
  node scripts/drift-check.mjs   # seed mode: writes build/sitemap.js and exits 0
```
Then split `build/sitemap.js` back into `src/` modules and rebuild.

**Run on a schedule:** `.github/workflows/drift.yml` runs daily. Set repo secrets
`SITEMAP_CDN_URL` and (optionally) `ALERT_WEBHOOK` for Slack/Teams alerts.

## Two ways to handle direct (UI) edits — pick one

People *can* edit the sitemap directly in the Data Cloud UI (it's faster — events
flow instantly). There's no API to prevent it. You choose how the automation
reacts when it detects a live version that doesn't match Git:

| Mode | Workflow | On a direct UI edit… |
|---|---|---|
| **Alert** | `drift.yml` | Fails the job + Slack alert. You reconcile manually. Use when the rule is "Git only, no exceptions." |
| **Auto-capture** | `capture.yml` | **Automatically commits the live version to Git** as a dated snapshot (`capture-YYYY-MM-DD`). Zero effort; you always keep history + backup + diff. |

Most teams enable **auto-capture** — it means you get versioning no matter how
people work. Enable one workflow (delete or disable the other) so they don't both
act on the same change.

### What auto-capture can and cannot record

- ✅ **WHAT** changed (the commit diff) and **WHEN** — always.
- ❌ **WHO** and **WHY** — *not for UI edits*. Data Cloud doesn't record the author
  of a UI edit, so no tool can recover it. The capture commit is attributed to a
  bot and labelled as an out-of-band change.
- Changes made through the normal **PR flow** carry full who/why/review — this
  only backfills the ones that bypassed Git.

Recommended pattern: iterate fast directly in Data Cloud when experimenting
(auto-capture keeps you safe), but make permanent/important changes through a PR
so the who/why/review is on record.

### Caveats (important)

- The CDN URL is an **undocumented endpoint** — best-effort monitoring, not a
  guaranteed contract. If Salesforce ships a real read API, swap out
  `fetchLiveSitemap()` in `drift-check.mjs` and keep everything else.
- The served file may be **minified/wrapped**. `drift-check.mjs` normalizes
  whitespace/comments to reduce false positives; if your setup transforms the file
  further, minify identically in `build.mjs` or compare a canonical artifact on
  both sides.
- The URL may carry a cache-busting hash or require site context — confirm it's
  fetchable standalone before relying on the scheduled job.

## Reusing across every project

- Use this repo as a **GitHub template** (or scaffold via `degit`) so each
  website/data space gets the same structure, validation, PR gates, and runbook.
- Publish `src/shared/` as an **internal npm package** so identity/consent/
  page-detection improvements propagate to all projects.

## Long-term fix

File a Salesforce Idea for a native Web SDK sitemap **metadata type / deploy +
read API and version history**. The sitemap is the only part of the website
connector with no API — this repo is the bridge until they close that gap.

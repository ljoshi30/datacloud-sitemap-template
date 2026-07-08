# Data Cloud Web SDK Sitemap — Template Repo

Version control, review, validation, **drift detection**, and **automated
deployment** for the Data Cloud Web SDK sitemap (`sitemap.js`), using the
official Data 360 Connect REST API.

> **Setting this up for a new project?** See **[SETUP.md](SETUP.md)** for the
> step-by-step checklist.

## Why this exists

The Data Cloud website connector's UI gives you **no version history, no
author/change tracking, and no rollback** for the Web SDK sitemap. This repo
makes **Git the source of truth** and uses the Connect API to read and deploy
the sitemap programmatically. That gives you:

| Missing in the UI | Provided by this repo |
|---|---|
| Who/what/when/why changed | `git blame`, PR author + reviewers, PR template |
| Change approval | Pull requests + CODEOWNERS required review |
| Versioning + rollback | Git tags/commits; revert = redeploy an older commit |
| Diffs before go-live | PR diff of `build/sitemap.js` |
| Catching out-of-band UI edits | Scheduled **drift check** via the API |
| Deploy without copy-paste | **`npm run deploy`** via the API (PUT) |

## The Connect API (this is the key)

Salesforce provides official, supported endpoints for the sitemap (API v60.0+):

```
GET  /services/data/vXX.X/ssot/connections?connectorType=StreamingApp   # list Web SDK apps
GET  /services/data/vXX.X/ssot/connections/{connectionId}/sitemap       # read  -> {sitemap, sitemapPath}
PUT  /services/data/vXX.X/ssot/connections/{connectionId}/sitemap       # deploy  body {sitemap}
```

The Web SDK app is connector type **`StreamingApp`** (`streamingAppType: WEBAPP`).
No CDN scraping, no manual paste — clean JSON in and out.

## Auth (set as repo secrets / local env)

| Var | What |
|---|---|
| `SF_INSTANCE_URL` | e.g. `https://YOURDOMAIN.my.salesforce.com` (no trailing slash) |
| `SF_ACCESS_TOKEN` | OAuth/session bearer token |
| `SF_CONNECTION_ID` | the StreamingApp connection ID (see below) |
| `SF_API_VERSION` | optional, default `v60.0` |

**Local token:** `sf org display --json` prints `accessToken` + `instanceUrl`.
**CI token:** use the JWT Bearer flow (`sf org login jwt`) so no human-copied
token is needed — hand-copied tokens expire in hours.

**Find your `SF_CONNECTION_ID`:**
```bash
curl -H "Authorization: Bearer $SF_ACCESS_TOKEN" \
  "$SF_INSTANCE_URL/services/data/v60.0/ssot/connections?connectorType=StreamingApp"
# copy the "id" of the connection whose "label"/"sourceId" matches your site
```

## Layout

```
src/
  sitemap.js          entry module (init + wiring) — built LAST
  pageTypes/*.js      one file per page type
  shared/*.js         reusable helpers (consider publishing as internal npm pkg)
build/
  sitemap.js          GENERATED, COMMITTED artifact — deployed via the API
scripts/
  lib/sfapi.mjs       Connect API client (list/get/put sitemap + normalize)
  build.mjs           bundles src/ -> build/sitemap.js (deterministic)
  validate.mjs        structural check before deploy
  drift-check.mjs     reads live sitemap via API, diffs vs build/sitemap.js
  deploy.mjs          deploys build/sitemap.js via API (idempotent)
  capture-live.mjs    captures a UI edit back into Git (auto-capture mode)
.github/workflows/
  ci.yml              build + validate + "artifact is committed" gate on PRs
  deploy.yml          deploy to Data Cloud on merge to main
  capture.yml         daily auto-capture of out-of-band UI edits
```

## Everyday workflow

1. Edit the sitemap under `src/`.
2. `npm run build` → regenerates `build/sitemap.js`.
3. `npm run validate` → structural sanity check.
4. Commit both `src/` and `build/sitemap.js`, open a PR. CI enforces the
   committed artifact matches the source; CODEOWNERS enforces review.
5. **Merge to main → `deploy.yml` auto-deploys** to Data Cloud via the API.
   (Or run `npm run deploy` locally.)
6. `capture.yml` confirms daily that live still matches Git.

> **The one rule:** edit in Git, let CI deploy. If someone edits in the Data
> Cloud UI directly, auto-capture backs it up — but WHO/WHY is lost (see below).

## Deploy

```bash
SF_INSTANCE_URL=... SF_ACCESS_TOKEN=... SF_CONNECTION_ID=... npm run deploy
```
Idempotent: reads the live sitemap first and skips the PUT if it already
matches. Tag the commit you deploy for unambiguous rollback:
```bash
git tag -a deploy-2026-07-08 -m "Deployed to <connection label>"
git push --tags
```

## Rollback

```bash
git checkout <previous tag> -- build/sitemap.js
SF_INSTANCE_URL=... SF_ACCESS_TOKEN=... SF_CONNECTION_ID=... npm run deploy
```

## Drift detection

```bash
SF_INSTANCE_URL=... SF_ACCESS_TOKEN=... SF_CONNECTION_ID=... npm run drift-check
```
Exit `0` = in sync, `1` = drift (live differs from repo), `2` = config/API error.
Optional `ALERT_WEBHOOK` posts a Slack/Teams message on drift.

## Handling direct (UI) edits

People *can* still edit in the Data Cloud UI. Two workflows cover this — enable
whichever fits (or both; `deploy` and `capture` don't conflict since deploy runs
on push and capture runs on a schedule):

| Workflow | On a direct UI edit… |
|---|---|
| `capture.yml` (auto-capture) | **Commits the live version to Git** as a dated snapshot (`capture-YYYY-MM-DD`). Zero effort; you always keep history + backup + diff. |
| `drift-check` (alert only) | Fails + optional Slack alert; you reconcile by hand. |

### What auto-capture can and cannot record

- ✅ **WHAT** changed (the commit diff) and **WHEN** — always.
- ❌ **WHO** and **WHY** — *not for UI edits*. Data Cloud doesn't record the
  author of a UI edit, so no tool can recover it. The capture commit is
  attributed to a bot and labelled as an out-of-band change.
- Changes made through the **PR flow** carry full who/why/review.

Recommended: experiment fast in the UI (auto-capture keeps you safe), but make
permanent changes through a PR so the who/why/review is on record.

## Seeding the repo from what's already deployed

You don't have to re-author the sitemap — pull the currently-live version:
```bash
curl -H "Authorization: Bearer $SF_ACCESS_TOKEN" \
  "$SF_INSTANCE_URL/services/data/v60.0/ssot/connections/$SF_CONNECTION_ID/sitemap" \
  | python3 -c "import sys,json; open('build/sitemap.js','w').write(json.load(sys.stdin)['sitemap'])"
git add build/sitemap.js && git commit -m "Seed baseline sitemap as deployed"
```

## Reusing across every project

- Use this repo as a **GitHub template** so each website/data space gets the
  same structure, validation, PR gates, and runbook.
- Publish `src/shared/` as an **internal npm package** so common improvements
  propagate everywhere.

# Setting Up This Repo for a New Project

Follow this once per website/data space. It takes ~30 minutes and needs no
coding. At the end, the project has automatic version history, backup,
rollback, and daily auto-capture of any direct Data Cloud edits.

There are two phases: **(A)** make a copy of the template, then **(B)** point it
at the new project's Data Cloud.

---

## Phase A — Create the new project's repo

### Option 1 — "Use this template" (easiest)

1. One-time on the template repo: **Settings → General → tick "Template
   repository"**.
2. For each new project: open the template repo → click the green **Use this
   template** → **Create a new repository** → name it (e.g.
   `acme-store-sitemap`) → **Create repository**.

You now have a full copy with all scripts and workflows.

### Option 2 — Manual copy

1. Create a new empty repo at **https://github.com/new** (e.g.
   `acme-store-sitemap`). Don't add a README/.gitignore.
2. Download the template as a ZIP (green **Code** button → **Download ZIP**),
   unzip it, and push its contents to the new repo. (Ask if you want the exact
   git commands.)

---

## Phase B — Point it at the new project's Data Cloud

### Step 1 — Get the project's CDN URL

1. Go to **Data Cloud Setup** and search for **Website and Mobile App
   Connections**.
2. Open the relevant connection.
3. Find the **Integration Guide** section and copy the script code / CDN script.

The URL you want looks like this (note: each project has a **different beacon
ID**):
```
https://cdn.c360a.salesforce.com/beacon/c360a/<beacon-id>/scripts/c360a.min.js
```

### Step 2 — Seed the baseline from what's already live

On your computer (needs Node.js 18+ and the repo cloned locally), from the
project folder, run **once** to pull the current live sitemap into the repo:

```bash
SITEMAP_CDN_URL="<the project's c360a.min.js URL>" \
  DUMP_LIVE=build/sitemap.js node scripts/drift-check.mjs
```

Then commit and push it:

```bash
git add build/sitemap.js
git commit -m "Seed baseline sitemap as deployed"
git push
```

### Step 3 — Add the CDN URL as a repo secret

So the daily auto-capture job knows which URL to check:

1. New repo → **Settings → Secrets and variables → Actions → New repository
   secret**.
2. **Name:** `SITEMAP_CDN_URL`
3. **Value:** the project's `c360a.min.js` URL.
4. **Add secret**.

> Optional: add a second secret `ALERT_WEBHOOK` (a Slack/Teams incoming webhook)
> if you want alerts.

### Step 4 — Set the reviewers

Edit `.github/CODEOWNERS` and replace `@your-org/data-cloud-team` with the real
team handle that should review this project's sitemap changes.

---

## Checklist

| Step | Where | How often |
|---|---|---|
| Copy template → new repo | GitHub (browser) | once per project |
| Get CDN URL (Integration Guide) | Data Cloud Setup | once per project |
| Seed baseline | Your computer (terminal) | once per project |
| Add `SITEMAP_CDN_URL` secret | GitHub Settings | once per project |
| Set CODEOWNERS reviewers | Edit the file | once per project |

---

## Verify it works

1. New repo → **Actions** tab → **sitemap-auto-capture** → **Run workflow**.
2. Since the live sitemap now matches Git, it should report **"Live sitemap
   matches Git — nothing to capture."**
3. To prove capture works: make a tiny edit directly in Data Cloud, wait a
   minute, run the workflow again. It should create a commit named
   **"Auto-capture: live sitemap changed on \<date\>"**. Open it to see the diff.

---

## How you'll use it day to day

- **See what changed** → repo **Commits** page → click any commit for the diff.
- **Current version** → `build/sitemap.js` on the `main` branch.
- **Roll back to an old version** → open the old commit → open `build/sitemap.js`
  → **Raw** → copy → paste into Data Cloud (Sitemap → Upload | Replace Sitemap).

For the full explanation, see [README.md](README.md).

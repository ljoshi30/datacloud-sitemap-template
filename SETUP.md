# Setting Up This Repo for a New Project

Follow this once per website/data space. It takes ~30 minutes and needs no
coding. At the end, the project has automatic version history, backup,
rollback, and daily auto-capture of any direct Data Cloud edits.

There are two phases: **(A)** make a copy of the template, then **(B)** point it
at the new project's Data Cloud.

> **Fast path:** if you have the template cloned locally, the helper script does
> the local steps (copy + seed from the API + first commit) for you:
> ```bash
> SF_ACCESS_TOKEN=... ./scripts/setup-new-project.sh \
>   <project-name> <instance-url> <connection-id> <github-user>
> ```
> It then prints the remaining browser steps (create repo, push, add secrets).
> The manual steps below are the same thing done by hand.

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

### Step 1 — Get the connection ID

The Web SDK app is connector type `StreamingApp`. Get a token
(`sf org display --json` → `accessToken` + `instanceUrl`), then list connections:

```bash
curl -H "Authorization: Bearer $SF_ACCESS_TOKEN" \
  "$SF_INSTANCE_URL/services/data/v60.0/ssot/connections?connectorType=StreamingApp"
```
Copy the `id` of the connection whose `label`/`sourceId` matches your site — that
is your `SF_CONNECTION_ID`.

### Step 2 — Seed the baseline from what's already live

Pull the current live sitemap into the repo (via the Connect API):

```bash
curl -H "Authorization: Bearer $SF_ACCESS_TOKEN" \
  "$SF_INSTANCE_URL/services/data/v60.0/ssot/connections/$SF_CONNECTION_ID/sitemap" \
  | python3 -c "import sys,json; open('build/sitemap.js','w').write(json.load(sys.stdin)['sitemap'])"

git add build/sitemap.js
git commit -m "Seed baseline sitemap as deployed"
git push
```

### Step 3 — Add repo secrets

New repo → **Settings → Secrets and variables → Actions → New repository
secret**. Add:

| Name | Value |
|---|---|
| `SF_INSTANCE_URL` | `https://YOURDOMAIN.my.salesforce.com` |
| `SF_CONNECTION_ID` | the connection ID from Step 1 |
| `SF_ACCESS_TOKEN` | a token — use the **JWT Bearer flow** for CI (hand-copied tokens expire) |

> Optional: `ALERT_WEBHOOK` (Slack/Teams incoming webhook) for drift alerts.

### Step 4 — Set the reviewers

Edit `.github/CODEOWNERS` and replace `@your-org/data-cloud-team` with the real
team handle that should review this project's sitemap changes.

---

## Checklist

| Step | Where | How often |
|---|---|---|
| Copy template → new repo | GitHub (browser) | once per project |
| Get connection ID | terminal (Connect API) | once per project |
| Seed baseline | terminal | once per project |
| Add `SF_*` secrets | GitHub Settings | once per project |
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
- **Deploy a change** → merge to main (auto-deploys) or `npm run deploy`.
- **Roll back** → `git checkout <tag> -- build/sitemap.js` then `npm run deploy`.

For the full explanation, see [README.md](README.md).

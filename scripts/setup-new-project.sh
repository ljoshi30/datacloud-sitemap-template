#!/usr/bin/env bash
#
# setup-new-project.sh — scaffold a new project's sitemap repo from this template.
#
# Automates the local steps: copy the template, start a fresh git history, seed
# the baseline from the live Data Cloud sitemap (via the Connect API), and make
# the first commit. The GitHub browser steps (create empty repo, add secrets)
# are printed for you to do.
#
# USAGE
#   SF_ACCESS_TOKEN=... ./scripts/setup-new-project.sh <project-name> <instance-url> <connection-id> [github-user]
#
# EXAMPLE
#   SF_ACCESS_TOKEN="00D..." ./scripts/setup-new-project.sh \
#     acme-store-sitemap https://acme.my.salesforce.com 1WMxxxxxxxxxxxxxxx ljoshi30
#
# Run from INSIDE a checkout of the template repo (so scripts/ exists).

set -euo pipefail

if [ -t 1 ]; then B="\033[1m"; G="\033[32m"; Y="\033[33m"; R="\033[31m"; N="\033[0m"; else B=""; G=""; Y=""; R=""; N=""; fi
say()  { printf "%b\n" "${B}$*${N}"; }
ok()   { printf "%b\n" "${G}✓ $*${N}"; }
warn() { printf "%b\n" "${Y}! $*${N}"; }
die()  { printf "%b\n" "${R}✗ $*${N}" >&2; exit 1; }

PROJECT="${1:-}"
INSTANCE_URL="${2:-}"
CONNECTION_ID="${3:-}"
GH_USER="${4:-}"
API_VERSION="${SF_API_VERSION:-v60.0}"

if [ -z "$PROJECT" ] || [ -z "$INSTANCE_URL" ] || [ -z "$CONNECTION_ID" ]; then
  die "Usage: SF_ACCESS_TOKEN=... ./scripts/setup-new-project.sh <project-name> <instance-url> <connection-id> [github-user]"
fi
[ -n "${SF_ACCESS_TOKEN:-}" ] || die "SF_ACCESS_TOKEN env var is required (sf org display --json)."

command -v git  >/dev/null 2>&1 || die "git is not installed."
command -v curl >/dev/null 2>&1 || die "curl is not installed."
[ -f scripts/deploy.mjs ] || die "Run this from inside a template checkout (scripts/deploy.mjs not found)."

INSTANCE_URL="${INSTANCE_URL%/}"   # strip trailing slash
DEST="../$PROJECT"
[ -e "$DEST" ] && die "Destination $DEST already exists. Pick another name or remove it."

say "== 1/4  Copying template into $DEST"
mkdir -p "$DEST"
tar --exclude='./.git' --exclude='./node_modules' --exclude='.DS_Store' -cf - . | (cd "$DEST" && tar -xf -)
ok "Template copied."

cd "$DEST"

say "== 2/4  Starting a fresh git history"
git init -q
git branch -M main
ok "New git history created."

say "== 3/4  Seeding baseline from the live sitemap (Connect API)"
URL="$INSTANCE_URL/services/data/$API_VERSION/ssot/connections/$CONNECTION_ID/sitemap"
HTTP=$(curl -sS -o /tmp/setup_sitemap.json -w "%{http_code}" \
  -H "Authorization: Bearer $SF_ACCESS_TOKEN" -H "Accept: application/json" "$URL")
[ "$HTTP" = "200" ] || die "Sitemap read failed (HTTP $HTTP). Check instance URL, token, and connection ID."
python3 -c "import json; open('build/sitemap.js','w').write(json.load(open('/tmp/setup_sitemap.json'))['sitemap'])" \
  || die "Could not parse sitemap from API response."
rm -f /tmp/setup_sitemap.json
ok "Wrote build/sitemap.js ($(wc -c < build/sitemap.js) bytes)."

say "== 4/4  First commit"
git add -A
git -c commit.gpgsign=false commit -q -m "Seed baseline sitemap as deployed"
ok "First commit created."

say "== Next steps (do these in your browser) ==============================="
REMOTE_HINT="https://github.com/<your-user>/$PROJECT.git"
[ -n "$GH_USER" ] && REMOTE_HINT="https://github.com/$GH_USER/$PROJECT.git"
cat <<EOF

  a) Create an EMPTY repo on GitHub (no README/.gitignore):
       https://github.com/new   ->  name it: $PROJECT

  b) Connect and push:
       git remote add origin $REMOTE_HINT
       git push -u origin main

  c) Add repo secrets (Settings -> Secrets and variables -> Actions):
       SF_INSTANCE_URL   = $INSTANCE_URL
       SF_CONNECTION_ID  = $CONNECTION_ID
       SF_ACCESS_TOKEN   = <token; use JWT flow for CI, see README>

  d) Set reviewers: edit .github/CODEOWNERS -> replace @your-org/data-cloud-team

  e) Test: repo -> Actions -> sitemap-auto-capture -> Run workflow
       (should say "Live sitemap matches Git — nothing to capture")

EOF
ok "Local setup done. You're in: $(pwd)"

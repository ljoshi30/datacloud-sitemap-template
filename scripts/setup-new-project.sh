#!/usr/bin/env bash
#
# setup-new-project.sh — scaffold a new project's sitemap repo from this template.
#
# Automates the local steps: copy the template, start a fresh git history, seed
# the baseline from the live Data Cloud sitemap, and make the first commit.
# The GitHub browser steps (create empty repo, add secret, set reviewers) are
# printed for you to do — they can't be automated without extra credentials.
#
# USAGE
#   ./scripts/setup-new-project.sh <project-name> <cdn-url> [github-user]
#
# EXAMPLE
#   ./scripts/setup-new-project.sh acme-store-sitemap \
#     "https://cdn.c360a.salesforce.com/beacon/c360a/XXXX/scripts/c360a.min.js" \
#     ljoshi30
#
# Run it from INSIDE a checkout of the template repo (so scripts/ exists).

set -euo pipefail

# ---- colours (fall back to plain if not a terminal) ----
if [ -t 1 ]; then B="\033[1m"; G="\033[32m"; Y="\033[33m"; R="\033[31m"; N="\033[0m"; else B=""; G=""; Y=""; R=""; N=""; fi
say()  { printf "%b\n" "${B}$*${N}"; }
ok()   { printf "%b\n" "${G}✓ $*${N}"; }
warn() { printf "%b\n" "${Y}! $*${N}"; }
die()  { printf "%b\n" "${R}✗ $*${N}" >&2; exit 1; }

# ---- args ----
PROJECT="${1:-}"
CDN_URL="${2:-}"
GH_USER="${3:-}"

if [ -z "$PROJECT" ] || [ -z "$CDN_URL" ]; then
  die "Usage: ./scripts/setup-new-project.sh <project-name> <cdn-url> [github-user]"
fi

# ---- prerequisite checks ----
command -v git  >/dev/null 2>&1 || die "git is not installed."
command -v node >/dev/null 2>&1 || die "Node.js is not installed. Install with: brew install node"
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[ "$NODE_MAJOR" -ge 18 ] || die "Node.js 18+ required (found $(node --version))."
[ -f scripts/drift-check.mjs ] || die "Run this from inside a template checkout (scripts/drift-check.mjs not found)."

# Basic sanity on the CDN URL so we fail early on an obvious paste error.
case "$CDN_URL" in
  https://*c360a.min.js) : ;;
  *) warn "CDN URL doesn't look like a c360a.min.js URL. Continuing anyway." ;;
esac

DEST="../$PROJECT"
[ -e "$DEST" ] && die "Destination $DEST already exists. Pick another name or remove it."

say "== 1/5  Copying template into $DEST"
# Copy everything except this repo's git history.
mkdir -p "$DEST"
# Use tar to copy while excluding .git and node_modules.
tar --exclude='./.git' --exclude='./node_modules' --exclude='.DS_Store' -cf - . | (cd "$DEST" && tar -xf -)
ok "Template copied."

cd "$DEST"

say "== 2/5  Starting a fresh git history for this project"
git init -q
git branch -M main
ok "New empty git history created."

say "== 3/5  Seeding the baseline from the LIVE Data Cloud sitemap"
if SITEMAP_CDN_URL="$CDN_URL" DUMP_LIVE=build/sitemap.js node scripts/drift-check.mjs; then
  ok "Live sitemap captured into build/sitemap.js"
else
  die "Could not fetch/extract the live sitemap. Double-check the CDN URL."
fi

say "== 4/5  Making the first commit"
git add -A
git -c commit.gpgsign=false commit -q -m "Seed baseline sitemap as deployed"
ok "First commit created."

say "== 5/5  Next steps (do these in your browser) ============================"
REMOTE_HINT="https://github.com/<your-user>/$PROJECT.git"
if [ -n "$GH_USER" ]; then REMOTE_HINT="https://github.com/$GH_USER/$PROJECT.git"; fi
cat <<EOF

  a) Create an EMPTY repo on GitHub (no README/.gitignore):
       https://github.com/new   ->  name it: $PROJECT

  b) Connect and push (run these here):
       git remote add origin $REMOTE_HINT
       git push -u origin main

  c) Add the CDN secret so the daily job works:
       repo -> Settings -> Secrets and variables -> Actions -> New repository secret
       Name:  SITEMAP_CDN_URL
       Value: $CDN_URL

  d) Set reviewers: edit .github/CODEOWNERS -> replace @your-org/data-cloud-team

  e) Test: repo -> Actions -> sitemap-auto-capture -> Run workflow
       (should say "Live sitemap matches Git — nothing to capture")

EOF
ok "Local setup done. You're in: $(pwd)"

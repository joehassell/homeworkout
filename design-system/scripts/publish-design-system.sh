#!/usr/bin/env bash
# publish-design-system.sh
#
# One-shot script to publish THIS folder as a GitHub repo.
# Run it from inside the design-system folder.
#
# Requires: git + GitHub CLI (`gh`). Install gh:
#   macOS:  brew install gh
#   Linux:  https://cli.github.com/
#
# Usage:
#   bash scripts/publish-design-system.sh <repo-name>
#   e.g.  bash scripts/publish-design-system.sh simpleworkoutgen-design-system

set -euo pipefail

REPO_NAME="${1:-simpleworkoutgen-design-system}"

# Sanity checks
command -v git >/dev/null || { echo "❌ git not installed"; exit 1; }
command -v gh  >/dev/null || { echo "❌ GitHub CLI (gh) not installed. brew install gh"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "❌ gh not authenticated. Run: gh auth login"; exit 1; }

# Move to the design-system root (parent of scripts/)
cd "$(dirname "$0")/.."

# Init repo if needed
if [ ! -d .git ]; then
  echo "→ git init"
  git init -b main
fi

git add .
git commit -m "Initial design system: tokens, components, watch + yoga surfaces" || echo "(nothing to commit)"

# Create the repo on GitHub and push
echo "→ Creating GitHub repo $REPO_NAME (public)…"
gh repo create "$REPO_NAME" --public --source=. --remote=origin --push

# Enable GitHub Pages from main branch root
echo "→ Enabling GitHub Pages…"
USER=$(gh api user --jq .login)
gh api -X POST "repos/$USER/$REPO_NAME/pages" \
  -f "source[branch]=main" -f "source[path]=/" >/dev/null 2>&1 || \
  echo "(Pages may already be enabled — check Settings → Pages)"

echo ""
echo "✅ Done!"
echo "   Repo:    https://github.com/$USER/$REPO_NAME"
echo "   Pages:   https://$USER.github.io/$REPO_NAME/  (takes ~30s to go live)"
echo "   Tokens:  https://raw.githubusercontent.com/$USER/$REPO_NAME/main/colors_and_type.css"

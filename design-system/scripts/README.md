# Scripts

Two one-shot scripts to set everything up with zero manual work.

## 1. Publish the design system

```bash
bash scripts/publish-design-system.sh simpleworkoutgen-design-system
```

What it does:
1. `git init` (if needed) and commits everything in this folder
2. Creates a public GitHub repo via `gh`
3. Pushes
4. Enables GitHub Pages from `main` branch root

**Requires:** [`gh`](https://cli.github.com/) installed and authenticated (`gh auth login`).

## 2. Wire your app to use the tokens

```bash
# Preview what would change first (recommended):
bash scripts/wire-up-app.sh ~/code/homeworkout <gh-user> simpleworkoutgen-design-system --dry-run

# Apply for real:
bash scripts/wire-up-app.sh ~/code/homeworkout <gh-user> simpleworkoutgen-design-system
```

What it does:
1. Fetches `colors_and_type.css` from your published design-system repo
2. **Sanity-checks** the fetched tokens contain the canonical names (`--bg`, `--accent`, `--text`, `--surface`) — aborts if not
3. **Locates the first `<style>` block** in `index.html` — aborts if none
4. **Balanced-brace parses** every `:root { ... }` and `[data-theme="..."] { ... }` block inside it; strips only blocks that contain ≥3 canonical token names (so it won't touch unrelated `:root` rules)
5. Injects `<link rel="stylesheet" href="css/tokens.css">` before `</head>`
6. Backs up the **pre-patch** `index.html` from `git HEAD` → `index.html.bak`
7. Commits

`--dry-run` (or `-n`) prints a unified diff and exits without touching anything.

**Requires:** Python 3 (preinstalled on macOS/most Linux). No external Python packages.

## Run order

```bash
# Step 1 — from inside the design-system folder:
bash scripts/publish-design-system.sh

# Step 2 — from anywhere, point at your app:
bash scripts/wire-up-app.sh ~/code/homeworkout your-github-handle
```

That's it. Your app now consumes tokens from the design system. To update tokens later, edit `colors_and_type.css` here, push, and re-run step 2's first command (`curl ...`) in your app.

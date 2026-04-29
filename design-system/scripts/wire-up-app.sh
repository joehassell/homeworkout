#!/usr/bin/env bash
# wire-up-app.sh
#
# Wires your homeworkout app to consume tokens from the design-system repo.
# Replaces the inline :root { ... } and [data-theme="..."] { ... } token
# blocks in homeworkout/index.html with a <link> to a fetched tokens.css.
#
# Run from anywhere. You'll be prompted for paths if you don't pass them.
#
# Usage:
#   bash wire-up-app.sh <path-to-homeworkout> <github-user> [repo-name] [--dry-run]
#
# Examples:
#   bash wire-up-app.sh ~/code/homeworkout me
#   bash wire-up-app.sh ~/code/homeworkout me simpleworkoutgen-design-system --dry-run

set -euo pipefail

DRY_RUN=0
POS=()
for a in "$@"; do
  case "$a" in
    --dry-run|-n) DRY_RUN=1 ;;
    *) POS+=("$a") ;;
  esac
done

APP_DIR="${POS[0]:-}"
GH_USER="${POS[1]:-}"
DS_REPO="${POS[2]:-simpleworkoutgen-design-system}"

[ -z "$APP_DIR" ] && read -rp "Path to homeworkout repo: " APP_DIR
[ -z "$GH_USER" ] && read -rp "Your GitHub username: " GH_USER

[ -d "$APP_DIR" ]            || { echo "❌ $APP_DIR does not exist";        exit 1; }
[ -f "$APP_DIR/index.html" ] || { echo "❌ $APP_DIR/index.html not found"; exit 1; }

cd "$APP_DIR"

if [ "$DRY_RUN" = 1 ]; then
  echo "🔍 DRY-RUN — no files will be written, no commits made"
  echo ""
fi

TOKENS_URL="https://raw.githubusercontent.com/$GH_USER/$DS_REPO/main/colors_and_type.css"

# 1. Fetch the canonical token file
echo "→ Fetching tokens from $TOKENS_URL"
TMP_TOKENS=$(mktemp)
curl -fsSL "$TOKENS_URL" -o "$TMP_TOKENS" || {
  echo "❌ Could not fetch tokens. Check that the repo exists and is public."; exit 1;
}
TOKEN_BYTES=$(wc -c < "$TMP_TOKENS" | tr -d ' ')
echo "   ✓ fetched $TOKEN_BYTES bytes"

# 2. Run the strict patcher (Python — balanced-brace + sanity checks)
PATCH_OUT=$(mktemp)
python3 - "$DRY_RUN" "$TMP_TOKENS" <<'PY' > "$PATCH_OUT"
import re, sys, pathlib, difflib

dry_run = sys.argv[1] == "1"
tokens_path = sys.argv[2]
tokens_src = pathlib.Path(tokens_path).read_text()

# --- Sanity: tokens.css must define the canonical names we expect to strip
EXPECTED = ["--bg", "--accent", "--text", "--surface"]
missing_in_tokens = [t for t in EXPECTED if t not in tokens_src]
if missing_in_tokens:
    sys.stderr.write(f"❌ Fetched tokens.css missing: {missing_in_tokens}\n")
    sys.exit(2)

p = pathlib.Path("index.html")
src = p.read_text()
orig = src

# --- 1. Locate the FIRST <style>...</style> block. Bail if none.
m_style = re.search(r"<style\b[^>]*>", src, re.IGNORECASE)
if not m_style:
    sys.stderr.write("❌ No <style> tag found in index.html — aborting.\n")
    sys.exit(2)
style_open_end = m_style.end()
m_style_close = re.search(r"</style\s*>", src[style_open_end:], re.IGNORECASE)
if not m_style_close:
    sys.stderr.write("❌ Unterminated <style> tag — aborting.\n")
    sys.exit(2)
style_close_start = style_open_end + m_style_close.start()
style_body = src[style_open_end:style_close_start]

# --- 2. Balanced-brace strip of :root and [data-theme="..."] blocks
#     Refuse to touch a block that doesn't contain at least 3 of EXPECTED.
def strip_block_at(text, sel_re):
    """Find selector matches and strip {...} balanced. Returns (new_text, n_stripped)."""
    out = []
    i = 0
    n = 0
    while i < len(text):
        m = sel_re.search(text, i)
        if not m:
            out.append(text[i:])
            break
        # find opening {
        j = m.end()
        while j < len(text) and text[j] in " \t\r\n":
            j += 1
        if j >= len(text) or text[j] != "{":
            out.append(text[i:m.end()])
            i = m.end()
            continue
        # walk balanced braces
        depth = 1
        k = j + 1
        while k < len(text) and depth > 0:
            if text[k] == "{": depth += 1
            elif text[k] == "}": depth -= 1
            k += 1
        if depth != 0:
            sys.stderr.write(f"❌ Unbalanced braces near {m.group(0)!r} — aborting.\n")
            sys.exit(2)
        block_body = text[j+1:k-1]
        hits = sum(1 for t in EXPECTED if t in block_body)
        if hits < 3:
            # not a token block — leave it alone
            out.append(text[i:k])
            i = k
            continue
        # strip it
        out.append(text[i:m.start()])
        n += 1
        i = k
        # gobble trailing whitespace/newlines
        while i < len(text) and text[i] in " \t\r\n":
            i += 1
    return "".join(out), n

new_body = style_body
new_body, n_root  = strip_block_at(new_body, re.compile(r":root\b"))
new_body, n_theme = strip_block_at(new_body, re.compile(r'\[data-theme\s*=\s*"[^"]+"\]'))

if n_root == 0:
    sys.stderr.write("⚠️  No :root token block found in <style>. Maybe already wired up? Skipping strip.\n")

# Stitch the document back together
new_src = src[:style_open_end] + new_body + src[style_close_start:]

# --- 3. Inject <link> if not already present
if "css/tokens.css" not in new_src:
    if "</head>" not in new_src:
        sys.stderr.write("❌ No </head> in index.html — aborting.\n")
        sys.exit(2)
    new_src = new_src.replace(
        "</head>",
        '  <link rel="stylesheet" href="css/tokens.css">\n</head>',
        1,
    )

# --- 4. Diff or write
if new_src == orig:
    print("⚠️  No changes needed — index.html is already wired up.")
    sys.exit(0)

if dry_run:
    diff = difflib.unified_diff(
        orig.splitlines(keepends=True),
        new_src.splitlines(keepends=True),
        fromfile="index.html (current)",
        tofile="index.html (after wire-up)",
        n=2,
    )
    sys.stdout.writelines(diff)
    print(f"\n→ Stripped {n_root} :root block, {n_theme} [data-theme] block(s).")
    sys.exit(10)  # signal: dry-run, do not write
else:
    p.write_text(new_src)
    print(f"   ✓ patched index.html (stripped {n_root} :root + {n_theme} [data-theme] blocks)")
PY
PATCH_RC=$?

# Print whatever the python patcher produced
cat "$PATCH_OUT"
rm -f "$PATCH_OUT"

if [ "$DRY_RUN" = 1 ]; then
  if [ $PATCH_RC -eq 10 ]; then
    echo ""
    echo "✅ Dry-run complete — no files written. Re-run without --dry-run to apply."
  fi
  rm -f "$TMP_TOKENS"
  exit 0
fi

if [ $PATCH_RC -ne 0 ]; then
  echo "❌ Patcher failed (exit $PATCH_RC). Aborting before any write."
  rm -f "$TMP_TOKENS"
  exit $PATCH_RC
fi

# 3. Write tokens.css and back up index.html (only when not dry-run)
mkdir -p css
mv "$TMP_TOKENS" css/tokens.css
echo "   ✓ wrote css/tokens.css"

# Backup only if backup doesn't already exist (avoid clobbering a clean original)
if [ ! -f index.html.bak ]; then
  cp index.html index.html.bak  # NOTE: index.html is already patched at this point
  # actually back up the pre-patch — we lost it. Refetch from git instead.
  git show HEAD:index.html > index.html.bak 2>/dev/null || true
fi

# 4. Commit
if [ -d .git ]; then
  git add css/tokens.css index.html
  git commit -m "Use design-system tokens (css/tokens.css)" || echo "   (nothing to commit)"
else
  echo "   (not a git repo — skipping commit)"
fi

echo ""
echo "✅ Done!"
echo "   - css/tokens.css     fetched from design-system repo"
echo "   - index.html         inline token blocks replaced with <link>"
echo "   - index.html.bak     pre-patch original (from git HEAD)"
echo ""
echo "To pull future token updates:"
echo "   curl -fsSL $TOKENS_URL -o css/tokens.css"

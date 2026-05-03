#!/usr/bin/env bash
# scripts/release.sh — automated App Store release pipeline for SimpleWorkoutGen
#
# USAGE
#   ./scripts/release.sh [command] [flags]
#
# COMMANDS
#   release      (default) full pipeline: bump build, archive, upload, submit
#   setup        first-time setup: install gems + configure App Store Connect API key
#   preflight    run all checks without doing anything destructive
#   bump         bump versions in pbxproj only (no build, no upload)
#   metadata     sync description/screenshots to App Store Connect (no new build)
#   dry-run      full pipeline minus actual archive/upload/submit
#   help         show this help
#
# FLAGS
#   --version=X.Y.Z      set marketing version explicitly
#   --minor              bump marketing minor version (1.0.0 -> 1.1.0)
#   --major              bump marketing major version (1.0.0 -> 2.0.0)
#   --whats-new "..."    override "What's New" release notes
#   --allow-dirty        skip the clean-working-tree check
#   --skip-build         reuse the existing IPA in build/ instead of rebuilding
#   --skip-upload        archive only, do not upload to App Store Connect
#   --skip-submit        upload but do not submit for review
#   --auto-release       auto-release after Apple approves (default: manual release)
#   --no-tag             do not create or push a git tag on success
#
# EXAMPLES
#   ./scripts/release.sh setup                        # one-time
#   ./scripts/release.sh release                      # bump build, ship
#   ./scripts/release.sh release --minor              # 1.0.0 -> 1.1.0, ship
#   ./scripts/release.sh release --version=2.0.0      # set explicitly, ship
#   ./scripts/release.sh metadata                     # description-only update
#   ./scripts/release.sh dry-run                      # rehearse with no upload

set -euo pipefail
trap 'rc=$?; if [[ $rc -ne 0 ]]; then err "Script failed at line $LINENO (exit $rc)"; fi' EXIT

# ============================================================================
# Constants
# ============================================================================

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
readonly REPO_ROOT
readonly XCODE_PROJ="$REPO_ROOT/ios/App/App.xcodeproj"
readonly PBXPROJ="$XCODE_PROJ/project.pbxproj"
readonly LISTING_MD="$REPO_ROOT/docs/APP_STORE_LISTING.md"
readonly SCREENSHOT_SRC="$REPO_ROOT/screenshots"
readonly METADATA_DIR="$REPO_ROOT/fastlane/metadata/en-US"
readonly REVIEW_DIR="$METADATA_DIR/review_information"
readonly SCREENSHOT_DIR="$REPO_ROOT/fastlane/screenshots/en-US"
readonly BUILD_DIR="$REPO_ROOT/build"
readonly ASC_CONFIG_DIR="$HOME/.appstoreconnect"
readonly ASC_CONFIG_FILE="$ASC_CONFIG_DIR/config.json"

# Colors (only when stdout is a terminal)
if [[ -t 1 ]]; then
  RED=$'\e[31m'; GREEN=$'\e[32m'; YELLOW=$'\e[33m'; BLUE=$'\e[34m'; BOLD=$'\e[1m'; RESET=$'\e[0m'
else
  RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; RESET=''
fi

# Flag state
COMMAND="release"
FLAG_VERSION=""
FLAG_BUMP=""        # "" | "minor" | "major"
FLAG_WHATS_NEW=""
FLAG_ALLOW_DIRTY=0
FLAG_SKIP_BUILD=0
FLAG_SKIP_UPLOAD=0
FLAG_SKIP_SUBMIT=0
FLAG_AUTO_RELEASE=0
FLAG_NO_TAG=0
FLAG_DRY_RUN=0

# ============================================================================
# Output helpers
# ============================================================================

info() { printf '%s[info]%s %s\n' "$BLUE" "$RESET" "$*"; }
ok()   { printf '%s[ ok ]%s %s\n' "$GREEN" "$RESET" "$*"; }
warn() { printf '%s[warn]%s %s\n' "$YELLOW" "$RESET" "$*"; }
err()  { printf '%s[err ]%s %s\n' "$RED"   "$RESET" "$*" >&2; }
die()  { err "$*"; exit 1; }
step() { printf '\n%s%s━━ %s ━━%s\n' "$BOLD" "$BLUE" "$*" "$RESET"; }

# ============================================================================
# Argument parsing
# ============================================================================

usage() {
  awk '/^set -euo/ { exit } NR > 1 && /^#/ { sub(/^# ?/, ""); print }' "$0"
  exit 0
}

parse_args() {
  local seen_cmd=0
  while [[ $# -gt 0 ]]; do
    case "$1" in
      release|setup|preflight|bump|metadata|help)
        if [[ $seen_cmd -eq 0 ]]; then
          COMMAND="$1"
          seen_cmd=1
        fi
        [[ "$1" == "help" ]] && usage
        ;;
      dry-run)
        if [[ $seen_cmd -eq 0 ]]; then
          COMMAND="release"
          seen_cmd=1
        fi
        FLAG_DRY_RUN=1
        ;;
      --version=*)    FLAG_VERSION="${1#--version=}" ;;
      --minor)        FLAG_BUMP="minor" ;;
      --major)        FLAG_BUMP="major" ;;
      --whats-new)    shift; FLAG_WHATS_NEW="${1:-}" ;;
      --whats-new=*)  FLAG_WHATS_NEW="${1#--whats-new=}" ;;
      --allow-dirty)  FLAG_ALLOW_DIRTY=1 ;;
      --skip-build)   FLAG_SKIP_BUILD=1 ;;
      --skip-upload)  FLAG_SKIP_UPLOAD=1 ;;
      --skip-submit)  FLAG_SKIP_SUBMIT=1 ;;
      --auto-release) FLAG_AUTO_RELEASE=1 ;;
      --no-tag)       FLAG_NO_TAG=1 ;;
      --dry-run)      FLAG_DRY_RUN=1 ;;
      -h|--help)      usage ;;
      *)              die "Unknown argument: $1 (try: ./scripts/release.sh help)" ;;
    esac
    shift
  done
}

# ============================================================================
# Preflight
# ============================================================================

preflight() {
  step "Preflight checks"

  cd "$REPO_ROOT"

  # 1. Required tools
  for cmd in git xcodebuild xcrun npm bundle ruby awk sed; do
    command -v "$cmd" >/dev/null 2>&1 || die "Required tool not found: $cmd"
  done
  ok "Required tools present"

  # 2. On main? warn (not fatal — release branches may differ)
  local current_branch
  current_branch=$(git rev-parse --abbrev-ref HEAD)
  if [[ "$current_branch" == "main" ]]; then
    ok "On main branch"
  else
    warn "Not on main (branch: $current_branch)"
  fi

  # 3. Working tree clean
  if git diff-index --quiet HEAD -- 2>/dev/null; then
    ok "Working tree clean"
  else
    if [[ $FLAG_ALLOW_DIRTY -eq 1 ]]; then
      warn "Working tree dirty (--allow-dirty set)"
    else
      git status --short >&2
      die "Working tree dirty. Commit/stash first or pass --allow-dirty"
    fi
  fi

  # 4. Up to date with origin
  if git rev-parse --verify '@{u}' >/dev/null 2>&1; then
    git fetch --quiet origin || warn "git fetch failed (offline?)"
    local local_sha upstream_sha
    local_sha=$(git rev-parse HEAD)
    upstream_sha=$(git rev-parse '@{u}')
    if [[ "$local_sha" == "$upstream_sha" ]]; then
      ok "Up to date with upstream"
    else
      warn "HEAD differs from upstream — you may be ahead/behind"
    fi
  else
    warn "No upstream branch configured"
  fi

  # 5. Xcode + signing
  local xcode_ver
  xcode_ver=$(xcodebuild -version 2>/dev/null | head -1 || true)
  ok "$xcode_ver"

  if security find-identity -v -p codesigning 2>/dev/null | grep -q "Apple Distribution"; then
    ok "Apple Distribution code signing identity present"
  else
    die "No 'Apple Distribution' code signing identity in keychain. Open Xcode and let it download/install via Manage Certificates."
  fi

  # 6. App Store Connect API key
  if [[ -f "$ASC_CONFIG_FILE" ]]; then
    if python3 -c "import json,sys; json.load(open('$ASC_CONFIG_FILE'))" >/dev/null 2>&1; then
      local key_path
      key_path=$(python3 -c "import json,os; print(os.path.expanduser(json.load(open('$ASC_CONFIG_FILE'))['key_filepath']))")
      [[ -f "$key_path" ]] || die "API key file referenced by config does not exist: $key_path"
      ok "App Store Connect API key configured"
    else
      die "ASC config is not valid JSON: $ASC_CONFIG_FILE"
    fi
  else
    die "App Store Connect API key not configured. Run: ./scripts/release.sh setup"
  fi

  # 7. Bundler / Fastlane
  if [[ ! -f "$REPO_ROOT/Gemfile.lock" ]]; then
    warn "Gemfile.lock missing — running bundle install"
    bundle install
  elif ! bundle check >/dev/null 2>&1; then
    warn "Gem dependencies stale — running bundle install"
    bundle install
  fi
  ok "Fastlane available via bundler"

  # 8. App Store listing source
  [[ -f "$LISTING_MD" ]] || die "Missing App Store listing source: $LISTING_MD"
  ok "App Store listing source: $LISTING_MD"

  # 9. node_modules ready
  if [[ ! -d "$REPO_ROOT/node_modules" ]]; then
    warn "node_modules missing — running npm install"
    npm install --silent
  fi
  ok "Node dependencies installed"
}

# ============================================================================
# Setup (first-time)
# ============================================================================

cmd_setup() {
  step "First-time setup"
  cd "$REPO_ROOT"

  if [[ ! -f Gemfile ]]; then
    die "Gemfile missing at repo root — was this script copied without supporting files?"
  fi

  info "Installing fastlane and xcodeproj gems via bundler..."
  bundle install
  ok "Gems installed"

  mkdir -p "$ASC_CONFIG_DIR"
  chmod 700 "$ASC_CONFIG_DIR"

  if [[ -f "$ASC_CONFIG_FILE" ]]; then
    warn "Existing ASC config at $ASC_CONFIG_FILE"
    read -r -p "Overwrite? [y/N] " yn
    if ! [[ "$yn" =~ ^[Yy]$ ]]; then
      info "Keeping existing config"
      return 0
    fi
  fi

  cat <<EOF

To authenticate without your Apple ID + 2FA, you need an App Store Connect API key.

  1. Open ${BOLD}https://appstoreconnect.apple.com/access/integrations/api${RESET}
  2. Click "+" to generate a key (or "Generate API Key" the first time).
  3. Name it (e.g. "homeworkout-release"); access role: ${BOLD}App Manager${RESET}.
  4. Click Generate, then ${BOLD}download the .p8 file${RESET}.
     Apple shows it once — if you lose it, you must regenerate.
  5. Note the Key ID (10 chars next to the key) and the Issuer ID (UUID at
     the top of the API Keys page).

EOF

  local p8_path key_id issuer_id
  read -r -p "Path to the downloaded .p8 file: " p8_path
  p8_path="${p8_path/#\~/$HOME}"
  [[ -f "$p8_path" ]] || die "File not found: $p8_path"

  read -r -p "Key ID (10 uppercase alphanumeric chars): " key_id
  if ! [[ "$key_id" =~ ^[A-Z0-9]{10}$ ]]; then
    die "Key ID must be 10 uppercase alphanumeric characters"
  fi

  read -r -p "Issuer ID (UUID): " issuer_id
  if ! [[ "$issuer_id" =~ ^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$ ]]; then
    die "Issuer ID must be a UUID (lowercase hex with dashes)"
  fi

  local stored_key="$ASC_CONFIG_DIR/AuthKey_${key_id}.p8"
  cp "$p8_path" "$stored_key"
  chmod 600 "$stored_key"

  cat > "$ASC_CONFIG_FILE" <<JSON
{
  "key_id": "$key_id",
  "issuer_id": "$issuer_id",
  "key_filepath": "$stored_key"
}
JSON
  chmod 600 "$ASC_CONFIG_FILE"
  ok "Config saved to $ASC_CONFIG_FILE"

  info "Verifying the API key..."
  if bundle exec fastlane test_auth >/dev/null 2>&1; then
    ok "API key authenticated successfully"
  else
    warn "API key test failed — re-run \`bundle exec fastlane test_auth\` for details"
  fi

  cat <<EOF

${GREEN}${BOLD}Setup complete.${RESET}

Next steps:
  ${BOLD}./scripts/release.sh preflight${RESET}   verify everything
  ${BOLD}./scripts/release.sh dry-run${RESET}     full pipeline rehearsal (no upload)
  ${BOLD}./scripts/release.sh release${RESET}     ship a new build to review

EOF
}

# ============================================================================
# Versioning (pbxproj manipulation)
# ============================================================================

read_marketing_version() {
  grep -m1 "MARKETING_VERSION = " "$PBXPROJ" \
    | sed -E 's/.*MARKETING_VERSION = ([^;]+);.*/\1/' \
    | tr -d ' "'
}

read_build_number() {
  # Numerically max all CURRENT_PROJECT_VERSION values to handle any drift
  grep "CURRENT_PROJECT_VERSION = " "$PBXPROJ" \
    | sed -E 's/.*CURRENT_PROJECT_VERSION = ([^;]+);.*/\1/' \
    | tr -d ' "' \
    | sort -n \
    | tail -1
}

bump_marketing() {
  local current="$1" type="$2"
  local IFS=.
  read -ra parts <<< "$current"
  local maj="${parts[0]:-1}" min="${parts[1]:-0}" patch="${parts[2]:-0}"
  case "$type" in
    major) maj=$((maj + 1)); min=0; patch=0 ;;
    minor) min=$((min + 1)); patch=0 ;;
    *)     patch=$((patch + 1)) ;;
  esac
  printf '%d.%d.%d' "$maj" "$min" "$patch"
}

apply_versions() {
  local marketing="$1" build="$2"
  cd "$REPO_ROOT"

  info "Setting MARKETING_VERSION = $marketing across all targets/configs"
  sed -i '' "s/MARKETING_VERSION = [^;]*;/MARKETING_VERSION = $marketing;/g" "$PBXPROJ"

  info "Setting CURRENT_PROJECT_VERSION = $build across all targets/configs"
  sed -i '' "s/CURRENT_PROJECT_VERSION = [^;]*;/CURRENT_PROJECT_VERSION = $build;/g" "$PBXPROJ"

  ok "Version bumped: $marketing ($build)"
}

# ============================================================================
# Web build + Capacitor sync
# ============================================================================

build_web() {
  step "Build web bundle and sync into Xcode project"
  cd "$REPO_ROOT"
  npm run build:web
  npx cap sync ios
  ok "Web bundle synced"
}

# ============================================================================
# App Store metadata sync (markdown -> fastlane/metadata)
# ============================================================================

# Extract a `## Heading` section from APP_STORE_LISTING.md, trimming
# leading/trailing blank lines.
md_section() {
  local heading="$1"
  awk -v target="$heading" '
    BEGIN { active = 0 }
    /^## / {
      if (active) { exit }
      h = $0; sub(/^## /, "", h); sub(/[[:space:]]+$/, "", h)
      if (tolower(h) == tolower(target)) { active = 1; next }
    }
    active { print }
  ' "$LISTING_MD" \
    | awk 'BEGIN{started=0} { if (!started && $0 ~ /^[[:space:]]*$/) next; started=1; lines[NR]=$0 } END { for(i=1;i<=NR;i++) if(lines[i]!="") last=i; for(i=1;i<=last;i++) if(lines[i]!="" || (i>1 && lines[i-1]!="")) print lines[i] }'
}

# Pull a single value from the `## URLs` table, given a label like "Support URL"
md_url() {
  local label="$1"
  awk -v label="$label" '
    /^## URLs/    { in_section = 1; next }
    /^## /        { in_section = 0 }
    in_section && index($0, label) {
      n = split($0, parts, "|")
      if (n >= 4) {
        url = parts[3]
        gsub(/^[[:space:]]+|[[:space:]]+$/, "", url)
        print url
        exit
      }
    }
  ' "$LISTING_MD"
}

sync_metadata() {
  step "Sync App Store metadata from $(basename "$LISTING_MD")"

  rm -rf "$METADATA_DIR" "$SCREENSHOT_DIR"
  mkdir -p "$METADATA_DIR" "$REVIEW_DIR" "$SCREENSHOT_DIR"

  md_section "App Name"         > "$METADATA_DIR/name.txt"
  md_section "Subtitle"         > "$METADATA_DIR/subtitle.txt"
  md_section "Promotional Text" > "$METADATA_DIR/promotional_text.txt"
  md_section "Description"      > "$METADATA_DIR/description.txt"
  md_section "Keywords"         > "$METADATA_DIR/keywords.txt"

  md_url "Support URL"        > "$METADATA_DIR/support_url.txt"
  md_url "Privacy Policy URL" > "$METADATA_DIR/privacy_url.txt"
  : > "$METADATA_DIR/marketing_url.txt"

  printf 'Copyright © %s Joe Hassell. All rights reserved.\n' "$(date +%Y)" \
    > "$METADATA_DIR/copyright.txt"

  # Categories: deliver expects keys in App Store Connect's enum format
  printf 'HEALTH_AND_FITNESS\n' > "$METADATA_DIR/primary_category.txt"
  : > "$METADATA_DIR/secondary_category.txt"
  : > "$METADATA_DIR/primary_first_sub_category.txt"
  : > "$METADATA_DIR/primary_second_sub_category.txt"
  : > "$METADATA_DIR/secondary_first_sub_category.txt"
  : > "$METADATA_DIR/secondary_second_sub_category.txt"

  # Review information — values that don't change between releases
  cat > "$REVIEW_DIR/notes.txt" <<'EOF'
SimpleWorkoutGen stores all data locally and requires no account or login.
The reviewer can use the app immediately:

1. Tap any workout type, duration, intensity, and equipment.
2. Tap "Generate Workout" then "Start" to run the guided timer.
3. (Optional) Settings → enable Apple Health to test HealthKit; the app saves
   completed workouts and reads body weight + heart rate. Permission prompts
   appear on first use.
4. Apple Watch: paired watch shows live exercise/timer/heart rate while a
   workout runs on iPhone.

No login, no demo account, no in-app purchases.
EOF

  printf 'Joe\n'              > "$REVIEW_DIR/first_name.txt"
  printf 'Hassell\n'          > "$REVIEW_DIR/last_name.txt"
  printf 'joehassell@icloud.com\n' > "$REVIEW_DIR/email_address.txt"
  : > "$REVIEW_DIR/phone_number.txt"   # optional; deliver fills with ASC value
  : > "$REVIEW_DIR/demo_user.txt"
  : > "$REVIEW_DIR/demo_password.txt"

  ok "Metadata written to fastlane/metadata/en-US/"

  # Screenshots — copy from the canonical directory; deliver determines device
  # family from image dimensions, so filename only needs to be unique.
  if [[ -d "$SCREENSHOT_SRC" ]]; then
    local count=0
    shopt -s nullglob
    for f in "$SCREENSHOT_SRC"/*.png; do
      cp "$f" "$SCREENSHOT_DIR/$(basename "$f")"
      count=$((count + 1))
    done
    shopt -u nullglob
    if [[ $count -eq 0 ]]; then
      warn "No PNGs found in $SCREENSHOT_SRC"
    else
      ok "Copied $count screenshot(s) to fastlane/screenshots/en-US/"
    fi
  else
    warn "Screenshots directory missing: $SCREENSHOT_SRC"
  fi
}

# ============================================================================
# Release notes ("What's New")
# ============================================================================

generate_whats_new() {
  step "Generate \"What's New\" release notes"

  local notes_file="$METADATA_DIR/release_notes.txt"
  mkdir -p "$METADATA_DIR"

  if [[ -n "$FLAG_WHATS_NEW" ]]; then
    printf '%s\n' "$FLAG_WHATS_NEW" > "$notes_file"
    ok "Release notes from --whats-new flag"
    sed 's/^/    /' "$notes_file"
    return
  fi

  cd "$REPO_ROOT"

  local last_tag
  last_tag=$(git tag -l 'v*' --sort=-v:refname | head -1 || true)

  local raw
  if [[ -z "$last_tag" ]]; then
    info "No previous v* tag — using last 15 commits"
    raw=$(git log --pretty=format:'%s' -15 HEAD)
  else
    info "Diffing against last tag: $last_tag"
    raw=$(git log --pretty=format:'%s' "$last_tag..HEAD")
  fi

  local notes
  notes=$(printf '%s\n' "$raw" \
    | grep -Ev '^(Merge|Revert|chore|ci|test|style|build|release)(\(|:)' \
    | grep -Ev '^docs(\(|:)' \
    | sed -E 's/^(feat|fix|perf|improve|refactor)(\([^)]*\))?:[[:space:]]*//' \
    | awk 'NF { sub(/\.$/, ""); printf("• %s\n", $0) }' \
    | head -10 || true)

  if [[ -z "$notes" ]]; then
    warn "No notable commits since last release — using a generic note"
    notes="• Bug fixes and improvements"
  fi

  printf '%s\n' "$notes" > "$notes_file"
  ok "Release notes:"
  sed 's/^/    /' "$notes_file"
}

# ============================================================================
# Git tagging
# ============================================================================

tag_release() {
  if [[ $FLAG_NO_TAG -eq 1 ]]; then
    info "Skipping git tag (--no-tag)"
    return
  fi

  local marketing="$1" build="$2"
  local tag="v${marketing}+${build}"

  cd "$REPO_ROOT"

  if git rev-parse "$tag" >/dev/null 2>&1; then
    warn "Tag $tag already exists — not retagging"
    return
  fi

  if ! git diff-index --quiet HEAD -- "$PBXPROJ" 2>/dev/null; then
    git add "$PBXPROJ"
    git commit -m "release: $tag"
    ok "Committed version bump"
  fi

  git tag -a "$tag" -m "Release $marketing build $build"
  ok "Tagged $tag"

  if git rev-parse --verify '@{u}' >/dev/null 2>&1; then
    info "Pushing commit + tag to origin..."
    git push origin HEAD --follow-tags
    ok "Pushed"
  else
    warn "No upstream — push manually: git push origin HEAD --follow-tags"
  fi
}

# ============================================================================
# Sub-commands
# ============================================================================

cmd_release() {
  preflight

  step "Determine new versions"
  local cur_marketing cur_build new_marketing new_build
  cur_marketing=$(read_marketing_version)
  cur_build=$(read_build_number)
  info "Current pbxproj: $cur_marketing (build $cur_build)"

  if [[ -n "$FLAG_VERSION" ]]; then
    new_marketing="$FLAG_VERSION"
  elif [[ -n "$FLAG_BUMP" ]]; then
    new_marketing=$(bump_marketing "$cur_marketing" "$FLAG_BUMP")
  else
    new_marketing="$cur_marketing"
  fi
  new_build=$((cur_build + 1))
  ok "Releasing: $new_marketing (build $new_build)"

  apply_versions "$new_marketing" "$new_build"

  # Commit the version bump so the tree stays clean for the rest of the pipeline
  git add "$PBXPROJ"
  git commit -m "chore: bump to $new_marketing (build $new_build) [release]" --quiet

  if [[ $FLAG_SKIP_BUILD -eq 0 ]]; then
    build_web
  else
    info "Skipping web build + cap sync (--skip-build)"
  fi

  sync_metadata
  generate_whats_new

  if [[ $FLAG_DRY_RUN -eq 1 ]]; then
    step "Dry run complete"
    cat <<EOF

${YELLOW}DRY RUN${RESET} — nothing was uploaded.

Next, to ship for real:
  ./scripts/release.sh release --skip-build $([[ -n "$FLAG_VERSION" ]] && echo "--version=$new_marketing")

EOF
    return 0
  fi

  # Archive + export IPA via xcodebuild directly (bypasses Fastlane gym
  # which is incompatible with Xcode 26's export options format)
  if [[ $FLAG_SKIP_BUILD -eq 0 ]]; then
    step "Archive and export IPA"
    local archive_path="$BUILD_DIR/App.xcarchive"
    local export_path="$BUILD_DIR/export"
    local export_plist="$REPO_ROOT/fastlane/ExportOptions.plist"

    rm -rf "$archive_path" "$export_path"
    mkdir -p "$BUILD_DIR"

    info "Archiving..."
    xcodebuild -project "$XCODE_PROJ" \
      -scheme App -configuration Release \
      -archivePath "$archive_path" \
      -allowProvisioningUpdates \
      archive 2>&1 | tail -3

    # Export locally (destination=export), then upload via altool with API key.
    # This avoids Xcode account session timeouts that break destination=upload.
    local export_local_plist
    export_local_plist=$(mktemp).plist
    cat > "$export_local_plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>app-store-connect</string>
	<key>destination</key>
	<string>export</string>
	<key>signingStyle</key>
	<string>automatic</string>
	<key>teamID</key>
	<string>T33B88TGA8</string>
	<key>uploadSymbols</key>
	<true/>
	<key>manageAppVersionAndBuildNumber</key>
	<false/>
</dict>
</plist>
PLIST

    info "Exporting IPA..."
    xcodebuild -exportArchive \
      -archivePath "$archive_path" \
      -exportPath "$export_path" \
      -exportOptionsPlist "$export_local_plist" \
      -allowProvisioningUpdates 2>&1 | tail -3
    rm -f "$export_local_plist"

    local exported_ipa
    exported_ipa=$(find "$export_path" -name "*.ipa" -print -quit 2>/dev/null || true)
    if [[ -z "$exported_ipa" ]]; then
      die "No IPA found in $export_path — export failed"
    fi
    ok "IPA exported: $exported_ipa"

    if [[ $FLAG_SKIP_UPLOAD -eq 0 ]]; then
      info "Uploading to App Store Connect via altool..."
      local asc_key_id asc_issuer
      asc_key_id=$(python3 -c "import json; print(json.load(open('$ASC_CONFIG_FILE'))['key_id'])")
      asc_issuer=$(python3 -c "import json; print(json.load(open('$ASC_CONFIG_FILE'))['issuer_id'])")
      xcrun altool --upload-app \
        --file "$exported_ipa" \
        --type ios \
        --apiKey "$asc_key_id" \
        --apiIssuer "$asc_issuer" 2>&1 | tail -5
      ok "Upload complete"
    fi
  fi

  tag_release "$new_marketing" "$new_build"

  step "Done"
  local release_msg
  if [[ $FLAG_SKIP_SUBMIT -eq 1 ]]; then
    release_msg="Build uploaded but NOT submitted for review (--skip-submit)."
  elif [[ $FLAG_AUTO_RELEASE -eq 1 ]]; then
    release_msg="Submitted for review. Build will release automatically once approved."
  else
    release_msg="Submitted for review. Press 'Release This Version' in App Store Connect once approved."
  fi
  cat <<EOF

${GREEN}${BOLD}🚀 $new_marketing (build $new_build) shipped${RESET}

$release_msg

  Watch progress: https://appstoreconnect.apple.com/apps

EOF
}

cmd_metadata_only() {
  preflight
  sync_metadata
  generate_whats_new

  if [[ $FLAG_DRY_RUN -eq 1 ]]; then
    info "Dry run — skipping upload"
    return 0
  fi

  step "Push metadata to App Store Connect"
  cd "$REPO_ROOT"
  bundle exec fastlane metadata_only
  ok "Metadata uploaded"
}

cmd_bump() {
  cd "$REPO_ROOT"
  local cur_marketing cur_build new_marketing new_build
  cur_marketing=$(read_marketing_version)
  cur_build=$(read_build_number)

  if [[ -n "$FLAG_VERSION" ]]; then
    new_marketing="$FLAG_VERSION"
  elif [[ -n "$FLAG_BUMP" ]]; then
    new_marketing=$(bump_marketing "$cur_marketing" "$FLAG_BUMP")
  else
    new_marketing="$cur_marketing"
  fi
  new_build=$((cur_build + 1))

  apply_versions "$new_marketing" "$new_build"
  ok "$cur_marketing (build $cur_build) → $new_marketing (build $new_build)"
}

# ============================================================================
# Main
# ============================================================================

main() {
  parse_args "$@"
  case "$COMMAND" in
    setup)     cmd_setup ;;
    preflight) preflight ;;
    bump)      cmd_bump ;;
    metadata)  cmd_metadata_only ;;
    release)   cmd_release ;;
    *)         die "Unknown command: $COMMAND" ;;
  esac
}

main "$@"

# SimpleWorkoutGen — iOS native build

The web app at the repo root doubles as the source for the iOS shell via
[Capacitor](https://capacitorjs.com). The `ios/` directory is a regular Xcode
project — open it in Xcode after the install completes.

## One-time setup

1. **Install Xcode** from the Mac App Store (~12 GB).
   The CLI tools alone are not enough; the full IDE is required to build for
   simulator and device.
2. **Accept the Xcode license** the first time it launches.
3. **Sign in to your Apple ID** in Xcode (Settings → Accounts).
4. **Apple Developer Program** ($99/yr) — only needed before App Store
   submission. Local simulator and on-device debug builds work without it.
5. From this directory, run `npm install` once to pull Capacitor.

## Day-to-day

```bash
# After editing index.html, js/*, etc.
npm run sync:ios          # rebuilds www/ and copies into ios/App/App/public
npm run open:ios          # opens the Xcode project
```

Then build & run from Xcode (⌘R) targeting any iOS Simulator or a connected
device.

## What the native shell adds on top of the web app

- **Audio session** configured for `.playback` with `.mixWithOthers` so
  countdown beeps and voice cues play through the silent switch and over
  the user's music while the app is foregrounded. (`App/AppDelegate.swift`)
- **Haptic feedback** on the mid-set "Switch sides" cue and on the final 3-2-1
  countdown ticks. Routed through `@capacitor/haptics`; the web app falls back
  to silent in-browser.
- **Status bar** locked to light content on the dark navy palette. Configured
  in `Info.plist` for the launch window and the `StatusBar` plugin afterwards.
- **Always fullscreen** — the WKWebView shell hides the browser chrome the
  iOS PWA could never get rid of. The in-browser "Add to Home Screen" hint and
  the in-app fullscreen toggle are CSS-hidden under `html.is-native`.

## Identity

| Field | Value |
|---|---|
| Bundle ID | `com.nomaen.homeworkout` |
| Display name | SimpleWorkoutGen |
| Marketing version | 1.0 |
| Build | 1 |
| App Store category | Health & Fitness |
| Minimum iOS | 14.0 (Capacitor 8 default) |
| Required capability | arm64 |

## Assets

The icon and splash are generated from `scripts/make-icon.py` and
`scripts/make-splash.py`. To regenerate:

```bash
python3 scripts/make-icon.py assets/icon-1024.png
python3 scripts/make-splash.py assets/splash-2732.png
cp assets/icon-1024.png ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png
cp assets/splash-2732.png ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732.png
cp assets/splash-2732.png ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-1.png
cp assets/splash-2732.png ios/App/App/Assets.xcassets/Splash.imageset/splash-2732x2732-2.png
```

The launch storyboard (`App/Base.lproj/LaunchScreen.storyboard`) uses an explicit
sRGB dark navy background colour matching the app, so there's no white flash on
launch even if the OS hasn't loaded the splash image yet.

## Releasing to the App Store

The full archive → upload → submit-for-review flow is automated by
[`scripts/release.sh`](../scripts/release.sh). One-time setup, then every
release is one command.

### One-time setup

```bash
npm run release:setup
```

That installs Fastlane (via bundler) and walks you through creating an
**App Store Connect API key** (`.p8` file, key ID, issuer ID). The key is
stored at `~/.appstoreconnect/` (outside the repo, mode 0600). All later
runs authenticate non-interactively with it — no Apple ID 2FA prompts.

### Cutting a release

```bash
npm run release                  # bumps build number, ships to review
npm run release -- --minor       # 1.0.0 → 1.1.0
npm run release -- --version=2.0.0
npm run release:dry              # full rehearsal, nothing uploaded
npm run release:metadata         # description/screenshots only, no new build
```

The script runs preflight (clean tree, on `main`, certs, API key, Xcode,
gems, listing source), bumps the build number across all three targets
(main app, watch, Live Activity), runs `npm run build:web && npx cap sync
ios`, regenerates `fastlane/metadata/` from
[`docs/APP_STORE_LISTING.md`](APP_STORE_LISTING.md) and
[`screenshots/`](../screenshots), composes "What's New" from commits since
the last `v*` tag, archives the IPA, uploads it, and submits for review.
On success it tags the commit `v<version>+<build>` and pushes.

After Apple approves, the build waits for you to press **Release This
Version** in App Store Connect (default — pass `--auto-release` to skip
that gate).

### What still needs the App Store Connect web UI (one-time)

These don't change per release and Fastlane can't reliably automate them:

- **App Privacy** answers (Data Not Collected — see APP_STORE_LISTING.md)
- **Age Rating** (4+)
- **Pricing & Availability** (Free, all territories)
- **TestFlight tester groups** (if you want external beta testers)

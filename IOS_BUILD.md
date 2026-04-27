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

- **Audio session** configured for `.playback` with `.mixWithOthers` so the
  countdown beeps and voice cues survive screen lock and don't kill the
  user's music. (`App/AppDelegate.swift`)
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

## Submission checklist (Phase 7 — done later)

- [ ] App Store Connect record created with the bundle ID above
- [ ] Screenshots: 6.7", 6.5", 5.5", 12.9" iPad Pro
- [ ] App Store description, keywords, support URL
- [ ] Privacy policy URL (the app collects nothing locally except
      `localStorage`-scoped session history; draft a short policy)
- [ ] Privacy questionnaire: no data collected
- [ ] Archive build in Xcode → Product → Archive → Upload
- [ ] Submit for review

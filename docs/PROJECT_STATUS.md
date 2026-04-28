# SimpleWorkoutGen — Project Status

**Last updated:** 2026-04-29
**Version:** 1.0 (build 2, resubmitted to App Store)
**Repo:** [joehassell/homeworkout](https://github.com/joehassell/homeworkout)
**Web:** [joehassell.github.io/homeworkout](https://joehassell.github.io/homeworkout)

---

## What's Built (Shipped to `main`)

### Sprint 1 — Web App Foundation (Complete)

All features from the original sprint plan are implemented and live on GitHub Pages.

| Feature | Status | PR |
|---------|--------|-----|
| Session history in localStorage | Done | #2 |
| History screen with calendar heatmap | Done | #2 |
| Stats strip (total sessions, streak, common type, avg RPE) | Done | #2 |
| Post-session RPE capture (1-10 scale) | Done | #2 |
| Post-session notes input | Done | #2 |
| Exercise reorder (up/down arrows in preview) | Done | #2 |
| Exercise swap picker (same-category alternatives) | Done | #2 |
| Strength mode rep targets + count-up timer | Done | #2 |
| Weight tracking per set | Done | #2 |
| Export/import JSON backup | Done | #2 |
| Bottom nav (Build / History / Settings) | Done | #2 |

### v2 PDR Features (Complete)

All 12 items from the v2 product requirements document are implemented.

| Feature | Status | PR |
|---------|--------|-----|
| Workout-specific warm-up (type-scaled, pulse raiser) | Done | #2 |
| 5-minute cooldown biased toward loaded muscles | Done | #2 |
| Set timer countdown with 3-2-1 audio/voice cues | Done | #2 |
| Intensity-scaled rest periods (60-180s) | Done | #2 |
| Focus areas (3-state: include/boost/exclude) | Done | #2 |
| 5 colour themes (Dark, Midnight, Forest, HC, Light) | Done | #2 |
| Font size stepper (5 steps, 0.875x to 1.5x) | Done | #2 |
| Fullscreen on workout start + toggle | Done | #2 |
| Single-sided exercises (2x duration + switch cue) | Done | #2 |
| Total-time math (warmup + 60s + main + cooldown = duration) | Done | #2 |
| iOS Generate CTA always visible | Done | #6 |
| Next-exercise caption enlarged (1.25rem) | Done | #2 |

### Sprint 2 — iOS Native Shell (Complete)

The app is wrapped in Capacitor 8 instead of the originally planned SwiftUI + WKWebView. This was a pragmatic decision — Capacitor provides the same native bridge capabilities with less boilerplate.

| Feature | Status | PR | Notes |
|---------|--------|-----|-------|
| Capacitor 8 iOS project | Done | #3 | Replaced planned SwiftUI/WKWebView approach |
| Native haptic feedback | Done | #3 | Via @capacitor/haptics plugin |
| Audio session (play through silent switch) | Done | #3 | AVAudioSession .playback category |
| Status bar styling (light on dark) | Done | #3 | Via @capacitor/status-bar plugin |
| App icon (1024x1024) | Done | #3 | Dark navy with accent blue |
| Launch screen (dark navy) | Done | #3 | Matches app background |
| Keyboard handling | Done | #3 | Via @capacitor/keyboard plugin |

**Not implemented from Sprint 2 plan:**

| Feature | Status | Reason |
|---------|--------|--------|
| iCloud sync via NSUbiquitousKeyValueStore | Not built | Capacitor uses localStorage directly; iCloud sync deferred to future version |
| JS-Swift bridge (saveData/loadData) | Not needed | Capacitor's native bridge handles this transparently |
| TestFlight distribution | Skipped | Went straight to App Store submission |

### Sprint 3 — Apple Watch + HealthKit (Complete)

| Feature | Status | PR |
|---------|--------|-----|
| HealthKit workout logging (iPhone) | Done | #7 |
| MET-based calorie estimation | Done | #7 |
| Body weight from HealthKit | Done | #7 |
| Live Activity (lock screen + Dynamic Island) | Done | #7 |
| WatchConnectivity plugin (iPhone side) | Done | #7 |
| watchOS companion app (SwiftUI) | Done | #7 |
| Watch: exercise name, countdown, phase display | Done | #7 |
| Watch: pause/resume/skip controls | Done | #7 |
| Watch: heart rate from HKLiveWorkoutBuilder | Done | #7 |
| Watch: haptics for phase changes | Done | #7 |
| Watch: local countdown fallback (phone disconnect) | Done | #7 |
| HR display on phone timer | Done | #7 |
| HR waiting state with pulsing heart | Done | #11 |
| Apple Health settings card with disclosure | Done | #11 |
| "Saved to Apple Health" confirmation on Done screen | Done | #11 |
| Workout type mapping to HKWorkoutActivityType | Done | #7 |
| Watch app icons | Done | #7 |

**Not implemented from Sprint 3 plan:**

| Feature | Status | Reason |
|---------|--------|--------|
| Enhanced post-workout HR summary (avg, max, zones) | Not built | Deferred — requires accumulating HR samples over session |
| Activity ring contribution display on Done screen | Not built | Deferred — requires reading Activity data from HealthKit |
| Settings toggle to disable HealthKit sync | Not built | Low priority — user can revoke in iOS Settings |
| Watch standalone mode | Not planned | By design — phone is the brain |

### Yoga Workout Type (Complete)

| Feature | Status | PR |
|---------|--------|-----|
| Yoga as 5th workout type | Done | #10 |
| 5 yoga styles (Vinyasa, Hatha, Yin, Power, Restorative) | Done | #10 |
| ~50 yoga poses with Sanskrit names | Done | #10 |
| Style-specific sequencing and hold durations | Done | #10 |
| Voiced narration system (calm, slow, breath-guided) | Done | #10 |
| Gentle singing-bowl transition chimes | Done | #10 |
| Centering breath at start, Savasana always at end | Done | #10 |
| Conditional UI (hide intensity/equipment/sets for yoga) | Done | #10 |
| Focus area filtering for yoga | Done | #10 |

### Exercise & Timing Fixes (Complete)

| Fix | Status | PR |
|-----|--------|-----|
| 5 exercises marked single-sided (Step-Ups, TGU, KB Clean/Snatch, Clean & Press) | Done | #9 |
| Isometric timing inverted (easy=longer, hard=shorter holds) | Done | #9 |
| Base timings rebalanced (core, carry, full-body, plyo, cardio, animal) | Done | #9 |
| Cooldown: removed isometric exercises, added 9 dedicated stretches | Done | #10 |

### App Store Submission

| Step | Status |
|------|--------|
| Apple Developer Program enrolled | Done |
| App Store Connect record created | Done |
| Screenshots (iPhone, iPad, Watch) | Done |
| App Store description + keywords | Done |
| Privacy policy (privacy.html on GitHub Pages) | Done |
| Build 1 uploaded + submitted | Done — rejected |
| Rejection fix: removed background audio entitlement | Done | #11 |
| Rejection fix: surfaced HealthKit in UI (4 touchpoints) | Done | #11 |
| Build 2 uploaded + resubmitted | Pending |

---

## What's Planned (Not Yet Built)

### High Priority

| Feature | Description | Complexity |
|---------|-------------|------------|
| iCloud sync | Sync session history across devices via NSUbiquitousKeyValueStore or CloudKit. Currently all data is device-local. | Medium |
| Post-workout HR summary | Show average HR, max HR, and time-in-zones on the Done screen when Apple Watch data is available. | Low |
| Warmup exercise filter | Close-Grip Bench Press sometimes appears as a warmup. Tighten `push-h` warmup filter to bodyweight-only. | Low |

### Medium Priority

| Feature | Description | Complexity |
|---------|-------------|------------|
| History: show warmup/cooldown | History view only renders main exercises. Show all three phases (warmup, main, cooldown). | Low |
| Strength total-time display | Strength sessions show incomplete total time (missing unknown work duration). Clarify in the UI. | Low |
| Settings snapshot rendering | `settings_snapshot` (theme, font) is captured in saved sessions but not used when viewing history. Render past sessions in the theme they were performed in. | Medium |
| Background audio justification | Re-add `UIBackgroundModes: audio` in a future version with proper justification to Apple, if user feedback shows screen-lock audio loss is a problem. | Low |
| Live Activity widget target | Source files exist (`SimpleWorkoutGenLiveActivity/`) but the Widget Extension target is not in the Xcode project. Needs to be wired up for the lock screen/Dynamic Island Live Activity to actually appear. | Medium |

### Low Priority / Nice-to-Haves

| Feature | Description | Complexity |
|---------|-------------|------------|
| Custom warm-up/cooldown editing | Let users edit or replace generated warmup/cooldown sequences. | High |
| Adaptive rest based on prior fatigue | Scale rest periods based on recent session history and RPE trends. | High |
| Per-user palette creation | Let users create custom colour themes beyond the 5 built-in ones. | Medium |
| Export palette + font in JSON backup | Include theme and font preferences in the backup/restore JSON. | Low |
| Watch complications | Show last workout or streak on the watch face. | Medium |
| Apple Watch standalone mode | Generate and run workouts directly on the watch without the phone. | High |

---

## Architecture

| Layer | Technology |
|-------|-----------|
| Web app | Vanilla HTML/CSS/JS — single `index.html` (~3200 lines) |
| iOS shell | Capacitor 8 with custom Swift plugins |
| Watch app | Native SwiftUI (watchOS 10+) |
| Health | HealthKit + ActivityKit (Live Activities) |
| Connectivity | WatchConnectivity (WCSession) |
| Plugins | @capacitor/haptics, keyboard, status-bar |
| Build | `npm run build:web` → `npm run sync:ios` → Xcode archive |

### Key Files

| File | Purpose |
|------|---------|
| `index.html` | Entire web app — UI, generator, timer, 105+ exercises |
| `js/builder.js` | Work/rest interval calculations, timing modifiers |
| `js/yoga.js` | Yoga pose database (~50 poses), style configs, yoga generator |
| `js/storage.js` | localStorage wrapper, JSON backup/restore |
| `js/history.js` | History view rendering |
| `ios/App/App/Plugins/HealthKitPlugin.swift` | HealthKit auth, workout save, Live Activity |
| `ios/App/App/Plugins/WatchConnectivityPlugin.swift` | WCSession bridge between JS and watch |
| `ios/App/HomeWorkoutWatch/WorkoutSessionManager.swift` | Watch: WCSession + HKWorkoutSession |
| `ios/App/HomeWorkoutWatch/Views/` | Watch SwiftUI views |

### App Identity

| Field | Value |
|-------|-------|
| Bundle ID | `com.nomaen.homeworkout` |
| Watch Bundle ID | `com.nomaen.homeworkout.watchkitapp` |
| Display Name | SimpleWorkoutGen |
| Version | 1.0 (build 2) |
| Category | Health & Fitness |
| Min iOS | 15.0 |
| Min watchOS | 10.0 |
| Team ID | T33B88TGA8 |

---

## PR History

| PR | Branch | Description | Status |
|----|--------|-------------|--------|
| #1 | `docs/pdr-v2-features` | v2 PDR document | Merged |
| #2 | `worktree-v2-pdr` | Full v2 implementation | Merged |
| #3 | `feat/ios-native` | Capacitor iOS shell + native polish | Merged |
| #4 | `fix/cta-clearance` | CTA clearance attempt (dvh + padding) | Merged |
| #5 | `docs/handoff` | Handoff document | Merged |
| #6 | `fix/setup-cta-always-visible` | Fix: Generate CTA always visible (scroll area + fixed footer) | Merged |
| #7 | `feat/healthkit-watch-integration` | HealthKit, Live Activity, Watch Connectivity, watchOS app | Merged |
| #8 | `chore/readme-and-submission` | README, privacy policy, App Store screenshots | Merged |
| #9 | `fix/exercise-audit` | Single-sided flags + timing rebalance | Merged |
| #10 | `feat/yoga-workout` | Yoga workout type with 5 styles + narration | Merged |
| #11 | `fix/app-store-rejection` | App Store rejection fix (background audio + HealthKit UI) | Merged |

---

## Superseded Documents

The following documents were useful during development but are now superseded by this status document:

| Document | Purpose | Status |
|----------|---------|--------|
| `PDR.md` | v2 product requirements | All items implemented — historical reference only |
| `sprint-plan.md` | 3-sprint roadmap (HTML → iOS → Watch) | All sprints complete — historical reference only |
| `HANDOFF.md` | Machine-transfer handoff from prior operator | Outdated — all issues resolved |
| `IOS_BUILD.md` | iOS build setup guide | Still useful for day-to-day development |
| `docs/APP_STORE_LISTING.md` | App Store description and metadata | Current — use for App Store Connect |

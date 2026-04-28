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

## Known Bugs

| Bug | Description | Priority |
|-----|-------------|----------|
| White gap on iPhone | White bars visible at the top and bottom of the app in the iOS native shell. The app background (`#0a0a0f`) should extend edge-to-edge with no white gaps. Likely a `viewport-fit=cover` or safe-area issue in the Capacitor WKWebView configuration. | **High** — ship-blocking visual defect |

---

## What's Planned — v3 Roadmap (PDR-v3-personalisation)

Full spec: `docs/PDR-v3-personalisation.md`

The v3 theme is **personalisation and safety**. The core change is a capability profile (age, weight, height, fitness level, mobility limits) that filters every exercise the generator considers. On top of that: goals, Hevy-parity strength tracking, expert templates, weekly planning, HR zone coaching, and music control.

### Recommended Build Order

| # | Branch | Feature | Spec | Complexity |
|---|--------|---------|------|------------|
| 1 | `fix/yoga-generation` | Fix yoga empty-workout bug | §8 | Low |
| 2 | `feat/capability-profile-data` | Demand tags on all exercises + filter module | §5.2, §5.3, §5.4 | Medium |
| 3 | `feat/profile-setup` | Profile screen + HealthKit auto-fill | §5.5 | Medium |
| 4 | `feat/goals` | Priority goals (up to 3) + generator weighting | §6.1 | Medium |
| 5 | `feat/equipment-tiers` | Tiered equipment (Basic/Home/Commercial) + presets | §6.3 | Medium |
| 6 | `feat/exercise-library-settings` | Exercise library browser, blacklist/whitelist, icons | §6.2 | High |
| 7 | `feat/expert-library` | Library audit + 30+ expert-designed templates | §6.4 | High |
| 8 | `feat/cooldown-v2` | Cooldown scaling by duration + goals, muscle targeting | §6.6 | Low |
| 9 | `feat/custom-duration` | Free-input duration (15-180 min) with presets | §6.7 | Low |
| 10 | `feat/yoga-rebuild` | Yoga equipment, experience levels, pose detail, icons | §6.8 | High |
| 11 | `feat/saved-workouts` | Save/rate/replay/export (JSON, MD, CSV, PDF) | §6.9 | Medium |
| 12 | `feat/add-exercise-button` | + button on preview sections | §6.11 | Low |
| 13 | `feat/hevy-parity-strength` | PRs, progression charts, plate calc, supersets, set types, body measurements | §6.5 | Very High |
| 14 | `feat/weekly-plan` + `feat/surprise-me` | 7-day plan + one-tap smart generation | §6.10 | High |
| 15 | `feat/hr-zone-watch` | HR zone targeting, dynamic rest, watch zone screen | §6.12 | High |
| 16 | `feat/music-control` | Apple Music + Spotify control, watch mini-player | §6.13 | High |

### v3 Feature Summary

**Safety & Personalisation:**
- Capability profile (age, weight, height, fitness level, floor work, mobility limits, pregnancy safety)
- Per-exercise demand tags (impact, complexity, joint load, CV demand, balance, floor requirement)
- Mechanical filtering — unsafe exercises never appear, never silently padded
- HealthKit auto-fill for profile data (DOB, weight, height, VO2max)
- Override toggle with confirmation for power users

**Goals & Planning:**
- Priority goals (up to 3): weight loss, cardio, strength, mobility, flexibility, recovery, general fitness
- Goals shape generator weighting, cooldown emphasis, and weekly plan
- Weekly 7-day plan based on goals + capability + recent history
- "Surprise me" one-tap smart workout generation

**Strength / Hevy Parity (iOS):**
- Personal records (PR) tracking per exercise
- Progression charts (working weight + est. 1RM over time)
- Volume/tonnage tracking (sets x reps x kg)
- Plate calculator + 1RM calculator (Epley/Brzycki)
- Supersets and circuit blocks
- Set types (normal, warmup, drop, failure, AMRAP) with per-set RPE
- Body measurements log (with HealthKit round-trip)
- Workout reminders (local notifications)

**Exercise Library:**
- Full exercise browser with filters (body part, type, equipment, difficulty, impact)
- Exercise blacklist/whitelist with "use whitelist exclusively" toggle
- Icons for every exercise and equipment item
- Coach cues on timer screen
- Expert-designed templates (30+) per workout type

**Cooldown & Duration:**
- Cooldown scales with session length (5-10 min) and goals (mobility = 1.5x)
- Custom workout duration (15-180 min free input)

**Yoga Rebuild:**
- Yoga-specific equipment (block, strap, bolster, blanket, wall, chair)
- Yoga experience levels (New → Teacher) with complexity caps
- Expanded pose database with descriptions, step-by-step, modifications, icons
- Generation bug fix

**Watch + HR Coaching (iOS):**
- HR zone targeting (Z1-Z5 based on HRmax)
- Dynamic rest (end rest when HR drops to target zone)
- Below/above zone voice coaching with safety override at 90% HRmax
- Swipeable watch screen: timer → HR zones → controls

**Music (iOS):**
- Apple Music + Spotify playback control
- Mini-player on Setup/Preview/Timer screens
- Watch mini-player via WatchConnectivity

### Remaining Housekeeping (from v1-v2)

| Item | Description | Complexity |
|------|-------------|------------|
| Live Activity widget target | Source files exist but Widget Extension target not wired in Xcode project | Medium |
| iCloud sync | Session history sync across devices (deferred from Sprint 2) | Medium |
| Background audio | Re-add with justification if user feedback warrants | Low |
| History warmup/cooldown display | Show all three phases in history view | Low |
| Settings snapshot rendering | Render past sessions in their original theme | Medium |

### Out of Scope (v4+)

- Social features, leaderboards, sharing
- AI/LLM exercise generation
- Server-side accounts
- Form-checking via camera
- Nutrition logging
- Sleep/readiness scoring
- Pregnancy curated pool (toggle ships disabled in v3)
- Coach video clips per exercise
- Multi-user / family profiles

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
| #12 | `docs/project-status` | Consolidated project status document | Open |
| — | `docs/pdr-v3-personalisation` | v3 PDR: personalisation, capability profile, Hevy parity | Merged |

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
| `docs/PDR-v3-personalisation.md` | v3 product requirements (personalisation, safety, Hevy parity) | Current — v3 roadmap spec |

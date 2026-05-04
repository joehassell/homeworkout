# Sprint 7 — Polish, Integration & Design Overhaul

**Status:** Plan — awaiting review
**Date:** 2026-05-04
**Branch:** main
**Estimated effort:** Human team: ~3 weeks / CC: ~6-8 hours

---

## Overview

Seven workstreams addressing native integration reliability, music UX redesign, voice system wiring, Apple Watch paging UI, cross-device sync, and visual polish. No new features — this sprint is about making everything that exists **actually work reliably and look beautiful**.

---

## 1. Apple Health — Robust Permission Handling

### Problem
- `requestAuthorization()` is called unconditionally on every launch
- Previously denied users get re-prompted every time
- No distinction between "not yet asked", "denied", and "connected"
- On iPad the error is swallowed silently

### Design

**Swift changes (`HealthKitPlugin.swift`):**

New method: `checkAuthorizationStatus()` — returns the current state without prompting:
```swift
@objc func checkAuthorizationStatus(_ call: CAPPluginCall) {
    guard HKHealthStore.isHealthDataAvailable() else {
        call.resolve(["status": "unavailable"])
        return
    }
    // Check a representative type — if .notDetermined, user hasn't been asked
    let bodyMass = HKQuantityType(.bodyMass)
    let status = healthStore.authorizationStatus(for: bodyMass)
    switch status {
    case .notDetermined:
        call.resolve(["status": "not_determined"])
    case .sharingDenied:
        call.resolve(["status": "denied"])
    case .sharingAuthorized:
        call.resolve(["status": "authorized"])
    @unknown default:
        call.resolve(["status": "unknown"])
    }
}
```

**JS flow (`initHealthKit`):**
```
1. Check isAvailable() → false? Show "Not available on this device"
2. Check checkAuthorizationStatus()
   → "authorized" → proceed to getBodyWeight, etc.
   → "not_determined" → call requestAuthorization() (shows iOS prompt)
   → "denied" → show "Not connected" + "Connect" button
      Connect button → opens iOS Settings for the app
3. Never re-prompt if denied
```

**Settings UI:**
- Health status shows: "Connected", "Not connected", or "Not available"
- "Connect Apple Health" button visible when disconnected
- Button behaviour:
  - If `not_determined`: calls `requestAuthorization()`
  - If `denied`: opens `App-prefs:Health` deep link so user can toggle in iOS Settings

### Files
- `ios/App/App/Plugins/HealthKitPlugin.swift` — add `checkAuthorizationStatus`, update bridge `.m`
- `index.html` — rewrite `initHealthKit()` flow

### Verification
- Simulator: deny health → relaunch → shows "Not connected" (no re-prompt)
- Simulator: grant health → relaunch → shows "Connected" immediately
- iPad: shows "Not available" gracefully if HealthKit unavailable, or correct status if available

---

## 2. Music Controls — Beautiful, Functional, Complete

### Problem
- Ugly emoji characters (⏮ ▶ ⏭ ⏸ ♫) for music controls
- Album art display is inconsistent
- No way to start radio
- No way to launch Apple Music app
- "Not Playing" shown even when music is playing (auth state issue)
- Music controls visible on Settings page (should only be on Preview/Timer)

### Design

**Visual redesign — floating bubble + expanded card:**

The bubble stays as designed (48px circle, bottom-right, only on Preview/Timer screens).

**Expanded card redesign:**
```
┌─────────────────────────────────┐
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │      Album Art 200px      │  │
│  │     (tap to collapse)     │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Song Title                     │
│  Artist — Album                 │
│                                 │
│  ○────────────●──────── 2:31    │
│                                 │
│    ⟨  ◁◁    ▷ / ❚❚    ▷▷  ⟩   │   ← SVG icons, not emojis
│                                 │
│  ┌──────────┐ ┌──────────────┐  │
│  │ 📻 Radio │ │ ♫ Apple Music│  │   ← Two action buttons
│  └──────────┘ └──────────────┘  │
└─────────────────────────────────┘
```

**Icon replacement — use SVG, not emoji:**

| Control | Current | New |
|---------|---------|-----|
| Previous | `&#x23EE;` (⏮) | SVG: backward.fill style arrows |
| Play | `&#x25B6;` (▶) | SVG: play.fill triangle |
| Pause | `&#x23F8;` (⏸) | SVG: pause.fill bars |
| Next | `&#x23ED;` (⏭) | SVG: forward.fill style arrows |
| Music note | `&#x266B;` (♫) | SVG: music.note |

All SVGs use `currentColor` and `stroke` matching the app's existing icon style (22px, 2px stroke, round caps — same as bottom nav icons).

**New buttons:**
1. **"Radio"** — calls `MPMusicPlayerController.systemMusicPlayer.setQueue(with: .radio)` or equivalent. Opens Apple Music radio station.
2. **"Open Apple Music"** — deep links to `music://` URL scheme to launch Apple Music app.

**Album art caching:**
- Cache last known `artworkBase64` in JS variable
- Only clear when track title changes (not on every state update)
- If current update has no artwork but cached exists, keep showing cached

**Auth flow:**
- `initMusic()` always sets up listeners regardless of auth
- Bubble always shows on Preview/Timer
- First tap of play → triggers auth prompt if needed
- After auth, immediately query `getNowPlaying()` and update UI

### Files
- `index.html` — HTML structure, SVG icons, radio/launch buttons, art caching
- `css/styles.css` — expanded card styling, SVG icon sizing, button styles
- `ios/App/App/Plugins/MusicPlugin.swift` — add `openAppleMusic()`, `startRadio()` methods + bridge

### Verification
- SVG icons render cleanly on iPhone and iPad
- Album art persists between state updates for same track
- Album art clears when track changes
- Radio button starts a radio station
- "Open Apple Music" launches the Apple Music app
- Bubble only visible on Preview and Timer screens

---

## 3. Voice Engine Selector — Standard / Siri / Custom

### Problem
- Voice always uses Web Speech API on PWA, SpeechPlugin on native
- Pre-recorded yoga voices (Pro) never play — the `speakYoga` function tries audio files but the path may be wrong or files aren't bundled correctly
- No way for user to choose voice engine
- No fallback indicator when custom voices fail

### Design

**New setting in Audio section:**
```
Voice Engine
  ┌──────────┐ ┌──────┐ ┌────────┐
  │ Standard │ │ Siri │ │ Custom │
  └──────────┘ └──────┘ └────────┘
  Standard: built-in browser voice
  Siri: Apple's premium voices (iOS only)
  Custom: AI-recorded voices (Pro only)
```

**Variable:** `voiceEngine = 'standard' | 'siri' | 'custom'`
**Persisted:** in `saveAppSettings` / `loadAppSettings`

**Routing logic:**

```javascript
function speak(text) {
  if (!voiceEnabled) return;
  if (voiceEngine === 'siri' && isNative() && window.Capacitor.Plugins.SpeechPlugin) {
    SpeechPlugin.speak({ text, rate: 0.50, pitch: 1.0 });
  } else {
    // Standard: Web Speech API
    webSpeechSpeak(text, 0.95, 1.0);
  }
}

function speakYoga(text, slug, cueIndex) {
  if (!voiceEnabled) return;
  if (voiceEngine === 'custom' && Entitlement.isPro() && slug) {
    tryPrerecordedAudio(text, slug, cueIndex);  // falls back to current engine
  } else if (voiceEngine === 'siri' && isNative()) {
    SpeechPlugin.speak({ text, rate: 0.38, pitch: 0.9 });
  } else {
    webSpeechSpeak(text, yogaSpeechRate, 0.95);
  }
}
```

**Custom voice debugging:**
- When custom voice file fails to load, log the attempted path to console
- Show "Custom voices unavailable — using [Siri/Standard]" toast once per session

### Files
- `index.html` — settings UI, voice engine variable, routing logic
- `css/styles.css` — voice engine pill styling (reuse existing pill pattern)

### Verification
- Select "Standard" → hear Web Speech API on both web and native
- Select "Siri" → hear premium Siri voice on native, falls back to Standard on web
- Select "Custom" → hear pre-recorded MP3 for yoga poses (Pro), falls back for non-yoga
- Switch between engines mid-workout → next cue uses new engine
- Setting persists across app restarts

---

## 4. Apple Watch — Scrollable, Multi-Page, Auto-Launch

### Problem
- Watch screen doesn't scroll with Digital Crown when content overflows
- No music controls on Watch (Apple Fitness has swipe-to-music)
- No heart rate zone screen
- Watch app must be manually launched
- Watch crashes on phone app pause

### Design

**4a. Digital Crown scrolling:**

Wrap `ActiveWorkoutView` content in a `ScrollView` with `.digitalCrownRotation`:

```swift
var body: some View {
    ScrollView {
        VStack(spacing: 6) {
            // ... existing content
        }
    }
    .focusable()  // Enables Digital Crown
}
```

**4b. Multi-page layout (like Apple Fitness):**

Use `TabView` with `.tabViewStyle(.verticalPage)` for watchOS paging:

```swift
TabView {
    ActiveWorkoutView()     // Page 1: Workout (exercise, timer, HR)
    WatchMusicView()        // Page 2: Music controls
    HeartRateZoneView()     // Page 3: HR zones
}
.tabViewStyle(.verticalPage)
```

User swipes up/down (or uses Digital Crown) to switch between pages.

**4c. Heart Rate Zone screen (`HeartRateZoneView.swift`):**

```
┌─────────────────────┐
│      HR ZONES        │
│                      │
│   ♥ 142 BPM         │
│                      │
│   ████████░░  Z4     │  ← Current zone highlighted
│                      │
│   Z1  50-60%  Rest   │
│   Z2  60-70%  Fat    │
│   Z3  70-80%  Cardio │
│  >Z4  80-90%  Tempo< │  ← Current
│   Z5  90-100% Peak   │
│                      │
│   Time in zone: 2:15 │
│   Avg HR: 128        │
│   Peak HR: 156       │
└─────────────────────┘
```

Published properties needed in `WorkoutSessionManager`:
- `currentZone: Int` (1-5)
- `timeInCurrentZone: Int` (seconds)
- `zoneHistory: [Int: Int]` (zone → seconds spent)

**4d. Auto-launch Watch app when phone starts workout:**

In `hkStartWorkout()` (JS), after sending the workout state to the Watch via `sendWorkoutState`, the Watch app auto-wakes because `updateApplicationContext` delivers to the Watch even when the Watch app is in background. But the Watch app needs to be installed.

For explicit launch: use `WCSession.default.transferCurrentComplicationUserInfo([:])` which wakes the Watch app. Or use `sendMessage` which wakes the app if it's reachable.

Add to `WatchConnectivityPlugin.swift`:
```swift
@objc func launchWatchApp(_ call: CAPPluginCall) {
    guard let s = session, s.isPaired, s.isWatchAppInstalled else {
        call.resolve(["launched": false])
        return
    }
    // Send wake-up message
    if s.isReachable {
        s.sendMessage(["type": "workoutStart"], replyHandler: nil, errorHandler: nil)
    }
    // Also update context (works even when not reachable)
    try? s.updateApplicationContext(["wakeUp": true, "timestamp": Date().timeIntervalSince1970])
    call.resolve(["launched": true])
}
```

Call from JS when workout starts: `watchSendCommand('workoutStart', {...})`

**4e. Watch crash fix:**

Already partially fixed in build 28. Additional safety:
- Guard all `sendMessage` calls with `isReachable` check
- Use `transferUserInfo` as fallback (queued, works in background)
- Nil-check session/builder before all HK operations

### Files
- `ios/App/HomeWorkoutWatch/Views/ActiveWorkoutView.swift` — ScrollView, TabView paging
- `ios/App/HomeWorkoutWatch/Views/WatchMusicView.swift` (new) — Watch music page
- `ios/App/HomeWorkoutWatch/Views/HeartRateZoneView.swift` (new) — HR zone page
- `ios/App/HomeWorkoutWatch/WorkoutSessionManager.swift` — zone tracking, crash guards
- `ios/App/App/Plugins/WatchConnectivityPlugin.swift` — `launchWatchApp` method + bridge

### Verification
- Digital Crown scrolls on Watch when content is tall
- Swipe up/down switches between Workout/Music/HR Zones pages
- HR Zone screen shows correct zone based on current HR
- Watch app auto-wakes when workout starts on phone
- Watch doesn't crash when phone app goes to background

---

## 5. Cross-Device Sync — Watch ↔ iPhone ↔ iPad

### Problem
- iPad doesn't get Watch HR data
- Watch state not synced to iPad
- Music state not synced across devices

### Design

**Already built (Sprint 7, PR #47):** iPhone relays Watch HR to iPad via iCloud KV every 3 seconds. This needs verification and polish, not a rebuild.

**Additional sync:**
- iPhone relays music state to iPad via iCloud KV (same pattern as HR relay)
- iPad shows "HR from iPhone" indicator when relay data is being used
- Stale data (>10s old) is ignored and UI shows "Waiting for data..."

**Watch → iPhone sync (existing):**
- `applicationContext` for exercise state (latest-value-wins)
- `sendMessage` for HR (real-time when reachable)
- `transferUserInfo` for control commands (reliable delivery)

**iPhone → iPad sync (via iCloud KV):**
- Key: `swg.watch_relay` — JSON with HR, exercise, phase, timestamp
- iPad listener: `cloudSync` event handler checks for relay key
- Freshness: ignore data older than 10 seconds

### Files
- `index.html` — relay music state, add "HR via iPhone" indicator
- No new native changes needed

### Verification
- Start workout on iPhone with Watch → iPad shows HR within 3-5 seconds
- iPhone music state reflected on iPad
- Stale data (phone backgrounded >10s) shows "Waiting..."

---

## 6. Music Controls — Apple Watch

### Problem
- No music controls on Watch during workout
- Apple Fitness has a dedicated music page — we should too

### Design

Watch music page (page 2 of the TabView, see §4b):

```
┌─────────────────────┐
│      NOW PLAYING     │
│                      │
│  🎵 Song Title       │
│     Artist           │
│                      │
│   ◀◀    ▶/❚❚    ▶▶  │
│                      │
│  Volume: ════●═══    │  ← Digital Crown
│                      │
└─────────────────────┘
```

- Uses `WKInterfaceVolumeControl` equivalent (Digital Crown adjusts system volume on watchOS)
- Controls send `musicControl` messages to phone via WCSession
- Phone's `WatchConnectivityPlugin` handles prev/play/pause/next via `MPMusicPlayerController`
- Music state forwarded from phone to Watch via `applicationContext`

Already partially built in the `WatchMusicView` (currently inline in `ActiveWorkoutView`). Needs:
- Move to its own page in TabView
- Add volume control via `.digitalCrownRotation` for volume
- Receive music state updates from phone

### Files
- `ios/App/HomeWorkoutWatch/Views/WatchMusicView.swift` — standalone page
- `ios/App/HomeWorkoutWatch/Views/ActiveWorkoutView.swift` — remove inline music, add to TabView
- `ios/App/HomeWorkoutWatch/WorkoutSessionManager.swift` — music state properties

### Verification
- Swipe to music page on Watch during workout
- Prev/play-pause/next controls work
- Digital Crown adjusts volume
- Song title/artist updates when track changes on phone

---

## 7. Visual Polish (Design Review Integration)

### Problem
- Various UI inconsistencies flagged by user testing
- Music emoji icons are ugly
- Settings layout is cramped in places

### Design Principles (from design-review skill)
- **Consistency:** All icons use SVG with stroke style matching bottom nav
- **Touch targets:** Minimum 44x44pt on all interactive elements
- **Spacing:** 8px grid, intentional rhythm between sections
- **Typography:** System font stack, clear hierarchy
- **Dark mode:** Off-white text (#E0E0E0), accent colors desaturated

### Specific Fixes
1. Replace ALL music emoji characters with SVGs
2. Settings Apple Watch section — proper stacked layout
3. Music expanded card — clean card design with proper shadows
4. Exercise info modal — consistent border radius and padding
5. Timer screen — ensure music bubble doesn't overlap countdown

### Files
- `css/styles.css` — icon sizing, card styles, spacing adjustments
- `index.html` — SVG icons inline, layout restructuring

### Verification
- Visual comparison: before/after screenshots of all affected screens
- No emoji characters remain in music controls
- All touch targets ≥ 44pt

---

## Build Order

| # | Workstream | Files | Risk | Depends On |
|---|-----------|-------|------|------------|
| 1 | HealthKit permissions | HealthKitPlugin.swift, .m, index.html | Low | — |
| 2 | Voice engine selector | index.html, styles.css | Low | — |
| 3 | Music SVG icons + Radio + Launch | index.html, styles.css, MusicPlugin.swift, .m | Medium | — |
| 4 | Watch multi-page + scroll + auto-launch | 4 Watch Swift files, WatchConnectivityPlugin.swift | Medium | — |
| 5 | Album art caching | index.html | Low | #3 |
| 6 | Cross-device sync polish | index.html | Low | #4 |
| 7 | Visual polish pass | styles.css, index.html | Low | #3, #4 |

**Items 1-4 can be built in parallel. Items 5-7 depend on earlier items.**

---

## Verification Checklist (must ALL pass before shipping)

### HealthKit
- [ ] Fresh install: shows "Not connected" + Connect button
- [ ] Grant permission: shows "Connected", reads body weight
- [ ] Deny permission: shows "Not connected", no re-prompt on relaunch
- [ ] Connect button on denied state opens iOS Settings

### Music
- [ ] SVG icons render correctly (no emoji anywhere)
- [ ] Album art shows and persists for same track
- [ ] Album art clears on track change
- [ ] Radio button starts Apple Music radio
- [ ] "Open Apple Music" launches the app
- [ ] Bubble only on Preview/Timer screens
- [ ] Expanded card collapses when tapping album art

### Voice
- [ ] Standard engine: Web Speech API works on all platforms
- [ ] Siri engine: AVSpeechSynthesizer speaks on native
- [ ] Custom engine: pre-recorded yoga audio plays for Pro users
- [ ] Setting persists across restarts
- [ ] Fallback works when selected engine unavailable

### Apple Watch
- [ ] Digital Crown scrolls workout screen
- [ ] Swipe between Workout / Music / HR Zones pages
- [ ] HR zone screen shows correct zone + time in zone
- [ ] Music controls on Watch work (prev/play/next)
- [ ] Watch app auto-launches when workout starts on phone
- [ ] Watch survives phone app going to background

### Cross-Device
- [ ] iPad shows HR from Watch (via iPhone relay)
- [ ] Stale data (>10s) shows "Waiting..." on iPad

### Visual
- [ ] No emoji characters in any control
- [ ] All touch targets ≥ 44pt
- [ ] Settings sections properly spaced and stacked
- [ ] Music card has clean shadow, proper border-radius

---

## Out of Scope

- Spotify integration (different SDK, different auth flow — v2 feature)
- Watch standalone mode (runs workout without iPhone — significant work)
- iPad Watch direct connectivity (Apple hardware limitation)
- Custom voice re-recording (use existing Grok-generated files)
- New exercise images (addressed in separate sprint)

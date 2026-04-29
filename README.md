# SimpleWorkoutGen

A workout builder and timer app for iOS and Apple Watch. Generate tailored workouts with warm-up, cooldown, and smart rest periods — then run them with a guided timer, voice cues, and live heart rate from your Apple Watch.

Also available as a [Progressive Web App](https://joehassell.github.io/homeworkout).

## Features

### Workout Generator
- **5 workout types** — Strength, HIIT, Conditioning, Functional, Yoga
- **Custom session lengths** — 15–180 minutes (presets + free input)
- **3 intensity levels** — Light, Moderate, High
- **1–4 sets** with intensity-scaled rest periods (60–180s)
- **Priority goals** — up to 3 goals shape the generator (strength, cardio, mobility, etc.)
- **Focus areas** — 3-state cycle (include / boost / exclude) for Push, Pull, Lower, Core, Full Body, Mobility
- **Equipment tiers** — Basic, Home Gym, Commercial with quick presets
- **Capability profile** — age, fitness level, mobility limits filter unsafe exercises
- **32 expert templates** — pre-designed workouts across all types
- **Smart warm-up** — type-specific movements scaled to session length, with pulse raiser and post-warm-up rest
- **5-minute cooldown** — biased toward muscles loaded in the main workout
- **Single-sided exercises** — 2x duration with mid-way "switch sides" audio + visual cue
- **Total-time math** — warm-up + 60s rest + main work + cooldown = exact selected duration

### Guided Timer
- Countdown timer with 3-2-1 audio beeps and voice cues
- Exercise images with fade-in animation on transitions
- Phase labels: Warm-up, Work, Rest, Cooldown
- Pause, skip, restart, and previous exercise controls
- Weight tracking per set for strength workouts
- Fullscreen mode on workout start
- HR zone display with coaching cues (with Apple Watch)

### Strength Tracking (Hevy-parity)
- Personal records (PRs) per exercise with animated badge
- Set types: Normal, Warm-up, Drop, AMRAP
- Per-set RPE (6-10) quick input
- Volume/tonnage tracking on Done screen
- Plate calculator (standard plates per side)
- 1RM calculator (Epley formula + percentage table)

### Yoga
- 5 styles: Vinyasa Flow, Hatha, Yin, Power, Restorative
- ~50 poses with Sanskrit names and narration
- Calm voice guides each breath and movement
- Gentle singing-bowl chimes between poses
- Yoga experience levels and equipment filtering

### Apple Watch Companion
- Live exercise name, countdown timer, and workout phase
- Heart rate monitoring from watch sensors
- Pause / Resume / Skip controls from your wrist
- Watch haptics for phase changes, countdown, and side switches
- Local countdown fallback when phone connection drops
- Automatic HealthKit workout session with accurate HR-based calories

### Apple Health / Fitness Integration
- Completed workouts saved to Apple Health
- Appears in the Fitness app activity rings
- MET-based calorie estimation (phone-only) or HR-based (with watch)
- Body weight and date of birth read from HealthKit (auto-fills profile)
- Live Activity on lock screen and Dynamic Island during workouts
- iCloud sync for sessions, settings, and PRs across devices

### Library
- **Programs** — collections of workouts (coming soon)
- **Workouts** — saved workouts with star ratings + 32 expert templates
- **Exercises** — browse all 114 exercises with filters, exclude/favourite
- **Export** — JSON, Markdown, CSV formats

### Personalisation
- **5 themes** — Dark, Midnight, Forest, High Contrast, Light
- **Font scaling** — 5 steps from 0.875x to 1.5x
- **Weekly plan** — 7-day suggested schedule based on goals
- **Surprise Me** — one-tap smart workout generation
- **Session history** — heatmap calendar, stats, past workout details
- **JSON backup** — export/import all sessions and settings
- **Apple Music** — mini-player control during workouts (iOS)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web app | Vanilla HTML/CSS/JS — single `index.html` (~3000 lines) |
| iOS shell | [Capacitor 8](https://capacitorjs.com) with Swift plugins |
| Watch app | Native SwiftUI (watchOS 10+) |
| Health | HealthKit + ActivityKit (Live Activities) |
| Connectivity | WatchConnectivity (WCSession) |
| Plugins | @capacitor/haptics, keyboard, status-bar |

## Getting Started

### Prerequisites

- macOS Sonoma or later
- Xcode (full IDE, not just CLI tools)
- Node.js (LTS or newer)
- CocoaPods (`brew install cocoapods`)
- GitHub CLI (`brew install gh`)

### Setup

```bash
git clone git@github.com:joehassell/homeworkout.git
cd homeworkout
npm install
```

### Run on iOS Simulator

```bash
npm run sync:ios    # builds www/ and copies to iOS
npm run open:ios    # opens Xcode
# In Xcode: Cmd+R to build and run
```

### Run as web app

```bash
npm run serve       # http://localhost:8080
# or just: open index.html
```

### Run on Apple Watch Simulator

In Xcode, select the **HomeWorkoutWatch** scheme, pick a watch simulator, and press Cmd+R. The watch app shows an idle screen until a workout is started on the paired iPhone.

## Project Structure

```
homeworkout/
├── index.html                    # Web app — UI + generator + timer
├── js/
│   ├── builder.js                # Work/rest interval calculations
│   ├── storage.js                # localStorage wrapper + JSON backup
│   └── history.js                # History view rendering
├── ios/
│   ├── App/
│   │   ├── App/
│   │   │   ├── AppDelegate.swift         # Audio session + WCSession activation
│   │   │   ├── Info.plist                # HealthKit privacy, background audio
│   │   │   ├── App.entitlements          # HealthKit + App Groups
│   │   │   └── Plugins/
│   │   │       ├── HealthKitPlugin.swift  # HK auth, workout save, Live Activity
│   │   │       └── WatchConnectivityPlugin.swift  # WCSession bridge to JS
│   │   ├── HomeWorkoutWatch/             # watchOS SwiftUI app
│   │   │   ├── WorkoutSessionManager.swift  # WCSession + HKWorkoutSession
│   │   │   └── Views/                    # ContentView, ActiveWorkout, Controls, Idle, HeartRate
│   │   └── SimpleWorkoutGenLiveActivity/ # Lock screen + Dynamic Island widget
│   │       └── SimpleWorkoutGenLiveActivity.swift
├── assets/
│   ├── icon-1024.png             # App icon source
│   └── splash-2732.png           # Launch splash source
├── capacitor.config.json
└── package.json
```

## App Identity

| Field | Value |
|-------|-------|
| Bundle ID | `com.nomaen.homeworkout` |
| Watch Bundle ID | `com.nomaen.homeworkout.watchkitapp` |
| Display Name | SimpleWorkoutGen |
| Category | Health & Fitness |
| Minimum iOS | 15.0 |
| Minimum watchOS | 10.0 |

## Generator Smoke Test

Verify all 80 workout configurations (4 types x 5 durations x 4 sets) produce valid workouts:

```bash
npm test  # or run the inline Python/Node harness in HANDOFF.md §6
```

Expected: `PASS 79+ FAIL 0 REFUSED 0-1`

## Privacy

SimpleWorkoutGen stores workout history in on-device `localStorage` only. No data is transmitted to external servers. When HealthKit is enabled, workout data is saved to Apple Health on the user's device. The app requests:

- **HealthKit read**: body weight, heart rate, workouts
- **HealthKit write**: completed workouts, active energy burned

No analytics, no tracking, no accounts, no cloud sync.

## License

UNLICENSED — All rights reserved.

## Author

Joe Hassell ([joehassell@icloud.com](mailto:joehassell@icloud.com))

# PDR: Workout Builder v2 — Warm-up, Cooldown, Focus, Fullscreen, Theming, Bug Fixes

**App:** Home Workout Builder
**Repo:** joehassell.github.io/homeworkout
**Author:** Joe Hassell
**Status:** Draft
**Date:** 2026-04-26

---

## 1. Summary

A consolidated v2 product requirements document covering the next round of functional and quality-of-life work on Home Workout Builder. It bundles three categories:

1. **Structural session changes** — workout-specific warm-up, cooldown, set-level rest, single-sided exercise handling, and set-timer countdowns that make the generated session safer and more usable.
2. **Setup and personalisation** — focus-area cycling (include / increase / exclude), colour palette choice, font scaling, and fullscreen toggle.
3. **Bug fixes** — iOS bottom-nav obscuring the "Generate Workout" button, and readability of the "next exercise" caption during workouts.

The intent is one coherent release: setup gets richer (focus + theming), execution gets safer (warm-up, set-rest, side-switch cues), and the iOS experience stops fighting the user (nav overlap, fullscreen, larger text).

## 2. Problem & Motivation

The current generator is fast but blunt:

- **Cold starts.** No warm-up. No cooldown. Users either get hurt or improvise, both of which defeat "press generate, press start."
- **Flat pacing.** No rest between sets, no set-level countdown, single-sided exercises end before the second side has a chance.
- **iOS friction.** The bottom nav (Build / History / Settings) overlaps the "Generate Workout" CTA on smaller iPhone viewports, and key text is too small at arm's length.
- **One-size personalisation.** No way to bias the generator toward a body region, no theme choice, no font scaling, no fullscreen.

This PDR addresses all of these in a single release so the v2 narrative is "the app now respects how you actually train and how you actually use it on a phone."

## 3. Goals

- Every generated session has a tailored warm-up and a tailored cooldown.
- Set-level pacing (countdown + rest) matches the intensity of the work.
- Single-sided exercises run the right length and prompt a side switch.
- Setup lets the user bias the generator by body region using a 3-state cycle.
- The app can run fullscreen with a clear toggle.
- Theme palette and base font size are user-controlled.
- The "Generate Workout" button is never obscured by chrome on iOS.

### Non-goals

- Custom warm-up or cooldown editing (deferred).
- Per-exercise palette overrides.
- Replacing the existing exercise library or generator architecture.
- Adaptive pacing based on prior session fatigue.

## 4. Design Principles

1. **Mirror the working session.** Warm-up rehearses the patterns of the main workout at lower intensity. Cooldown closes them out without repeating them.
2. **Predictable total time.** The session length the user picks equals what is scheduled end-to-end, including warm-up, post-warm-up rest, set rests, and cooldown.
3. **No hidden controls on iOS.** Persistent nav must not cover primary CTAs at any iPhone viewport.
4. **Personalisation without fragmentation.** Theme, font, and focus areas are session-level preferences — they don't fork the data model.
5. **Cycle, don't hide.** Multi-state controls (focus areas) cycle visibly through their states rather than hiding options behind menus.

---

## 5. Bug Fixes

### 5.1 iOS — "Generate Workout" button obscured by bottom nav

**Symptom.** On iOS Safari and the future WKWebView shell, the bottom nav bar (Build / History / Settings) overlaps the "Generate Workout" button on the Setup screen, especially on devices with a home indicator (iPhone X and later) and when the keyboard is dismissed.

**Root cause.** The setup form uses page-level scrolling but the CTA sits in the page flow with no bottom padding accounting for `env(safe-area-inset-bottom)` plus the nav bar height.

**Fix.**

- Add bottom padding to the scroll container equal to `nav-height + env(safe-area-inset-bottom) + 16px`.
- Pin the "Generate Workout" CTA inside its own sticky footer above the nav bar, OR ensure the page scrolls so the CTA always clears the nav. Pinned footer is preferred — the CTA is the primary action, it should always be tappable.
- Verify on: iPhone SE (small viewport, no home indicator), iPhone 13 / 15 (home indicator), iPad (nav still bottom-anchored).

**Acceptance.**

- The "Generate Workout" button is fully visible and tappable on every supported iOS viewport without manual scrolling.
- No regression on Android Chrome or desktop browsers.

### 5.2 "Next exercise" caption is too small

**Symptom.** During a workout, the small text at the bottom of the timer screen ("Next: …") is too small to read at arm's length on a phone propped on the floor.

**Fix.**

- Increase the base font size for the next-exercise caption to at least `1.25rem` (20px at default root font size) and bold the exercise name.
- Respect the new user-controlled font scale (see §6.7) so the caption scales with the rest of the display.
- Maintain at least 16px bottom margin above the nav so it doesn't get clipped.

**Acceptance.**

- The next-exercise caption is legible from ~2m away on an iPhone in portrait.
- The caption scales with the font-size control.

---

## 6. New Features

### 6.1 Workout-Specific Warm-up *(carries forward the prior PDR — see Appendix A)*

The warm-up PDR previously drafted is folded into this release in full. Headline rules:

- Warm-up duration scales with session length, **floor 3 min**.
- No rest between warm-up movements.
- Mandatory **60 s post-warm-up rest** before the first working exercise.
- Total session time = warm-up + 60 s rest + main work + cooldown.
- Movement pool is filtered by selected equipment and tagged by workout type.
- Strength sessions with a loaded first exercise show a one-time ramp-up text prompt during the post-warm-up rest.

Full requirements, data model, UI rules, and acceptance criteria are reproduced verbatim in **Appendix A** so this PDR remains the single source of truth.

### 6.2 Cooldown

Every generated session ends with a fixed **5-minute cooldown** with **no rest periods** between movements.

**Rules.**

- Duration: fixed 5 min for every workout type and every session length.
- No rest between cooldown movements — continuous, like the warm-up.
- Cooldown movements are drawn from a dedicated cooldown pool tagged for low-intensity mobility, static stretching, breathing.
- **No repeats from the main workout.** A cooldown movement MUST NOT appear in either the warm-up or the main work block of the same session.
- Movements are biased toward the muscle groups loaded by the main workout (e.g., a lower-body strength session ends with quad / hip-flexor / glute stretches).
- Equipment filter still applies — bodyweight fallbacks always exist.

**Total time.**

```
total_time = warmup + 60s post-warmup rest + main_work + cooldown(300s)
```

The main work block is shortened so total_time equals the user-selected session length.

**UI.**

- Phase label on the timer screen: "Cooldown 1 of N".
- Weight input hidden during cooldown.
- Skip inside cooldown advances to the next cooldown movement; skipping the last one ends the session.
- Cooldown exercises are not counted in the "Exercises" total on the Done screen — only main work.

**Acceptance.**

- Every generated workout has a non-empty `cooldown` array.
- Cooldown duration is exactly 300 s.
- No cooldown movement also appears in `warmup` or `exercises` for the same session.
- No rest between consecutive cooldown movements.
- Phase label and totals reflect cooldown correctly.

### 6.3 Set Timer Countdown

When the active phase has a fixed duration (timed work intervals, warm-up movements with seconds-based duration, cooldown movements), the timer screen shows a **countdown** with audible cues at 3-2-1.

**Rules.**

- Countdown applies wherever the phase has a `duration_seconds` value.
- For strength count-up sets (existing behaviour) the countdown does NOT replace the count-up — those keep their "Done" button.
- Audible cue: existing 3-2-1 beep pattern. Voice cue if voice is enabled.
- Visual cue: the countdown digits enlarge in the final 3 s.

**Acceptance.**

- Every timed phase shows a countdown.
- Strength rep-target sets retain count-up behaviour.
- 3-2-1 beep fires on every timed phase end.

### 6.4 Rest Period Between Sets (intensity-scaled)

Currently rest is a single fixed value. v2 introduces a **per-set rest** that varies between **60 s and 180 s** based on the intensity of the set just completed.

**Mapping.**

| Set intensity         | Rest after set |
|-----------------------|----------------|
| Light / mobility      | 60 s           |
| Moderate              | 90 s           |
| High (heavy strength, max-effort HIIT) | 120 s |
| Very high (top sets, all-out intervals) | 180 s |

**Source of intensity.**

- Strength: derived from the rep target band (3–5 reps → very high; 6–8 → high; 10–12 → moderate).
- HIIT: derived from the work:rest ratio and exercise difficulty tag.
- Conditioning / Functional: default to 60–90 s unless the exercise is tagged high-intensity.

**Rules.**

- Set rest applies between **sets of the same exercise** and between exercises in the main work block.
- It does NOT apply inside the warm-up or cooldown — those remain continuous.
- Set rest is reflected in the total scheduled time. The generator must allocate set rests when sizing the main work block so total_time equals the user-selected session length.
- The +10 s rest control still works on top of the scheduled rest.

**UI.**

- Rest screen shows the rest length and the next exercise name (existing behaviour).
- A small badge shows why this rest is the length it is (e.g., "Heavy set — 2 min").

**Acceptance.**

- Every set transition in the main work block has a rest of 60–180 s based on the table above.
- Total scheduled time including all set rests equals the user-selected session length.
- Warm-up and cooldown still have zero internal rest.

### 6.5 Focus Areas in Setup (3-state cycle)

Setup gains a **Focus** section: a row of body-region buttons that cycle through three states on tap.

**States.**

| State       | Visual                | Effect on generator                                                |
|-------------|-----------------------|---------------------------------------------------------------------|
| Include     | Default fill, neutral | Region is eligible at normal weighting (current behaviour).         |
| Increase    | Green tint            | Region is over-weighted — more exercises drawn from this pool.      |
| Exclude     | Red tint              | Region is excluded — no exercises drawn from this pool.             |

Tapping a button cycles Include → Increase → Exclude → Include.

**Initial regions.**

- Upper body (push)
- Upper body (pull)
- Lower body
- Core
- Full body / compound
- Mobility / posterior chain

(Final region taxonomy should match the existing exercise category tags. If a region has no exercises after equipment filtering, the button is disabled with a tooltip.)

**Generator behaviour.**

- Excluded regions contribute zero exercises to warm-up, main, and cooldown pools.
- Increased regions are weighted ~2× when the generator picks from the pool.
- If all regions are excluded, the Generate button is disabled with a helper message.
- If a workout type has a region requirement (e.g., Strength with all upper-body excluded but only upper-body equipment available) the generator falls back gracefully and surfaces a notice.

**UI.**

- New "Focus" section in Setup, between workout type and equipment.
- Buttons match the existing pill style. Colour tints use the active palette (see §6.6).
- State persists in localStorage so the user's last focus selection is remembered.

**Acceptance.**

- Tapping a focus button cycles through 3 states with clear colour change.
- Generator respects exclude (0 exercises) and increase (over-weighted) signals.
- Generator never produces an empty workout — at least one region must be selectable.
- Focus state persists across reloads.

### 6.6 Colour Palette Options

Settings gains a **Theme** picker.

**Palettes (initial set).**

- **Dark (current default)** — `#0a0a0f` background, accent-blue.
- **Midnight** — deep navy background, cyan accent.
- **Forest** — dark green background, lime accent.
- **High contrast** — pure black background, white text, yellow accent (accessibility).
- **Light** — off-white background, dark text, blue accent.

**Rules.**

- Palettes are defined as a CSS custom-property set (`--bg`, `--fg`, `--accent`, `--accent-2`, `--include`, `--increase`, `--exclude`).
- All existing UI references the custom properties, not hard-coded hex.
- Selected palette persists in localStorage and (in Sprint 2) syncs via iCloud.
- Applies app-wide including timer, rest, focus tints, and history heatmap.

**UI.**

- Settings → Theme section with a row of palette swatches. Tap to apply immediately.
- The active palette is marked with a checkmark.

**Acceptance.**

- Switching palette updates the entire app without reload.
- All five palettes meet WCAG AA contrast for body text and primary CTAs.
- Focus-area tints (green / red) remain distinguishable in every palette.

### 6.7 Font Size Control

Settings gains a **Font size** stepper (− / current / +) that scales the entire app.

**Rules.**

- Implemented by setting `:root { font-size: ... }` so all `rem`-based sizing scales together.
- Steps: 0.875×, 1.0× (default), 1.125×, 1.25×, 1.5×.
- Persists in localStorage.
- Applies app-wide including timer digits, exercise names, and the next-exercise caption (§5.2).
- Layout must not break at the largest step on the smallest supported viewport (iPhone SE).

**UI.**

- Settings → Display → Font size with three buttons: A−, A, A+.
- Live preview: a sample line above the buttons updates as the user steps.

**Acceptance.**

- All text scales with the control.
- No layout overflow or clipped controls at 1.5×.
- Setting persists across reloads.

### 6.8 Fullscreen on Workout Start + Toggle

When the user starts a workout, the app enters fullscreen. A button on the timer screen toggles fullscreen on and off.

**Rules.**

- On "Start Workout", call the Fullscreen API (`document.documentElement.requestFullscreen()`).
- On supported browsers, fullscreen hides browser chrome and the OS status bar where possible.
- A small fullscreen toggle button appears in the timer header (icon-only, top-right).
- Exiting fullscreen (via toggle, ESC, or system gesture) does not end the workout.
- iOS Safari does not support the Fullscreen API for arbitrary elements. On iOS:
  - Use the existing PWA "Add to Home Screen" path for true fullscreen.
  - In-browser, hide as much chrome as possible (`apple-mobile-web-app-capable` meta tag, scroll to top to dismiss the URL bar) and show a one-time hint suggesting Add to Home Screen.
  - In the future WKWebView shell (Sprint 2), the toggle hides/shows the native nav bar via the JS-Swift bridge.

**UI.**

- Fullscreen toggle: icon button, top-right of timer screen. Icon swaps between expand / collapse.

**Acceptance.**

- "Start Workout" enters fullscreen on browsers that support it.
- Toggle button works in both directions.
- Exiting fullscreen does not pause or end the workout.
- iOS in-browser fallback hides as much chrome as the platform allows.

### 6.9 Single-Sided Exercises — Double Duration + Mid-way Switch Cue

Single-sided exercises (e.g., single-arm row, side plank, single-leg glute bridge, lunges per side) currently run for the same duration as bilateral exercises, leaving no time for the second side.

**Rules.**

- Exercises tagged `single_sided: true` in the exercise library run for **2× the configured work interval**.
- At the **midpoint** of the interval, the app fires a "Switch sides" cue:
  - Voice cue if voice is enabled ("Switch sides").
  - Audible chime regardless of voice setting.
  - Visual cue: large "Switch sides" overlay for 2 s.
- Rep-target strength sets handle this differently — the rep target is per side, and the count-up "Done" button is tapped after each side. The mid-way cue does not apply; instead, the UI shows "Side 1 / Side 2" alongside the rep target.
- Set rest (§6.4) applies after the full bilateral set, not after each side.

**Library impact.**

- Each existing exercise must be audited and tagged `single_sided: true | false`. New exercises require the tag.

**Acceptance.**

- Every single-sided timed exercise runs for 2× the work interval.
- "Switch sides" cue fires at the midpoint with both audio and visual signal.
- Strength rep-target single-sided sets show "Side 1 / Side 2" prompts and accept two "Done" taps.
- Bilateral exercises are unchanged.

---

## 7. Data Model Changes

Extend the generated workout shape:

```json
{
  "type": "Strength",
  "duration_seconds": 1800,
  "focus": {
    "upper_push": "include",
    "upper_pull": "increase",
    "lower": "include",
    "core": "exclude",
    "full_body": "include",
    "posterior": "include"
  },
  "warmup": [ /* see Appendix A */ ],
  "post_warmup_rest_seconds": 60,
  "exercises": [
    {
      "phase": "main",
      "name": "Single-Arm Dumbbell Row",
      "single_sided": true,
      "duration_seconds": 60,
      "set_rest_seconds": 120,
      "intensity": "high",
      "equipment": "dumbbell",
      "reps": 8
    }
  ],
  "cooldown": [
    {
      "phase": "cooldown",
      "name": "Seated Forward Fold",
      "duration_seconds": 45,
      "equipment": "bodyweight"
    }
  ],
  "settings_snapshot": {
    "palette": "dark",
    "font_scale": 1.0
  }
}
```

`single_sided`, `set_rest_seconds`, and `intensity` are new on main-phase exercises. `cooldown` and `focus` are new top-level keys. `settings_snapshot` is captured at session-start so history can render past sessions in the theme they were performed in (optional v1; required v2).

## 8. UI / UX Summary

| Surface       | Change                                                                 |
|---------------|------------------------------------------------------------------------|
| Setup         | New Focus section (6.5). CTA fix (5.1). Bottom padding for nav.        |
| Timer         | Countdown styling (6.3). Larger next-exercise caption (5.2). Fullscreen toggle (6.8). Set-rest reason badge (6.4). Switch-sides overlay (6.9). |
| Rest          | Length varies (6.4). Reason badge.                                     |
| Warm-up phase | Phase label, weight hidden, continuous (Appendix A).                   |
| Cooldown phase| Phase label, weight hidden, continuous (6.2).                          |
| Done          | Cooldown excluded from exercise count. Existing RPE/notes unchanged.   |
| Settings      | New Theme picker (6.6). New Font size control (6.7).                   |
| History       | Heatmap and list re-themed with active palette.                        |

## 9. Total-Time Math

For every generated workout:

```
total_time =
    warmup_duration            // §6.1, ≥ 180s, scaled by session length
  + 60                          // post-warm-up rest
  + main_work_duration          // including all set rests at 60–180s
  + 300                         // cooldown
```

`main_work_duration` is the variable the generator solves for. The user-selected session length MUST equal `total_time` exactly (rounded to the nearest second).

If the user picks a session length too short to fit minimum warm-up + rest + cooldown + at least one main exercise, the generator surfaces an error and refuses to generate.

## 10. Acceptance Criteria (consolidated)

- [ ] iOS: "Generate Workout" button is fully visible and tappable on iPhone SE, iPhone 13/15, and iPad without scrolling. (5.1)
- [ ] Next-exercise caption is legible at arm's length and scales with font control. (5.2, 6.7)
- [ ] Every generated workout has a non-empty `warmup` array meeting Appendix A. (6.1)
- [ ] Every generated workout has a 5-min `cooldown` array with no internal rest and no overlap with warm-up or main work. (6.2)
- [ ] Every timed phase shows a countdown with 3-2-1 audio cue. (6.3)
- [ ] Every set transition in the main block has a rest of 60–180 s based on intensity. (6.4)
- [ ] Total scheduled time = user-selected session length, including warm-up, rest, set rests, and cooldown. (6.4, 9)
- [ ] Focus buttons cycle Include → Increase → Exclude with visible colour change; generator respects all three. (6.5)
- [ ] Five palettes ship; switching applies app-wide without reload; all meet WCAG AA. (6.6)
- [ ] Font size control offers 5 steps; layout holds at 1.5× on iPhone SE. (6.7)
- [ ] "Start Workout" enters fullscreen on supported browsers; toggle works both ways; exit doesn't end workout. (6.8)
- [ ] Single-sided exercises run for 2× duration with a mid-way "Switch sides" cue (audio + visual). (6.9)
- [ ] All theme and font preferences persist across reloads.

## 11. Open Questions

1. Should focus weighting be exposed as a slider (e.g., 1×–3×) instead of a single "Increase" state? Likely no for v1 — the 3-state cycle is the whole point.
2. Should set rest be user-overridable in Settings (e.g., "always use 90 s")? Defer — intensity-scaled defaults first, override later if asked for.
3. Should fullscreen be opt-in via Settings rather than automatic on workout start? Recommend automatic with a toggle so the default is the right one.
4. Should the cooldown duration scale with session length like warm-up does, or stay fixed at 5 min? Spec is fixed; revisit only if 5 min feels wrong on 15-min sessions.
5. Should `settings_snapshot` be required from day one so historical sessions render in their original theme? Defer to v1.1; not load-bearing.
6. Should single-sided strength sets fire the audio chime even when voice is off? Spec says yes — a chime is content-free and useful as a pacing cue.

## 12. Out of Scope (v2)

- Custom warm-up / cooldown editing.
- Per-exercise palette overrides.
- Per-user palette creation.
- Adaptive set rest based on heart rate (waits for Watch in Sprint 3).
- Exporting palette + font preferences as part of the JSON backup (nice-to-have, not required).

---

## Appendix A — Workout-Specific Warm-up (full prior PDR, included verbatim)

### A.1 Summary

Add a workout-specific warm-up phase that runs before every generated session. The warm-up tailors its movements to the selected workout type and available equipment, scales its duration to session length, and feeds into the existing exercise timer flow as a tagged sub-phase. After the warm-up, a fixed 1-minute rest precedes the main workout.

### A.2 Problem & Motivation

The current generator skips warm-up entirely. Users either (a) jump into loaded or high-intensity work cold — raising injury risk and reducing performance — or (b) improvise their own warm-up, which defeats the "press generate, press start" simplicity that makes the app useful. A built-in, workout-specific warm-up closes this gap without adding friction.

### A.3 Goals

- Generate a warm-up that matches the workout type, equipment, and intensity.
- Rehearse the same movement patterns the user is about to perform under load or at speed.
- Slot into the existing timer/exercise flow with no new UI paradigm.
- Be reflected accurately in the total session time shown to the user.

#### Non-goals

- Custom warm-up editing (v1).
- Cooldown or post-session mobility (separate feature — now §6.2 of this v2 PDR).
- Warm-up-specific weight tracking.

### A.4 Design Principles

1. **Mirror the working session.** Warm-up movements should rehearse the patterns of the main workout at lower intensity and full range of motion.
2. **Two-block structure.** Pulse raiser → movement prep. Strength sessions add a third optional block (ramp-up sets) handled by prompt rather than timer.
3. **No rest inside the warm-up.** Movements run continuously back-to-back. Rest happens once, after the warm-up completes.
4. **Predictable total time.** The duration the user selects must equal what the app schedules end-to-end, including warm-up and the post-warm-up rest.

### A.5 Functional Requirements

#### A.5.1 Warm-up Duration Scaling

Warm-up duration scales with session length, with a hard floor of 3 minutes:

| Session Length | Warm-up Duration |
|----------------|------------------|
| 15 min         | 3 min (floor)    |
| 20 min         | 3 min (floor)    |
| 30 min         | 4 min            |
| 45 min         | 5 min            |
| 60 min         | 6 min            |

**Hard rule:** Warm-up MUST NOT be shorter than 3 minutes under any circumstance.

#### A.5.2 No Rest Inside Warm-up

The warm-up runs as a continuous block. There are no rest intervals between warm-up movements. The timer transitions directly from one warm-up exercise to the next.

#### A.5.3 Mandatory Post-Warm-up Rest

After the final warm-up movement, the app inserts a fixed **60-second rest** before the first working exercise. This rest is non-skippable in v1 (revisit in v2 — see Open Questions). It is labelled distinctly in the UI (e.g. "Rest — get ready") so the user knows the working session is about to start.

#### A.5.4 Total Workout Time Calculation

The duration shown in the UI and used for scheduling MUST include warm-up + 60 s + main work. In this v2 PDR the formula extends to include cooldown — see §9.

#### A.5.5 Warm-up Selection by Workout Type

Each workout type pulls from a tagged warm-up pool. The selector picks movements until the warm-up duration is filled, biased toward patterns that match the main workout.

##### Strength
- Bodyweight squats (8–10 reps)
- Glute bridges (10 reps)
- Push-ups or incline push-ups (5–8 reps)
- World's greatest stretch (3 each side)
- Scap pull-ups *(requires chin-up bar)* (5 reps)
- Empty bar good mornings *(requires barbell)* (8 reps)

##### HIIT
- Jumping jacks (30 s)
- Bodyweight squats (10 reps)
- Mountain climbers (20 s)
- Reverse lunges (5 each leg)
- Inchworms (5 reps)

##### Conditioning
- Leg swings (10 each, front-back + side-side)
- Arm circles (10 forward, 10 back)
- Hip circles (5 each direction)
- Bodyweight squats (10 reps)
- Easy skipping or jog-in-place (45 s)

##### Functional
- World's greatest stretch (3 each side)
- Inchworms with push-up (5 reps)
- Bodyweight squats (8 reps)
- Reverse lunges with twist (5 each leg)
- Bird-dogs (5 each side)

#### A.5.6 Pulse Raiser (First Movement)

Every warm-up opens with a 60–90 s pulse raiser before movement prep. Default options: jumping jacks, high knees, marching, shadow boxing. If a skipping rope is in the equipment list, easy skipping is preferred.

#### A.5.7 Equipment Filtering

Warm-up movements are filtered against the user's selected equipment. If a movement requires equipment that isn't available, it's excluded from the pool. Bodyweight-only fallbacks always exist for every workout type so a warm-up can always be generated.

#### A.5.8 Strength Ramp-up Sets

For Strength sessions where the first main exercise uses loaded equipment (dumbbell, kettlebell, barbell), the app displays a one-time prompt at the end of the warm-up rest:

> "Before your first working set, do 2 light sets of [first exercise] (~50% and ~70% of your working weight)."

This is a text prompt only in v1 — not timed exercises.

### A.6 Data Model (warm-up)

```json
{
  "warmup": [
    {
      "phase": "warmup",
      "name": "Jumping Jacks",
      "duration_seconds": 60,
      "equipment": "bodyweight",
      "reps": null
    },
    {
      "phase": "warmup",
      "name": "Bodyweight Squat",
      "duration_seconds": 30,
      "equipment": "bodyweight",
      "reps": 10
    }
  ],
  "post_warmup_rest_seconds": 60
}
```

### A.7 UI / UX (warm-up)

- **Phase label.** During warm-up: "Warm-up 1 of N". During post-warm-up rest: "Rest — get ready" with a 60 s countdown.
- **Hide weight input** during warm-up phases.
- **Skip behaviour.** Skip inside warm-up advances to the next warm-up movement, not to main. Skipping the final movement advances to the post-warm-up rest.
- **Total time** displayed reflects warm-up + rest + main.
- **Done screen.** Warm-up exercises are not counted in the "Exercises" total.

### A.8 Open Questions (warm-up)

1. Should the post-warm-up rest be skippable? Current spec: no.
2. Should warm-up intensity track Light / Moderate / High? Defer to v1.1.
3. Should the user be able to disable warm-up entirely? Recommend no.
4. Should ramp-up sets become real timed exercises in v2 once weight is known?

### A.9 Out of Scope (warm-up v1)

- Custom warm-up editing or saved templates.
- Per-warm-up RPE logging.
- Adaptive warm-up based on prior session fatigue or soreness.

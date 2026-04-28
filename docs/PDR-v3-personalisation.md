# PDR v3 — Personalisation, Safety, and Hevy-Class Strength

**App:** Home Workout Builder
**Repo:** joehassell/homeworkout
**Author:** Joe Hassell
**Status:** Draft
**Date:** 2026-04-28
**Builds on:** PDR v2 (`PDR.md`), shipped iOS shell (HealthKitPlugin, WatchConnectivityPlugin, Watch app, Live Activity), `js/yoga.js`, `js/builder.js`.

---

## 0. Reading guide for Claude Code CLI

Each numbered feature in §6 is independently shippable. The recommended build order is in §11. Every feature has:

- **What** — the requirement.
- **Why** — the user need.
- **Where it ships** — Web / iOS / Watch (per §3).
- **Data model deltas** — new fields on existing structures.
- **UI surface** — which screen.
- **Acceptance** — checkable bullets.

Pull this doc up at the start of each feature branch. Don't bundle features unless they share a data model change.

## 1. Summary

v3 turns the app from a workout *generator* into a workout *coach* tailored to the person using it. The core change is a **capability profile** derived from age, weight, height, fitness self-report, and (optionally) HealthKit, that filters and weights every exercise the generator considers. On top of that profile we add: priority goals, exercise whitelist/blacklist, Hevy-parity strength tracking, expert-designed templates, a weekly plan, Apple Watch HR-zone targeting with dynamic rest, music control, an enriched yoga module, custom workout durations, "Surprise me," and a save/rate/export workouts catalogue.

The driving feedback came from a 70+ year-old user (Joe's mum) who tried the TestFlight build, liked the format, but identified that some generated exercises weren't safe for her. The capability profile makes "don't show plyometrics to an 80 year old" a hard filter, not a polite request.

## 2. Goals & non-goals

### Goals
- **Safety first.** No generated exercise is ever inappropriate for the user's age, BMI, fitness level, or stated limitations.
- **Personalisation without friction.** Setup adds at most one new screen; everything else is opt-in detail.
- **Hevy-class strength tracking** in the iOS app — supersets, PRs, plate maths, working sets, body measurements.
- **One coach across the week.** Goals + history → suggested next session and a 7-day plan.
- **Yoga becomes first-class.** Equipment gating, experience level, descriptions, pose icons, and a generation bug fix.

### Non-goals
- Social features, leaderboards, sharing.
- AI/LLM exercise generation in the client.
- Server-side accounts. Persistence stays local + iCloud (Sprint 2).
- Replacing Apple Fitness as a holistic activity tracker.

## 3. Platform allocation matrix

| Feature | Web (PWA) | iOS app | Watch app |
|---------|-----------|---------|-----------|
| Capability profile (manual entry) | ✅ | ✅ | — |
| Capability profile (HealthKit auto-fill) | — | ✅ | — |
| Priority goals | ✅ | ✅ | — |
| Exercise library (whitelist / blacklist / icons) | ✅ | ✅ | — |
| Custom workout duration | ✅ | ✅ | — |
| Cooldown improvements (length scaling, relevance) | ✅ | ✅ | — |
| Tiered equipment (Basic / Home / Commercial) | ✅ | ✅ | — |
| Expert-designed workout templates | ✅ | ✅ | — |
| Hevy-class strength tracking (full) | ⚠️ subset | ✅ | controls only |
| Save / rate / export workouts (JSON, MD, CSV, PDF) | ✅ | ✅ | — |
| Weekly plan + Surprise me | ✅ | ✅ | — |
| Yoga rebuild (equipment gating, experience, icons) | ✅ | ✅ | — |
| Add-exercise (+) on generated workout | ✅ | ✅ | — |
| HR zone targeting + dynamic rest | — | ✅ paired | ✅ |
| HR zone swipeable screen | — | — | ✅ |
| Music control (Apple Music / Spotify) | — | ✅ | ✅ controls |

*"⚠️ subset"* on web for strength means: sets / reps / weight / PRs land in the PWA via localStorage. Plate calculator, body measurements, and Hevy-style routines are iOS-only because they benefit from HealthKit and iCloud sync.

## 4. Design principles

1. **Filter then pick.** The generator never picks an unsafe exercise and then warns — it never sees it.
2. **Capability is data, not opinion.** Every exercise is tagged with measurable demands (impact, joint load, complexity, balance need). The user's profile sets caps. The match is mechanical.
3. **Show, don't gate.** A user can override any filter explicitly, but never accidentally. "Show me restricted exercises" is a deliberate Settings toggle.
4. **Goals shape weighting, not safety.** A goal can never override a capability cap.
5. **HealthKit is opt-in convenience, not required.** Every metric the app uses can be entered by hand.
6. **Yoga gets the same rigour as strength.** Equipment, experience, anatomy — same care.

---

## 5. The capability profile (the core v3 change)

This is the most important section in this PDR. Get this right and every other feature falls out of it.

### 5.1 Profile inputs

| Field | Source(s) | Required | Notes |
|-------|-----------|----------|-------|
| `dob` or `age_band` | HealthKit `dateOfBirthComponents`, or manual band picker | Yes | Bands: under-18 / 18-39 / 40-54 / 55-69 / 70+ |
| `weight_kg` | HealthKit `bodyMass`, or manual | Yes | |
| `height_cm` | HealthKit `height`, or manual | Yes | |
| `bmi` | derived | Yes | |
| `fitness_level` | manual self-report | Yes | `untrained` / `beginner` / `intermediate` / `advanced` |
| `vo2max` | HealthKit `vo2Max` (optional sanity check) | No | |
| `recent_activity_minutes_7d` | HealthKit `appleExerciseTime` last 7 days | No | Used for fitness-level sanity nudges |
| `floor_work_ok` | manual checkbox | Yes | "I can comfortably get up and down from the floor" |
| `mobility_limits` | manual multi-select | No | knees / hips / shoulders / lower back / wrists / ankles / neck |
| `active_injuries` | manual free text | No | Surfaces a banner on the timer screen reminding the user |
| `pregnancy_safe_only` | manual toggle | No | If on: filters to a curated pregnancy-safe pool, no supine after 16 weeks |

### 5.2 Per-exercise demand tags (new fields on every exercise in `DB`)

| Tag | Values | What it means |
|-----|--------|---------------|
| `impact` | `none` / `low` / `medium` / `high` | Ground-reaction force. Plyo = high. Walking = none. |
| `complexity` | `1`–`5` | Skill required. Wall sit = 1. Handstand = 5. |
| `joint_load` | `low` / `medium` / `high` | Cumulative joint stress at moderate intensity. |
| `cv_demand` | `low` / `medium` / `high` | Cardiovascular demand. |
| `requires_balance` | bool | True if a fall is plausible (single-leg, balance work). |
| `requires_floor` | bool | Requires getting up/down from the floor. |
| `min_fitness` | `untrained` / `beginner` / `intermediate` / `advanced` | Minimum fitness level at which the generator will pick this. |
| `bmi_max_high_impact` | number / null | If `impact >= medium`, exclude when `bmi > this`. |
| `pregnancy_safe` | `yes` / `early_only` / `no` | Used when `pregnancy_safe_only`. |
| `contraindicated_for` | array of strings | e.g. `["lower_back","knees"]` — exclude if the user reported that limit. |

Every existing exercise must be audited and tagged. Yoga poses inherit the same tags. The library audit is its own task — see §6.4 and §11.

### 5.3 Capability caps (derived from profile)

The profile yields a cap object. Generator only picks exercises that satisfy *all* caps.

```js
function deriveCaps(profile) {
  const { age_band, fitness_level, bmi, floor_work_ok, mobility_limits } = profile;

  const FITNESS_RANK = { untrained: 0, beginner: 1, intermediate: 2, advanced: 3 };
  const fitness = FITNESS_RANK[fitness_level];

  // Base caps from fitness
  let complexity_cap = [2, 3, 4, 5][fitness];
  let impact_cap     = ['low','medium','high','high'][fitness];
  let joint_cap      = ['low','medium','high','high'][fitness];
  let cv_cap         = ['low','medium','high','high'][fitness];

  // Age tightens caps for untrained / beginner only.
  if (age_band === '70+') {
    complexity_cap = Math.min(complexity_cap, 2);
    impact_cap     = capLower(impact_cap, 'low');
    joint_cap      = capLower(joint_cap, 'low');
  } else if (age_band === '55-69' && fitness <= 1) {
    complexity_cap = Math.min(complexity_cap, 3);
    impact_cap     = capLower(impact_cap, 'medium');
  }

  // BMI tightens impact regardless of fitness.
  if (bmi >= 35) impact_cap = 'low';
  else if (bmi >= 30 && fitness <= 1) impact_cap = capLower(impact_cap, 'low');

  return {
    complexity_cap, impact_cap, joint_cap, cv_cap,
    no_floor: !floor_work_ok,
    contraindicated: mobility_limits || [],
  };
}
```

The numbers in this snippet are the v3 starting values. Tune in §6.1.5.

### 5.4 Filter pass

Before any pool sampling, the generator runs a filter pass:

```js
function isAllowed(ex, caps, profile) {
  if (RANK[ex.impact] > RANK[caps.impact_cap]) return false;
  if (RANK[ex.joint_load] > RANK[caps.joint_cap]) return false;
  if (RANK[ex.cv_demand] > RANK[caps.cv_cap]) return false;
  if (ex.complexity > caps.complexity_cap) return false;
  if (caps.no_floor && ex.requires_floor) return false;
  if (FITNESS_RANK[ex.min_fitness] > FITNESS_RANK[profile.fitness_level]) return false;
  if (ex.bmi_max_high_impact && profile.bmi > ex.bmi_max_high_impact && RANK[ex.impact] >= RANK['medium']) return false;
  if (caps.contraindicated.some(c => ex.contraindicated_for?.includes(c))) return false;
  if (profile.pregnancy_safe_only && ex.pregnancy_safe === 'no') return false;
  if (settings.exercise_blacklist.includes(ex.name)) return false;
  if (settings.exercise_whitelist_only && !settings.exercise_whitelist.includes(ex.name)) return false;
  return true;
}
```

If the filter pass leaves a workout type with too few exercises to fill the requested duration, the generator surfaces a clear message: *"Your profile is more conservative than this workout type allows. Try a lower intensity or a different workout type."* — never silently pad with unsafe choices.

### 5.5 Settings UI for the profile

New "Profile" section at the top of Settings. Two sub-blocks:

- **About me** — age band, weight, height, fitness level, floor-work toggle, mobility limits multi-select. On iOS: a "Fill from Health" button that requests `read` permission for DOB, body mass, height, VO2max and writes the values into the form.
- **Exercise comfort** — pregnancy toggle, override toggle ("Show exercises my profile excludes" — default off, with a confirmation dialog).

The first time a user opens the app post-update, prompt them through this once. If they skip, default to **untrained / 40-54 / no floor work / no limits** — the most conservative reasonable default.

### 5.6 Acceptance for the capability system

- [ ] Every exercise in `DB` and `YOGA_DB` has all demand tags populated. Schema validation script in CI.
- [ ] An untrained 70+ user with BMI 32 never sees: plyometrics, single-leg balance, anything `complexity ≥ 3`, anything `impact ≥ medium`, anything requiring floor work (if they set `floor_work_ok=false`).
- [ ] An advanced 30-year-old user with BMI 23 sees the full library.
- [ ] HealthKit auto-fill writes into the form fields and marks them as auto-filled (with a small badge).
- [ ] The "show excluded exercises" override exists, requires confirmation, and resets to off after each session.
- [ ] If filter pass yields an empty pool for a requested workout type, the generator refuses and explains why.

---

## 6. Features

### 6.1 Priority goals

#### What

Users pick up to **3 priority goals** from a fixed list. Goals shape the generator's weighting, the weekly plan, and the cooldown emphasis — but never override capability filters.

**Goal list (v3):**
- Weight loss
- Cardio fitness
- Strength / resistance
- Mobility
- Flexibility
- Recovery / active rest
- General fitness *(default if none picked)*

#### Why

Different bodies want different things. A 70-year-old wanting mobility shouldn't be served the same generator output as a 30-year-old wanting to deadlift more.

#### Where it ships

Web + iOS.

#### Interface design

A card grid in Setup → "What's your focus right now?":

- Each goal is a card with an icon, name, and one-line description.
- Tap to add to the priority list. Tap again to remove.
- A small ranked tray at the top shows picked goals (1, 2, 3) — drag to reorder.
- "Edit goals" lives in Settings → Profile too, for changing without going through Setup.

#### How goals affect the generator

Each goal contributes weights to:

| Goal | Workout-type bias | Category weight | Cooldown bias | Session length nudge |
|------|-------------------|-----------------|---------------|----------------------|
| Weight loss | conditioning ×1.5, HIIT ×1.3 | cardio ×1.5, full-body ×1.3 | standard | +5 min suggested |
| Cardio fitness | conditioning ×1.5, HIIT ×1.5 | cardio ×1.8 | standard | — |
| Strength | strength ×2.0 | push/pull/squat/hinge ×1.4 | standard | — |
| Mobility | functional ×1.3, yoga ×1.5 | mobility ×2.0 | longer (+50%) | — |
| Flexibility | yoga ×2.0 | mobility ×1.6 | longer (+50%), more static stretches | — |
| Recovery | yoga ×1.5, restorative emphasis | mobility ×1.5 | longer (+100%), no plyo | intensity capped at moderate |
| General fitness | even mix | even | standard | — |

When 2-3 goals are selected, weights compose multiplicatively. Primary goal gets full weight; secondary 0.7×; tertiary 0.5×.

#### Acceptance

- [ ] Goal cards display, can be picked/reordered up to 3.
- [ ] Goal selection persists to localStorage and (iOS) iCloud.
- [ ] Generator shows clearly different output for the same workout type when goals change (e.g. mobility goal → 30%+ mobility content).
- [ ] Weekly plan (§6.10) reflects goal selection.

### 6.2 Exercise library settings (whitelist / blacklist / icons)

#### What

A new Settings → "Exercise library" screen showing every exercise with filters and two list-management actions: **Exclude** and **Whitelist (only pick from these)**.

#### Why

Power users (and Joe's mum) want explicit control over which exercises ever surface. Some exercises a user simply never wants to do; others they want to focus on.

#### Where it ships

Web + iOS.

#### Surface

- Top filter bar: body part, exercise type, equipment required, difficulty, impact.
- List of exercises with: icon (machine icon or stick-figure), name, primary muscles, equipment chip, difficulty pip.
- Tap → exercise detail sheet:
  - Larger icon
  - Description (existing field, expanded)
  - "How to use" instructions (especially for equipment)
  - Two toggles: **Exclude** (red), **Pin to whitelist** (green).
- Top-right: mode switch — **All exercises** / **Whitelist only** / **My excludes**.
- Header toggle: "**Use whitelist exclusively**" — when on, generator picks ONLY from whitelisted exercises (with capability filter still on top).

#### Icons

- Each exercise gets an icon. Most can use generic categorical icons (e.g. squat silhouette, pushup silhouette).
- Equipment items get a dedicated icon (kettlebell, dumbbell, barbell, bench, cable, machine).
- Source: an open SVG icon set — recommend Lucide or a custom minimal set. Store as inline SVG in a single `js/icons.js` for tree-shake-free embedding.

#### Acceptance

- [ ] All exercises and yoga poses listed with filters working.
- [ ] Excludes and whitelist persist to localStorage / iCloud.
- [ ] "Use whitelist exclusively" toggle changes generator behaviour — no exercise outside the whitelist appears.
- [ ] Each exercise has a distinct icon.
- [ ] Equipment items have icons and "how to use" notes.

### 6.3 Tiered equipment (Basic / Home Gym / Commercial Gym)

#### What

Equipment selection is split into three tiers that the user can expand independently.

#### Why

The current flat list will explode as we add equipment. Tiers help the user find what they have and let us add far more exercises without overwhelming setup.

#### Tier layout

- **Basic** — bodyweight, resistance band, jump rope, mat, chair (chair = strong accessibility win), wall.
- **Home gym** — pair of dumbbells, single kettlebell, suspension trainer (TRX), pull-up bar, weight bench, foam roller, medicine ball, slam ball, sandbag, plyo box, weight plates.
- **Commercial gym** — barbell + plates, squat rack, cable column, lat pulldown, leg press, leg extension, leg curl, hack squat, smith machine, chest press machine, row machine, rower (concept2), assault bike, ski-erg, treadmill, dip bars, GHD, landmine.

#### Surface

- Setup → Equipment now shows three collapsible groups, with a "What I have" count chip per group.
- A "Quick presets" row at the top: *No equipment* / *Light home setup* / *Full home gym* / *Commercial gym* — applies sensible defaults.

#### Generator impact

- New equipment unlocks a meaningful bank of new exercises (see §6.4).
- Equipment filter remains a hard filter on top of capability.

#### Acceptance

- [ ] Three tier groups render with collapse/expand.
- [ ] Quick presets work and persist.
- [ ] Each new equipment item has at least 4 unique exercises in the library.
- [ ] Equipment icons surface in the exercise library view.

### 6.4 Expert-designed exercise & workout library

#### What

Audit and expand the exercise library *and* introduce **named expert templates** per workout type — pre-designed sessions a user can pick instead of generating.

#### Why

Random selection from a category pool can produce awkward sequences (e.g. heavy quads stacked back-to-back). Expert templates solve the "this looks weird" failure mode and showcase what a good session looks like. They also let us seed the "Surprise me" generator (§6.10) with quality reference material.

#### Library audit

For every existing exercise:
- Add the demand tags from §5.2.
- Verify primary/secondary muscles.
- Add a *coach cue* — a one-line tip the timer screen surfaces ("Knees track over toes").

Add new exercises to fill gaps surfaced by the equipment expansion. Aim for ~15 exercises per category × ~3 difficulty levels per category.

#### Templates per workout type

- **Strength** — five named programs (e.g. "Full-body 3-day", "Upper/Lower 4-day", "PPL 6-day", "Beginner full-body", "Senior strength").
- **HIIT** — six 10-30 minute named workouts (e.g. "Tabata classic", "EMOM 20", "30/30", "Death by burpee").
- **Conditioning** — six (e.g. "Pyramid", "Ladder", "Chipper", "Steady state").
- **Functional** — four (e.g. "Animal flow", "Sandbag complex", "Carry medley").
- **Yoga** — eight per style (Hatha, Vinyasa, Yin, Power, Restorative).

Template format:

```json
{
  "id": "tpl_strength_full_body_3d",
  "name": "Full-body 3-day",
  "type": "strength",
  "designer_credit": "Internal — coached by [name]",
  "duration_min": 45,
  "min_equipment": ["dumbbell","mat"],
  "min_fitness": "beginner",
  "blocks": [
    { "name": "A", "exercises": [{ "ref": "Goblet Squat", "sets": 4, "reps": "6-8", "rest_sec": 120 }] },
    { "name": "B (superset)", "superset": true, "exercises": [
      { "ref": "Dumbbell Row", "sets": 3, "reps": "8-10", "rest_sec": 0 },
      { "ref": "Push-up", "sets": 3, "reps": "AMRAP", "rest_sec": 90 }
    ]}
  ]
}
```

Templates respect capability filters: if a template references an exercise the user can't do, the app suggests a substitute from the same category that fits the capability profile.

#### Surface

- Setup gets a third primary action alongside "Build" and "Surprise me": "**Templates**" → list of templates per workout type, filterable by duration and equipment.

#### Acceptance

- [ ] Library audit complete — every exercise has demand tags + coach cue.
- [ ] At least 30 expert templates ship.
- [ ] Substitution logic suggests a same-category replacement when a template references a capped-out exercise.
- [ ] Templates respect capability filters.

### 6.5 Hevy parity for Strength mode

#### What

Strength mode becomes feature-competitive with Hevy for solo training (we explicitly skip social).

#### Why

If a user already logs in Hevy, they have to choose. Closing the gap means the workout generator and the workout tracker are the same app.

#### Hevy gap analysis

| Hevy feature | Status today | v3 target |
|--------------|--------------|-----------|
| Routines / templates | Partial (generator) | Full (templates §6.4 + saved workouts §6.9) |
| Per-exercise sets / reps / weight | ✅ | Keep, polish UI |
| Rest timer between sets | ✅ | Keep, drive from intensity (§5/PDR-v2) |
| Personal records (PR) tracking | ❌ | **Add** — top weight, top reps, top 1RM (Epley) per exercise |
| Workout history | ✅ | Keep, add per-exercise filter |
| Strength progression chart | ❌ | **Add** — per-exercise line chart of working weight & est. 1RM over time |
| Volume / tonnage tracking | ❌ | **Add** — per-session tonnage = Σ(sets × reps × kg) |
| Body measurements log | ❌ | **Add** — body weight (HK), waist, chest, arms, thighs |
| Plate calculator | ❌ | **Add** — given target kg + bar weight, list plates per side |
| 1RM calculator | ❌ | **Add** — Epley/Brzycki, exposed in exercise detail |
| Supersets / circuits | Partial | **Add** — explicit superset block in templates and generator output |
| Drop sets / AMRAP / RPE per set | ❌ | **Add** — set-type picker (normal / warm-up / drop / failure / AMRAP), RPE 6-10 |
| Substitute exercise mid-workout | ✅ swap | Keep, weight history of swapped exercise carries over |
| Exercise notes per session | ✅ | Keep |
| Exercise instructions / form video | Partial | **Add** — short form notes; video deferred (storage cost) |
| Apple Watch | ✅ | Keep (already shipped) |
| Workout reminders / scheduling | ❌ | **Add** — daily/weekly notification |
| CSV / JSON export | ✅ | Keep, extend with strength-only export shape |

#### Where it ships

- Full feature set on **iOS** (uses iCloud sync for measurements, push for reminders).
- Web gets: PR tracking, supersets, set types, plate calc, 1RM calc, progression chart. Web skips: body measurements log (no HK), reminders.

#### Data model deltas

```json
{
  "exercise_log_entry": {
    "exercise_name": "Goblet Squat",
    "session_id": "...",
    "date": "2026-04-28",
    "sets": [
      { "type": "warmup", "reps": 8, "weight_kg": 8, "rpe": null },
      { "type": "normal", "reps": 8, "weight_kg": 16, "rpe": 7 },
      { "type": "normal", "reps": 8, "weight_kg": 16, "rpe": 8 },
      { "type": "drop",   "reps": 12, "weight_kg": 12, "rpe": 9 }
    ],
    "best_set": { "weight_kg": 16, "reps": 8 },
    "estimated_1rm": 20.0
  }
}
```

#### Acceptance

- [ ] Per-exercise PR card on the strength preview screen.
- [ ] Progression chart on exercise detail.
- [ ] Plate calculator accessible from any weight input.
- [ ] Set-type picker available on every working set.
- [ ] Superset blocks render distinctly in preview and timer.
- [ ] Body measurements log on iOS (with HealthKit body-mass round-tripping).
- [ ] Reminders (iOS only) configurable per-day with a workout-type pick.

### 6.6 Cooldown improvements

#### What

Replace the v2 fixed 5-minute cooldown with a **scaled, workout-relevant** cooldown.

#### Rules

- Minimum 5 minutes (unchanged).
- For sessions ≥ 45 minutes: cooldown = 6 min. ≥ 60 min: 8 min. ≥ 75 min: 10 min.
- For users with **mobility** or **flexibility** goal: cooldown lengths scale ×1.5.
- Cooldown movements MUST target the muscle groups loaded by the main workout. Mapping:
  - Lower-body session → quad / hip flexor / glute / hamstring / calf stretches.
  - Push session → chest / front-delt / triceps stretches.
  - Pull session → lat / rear-delt / biceps stretches.
  - Yoga → savasana with optional gentle floor reset.
- No repeats from warmup or main work block.
- No internal rest (unchanged).
- Static stretches preferred over dynamic in cooldown (the opposite of warmup).

#### Acceptance

- [ ] Cooldown duration matches the table.
- [ ] Mobility/flexibility goal scales cooldown ×1.5.
- [ ] Cooldown muscle groups overlap with main-block muscle groups.
- [ ] Static stretch movements predominant.

### 6.7 Custom workout duration

#### What

Setup duration picker becomes a free-input field with quick presets — user can type "35" for 35 minutes.

#### Where it ships

Web + iOS.

#### Surface

- Existing pill row of preset durations.
- Add a "Custom…" pill that reveals a number input (15-180 minutes, steps of 5).
- Last custom value persists.

#### Acceptance

- [ ] User can input any duration 15-180 minutes.
- [ ] Generator math (warmup + rest + main + cooldown = total) holds for arbitrary durations.
- [ ] Sub-15 min input is rejected with a clear message.

### 6.8 Yoga rebuild

#### What

Yoga becomes first-class:
1. Fix the generation bug (yoga currently produces empty workouts in some configurations — see `js/yoga.js` style structures).
2. Add a yoga-equipment question (block, strap, bolster, blanket, bolster, wall, chair).
3. Filter poses by available yoga equipment.
4. Expand the pose database with **comprehensive descriptions** and **pose icons**.
5. Add yoga **experience level**: New / Some practice / Confident / Experienced / Teacher.
6. Selection respects capability profile + experience + style + equipment.

#### Why

The current yoga module is a shell. Joe (and his mum) deserve a yoga experience that matches strength's care.

#### Yoga equipment

Add a dedicated yoga equipment subsection in Setup that only shows when a yoga style is selected:

- Mat (default on)
- Block (one)
- Block (two)
- Strap
- Bolster
- Blanket
- Wall (always available — but a meaningful pose modifier)
- Chair (accessibility — opens chair-yoga subset)

Each yoga pose has a `requires_props` array (e.g. `["block"]`). Poses with prop requirements are excluded if props absent.

#### Yoga experience level

| Level | Caps |
|-------|------|
| New | complexity ≤ 1, no inversions, no balance > diff 1 |
| Some practice | complexity ≤ 2 |
| Confident | complexity ≤ 3 |
| Experienced | complexity ≤ 4 |
| Teacher | full library |

This is **on top of** the universal capability profile.

#### Pose database additions

Each yoga pose now has:

```json
{
  "name": "Triangle",
  "sanskrit": "Trikonasana",
  "icon": "yoga-triangle",
  "description": "Lengthens the side body, opens the hips and chest, builds leg strength.",
  "step_by_step": [
    "Stand wide, right toes forward, left toes turned slightly in.",
    "Extend arms parallel to the floor.",
    "Hinge at the right hip, extend over the right leg.",
    "Drop right hand to shin, ankle, or floor; left arm reaches up.",
    "Gaze up at the left hand if comfortable for the neck."
  ],
  "common_mistakes": ["Collapsing the chest forward", "Locking the front knee"],
  "modifications": ["Use a block under the bottom hand", "Look forward instead of up"],
  "requires_props": [],
  "complexity": 2,
  "single_sided": true,
  "muscles": ["hamstrings","obliques","shoulders"],
  "styles": ["vinyasa","hatha","power"]
}
```

Pose icons: same approach as exercise icons — a curated set of inline SVGs in `js/icons.js`.

#### Acceptance

- [ ] Yoga generation bug fixed — no empty yoga workouts in any tested config.
- [ ] Yoga equipment subsection appears for yoga styles.
- [ ] Poses requiring absent props never appear.
- [ ] Experience-level caps enforced.
- [ ] Every pose has icon, description, step-by-step, modifications.
- [ ] Pose detail sheet shows all of the above.

### 6.9 Saved workouts catalogue + ratings + export

#### What

After every workout the user can **save it** to a personal catalogue, rate it 1-5 stars, and export from the catalogue in JSON / Markdown / CSV / printable PDF.

#### Surface

- Done screen gets a "Save this workout" toggle (default off).
- New screen: Library → "My workouts" — list of saved workouts with star rating, filters, and per-row export buttons.
- Each saved workout can be replayed verbatim from the library (skips generation).
- Export formats:
  - **JSON** — full data shape (includes profile snapshot, sets, weights).
  - **Markdown** — clean human-readable.
  - **CSV** — flat one-row-per-set for spreadsheet analysis.
  - **PDF** — printable, large-text, checkbox per set/exercise. Generated client-side via `html2pdf` or printing via `window.print()` on a dedicated `/print/<id>` view.

#### Acceptance

- [ ] Save toggle on Done screen works, persists.
- [ ] Library screen lists saved workouts.
- [ ] All four export formats produce valid output.
- [ ] PDF view is print-optimised: A4, large font, checkbox column.
- [ ] Saved workouts can be replayed exactly.

### 6.10 Weekly plan + "Surprise me"

#### What

Two related additions:

- **Weekly plan** — a 7-day suggested schedule based on goals + capability + recent history.
- **Surprise me** — a one-tap button next to "Generate" that uses everything the app knows about the user to produce the *next session* with no setup.

#### Why

Removing the "what should I do today?" decision is the highest-value coaching move the app can make.

#### Weekly plan rules

- Strength goal → 3-4 strength sessions, 1-2 conditioning, 1-2 mobility/yoga.
- Cardio/weight loss → 4 conditioning/HIIT, 2 strength, 1 yoga.
- Mobility/flexibility → 3-4 yoga, 2 functional, 1-2 strength.
- Recovery → max 4 sessions, all moderate-or-below.
- Adapts based on what the user has actually done in the last 7 days (under-trained area gets prioritised next).
- Days the user marks "rest" stay clear.

#### Plan screen

- Calendar week view. Each day is a card with the suggested workout type and target duration.
- Tap a day → see suggested template OR generate a workout for that day.
- "Skip", "swap", "rest day" controls per day.
- Plan regenerates each Sunday. User can lock individual days to prevent regeneration.

#### Surprise me

A button next to "Generate" on Setup. Clicking it:

1. Reads profile, goals, equipment, recent history, weekly plan.
2. Decides workout type (today's suggested type from the plan, or by under-training analysis).
3. Picks a template if one matches duration+equipment+capability, else generates from category pools.
4. Lands the user directly on Preview, ready to start or customise.

#### Acceptance

- [ ] Weekly plan renders with seven days and adapts to goals.
- [ ] User can swap, skip, lock days.
- [ ] Plan regenerates on Sunday and respects locks.
- [ ] "Surprise me" produces a complete, capability-safe, goal-aligned workout in one tap.
- [ ] "Surprise me" output never duplicates yesterday's session.

### 6.11 Add-exercise (+) on generated workouts

#### What

On the Preview screen, every section (Warmup / Set 1 / Cooldown) gets a **+** button that opens an exercise picker.

#### Behaviour

- Picker is the same searchable list as Settings → Exercise library (filtered to capability-safe by default; toggle to show all).
- Adding to "Set 1" repeats the addition across all sets of the main block (matches Hevy routine semantics).
- Adding to Warmup or Cooldown adds to that single section.
- Removed exercises don't get re-added on next generation.

#### Acceptance

- [ ] + button visible on each section in Preview.
- [ ] Picker opens, filters work, capability-safe default holds.
- [ ] "Add to Set 1" applies across all sets.
- [ ] Total time recalculates after adds.

### 6.12 Heart-rate-zone targeting + dynamic rest (Watch + iOS)

#### What

For users with an Apple Watch, the workout can target a heart rate zone. The app:
- Shows current HR and zone on the Watch and iPhone.
- Coaches the user verbally / visually when they fall below or above the target zone.
- Dynamically adjusts inter-set rest based on HR recovery.

#### Where it ships

iPhone (paired) + Watch. **Not** in the web build.

#### Setup

- New section in Setup → "Target heart rate zone" (only shown if Watch paired).
- Pick a zone: Z1 / Z2 / Z3 / Z4 / Z5 — defined as %HRmax bands. Default: workout-type-driven (Strength → Z2, Conditioning → Z3, HIIT → Z4).
- HRmax derived from `220 - age` if no `vo2max`-based estimate available.
- Optional advanced: enter HRmax explicitly.

#### During workout

- Watch screen 1: existing exercise + timer.
- **Watch screen 2 (swipe)**: large HR number, zone bar (1–5), zone time-in-zone for this session — same look as Apple Fitness Workout app.
- Watch screen 3 (swipe): controls (pause / +10s rest / skip).

- **Below zone for ≥ 20s** → audible chime + voice cue: *"Push yourself to stay in zone {n}."* (Throttled to one cue per minute.)
- **Above zone for ≥ 20s** → audible chime + voice cue: *"Slow down to stay in zone {n}."*
- **At HR 90%+ HRmax for ≥ 10s** → safety override: stop coaching, show "Recover" prompt.

#### Dynamic rest

- Inter-set rest is set to `default_rest_sec` (intensity-based, per PDR-v2).
- During rest, watch HR every second. End rest early when HR drops to **upper bound of target zone**, but never shorter than `default_rest_sec - 30s` and never longer than `default_rest_sec + 60s`.
- Show the live target on the rest screen: "Resting until HR drops to {n} bpm."

#### Acceptance

- [ ] Zone selection in Setup, only when Watch paired.
- [ ] Watch swipeable HR screen renders, Apple Fitness style.
- [ ] Below/above-zone coaching cues fire with the right cadence.
- [ ] Dynamic rest end-condition works and respects the floor/ceiling.
- [ ] Safety override works at 90% HRmax.
- [ ] All HR features completely absent in web build.

### 6.13 Music control (Apple Music + Spotify, iOS only)

#### What

A music mini-player on the iPhone Setup, Preview, and Timer screens — Play/Pause, Next, Previous, source picker. Mirrored as Watch controls.

#### Why

Removing the friction of switching apps to start a playlist is the smallest UX win that has the biggest behavioural payoff.

#### iOS implementation

- **Apple Music** — `MusicKit` framework. Requires user authorisation to control playback. Use `MusicAuthorization`, `MusicPlayer.shared`, and `ApplicationMusicPlayer.shared`.
- **Spotify** — Spotify iOS SDK. OAuth via `SPTSessionManager`. App-remote API for play/pause/skip and now-playing. Requires Spotify app installed.
- **Source picker** — Settings → Music → pick provider. Default: none.
- Mini-player surface: 56-pixel-tall bar at the bottom (above the nav). Tap to expand into a full now-playing sheet with playlist picker.
- The Watch app gets a "Now Playing" complication-style mini-screen that exposes the same controls via WatchConnectivity.

#### Where it ships

iOS + Watch. **Not** web.

#### Acceptance

- [ ] Apple Music playback can be controlled (requires Apple Music subscription on test device).
- [ ] Spotify playback can be controlled (requires Spotify app + premium).
- [ ] Mini-player visible on relevant screens, doesn't obscure CTAs.
- [ ] Watch mini-player works.
- [ ] Auth gracefully fails if user denies, with a clear "open settings" path.

---

## 7. Data model deltas (consolidated)

```json
{
  "user_profile": {
    "age_band": "55-69",
    "dob": null,
    "weight_kg": 78,
    "height_cm": 168,
    "fitness_level": "beginner",
    "vo2max": null,
    "floor_work_ok": true,
    "mobility_limits": ["knees"],
    "active_injuries": null,
    "pregnancy_safe_only": false,
    "hr_max": null,
    "hk_synced": true
  },
  "user_goals": [
    { "goal": "mobility", "rank": 1 },
    { "goal": "strength", "rank": 2 }
  ],
  "exercise_filters": {
    "blacklist": ["Burpee","Plyo Push-up"],
    "whitelist": [],
    "use_whitelist_exclusively": false,
    "show_excluded_override": false
  },
  "equipment_v3": {
    "basic": ["bodyweight","mat"],
    "home_gym": ["dumbbell","kettlebell"],
    "commercial_gym": [],
    "yoga": ["mat","block","strap"]
  },
  "weekly_plan": {
    "week_starting": "2026-04-27",
    "days": [
      { "date":"2026-04-27","type":"strength","duration_min":45,"locked":false,"completed_session_id":null },
      { "date":"2026-04-28","type":"yoga","duration_min":30,"locked":false }
    ]
  },
  "saved_workouts": [
    { "id":"...","name":"Mum's gentle strength","rating":5,"created":"2026-04-28","payload":{ /* full workout */ } }
  ]
}
```

Existing exercise / pose entries gain demand tags (§5.2). Existing session record gains `profile_snapshot` and `goal_snapshot` fields so historical sessions can be re-rendered with the conditions they were generated under.

## 8. Yoga generation bug

**Symptom.** Some yoga style selections produce empty workouts.

**Likely root cause.** In `js/yoga.js`, `SECTION_CATS['savasana']` is `[]`, and other style structures may resolve to sections whose category pool is empty after filtering. The pool sampler returns nothing, and the caller treats that as an empty workout.

**Fix outline.**
1. Audit each style's `structure` against `SECTION_CATS` and the yoga DB to ensure every section can yield ≥ 1 pose.
2. Add a fallback: if a section yields zero poses, skip the section but log a non-fatal warning to console.
3. Add unit tests: for each style + each equipment combo + each experience level, assert the generator returns a non-empty workout.

This fix is a prerequisite for §6.8 — do it first.

## 9. HealthKit usage summary

Adds to existing `HealthKitPlugin`:

| Type | Read | Write | Used by |
|------|------|-------|---------|
| `dateOfBirthComponents` | new | — | Profile auto-fill |
| `bodyMass` | new | new (when measurements logged) | Profile + Hevy parity |
| `height` | new | — | Profile |
| `vo2Max` | new | — | Profile sanity check + HRmax estimate |
| `appleExerciseTime` | new | — | Recent activity |
| `heartRate` | already (workout session) | — | HR zone coaching |
| `workoutType` (HKWorkout) | — | already | Existing |

All new reads require explicit user opt-in via the existing permission flow. Falling back to manual entry is always supported.

## 10. Acceptance criteria (master checklist)

Capability system (§5):
- [ ] Every exercise has demand tags
- [ ] Profile setup screen exists and persists
- [ ] HealthKit auto-fill works
- [ ] Filter pass excludes capped exercises
- [ ] Override exists with confirmation
- [ ] Refusal message when filter empties a workout type pool

Goals (§6.1):
- [ ] 3-pick goal cards
- [ ] Generator weighting verifiably differs by goals

Exercise library (§6.2):
- [ ] All exercises listed with filters
- [ ] Blacklist + whitelist persist
- [ ] "Use whitelist exclusively" toggle
- [ ] Icons + how-to-use for equipment

Equipment tiers (§6.3):
- [ ] Three tier groups, presets, persistence

Expert library (§6.4):
- [ ] Library audit complete
- [ ] ≥30 templates ship
- [ ] Substitution logic respects capability

Hevy parity (§6.5):
- [ ] PRs, progression chart, plate calc, 1RM, supersets, set types, body measurements (iOS), reminders (iOS)

Cooldown (§6.6):
- [ ] Length scales with duration + goals
- [ ] Targets the muscles loaded
- [ ] No repeats from warmup/main

Custom duration (§6.7):
- [ ] 15–180 min input

Yoga (§6.8):
- [ ] Generation bug fixed
- [ ] Yoga equipment + props gating
- [ ] Experience levels enforced
- [ ] Pose detail sheet with description, steps, modifications, icon

Saved workouts (§6.9):
- [ ] Save / rate / replay / export in JSON / MD / CSV / PDF

Weekly plan + Surprise me (§6.10):
- [ ] Plan renders, adapts, regenerates Sundays, respects locks
- [ ] Surprise me one-tap

Add-exercise (§6.11):
- [ ] + button on each section, capability-safe default

HR zones (§6.12):
- [ ] Watch swipeable HR screen
- [ ] Below/above coaching cues
- [ ] Dynamic rest with floor/ceiling
- [ ] 90% HRmax safety override
- [ ] Absent in web build

Music (§6.13):
- [ ] Apple Music + Spotify control
- [ ] Watch mini-player
- [ ] Absent in web build

## 11. Suggested build order (sprints)

Each sprint is one branch + one PR.

1. **`fix/yoga-generation`** — §8. Ship before yoga rebuild.
2. **`feat/capability-profile-data`** — §5.2 demand-tag audit + `js/capability.js` filter module + tests. No UI yet.
3. **`feat/profile-setup`** — §5.5 profile screen + HealthKit auto-fill. Wire filter into existing generator.
4. **`feat/goals`** — §6.1 goal cards + weighting in generator.
5. **`feat/equipment-tiers`** — §6.3 tiered equipment + presets + new equipment items.
6. **`feat/exercise-library-settings`** — §6.2 library screen, blacklist/whitelist, icons.
7. **`feat/expert-library`** — §6.4 library audit + templates.
8. **`feat/cooldown-v2`** — §6.6 scaling + relevance.
9. **`feat/custom-duration`** — §6.7.
10. **`feat/yoga-rebuild`** — §6.8 once equipment + library settings exist.
11. **`feat/saved-workouts`** — §6.9 catalogue + export.
12. **`feat/add-exercise-button`** — §6.11 small UX add.
13. **`feat/hevy-parity-strength`** — §6.5 — biggest single feature, ship in 2-3 sub-PRs.
14. **`feat/weekly-plan`** + **`feat/surprise-me`** — §6.10.
15. **`feat/hr-zone-watch`** — §6.12 Watch + iOS only.
16. **`feat/music-control`** — §6.13 Watch + iOS only.

## 12. Open questions

1. **Pregnancy-safe pool curation** — who curates? Recommend external midwife/coach review before shipping that toggle. Until then, ship the toggle disabled with a "coming soon" note.
2. **HRmax estimation** — `220-age` is crude. Should we use Tanaka (`208 - 0.7*age`) instead? Pick one in §6.12 implementation; document choice.
3. **Plate calculator units** — kg-only, or kg/lb toggle? Recommend kg/lb toggle, default kg.
4. **Cloud-sync of new fields** — profile, goals, exercise filters, weekly plan all need to round-trip via `NSUbiquitousKeyValueStore`. Total payload still well under 1 MB but worth measuring after each PR.
5. **Reminders (Hevy parity)** — iOS local notifications only, or push from a server? Local-only for v3.
6. **Watch HR coaching interruptions** — should we suppress voice cues if music is playing? Recommend yes — fall back to haptic + on-screen only when music is detected as playing.
7. **PDF export** — `html2pdf` adds ~500 KB to the bundle. Consider lazy-loading on first use.
8. **Capability override** — should it be a global Settings toggle, or a one-time "show all" reveal in Setup? Spec says global toggle with confirmation. Revisit if testers find it too discoverable.
9. **Goal-driven generator vs templates** — when a user has a strong goal AND a Watch HR target AND a template selected, what wins? Order: template > HR target > goal weighting > capability filter. Capability is the only one that's never overridden.

## 13. Out of scope (v3, deferred to v4)

- Social / sharing / leaderboards.
- AI-generated bespoke programs.
- Form-checking via camera.
- Nutrition logging.
- Sleep/readiness scoring (would feed into recovery goal, but defer).
- Pregnancy curated pool (toggle ships disabled).
- Coach video clips per exercise.
- Multi-user / family profiles.

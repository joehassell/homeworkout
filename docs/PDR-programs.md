# PDR: Programs — Multi-Week Structured Training

**App:** Home Workout Builder
**Repo:** joehassell.github.io/homeworkout
**Author:** Joe Hassell
**Status:** Draft — open questions resolved 2026-05-05
**Date:** 2026-05-05

---

## 1. Summary

Programs are multi-week, goal-oriented training plans that turn the app from a "press generate, press start" tool into a coach with a memory. A program defines a calendar of workouts — each one a templated session, a generator brief, or a fully custom inline workout — sequenced and progressed across 4 to 12 weeks. Each program is anchored to a specific outcome (first pull-up, body recomposition, vertical jump, restore postnatal core, etc.), uses a deliberate periodisation scheme, and is gated by clear measurable milestones.

The PDR covers both the platform (data model, UX, gating, sync, edge cases) and the initial program library: **12 programs** designed to cover the realistic spectrum of users who pick up a home-workout app.

The first program (**First Move — 4-Week Foundation**) is free as a one-time trial; everything else requires Pro. This converts curious users into Pro subscribers by letting them experience the structure-and-progress payoff before they pay.

---

## 2. Problem & Motivation

The app today is excellent for the *single-session* problem ("I have 30 minutes, give me a good workout"). It does not solve the *multi-week* problem.

- **No through-line.** Today's workout is forgotten by tomorrow's. There's no narrative arc — no "I'm in week 3 of a 12-week build" — which is the single biggest behavioural lever in fitness.
- **Goals don't carry forward.** A user who wants to "lose 5kg" or "do my first pull-up" gets the same generator as the user who wants 30 minutes of yoga. The goal field on Setup is read once and discarded.
- **No periodisation.** Random session selection means random adaptation. Hard-easy waves, deload weeks, block periodisation, and progressive overload are missing entirely.
- **No assessment loop.** Users have no objective markers of progress. The heatmap shows *that* they trained; it doesn't show *whether they got better*.
- **Retention ceiling.** Without a multi-week commitment, the app is one habit-break away from being uninstalled. Programs create a sunk-cost investment ("I'm 6 weeks in, I'm not stopping now") that is the single best retention mechanic in fitness apps.

Programs answer all four with one feature.

---

## 3. Goals

- Users can browse a curated library of programs, see what each one will do for them, and start one in under 90 seconds.
- A program defines a calendar — week × day × workout — that we can render today, tomorrow, and three weeks from now.
- Every program uses a deliberate progression scheme (linear / block / undulating / wave / GTG) appropriate to its goal.
- Every program ships with **measurable milestones** at fixed weeks. The user knows whether they're winning.
- Every workout in a program is **personalised** at start time using existing capability filters (equipment, fitness level, age, BMI, contraindications) — without compromising the program's intent.
- One program is free as a one-time trial; the rest are Pro. Active programs survive a Pro lapse (we don't yank the rug from someone mid-build).
- The library launches with **12 programs** covering the realistic spectrum of goals: foundation, recomposition, hypertrophy, barbell strength, calisthenics, fat-loss conditioning, mobility, athletic power, glute focus, yoga progression, longevity, and postnatal restore.

### Non-goals

- **Fully adaptive auto-regulation by RPE / missed sessions / mood.** Programs do not change their structure based on session-level RPE, missed days, or subjective load. The exception is AMRAP-driven progression — see §7.5 — which uses objective rep counts on flagged sets to adjust the *prescribed reps* of the next occurrence of that lift. Structure (which lifts on which days, how many sessions per week, when deloads land) stays fixed.
- **User-created programs.** No "build your own 12-week plan" UI in v1. Users get the curated library only. (User custom workouts inside a program slot — yes, see §6.4 — but not user-authored full programs.)
- **Multiple concurrent programs.** Exactly one active program at a time. Switching abandons the previous one.
- **Nutrition or sleep integration.** A program is workouts only. Nutrition is acknowledged as decisive for some goals (recomp, fat loss) via copy guidance only.
- **Coach messaging or chat.** No in-app coach interactions. The program *is* the coach.
- **Re-architecting templates or exercises.** Programs build on the existing `js/templates.js`, `js/exercises.js`, and `js/builder.js`. No data-model changes to those files.

---

## 4. Design Principles

1. **The program is the source of truth, the workout is the leaf.** When a program is active, the home screen is the program — not "Surprise Me" or the generator. The user opens the app and sees Day 4 of Week 2 already loaded.
2. **Progress is visible by default.** Week, day, milestone, streak — surfaced everywhere. The user should be one glance away from "where am I in this?"
3. **Structure is fixed; content is filtered.** A program's week 1 day 1 is the same shape for every user (theme, target muscle groups, intensity). The exact exercises swap to match the user's equipment, level, and contraindications via `capability.js`. This keeps the program coherent without breaking it for someone who only has a mat.
4. **Periodisation is non-negotiable.** Every program ≥ 6 weeks ships with at least one deload week and an explicit progression scheme. Hard-easy waves are physiology; the app respects them.
5. **Milestones over miles.** A program is judged by whether the user hits the milestones, not whether they did all 48 sessions. The completion screen leads with milestones met, not session count.
6. **Forgive missed days, punish abandonment.** Missed days have three lightweight rebound paths (do today / skip / shift week). Abandoning is explicit, double-confirmed, and re-presents the program freshly when the user comes back. We don't shame.
7. **No rug-pulls.** A program in flight does not break if Pro lapses, if equipment changes, or if the app updates. Snapshot the user's profile at program start; honour it for the duration.
8. **Trial generosity.** The free trial program is a real, complete, valuable program — not a stub. If it doesn't deliver on its own, the upsell to Pro is hollow.

---

## 5. Success Metrics

| Metric | Definition | Target (90 days post-launch) |
|---|---|---|
| **Program start rate** | % of MAU who start at least one program | 35% |
| **Trial → Pro conversion** | % of trial-program starters who buy Pro within 14 days of program completion | 22% |
| **Program completion rate** | % of started programs where user completes ≥ 80% of scheduled days | 45% |
| **Milestone-met rate** | % of completed programs where ≥ 75% of milestones were achieved | 60% |
| **D30 retention lift** | Retention delta vs. non-program users (cohort matched) | +15 pp |
| **Pro lifetime value lift** | LTV delta for Pro users who started a program vs. those who didn't | +30% |
| **Average sessions / week (program users)** | Programmed users avg sessions/week during active program | 3.5 |

---

## 6. Data Model

All program state is stored in `localStorage`, synced via the existing iCloud Key-Value bridge (`iCloudSyncPlugin.swift`), and follows the existing `js/storage.js` pattern (versioned, JSON-only, capped).

### 6.1 Program Library (read-only, ships with app)

`js/programs.js` exports a `PROGRAMS` array. Programs are static authored data — like `js/templates.js` — not user-editable.

```js
{
  id: 'prog_first_move_v1',
  slug: 'first-move-foundation',
  name: 'First Move — 4-Week Foundation',
  short_name: 'First Move',
  cover_image: 'program-first-move.webp',
  badge: 'TRIAL',                    // 'TRIAL' | 'PRO' | null
  is_trial_eligible: true,           // Free for one-time trial
  pro_required: false,
  duration_weeks: 4,
  sessions_per_week: 3,
  est_minutes_per_session: 28,
  primary_goal: 'foundation',        // see §6.5
  secondary_goals: ['mobility', 'habit'],
  why_it_works: 'Three sessions a week is the minimum dose…',
  audience: {
    fitness_level_min: 'untrained',
    fitness_level_max: 'beginner',
    age_band_ok: ['under_35','35-54','55-69','70+'],
    pregnancy_safe: 'yes',
    requires_floor: true,
    contraindicated_for: []          // joints/conditions that bar this program
  },
  equipment_required: ['bodyweight', 'mat'],
  equipment_optional: ['dumbbell', 'resistance band'],
  difficulty_tracks: [               // optional A/B tracks; default 1 track
    { id:'A', label:'Standard' }
  ],
  progression_scheme: {
    type: 'linear_reps',
    rule: '+1 rep per exercise per week, capped at top of range'
  },
  milestones: [                      // see §6.3
    { at_week:1, day:1, id:'m_baseline', kind:'assessment', tests:[
      {name:'Push-Up Max (60s)', record:'count'},
      {name:'Plank Hold', record:'time_sec'},
      {name:'Air Squat Max (60s)', record:'count'},
      {name:'Sit-and-Reach', record:'cm'}
    ]},
    { at_week:4, day:3, id:'m_retest', kind:'assessment', tests:[ /* same 4 */ ],
      target_rule:'beat_baseline_by_10pct' }
  ],
  weeks: [ /* see §6.2 */ ],
  outro: {
    completion_message: 'You\'ve built the habit and the foundation…',
    recommended_next: ['prog_lean_strong_v1', 'prog_calisthenics_v1']
  },
  meta: {
    author: 'Home Workout Builder coaching team',
    version: 1,
    last_reviewed: '2026-05-05'
  }
}
```

### 6.2 Week and Day Schema

```js
weeks: [
  {
    week: 1,
    theme: 'Foundation — learn the patterns',
    intent: 'Establish technique and build a 3x/week rhythm.',
    rpe_target: 6,                   // 1-10 perceived effort
    deload: false,
    days: [
      {
        day: 1,
        kind: 'workout',             // 'workout' | 'rest' | 'active_recovery' | 'walk' | 'user_choice' | 'assessment'
        slot: {                      // see §6.4
          type: 'inline',
          title: 'Foundation A — Squat & Push',
          duration_min: 25,
          exercises: [
            { name:'Air Squat', sets:3, reps:'8-10', rest_sec:60,
              swap_alternatives:['Goblet Squat','Box Squat','Wall Sits'] },
            { name:'Incline Push-Ups', sets:3, reps:'6-10', rest_sec:60,
              swap_alternatives:['Push-Ups','Knee Push-Ups'] },
            { name:'Glute Bridge', sets:3, reps:'12-15', rest_sec:45 },
            { name:'Dead Bug', sets:3, reps:'30s', rest_sec:30 },
            { name:'Cat-Cow', sets:2, reps:'30s', rest_sec:15 }
          ]
        },
        coaching_note: 'Slow and clean reps beat fast and sloppy. Pause at the bottom of every squat.'
      },
      { day:2, kind:'rest' },
      { day:3, kind:'workout', slot:{ /* Foundation B — Hinge & Pull */ } },
      { day:4, kind:'rest' },
      { day:5, kind:'workout', slot:{ /* Foundation C — Full Body Flow */ } },
      { day:6, kind:'walk', target_minutes:20, coaching_note:'Easy pace, conversational.' },
      { day:7, kind:'rest' }
    ]
  },
  /* week 2, 3, 4 … */
]
```

### 6.3 Slot Types

A `slot` is the actual prescription for a workout day. Four slot types support every authoring need:

| Type | Purpose | Resolution |
|---|---|---|
| `template` | Reuse an existing template | Looks up `templateId` in `js/templates.js`, applies any `modifiers` (extra set, +1 rep, swap one exercise) |
| `inline` | Program-specific custom workout | Defined in-place exactly like a template (name, exercises[]). Most program days are inline so progressions can be precisely controlled. |
| `generator` | Use the existing builder for variety | Passes a `brief` (type, duration, focus, intensity) into `js/builder.js`. Used for "wildcard" variety days. |
| `assessment` | Fitness test day | Fixed warm-up + listed `tests` with input prompts. Replaces a normal workout. Logs to `wk_milestones`. |

```js
// template slot
{ type:'template', templateId:'tpl_strength_fullbody_int',
  modifiers:{ add_set:1, swap:[{from:'Pull-Ups', to:'Inverted Row'}] }}

// inline slot — most common
{ type:'inline', title:'Heavy Lower A', duration_min:40,
  exercises:[ /* … */ ]}

// generator slot
{ type:'generator', brief:{ workout_type:'conditioning', duration_min:25,
  intensity:'moderate', focus:['lower','core'] }}

// assessment slot
{ type:'assessment', title:'Week 4 Retest', warmup:'standard',
  tests:[
    {id:'pushup_max', name:'Push-Ups Max (60s)', record:'count'},
    {id:'plank_hold', name:'Plank Hold', record:'time_sec'}
  ]}
```

### 6.4 Active Program State (per-user)

New `localStorage` key: `wk_program_state` (synced via iCloud KV).

```js
{
  version: 1,
  active_program_id: 'prog_first_move_v1',
  started_at: '2026-05-05T08:00:00Z',
  current_week: 2,
  current_day: 3,
  difficulty_track: 'A',
  schedule: {                        // user-chosen real-world days per week
    days_of_week: ['Mon','Tue','Thu','Sat'],
    preferred_time: '06:30',
    timezone: 'Pacific/Auckland'
  },
  profile_snapshot: {                // captured at program start; honoured for duration
    fitness_level: 'beginner',
    age_band: '35-54',
    bmi: 24.5,
    mobility_limits: [],
    floor_work_ok: true,
    equipment: ['bodyweight','mat','dumbbell']
  },
  completed: [
    { week:1, day:1, session_id:'sess_abc', completed_at:'…', rpe:6 },
    { week:1, day:3, session_id:'sess_def', completed_at:'…', rpe:7 },
    /* … */
  ],
  missed: [
    { week:2, day:1, missed_at:'…', resolution:'shift_week' }
  ],
  swaps: {                           // user-pinned exercise swaps (e.g. 'I never want pull-ups')
    'Pull-Ups': 'Inverted Row'
  },
  amrap_log: [                       // AMRAP set results — drive progression (see §7.5)
    { week:1, day:4, exercise:'OHP top set', prescribed_reps:5, actual_reps:9,
      load_kg:42.5, rpe:9, at:'2026-05-08T18:11:00Z' }
  ],
  progression_overrides: {           // computed targets written by program-progression.js
    'OHP':  { next_prescribed_reps:6, next_load_kg:42.5, source:'amrap_w1_d4' },
    'Bench':{ next_prescribed_reps:5, next_load_kg:62.5, source:'amrap_w1_d3' }
  },
  paused: null,                      // {until:'2026-05-12T…', reason:'travel'}
  trial_used: true                   // true if this program was started under trial
}
```

History of completed/abandoned programs goes to `wk_programs_history` (capped at 20):

```js
[
  { program_id, started_at, ended_at, status:'completed'|'abandoned',
    completion_pct, milestones_met:[…], milestones_missed:[…], final_streak }
]
```

### 6.5 Goals Taxonomy

Programs declare a `primary_goal` from a fixed enum. The list is intentionally narrow — adding a goal requires a new program, not a new tag.

| Goal | Description |
|---|---|
| `foundation` | Movement competence, habit, base fitness |
| `fat_loss` | Caloric expenditure, conditioning, modest deficit-supportive training |
| `recomposition` | Lose fat + build muscle simultaneously |
| `hypertrophy` | Maximise muscle size |
| `strength_max` | Maximise 1RM on big lifts |
| `calisthenics_skill` | Bodyweight skill mastery (pull-up, pistol, L-sit) |
| `conditioning` | Cardiovascular fitness, work capacity |
| `mobility` | Range of motion, flexibility, joint health |
| `athletic_power` | Vertical, sprint, agility, explosive output |
| `glute_focus` | Posterior chain hypertrophy + strength |
| `yoga_progression` | Pose mastery, flow, balance |
| `longevity` | Healthspan — Zone 2 + maintenance lifting |
| `postnatal_restore` | Pelvic floor, deep core, gentle reload |

---

## 7. Personalisation at Program Start

Programs are static-with-personalisation: structure is fixed, content adapts. This happens once at start and is locked in (the user can request a re-personalisation pass mid-program from settings).

### 7.1 The snapshot

When the user taps "Start program," we snapshot:

- `fitness_level`, `age_band`, `bmi`, `mobility_limits`, `floor_work_ok` — from profile
- `equipment` — from `wk_equipment` (filtered to "always" + "maybe" tier)
- `difficulty_track` — user-chosen at confirm sheet (default the program recommends)

This is stored in `wk_program_state.profile_snapshot`. Any future change to profile or equipment does NOT affect the active program unless the user explicitly taps "Re-tune program" in program settings.

### 7.2 Per-exercise resolution (at workout-load time)

When loading the next workout, walk the slot's exercises and resolve each:

1. **Pinned swap?** If `wk_program_state.swaps[exercise.name]` exists, replace.
2. **Allowed by capability?** Run `isAllowed(exerciseDef, deriveCaps(snapshot), snapshot, settings)`. If yes, use as-is.
3. **Equipment available?** If exercise's `equip` contains nothing in the snapshot equipment, swap.
4. **Swap chain.** Try each name in `swap_alternatives` (declared on the inline slot's exercise). First one that passes 1–3 wins.
5. **Generator fallback.** If no `swap_alternatives` resolves, generate a 1-exercise replacement matching the original's category + muscle group via `builder.js`.
6. **Failure.** If even the fallback fails (extreme contraindications + no equipment), surface a clear "Tap to swap" UI with manual choices.

### 7.3 Difficulty tracks

Each program may declare 1–3 tracks. Tracks differ in:

- **Volume** (sets × reps × frequency)
- **Intensity** (RPE target, plyo allowance)
- **Complexity** (movement difficulty cap)

Implementation: a track ID flows into the slot resolver and selects between alternative `exercises[]` blocks within an inline slot, OR scales `sets`/`reps`/`rest_sec` numerically.

```js
exercises: [
  { name:'Goblet Squat', sets:{A:3,B:4,C:5}, reps:{A:'10',B:'8-10',C:'6-8'}, rest_sec:90 }
]
```

### 7.4 Equipment rule of thumb

Programs declare `equipment_required` (must-have to even start) and `equipment_optional` (used if available, swapped if not). The library is heavily weighted toward bodyweight + mat as required, with dumbbells, bands, and bench as optional, so the broadest possible audience can start any program.

### 7.5 AMRAP-driven progression (auto-regulation)

Some sets in some programs are flagged `amrap: true` — the user performs as many reps as possible at the prescribed load, with strict form. The actual rep count is recorded and used to adjust the **next occurrence** of that lift's prescribed reps and/or load. This is the only adaptivity in v1.

**Where AMRAP sets appear:**

- **5-3-1 Foundations** — the final working set of every main lift on every non-deload week.
- **Calisthenics Climb** — the last set of the skill movement on each skill day (graduates the user to the next ladder level when threshold is hit).
- **Lean & Strong** — the final working set of the heavy compound (Goblet Squat, RDL, DB Bench, DB Row) on each strength day.
- **Hypertrophy Home** — the final set of each "pump" exercise (only the rep count is logged; load stays steady).

**Adjustment rules (per-program, declared in `progression_scheme.amrap_rules`):**

```js
// 5-3-1 example
amrap_rules: {
  // If user beats prescribed reps by N, bump training max for next cycle
  tm_bump_kg: { upper: 2.5, lower: 5 },
  // Adjustments within a cycle (same lift, same week scheme)
  next_set_rule: 'maintain_tm',  // weight stays at TM%, AMRAP target rises by 1 if last AMRAP > prescribed+3
  // Stall logic — if AMRAP < prescribed for two consecutive cycles
  stall_action: 'reset_tm_to_90pct'
}

// Calisthenics example
amrap_rules: {
  level_up_threshold: { reps: 8, sets: 5, consecutive_sessions: 2 },
  // 8 strict reps × 5 sets, two sessions in a row → graduate ladder level
  level_down_threshold: { reps: 2, consecutive_sessions: 3 },
  // Three sessions of <2 reps → step down a level (rare, but kind)
}

// Lean & Strong / hypertrophy example
amrap_rules: {
  load_bump_pct: 5,            // +5% load when AMRAP > prescribed_top + 2
  rep_target_bump: 1,          // +1 rep when AMRAP = prescribed_top + 1
  hold_when: 'amrap_in_range', // no change when within prescribed range
}
```

**Computation flow:**

1. User finishes an AMRAP set → enters reps + load + RPE on the existing Done screen (already supported by `Hevy-parity` set types in `index.html`).
2. `program-progression.js` reads the amrap_log entry, walks the program's amrap_rules, and writes a `progression_overrides` entry keyed by exercise name.
3. Next time that exercise's slot is resolved, the resolver reads `progression_overrides` and overrides the prescribed reps/load.
4. Overrides expire when consumed (single-shot) so the program's static schedule remains the ground truth between adjustments.

**Edge cases:**

- **Skipped AMRAP set** — no override generated; next session uses the program's static prescription.
- **Bad-form / honest underperformance** — user can tap "Don't apply progression" on the Done screen. Records the reps, skips the override.
- **Aggressive overshoot** (e.g. 12 reps prescribed 5) — flagged. App proposes a TM bump but asks the user to confirm: *"You crushed that. Bump training max early?"* — prevents one freak set from snowballing.
- **Deload weeks** — overrides do NOT apply during deload weeks. Deloads are protective; we don't let progression eat them.
- **Pro lapse mid-program** — auto-regulation continues for active program (entitlement check happens at start, not per-session).
- **Conflicting overrides** (same exercise written twice within the same week) — last-write-wins.

**UI surfacing:**

- The Done screen shows a small "Smart Progression: +5 lb next session" toast when an override is generated.
- The next day's preview card shows the adjusted target with a tiny ▲ icon: "Squat 5×5 @ 85 kg ▲ (was 80 kg)."
- Settings → Active program → "Smart Progression" toggle (default ON) lets the user revert to pure-static prescriptions if preferred.

---

## 8. UX

### 8.1 Information architecture

A new tab, **Programs**, is added to the Library bottom-bar group. Library tabs become: Programs · Workouts · Exercises · Equipment.

When a program is active, the **app's home screen** changes:

- The "Surprise Me" hero card is demoted; the program "Today" card takes its place.
- The Setup tab still works — users can still generate ad-hoc workouts off-program — but a thin banner reminds them they have a program day pending: *"You have Day 3 of Week 2 ready. Skip it for today's freestyle?"*

### 8.2 Screens

**A. Programs library (`#programs-list`)**

- Header: "Programs" with filter pills (All · Beginner · Build muscle · Lose fat · Mobility · Athletic · Yoga · Longevity)
- Featured row: "Free trial program" with full-width hero card
- Grid: program cards. Each card shows cover, name, duration ("4 weeks · 3×/wk"), level chip, equipment chips, primary goal, FREE / PRO badge, lock icon when Pro.
- One card highlights the user's "best fit" based on profile + equipment + history.
- Pro cards still tappable (taken to detail page with paywall on Start CTA, not blocked entirely — discovery > friction).

**B. Program detail (`#program-detail`)**

- Hero: cover image, name, "12 weeks · 4×/wk · ~45 min/session"
- "Why this program" — 3-bullet coaching philosophy (`why_it_works` rendered)
- "Who it's for" / "Who it's not for" — pulled from `audience` with friendly copy
- "What you'll need" — equipment chips (required vs. optional)
- Week-by-week strip — collapsible accordion, each week shows theme + 7 day chips (W=workout, R=rest, A=active, ?=assessment)
- Milestones timeline — visual progress bar with diamond markers at each milestone week
- Difficulty track picker (if program has tracks) — radio cards
- Coaching FAQ — pregnancy, age 65+, injury, can-I-add-runs, etc. (per-program)
- CTA: "Start program" — opens Confirm sheet. If Pro-locked and trial unused → "Start free trial program." If Pro-locked and trial used → "Unlock with Pro" (paywall).

**C. Confirm sheet (modal)**

- Snapshot preview: "We'll personalise this for you: beginner, dumbbells + mat, no contraindications."
- Schedule picker: which days of the week + preferred time (drives notifications).
- Difficulty track confirm.
- Disclaimer: "We'll save your profile snapshot. You can re-tune later." + medical-clearance line for postnatal/special programs.
- CTA: "Start [Program Name]" — sets `wk_program_state` and routes to Program home.

**D. Program home (`#program-home`, becomes app's home when active)**

- Hero card: "Day 3 · Week 2" with workout title ("Heavy Pull"), duration, intensity badge, big START button.
- This-week strip: 7 day chips, today highlighted, completed days ticked, missed days flagged.
- Milestone next-up card if next milestone is within 7 days.
- Streak / completion meter.
- Quick links: "View whole program," "Pause," "Re-tune," "Abandon."

**E. Day detail (drilling into a future or past day)**

- Workout title, duration, exercises preview, coaching note for the day.
- For past days: completed badge, RPE recorded, link to session detail.
- For future days: read-only.
- For today: big START button.

**F. Assessment day**

- Custom flow: standardised warm-up screen → list of tests one at a time → input numeric result for each → save to `wk_milestones` → comparison to baseline (if retest) → continue.
- Cannot be skipped without confirmation.

**G. Completion screen**

- Celebration animation (subtle, not Vegas).
- Hero stat: "12 weeks. 47 of 48 sessions. 4 of 5 milestones beat."
- Milestone deltas table.
- "What's next" — recommended programs as cards.
- **Milestone share-card (PNG export)** — see §8.6.

### 8.3 Notifications

- **Day-of reminder** at user's preferred time: "Day 3 of Week 2 — Heavy Pull (35 min). Tap to start."
- **Day-before preview** the night before, opt-out: "Tomorrow: Heavy Pull. Get a glass of water before bed."
- **Milestone reminder** the day before an assessment: "Tomorrow's a test day — fresh and rested."
- **Streak protect** at 7pm if a scheduled day is unstarted: "20 minutes left in Day 3."
- **Recovery nudge** on rest days if the user hasn't moved at all: "Rest day. A 10-min walk pays off later."

All program notifications live under a single Settings toggle: "Program reminders."

### 8.3.1 Milestone share-card (PNG export)

Out-of-app virality without server build. After any milestone retest (and again on program completion), the user can tap "Share" to generate a 1080×1350 PNG card:

- Header: program name + duration ("First Move — 4-Week Foundation")
- Hero stat: largest delta as the lead ("Plank: 35s → 78s")
- Three other deltas in a row beneath
- Subtle "Powered by Home Workout" lockup
- Solid background that matches the program's theme colour
- Generated on-device by drawing to an `OffscreenCanvas`, exported via the existing iOS share sheet (`navigator.share` with `Blob`)

No personal info beyond what the user already chose to log. No server. No social graph. Just a sharable artefact for users who want to post the win.

### 8.4 Watch companion

The watch app reads `wk_program_state` and the milestone schedule over `WCSession`:

- **Glance / complication:** "Day 3 · Week 2" + workout name.
- **Milestone preview:** when the next milestone day is within 48 hours, a tinted highlight on the complication: "Test day tomorrow" with an icon. On the day itself: "Today is a test day — fresh and rested."
- **Standalone:** "START today's session" affordance on the watch face.
- **During the session:** same flow as today, with a small "Day 3 of 28" footer.
- **After completion:** day chip ticks on the watch glance immediately; if the completed day was a milestone retest, a brief delta haptic + glance ("Plank +18s — strong").

WatchConnectivity payload extends with: `{ active_program: {id, day, week, total_days, next_milestone:{at_iso, kind, name} } }`.

### 8.5 Progress & history

- Existing heatmap shows program-day pills tinted by program theme color.
- New "Progress" tab inside the program: line chart of milestone tests over time, coaching note copy keyed to the trend ("Your plank improved 40% — your core is doing real work").
- Programs history accessible from Settings → "Past programs."

---

## 9. Entitlement & Trial

### 9.1 Model

- One program flagged `is_trial_eligible: true` → **First Move — 4-Week Foundation**.
- Free users can start the trial program once. The act of starting consumes the trial slot (`wk_trial_consumed=true`, synced).
- Free users hitting any other program's Start CTA are routed to the paywall.
- If a free user starts the trial program, completes it, and stays free → they can browse programs but cannot start another.
- Pro users can start any program any time (still one active at a time).
- **No rug-pulls.** A program in flight continues even if Pro lapses. Notifications continue. New programs cannot be started while free.

### 9.2 Edge cases

- **Trial consumed, then abandoned** — user can browse but not restart trial. Copy: "Your trial program slot is used. Unlock all 12 programs with Pro." Friction is intentional — otherwise the trial is unlimited.
- **Pro lapses mid-program** — current program continues; future Start CTAs are paywalled.
- **Restored purchases** — trial-consumed flag is per-Apple-ID via iCloud KV, not per-device. A user signing in on a new device honours the existing trial state.
- **Family Sharing** — trial flag is per-iCloud-account, so each family member gets their own one-shot trial.
- **Founder users** (existing entitlement) — full access; the trial flag is irrelevant.

### 9.3 Paywall surfaces

A new paywall surface, `paywall.programs`, with a copy variant per program's primary goal so the upsell speaks to *that user's* aspiration ("Drop fat in 12 weeks" vs. "Hit your first pull-up" vs. "Restore postnatal core"). Hooks into existing `js/paywall.js`.

---

## 10. Engineering Plan

### 10.1 New files

- `js/programs.js` — the `PROGRAMS` array (the data — see §11). Includes condensed 3-day variants for First Move (n/a — already 3×/wk), Lean & Strong, Hypertrophy Home, and Calisthenics Climb.
- `js/program-state.js` — load/save/transition the active program state, milestone recording, AMRAP log writes.
- `js/program-resolver.js` — slot → concrete workout (capability filter, swaps, fallback to builder, progression-overrides read).
- `js/program-progression.js` — AMRAP rule engine (§7.5). Walks `progression_scheme.amrap_rules` against `amrap_log` entries, computes `progression_overrides`, handles deload-week guard, stall logic, and aggressive-overshoot user-confirm flow.
- `js/program-ui.js` — render Programs library, detail, home, day, assessment, completion screens; render the "Smart Progression" toast on Done; render variant picker (standard vs condensed) on programs that have one.
- `js/program-sharecard.js` — generate the milestone share-card PNG via `OffscreenCanvas` (§8.3.1). Uses the program's theme colour and template layout.
- `css/programs.css` — program-specific styles (cover-card grid, milestones timeline, day chips, progression toast).

### 10.2 Touched files

- `index.html` — add `#programs-list`, `#program-detail`, `#program-home`, `#program-day`, `#program-assessment`, `#program-completion` screen divs; new tab in Library nav; "Smart Progression" toast on Done; variant picker on confirm sheet.
- `js/storage.js` — add `wk_program_state`, `wk_programs_history`, `wk_milestones` to export/import; bump `SCHEMA_VERSION` to 2 with migration that defaults missing keys to empty.
- `js/entitlement.js` — add `Entitlement.canStartProgram(programId)` helper (checks Pro, then trial flag).
- `js/paywall.js` — add `paywall.programs` surface with goal-keyed copy variants.
- `js/history.js` — tint heatmap days that came from program sessions.
- `iCloudSyncPlugin.swift` — add the new keys (including `wk_program_state` with its `amrap_log` array) to the sync allowlist.
- `HealthKitPlugin.swift` — extend the `saveWorkout` call to attach program metadata when a session was completed under an active program: `metadata: { HKMetadataKeyExternalUUID: program_session_id, HW_PROGRAM_ID, HW_PROGRAM_NAME, HW_WEEK, HW_DAY, HW_IS_MILESTONE }`. Costs nothing for non-program workouts (metadata absent).
- Watch app (`HomeWorkoutWatch`) — read `active_program` payload over WCSession; render Day x of N footer; render "Test day tomorrow" highlight on the complication when next milestone is within 48h; show milestone-delta haptic + glance after a retest.

### 10.3 Migration

- Schema bump: 1 → 2.
- On first launch post-update: migrate sessions to add `program_ref` field (null for legacy). Init `wk_program_state` to null. Init `wk_programs_history` to `[]`. Init `wk_milestones` to `[]`. Init `wk_trial_consumed` to false.
- Idempotent — re-running migration is a no-op.

### 10.4 Sync

- All four new keys flow through the existing `cloudPush` / iCloud KV bridge.
- `wk_program_state` is small (<10KB even at 12 weeks completed) — well inside the 1MB iCloud KV per-key cap.
- Sync-conflict resolution: last-write-wins, same as existing sessions key. We accept that two simultaneous device starts could race; in practice rare.

### 10.5 Testing

- Unit tests in the existing Node harness: program-resolver against every program (incl. condensed variants of Lean & Strong, Hypertrophy Home, Calisthenics Climb) × every plausible profile (untrained / beginner / intermediate / advanced) × every equipment tier (bodyweight only / + dumbbell / + bench / + barbell). Every workout must resolve to a non-empty exercise list with no contraindicated picks.
- **Progression engine tests** — golden-file tests for `program-progression.js`: feed canonical AMRAP logs (5-3-1 cycle 1 user crushes / hits / misses; Calisthenics user graduates / stalls / steps back; Lean & Strong rep bump trigger), assert the resulting `progression_overrides` match expectation. Includes deload-week guard, stall logic, and overshoot-confirm flow.
- Manual smoke matrix on iOS Simulator for the 12 programs × 3 profile presets × 2 variants where applicable.
- Snapshot tests on the rendered week-strip, milestone timeline, and share-card PNG output.
- HealthKit metadata round-trip test — start program, complete a session, read the HK Workout back, assert program metadata present.

### 10.6 Rollout

- Phase 1 (alpha) — internal: First Move trial program only. Validate flow, sync, paywall, completion.
- Phase 2 (TestFlight) — full library of 12 programs. Validate program-resolver against real profiles.
- Phase 3 (App Store) — App Store Connect what's-new copy; new paywall surface activated.

---

## 11. The Program Library

The 12 programs below are the v1 launch set. Each is designed to be the best home-friendly answer to one specific question a real user is asking themselves.

A common skeleton applies to every program: standardised warm-up (4-6 min, scaled by session length), main work, 5-min cooldown biased to muscles loaded that day. Programs ≥ 6 weeks include at least one deload week. RPE targets are explicit. Milestones are measurable. Personalisation runs through `capability.js` at start and per-workout.

**The exercise vocabulary used below is drawn from the existing `js/exercises.js` (113 exercises) and `js/templates.js` (32 templates). No program references an exercise that doesn't exist.**

---

### 11.1 First Move — 4-Week Foundation [TRIAL]

> *"I want to start working out at home and not get hurt or quit by week 2."*

**Goal:** Build the habit. Learn 8 fundamental movement patterns. Establish a 3×/week rhythm that survives a real life.

**Audience:** Untrained or returning after long break. All ages. Pregnancy-safe (general guideline; user confirms with HCP). 4 weeks. 3 sessions/week. ~28 min/session.

**Equipment:** Required: bodyweight + mat. Optional: dumbbell, resistance band.

**Why it works:** Three sessions a week is the smallest effective dose. Below that you don't adapt; above that you don't stick with it as a beginner. We rotate three full-body templates (A: squat-push, B: hinge-pull, C: full-body flow) so you see every pattern twice a week and never get redundant. Reps go up by one each week — your nervous system catches up before the muscles complain.

**Periodisation:** Linear rep progression. Week 1: low end of rep range. Each subsequent week: +1 rep until top of range. Week 4 day 3 = retest. No deload (4 weeks too short to need one; intensity is moderate throughout).

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Week 1 | A: Squat & Push | rest | B: Hinge & Pull | rest | C: Full-Body Flow | walk 20m | rest |
| Week 2 | A | rest | B | rest | C | walk 25m | rest |
| Week 3 | A | rest | B | rest | C | walk 30m | rest |
| Week 4 | A | rest | B | rest | RETEST | walk 30m | rest |

**Workout A — Squat & Push (~28 min):** Air Squat 3×8-10, Incline Push-Ups 3×6-10, Glute Bridge 3×12-15, Dead Bug 3×30s, Cat-Cow 2×30s.

**Workout B — Hinge & Pull (~28 min):** Romanian Deadlift (DB or BW hip-hinge) 3×8-12, Inverted Row (under table) or Band Pull-Apart 3×8-12, Single-Leg Balance 3×20s/side, Bird Dog 3×30s, Side-Lying T-Spine Rotation 2×8/side.

**Workout C — Full-Body Flow (~28 min):** Goblet Squat (or Air Squat) 2×10, Push-Ups (any progression) 2×6-10, Single-Leg RDL 2×6/side, Front Plank 2×30-45s, Glute Bridge 2×12-15, Dead Bug 2×30s, World's Greatest Stretch 2×30s/side.

**Milestones:**
- Week 1 Day 1 — **Baseline assessment:** Push-Up Max (60s), Plank Hold, Air Squat Max (60s), Sit-and-Reach (cm).
- Week 4 Day 3 — **Retest:** same four. Target: improve at least 3 of 4 by ≥10%.

**What good looks like at the end:** 9 of 12 sessions completed. Three of four baseline tests improved ≥10%. User feels confident enough in form to consider a Pro program.

**Recommended next:** Lean & Strong (recomp), Calisthenics Climb (skill), Fat Burn HIIT (conditioning).

**Variants:** Standard (3×/wk, in PDR above) is the only variant. First Move is already only 3 sessions/week, so no further condensed variant is needed.

---

### 11.2 Lean & Strong — 12-Week Body Recomposition

> *"I want to lose fat and build muscle at the same time, with what I have at home."*

**Goal:** Body recomposition — drop fat, add lean mass. Visible at week 8, dramatic at week 12.

**Audience:** Beginner-to-intermediate. 12 weeks. 4 sessions/week + 1 active recovery. ~40 min/session.

**Equipment:** Required: bodyweight + mat + dumbbells. Optional: bench, resistance band, kettlebell.

**Why it works:** Recomposition needs three things: progressive resistance training (you do), enough protein (we tell you), and a small caloric deficit (we tell you). The training side: two strength sessions (upper/lower split) build muscle, one metabolic conditioning session blunts fat-mass while preserving lean mass, one Zone 2 day spares recovery and builds aerobic base. Block periodisation (3 build + 1 deload, repeated 3×) avoids the all-too-common 12-week plateau.

**Periodisation:** Block — 3 weeks build, 1 week deload, 3 cycles. Within each build: linear load on key compound lifts (RDL, DB Bench, DB Row, Goblet Squat). Deload week = 60% volume, RPE 6.

**Nutrition guidance (read once, copy in detail page):** Aim for protein ≈ 1.6 g/kg body weight per day. Caloric target: 200–400 kcal/day below maintenance. Don't drop more — recomp dies in aggressive deficits. Sleep 7+ hours.

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Build | Upper Strength | Lower Strength | rest | Metcon | rest | Zone 2 walk/jog 30-45m | rest |
| Deload | Upper (light) | Lower (light) | rest | Mobility | rest | walk 30m | rest |

**Upper Strength (4 sets × 6-10 reps, RPE 7-8):** DB Bench Press, Dumbbell Row, Pike Push-Ups (or DB Shoulder Press), Hammer Curl, Triceps Kickback, Hollow Hold.

**Lower Strength (4 sets × 6-10 reps, RPE 7-8):** Goblet Squat, Romanian Deadlift, Bulgarian Split Squat (3 each side), Glute Bridge (loaded), Calf Raise, Side Plank.

**Metcon (~30 min EMOM):** Every minute on the minute, 5 rounds: 10 Thrusters, 10 Renegade Rows, 8 Burpees, 12 Goblet Squats, 30s Front Plank.

**Zone 2 (~30-45 min):** Steady walk/jog/skipping, target 60-70% max HR. Watch HR if available.

**Milestones:**
- Week 0 — **Baseline:** body weight, waist (cm), photo, top set 8RM Goblet Squat, top set 8RM DB Row, max push-ups (60s).
- Week 4 — **Mid-1:** retest weight, waist, top set 8RM lifts.
- Week 8 — **Mid-2:** retest all baseline metrics, photo.
- Week 12 — **Final:** retest all + before/after photo card.

**Target:** -3 to -6 kg, -3 to -6 cm waist, +10–20% on top-set lifts, +30% push-up max.

**Variants:**

- **Standard (4×/wk + Zone 2):** as above.
- **Condensed (3×/wk):** drops the dedicated Zone 2 day and merges the two strength days into one full-body strength + one full-body strength-conditioning hybrid + one Zone 2/walk. ~12% slower expected results but realistic for users with 3 training windows. Same 12-week duration. Same milestones, same targets but with a "Condensed track" caveat shown on the milestone screen.

**AMRAP-driven progression:** Final working set on each heavy compound (Goblet Squat, RDL, DB Bench, DB Row) is AMRAP. `progression_overrides` adjust load (+5%) when AMRAP exceeds top of range by 2+; otherwise hold and add reps. See §7.5.

**Recommended next:** Hypertrophy Home (build phase), Athletic Power, Longevity Zone 2.

---

### 11.3 Hypertrophy Home — 8-Week Muscle Builder

> *"I want to add visible muscle. Not gym-built — home-built."*

**Goal:** Maximise hypertrophy with what's available in a typical home gym. Visible results by week 6.

**Audience:** Intermediate. 8 weeks. 4 sessions/week. ~45 min/session.

**Equipment:** Required: dumbbells (adjustable preferred) + mat + chinup bar. Optional: bench, resistance bands.

**Why it works:** Hypertrophy is about volume (sets × reps × proximity to failure) within a recoverable range. Upper/lower split twice a week (4 sessions) allows ~10-20 working sets per muscle group per week — the well-supported sweet spot. We undulate intensity within the week (heavy day = 8-12 reps RPE 8, pump day = 15-20 reps RPE 9 close to failure) to attack both mechanical tension and metabolic stress drivers. Week 7 is a deload (60% volume) to dissipate cumulative fatigue before the week 8 push.

**Periodisation:** Daily undulating periodisation (DUP) — Heavy Upper, Heavy Lower, Pump Upper, Pump Lower. Linear load progression on heavy days; rep progression on pump days. Week 7 deload, Week 8 final push.

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Sessions | Heavy Upper | Heavy Lower | rest | Pump Upper | Pump Lower | walk + mobility | rest |

**Heavy Upper (4 sets, 8-12 reps, RPE 8):** DB Bench Press, Pull-Ups (or Inverted Row), DB Row, Pike Push-Ups (or DB OH Press), DB Curl, DB Skull Crusher.

**Heavy Lower (4 sets, 8-12 reps, RPE 8):** Goblet/DB Front-Loaded Squat, Romanian Deadlift, Bulgarian Split Squat, Walking Lunge, Calf Raise, Hanging Knee Raise.

**Pump Upper (3 sets, 15-20 reps, RPE 9):** DB Floor Press, Inverted Row drop set, Lateral Raise, Face Pull (band), Hammer Curl, Triceps Overhead Extension, Push-Up to failure final set.

**Pump Lower (3 sets, 15-20 reps, RPE 9):** Goblet Squat, Single-Leg Glute Bridge, Step-Ups, Reverse Lunge, Wall Sit 60s, Sissy Squat (assisted), Calf Raise to failure.

**Milestones:**
- Week 0 — **Baseline rep maxes** (with consistent load): DB Bench, DB Row, Goblet Squat, Pull-Ups (or Inverted Row), Push-Ups.
- Week 4 — Mid-cycle retest.
- Week 8 — Final retest. Target: +30% on rep totals on at least 4 of 5 exercises.

**Variants:**

- **Standard (4×/wk):** the upper/lower DUP split above.
- **Condensed (3×/wk):** Heavy Upper, Heavy Lower, Pump Full Body. Same 8-week structure, same week-7 deload, same milestones. Total weekly volume ≈ 75% of standard — completion rates on this variant should be the highest in the library.

**AMRAP-driven progression:** Final pump-set on each pump exercise is AMRAP for reps (load held). `progression_overrides` add 1 rep to next session's prescribed top end when AMRAP exceeds prescribed_top + 1; load stays steady (hypertrophy is rep-driven within the 8-12 / 15-20 ranges). See §7.5.

**Recommended next:** 5-3-1 Foundations (strength), Athletic Power (apply the muscle).

---

### 11.4 5-3-1 Foundations — 12-Week Barbell Strength

> *"I want to seriously increase my squat, bench, deadlift, and overhead press."*

**Goal:** Add 5 kg upper / 10 kg lower to your training maxes (TM) over 12 weeks. Pure strength.

**Audience:** Intermediate-to-advanced. Has barbell + plates + bench + rack (or sturdy stands). 12 weeks. 4 sessions/week. ~50 min/session.

**Equipment:** Required: barbell, plates, bench, rack/stands, mat. Optional: chinup bar, dumbbells.

**Why it works:** The Wendler 5-3-1 framework (3 build weeks + 1 deload, repeated 3 cycles) is the most-validated home-strength protocol of the last 15 years for one reason: it works and it doesn't break you. We use 90% of true 1RM as your training max (TM), which gives you margin for missed sleep, missed food, missed life. Each cycle's final set is AMRAP — that's where we mine real progress. TM goes up 2.5 kg upper / 5 kg lower at the start of each cycle, exactly the rate intermediates can sustain.

**Periodisation:** Wave periodisation in 4-week cycles. Each cycle: Week 1 (5/5/5+), Week 2 (3/3/3+), Week 3 (5/3/1+), Week 4 (deload 5/5/5 light). 3 cycles total = 12 weeks. The "+" denotes the AMRAP set — the final working set is performed for max reps. **AMRAP results drive the auto-regulation engine (§7.5):** crushing your 5+ set with 9 reps means TM bumps early; missing means TM holds.

**Day rotation:** Day 1 OHP, Day 2 Deadlift, Day 3 Bench, Day 4 Squat. Each day = 1 main lift (3 working sets at scheme % of TM, last set AMRAP) + 4-6 assistance exercises.

**Sample Day 1 — OHP (50 min):**
- Warm-up: bar × 10, 40% × 5, 50% × 5, 60% × 3
- Main: 65% × 5, 75% × 5, 85% × 5+ (AMRAP)
- Assistance: Pull-Ups 5×8-10, Dumbbell Row 4×10, Lateral Raise 3×15, DB Curl 3×12, Hanging Knee Raise 3×12

**Milestones:**
- Week 0 — Estimate or test 1RM on each lift; calculate TM = 90%.
- End of cycle 1 (week 4 deload) — track AMRAP rep counts; expect modest improvement.
- End of cycle 3 (week 12) — retest 1RM. Target: +5 kg upper / +10 kg lower minimum.

**Important:** This program has a non-negotiable medical-clearance disclaimer for users with prior lower-back, knee, or shoulder injuries. Auto-flagged if `mobility_limits` includes those joints — user must explicitly acknowledge.

**AMRAP-driven progression:** Standard 5-3-1 progression scheme using the §7.5 engine — TM bump rules: +2.5 kg upper, +5 kg lower per cycle when AMRAP ≥ prescribed + 1; hold TM if AMRAP = prescribed; reset TM to 90% if AMRAP < prescribed for two consecutive cycles. Aggressive overshoot (AMRAP ≥ prescribed + 5) prompts the user-confirm "Bump TM early?" dialog.

**Variants:** Standard (4×/wk) only. 5-3-1 needs 4 sessions to hit all four lifts in the wave.

**Recommended next:** Athletic Power, Hypertrophy Home for a hypertrophy block.

---

### 11.5 Calisthenics Climb — 12-Week Bodyweight Mastery

> *"I want my first pull-up and my first pistol squat. No equipment beyond a bar."*

**Goal:** First full pull-up (or 5+ if already pulling), 30+ consecutive push-ups, full-range pistol squat, 30s L-sit.

**Audience:** Any level — the program adapts via track. 12 weeks. 4 sessions/week. ~35 min/session + daily 5-min "skill snack" (GTG).

**Equipment:** Required: chinup bar + mat. Optional: dip station, resistance band (assistance).

**Why it works:** Calisthenics skills require frequent, sub-maximal practice (Pavel Tsatsouline's "Grease the Groove" / Greasing the Groove) more than they require massive sessions. We pair four full sessions a week (one pull-skill, one push-skill, one leg-skill, one conditioning) with a daily 5-minute "skill snack" of high-quality, non-fatiguing reps of the target movements. This builds neural pattern density without trashing recovery.

**Periodisation:** Skill progression ladder (each movement has 5-7 levels). Weekly volume increases until level mastery, then graduate to next level. Conditioning day stays steady. Block 3+1 deload structure across 12 weeks.

**Skill ladders:**
- Pull: Dead Hang → Negative Pull-Up → Banded Pull-Up → Inverted Row → Half Pull-Up → Full Pull-Up → Strict + Volume.
- Push: Wall Push-Up → Incline Push-Up → Knee Push-Up → Push-Up → Diamond → Decline → Archer → Pseudo Planche.
- Squat: Air Squat → Box Pistol → Counterbalance Pistol → Assisted Pistol → Free Pistol → Volume Pistol.
- Core: Tuck Hold → Tuck L-Sit → One-Leg L-Sit → Full L-Sit → Hold + Volume.

**Daily GTG (5 min, every day, including rest days):** Each day picks one ladder. Five sub-max sets of the user's current level, ≥1 hour apart if possible (or all together with full rest). Never to failure.

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Sessions | Pull Skill | Push Skill | rest + GTG | Leg Skill | Conditioning | rest + GTG | rest + GTG |

**Pull Skill day (~35 min):** Skill ladder set 5×3 at user's level + Inverted Row 4×8 + Hanging Knee Raise 3×12 + Dead Hang 3× max + Scap Pull-Ups 3×10.

**Push Skill day (~35 min):** Skill ladder 5×3 + Push-Up 4×8 (current variation) + Pike Push-Up 3×8 + Plank Shoulder Taps 3×30s + Hollow Hold 3×30s.

**Leg Skill day (~35 min):** Pistol progression 5×3 each leg + Bulgarian Split Squat 4×8 + Single-Leg Glute Bridge 3×12 + Cossack Squat 3×8 + Wall Sit 3×45s.

**Conditioning (~30 min, EMOM):** Burpees 8, Mountain Climbers 30s, Jumping Jacks 30s, Air Squat 15. 5 rounds.

**Milestones:**
- Week 0 — Baseline: max dead-hang time, max push-ups (any variation, note level), pistol squat depth (none / quarter / half / full each side), max plank.
- Week 4, 8, 12 — retest. Target by week 12: +1 ladder level on three of four skills minimum; first full pull-up if starting from inverted row level.

**AMRAP-driven progression:** The last set of the skill movement on each skill day is AMRAP (max strict reps). When the user hits **8 strict reps × 5 sets across two consecutive sessions**, the resolver graduates them to the next ladder level (e.g. Banded Pull-Up → Inverted Row → Half Pull-Up → Full Pull-Up). When reps drop below 2 for three consecutive sessions, the resolver steps the user back one level — kindly. This makes the program true to itself: progression by demonstrated capability, not the calendar.

**Variants:**

- **Standard (4×/wk + daily GTG):** as above.
- **Condensed (3×/wk + daily GTG):** combines Push Skill and Pull Skill into a single "Skill Day" twice per week and keeps Leg Skill + Conditioning. GTG is unchanged — the daily 5-min skill snack is the secret sauce of this program and stays at 7×/wk.

**Recommended next:** Hypertrophy Home (apply the strength), Athletic Power.

---

### 11.6 Fat Burn HIIT — 6-Week Conditioning

> *"I want to burn fat fast. I have no equipment, I have 30 minutes, I want it brutal but doable."*

**Goal:** 2-4 kg fat loss + significant aerobic and anaerobic fitness gains in 6 weeks.

**Audience:** Beginner-to-intermediate. 6 weeks. 5 sessions/week (3 HIIT + 2 strength endurance). ~25 min/session.

**Equipment:** Required: bodyweight + mat. Optional: jump rope.

**Why it works:** Fat loss requires a caloric deficit, period. HIIT is the highest-density way to spend 25 minutes generating one. Three HIIT sessions per week — varying the protocol to keep adaptation moving (Tabata → 30/30 → EMOM → Density Ladders) — plus two strength-endurance days that preserve lean mass under deficit, and one true rest. The progression is *density*: each week gets more rounds or less rest at the same time budget. Week 6 has measurable Cooper-test gains, not just sweat memories.

**Periodisation:** Density progression. Week 1 baseline rounds → Week 6 +60% rounds at same time and rest. No formal deload (only 6 weeks); week 6 is naturally lower volume because of test days.

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Sessions | HIIT Tabata | Strength Endurance | HIIT 30/30 | rest | HIIT EMOM | Strength Endurance | rest |

**HIIT Tabata (~22 min):** 4 rounds of (8 × 20s on / 10s off) on Squat Jumps, Push-Ups, Mountain Climbers, Burpees. 1-min rest between rounds.

**HIIT 30/30 (~25 min):** 5 rounds of (Air Squat → Push-Ups → High Knees → Jumping Jacks → Skaters), all 30s on / 30s off. 1-min rest between rounds.

**HIIT EMOM (~24 min):** 24-min EMOM. Rotate: Burpees ×8, Squat Jumps ×12, Push-Ups ×10, Sit-Ups ×15. Rest of minute = recovery. As fitness builds, increase reps.

**Strength Endurance (~25 min, AMRAP-style):** 4 rounds for time (20 Air Squats, 15 Push-Ups, 10 V-Ups, 5 Burpees). Track time each week — should drop by minute 18 by week 6.

**Milestones:**
- Week 0 — **Cooper substitute:** max burpees in 12 minutes. Plus body weight, waist measurement.
- Week 3 — mid-test: same.
- Week 6 — final test: same. Target: +30% burpee count, -2 to -4 kg, -2 to -4 cm waist.

**Important:** High-impact contraindication check. If `mobility_limits` includes 'knees' → swap plyo to low-impact alternates automatically (Skaters → Lateral Steps, Squat Jumps → Squat-Pulse, Burpees → Drop-Stand-Up).

**Recommended next:** Lean & Strong (sustainable recomp), Longevity Zone 2.

---

### 11.7 Mobility Reset — 4-Week Flexibility & Mobility

> *"I'm stiff. I want to touch my toes. I want my hips to stop clicking."*

**Goal:** +5 cm sit-and-reach, deep squat hold 60s+, full overhead reach with neutral spine, eliminate everyday stiffness.

**Audience:** Any level. Especially desk-bound, post-injury rehab finishers (with HCP clearance), or strength athletes who've neglected ROM. 4 weeks. 6 sessions/week (short). ~18 min/session.

**Equipment:** Required: mat. Optional: resistance band, yoga block.

**Why it works:** Mobility is high-frequency, low-intensity work. Six short sessions a week beat two long ones, decisively. We split into dynamic mornings (CARs, joint prep, controlled articular rotations) and static evenings (long-hold stretches once tissue is warm) — physiology of fascia and CNS prefers it that way. One longer Sunday yoga session integrates everything.

**Periodisation:** Volume progression. Week 1 baseline holds (30s static, 5 reps dynamic). Week 4 doubled (60s static, 10 reps dynamic).

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Sessions | AM Dynamic + PM Static | AM Dynamic | PM Static | AM Dynamic + PM Static | AM Dynamic | rest | Yoga long flow |

**AM Dynamic (~10 min):** Cat-Cow ×10, World's Greatest Stretch ×5/side, Hip Circles ×10/dir, Thoracic Rotations ×10/side, Deep Squat Hold ×30-60s, Down-Dog to Up-Dog ×5.

**PM Static (~15 min):** Couch Stretch 60-90s/side, 90/90 Hip 60s/side, Lying Spinal Twist 60s/side, Lat Stretch on wall 60s/side, Pigeon Pose 60-90s/side, Forward Fold 60s.

**Yoga long flow (~30 min):** Pulled from existing Hatha/Yin pose library — `js/yoga.js` Hatha style.

**Milestones:**
- Week 0 — **Baseline:** Sit-and-Reach (cm), Deep Squat Hold (s), Shoulder Flexion (lying overhead — wrists touch floor? rate 1-5), Couch Stretch (knee-to-wall distance, cm).
- Week 4 — retest. Target: +5 cm sit-and-reach, deep squat hold 60s+, shoulder flexion +1 point.

**Recommended next:** Lean & Strong, Hypertrophy Home, Yoga Foundations.

---

### 11.8 Athletic Power — 8-Week Sport Performance

> *"I want my vertical, my sprint, my agility, and my dunk back."*

**Goal:** +10% vertical jump, +10% broad jump, faster shuttle, more explosive output.

**Audience:** Intermediate-to-advanced. Healthy joints (auto-flag if knees/lower_back contraindicated — program is unsuitable). 8 weeks. 4 sessions/week. ~45 min/session.

**Equipment:** Required: dumbbells + mat + space (3m clear length). Optional: jump rope, plyo box.

**Why it works:** Power = strength × speed. The conjugate/contrast method (heavy strength → immediate plyo) recruits high-threshold motor units and primes them for explosive output — a more effective training stimulus for athletic outputs than either method alone. We pair max effort lower (heavy 3-5 reps) on Mon, dynamic effort plyo (low reps, max speed) on Tue, max effort upper on Thu, GPP/conditioning on Fri. Cluster sets (3-2-1 with 20s intra-rest) maintain bar speed at heavier loads.

**Periodisation:** Conjugate model. Max effort + dynamic effort each week. Week 4 deload (60% volume, drop plyo). Week 8 retest.

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Sessions | ME Lower | DE Lower / Plyo | rest | ME Upper | GPP / Cond | walk | rest |

**ME Lower (~45 min):** Goblet Squat clusters 5×(3+2+1) heavy, Romanian Deadlift 4×6, Bulgarian Split Squat 3×8, Single-Leg Glute Bridge 3×10, Side Plank 3×45s/side.

**DE Lower / Plyo (~40 min):** Squat Jumps 6×3 (max height, full recovery), Broad Jumps 5×3, Lateral Bounds 5×4/side, Single-Leg Pogo 4×6/side, Hollow Rocks 3×30s.

**ME Upper (~45 min):** Push-Up explosive cluster 5×(3+2+1), Pull-Ups 5×3-5 max effort, DB Bench 4×6, DB Row 4×6, Plank Up-Downs 3×8.

**GPP / Cond (~35 min):** Skipping Rope intervals 30s on / 30s off × 8, Bear Crawl 4×30s, Sled-Drag substitute (Reverse Lunges loaded) 4×8/side, Farmer's Carry 4×30s.

**Milestones:**
- Week 0 — **Baseline:** Vertical Jump (reach test, cm), Broad Jump (cm), 5-10-5 shuttle substitute (run-touch-run a 5m line, time), Push-Up explosive (max in 30s).
- Week 4 — mid-test.
- Week 8 — final. Target: +10% vertical, +10% broad, -5% shuttle time.

**Recommended next:** 5-3-1 Foundations, Hypertrophy Home (off-season build).

---

### 11.9 Glute & Posterior — 8-Week Lower Sculpt

> *"I want my glutes to grow. Not generic 'lower body' — glutes specifically."*

**Goal:** Visible glute hypertrophy, +30% on hip-thrust load, balanced posterior chain strength.

**Audience:** Beginner-to-intermediate. 8 weeks. 4 sessions/week. ~38 min/session.

**Equipment:** Required: dumbbells + resistance band + mat. Optional: bench (for hip thrusts).

**Why it works:** Glute hypertrophy needs three things: high frequency (≥2× direct work per week), full-range hip extension under load (RDL, hip thrust, glute bridge), and high-rep finishers (banded work, glute bridges to failure) for metabolic stress. We hit glutes 4×/week with deliberate load undulation: heavy day, medium day, light/density day, conditioning + glute finisher.

**Periodisation:** Daily undulating periodisation on glute volume + linear load progression on hip thrust. Week 7 deload, week 8 final push.

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Sessions | Glute Heavy | Full Body | rest | Glute Pump | Cond + Glute Finisher | walk | rest |

**Glute Heavy (~38 min, RPE 8):** Hip Thrust (or Glute Bridge loaded) 4×6-8, Romanian Deadlift 4×8, Bulgarian Split Squat 3×8, Single-Leg Glute Bridge 3×10/side, Banded Lateral Walks 3×15/side.

**Full Body (~38 min):** Goblet Squat 4×10, DB Bench Press 3×10, DB Row 3×10, RDL 3×10, Front Plank 3×45s, Glute Bridge 3×15.

**Glute Pump (~35 min, RPE 9):** Hip Thrust 3×15-20, Banded Glute Bridge to failure ×3, Curtsy Lunges 3×12/side, Single-Leg RDL 3×10/side, Fire Hydrants 3×15/side, Banded Clamshells 3×20/side.

**Cond + Glute Finisher (~30 min):** 20-min Zone 2 walk, then glute finisher: Sumo Squat Pulses 3×30s, Donkey Kicks 3×15/side, Side-Lying Leg Lifts 3×20/side, Glute Bridge Hold 3×60s.

**Milestones:**
- Week 0 — **Baseline:** Hip Thrust 8RM, Bulgarian Split Squat 8RM/side, glute circumference (cm), photo (side and rear).
- Week 4 — mid-test.
- Week 8 — final. Target: +30% hip thrust load, +20% Bulgarian load, +1-3 cm glute circumference, visible photo difference.

**Recommended next:** Hypertrophy Home, Athletic Power.

---

### 11.10 Vinyasa Foundations — 6-Week Yoga Progression

> *"I want a real yoga practice. Five flows a week. Pose milestones I can actually hit."*

**Goal:** Daily-flow capable. Hold every foundational standing pose 5+ breaths. First crow pose. Full sun salutation B uncoached.

**Audience:** Any yoga level (program adapts via difficulty track). 6 weeks. 5 sessions/week. ~30 min/session.

**Equipment:** Required: mat. Optional: block, strap, bolster.

**Why it works:** Yoga progression is about pose mastery and breath linkage, both built by frequency. Five sessions a week is the sweet spot for a deepening practice without burnout. We blend three vinyasa flows (linking breath and movement, progressing in length and pose difficulty across weeks), one yin session (deep tissue release, parasympathetic recovery), and one Hatha session (alignment, hold-based, no flow) so the user trains every facet.

**Periodisation:** Pose progression ladder. Weeks 1-2 foundations (mountain, warrior 1/2, downward dog, child's pose, seated forward fold). Weeks 3-4 standing balances + binds (warrior 3, half-moon, eagle, side angle). Weeks 5-6 introduce inversions/arm balances (crow pose, dolphin, partial headstand against wall).

All sessions resolve via existing `js/yoga.js` style/pose pickers — programs declare style + duration + target poses for the day.

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Sessions | Vinyasa Flow A | Yin (long holds) | Vinyasa Flow B | rest | Hatha (alignment) | Vinyasa Flow C | rest |

**Vinyasa Flow A — Sun Salute focus (~30 min):** Sun Salutations A and B chain practice + standing pose flow.

**Yin (~35 min):** Pulled from `js/yoga.js` Yin style — long holds (90-180s) targeting hips, hamstrings, fascia.

**Vinyasa Flow B — Standing balances (~30 min):** Tree, Warrior 3, Half-Moon, Eagle.

**Hatha (~30 min):** Pulled from `js/yoga.js` Hatha style — alignment-driven hold-based practice.

**Vinyasa Flow C — Peak pose week's progression target (~30 min):** Builds toward week-specific peak (sun salute B → bind → arm balance → crow).

**Milestones:**
- Week 0 — **Baseline:** time held in Warrior 3 each side, Down-Dog comfort (1-5), can crow pose (binary), full sun salute B uncoached (binary).
- Week 3 — mid-test.
- Week 6 — final. Target: Warrior 3 × 30s/side, Down-Dog comfort 4/5+, crow pose ≥3s, sun salute B uncoached.

**Recommended next:** continue at user's pace; or Mobility Reset for rest cycle; or a strength program for cross-training.

---

### 11.11 Longevity Zone 2 + Strength — 12-Week Healthspan

> *"I'm 45+. I want to live well to 90. Train accordingly."*

**Goal:** Build aerobic base (Zone 2 capacity). Maintain or modestly add muscle. Improve resting and recovery HR. Joint health daily.

**Audience:** 35+, especially 50+. Any level. 12 weeks. 5 sessions/week. ~30-40 min/session.

**Equipment:** Required: bodyweight + mat. Optional: dumbbells, jump rope.

**Why it works:** The two strongest predictors of all-cause mortality are VO2max and grip/lower-body strength. Zone 2 training (60-70% max HR) builds mitochondrial density — the engine of VO2max — at low joint cost. Two well-designed full-body strength sessions a week preserve and modestly grow muscle, with a Zone 2 + strength blend specifically validated by longevity researchers (Attia, San Millán) as the highest-ROI training for healthspan. Daily 5-minute mobility "snacks" keep joints young.

**Periodisation:** Volume progression on Zone 2 (30 min → 50 min by week 8). Linear strength progression on key compound lifts. Week 4, 8, 12 are testing weeks (no separate deload — moderate intensity throughout).

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Sessions | Strength Full Body | Zone 2 (30-50 min) | Mobility (20 min) | Strength Full Body | Zone 2 | walk + Mobility | rest |

**Strength Full Body (~35 min, RPE 7):** Goblet Squat 3×10, Romanian Deadlift 3×10, Push-Ups 3×8-12, DB Row 3×10, Farmer's Carry 3×30s, Front Plank 3×45s.

**Zone 2 (~30-50 min):** Brisk walk, jog, skipping rope, bike, or stair-climb. Heart rate target 60-70% max HR (or "talk-test pace" if no HR monitor). Watch HR if available.

**Mobility (~20 min):** From Mobility Reset library — daily joint health.

**Milestones:**
- Week 0 — **Baseline:** Resting HR (morning, 7-day average), 1-min recovery HR drop after Zone 2, Push-Up max, Plank hold, single-leg balance time/side.
- Week 4 — mid-test.
- Week 8 — mid-test.
- Week 12 — final. Target: -5 bpm resting HR, +10 bpm 1-min recovery, +30% push-up max, plank 90s+.

**Recommended next:** Repeat with lower volume as a yearly maintenance pattern. Or Mobility Reset block. Or Hypertrophy Home for a build cycle.

---

### 11.12 Postnatal Restore — 8-Week Return to Training

> *"I'm postpartum, cleared by my GP, and I want to come back to my body without breaking it."*

**Goal:** Restore deep core function, pelvic floor coordination, posture, and gentle full-body strength. Build back to a normal training base.

**Audience:** Postpartum, ≥6 weeks post-delivery, **GP/midwife cleared** (mandatory disclaimer). Beginner-level baseline assumed even for users who were strong pre-pregnancy. 8 weeks. 4 sessions/week. ~25-30 min/session.

**Equipment:** Required: mat. Optional: resistance band, light dumbbells (2-5 kg).

**Why it works:** Postnatal return is its own discipline, not "beginner program but slower." The priorities are pelvic floor coordination (breath-driven, not Kegel-only), deep core (transverse abdominis activation before any planking or crunching), glute reactivation (often dormant from late pregnancy), and gradual reload — all before any high-impact, front-loaded core, or heavy compound work. We strictly prohibit jumping, crunches, and high-intensity work in weeks 1-4. The progression is conservative on purpose; the goal is to come back stronger than before, not faster.

**Periodisation:** Slow ramp. Weeks 1-2 connection phase (breath, glutes, posture). Weeks 3-4 stabilisation (deep core integration, gentle limb load). Weeks 5-6 base reload (full body strength at low load). Weeks 7-8 progression reload (RPE rises to 7, full ROM compounds, optional brief intervals).

**Weekly skeleton:**

| Day | Mon | Tue | Wed | Thu | Fri | Sat | Sun |
|---|---|---|---|---|---|---|---|
| Sessions | Connection / Core | Walk + Mobility | rest | Glute & Posture | walk | Full Body Gentle | rest |

**Connection / Core (~25 min):** Diaphragmatic breathing, 360° breath drill, Glute Bridge with breath, Bird Dog, Dead Bug, Side-Lying Leg Lift, Cat-Cow, Pigeon Pose.

**Glute & Posture (~25 min):** Glute Bridge 3×12, Single-Leg Glute Bridge 3×8/side, Banded Lateral Walks 3×15/side, Wall Slides (shoulders) 3×10, Bird Dog 3×8/side, Side Plank from knees 3×20s/side.

**Full Body Gentle (weeks 5+, ~30 min):** Goblet Squat (light) 3×10, RDL 3×10, Wall Push-Ups (later regular) 3×10, DB Row (light) 3×10, Glute Bridge 3×12, Bird Dog 3×30s/side.

**Walks (weeks 1-8):** 20-30 min daily-ish, easy pace, push stroller fine. Builds aerobic base safely.

**Strict prohibitions for weeks 1-4 (and longer if symptoms persist):** No jumping. No crunches/sit-ups/V-ups. No front planks unsupported. No heavy bilateral loaded squats. No running. If user experiences leaking, doming, or pelvic pressure → STOP and consult HCP. The program surfaces this prominently every assessment.

**Milestones:**
- Week 0 — **Baseline (self-assessment):** diastasis check explainer (linked educational), pelvic tilt control (1-5), breath quality (1-5), glute bridge hold (s), incline plank hold (s).
- Week 4 — mid-test (same).
- Week 8 — final. Target: confident pelvic tilt, breath quality 4+, glute bridge 60s, incline plank 60s.

**Important:** This program ships with a hard medical-clearance gate — user must explicitly acknowledge GP/midwife clearance to start. Onboarding sheet has explicit symptom-stop criteria. This is the only program with this gate.

**Recommended next:** Lean & Strong (recomp), Glute & Posterior, First Move (re-foundation if needed).

---

## 12. Edge Cases & Behaviour

### 12.1 Missed days

When the user opens the app and a scheduled day was skipped (current date > scheduled date for an unstarted day), they see a small modal:

- "You missed Day 3 of Week 2 yesterday. What do you want to do?"
  - **Do it today** (move it to today, push the rest of the week back one day if scheduled by day-of-week)
  - **Skip it** (mark as missed, continue to today's scheduled day)
  - **Shift the whole week** (push every remaining day back one day; pause is one day)

After 3 missed days in a row, the modal becomes: "Three days off. Want to **pause** the program for a week, or shift everything forward?"

### 12.2 Pause

User can pause the program for up to **14 days**. During pause: no notifications, the home screen shows "Paused — resume anytime" with the resume CTA. After 14 days the program auto-pauses indefinitely; reopening prompts a soft restart-or-abandon decision.

### 12.3 Abandon

Abandoning is a two-tap confirm with the consequences spelled out: "You'll keep your milestone records but Day 7 of Week 4 will be lost. Trial program slot will not be returned."

Past programs (abandoned or completed) appear in `wk_programs_history` and are visible from Settings → Past programs. A user can see their old First Move milestones forever even if they never finished it.

### 12.4 Equipment changes mid-program

The program ignores equipment changes during the run (uses snapshot). Settings → Active program → "Re-tune to current equipment" runs a fresh resolution pass over remaining workouts. No exercises are retroactively changed in completed sessions.

### 12.5 Profile changes mid-program

Same as 12.4. Fitness level, age, BMI, mobility limits — snapshotted at start, ignored unless user re-tunes.

### 12.6 Trial program completion

When the trial program is completed:

- Completion screen shows full milestone deltas.
- "Recommended next" surfaces 3 Pro programs matched to the user's profile + preferences.
- "Restart First Move" CTA is disabled — copy explains trial slot is consumed.
- Overlaid paywall — friendly, not aggressive.

### 12.7 Pro lapses mid-program

- Active program continues to completion.
- Notifications continue.
- Re-tune still works.
- Past programs still visible.
- New program Start CTAs are paywalled.
- Banner on home: "Your Pro lapsed. Finish [program]; renew to start new programs."

### 12.8 First-launch after migration

Users with an existing data history but no programs see a new "Try a program" card at the top of Library on first launch post-update, dismissable. Routes to the Programs library with the trial program highlighted.

### 12.9 Sync conflicts

If two devices both attempt to start a program simultaneously (rare), the later write wins. The earlier program's started_at + completed sessions are preserved in `wk_programs_history` as "abandoned" with a friendly note. We accept this complexity in exchange for matching existing iCloud KV semantics.

### 12.10 Deleted exercises

If a future exercise rename or removal in `js/exercises.js` orphans a program reference, the resolver falls back to the `swap_alternatives` chain. If no alternatives exist (only inline workouts), it falls through to the generator brief. We log a warning to the console and surface a single "Tap to swap" UI to the user — never a hard failure.

---

## 13. Resolved Decisions

These were open questions during initial drafting. Resolved 2026-05-05; all are baked into the spec above.

| # | Question | Decision | Where it lives |
|---|---|---|---|
| 1 | Trial program: hard-coded or user-pick? | **Hard-code First Move.** Simpler funnel, easier trial-consumed tracking, predictable journey. | §9.1, §11.1 |
| 2 | Nutrition / sleep cross-promotion intensity? | **In-line copy on detail pages only.** No separate articles, no tracking, no integration. Lean & Strong protein/sleep guidance is the canonical pattern. | §11.2, §11.6, §11.11 |
| 3 | Community / social features? | **Out of scope. Ship milestone share-card (PNG) only.** No auth, no server, no abuse surface — but a real shareable artefact for users who want to brag. | §8.3.1 |
| 4 | AMRAP auto-regulation? | **Build adaptive from day one.** AMRAP-driven progression on 5-3-1, Calisthenics, Lean & Strong, Hypertrophy. Other adaptivity (RPE-driven, missed-day-driven) explicitly out of scope. | §3 (non-goals), §6.4 (`amrap_log`, `progression_overrides`), §7.5 |
| 5 | Condensed 3-day/wk variants? | **For top 4 programs only:** Lean & Strong, Hypertrophy Home, Calisthenics Climb. (First Move is already 3×/wk so no separate variant.) Other 8 programs ship single-track. Revisit based on completion data. | §11.1, §11.2, §11.3, §11.5 |
| 6 | HealthKit program metadata? | **Yes — attach program metadata.** `program_id`, `program_name`, `week`, `day`, `is_milestone` written to HKWorkout metadata. Costs nothing now, unlocks future Apple Fitness deep-linking. | §10.2 (HealthKitPlugin), §15 (acceptance) |
| 7 | Watch surfaces milestones? | **Yes — day-of-program + milestone preview.** "Test day tomorrow" 48h ahead, milestone-delta haptic + glance after retest. | §8.4 |

---

## 14. Appendix A — Exercise Database Additions Needed

The 12 programs above reference some exercises that don't yet exist in `js/exercises.js`. The resolver's swap-chain + generator-fallback handles missed lookups gracefully at runtime, but a clean implementation should add these entries so programs use the right exercise (with full metadata, contraindications, etc.) rather than substitutes.

These additions are non-blocking — programs ship with the swap chains pointing to existing exercises — but adding them lifts program quality.

### A.1 Accessory lifts (commonly referenced)

| Exercise | Cat | Equip | Why it's useful |
|---|---|---|---|
| Hammer Curl | upper-pull-arm | dumbbell | Distinct from supinated curl; biceps + brachialis emphasis |
| Lateral Raise | shoulders | dumbbell | The single most common shoulder hypertrophy lift |
| Triceps Kickback | upper-push-arm | dumbbell | Triceps long head, no equipment beyond DB |
| Triceps Overhead Extension | upper-push-arm | dumbbell | Long-head triceps, vital for hypertrophy |
| Hollow Rocks | core | bodyweight, mat | Dynamic version of Hollow Hold |
| Wall Push-Up | push-h | bodyweight | True beginner push-up regression |
| Plank Up-Downs | core | bodyweight, mat | Already similar to "Plank to Push-Up" — could rename or alias |
| Side-Lying Leg Lift | lower-glute | bodyweight, mat | Glute medius isolation, postnatal-safe |
| Wall Slides | upper-pull-shoulders | bodyweight | Thoracic + scapular control, postnatal-safe |

### A.2 Mobility & stretching additions

| Exercise | Cat | Why |
|---|---|---|
| Forward Fold | mobility | Hamstring + lower-back length |
| Lying Spinal Twist | mobility | T-spine + glute medius |
| Hip Circles | mobility-dynamic | Joint prep |
| Lat Stretch (wall or doorway) | mobility | Lat + serratus length |
| Pigeon Pose | mobility | Hip external rotation, glute |
| 90/90 Hip (already exists as Hip Openers) | — | confirm naming |

### A.3 Calisthenics progression ladders

The Calisthenics Climb program uses progression ladders. Each level is a distinct exercise with its own diff/joint_load profile.

**Push-Up ladder:** Wall Push-Up → Incline Push-Up (✓) → Knee Push-Up (✓) → Push-Up (✓) → Diamond Push-Up (✓) → Decline Push-Up (✓) → Archer Push-Up → Pseudo Planche Push-Up.

**Pull-Up ladder:** Dead Hang → Negative Pull-Up (✓ as "Negative Pull-Ups") → Banded Pull-Up → Inverted Row (✓) → Half Pull-Up → Full Pull-Up (✓) → Strict Pull-Up + Volume.

**Pistol Squat ladder:** Air Squat (✓) → Box Pistol → Counterbalance Pistol → Assisted Pistol → Free Pistol → Volume Pistol.

**L-Sit ladder:** Tuck Hold → Tuck L-Sit → One-Leg L-Sit → Full L-Sit (✓ as "L-Sit") → Volume L-Sit.

Add the missing levels to the DB so the program can address each level by name. Each entry needs `min_fitness`, `complexity`, `contraindicated_for` configured to its actual demands.

### A.4 Plyometric additions (Athletic Power)

| Exercise | Cat | Notes |
|---|---|---|
| Lateral Bounds | plyo | Frontal-plane power, knee-friendly |
| Single-Leg Pogo | plyo | Ankle stiffness, low-amplitude |
| Drop-Stand-Up | low-impact-plyo | Burpee substitute for knee-contraindicated users |
| Lateral Steps | low-impact-plyo | Skater substitute for knee-contraindicated users |
| Squat-Pulse | low-impact-plyo | Squat-jump substitute for knee-contraindicated users |

### A.5 Postnatal-specific additions

| Exercise | Cat | Notes |
|---|---|---|
| Diaphragmatic Breathing | breath | 5-min seated/lying foundational drill |
| 360° Breath | breath | Lateral + anterior + posterior expansion |
| Glute Bridge with Breath Sync | core-glute | Postnatal-safe core integration |

These are foundational rehab-category exercises. They need a new `cat: 'breath'` and `cat: 'core-glute'` (or similar) so they can be safely surfaced only in the postnatal program.

### A.6 Implementation note

Adding these can ship as a single PR alongside the Programs feature, OR programs can ship first and additions follow in 1-week increments. Each missing exercise referenced by name will fall through `swap_alternatives` to a near-match (e.g. "Hammer Curl" → "Dumbbell Curls"), which is acceptable for v1 launch but a known known.

---

## 15. Acceptance Checklist

Programs ships when:

- [ ] All 12 programs in `js/programs.js` resolve to valid exercise references for every (level × equipment-tier) profile combo in the test matrix.
- [ ] Trial program completes end-to-end on iOS Simulator and TestFlight without a single workout failing to resolve.
- [ ] Trial-consumed flag survives app uninstall + reinstall (proven via iCloud KV restore).
- [ ] Active program continues to completion when Pro is downgraded mid-program.
- [ ] All four new localStorage keys round-trip through export/import JSON backup.
- [ ] Watch shows program day correctly during a programmed workout.
- [ ] HealthKit logs include program metadata.
- [ ] Notifications fire at user-scheduled time within 5 minutes accuracy.
- [ ] Abandoning a program removes it from active state and adds it to history with status='abandoned'.
- [ ] Postnatal program cannot be started without explicit clearance acknowledgment.
- [ ] Paywall.programs surface displays per-goal copy variant correctly.
- [ ] Library tab order: Programs · Workouts · Exercises · Equipment.
- [ ] Heatmap days from program sessions render with the program's theme colour.
- [ ] No regression on existing Setup → Picker → Timer → Done flow when no program is active.
- [ ] **AMRAP-driven progression** — completing an AMRAP set with reps > prescribed_top + 1 generates a `progression_overrides` entry; next session's prescribed reps/load reflect it; the override is consumed once applied.
- [ ] **Progression engine respects deload weeks** — overrides do not apply during deload weeks; original prescription is honoured.
- [ ] **Aggressive overshoot confirm** — AMRAP ≥ prescribed + 5 prompts the user-confirm dialog before applying TM bump.
- [ ] **Stall logic** — two consecutive cycles of AMRAP < prescribed reset 5-3-1 TM to 90%.
- [ ] **Smart Progression toggle** — Settings switch reverts to pure-static prescriptions; existing overrides are cleared.
- [ ] **Condensed variants ship for** Lean & Strong, Hypertrophy Home, Calisthenics Climb (First Move stays single-track at 3×/wk).
- [ ] **Milestone share-card** — generates a 1080×1350 PNG via OffscreenCanvas; opens in iOS share sheet; uses program theme colour.
- [ ] **HealthKit program metadata** — completed program sessions write `HW_PROGRAM_ID`, `HW_PROGRAM_NAME`, `HW_WEEK`, `HW_DAY`, `HW_IS_MILESTONE` to HKWorkout metadata; non-program sessions remain unchanged.
- [ ] **Watch milestone preview** — complication highlights "Test day tomorrow" within 48h of a milestone day; milestone-delta haptic fires after a retest is logged.

---

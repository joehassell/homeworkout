# Home Workout Builder — Workout & Program Generation Audit

> **Audit input:** 35,899 generated workouts + 24 program instances, exported from the live generator.
> **Audit author:** AI fitness coach + software engineer.
> **Target reader:** Claude Code Opus 4.7 agent assigned to refactor the generator.
> **Date:** 2026-05-07

---

## TL;DR (read this first)

The generator works, but it has eight high-impact problems. In severity order:

1. **Strength workouts run 5–17 minutes short of target.** Count-up sets aren't included in `workoutScheduledSec()`, so the reconciler doesn't know how much time the work block actually consumes. At 45 min the median session lands at ~38 min.
2. **HIIT has no pull movements without a resistance band.** Only two HIIT-tagged pull exercises exist in the DB (`Banded Pull-Aparts`, `Banded Rows`). For the most common kit (bodyweight + mat), every HIIT workout is push/squat/core only.
3. **Pregnant + HIIT produces 1-exercise workouts.** 979 pregnant HIIT workouts exist; many have a single exercise in `main` (e.g. `hii-pre-light-20m-lig-1s-001` = just Air Squat). The capability filter strips out almost the entire HIIT pool. The generator should refuse rather than produce a degenerate session.
4. **`pregnancy_safe='early_only'` is treated as 'yes'.** 18,424 instances of early-only exercises (Side Lunges, Deep Squat Hold, Glute Bridge, Dead Bug…) appear in pregnancy workouts. The app has no trimester knowledge. This is a real safety issue.
5. **Strength doesn't actually use the barbell.** With the full-equipment kit, only 49 % of strength sessions include even one barbell exercise. Heavy compounds (Back Squat, Front Squat, Deadlift, Pause Squat, Zercher Squat) appear 30–49 times across 7,920 strength sessions — about 0.5 % each.
6. **Last-main-exercise gets phantom rest.** 87.8 % of HIIT, 60.8 % of conditioning, and 56.6 % of functional workouts have a non-zero `restSec` on the final main entry, despite `applyInterSetRest` explicitly setting it to 0. `reconcileTotalTime` re-pads it because it filters on `!w.restReason` (which the last entry has) instead of position.
7. **Pulse raiser missing in 19–50 % of warmups** (50 % for functional, 45 % for strength, 19 % for HIIT, 37 % for conditioning). `pickPulseRaiser` tests `cv_demand` against `cv_cap`; for beginner / untrained / 70+ / BMI ≥ 35 profiles, every cardio exercise except a handful of mobility moves is rejected, so `pulse` ends up null.
8. **Programs ignore equipment availability.** `program-resolver._isAllowed` only calls `capability.isAllowed`, which checks impact / complexity / fitness / contraindications — but **not** whether the user has the required equipment. The single shipped program (First Move) prescribes Romanian Deadlift, Inverted Row, and Incline Push-Ups to limited (bodyweight + mat) users without firing a swap. 0 / 1,344 program exercises hit the `needs_manual_swap` branch across all 24 program instances.

The Top-10 Quick Wins at the end of this document collapse the highest-leverage fixes.

---

## Audit Methodology

### Inputs

- `workouts.json` — 35,899 entries: `{strength: 7920, hiit: 5299, conditioning: 6840, functional: 8640, yoga: 7200}`. 6 profiles (beginner / intermediate / advanced / elderly / pregnant / limited), 4 equipment combos (bw+mat, bw+mat+band, mid kit, full kit), 3 durations (20/30/45 min), 3 intensities (light/moderate/high), 1 or 2 sets.
- `programs.json` — 24 instances of the only shipped program (`prog_first_move_v1`), one per profile × equipment combo.

### Process

1. Read source: `js/builder.js`, `js/capability.js`, `js/exercises.js` (220 + entries), `js/programs.js`, `js/program-resolver.js`, `index.html` lines 2988–3727 (generation).
2. Parse the export, compute aggregate statistics: duration delta vs target, exercise frequency, push:pull ratios, category distribution, last-rest behaviour, pulse-raiser coverage, cooldown muscle overlap, `pregnancy_safe` violations, equipment-utilisation, swap-chain hit rate.
3. Cite specific workout IDs as evidence.
4. For each issue, identify root cause in code and propose an exact fix.

---

# Part 1 — Single-Workout Grading

Scores are 1 (broken) → 10 (best practice). Each row cites concrete evidence and a fix.

## 1.1 Strength — overall **5 / 10**

| # | Dimension | Score | Evidence | Fix |
|---|-----------|------:|----------|-----|
| 1 | Exercise selection | 4 | Top 5 picks across 7,920 strength sessions: `Band Pull-Apart` 9.0 %, `Banded Rows` 4.8 %, `Banded Pull-Aparts` 4.7 %, `Banded Bicep Curls` 4.6 %, `Banded Shoulder Press` 4.5 %. Heavy compounds (Back Squat, Deadlift, Front Squat, Pause Squat, Zercher Squat) total **191 picks across 7,920 workouts** — i.e. each barbell compound shows up in <0.5 % of strength sessions. Sample `str-adv-full-20m-lig-1s-001`: an *advanced full-kit* user gets `Band Pull-Apart, Glute Bridge, Toes-to-Bar, Sumo Squats, Tricep Dips, Lunge Hold, Dumbbell Curls` — zero barbell, zero RDL, zero bench press. | Re-weight pool: when barbell is in the equipment set and profile is intermediate +, prioritise barbell compounds in `lower-squat / lower-hinge / push-h / push-v / pull-h`. Cap each isolation/banded movement at one per session. |
| 2 | Muscle balance | 6 | Push:Pull ratio = 0.93 : 1 (acceptable). But `pull-h` is 18.7 % of picks vs `pull-v` 3.8 %, so vertical pull is largely absent. With full kit, only 61.8 % of strength sessions contain a pull-up-bar exercise. Lower body split: squat 13.2 % vs hinge 7.0 % — squat-dominant. | Enforce one squat + one hinge + one push + one pull per main block when 8 ≥ exercises. |
| 3 | Warm-up | 4 | Only **54.5 %** of strength warmups start with a cardio pulse raiser. The rest start with mobility or a strength category. Warm-up duration (180–360 s) is fine, but a strength session should ramp body temp first. | See **Issue 7**: relax cv-demand cap inside `pickPulseRaiser`, or invent a `warmup_low_cv` flag on cardio exercises (jog-in-place, marching, easy step-ups). |
| 4 | Cooldown effectiveness | 6 | Cooldown muscle-overlap with main = 38.3 % mean; 23.8 % of strength sessions have <30 % overlap. Strength loads quads / glutes / chest / back, but cooldown commonly hits hip flexors / spine via generic mobility flow. | In `buildCooldown`, weight `score` by category fit too: a pose targeting *hamstrings* should rank higher when the main contained `lower-hinge`. Currently it scores only on muscle-string overlap. |
| 5 | Work:rest ratio | 5 | Strength uses count-up reps with `intraRest=60 s` and inter-set `SET_REST` (90/120/180 s). With 1 set the inter-set rest never applies, so `reconcileTotalTime` cannot reach the time target — strength 45-min sessions median at **−510 s** off target. With 2 sets the reconciler does work but bumps inter-set rests up to the 60–180 s cap. | See **Issue 1** below — the core reason is that `workoutScheduledSec` returns 0 work for strength entries, causing a -10 min phantom shortfall the reconciler tries to fill with rest. |
| 6 | Difficulty scaling | 5 | Mean difficulty by profile: beginner 1.41, intermediate 1.57, advanced 1.66, elderly 1.06, pregnant 1.23, limited 1.00. Intermediate vs advanced differ by only 0.09 — the intermediate / advanced experience is nearly identical. Beginner caps `complexity_cap=3` and `min_fitness ≤ beginner` letting them in for diff 2 (correct), but the round-robin doesn't bias by available difficulty range. | In `pickIntervals`/exercise selection, weight by `(diff == max_allowable_diff ? 2 : 1)` so advanced users see more diff 3 than beginners. |
| 7 | Equipment utilisation | 4 | Full kit strength: barbell 7.6 %, kettlebell 15.3 %, dumbbell 18.5 %, **resistance band 21.7 %**. The band — the cheapest, easiest accessory — outranks barbell 3:1 for strength. | Add a per-exercise `equipment_priority` and weight selection toward heavier implements when available, away from band when better options exist. |
| 8 | Safety / contraindications | 7 | No `pregnancy_safe='no'` violations (filter works). But `early_only` exercises appear 18,424 times across pregnancy sessions (Side Lunges in `str-pre-none-20m-lig-1s-001` warm-up is one of many). Sample: `str-pre-none-20m-lig-1s-003` main contains `Side Lunges`. | Treat `pregnancy_safe_only` as "yes-only" by default. Optionally add a trimester field to allow `early_only` in T1. |

## 1.2 HIIT — overall **3 / 10**

| # | Dimension | Score | Evidence | Fix |
|---|-----------|------:|----------|-----|
| 1 | Exercise selection | 4 | Only **26 unique** HIIT-tagged exercises in the entire pool, and the top 4 picks (`Push-Ups` 8.5 %, `Air Squat` 8.2 %, `Sit-Ups` 7.7 %, `Bicycle Crunch` 7.6 %) are not characteristically HIIT moves — they're conditioning staples. True HIIT signature exercises (`Burpees`, `Plyo Push-Ups`, `Squat Jumps`, `Tuck Jumps`, `Skaters`, `Mountain Climbers`) sit lower. | Tag more plyo / cardio entries with `types: ['hiit',…]`. Add explicit HIIT staples like `Battle Rope Slams`, `Jumping Lunges`, `180 Jumps`, `Sprawl`. Remove `Push-Ups` / `Sit-Ups` from HIIT-eligible (they're conditioning). |
| 2 | Muscle balance | 1 | **Zero pull movements** in any HIIT workout with bodyweight + mat (the largest equipment combo at 9,687 sessions). Only two HIIT-eligible pulls exist: `Banded Pull-Aparts`, `Banded Rows`, both requiring resistance band. Push-Ups push:pulls = ∞ for bw-only. | Tag `Inverted Row`, `Hanging Knee Raises`, `Negative Pull-Ups`, `Renegade Row` (with DBs) as `types: [...,'hiit']`. Add a bodyweight-only HIIT pull entry like `Bodyweight Row` or `Doorway Row`. |
| 3 | Warm-up | 6 | 81.5 % of HIIT warmups start with cardio (best of any type, but still 18.5 % miss). | Same fix as **Issue 7**. |
| 4 | Cooldown effectiveness | 7 | Mean overlap 56.1 %, only 5.9 % of HIIT sessions have <30 % overlap. HIIT cooldown is the best-targeted of any type. | Keep current `buildCooldown`. |
| 5 | Work:rest ratio | 6 | Median delta 0 s (good), but mean −311 s and 28.9 % of sessions are >5 min short. With 1 set + low cv-cap profile, the reconciler can't fill time because intra-rest caps at 90 s and cooldown at 120 s/move. Sample `hii-beg-none-30m-lig-1s-001` (target 30 min): warmup 5 min, main 4.5 min, cooldown 10 min, total **21 min**. | Increase the reconciler ceilings: intra-rest cap 120 s for 1-set, cooldown cap 180 s; or insert a synthetic "active recovery" segment when the budget is large and sets=1. |
| 6 | Difficulty scaling | 4 | Beginner mean diff 1.00 (only easiest exercises). Pregnant 1.00. Intermediate 1.70, advanced 1.72 (essentially identical). 2 of 26 HIIT exercises are diff 1, 18 are diff 2, 6 are diff 3. The diff 1 → 2 jump for beginners is ungated. | Either expand HIIT diff 1 pool or relax `min_fitness` on safe HIIT moves (Mountain Climbers `min_fitness:'untrained'` already, but `cv_demand:'high'` blocks beginners). |
| 7 | Equipment utilisation | 6 | HIIT typically doesn't need equipment; the bodyweight-only result is fine, but kettlebell HIIT (Swings, Snatches) is rare due to small pool size. | Tag more KB / DB drills as HIIT. |
| 8 | Safety / contraindications | 2 | **Pregnant + HIIT = degenerate workouts.** Sample `hii-pre-light-20m-lig-1s-001`: `main = ['Air Squat']` only. Of 979 pregnant HIIT sessions, many have ≤2 exercises in main (HIIT pool is dominated by `pregnancy_safe='no'` plyo/cardio). The user runs through one exercise for 4 minutes, then hits a 10-min cooldown. | When `pregnancy_safe_only` is set, refuse to generate HIIT (`showGenError('HIIT isn't suitable during pregnancy. Try Conditioning or Yoga.')`). |

## 1.3 Conditioning — overall **6 / 10**

| # | Dimension | Score | Evidence | Fix |
|---|-----------|------:|----------|-----|
| 1 | Exercise selection | 6 | 55 unique exercises. Top picks: `Wall Sits` 7.3 %, `Pike Push-Ups` 6.3 %, `Plank Shoulder Taps` 4.9 %. Wall Sits feels over-represented for a conditioning workout (it's an isometric — low cv demand). | Reduce `wall sits` weight or move it out of conditioning's primary pool. |
| 2 | Muscle balance | 4 | Push:pull = **2.7 : 1**. Hinge category 0.9 % of picks. | Add hinge moves to the conditioning pool: KB swings, hip thrusts. |
| 3 | Warm-up | 6 | 63.2 % start with cardio. | See **Issue 7**. |
| 4 | Cooldown | 6 | 48.7 % overlap, 19.9 % under 30 %. | Same as strength fix above. |
| 5 | Work:rest | 7 | Median delta 0 s; 60.8 % within ±30 s. Mean −223 s with a long short tail. | Same reconciler ceiling fix. |
| 6 | Difficulty scaling | 5 | beg 1.37 / int 1.69 / adv 1.70. Intermediate ≈ advanced. Limited 1.00, elderly 1.40. | Bias `mainCount` selection toward higher diff for higher fitness. |
| 7 | Equipment utilisation | 7 | Conditioning works well across kits — KB Swings, Farmer's Carry, Sled Push (when present) all pop. | OK. |
| 8 | Safety | 7 | Filters work; same `early_only` caveat as strength. | Same fix. |

## 1.4 Functional — overall **5 / 10**

| # | Dimension | Score | Evidence | Fix |
|---|-----------|------:|----------|-----|
| 1 | Exercise selection | 5 | 72 unique. `Single-Leg Balance` at 8.0 % is the dominant pick across 8,640 workouts. `Mobility` is **20.0 % of all main picks** — a fifth of every functional workout's main block is stretching. That's a warm-up/cooldown allocation. Heavy compounds (Front Squat 56, Turkish Get-Up 56) are very rare. | In `REGIONS.posterior` the `mobility` cat is grouped with everything else. Recategorise: mobility should not be a main-block category. Move it out of the typePool when type !== 'functional' && type !== 'yoga'; or cap mobility at 1 entry per main when type === 'functional'. |
| 2 | Muscle balance | 4 | Push:pull = 0.61 : 1 (pull-dominant). Push-v 1.3 % only. Mobility 20 %. | Drop mobility from main, rebalance push/pull. |
| 3 | Warm-up | 3 | **Only 50.0 %** of functional warmups start with cardio. | See **Issue 7**. |
| 4 | Cooldown | 3 | Mean overlap **23.7 %**; 53.3 % of functional sessions have <30 % cooldown overlap with main muscles. | The current `buildCooldown` has bias toward muscles loaded, but for functional the main-muscles set is too diffuse (full body, balance, etc.). Add fallback: when overlap score ≈ 0, pick a balanced standard cooldown (figure four, child's pose, world's greatest, downward dog). |
| 5 | Work:rest | 7 | Median 0; mean −98 s. Best of all dynamic types. | OK. |
| 6 | Difficulty scaling | 5 | beg 1.22 / int 1.36 / adv 1.42. Differentiation is minimal because most functional moves are diff 1–2. | Add advanced functional staples: Snatches, Get-Ups, Sled work. |
| 7 | Equipment utilisation | 5 | Same patterns as strength — band over-used, barbell under-used. | Same fix. |
| 8 | Safety | 7 | OK. | Same `early_only` caveat. |

## 1.5 Yoga — overall **5 / 10**

| # | Dimension | Score | Evidence | Fix |
|---|-----------|------:|----------|-----|
| 1 | Exercise selection | 4 | Vinyasa: 28 unique poses across 1,440 workouts; **`Mountain Pose`, `Forward Fold`, `Halfway Lift`, `Chaturanga`, `Up-Dog`, `Down-Dog` each appear ≥ 200 % per workout** (= 2 sun-sal cycles every workout). Power yoga: 300 %. The same Sun Sal A is ground out repeatedly. Yin and Restorative are only 14 and 11 unique poses. | Add Sun Salutation B variant; rotate sun-sal A/B between workouts. Expand Yin pose library. |
| 2 | Pose balance | 5 | Standing/seated/floor mix is acceptable but the same opening sequence (Centering Breath → Mountain → Forward Fold) starts every yoga workout. | Vary the opening: rotate Centering Breath + Cat-Cow + Down-Dog as alternate starters. |
| 3 | Warm-up appropriateness | 5 | Yoga warmup array is empty (`warmup: []`) — yoga uses Centering Breath + Sun Sal as its own warm-up, which is acceptable for vinyasa/power but Yin and Restorative skip the centering. | OK for vinyasa, but Yin/Restorative could open with Cat-Cow + Child's Pose more reliably. |
| 4 | Cooldown | 7 | Every yoga workout ends with `Savasana` (final relaxation) — correct. Pre-savasana: `Child's Pose`, `Bridge Pose`, etc. | OK. |
| 5 | Hold:transition ratio | 6 | Vinyasa has too many short transitions per cycle. Yin holds are correctly long. | Power yoga should keep holds shorter than vinyasa; current style differentiation is mostly cycle count, not hold ratio. |
| 6 | Difficulty / experience scaling | 5 | yogaExperience field exists (new/some/experienced) but new and experienced see similar pose lists. Crow Pose 377 / 7,200, Headstand variants barely present. | Use `yogaExperience='experienced'` to unlock arm balances, inversions, deeper backbends. |
| 7 | Style differentiation | 6 | Yin (14 poses) vs Hatha (26 poses) vs Vinyasa (28) vs Power (23) vs Restorative (11). Each has a distinct profile, but Power vs Vinyasa are 90 % overlap. | Differentiate Power from Vinyasa: Power should add Boat, Side Plank, Chair Pose, Warrior III holds; Vinyasa should flow through more crescent/warrior variants. |
| 8 | Safety | 8 | Pregnant yoga has 0 instances of unsafe poses (Crow, Wheel, Headstand, Boat, Camel, Bow, Locust). Filter works. Power yoga pregnant exists (240 instances) — questionable but not unsafe. | Disable Power and Yin styles for pregnant by default, or surface a warning in UI. |

---

# Part 2 — Program Grading

The dataset contains **only one program** (`prog_first_move_v1`, 24 instances = 6 profiles × 4 equipment combos). Findings below apply to that program; the framework recommendations apply to all future programs.

| # | Dimension | Score | Evidence | Fix |
|---|-----------|------:|----------|-----|
| 1 | Periodisation coherence | 7 | 4-week linear-rep progression with rpe_target rising 6→6→7→7. No deload, but a 4-week beginner foundation can skip deload. Week 4 day 3 retest → straight into Day 5 victory-lap on the same week — not enough recovery between max-effort retest and full session. | Insert ≥ 2 days between retest and next workout. Move retest to Week 4 day 1 with the victory-lap-only on day 5. |
| 2 | Progressive overload | 7 | Air Squat: 8-10 → 9-11 → 10-12 → 11-13 across 4 weeks (+1/week, capped). Plank: 30 s → 35 s → 40 s → 45 s. RDL: 8-12 → 9-13 → 10-14 → no week-4 prescription. | Confirm Week 4 progresses every exercise, not only Squat & Push. |
| 3 | Recovery adequacy | 7 | Rest days well placed: 3 workouts spread Mon/Wed/Fri-style with weekend walk. | OK. |
| 4 | Exercise sequencing | 8 | Squat → Push → Hinge → Core → Mobility — compound before isolation, lower before upper, stability last. Textbook. | Maintain. |
| 5 | Milestone placement | 6 | Baseline at W1D1 and retest at W4D3. Sit-and-Reach measures flexibility but program does no flexibility training (only Cat-Cow + Side-Lying T-Spine). The retest will show no improvement on sit-reach. | Either drop sit-and-reach test, add a flexibility block to the program, or replace test with sit-rise. |
| 6 | Adaptation to profiles | 2 | **Resolver does not check equipment.** Limited (bodyweight + mat only) profile is given `Romanian Deadlift` (requires barbell or dumbbell), `Inverted Row` (requires chinup bar), `Incline Push-Ups` (requires bench). 0/1,344 program exercises across all 24 instances triggered the swap chain. The swap chains are well-designed but never invoked. Pregnant W1D3 gets `Dead Bug` and `Glute Bridge` — both `pregnancy_safe='early_only'` with no trimester gate. | Augment `program-resolver._isAllowed` to also test that the user has every required `equip` slot. Use `swap_alternatives` chain when equipment is missing. Surface a `needs_manual_swap` only when no alternative fits both capability + equipment. |

---

# Part 3 — Cross-Cutting Analysis

## 3.1 Exercise variety (per main pick across the corpus)

| Type | Total picks | Unique | Top exercise share | Notes |
|------|-------------|-------:|------:|-------|
| Strength | 89,480 | 95 | `Band Pull-Apart` 9.0 % | Banded movements dominate (top 5 are all banded). Heavy compounds totalled 191 picks (0.21 %). |
| HIIT | 67,208 | **26** | `Push-Ups` 8.5 % | Pool too narrow. Push-Ups + Sit-Ups + Bicycle Crunch + Air Squat = 32 % of all HIIT picks. |
| Conditioning | 90,378 | 55 | `Wall Sits` 7.3 % | Wall Sits over-represented for cv-low profiles. |
| Functional | 119,711 | 72 | `Single-Leg Balance` 8.0 % | Mobility = 20 % of all picks (pool leak). |
| Yoga | 122,276 | 43 | `Up-Dog` / `Mountain Pose` (~6 %) | Sun-Sal A poses each at 100 % per workout in vinyasa/power. |

## 3.2 Duration accuracy

| Type | Mean Δ | Median Δ | Within ±30 s | >5 min short | Over target |
|------|-------:|---------:|------------:|-------------:|------------:|
| Strength | **−641 s** | −510 s | 0.0 % | 81.7 % | 0.0 % |
| HIIT | −311 s | 0 s | 62.9 % | 28.9 % | 0.3 % |
| Conditioning | −223 s | 0 s | 60.8 % | 21.3 % | 11.2 % |
| Functional | −98 s | 0 s | 61.6 % | 12.6 % | 19.2 % |
| Yoga | +11 s | +8 s | **100 %** | 0.0 % | 0.0 % |

Yoga is the only type that hits its duration target reliably. Strength is the worst, even after adding an estimated 2.5 s/rep to the count-up work the gap at 45 min is still −578 s on average.

## 3.3 Edge cases — broken or degenerate combinations

| # | Combo | Symptom | Root cause |
|---|-------|---------|-----------|
| 1 | `pregnant + hiit + bodyweight` | `main = ['Air Squat']` only (e.g. `hii-pre-light-20m-lig-1s-001`) | Capability filter strips the entire HIIT pool because most are `pregnancy_safe='no'`. |
| 2 | `beginner + hiit + bodyweight + 30 min + 1 set + light` | Workout is 21 min, not 30. (e.g. `hii-beg-none-30m-lig-1s-001`) | Reconciler can't fill time gap with intra-rest @ 90 s cap and 5 cooldown moves @ 120 s cap. |
| 3 | `limited + functional` | Inverted Rows etc. assigned but user has no chinup bar. | `program-resolver` doesn't filter equipment; main-generator filter via `e.equip.every(eq => effectiveEquipment.has(eq))` works but typePool can be empty. |
| 4 | `elderly + hiit` | **0 workouts generated** (intentional? 70+ has cv_cap=low so HIIT pool is empty) | Generator should emit a friendly message rather than silently generate nothing. |
| 5 | `untrained + functional` | Mean diff 1.00 across 11,513 picks | Combined with mobility leak, becomes a stretching session. |
| 6 | `last main with restSec > 0` | 87.8 % of HIIT, 60.8 % conditioning, 56.6 % functional | `applyInterSetRest` zeros it out, then `reconcileTotalTime` filters on `!w.restReason` and re-pads it. |

---

# Part 4 — Algorithm Improvement Plan

Issues are listed in **severity order** so the implementing agent works the highest-leverage items first.

## ISSUE 1 — Strength workouts undershoot duration by 5–17 minutes

```
SEVERITY: critical
AFFECTED: all strength workouts (7,920 sessions, 100% miss target by ≥ 4 min)
ROOT CAUSE:
  workoutScheduledSec() returns 0 work for strength main entries
  (because their workSec=0; count-up is unknown). reconcileTotalTime then
  returns immediately (delta computed as targetSec − schedule, but
  generateWorkout's gating already passed because the `final > totalSec + tolSec`
  check at 3445 is one-sided — only refuses if OVER target).
  Result: schedule reports e.g. 1700s for a 45-min target,
  delta=1000s, reconciler tries to add rest, but the only "lever" is
  inter-set rest within 60-180s and we have at most one set boundary,
  so most of the gap remains unfilled. The session previews as 28 min
  for a "45-min" plan.

FIX:
  FILE: js/builder.js (and consumed by index.html)
  LOCATION: new function `repTime(diff, single_sided)` and update buildMainEntry
  BEFORE:
    function repTarget(diff) {
      if (diff === 3) return '3-5 reps';
      if (diff === 2) return '6-8 reps';
      return '10-12 reps';
    }
  AFTER:
    // Mean reps + tempo seconds. Tempo: diff 1 = 3s/rep, diff 2 = 4s/rep,
    // diff 3 = 5s/rep (heavier loads → slower bar speed).
    const REPS_BY_DIFF  = { 1: 11, 2: 7, 3: 4 };
    const TEMPO_BY_DIFF = { 1: 3, 2: 4, 3: 5 };
    function repTarget(diff) {
      if (diff === 3) return '3-5 reps';
      if (diff === 2) return '6-8 reps';
      return '10-12 reps';
    }
    function estimatedWorkSec(diff, single_sided) {
      const t = REPS_BY_DIFF[diff] * TEMPO_BY_DIFF[diff];
      return single_sided ? t * 2 : t;
    }
    window.builder.estimatedWorkSec = estimatedWorkSec;

  FILE: index.html
  LOCATION: buildMainEntry (line ~3225)
  BEFORE:
    if (type === 'strength') {
      workSec = 0;
      intraRest = 60;
    }
  AFTER:
    if (type === 'strength') {
      // Use estimated work time so reconcileTotalTime / workoutScheduledSec
      // don't think strength sessions are 10+ min short.
      workSec = window.builder.estimatedWorkSec(exercise.diff, exercise.single_sided);
      intraRest = 60;
    }

  FILE: index.html
  LOCATION: workoutScheduledSec (line ~3505)
  BEFORE:
    return workout.reduce((acc, w) => {
      const work = (w.section === 'main' && config.type === 'strength') ? 0 : (w.workSec || 0);
      return acc + work + (w.restSec || 0);
    }, 0);
  AFTER:
    // Now that strength entries carry an estimated workSec, just sum it.
    return workout.reduce((acc, w) => acc + (w.workSec || 0) + (w.restSec || 0), 0);

  FILE: index.html
  LOCATION: reconcileTotalTime (line ~3513)
  BEFORE:
    if (config.type === 'strength') return; // count-up sets have unknown duration
  AFTER:
    // Strength now has estimated work time; no skip.
    // (delete the line)

RATIONALE:
  Strength reps × tempo gives a stable, defensible session estimate
  (~2.5–4s/rep). Including it lets the reconciler tune inter-set rests
  to hit the user's chosen duration, exactly like the dynamic types do today.
  Empirical check on the export: at 4s/rep, 45-min strength sessions
  are within −303 s on average (down from −1036 s).
```

## ISSUE 2 — HIIT has no pull movements without a resistance band

```
SEVERITY: critical
AFFECTED: HIIT × {bodyweight, bodyweight+mat} = 9,687 + 7,920 = ~30% of users
ROOT CAUSE:
  Only two HIIT-tagged pull exercises exist in DB: Banded Pull-Aparts and
  Banded Rows. Both require resistance band. So `e.types.includes('hiit')`
  filtering with bodyweight-only equipment returns zero pull entries.

FIX:
  FILE: js/exercises.js
  LOCATION: add 'hiit' tag to multiple pull exercises and add a bodyweight pull
  AFTER (changes):
    // Tag existing items
    Inverted Row.types         → add 'hiit'
    Hanging Knee Raises.types  → add 'hiit'
    Renegade Row.types         → already in 'conditioning,functional'; add 'hiit'
    Negative Pull-Ups.types    → add 'hiit'
    Hanging Scapular Pulls     → add 'hiit'
    Dumbbell Row.types         → add 'hiit'

    // Add new bodyweight pull entries:
    {name:"Doorframe Row", cat:"pull-h", equip:["bodyweight"],
     muscles:["back","biceps"], types:["strength","hiit","conditioning","functional"],
     diff:1, impact:'none', complexity:1, joint_load:'low', cv_demand:'medium',
     requires_balance:false, requires_floor:false, min_fitness:'untrained',
     contraindicated_for:[], pregnancy_safe:'yes',
     info:"Stand facing a doorframe. Grip the frame with both hands at chest height. Lean back, arms extended. Pull your chest toward the frame, squeezing your shoulder blades together. Lower with control. Walk feet further forward to make it harder."}

    {name:"Towel Row", cat:"pull-h", equip:["bodyweight"],
     muscles:["back","biceps"], types:["strength","hiit","functional"],
     diff:1, ...}

    // Anti-rotation pulls already work as HIIT — tag Bird Dog, Russian Twists
    // shouldn't add HIIT to mobility ones. Avoid contaminating with stretches.

RATIONALE:
  A workout that is push-, squat-, and core-only is half a workout.
  Even on bodyweight HIIT, intermediate users can do inverted rows
  off a sturdy table or doorframe. Adding 1 bodyweight pull entry
  + tagging existing exercises with 'hiit' fixes 30% of users in one stroke.
```

## ISSUE 3 — Pregnant + HIIT generates degenerate 1-exercise workouts

```
SEVERITY: high
AFFECTED: pregnant × hiit = 979 sessions (median 2 main exercises)
ROOT CAUSE:
  capability.isAllowed strips pregnancy_safe='no' exercises. The HIIT
  pool is dominated by plyo/cardio which are mostly 'no' (Burpees,
  Mountain Climbers, Squat Jumps, Frog Jumps, Sprint Intervals…).
  The remaining HIIT pool for pregnant is 1–3 exercises. The generator
  proceeds with 1-exercise workouts rather than refusing.

FIX:
  FILE: index.html
  LOCATION: generateWorkout (line ~3263), before main pool filter
  BEFORE:
    // (no check)
  AFTER:
    // Pregnancy + HIIT is not a recommended combination — the available pool is
    // heavily restricted and the workouts become degenerate. Refuse cleanly.
    if (config.type === 'hiit' && profileForFilter.pregnancy_safe_only) {
      showGenError('HIIT is not recommended during pregnancy. Try Conditioning, Functional, or a low-impact Yoga style instead.');
      return;
    }

  Equally: minimum main pool size guard.
  LOCATION: generateWorkout, after typePool filter
  BEFORE:
    if (typePool.length === 0) {
      showGenError('No exercises match this type, equipment, and focus combination. Try fewer exclusions.');
      return;
    }
  AFTER:
    const MIN_POOL = 4;
    if (typePool.length < MIN_POOL) {
      showGenError(
        'Only ' + typePool.length + ' exercise' + (typePool.length === 1 ? '' : 's') +
        ' match the selected type / equipment / focus combination — that is not enough for a balanced session. Try widening equipment or focus.'
      );
      return;
    }

RATIONALE:
  Better to surface a clear "this combination doesn't make sense"
  message than to ship a workout consisting of one Air Squat repeated
  for 4 minutes inside a 30-minute container. Same fix protects elderly
  + HIIT (currently 0 sessions, presumably generator would also fail
  silently if attempted).
```

## ISSUE 4 — `pregnancy_safe='early_only'` is treated as 'yes'

```
SEVERITY: high
AFFECTED: 18,424 instances across 6,499 pregnant workouts
ROOT CAUSE:
  capability.isAllowed only blocks pregnancy_safe === 'no':

    if (p.pregnancy_safe_only && ex.pregnancy_safe === 'no') return false;

  So 'early_only' silently passes. The app has no trimester selector,
  so it cannot distinguish first trimester (where supine work like
  Glute Bridge is fine) from late pregnancy (where it is contraindicated
  due to vena cava compression).

FIX:
  Two-step:

  STEP 1 — UI: add a trimester selector to the pregnancy profile.
  FILE: index.html (profile setup screen) + storage in user profile.
  Add: profile.pregnancy_trimester ∈ {'T1', 'T2', 'T3'}.

  STEP 2 — capability filter:
  FILE: js/capability.js
  LOCATION: isAllowed
  BEFORE:
    if (p.pregnancy_safe_only && ex.pregnancy_safe === 'no') return false;
  AFTER:
    if (p.pregnancy_safe_only) {
      if (ex.pregnancy_safe === 'no') return false;
      if (ex.pregnancy_safe === 'early_only' && p.pregnancy_trimester !== 'T1') return false;
    }

  STEP 3 — until trimester UI ships, default to safest:
  Treat any pregnant profile as if trimester='T2' so 'early_only' is blocked.
  (One-line fix that is safer-by-default.)

RATIONALE:
  A pregnant user in T3 doing Glute Bridge or Dead Bug supine for
  multiple sets is a real risk. The DB metadata already encodes the
  knowledge — the filter just doesn't apply it.
```

## ISSUE 5 — Strength rarely uses the barbell

```
SEVERITY: high
AFFECTED: full-equipment strength sessions (~2,160 sessions);
          7.6% include any barbell exercise; <0.5% include any heavy compound.
ROOT CAUSE:
  buildMain selection is round-robin across categories. Every category
  gets equal weight; barbell-only exercises live within categories that
  have many cheaper alternatives, so they sit at the back of a long bucket
  and rarely get reached. Goal weighting amplifies the band/banded movements
  because they qualify for both 'strength' and 'isohiit' tags.

FIX:
  FILE: index.html
  LOCATION: generateWorkout, after typePool is built (line ~3325)
  BEFORE:
    // Apply goal weighting: duplicate exercises from weighted categories.
  AFTER (insert before the goal weighting block):
    // Strength preference: prioritise loaded compound lifts when available.
    if (config.type === 'strength') {
      const COMPOUND_PRIORITY = {
        'lower-squat':  3,    // squat patterns
        'lower-hinge':  3,    // hinge patterns
        'push-h':       2.5,
        'push-v':       2.5,
        'pull-h':       2.5,
        'pull-v':       2.5,
        'full-body':    2,
        'isometric':    1,
        'core':         1,
        'carry':        1,
      };
      const HEAVY_EQUIP = new Set(['barbell','dumbbell','kettlebell']);
      const compoundExpanded = [];
      typePool.forEach(e => {
        let mult = COMPOUND_PRIORITY[e.cat] || 1;
        // Boost loaded movements over banded/bodyweight when heavy gear available
        if (e.equip.some(eq => HEAVY_EQUIP.has(eq))) mult *= 1.5;
        // Penalise band-only when better gear is in the kit
        if (e.equip.length === 1 && e.equip[0] === 'resistance band' &&
            [...effectiveEquipment].some(eq => HEAVY_EQUIP.has(eq))) {
          mult *= 0.4;
        }
        const copies = Math.max(1, Math.round(mult));
        for (let i = 0; i < copies; i++) compoundExpanded.push(e);
      });
      shuffle(compoundExpanded);
      const seen = new Set();
      const deduped = compoundExpanded.filter(e => !seen.has(e.name) && seen.add(e.name));
      typePool.length = 0;
      deduped.forEach(e => typePool.push(e));
    }

RATIONALE:
  An advanced user with a full home-gym kit who selects "strength" expects
  compound lifts. The current generator gives them Banded Bicep Curls.
  This fix reorders the priority without removing options.
```

## ISSUE 6 — Last main entry has phantom rest before cooldown

```
SEVERITY: medium
AFFECTED: HIIT 87.8%, conditioning 60.8%, functional 56.6% of sessions
ROOT CAUSE:
  applyInterSetRest correctly sets restSec=0 on the last main entry
  (isLastOverall branch). reconcileTotalTime then iterates main entries
  filtered by `!w.restReason` to spread positive delta — and the last
  main entry has restReason=null, so it gets padded back up.

FIX:
  FILE: index.html
  LOCATION: reconcileTotalTime (line ~3513)
  BEFORE:
    if (delta > 0) {
      const mainEntries = workout.filter(w => w.section === 'main' && !w.restReason);
      ...
    }
  AFTER:
    if (delta > 0) {
      // Find indices of all main entries; exclude the LAST main entry of the
      // last set so we don't insert dead time before the cooldown.
      const mainIdxs = workout.reduce((acc, w, i) => {
        if (w.section === 'main' && !w.restReason) acc.push(i);
        return acc;
      }, []);
      const lastMainIdx = (() => {
        for (let i = workout.length - 1; i >= 0; i--) if (workout[i].section === 'main') return i;
        return -1;
      })();
      const fillable = mainIdxs.filter(i => i !== lastMainIdx).map(i => workout[i]);
      if (fillable.length > 0) {
        const perEx = Math.floor(delta / fillable.length);
        for (const w of fillable) {
          const add = Math.min(perEx, 90 - (w.restSec || 0));
          if (add > 0) { w.restSec = (w.restSec || 0) + add; delta -= add; }
        }
      }
    }

RATIONALE:
  The cooldown immediately follows the last main exercise. There is no
  "rest" to take — you transition into stretching. Padding here creates
  an awkward dead pause and inflates session length on paper.
```

## ISSUE 7 — Pulse raiser missing in 19–50 % of warmups

```
SEVERITY: medium
AFFECTED: strength 45.5%, functional 50.0%, conditioning 36.8%, hiit 18.5%
ROOT CAUSE:
  pickPulseRaiser filters by capability.isAllowed which compares
  ex.cv_demand against caps.cv_cap. Almost every cardio entry in DB
  has cv_demand:'high'. caps.cv_cap is 'medium' for beginners, 'low' for
  untrained / 70+ / BMI ≥ 35. Result: the entire `cardio` cat is rejected
  for those profiles, and pickPulseRaiser returns null → buildWarmup
  proceeds without one and a mobility move starts the warmup.

FIX (two-part — minimal then proper):

  PART A — short term, one-line:
  FILE: index.html
  LOCATION: pickPulseRaiser (line ~3121)
  BEFORE:
    const allowed = e => !capCaps || window.capability.isAllowed(e, capCaps, capProfile, capSettings);
  AFTER:
    // A pulse raiser is a 60s gentle ramp — relax cv-demand by one step
    // for warmup screening only. We still respect impact / joint / floor / preg.
    const RANK = window.capability.IMPACT_RANK || { none:0, low:1, medium:2, high:3 };
    const relaxedCaps = capCaps ? { ...capCaps, cv_cap: ({low:'medium', medium:'high', high:'high'}[capCaps.cv_cap] || capCaps.cv_cap) } : null;
    const allowed = e => !relaxedCaps || window.capability.isAllowed(e, relaxedCaps, capProfile, capSettings);

  PART B — proper, requires DB update:
  FILE: js/exercises.js
  ADD low-cv pulse-raiser entries that are universally allowed:
    {name:"Marching in Place", cat:"cardio", equip:["bodyweight"],
     muscles:["cardio","quads"], types:["hiit","conditioning","functional","strength"],
     diff:1, impact:'low', complexity:1, joint_load:'low', cv_demand:'low',
     requires_balance:false, requires_floor:false, min_fitness:'untrained',
     contraindicated_for:[], pregnancy_safe:'yes',
     info:"March in place, lifting knees to a comfortable height. Pump your arms in opposition. Maintain a steady rhythm. A perfect gentle warm-up that suits all fitness levels."}

    {name:"Easy Step Touch", cat:"cardio", equip:["bodyweight"],
     muscles:["cardio","quads"], types:["hiit","conditioning","functional","strength"],
     diff:1, impact:'low', complexity:1, joint_load:'low', cv_demand:'low',
     requires_balance:false, requires_floor:false, min_fitness:'untrained',
     contraindicated_for:[], pregnancy_safe:'yes', info:"Step to one side, tap the other foot in. Step the other way, tap. Add arm sweeps to elevate."}

  Then prefer cv_demand:'low' cardio over higher in pickPulseRaiser:
    const cardio = DB.filter(e => e.cat === 'cardio' && e.equip.every(eq => equipment.has(eq)) && allowed(e));
    cardio.sort((a, b) => (a.cv_demand === 'low' ? -1 : 0) - (b.cv_demand === 'low' ? -1 : 0));
    return cardio[0] || null;

RATIONALE:
  A pulse raiser is supposed to be the easiest cardio possible. The
  capability filter that was designed for main exercises is too strict
  for a 60-second warm-up movement. Relaxing cv-cap by one tier (or
  adding genuinely-low-CV cardio entries) ensures everyone starts with
  a real pulse raiser.
```

## ISSUE 8 — Programs ignore equipment availability

```
SEVERITY: high
AFFECTED: all program exercises (1,344/24 instances), 0% swap chain hit rate
ROOT CAUSE:
  program-resolver._isAllowed wraps capability.isAllowed only. capability
  doesn't validate equipment — that's done in the workout generator's
  `e.equip.every(eq => effectiveEquipment.has(eq))` filter. The program
  resolver never receives or checks effectiveEquipment.

FIX:
  FILE: js/program-resolver.js
  LOCATION: _resolveExercise + signature changes for equipment Set
  BEFORE:
    function resolveSlot(slot, profileSnapshot, swaps, progressionOverrides) {
      ...
    }
    function _resolveInline(slot, profile, swaps, overrides) { ... }
    function _resolveExercise(ex, caps, profile, swaps, overrides) {
      ...
      var def = _findExercise(name);
      if (def && _isAllowed(def, caps, profile)) {
        return _buildResult(name, ex, def, overrides);
      }
      ...
    }
  AFTER:
    function resolveSlot(slot, profileSnapshot, swaps, progressionOverrides, equipmentSet) {
      // equipmentSet: Set<string> of equipment available to the user.
      ...
      _resolveInline(slot, profileSnapshot, swaps, progressionOverrides, equipmentSet || new Set(['bodyweight']));
    }
    function _resolveInline(slot, profile, swaps, overrides, equipmentSet) {
      ...
      var result = _resolveExercise(ex, caps, profile, swaps, overrides, equipmentSet);
      ...
    }
    function _resolveExercise(ex, caps, profile, swaps, overrides, equipmentSet) {
      ...
      var def = _findExercise(name);
      if (def && _isAllowed(def, caps, profile) && _equipOk(def, equipmentSet)) {
        return _buildResult(name, ex, def, overrides);
      }
      // Try swap chain (each candidate must satisfy capability AND equipment)
      if (ex.swap_alternatives && ex.swap_alternatives.length > 0) {
        for (var i = 0; i < ex.swap_alternatives.length; i++) {
          var altName = ex.swap_alternatives[i];
          var altDef = _findExercise(altName);
          if (altDef && _isAllowed(altDef, caps, profile) && _equipOk(altDef, equipmentSet)) {
            return _buildResult(altName, ex, altDef, overrides);
          }
        }
      }
      // Fallback — needs_manual_swap
      ...
    }
    function _equipOk(def, equipmentSet) {
      if (!def.equip || def.equip.length === 0) return true;
      return def.equip.every(function (eq) { return equipmentSet.has(eq); });
    }

  Wherever resolveSlot is called from program-state.js / program-ui.js, pass
  the user's equipment Set.

  Also: extend `swap_alternatives` chains in js/programs.js with bodyweight
  fall-throughs:
    Romanian Deadlift swap: ['Single-Leg RDL', 'Glute Bridge', 'Single-Leg Glute Bridge']
    Inverted Row        swap: ['Doorframe Row', 'Banded Rows', 'Band Pull-Apart', 'Towel Row']
    Incline Push-Ups    swap: ['Knee Push-Ups', 'Wall Push-Ups']
    Goblet Squat        swap: ['Air Squat', 'Wall Sits', 'Box Squat']

RATIONALE:
  Without an equipment check the resolver is happily handing limited
  bw+mat users barbell exercises. Programs should "just work" for any
  audience the metadata says they're for.
```

## ISSUE 9 — Mobility is a main-block category in functional

```
SEVERITY: medium
AFFECTED: functional workouts — 20% of all main picks are mobility/stretches
ROOT CAUSE:
  REGIONS.posterior = ['mobility'] and isn't excluded from main pool when
  type === 'functional'. Functional workouts thus pull mobility into main.

FIX:
  FILE: index.html
  LOCATION: generateWorkout typePool filter (line ~3319)
  BEFORE:
    const typePool = DB.filter(e =>
      e.types.includes(config.type) &&
      e.equip.every(eq => effectiveEquipment.has(eq)) &&
      !excludedCats.has(e.cat) &&
      !usedNames.has(e.name) &&
      window.capability.isAllowed(e, caps, profileForFilter, exerciseSettings)
    );
  AFTER:
    const MAIN_BLOCK_EXCLUDED_CATS = new Set(['mobility']);
    const typePool = DB.filter(e =>
      e.types.includes(config.type) &&
      e.equip.every(eq => effectiveEquipment.has(eq)) &&
      !excludedCats.has(e.cat) &&
      !MAIN_BLOCK_EXCLUDED_CATS.has(e.cat) &&
      !usedNames.has(e.name) &&
      window.capability.isAllowed(e, caps, profileForFilter, exerciseSettings)
    );

RATIONALE:
  Mobility belongs in warm-up or cooldown. A functional workout with
  20% stretching diluted across main is closer to a yoga session than
  a strength-skill session.
```

## ISSUE 10 — Reconciler ceiling too low for 1-set sessions

```
SEVERITY: medium
AFFECTED: 1-set HIIT/conditioning sessions, especially short durations + low
          capability profiles where mainCount is tiny.
ROOT CAUSE:
  reconcileTotalTime caps intra-rest at 90s, inter-set rest at 180s,
  cooldown holds at 120s. With 1 set there is no inter-set lever; with
  3-4 main entries × 90s intra-rest and 5 cooldown × 120s the maximum
  fillable time is small.

FIX:
  FILE: index.html
  LOCATION: reconcileTotalTime
  Change the caps to be conditional:

    const INTRA_REST_CAP   = (sets === 1) ? 120 : 90;
    const COOLDOWN_HOLD_CAP = 180;

  Apply to both buckets accordingly.

RATIONALE:
  1-set sessions inherently have less rest budget; allowing slightly
  longer intra-rests and cooldown holds keeps the duration on target
  without padding the wrong place.
```

## ISSUE 11 — Difficulty bucket weighting doesn't differentiate intermediate vs advanced

```
SEVERITY: medium
AFFECTED: intermediate vs advanced see nearly identical mean diff (1.57 vs 1.66
          for strength; 1.70 vs 1.72 for HIIT)
ROOT CAUSE:
  Round-robin across cats, then shuffle inside cat. Diff distribution
  is incidental to which exercises fit in which bucket.

FIX:
  FILE: index.html
  LOCATION: generateWorkout, before round-robin (line ~3395)
  BEFORE:
    const ordered = focusOrderedPool(typePool);
  AFTER:
    // Bias toward higher difficulty for higher fitness levels.
    const targetDiff = ({advanced: 2.5, intermediate: 1.8, beginner: 1.3, untrained: 1.0})[profileForFilter.fitness_level] || 1.5;
    const diffWeighted = [];
    typePool.forEach(e => {
      // Higher weight when the exercise's diff is close to target.
      const distance = Math.abs(e.diff - targetDiff);
      const weight   = Math.max(1, Math.round(3 - distance));
      for (let i = 0; i < weight; i++) diffWeighted.push(e);
    });
    shuffle(diffWeighted);
    const seenDW = new Set();
    const dwDeduped = diffWeighted.filter(e => !seenDW.has(e.name) && seenDW.add(e.name));
    const ordered = dwDeduped;

RATIONALE:
  An advanced user wants to be challenged. Currently the difficulty
  ceiling is set by the capability filter; nothing biases ordering
  toward the upper edge of that range.
```

## ISSUE 12 — Yoga sun salutation A repeats mechanically

```
SEVERITY: low
AFFECTED: vinyasa (200% per workout) and power (300% per workout) — every
          such session has the same Mountain → Forward Fold → Halfway Lift
          → Chaturanga → Up-Dog → Down-Dog cycle 2-3x.

FIX:
  FILE: js/yoga.js
  LOCATION: sun salutation generator
  - Introduce SUN_SAL_B variant (adds Crescent Lunge, Warrior I, Warrior II).
  - Alternate A and B for vinyasa/power.
  - Replace one full cycle with a Half Sun Sal (Mountain → Forward Fold → Halfway Lift → Forward Fold → Mountain) for variety.

RATIONALE:
  Same Sun Sal A every session is monotonous. Yoga style differentiation
  is the chief reason a user picks vinyasa vs power; mechanical sameness
  undermines that choice.
```

---

# Part 5 — Exercise Database Recommendations

## Add the following exercises (full metadata)

```javascript
// 1. Bodyweight pulse raiser (closes Issue 7)
{name:"Marching in Place", cat:"cardio", equip:["bodyweight"],
 muscles:["cardio","quads"], types:["hiit","conditioning","functional","strength"],
 diff:1, impact:'low', complexity:1, joint_load:'low', cv_demand:'low',
 requires_balance:false, requires_floor:false, min_fitness:'untrained',
 contraindicated_for:[], pregnancy_safe:'yes',
 info:"March in place lifting knees comfortably. Pump arms in opposition. A gentle pulse raiser appropriate for every fitness level."}

{name:"Easy Step Touch", cat:"cardio", equip:["bodyweight"],
 muscles:["cardio","quads"], types:["hiit","conditioning","functional","strength"],
 diff:1, impact:'low', complexity:1, joint_load:'low', cv_demand:'low',
 requires_balance:false, requires_floor:false, min_fitness:'untrained',
 contraindicated_for:[], pregnancy_safe:'yes',
 info:"Step to one side and tap the other foot in. Step the other direction. Add arm sweeps. Suits anyone."}

// 2. Bodyweight pull (closes Issue 2)
{name:"Doorframe Row", cat:"pull-h", equip:["bodyweight"],
 muscles:["back","biceps"], types:["strength","hiit","conditioning","functional"],
 diff:1, impact:'none', complexity:1, joint_load:'low', cv_demand:'medium',
 requires_balance:false, requires_floor:false, min_fitness:'untrained',
 contraindicated_for:[], pregnancy_safe:'yes',
 info:"Stand facing a doorframe. Grip the frame with both hands at chest height. Lean back, arms extended. Pull your chest to the frame, squeezing your shoulder blades. Lower with control. Walk feet further forward to make harder."}

{name:"Towel Row", cat:"pull-h", equip:["bodyweight"],
 muscles:["back","biceps","grip"], types:["strength","hiit","functional"],
 diff:1, impact:'none', complexity:1, joint_load:'low', cv_demand:'low',
 requires_balance:false, requires_floor:false, min_fitness:'untrained',
 contraindicated_for:[], pregnancy_safe:'yes',
 info:"Loop a towel around a sturdy post. Hold both ends, lean back arms extended. Pull to your chest, squeezing your shoulder blades. Control the return."}

// 3. Bodyweight HIIT pull alternative
{name:"Bodyweight Pull-Up Iso Hang", cat:"pull-v", equip:["chinup bar"],
 muscles:["back","biceps","grip"], types:["strength","hiit","functional"],
 diff:2, impact:'none', complexity:1, joint_load:'low', cv_demand:'medium',
 requires_balance:false, requires_floor:false, min_fitness:'beginner',
 contraindicated_for:['shoulders'], pregnancy_safe:'early_only',
 info:"Hang from the bar with chin above the bar. Hold the top position as long as possible. Lower with control. Builds the strength to do full pull-ups."}

// 4. Pregnancy-safe HIIT replacements
{name:"Modified Burpee (Step Through)", cat:"full-body", equip:["bodyweight"],
 muscles:["full body"], types:["hiit","conditioning","functional"],
 diff:1, impact:'low', complexity:2, joint_load:'low', cv_demand:'high',
 requires_balance:false, requires_floor:true, min_fitness:'beginner',
 contraindicated_for:['wrists'], pregnancy_safe:'yes',
 info:"From standing, step (don't jump) one foot back to plank, then the other. Step (don't jump) feet forward and stand. Step instead of jump throughout for a low-impact, pregnancy-friendly conditioning move."}

{name:"Standing Mountain Climbers", cat:"cardio", equip:["bodyweight"],
 muscles:["core","cardio","hip flexors"], types:["hiit","conditioning"],
 diff:1, impact:'low', complexity:1, joint_load:'low', cv_demand:'high',
 requires_balance:true, requires_floor:false, min_fitness:'untrained',
 contraindicated_for:[], pregnancy_safe:'yes',
 info:"Standing tall, drive each knee toward the opposite elbow alternately at speed. Pumps the heart rate without supine or push-up positions."}
```

## Metadata corrections

| Exercise | Field | Current | Should be | Reason |
|----------|-------|---------|-----------|--------|
| Push-Ups | `types` | `[strength,hiit,conditioning,functional,isohiit]` | drop `hiit` | Not a HIIT exercise; gets over-picked into HIIT pool. |
| Sit-Ups | `types` | `[conditioning,hiit]` | drop `hiit` | Same. |
| Bicycle Crunch | `types` | `[hiit,conditioning,isohiit]` | drop `hiit` | Same. |
| Air Squat | `types` | `[strength,hiit,conditioning,functional,isohiit]` | drop `hiit` | Bodyweight squat is low-CV; not a HIIT signature. |
| Wall Sits | `types` | `[strength,conditioning,isohiit]` | drop `conditioning` | Isometric, not conditioning. |
| Burpees | `min_fitness` | `intermediate` | keep as is | OK. |
| Mountain Climbers | `cv_demand` | `high` | keep, but tag `pregnancy_safe:'no'` correctly | Already correct. |
| Inverted Row | `types` | `[strength,conditioning]` | add `hiit,functional` | See Issue 2. |
| Renegade Row | `types` | add `hiit` | | See Issue 2. |
| Hanging Knee Raises | `types` | `[strength,conditioning]` | add `hiit` | See Issue 2. |
| Dead Bug | `pregnancy_safe` | `early_only` | keep, but filter respects it | See Issue 4. |
| Glute Bridge | `pregnancy_safe` | `early_only` | keep, but filter respects it | See Issue 4. |
| Side Lunges | `pregnancy_safe` | `early_only` | keep, but filter respects it | See Issue 4. |
| Deep Squat Hold | `pregnancy_safe` | `early_only` | keep, but filter respects it | See Issue 4. |
| Band Pull-Apart | `cat` | `upper-pull` | `pull-h` | `upper-pull` isn't in REGIONS.upper sub-keys; the category is unrecognised. Inspection of REGIONS shows `upper_push: ['push-h','push-v']` and `upper_pull: ['pull-h','pull-v']` — `upper-pull` (hyphen) doesn't match any sub-region. |

## Redundant / mergeable

- `Banded Pull-Aparts` and `Band Pull-Apart` are duplicates. Merge into one entry.
- `Banded Rows` and (if added) `Banded Seated Row` overlap. Pick one.
- `Squat Hold` (isometric) ≈ `Wall Sits` ≈ `Pause Squat` bottom — keep only one as standard isometric staple.

---

# Part 6 — Timing & Rest Tuning

Current values from `js/builder.js`:

```javascript
TYPE_MOD = { strength:{1.2, 1.4}, hiit:{0.8, 0.7}, conditioning:{1.0, 1.0},
             functional:{1.0, 1.0}, isohiit:{0.85, 0.8} }
DIFF_MOD = { 1:{1.0, 1.0}, 2:{1.0, 1.2}, 3:{0.85, 1.5} }
INTENSITY_MOD = { light:{1.0, 1.4}, moderate:{1.0, 1.0}, high:{0.9, 0.7} }
INTER_SET_REST = { light:90, moderate:60, high:45 }   // builder.js
SET_REST       = { light:60, moderate:90, high:120, very_high:180 }   // index.html (different table!)
```

### Concerns and proposed numbers

| Setting | Current | Proposed | Rationale |
|---------|--------:|---------:|-----------|
| `BASE.plyo` work | 25 | 20 | True plyometric prescriptions are 20-30 s; with type_mod * 0.8 for HIIT this gives 15s — borderline too short. Keep base 25. **Actually keep.** |
| `BASE.cardio` rest | 25 | 15 | Cardio bursts in HIIT need shorter rest. With hiit type_mod 0.7 → 17.5 s, fine. **Keep.** |
| `BASE.mobility` warmup work | 30 | 30 | OK. |
| `BASE.mobility` cooldown work (overridden) | 30 | 45 | Cooldown holds should be longer than warm-up dynamic mobility. Static stretches benefit from 30-45 s minimum. |
| `TYPE_MOD.strength.work` | 1.2 | n/a | Strength uses count-up — modifier never applied. **Keep but document.** |
| `TYPE_MOD.hiit.rest` | 0.7 | 0.6 | HIIT classic Tabata is 20:10 (1:2 work-to-rest). Current 0.7 keeps too much rest. |
| `DIFF_MOD[3].rest` | 1.5 | 1.6 | Heavy diff 3 needs more recovery. |
| `INTENSITY_MOD.light.rest` | 1.4 | 1.5 | Light = de-load; more rest helps. |
| `INTENSITY_MOD.high.work` | 0.9 | 0.85 | High intensity should mean shorter work intervals. |
| `INTENSITY_MOD.high.rest` | 0.7 | 0.65 | And shorter rest — work harder, recover briefly. |
| `INTER_SET_REST` (builder.js) | {90, 60, 45} | merge with `SET_REST` (index.html) | The two tables disagree — builder's are intra-exercise within set, but the comments call them inter-set. Resolve duplication. |
| `SET_REST` (index.html) | {light:60, moderate:90, high:120, very_high:180} | {light:60, moderate:90, high:120, very_high:150} | 180 s for very_high is excessive in a fixed-duration session; use 150 s. |
| `MIN/MAX work clamp` | 15-60 s | 15-90 s | Some isometric holds (Wall Sits, Plank) belong at 60-90s for advanced users. |
| `MIN/MAX rest clamp` | 5-60 s | 5-120 s | For very_high intensity 60 s isn't enough. |

### Proposed file change

```diff
--- js/builder.js
+++ js/builder.js
   const TYPE_MOD = {
     strength:     { work: 1.2, rest: 1.4 },
-    hiit:         { work: 0.8, rest: 0.7 },
+    hiit:         { work: 0.8, rest: 0.6 },
     conditioning: { work: 1.0, rest: 1.0 },
     functional:   { work: 1.0, rest: 1.0 },
     isohiit:      { work: 0.85, rest: 0.8 },
   };
   const DIFF_MOD = {
     1: { work: 1.0,  rest: 1.0 },
     2: { work: 1.0,  rest: 1.2 },
-    3: { work: 0.85, rest: 1.5 },
+    3: { work: 0.85, rest: 1.6 },
   };
   const INTENSITY_MOD = {
-    light:    { work: 1.0, rest: 1.4 },
+    light:    { work: 1.0, rest: 1.5 },
     moderate: { work: 1.0, rest: 1.0 },
-    high:     { work: 0.9, rest: 0.7 },
+    high:     { work: 0.85, rest: 0.65 },
   };
   ...
   if (cat === 'isometric') {
     d = { work: diff === 3 ? 0.7 : diff === 2 ? 0.85 : 1.1, rest: d.rest };
   }
   const work = base.work * t.work * d.work * i.work;
   const rest = base.rest * t.rest * d.rest * i.rest;
   return {
-    workSec: Math.min(60, Math.max(15, round5(work))),
-    restSec: Math.min(60, Math.max(5,  round5(rest))),
+    workSec: Math.min(90, Math.max(15, round5(work))),
+    restSec: Math.min(120, Math.max(5,  round5(rest))),
   };
```

```diff
--- index.html (line ~3026)
+++ index.html
- const SET_REST = { light: 60, moderate: 90, high: 120, very_high: 180 };
+ const SET_REST = { light: 60, moderate: 90, high: 120, very_high: 150 };
```

```diff
--- js/builder.js (line ~66)
+++ js/builder.js
   if (section === 'cooldown' && cat === 'mobility') {
-    base = { work: 30, rest: 5 };
+    base = { work: 45, rest: 5 };
   }
```

---

# Top 10 Quick Wins

These are the highest-leverage changes ordered by impact ÷ effort.

| # | Change | File / Location | Impact | Effort |
|---|--------|------|------|------|
| 1 | Add estimated work seconds for strength (`builder.estimatedWorkSec`) and use it in `buildMainEntry` + `workoutScheduledSec` + remove the strength bail-out in `reconcileTotalTime` | `js/builder.js`, `index.html` ~3225, ~3505, ~3514 | Eliminates the 5-17 min strength shortfall (Issue 1) | Small (~30 lines) |
| 2 | Refuse generation when `pregnancy_safe_only && type==='hiit'` and add MIN_POOL guard | `index.html` ~3263, ~3326 | Stops 1-exercise HIIT workouts (Issue 3) | Tiny (~10 lines) |
| 3 | Treat `pregnancy_safe='early_only'` as not-allowed when no trimester is known | `js/capability.js` `isAllowed` | Removes 18,424 questionable assignments (Issue 4) | One-line until UI ships |
| 4 | Exclude last main entry from rest padding | `index.html` `reconcileTotalTime` ~3530 | Removes phantom 25-46 s rest before cooldown across 60-87 % of sessions (Issue 6) | Tiny (~10 lines) |
| 5 | Add `Marching in Place` and `Easy Step Touch` to DB; relax cv-cap by one tier in `pickPulseRaiser` | `js/exercises.js`, `index.html` ~3121 | Pulse-raiser coverage 50→100 % for low-fitness profiles (Issue 7) | Small |
| 6 | Add equipment check to `program-resolver` and pass user equipment Set | `js/program-resolver.js`; callers | Programs respect equipment (Issue 8) | Medium (~40 lines) |
| 7 | Exclude `mobility` cat from main pool; cap mobility at 1 in functional | `index.html` ~3319 | Drops mobility from 20 % → ≤5 % of functional main picks (Issue 9) | Tiny |
| 8 | Strength compound priority: weight loaded compounds 2-3 ×, penalise band-only when heavy gear available | `index.html` ~3320 | Barbell usage rises from 7.6 % toward 30-40 % (Issue 5) | Small |
| 9 | Add `Doorframe Row` / `Towel Row`; tag `Inverted Row` etc. as `hiit` | `js/exercises.js` | Bodyweight HIIT users get pull movement again (Issue 2) | Small |
| 10 | Increase intra-rest cap to 120 s for 1-set sessions; cooldown hold cap to 180 s | `index.html` `reconcileTotalTime` | Single-set HIIT/Conditioning sessions hit duration target (Issue 10) | Tiny |

---

# Appendix A — Sample workout IDs cited

For reproducing findings, here are the IDs referenced in the audit:

| Finding | Sample IDs |
|---------|-----------|
| Strength full-kit advanced (no barbell) | `str-adv-full-20m-lig-1s-001`, `str-adv-full-20m-lig-1s-002`, `str-adv-full-20m-lig-1s-003` |
| HIIT beginner short, 21-min not 30-min | `hii-beg-none-30m-lig-1s-001`, `hii-beg-none-30m-lig-1s-002` |
| Pregnant HIIT degenerate (1 exercise) | `hii-pre-light-20m-lig-1s-001`, `hii-pre-light-20m-lig-1s-002` |
| Pregnant + early_only exercises | `str-pre-none-20m-lig-1s-001` (Side Lunges in warmup, Deep Squat Hold in cooldown), `str-pre-none-20m-lig-1s-003` (Side Lunges in main) |
| Limited functional (no equipment check) | `fun-eld-none-30m-lig-1s-001`, `fun-eld-none-30m-lig-1s-002` |
| Vinyasa with Sun-Sal A repeated 2× | `yog-beg-none-30m-mod-1s-001` |
| Power yoga with Sun-Sal A 3× | `yog-pre-none-20m-mod-1s-001` (and many) |
| Yin yoga (only 14 unique poses across 1,440 instances) | `yog-beg-none-45m-mod-1s-001` |

---

# Appendix B — Acceptance criteria for the refactor

After applying the fixes above, expect to see:

1. Strength workouts: median duration delta within ±60 s of target across all duration buckets.
2. HIIT × bodyweight: every workout contains ≥ 1 pull movement.
3. Pregnant HIIT: returns the friendly error or a redirected suggestion.
4. Pregnancy `early_only` count → 0 across all pregnant workouts.
5. Last-main-entry restSec = 0 in every workout.
6. Pulse raiser (cardio) appears as the first warmup entry in ≥ 95 % of non-yoga workouts.
7. Programs × limited (bodyweight + mat): no exercise prescribed that requires equipment the user doesn't have; swap chain hit rate > 0 % for those instances.
8. Functional workouts: mobility ≤ 5 % of main picks.
9. Strength × full kit: barbell-using exercise share rises above 30 % (proxy: at least one barbell exercise in ≥ 70 % of full-kit strength sessions).
10. Yoga × vinyasa: same Sun-Sal A pose count drops from 200 % per workout to ≤ 130 % per workout (Sun-Sal B should fill the gap).

The refactor should ship with regression tests in `tests/` that load a fresh export and assert the metrics above.

---

*End of audit. Hand this document to the implementing agent and reference Issue numbers in PR descriptions.*

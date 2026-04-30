# Image Bake-off Results

**Date:** 30 April 2026  
**Tester:** Automated generation run via Claude (Cowork session)  
**Brief:** See `docs/image-bakeoff.md` for full prompt text and scoring rubric.

---

## Summary

| Model | Images generated | Brief adherence | Anatomy | Style consistency | Verdict |
|---|---|---|---|---|---|
| **Grok Imagine** | 5 × 9 = 45 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **Winner** |
| **ChatGPT (GPT-4o)** | 5 × 1 = 5 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | Runner-up |
| **Nano Banana 2** (Artlist) | 5 × 1 = 5 | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | Runner-up (tied) |
| **Nano Banana** (native, google/nano-banana) | 2 × 1 = 2 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Supplemental — see below |

**Recommendation: Use Grok Imagine for the full 161-image run**, or use its output as the reference set to judge against Flux 1.1 Pro Ultra (not yet tested) before committing.

> **Native nano-banana.com (supplemental run):** Tested 2 of 5 exercises (Air Squat + Crow Pose) on the native interface using `google/nano-banana` (8 credits/image, free plan). **Key finding: the environment collapse seen in the Artlist run (windowed yoga studio on Crow Pose) does NOT occur on the native interface.** Both images rendered the warm seamless backdrop + oak hardwood floor correctly. This confirms the Artlist wrapper was responsible for the style inconsistency, not the underlying model. Crow Pose arm balance is still partial (feet not fully off mat) but materially better than the Artlist result. At 20 free credits, only 2 runs were possible — a paid run of all 5 exercises is recommended before drawing final conclusions.

---

## Per-exercise scores

Scoring rubric (from `image-bakeoff.md`):  
**A** = Anatomy · **P** = Pose readability · **S** = Style consistency · **R** = Photorealism · **W** = Wow factor  
Scale 1–5. Overall = min score (worst criterion drives the decision), not average.

---

### 1. Air Squat

| Criterion | Grok | ChatGPT | Nano Banana 2 |
|---|---|---|---|
| Anatomy (A) | 5 — parallel femurs at depth, natural spine, knees tracking correctly | 4 — good depth, minor foot angle issue | 5 — two images (male + female), both with correct parallel thighs, arms extended forward |
| Pose readability (P) | 5 — pure side profile, phase is unambiguous | 4 — 3/4 angle, readable but less clean | 4 — 3/4 angle, readable but not pure side profile |
| Style consistency (S) | 5 — warm grey seamless, oak floor, 85mm-look compression | 2 — gym environment, different lighting register | 4 — warm cream-grey backdrop + oak floor, close to brief |
| Photorealism (R) | 5 — editorial-grade sharpness and texture | 4 — clean but somewhat processed look | 4 — clean and sharp, natural editorial look |
| Wow factor (W) | 4 — handsome, not flashy | 3 — serviceable | 3 — competent, not distinctive |
| **Overall (min)** | **4** | **2** | **3** |

**Notes:**
- Grok nailed the canonical frame — pure side, parallel-to-floor femurs, slightly open stance.
- ChatGPT defaulted to a gym backdrop instead of the specified seamless studio. This is the critical failure: the whole brief hinges on visual consistency across 161 images, which requires the same backdrop treatment on every shot. ChatGPT ignored this despite it appearing in the opening system block.
- Grok produced 9 variations of the same shot; the best 1–2 are genuinely app-ready.
- Nano Banana 2 generated two images (male + female subjects), both with strong anatomy and a warm cream-grey backdrop + oak floor close to the brief. Angle is 3/4 rather than pure side. Overall a solid result, not as polished as Grok.

---

### 2. Farmer's Carry

| Criterion | Grok | ChatGPT | Nano Banana 2 |
|---|---|---|---|
| Anatomy (A) | 5 — loaded shoulder girdle, packed traps, proper gait phase | 4 — correct carry position, some forward lean | 5 — female subject, mid-stride, both kettlebells visible, correct shoulder loading |
| Pose readability (P) | 5 — bilateral kettlebells, side profile walk, immediately legible | 4 — readable, but 3/4 view slightly ambiguous | 5 — pure side profile, mid-stride gait unmistakable |
| Style consistency (S) | 5 — same warm grey seamless + oak floor as Air Squat | 2 — different environment again | 4 — warm grey backdrop + oak floor, consistent with Air Squat result |
| Photorealism (R) | 5 — dramatic rim light, crisp texture on kettlebell handles | 4 — decent | 4 — clean and natural, good kettelbell texture |
| Wow factor (W) | 5 — cinematic silhouette quality | 3 — flat | 4 — strong posture, good energy |
| **Overall (min)** | **5** | **2** | **4** |

**Notes:**
- Grok's Farmer's Carry is the best single image in the bake-off. The rim lighting creates a beautiful silhouette against the seamless, and the loaded posture is textbook. This would serve as the workhorse reference image for the full generation run.
- ChatGPT again ignored the environment spec.
- Nano Banana 2 produced a strong result — pure side profile, correct gait phase, both kettlebells present, backdrop mostly matching the brief. Second only to Grok on this exercise.

---

### 3. Turkish Get-Up

| Criterion | Grok | ChatGPT | Nano Banana 2 |
|---|---|---|---|
| Anatomy (A) | 5 — half-kneeling position, locked elbow, weight stacked correctly over shoulder | 3 — showed mid-movement but phase was ambiguous | 4 — half-kneeling position correct, kettlebell overhead; held by horn rather than balanced on wrist |
| Pose readability (P) | 5 — the briefed canonical frame (half-kneeling + arm overhead) rendered clearly | 3 — harder to identify specific phase without caption | 4 — correct phase, immediately legible |
| Style consistency (S) | 5 — same studio | 2 — different environment | 4 — warm grey seamless + oak floor maintained |
| Photorealism (R) | 4 — very good; some lens flare in 2 of 9 frames | 4 — technically solid | 4 — clean, editorial quality |
| Wow factor (W) | 4 — unusual pose + dramatic light = strong | 3 — flat | 3 — correct but not dramatic |
| **Overall (min)** | **4** | **2** | **3** |

**Notes:**
- Turkish Get-Up is the hardest exercise in the bake-off to photograph because the canonical frame (half-kneeling, arm locked overhead) is a subtle moment. Grok got it right on 7 of 9 frames. The 2 outliers showed the bottom or top of the movement — acceptable misses given a 9-image batch.
- This exercise will likely need a polish re-roll for ~3 of the 9 frames if going to production.
- Nano Banana 2 correctly identified the half-kneeling + overhead arm phase and maintained the environment spec. Two images generated (2 different male subjects). The grip is by the horn (standard press grip) rather than the kettlebell balanced on the back of the wrist as specified — a minor deviation. Strong result overall.

---

### 4. Crow Pose (Bakasana)

| Criterion | Grok | ChatGPT | Nano Banana 2 |
|---|---|---|---|
| Anatomy (A) | 5 — knees resting on triceps, hips high, gaze forward, solid arm balance | 4 — mostly correct but hips slightly low in 1 image | 2 — subject in Crow Pose preparation (hands down, back rounded) but feet still on the floor — arm balance not achieved |
| Pose readability (P) | 5 — instantly recognisable arm balance | 5 — very clear | 3 — recognisable as Crow Pose prep but ambiguous whether it's intentional or an error |
| Style consistency (S) | 5 — consistent studio | 3 — closer to brief than earlier images | 1 — complete environment miss: natural light yoga studio with visible window and furnishings; no seamless backdrop |
| Photorealism (R) | 5 — excellent | 4 — slightly soft | 4 — technically good photo quality |
| Wow factor (W) | 5 — dramatic from slightly low, side angle | 4 — nice | 2 — not an arm balance, not dramatic |
| **Overall (min)** | **5** | **3** | **1** |

**Notes:**
- Crow Pose is where both models performed best on anatomy — arm balances have strong training signal and both models recognise them reliably.
- Grok's 9-frame batch showed tasteful variation in angle (mostly 3/4 front or side) while maintaining backdrop consistency. Best framing is the low side-angle looking up slightly — shows the arm balance character without losing floor line.
- ChatGPT was closer to brief here than on any strength exercise — the yoga posture may have pulled it toward a cleaner-looking environment.
- **Nano Banana 2 critical failure on Crow Pose**: Two compounding problems. First, the arm balance itself was not rendered — subject is entering the pose (bent forward, hands on mat, back rounded) but both feet remain on the floor. Second, the environment spec was completely abandoned: the image shows a natural light yoga studio with a visible window, baseboard, and furniture in the background. This is the worst single result of the bakeoff. Would require a full re-roll.

---

### 5. Savasana

| Criterion | Grok | ChatGPT | Nano Banana 2 |
|---|---|---|---|
| Anatomy (A) | 5 — flat on back, feet falling open, arms by sides palms up, face relaxed | 4 — correct position, slightly stiff arms | 5 — flat on back, feet falling open, arms by sides palms up, eyes closed, jaw relaxed |
| Pose readability (P) | 5 — overhead angle looking down from head-end, body receding into frame as briefed | 4 — correct pose, angle less dramatic | 5 — overhead angle from head-end as briefed; head fills lower frame, feet recede upper frame |
| Style consistency (S) | 5 — same studio treatment | 3 — cleaner than strength shots | 3 — oak floor and cream/oat mat correct; room baseboard and wall visible at top (not pure seamless) |
| Photorealism (R) | 5 — soft diffused overhead light is perfect for the contemplative mood | 4 — adequate | 4 — soft, diffused light, natural and contemplative |
| Wow factor (W) | 4 — serene, meditative | 3 — flat | 4 — serene, the overhead perspective makes it immediately legible as intentional yoga |
| **Overall (min)** | **4** | **3** | **3** |

**Notes:**
- Savasana is the easiest anatomy shot (person lying still) and both models executed it well. The differentiator is the camera angle: Grok correctly rendered the overhead, slightly-angled perspective specified in the brief; ChatGPT used a more conventional 45° side angle.
- The overhead angle is important because Savasana at 45° looks like someone asleep, not practising yoga. The Grok framing makes it immediately legible as an intentional pose.
- Nano Banana 2 matched the brief camera angle perfectly — overhead from head-end with the body receding. Anatomy is excellent. The only weakness is the environment: a room wall and baseboard are visible at the top of the frame rather than a pure seamless backdrop. Oat-coloured top + dusty navy leggings match the brief exactly.

---

---

## Native nano-banana.com — Supplemental run (2 of 5 exercises)

**Interface:** nano-banana.com → Text to Image → `Nano Banana` model (google/nano-banana, 8 credits/image)  
**Date:** 30 April 2026  
**Note:** Free plan, 20 trial credits — only 2 exercise runs possible. Crow Pose tested first (to probe the environment collapse seen on Artlist), Air Squat second.

Scoring rubric: **A** = Anatomy · **P** = Pose readability · **S** = Style consistency · **R** = Photorealism · **W** = Wow factor. Scale 1–5. Overall = min score.

---

### Crow Pose (Bakasana) — Native vs Artlist comparison

| Criterion | Native nano-banana.com | Artlist (prior run) |
|---|---|---|
| Anatomy (A) | 3 — entering Crow Pose, one foot lifting off mat; knees not yet resting on triceps; full arm balance not achieved | 2 — feet fully on floor, arm balance not rendered at all |
| Pose readability (P) | 3 — identifiable as Crow Pose entry; intent clear but ambiguous whether full pose is reached | 3 — recognisable as Crow Pose prep, ambiguous |
| Style consistency (S) | **5** — warm beige seamless backdrop + oak hardwood floor; sage tank + charcoal leggings; matches brief; no room, no windows | 1 — complete environment miss: windowed yoga studio with baseboard and furnishings |
| Photorealism (R) | 5 — beautiful editorial quality, natural skin, excellent light | 4 — technically good photo quality |
| Wow factor (W) | 3 — genuinely lovely image but not the arm balance | 2 — not an arm balance, not dramatic |
| **Overall (min)** | **3** | **1** |

**Key finding:** The environment collapse is a **wrapper issue, not a model issue.** The native interface (`google/nano-banana` directly) correctly rendered the seamless backdrop on Crow Pose. The Artlist-wrapped version did not. The arm balance itself is still partial on both — the model struggles to fully lift the feet and place knees on triceps without additional prompting or reference images.

---

### Air Squat — Native vs Artlist comparison

| Criterion | Native nano-banana.com | Artlist (prior run) |
|---|---|---|
| Anatomy (A) | 4 — thighs close to parallel, shins vertical, arms extended correctly, good form; slightly above true parallel depth | 5 — two images (male + female), both with correct parallel thighs, arms extended forward |
| Pose readability (P) | 4 — pure side profile (brief specified 3/4 front; deviation is minor and pose is unambiguous) | 4 — 3/4 angle, readable but not pure side profile |
| Style consistency (S) | **5** — warm grey seamless backdrop, matte oak hardwood floor, oat tank, charcoal shorts — nails the spec | 4 — warm cream-grey backdrop + oak floor, close to brief |
| Photorealism (R) | 5 — editorial-grade, sharp, natural; better than Artlist result | 4 — clean and sharp, natural editorial look |
| Wow factor (W) | 4 — clean, confident, compositionally strong | 3 — competent, not distinctive |
| **Overall (min)** | **4** | **3** |

**Notes:**
- Native NB Air Squat is a clear improvement over the Artlist result — better photorealism, cleaner backdrop, stronger overall score.
- Subject switched from female (Artlist) to male — the model picks its own demographic unless explicitly anchored via reference image.
- The native interface has a "8 Reference Images" / 8-Image Mix feature, which could be used to lock subject demographics and environment across the full run. Not tested in this supplemental run (Text to Image mode, no reference used).

---

## Overall model assessment

### Grok Imagine — **Recommended**

**Strengths:**
- Faithfully renders the environment spec (seamless warm grey + oak hardwood floor) on every single shot without exception.
- Produces 9 variations per prompt, giving immediate built-in selection — the full 161-image run would yield 1,449 frames to curate down to 161.
- Anatomy is strong across all exercise types (strength, kettlebell, yoga).
- The lighting register (warm, slightly dramatic, rim-lit) is consistent with the brief and produces editorial-quality results.
- Camera compression suggests the 85mm-equivalent framing requested.
- Pricing model is currently free / generous credit tier (no per-image charge visible at time of test).

**Weaknesses:**
- Some variation in subject demographics across the 9-frame batch (different apparent skin tones, builds). This is a content diversity question, not a quality failure, but worth noting.
- 2:3 aspect ratio lock (vs. the specified 4:5). The difference is small (~6% more height) and both will crop to 4:5 without significant quality loss — but confirm the export/crop step before the full run.
- A handful of Turkish Get-Up frames missed the canonical half-kneeling phase.

### ChatGPT / GPT-4o — **Runner-up**

**Strengths:**
- Excellent at anatomy on complex yoga poses (Crow Pose was very good).
- Simple interface, no queue, fast.
- Good photorealism on individual shots.

**Weaknesses:**
- **Critical failure**: ignores the environment spec. Every image was generated in a different gymnasium, studio, or environment. For a 161-image set that needs visual coherence, this is a hard blocker. You would need to post-process or composite every image to achieve backdrop consistency.
- 1 image per prompt — no natural curation pool. Bad generations require full re-prompts.
- Style register varies across shots (different lighting, different colour temperature).

### Nano Banana 2 (via Artlist AI Toolkit) — **Runner-up (tied with ChatGPT overall, beats it on anatomy)**

**Strengths:**
- Strong anatomy on strength exercises (Air Squat, Farmer's Carry) — matches or exceeds ChatGPT.
- Turkish Get-Up: correctly identified the half-kneeling + overhead arm phase, maintained environment spec.
- Savasana: excellent. Matched the overhead camera angle from head-end exactly as briefed. Best Savasana result of the three models on pose readability.
- Generates 2 images per prompt (1 credit each), giving a small built-in selection pool.
- Fast generation with a clean interface (Artlist AI Toolkit).

**Weaknesses:**
- **Crow Pose critical failure**: Did not render the arm balance (feet remained on floor) AND completely abandoned the environment spec (windowed yoga studio instead of seamless). This is a double failure on the hardest exercise.
- Style consistency is unreliable: maintained on 4 of 5 exercises but broke badly on Crow Pose. For a 161-image run this inconsistency is a significant risk.
- 1 image per credit (vs Grok's 9 per prompt) means less curation pool per generation.
- Baseboard/wall occasionally visible in environment, suggesting it generates a room rather than a true seamless sweep.

**Verdict:** Not recommended as primary for the full run via Artlist — the Crow Pose environment collapse is a hard blocker. However, the supplemental run on the native interface confirms the model itself is capable; the failure was in the Artlist wrapper. See native assessment below.

---

### Nano Banana (native nano-banana.com, google/nano-banana) — **Supplemental / Promising**

*Tested on 2 of 5 exercises only. Full 5-exercise run needed before a definitive verdict.*

**Strengths:**
- **Environment consistency on native interface**: both exercises rendered the warm seamless backdrop + oak floor correctly. The Artlist wrapper was the root cause of the Crow Pose style collapse — not the underlying model.
- Photorealism is excellent — Air Squat and Crow Pose both editorial-grade, sharper and more natural-looking than the Artlist-wrapped versions.
- Style spec adherence (neutral activewear, muted palette, no logos) consistent on both exercises tested.
- Native interface has an 8-Image Mix feature (up to 8 reference images for style/subject anchoring) — not yet tested in Text to Image mode, but could lock subject demographics and environment for the full run.

**Weaknesses:**
- Crow Pose arm balance still partial on native — feet do not fully leave the mat. Needs stronger prompting or a reference image to achieve textbook Bakasana.
- 1 image per generation (8 credits), versus Grok's 9 per prompt. Much smaller curation pool.
- Free plan (20 trial credits) used up by this supplemental run. Would need a paid plan for the full 161-image run.
- Subject demographics unconstrained without reference image — model chose male for Air Squat, female for Crow Pose.

**Verdict:** Promising as a secondary model, especially for strength exercises. The environment issue was a wrapper artefact. Recommend running all 5 exercises on the native interface before drawing final conclusions. The 8-Image Mix feature is the key unknown — if it can anchor subject and environment across prompts, native NB could serve as a capable fallback for exercises where Grok misses.

---

## Recommended next steps

1. **Use Grok as the primary workhorse** for the full 161-image run. The Farmer's Carry output is the reference image — use it as the visual anchor for all subsequent generation to hold style and backdrop consistent.

2. **Run the remaining 3 exercises on native nano-banana.com** (Farmer's Carry, Turkish Get-Up, Savasana) to complete the 5-exercise comparison. The Artlist run's Crow Pose failure was a wrapper issue — the native model is demonstrably stronger. Test with the 8-Image Mix feature to probe whether subject and environment anchoring is achievable. This would take ~30 minutes with a paid credit top-up.

3. **Polish re-roll plan:** After the full Grok run, expect ~15–25 frames to need re-rolling based on:
   - Missed canonical phase (Turkish Get-Up, plyo exercises, Olympic lifts)
   - Demographic inconsistency if subject continuity is desired
   - Any shot where the oak floor or seamless backdrop is not visible (Grok occasionally renders a darker, gradient backdrop on some complex poses)
   - For re-rolls on yoga/arm balance poses, consider using native nano-banana.com as the fallback (now confirmed environment-stable)

4. **Crop normalisation:** Grok outputs 2:3. The brief specifies 4:5. Build the generation runner with a crop step: centre-crop from 2:3 → 4:5 (remove equal amounts from top and bottom), then verify no important anatomy is clipped.

5. **Wire images into DB** (Step 4 in `IMAGE_GENERATION_HANDOFF.md`) once the full run is curated and cropped.

---

## File references

- Full prompt text: `docs/image-bakeoff.md`
- Scoring rubric: `docs/image-bakeoff.md` → Scoring rubric section
- Prompt library (161 exercises): `scripts/output/exercise-prompts.json`
- Generation runner spec: `IMAGE_GENERATION_HANDOFF.md` → Step 2
- Grok Imagine: https://grok.com/imagine
- Nano Banana: https://nano-banana.com/nanobananapro

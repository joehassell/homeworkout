# Image Generation — Handoff

Single source of truth for the in-flight work to add visual assets (photoreal exercise images + SVG equipment icons) to the app. Read this top-to-bottom if you're picking the work back up.

---

## TL;DR

We've shipped the **foundations** — prompt generation, equipment icon system, drift detection. We have **not yet generated any exercise photographs**. The remaining work is split across three lanes (designer, engineering, content).

| Lane | Status |
|---|---|
| Foundations & tooling | ✅ Done |
| Equipment SVG icons (25 files) | ⚠️ Authored AI-blind, **need designer visual QA** |
| Existing placeholder migration to `currentColor` | ✅ Done — but introduces a temporary visual regression (see below) |
| Bake-off (5 prompts × 4 models) to pick generation tool | ⏳ Not started |
| Full 161-image generation run | ⏳ Blocked on bake-off |
| Wiring `image` field into DB / YOGA_DB | ⏳ Blocked on generation |

---

## What's already in place

### Files added in this work

| Path | Purpose |
|---|---|
| `docs/image-bakeoff.md` | 5-exercise × 4-model side-by-side prompt pack for choosing the workhorse model (Nano Banana / Flux 1.1 Pro Ultra / Midjourney v7 / Grok Imagine). Paste-ready prompts. |
| `scripts/generate-image-prompts.js` | Node script (zero deps) that reads `js/exercises.js` (DB) + `js/yoga.js` (YOGA_DB) + `index.html` (`EQUIPMENT_CATALOG` + `EQUIPMENT_ICON`) and produces structured prompts + an equipment manifest with drift detection. |
| `scripts/output/exercise-prompts.json` | 161 prompts keyed by slug. API-ready. |
| `scripts/output/exercise-prompts.md` | Human-reviewable prompts grouped by category. |
| `scripts/output/exercise-prompts.csv` | RFC-4180 CSV for spreadsheet workflows. |
| `scripts/output/_summary.txt` | Counts and breakdown. |
| `scripts/output/equipment-manifest.json` | 57-entry manifest cross-referencing catalog × icons × render specs × exercise usage. |
| `img/equipment/*.svg` | 25 SVG icons covering all 57 EQUIPMENT_CATALOG items via tier strategy. |
| `img/equipment/_preview.html` | Visual QA page rendering all 25 icons at 16/24/32/48 px with a colour-theming demo. **Designer should open this in a browser.** |

### Code changes in existing files

- **`index.html`**: added `EQUIPMENT_ICON` map (57 mappings) + `equipmentIconUrl(equipId)` helper, mirroring the existing `exerciseImageUrl()` pattern.
- **`css/styles.css`**: added `.eq-icon` class with `--xs / --sm / --md / --lg / --xl` size ladder using `currentColor`.
- **`img/exercises/placeholder-*.svg`** (7 files): migrated `fill="#64748b"` → `fill="currentColor"`. **This is a visual regression** under the current `<img>`-tag rendering — see designer brief below.

### Validation that was wired up

The script throws loudly on any of:

- New exercise references equipment not in the catalog
- New catalog entry has no render spec in `EQUIPMENT_SPECS`
- Icon file referenced in `EQUIPMENT_ICON` doesn't exist on disk
- Override key in prompt-generation script points at a non-existent exercise
- Unknown category in DB (no rule + no override)
- Any prompt contains the literal `undefined`, `null`, or `[object`
- Slugs collide
- Count mismatch between extracted DB and expected total

This is intentional. If anyone adds a commercial-gym exercise to the DB later that uses a brand-new equipment type, the next script run will *crash with a specific error* until the catalog + icon + spec are also added. That's the drift-prevention contract.

### How to regenerate everything

```bash
node scripts/generate-image-prompts.js
```

Produces all five output files in `scripts/output/`. Idempotent. Run after any DB / YOGA_DB / EQUIPMENT_CATALOG / EQUIPMENT_ICON change.

```bash
npm test
```

All 76 existing tests pass. None of this work touched test-relevant code paths, but worth re-running after any future change.

---

## 🎨 Designer brief — please pass this to the designer verbatim

> All SVGs in `img/exercises/` and `img/equipment/` now use `fill="currentColor"`. They will render **black** under the current `<img class="...-img" src="...">` markup pattern in `index.html` because `<img>`-loaded SVGs don't inherit CSS color from their parent. This is a temporary visual regression introduced to enable proper theming. To re-enable colour control (tinting by accent, dimming when disabled, dark-mode contrast), pick one of the patterns below.
>
> **Pattern 1 — Inline SVG injection.**
> Fetch the SVG content via `fetch()`, parse, and inject into the DOM. The SVG element then inherits `color` from any ancestor.
>
> ```js
> async function injectSvg(host, url) {
>   const r = await fetch(url);
>   host.innerHTML = await r.text();
> }
> ```
>
> Wrap in any element with the `eq-icon` class — sizing and colour cascade automatically. Best ergonomics; pays a small fetch cost (mitigated by HTTP cache).
>
> **Pattern 2 — CSS mask.**
> Replace `<img src="x.svg">` with `<span style="--icon-mask: url('x.svg')"></span>`, and add CSS:
>
> ```css
> .eq-icon {
>   background-color: currentColor;
>   -webkit-mask: var(--icon-mask) no-repeat center / contain;
>   mask: var(--icon-mask) no-repeat center / contain;
> }
> ```
>
> Works with any SVG regardless of its internal `fill` attributes (the SVG is used as a shape mask only). No fetch cost. The trade-off is markup changes everywhere `<img>` is used today.
>
> **Pattern 3 — `<svg><use href>`.** Only works for same-origin SVGs, and `<use>` has cross-document quirks. Generally avoid for this app.
>
> **Three places in the app currently load placeholders via `<img>`** and need updating to one of the patterns above:
> 1. Preview thumbnails (CSS class `.exercise-img`, in `index.html` around line 2999)
> 2. Timer screen image (`.timer-exercise-img`, around line 3587)
> 3. Info modal full-width image (`.info-exercise-img`, around line 1645)
>
> Once one of these patterns is wired up, theming the icons (e.g. tinting filter chips, dimming disabled equipment in the equipment catalogue) becomes a CSS one-liner.
>
> **Visual QA needed too.** Open `img/equipment/_preview.html` and check whether each of the 25 silhouettes is recognisable as the equipment it represents at 16 px and 48 px. The SVG paths were AI-authored without visual feedback, so some may need redrawing. Specifically check: `kettlebell`, `bike`, `treadmill`, `ski-erg`, `cable-machine`, `selectorized-machine`, `power-rack`, `parallettes`, `trx`, `ab-wheel`. If any read poorly, replace the path data — viewBox is 50×50, single `<path fill="currentColor">` per file.

---

## ⏳ Engineering work remaining

### Step 1 — Run the bake-off (~30 min)

`docs/image-bakeoff.md` has 20 prompts (5 exercises × 4 models) ready to paste.

1. Pick a single subject reference image (or generate the Air Squat first and use it as the consistency anchor for the other four).
2. Paste each prompt into the corresponding tool — Nano Banana, Flux 1.1 Pro Ultra (via Replicate or fal), Midjourney v7, Grok Imagine.
3. Score each model on the rubric in `image-bakeoff.md` (anatomy, pose readability, style consistency, photorealism, wow factor — **don't average; look at the worst score**).
4. The model that wins anatomy *and* style consistency is the workhorse for the full run. Wow factor is a tiebreaker, not a primary criterion.

Default recommendation if no preference emerges: **Nano Banana** (cheapest, scriptable, best consistency from a reference image).

### Step 2 — Build the generation runner (~1 hour)

Companion script to `generate-image-prompts.js`. Suggested name: `scripts/generate-images.js`. Spec:

- Read `scripts/output/exercise-prompts.json`.
- For each entry, POST `{prompt, negative_prompt, aspect_ratio: '4:5'}` to the chosen model's API.
- Save PNGs to `assets/exercises/{slug}.png` (or `img/exercises/{slug}.png` if matching the existing structure).
- **Skip already-generated files** so re-runs are incremental and resumable.
- Rate-limit (most APIs are 1–5 RPS).
- Log progress and total cost.

API-key handling: read from env var (e.g. `NANO_BANANA_API_KEY`), don't hardcode.

Approximate cost for Nano Banana: ~$0.04/image × 161 = **~$7 for the full run**. Flux 1.1 Pro Ultra: ~$0.10/image × 161 = ~$16. Both trivially affordable.

### Step 3 — Polish-rerun (~30 min)

Inspect the 161 generated images. Identify the ~10–20 that drift on anatomy or style. Re-roll those in a different model (typically Flux 1.1 Pro Ultra for anatomy fixes, Midjourney v7 for hero shots). Hand-tune the override text in `generate-image-prompts.js` for any whose canonical-frame description was the culprit, regenerate, and re-run only those slugs.

### Step 4 — Wire `image` field into DB and YOGA_DB

Once images exist on disk:

```diff
- {name:"Air Squat",cat:"lower-squat",equip:["bodyweight"],...
+ {name:"Air Squat",image:"strength-air-squat.png",cat:"lower-squat",equip:["bodyweight"],...
```

The existing `exerciseImageUrl(exercise)` function in `index.html` already handles this:

```js
function exerciseImageUrl(exercise) {
  if (exercise.image) return 'img/exercises/' + exercise.image;
  // ...falls back to category placeholder
}
```

So adding the `image` field per exercise is the only change. Slugs in `exercise-prompts.json` are designed to be safe filenames already (`strength-air-squat`, `yoga-warrior-i`, etc.) — pair them with `.png` and you're done.

You could automate this in the generation runner: as each PNG is saved, write/update the `image:` field in the source files. Optional convenience.

### Step 5 — Equipment image generation (separate, lower priority)

The equipment SVG icons handle UI use cases. Photoreal equipment images (e.g. for an "explore equipment" gallery, equipment-purchase suggestions, or marketing) would be a separate batch using the `EQUIPMENT_SPECS` render specs already in `generate-image-prompts.js`. Defer until there's an actual UI need.

---

## Decisions log (why things are the way they are)

| Decision | Reason |
|---|---|
| Photoreal images for **exercises**, SVG icons for **equipment** | Equipment in UI = filter chips & list rows at 16–48 px, where photos look like blobs. Equipment *inside* exercise photos remains photoreal (the kettlebell *being held* is rendered photorealistically by the prompt). Two purposes, two media. |
| 25 SVGs cover 57 catalogue items via tier strategy | Hand-authoring 56 distinct icons makes no sense — many commercial machines are visually indistinguishable at icon size. `selectorized-machine.svg` covers 21 plate-loaded machines; `bench.svg` covers 6 bench variants; `bike.svg` covers 3 stationary bike types. |
| `currentColor` everywhere | Enables CSS-driven theming (accent colours, disabled states, dark mode). Trade-off is the temporary `<img>`-tag rendering issue handled in the designer brief. |
| House style locked into a single prompt prefix constant | Change once, regenerate 161 prompts. No drift across the set. |
| Override map for ~50 "tricky" exercises | Category rules handle 65% of exercises cleanly. The other 35% (Turkish Get-Up, Crow Pose, Savasana, every plyo / clean / snatch) need hand-written canonical-frame descriptions because the rule lies. |
| Single right-side rule for all `single_sided` exercises | Universal application beats inconsistency. Mirror in code if both sides are needed. |
| Subject pinned to one demographic for the bake-off | Judging the **model**, not the casting. Diversity rotation is a downstream content decision. |
| Validation throws on any drift | Better to crash with "unknown equipment 'cable column'" than silently produce wrong prompts. Future contributors are forced to update all maps when adding catalogue entries. |
| Equipment manifest as a separate output | Designer + engineer can both consume it. Can also drive future "equipment shopping list" or "what does this exercise need" features. |

---

## Open questions / known issues

- **Existing 7 placeholder SVGs render black under `<img>` markup** — visual regression until designer migrates markup pattern. Ship-blocker if not addressed before next user-facing release. **The new equipment icons in `img/equipment/` haven't been wired into any UI surface yet** — only authored, not used. Designer + frontend dev to wire them into filter chips, equipment catalogue, etc.
- **AI-authored SVGs need visual QA** — paths were written without visual feedback. Designer should preview `img/equipment/_preview.html` and call out any that don't read.
- **Hanging Scapular Pulls and similar subtle movements** may produce weak photoreal images — the canonical frame ("body lifted ~2 inches") is a small visual delta that AI image models often miss. Expect to re-roll.
- **Bodyweight icon as a person silhouette** — already authored, but it's stylistically very similar to the existing exercise placeholders. Designer may want it more abstract (e.g. an inset circle) so "bodyweight" reads as "no equipment" rather than "person".
- **Equipment fallback hierarchy** is currently flat — `EQUIPMENT_ICON` maps every catalogue entry directly to a file. If a future catalogue entry is added without an `EQUIPMENT_ICON` mapping, validation throws. We could relax this by adding a category-based fallback (`getEquipmentCategory(id) → 'machine' / 'cardio' / 'bar'`), but defer until there's a concrete need.

---

## File reference

```
docs/
├── image-bakeoff.md              ← bake-off prompt pack
└── IMAGE_GENERATION_HANDOFF.md   ← this file

scripts/
├── generate-image-prompts.js     ← the generator (run with `node`)
└── output/
    ├── exercise-prompts.json     ← 161 prompts, API-ready
    ├── exercise-prompts.md       ← human review
    ├── exercise-prompts.csv      ← spreadsheet
    ├── _summary.txt              ← counts breakdown
    └── equipment-manifest.json   ← 57-entry catalogue × icons × specs

img/
├── exercises/
│   └── placeholder-*.svg         ← 7 existing placeholders, now currentColor
└── equipment/
    ├── *.svg                     ← 25 new equipment icons, all currentColor
    └── _preview.html             ← designer QA page
```

In `index.html`:
- `EQUIPMENT_CATALOG` (~line 2030) — the canonical equipment list
- `EQUIPMENT_ICON` (~line 2828) — equipment-id → SVG filename
- `equipmentIconUrl(equipId)` (~line 2887) — helper
- `CATEGORY_PLACEHOLDER` (~line 2809) — exercise-category → SVG filename (pre-existing)
- `exerciseImageUrl(exercise)` (~line 2823) — helper (pre-existing)

In `css/styles.css`:
- `.eq-icon` + size ladder (~line 718) — equipment icon sizing system
- `.exercise-img / .timer-exercise-img / .info-exercise-img` (~line 990) — pre-existing exercise image classes

In `js/exercises.js`:
- `const DB = [...]` — 114 strength exercises with the augmented v3 schema (impact / complexity / joint_load / cv_demand / requires_balance / requires_floor / min_fitness / contraindicated_for / pregnancy_safe)

In `js/yoga.js`:
- `const YOGA_DB = [...]` — 47 yoga poses with `narration[]` + `transition_in`

---

## Contact / context

Generated as part of the image-generation foundation work in branch `claude/wonderful-hopper-551c6a`. See PR description for the merge that introduced this work for the full conversation log.

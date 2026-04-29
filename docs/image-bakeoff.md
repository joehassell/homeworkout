# Exercise Image Generation — Bake-off Pack

Five exercises × four models. Same five movements across every model so you can compare like-for-like. Pick the winner, then run the full 150 in that model.

The five were chosen to span the difficulty range:

| Exercise | What it tests |
|---|---|
| **Air Squat** | Baseline. Common pose, well-represented in training data. If a model can't nail this, fail fast. |
| **Farmer's Carry** | Mid-stride motion + heavy props (two kettlebells) + asymmetric tension. Tests whether the model can render *implied weight*. |
| **Turkish Get-Up** | Multi-phase movement, unusual position (half-kneeling windmill), KB locked overhead. Anatomy stress test. |
| **Crow Pose** | Hand balance, full body off the floor, knees on triceps. Tests the model's ability to render an unstable, uncommon shape correctly. |
| **Savasana** | The "looks like nothing" test. Whichever model makes a person lying still look intentional and beautiful is the one with real taste. |

---

## House style (paste this once, lock it in)

```
Editorial fitness photography, single subject, studio environment with a warm
light-grey seamless backdrop and a matte oak hardwood floor. Soft, broad key
light from camera-left at 45°, gentle fill from camera-right, subtle hair-light
behind — overall mood is bright but contoured, never flat or harsh. Subject
wears fitted, neutral activewear in a muted palette (charcoal, oat, sage, or
dusty navy — never logos, never black-on-black). Skin is naturally toned with
visible muscle definition but no oil-slick gym aesthetic. Equipment is matte
black or raw cast iron, nothing chrome. Shot on a full-frame camera with an
85mm prime, f/4, eye-level or slightly low angle, subject filling 75% of the
frame with deliberate negative space above the head. Photorealistic, sharp
focus on the subject, very subtle film grain, no motion blur, no digital
sheen, no fitness-magazine cheese. 4:5 portrait aspect ratio.
```

Subject reference for all five: **adult, athletic-but-not-bodybuilder build, mid-30s, short dark hair, neutral expression, focused.** Pin one subject for the bake-off so you're judging the model, not the casting.

---

## 1. Air Squat

**Canonical frame:** Bottom of the squat. Thighs at parallel or just below. Shins vertical. Chest up, arms extended forward at shoulder height for counterbalance. Weight in heels visible by the angle of the foot. 3/4 front view from camera-left, slightly low angle.

### Nano Banana (Gemini 2.5 Flash Image)

```
A photorealistic editorial fitness photograph. An athletic adult in their
mid-30s with short dark hair holds the bottom position of an air squat —
thighs parallel to the floor, shins vertical, chest lifted, arms extended
straight forward at shoulder height for counterbalance. Three-quarter front
view from the subject's left, eye-level slightly low.

Studio setting: warm light-grey seamless backdrop, matte oak hardwood floor.
Soft broad key light from camera-left at 45°, gentle fill from camera-right,
subtle hair-light behind. Subject wears fitted oat-coloured tank and charcoal
shorts, no logos. Naturally toned skin with visible but not exaggerated muscle
definition.

Shot on full-frame, 85mm prime, f/4. Sharp focus, subtle film grain, no motion
blur, no digital sheen. 4:5 portrait. Subject fills 75% of the frame with
negative space above the head.
```

### Flux 1.1 Pro Ultra (via Replicate / fal)

```
Editorial fitness photograph, photorealistic. Athletic person, mid-30s, short
dark hair, neutral focused expression, holding the bottom position of an air
squat: thighs parallel to floor, shins vertical, chest up, arms extended
forward at shoulder height. Three-quarter front view from subject's left,
slightly low angle.

Warm light-grey seamless studio backdrop, matte oak hardwood floor. Key light
camera-left 45°, soft fill camera-right, hair-light behind. Fitted oat tank,
charcoal shorts, no logos. Skin naturally toned, defined but not oiled.

85mm prime, f/4, full-frame sensor. Sharp subject focus, subtle film grain,
no motion blur. 4:5 aspect ratio.

Negative: blurry, motion blur, plastic skin, oversaturated, gym mirror,
chrome equipment, logos, text, watermark, fisheye, wide-angle distortion.
```

Replicate params: `aspect_ratio: "4:5"`, `output_format: "png"`, `safety_tolerance: 2`, `raw: false`.

### Midjourney v7

```
editorial fitness photograph, athletic person mid-30s short dark hair holding
bottom of air squat, thighs parallel to floor, shins vertical, chest lifted,
arms extended forward at shoulder height, three-quarter front view from left,
warm light-grey seamless studio backdrop, matte oak hardwood floor, soft key
light camera-left 45°, fitted oat tank charcoal shorts no logos, naturally
toned skin, defined musculature, 85mm f/4, subtle film grain, sharp focus
--ar 4:5 --style raw --v 7 --s 100
```

### Grok Imagine

```
Photorealistic editorial fitness studio photograph. An athletic person in
their mid-30s with short dark hair holds the bottom of an air squat —
thighs parallel to the ground, shins vertical, chest lifted, arms straight
out forward at shoulder height. Three-quarter view from the left, slightly
low angle. Warm light-grey seamless backdrop, oak hardwood floor, soft
directional studio lighting. Oat tank and charcoal shorts, no logos. 4:5
portrait, sharp focus, subtle film grain.
```

---

## 2. Farmer's Carry

**Canonical frame:** Mid-stride. Two heavy kettlebells, one in each hand, hanging at the sides. One foot planted, the other leaving the ground for the next step. Shoulders pulled back and down, traps engaged from the load, core braced visible by rib position. Pure side profile so the body line and weight tension read clearly.

### Nano Banana

```
A photorealistic editorial fitness photograph. An athletic adult in their
mid-30s with short dark hair walks forward carrying a heavy matte-black
kettlebell in each hand, arms extended down at the sides under load.
Captured mid-stride: rear foot just leaving the floor, front foot fully
planted. Shoulders rolled back and down, traps engaged, core braced, ribs
stacked over hips, gaze forward.

Pure side profile from camera-left, eye-level. Studio setting: warm
light-grey seamless backdrop, matte oak hardwood floor. Soft broad key
light from camera-left, subtle rim light behind. Subject wears a fitted
sage tank and charcoal shorts, no logos. Skin naturally toned, defined.

Shot on full-frame, 85mm prime, f/4. Sharp focus, subtle film grain. The
kettlebells are clearly heavy — visible tension through the forearms and
slight stretch through the shoulders. 4:5 portrait, subject filling 75%
of the frame.
```

### Flux 1.1 Pro Ultra

```
Editorial fitness photograph, photorealistic. Athletic person, mid-30s,
short dark hair, walking forward in pure side profile carrying a heavy
matte-black kettlebell in each hand. Mid-stride: back foot lifting,
front foot planted. Shoulders pulled back and down, traps loaded, core
braced, ribs stacked, eyes forward.

Warm light-grey seamless studio backdrop, matte oak hardwood floor. Key
light camera-left, soft rim light behind. Fitted sage tank, charcoal
shorts, no logos. Visible forearm tension and slight shoulder stretch
showing the weight is real.

85mm prime, f/4, full-frame. Sharp focus, subtle film grain, no motion
blur (mid-stride frozen, not blurred). 4:5 aspect ratio.

Negative: motion blur, light kettlebells, hunched posture, shrugged
shoulders to ears, plastic skin, chrome bells, logos, text, watermark.
```

### Midjourney v7

```
editorial fitness photograph, athletic person mid-30s side profile mid-stride
carrying heavy matte-black kettlebells one in each hand, shoulders rolled
back traps loaded core braced ribs stacked, back foot lifting front foot
planted, warm light-grey seamless backdrop, oak hardwood floor, soft key
light from left, rim light behind, sage tank charcoal shorts no logos,
naturally toned defined skin, 85mm f/4, subtle film grain, sharp focus,
visible forearm tension --ar 4:5 --style raw --v 7 --s 100
```

### Grok Imagine

```
Photorealistic editorial fitness photograph. Athletic person, mid-30s, short
dark hair, walking in pure side profile carrying a heavy matte-black
kettlebell in each hand. Captured mid-stride with back foot just leaving the
floor. Shoulders pulled back and down, posture tall, core braced. Warm
light-grey seamless studio backdrop, oak hardwood floor, soft directional
lighting. Sage tank, charcoal shorts, no logos. 4:5 portrait, sharp focus.
```

---

## 3. Turkish Get-Up

**Canonical frame:** The half-kneeling "windmill" position — the most iconic moment in the sequence. Subject is on their right knee, left foot planted forward and flat, left arm locked straight overhead holding a kettlebell directly over the shoulder, right hand on the floor, torso rotated open, eyes locked on the bell overhead. This is the frame that screams "Turkish Get-Up" and nothing else.

### Nano Banana

```
A photorealistic editorial fitness photograph. An athletic adult in their
mid-30s with short dark hair holds the half-kneeling windmill position of a
Turkish Get-Up. Right knee on the floor with shin trailing behind, left foot
planted flat in front, left arm locked completely straight overhead with
elbow stacked over shoulder over hip, holding a matte-black kettlebell that
sits balanced on the back of the wrist. Right hand light on the floor for
support, torso rotated open toward the camera, eyes locked on the kettlebell
overhead.

Three-quarter front view from camera-right, slightly low angle so the
overhead arm reads strong against the backdrop. Studio: warm light-grey
seamless backdrop, matte oak hardwood floor. Key light from camera-left at
45°, fill from camera-right, hair-light behind. Subject wears a fitted
charcoal tank and dusty navy shorts, no logos. Naturally toned skin, defined
shoulder and core musculature visible.

Shot on full-frame, 85mm prime, f/4. Sharp focus on the subject. The
kettlebell is clearly heavy and stable, the locked overhead arm shows real
tension through the lat and tricep. 4:5 portrait.
```

### Flux 1.1 Pro Ultra

```
Editorial fitness photograph, photorealistic. Athletic person, mid-30s,
short dark hair, in the half-kneeling windmill position of a Turkish Get-Up:
right knee on floor, shin trailing back, left foot planted flat forward,
left arm locked straight overhead, elbow stacked over shoulder over hip,
holding a matte-black kettlebell balanced on the back of the wrist. Right
hand light on the floor for support. Torso rotated open, eyes up on the
bell.

Three-quarter front from camera-right, slightly low angle. Warm light-grey
seamless backdrop, matte oak hardwood floor. Key light camera-left 45°, fill
camera-right, hair-light behind. Fitted charcoal tank, dusty navy shorts, no
logos. Defined shoulder and core, naturally toned.

85mm prime, f/4, full-frame. Sharp focus, subtle film grain. Locked overhead
arm shows real tricep and lat tension. 4:5 aspect.

Negative: bent overhead elbow, kettlebell tilting off wrist, flat torso,
hunched shoulders, motion blur, plastic skin, chrome bell, logos, text,
watermark, both knees on floor.
```

### Midjourney v7

```
editorial fitness photograph, athletic person mid-30s in half-kneeling
windmill of Turkish Get-Up, right knee down shin trailing, left foot planted
flat forward, left arm locked straight overhead holding matte-black
kettlebell on back of wrist, right hand on floor for support, torso rotated
open eyes locked on bell, three-quarter view from right slightly low angle,
warm light-grey seamless backdrop, oak hardwood floor, soft key light from
left 45°, fitted charcoal tank dusty navy shorts no logos, defined shoulder
and core, 85mm f/4, sharp focus, subtle film grain --ar 4:5 --style raw
--v 7 --s 100
```

### Grok Imagine

```
Photorealistic editorial fitness photograph. Athletic person, mid-30s, short
dark hair, in the half-kneeling windmill position of a Turkish Get-Up. Right
knee on the floor, left foot planted flat in front, left arm locked
completely straight overhead holding a matte-black kettlebell, right hand
lightly on the floor for support. Torso rotated open, eyes up on the bell.
Three-quarter view from the right, slight low angle. Warm light-grey
seamless backdrop, oak hardwood floor, soft directional studio lighting.
Charcoal tank, dusty navy shorts, no logos. 4:5 portrait, sharp focus.
```

---

## 4. Crow Pose (Bakasana)

**Canonical frame:** Both feet fully off the floor, hands flat shoulder-width apart on the mat, elbows softly bent at roughly 90°, knees pinned high on the back of the upper arms (just below the armpit, not on the elbows), hips lifted, gaze forward and slightly down at a fixed point past the hands. The toes are pointed and lifted *together*. This is the held shape, not the wobble of finding it.

### Nano Banana

```
A photorealistic editorial fitness photograph. An athletic adult in their
mid-30s with short dark hair holds Crow Pose (Bakasana). Both hands flat on
a thin charcoal yoga mat, shoulder-width apart, fingers spread wide. Elbows
softly bent at about 90°. Knees pinned high on the backs of the upper arms,
just below the armpits. Both feet are fully lifted off the floor and pointed
together, hips high. Gaze forward and slightly down at a fixed point just
past the fingertips. Calm, focused expression — the pose is held, stable,
not wobbling.

Three-quarter front view from camera-left, low angle so the airborne feet
read clearly against the backdrop. Studio: warm light-grey seamless
backdrop, matte oak hardwood floor under the mat. Soft broad key light from
camera-left at 45°, subtle fill from camera-right. Subject wears fitted
sage cropped top and charcoal leggings, no logos. Naturally toned skin,
visible shoulder and core engagement.

Shot on full-frame, 85mm prime, f/4. Sharp focus on the subject, subtle
film grain. 4:5 portrait. Anatomy must be correct: knees on triceps not
elbows, wrists straight under shoulders, no collapse through the upper back.
```

### Flux 1.1 Pro Ultra

```
Editorial fitness photograph, photorealistic. Athletic person, mid-30s,
short dark hair, holding Crow Pose (Bakasana) on a thin charcoal yoga mat.
Hands flat shoulder-width apart on the mat, fingers spread wide, elbows
softly bent ~90°. Knees pinned high on the backs of the upper arms (on the
triceps, not the elbows), hips lifted, both feet fully off the floor and
pointed together. Gaze forward and slightly down past the hands. Calm,
focused, stable.

Three-quarter front view from camera-left, low angle so the lifted feet
read against the backdrop. Warm light-grey seamless studio backdrop, matte
oak hardwood floor. Key light camera-left 45°, soft fill camera-right.
Fitted sage cropped top, charcoal leggings, no logos. Visible shoulder and
core engagement, naturally toned.

85mm prime, f/4, full-frame. Sharp focus, subtle film grain. 4:5 aspect.

Negative: feet on floor, knees on elbows (must be on triceps), bent wrists,
collapsed upper back, head dropped, motion blur, plastic skin, logos, text,
watermark, anatomical distortion.
```

### Midjourney v7

```
editorial fitness photograph, athletic person mid-30s holding Crow Pose
Bakasana on charcoal yoga mat, hands flat shoulder-width apart fingers
spread, elbows softly bent 90°, knees pinned high on backs of upper arms on
triceps, both feet lifted together pointed, hips high, calm focused gaze
forward and down past hands, three-quarter view from left low angle, warm
light-grey seamless backdrop, oak hardwood floor, soft key light from left
45°, fitted sage cropped top charcoal leggings no logos, defined shoulder
and core, 85mm f/4, sharp focus, subtle film grain --ar 4:5 --style raw
--v 7 --s 100
```

### Grok Imagine

```
Photorealistic editorial fitness photograph. Athletic person, mid-30s, short
dark hair, holding Crow Pose (Bakasana). Hands flat on a charcoal yoga mat
shoulder-width apart, fingers spread, elbows softly bent. Knees resting high
on the backs of the upper arms, both feet lifted off the ground and pointed
together, hips high. Calm focused gaze forward. Three-quarter view from the
left, low angle. Warm light-grey seamless backdrop, oak hardwood floor, soft
directional studio lighting. Sage cropped top, charcoal leggings, no logos.
4:5 portrait, sharp focus.
```

---

## 5. Savasana

**Canonical frame:** Lying flat on the back on a thin yoga mat, feet falling open naturally, arms by the sides ~6 inches from the body with palms facing up, eyes closed, face soft. The trick: shot from a *high three-quarter angle from the head end*, so the line of the body recedes into the frame. Lighting is slightly cooler and softer than the other four — this is rest, not effort.

### Nano Banana

```
A photorealistic editorial fitness photograph. An athletic adult in their
mid-30s with short dark hair lies in Savasana on a thin charcoal yoga mat.
Flat on the back, feet falling open naturally, arms by the sides about six
inches from the body with palms facing up, fingers softly curled, eyes
closed, face completely relaxed. Mouth softly closed, jaw unclenched. The
body is still, weighted, surrendered.

Camera positioned high and angled down from the head end of the mat at a
three-quarter angle, so the line of the body recedes into the frame and the
top of the head is closest to the camera. Studio: warm light-grey seamless
backdrop, matte oak hardwood floor visible at the edges of the mat.

Lighting is intentionally softer and slightly cooler than active fitness
shots — broad diffused overhead light, very gentle shadow, restful and
contemplative mood, never clinical. Subject wears a fitted oat long-sleeve
and dusty navy leggings, no logos.

Shot on full-frame, 85mm prime, f/4. Sharp focus on the face, subtle film
grain. 4:5 portrait. The image should feel quiet.
```

### Flux 1.1 Pro Ultra

```
Editorial fitness photograph, photorealistic, contemplative mood. Athletic
person, mid-30s, short dark hair, lying in Savasana on a thin charcoal yoga
mat. Flat on the back, feet falling open naturally, arms by the sides about
six inches from the body, palms up, fingers softly curled, eyes closed, face
fully relaxed, jaw soft.

Camera high and angled down from the head end of the mat, three-quarter
angle, so the body recedes into the frame and the crown of the head is
nearest the lens. Warm light-grey seamless backdrop, matte oak hardwood
floor at the mat edges.

Lighting softer and slightly cooler than active shots: broad diffused
overhead, gentle shadow, restful. Fitted oat long-sleeve, dusty navy
leggings, no logos.

85mm prime, f/4, full-frame. Sharp focus on face, subtle film grain. Quiet,
still, intentional. 4:5 aspect.

Negative: tense face, clenched jaw, harsh shadows, dramatic lighting, hands
on belly or chest (arms must be by sides palms up), motion blur, plastic
skin, logos, text, watermark, eyes open.
```

### Midjourney v7

```
editorial fitness photograph contemplative quiet mood, athletic person
mid-30s lying in Savasana on charcoal yoga mat, flat on back feet falling
open naturally arms by sides six inches from body palms up fingers softly
curled eyes closed face relaxed jaw soft, camera high angled down from head
end three-quarter angle body receding crown nearest lens, warm light-grey
seamless backdrop oak hardwood floor at mat edges, soft diffused cooler
overhead light gentle shadow restful, fitted oat long-sleeve dusty navy
leggings no logos, 85mm f/4 sharp focus on face subtle film grain --ar 4:5
--style raw --v 7 --s 150
```

### Grok Imagine

```
Photorealistic editorial fitness photograph, quiet contemplative mood.
Athletic person, mid-30s, short dark hair, lying in Savasana on a charcoal
yoga mat. Flat on the back, feet falling open, arms by the sides palms up,
eyes closed, face fully relaxed. Camera high and angled down from the head
end at a three-quarter angle so the body recedes into the frame. Warm
light-grey seamless backdrop, oak hardwood floor. Soft diffused overhead
lighting, slightly cooler than active fitness shots. Oat long-sleeve, dusty
navy leggings, no logos. 4:5 portrait, sharp focus on the face.
```

---

# How to judge the bake-off

Score each model 1–5 on these axes. Don't average — look at the worst score, since a single broken axis kills the image for production use.

| Axis | What to check |
|---|---|
| **Anatomy** | Knee tracking, shin angle, elbow lock, spine neutrality. A pretty image with wrong form is unusable. |
| **Pose readability** | Can a stranger glance at the image and name the exercise within 1 second? |
| **Style consistency across 5** | Do the five images look like they came from the same shoot? Same lighting, same backdrop, same subject? This is what matters at 150-image scale. |
| **Photorealism** | Skin, fabric, equipment — does anything say "AI"? Common tells: too-perfect symmetry, plastic skin, chrome on what should be matte cast iron. |
| **Wow factor** | Would you want to look at this image every day in your workout app? |

The model that wins **anatomy** *and* **style consistency** is the one to pick — not the one that wins wow factor. You can re-roll a flat image; you can't re-roll a fundamentally inconsistent set without redoing all 150.

# Suggested running order

1. **Nano Banana first** (cheapest, scriptable). If it nails 4 of 5, that's your workhorse — done.
2. **Flux 1.1 Pro Ultra** for any Nano Banana misses.
3. **Midjourney v7** as a polish/hero option for the splash screen and category headers.
4. **Grok Imagine** mainly to confirm it's not a sleeper. If it surprises you, reconsider — but it likely won't lead.

Run all four on the same five prompts in a single afternoon. The winner will be obvious before you finish judging.

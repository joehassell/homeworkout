# Voice-Over Plan — Hybrid AI + Native TTS

**Status:** Plan complete, awaiting execution
**Date:** 2026-04-30
**Owner:** Joe Hassell

---

## TL;DR

Pre-record yoga narration with AI voices (Grok / Artlist ElevenLabs) for the calming yoga-teacher experience. Use native iOS `AVSpeechSynthesizer` (Siri voices) for fitness coaching. Free users get Siri TTS, Pro users get the premium AI audio.

---

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                     Voice Router                      │
│                                                       │
│  Is yoga narration?  ──yes──>  Has pre-recorded file? │
│                                    │                  │
│                              yes (Pro)   no (Free)    │
│                                │            │         │
│                           Play .m4a    Siri TTS       │
│                                                       │
│  Is fitness coaching? ──yes──>  Native iOS?           │
│                                    │                  │
│                              yes         no (PWA)     │
│                                │            │         │
│                           Siri TTS    Web Speech API  │
└──────────────────────────────────────────────────────┘
```

---

## Audio Inventory

### Yoga Narration (Pre-recorded AI voice)

| Category | Count | Notes |
|----------|-------|-------|
| Pose narration cues | 221 | 4-8 per pose, spoken during holds |
| Transition-in cues | 46 | Spoken when entering each pose |
| Centering narration | 6 | Opening breath sequence |
| Centering transition | 1 | "Come to a comfortable seat..." |
| Savasana narration | 8 | Extended final relaxation |
| Sun salutation names | 6 | Pose names called during flow |
| **Total yoga audio files** | **288** | |

**Estimated file size:** 288 files × ~8 sec avg × 64kbps AAC = ~18MB total

### Fitness Coaching (Native Siri TTS — no files needed)

| Cue Type | Example | Dynamic? |
|----------|---------|----------|
| Exercise name announcement | "Goblet Squat" | Yes (190+ exercises) |
| Side switch | "Switch to left side" | No |
| Rest announcement | "Rest. Next up: Push-Ups" | Yes |
| Warm-up done | "Warm-up done. Get ready." | No |
| Countdown 3-2-1 | "3", "2", "1" | No |
| HR zone coaching | "Push a little harder to stay in zone 3" | Semi-dynamic |
| Workout complete | "Workout complete. Great job." | No |

These use dynamic text (exercise names, zone numbers), so pre-recording isn't practical. Siri TTS handles these well.

---

## Voice Generation — Primary: Grok

### Voice Selection

Use Grok's voice generation API to produce the yoga narration audio. Target voice characteristics:

- **Gender:** Female
- **Tone:** Warm, calm, nurturing
- **Pace:** Slow (~100-120 WPM, slower than conversational)
- **Quality:** Slightly breathy, gentle inflection
- **Style:** Yoga teacher giving a guided class — not reading from a script, but guiding with presence

### Generation Process

1. **Export narration manifest** — Run the generation script to produce a JSON file with every text cue, pose name, and output filename:

```bash
node scripts/generate-voice-manifest.js
# Outputs: scripts/output/yoga-voice-manifest.json
```

2. **Generate via Grok API** — Use the manifest to batch-generate all 288 audio files:

```bash
# Pseudocode — adapt to Grok's actual API
for each entry in manifest:
    POST /v1/audio/speech
    body: { text: entry.text, voice: "calm-female", speed: 0.85 }
    save response to: audio/yoga/{entry.filename}
```

3. **Review and re-generate** — Listen to a sample of 10-15 files. Adjust voice parameters if needed. Re-generate any that don't sound right.

4. **Convert to AAC** — If Grok outputs MP3 or WAV, convert to AAC for iOS:

```bash
for f in audio/yoga/*.mp3; do
    ffmpeg -i "$f" -c:a aac -b:a 64k "${f%.mp3}.m4a"
done
```

### File Naming Convention

```
audio/yoga/
├── centering_transition.m4a
├── centering_01.m4a
├── centering_02.m4a
├── ...
├── warrior-i_transition.m4a
├── warrior-i_01.m4a
├── warrior-i_02.m4a
├── ...
├── savasana_transition.m4a
├── savasana_01.m4a
├── savasana_02.m4a
├── ...
├── mountain-pose_transition.m4a
├── mountain-pose_01.m4a
├── ...
```

Slug format: lowercase, hyphens, from pose name. E.g., "Warrior I" → `warrior-i`, "Downward-Facing Dog" → `downward-facing-dog`.

---

## Voice Generation — Secondary: Artlist.io

### When to Use

- If Grok credits run out or the voice quality isn't right for yoga
- Artlist.io → Toolkit → Voice-Over Generator → Text-to-Speech
- Uses ElevenLabs under the hood

### Artlist Settings

| Parameter | Value |
|-----------|-------|
| **URL** | https://toolkit.artlist.io/voice-over-generator?mode=text-to-speech&voiceID=32&modelGroupID=206&language=English |
| **Voice** | ID 32 (pre-selected warm female) |
| **Model Group** | 206 |
| **Language** | English |
| **Speed** | Slow (adjust slider to ~0.8x) |

### Manual Process (if API isn't available)

1. Open the Artlist voice-over generator URL
2. Paste each narration cue text
3. Generate and download the audio file
4. Rename to match the file naming convention
5. Batch process — do all 288 files, or as many as credits allow

### Credit Management

- Artlist/ElevenLabs credits may be limited
- **Priority order for generation:**
  1. Savasana (8 cues + transition) — most impactful, longest hold
  2. Centering (6 cues + transition) — sets the tone for every session
  3. Standing poses narration (55 cues) — most commonly used
  4. Floor poses narration (55 cues)
  5. Seated poses narration (30 cues)
  6. Balance poses narration (25 cues)
  7. Transitions/flow (22 cues)
  8. Core poses (10 cues)
  9. Inversions (15 cues)
  10. All transition_in texts (46) — lower priority, shorter clips

If credits run out partway through, the system falls back to Siri TTS for any missing files — so partial coverage is fine.

---

## Native iOS Speech Plugin

### New Plugin: `SpeechPlugin.swift`

Replace Web Speech API with `AVSpeechSynthesizer` on iOS for better voice quality.

```swift
// Methods:
speak(text, rate, pitch, voiceId)  // speak with specified voice
stop()                              // cancel current speech
getVoices()                         // list available Siri voices
```

### Voice Selection for Fitness Coaching

| Locale | Voice | Identifier |
|--------|-------|------------|
| en-US | Samantha (Premium) | `com.apple.voice.premium.en-US.Samantha` |
| en-GB | Kate (Premium) | `com.apple.voice.premium.en-GB.Kate` |
| en-AU | Karen (Premium) | `com.apple.voice.premium.en-AU.Karen` |
| en-NZ | — | Falls back to en-AU or en-US |

Premium voices are significantly better than the defaults. The app should prefer `premium` voices, fall back to `enhanced`, then `compact`.

### Speech Parameters

| Context | Rate | Pitch | Notes |
|---------|------|-------|-------|
| Exercise name | 0.50 | 1.0 | Clear, medium pace |
| Rest announcement | 0.48 | 1.0 | Slightly slower, calm |
| Countdown 3-2-1 | 0.45 | 1.05 | Deliberate, slightly higher |
| HR zone coaching | 0.50 | 0.95 | Calm, encouraging |
| Side switch | 0.50 | 1.0 | Clear instruction |

Note: `AVSpeechSynthesizer` rate 0.50 ≈ normal speaking pace. Range is 0.0 (slowest) to 1.0 (fastest). Web Speech API rate 1.0 ≈ normal, so they're on different scales.

---

## JS Integration

### Voice Router Logic

```javascript
// In speak():
function speak(text) {
    if (!voiceEnabled) return;
    if (isNative() && window.Capacitor.Plugins.SpeechPlugin) {
        // Use native AVSpeechSynthesizer
        window.Capacitor.Plugins.SpeechPlugin.speak({
            text: text, rate: 0.50, pitch: 1.0
        });
    } else {
        // Web Speech API fallback
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.rate = 0.95; u.pitch = 1; u.volume = 1;
        speechSynthesis.speak(u);
    }
}

// In speakYoga():
function speakYoga(text, poseSlug, cueIndex) {
    if (!voiceEnabled) return;
    // Try pre-recorded audio first (Pro only)
    if (Entitlement.isPro() && poseSlug) {
        const suffix = cueIndex !== undefined ? '_' + String(cueIndex + 1).padStart(2, '0') : '_transition';
        const src = 'audio/yoga/' + poseSlug + suffix + '.m4a';
        const audio = new Audio(src);
        audio.play().catch(() => {
            // File doesn't exist — fall back to TTS
            speakYogaTTS(text);
        });
        return;
    }
    speakYogaTTS(text);
}

function speakYogaTTS(text) {
    if (isNative() && window.Capacitor.Plugins.SpeechPlugin) {
        const style = window.yoga && window.yoga.YOGA_STYLES[config.yogaStyle];
        window.Capacitor.Plugins.SpeechPlugin.speak({
            text: text, rate: 0.38, pitch: 0.9 // calmer for yoga
        });
    } else {
        const u = new SpeechSynthesisUtterance(text);
        const style = window.yoga && window.yoga.YOGA_STYLES[config.yogaStyle];
        u.rate = style ? style.speechRate : 0.75;
        u.pitch = 0.95; u.volume = 1;
        speechSynthesis.speak(u);
    }
}
```

### Pose Slug Helper

Each yoga pose needs a slug for audio file lookup. Add to yoga.js or compute on the fly:

```javascript
function poseSlug(name) {
    return name.toLowerCase()
        .replace(/['']/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}
// "Warrior I" → "warrior-i"
// "Downward-Facing Dog" → "downward-facing-dog"
// "Child's Pose" → "childs-pose"
```

---

## Generation Script

### `scripts/generate-voice-manifest.js`

Reads `js/yoga.js`, extracts all narration text, and outputs a manifest for batch audio generation.

**Output format** (`scripts/output/yoga-voice-manifest.json`):

```json
[
    {
        "pose": "Centering Breath",
        "slug": "centering",
        "type": "transition",
        "index": null,
        "filename": "centering_transition.m4a",
        "text": "Come to a comfortable seat, close your eyes, and begin to breathe..."
    },
    {
        "pose": "Centering Breath",
        "slug": "centering",
        "type": "narration",
        "index": 0,
        "filename": "centering_01.m4a",
        "text": "Find a comfortable seated position, close your eyes..."
    },
    ...
]
```

Also output as CSV for easy pasting into Artlist's web UI:

```csv
filename,text
centering_transition.m4a,"Come to a comfortable seat, close your eyes, and begin to breathe..."
centering_01.m4a,"Find a comfortable seated position, close your eyes..."
...
```

---

## Tier Gating

| Feature | Free | Pro |
|---------|------|-----|
| Yoga narration text | Same content | Same content |
| Yoga voice quality | Siri TTS (AVSpeechSynthesizer / Web Speech API) | Pre-recorded AI voice (warm, breathy, yoga-teacher style) |
| Fitness coaching | Siri TTS | Siri TTS (same — dynamic text) |
| Voice on/off toggle | Yes | Yes |

The gate is simple: `Entitlement.isPro()` before attempting to load the `.m4a` file. If not Pro or file missing, fall back to TTS.

---

## Implementation Order

| Step | What | Effort | Depends On |
|------|------|--------|------------|
| 1 | Write `scripts/generate-voice-manifest.js` | 30 min | — |
| 2 | Build `SpeechPlugin.swift` + `.m` (native Siri TTS) | 45 min | — |
| 3 | Wire `speak()` and `speakYoga()` to use native plugin | 30 min | Step 2 |
| 4 | Update `speakYoga()` to try pre-recorded audio first | 30 min | Step 3 |
| 5 | Generate audio via Grok (primary) | 1-2 hours | Step 1 |
| 6 | Generate remaining via Artlist (secondary) | 1-2 hours | Step 1 |
| 7 | Add `audio/yoga/` to build pipeline | 15 min | Steps 5-6 |
| 8 | Test end-to-end: Pro gets AI voice, Free gets Siri | 30 min | All |

**Steps 1-4 are code changes (do first). Steps 5-6 are audio generation (can run in parallel or after).**

---

## Decisions Made

1. **Grok API access** — Yes, API access available. Use batch generation from manifest.
2. **Voice gender** — Both female and male voices. User selects in Settings. Files stored in `audio/yoga/female/` and `audio/yoga/male/`. Doubles the audio count to ~580 files (~36MB total).
3. **Multilingual** — English only for v1.
4. **Audio delivery** — Bundled in the app. Both male and female voice packs ship with the binary (~36MB). Pro users get them always; free users get them occasionally as a conversion hook (tasting mechanic).
5. **Singing bowl chime** — Yes, replace synthesized oscillator with a real recorded singing bowl sample.

---

## File Checklist

```
homeworkout/
├── scripts/
│   └── generate-voice-manifest.js        [NEW] manifest generator
├── audio/
│   └── yoga/                              [NEW] 288 .m4a files
├── ios/App/App/Plugins/
│   ├── SpeechPlugin.swift                 [NEW] AVSpeechSynthesizer bridge
│   └── SpeechPlugin.m                     [NEW] Capacitor registration
├── js/
│   └── (inline in index.html)             [MODIFY] speak/speakYoga routing
├── index.html                             [MODIFY] voice router integration
├── package.json                           [MODIFY] add audio/ to build:web
└── docs/
    └── VOICE_OVER_PLAN.md                 [THIS FILE]
```

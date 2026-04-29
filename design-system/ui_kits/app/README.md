# SimpleWorkoutGen — App UI kit

Click-through prototype mocking the **iOS web-app surface** of SimpleWorkoutGen. Pixel-aimed at the live `index.html` in the codebase — same class names, same token set, same screen flow.

## Files

| File | What it is |
|---|---|
| `index.html` | Stage + iPhone-sized device frame, mounts `<App />`. Open this. |
| `styles.css` | Lifted from the source `index.html` `:root` and component CSS (imports `colors_and_type.css`). |
| `SetupScreen.jsx` | Workout Builder — type / duration / intensity / sets / focus pills. |
| `PreviewScreen.jsx` | Generated session — sectioned exercise list with badges. |
| `TimerScreen.jsx` | Guided countdown with phase tinting, fake heart-rate, pause/skip/prev. |
| `DoneScreen.jsx` | Completion — stats, RPE 1–10 selector, optional note. |
| `HistoryScreen.jsx` | Stat strip + 16-week heatmap + recent rows. |
| `SettingsScreen.jsx` | 5-theme swatches + voice / audio / Health toggles. The theme switcher actually changes the active theme on the prototype. |
| `BottomNav.jsx` | 3-tab persistent nav (Build · History · Settings). |

## Coverage

What's faithful:
- All five themes wired through `data-theme="..."` from settings.
- Pill / focus-pill / RPE / button / nav primitives match the source exactly.
- Timer phase backgrounds (`--work-bg`, `--rest-bg`), final-3 bloom, tabular-nums countdown.
- Section badges, set headers, exercise list cards.

What's omitted on purpose:
- Real workout generator (uses canned exercises).
- Voice cues, audio beeps, haptics (audio-only behaviors).
- Apple Watch + Health integration (native, can't mock).
- Yoga flow (separate large surface — not represented).
- Music mini-player bar.
- Library, plate calculator, 1RM modal.

These are recreations, not production code — generators and persistence are stubbed.

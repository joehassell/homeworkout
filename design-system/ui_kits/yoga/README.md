# SimpleWorkoutGen — Yoga UI kit

A second mode in the same app. The **design ethos doesn't flip** — same dark surface, same accent, same type system, same components. Two subtle cues set yoga apart:

1. **Sanskrit subtitle pattern** — every pose carries an italic, dimmed Sanskrit name beside its English label (`.sanskrit-name { font-style: italic; color: var(--text-dim); font-size: 0.85em; }`, lifted from the source).
2. **Breathing-orb timer** — instead of a tabular numeric display dominating the screen, a soft circular orb gently scales in/out on a slow breath cadence (1.6s ease), with the countdown number nested inside. The phase-rest blue tint becomes a radial gradient. Same tokens, gentler rhythm.

Everything else — pills, buttons, progress bar, prev/skip controls, the bottom-nav-less full-screen flow view — is identical to the workout timer. The codebase confirms this: yoga lives in `js/yoga.js` and reuses the same screen container.

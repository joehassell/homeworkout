# Apple Watch surface

Four watch faces / states for SimpleWorkoutGen's watchOS companion. Built as static HTML — the real watch app is SwiftUI (in `ios/App/HomeWorkoutWatch/` in the codebase).

- **Idle** — paired but no workout running; shows the app icon and a quiet prompt.
- **Active · Work** — phase-tinted green wash, exercise name, tabular countdown, live HR, pause + skip.
- **Active · Rest** — phase-tinted blue wash, "Up next" preview, same controls.
- **Modular ring** — workout-in-progress complication concept; 270° accent ring with minutes/type at center.

The watch design uses the **same token set** as the phone — same accent, same green/blue phase wash, same tabular-nums countdown, same `0.62rem` letter-spaced uppercased eyebrow. Just smaller and sparser.

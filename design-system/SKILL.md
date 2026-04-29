---
name: simpleworkoutgen-design
description: Use this skill to generate well-branded interfaces and assets for SimpleWorkoutGen (a home-workout builder & timer app, part of the nomaen family), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files (`colors_and_type.css`, `assets/`, `preview/*`, `ui_kits/app/*`).

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **Brand:** SimpleWorkoutGen — a home-workout builder & timer for iOS / watchOS / web. Part of the **nomaen** family (`com.nomaen.homeworkout`). Plainspoken, mechanical, no marketing fluff, no emoji, no gradients, no stock imagery.
- **Default theme:** Dark (`#0a0a0f` bg, `#4f8cff` accent). Five themes total — Dark, Midnight, Forest, High Contrast, Light.
- **Type:** System sans only (`-apple-system, SF Pro Display, …`). Display weight 200 for the giant timer, 600–700 for UI, tabular-nums on every numeric readout.
- **Voice:** UK/NZ spelling ("Personalisation", "favourited"). Imperatives. Short. Numerals not words.
- **Iconography:** Inline SVGs + Unicode in the source. Substitute Lucide (1.5px stroke) for new work and flag.
- **Imagery:** None in-app. Only the lightning-bolt app icon.

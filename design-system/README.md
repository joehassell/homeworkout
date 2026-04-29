# SimpleWorkoutGen — Design System

Tokens, components and surfaces for [SimpleWorkoutGen](https://github.com/) — the dark-by-default workout generator + tracker. This repo is **the source of truth for visual design** across the iOS app, watch app, and the embedded web build.

## What's in here

| Folder | Purpose |
| --- | --- |
| `colors_and_type.css` | **The token file.** All five themes (Dark, Midnight, Forest, High Contrast, Light) + type scale + spacing. This is what your app should consume. |
| `preview/` | Browsable preview cards — type scale, color palette, spacing, components, iconography, accessibility. Open `index.html` for the directory. |
| `ui_kits/app/` | Mobile UI kit — interactive React recreation of core screens. |
| `ui_kits/yoga/` | Yoga mode — same ethos, gentler timer + Sanskrit subtitles. |
| `ui_kits/watch/` | Apple Watch surfaces — idle, work, rest, modular-ring complication. |
| `assets/` | App icon, logos, glyphs. |
| `SKILL.md` | Designer-facing brief on how to use the system. |
| `scripts/` | One-shot install scripts (see below). |

## Browse online

Once pushed and GitHub Pages enabled, the preview site lives at `https://<you>.github.io/<repo>/`.

## Use it in your app

Two consumption modes:

### 1. Pull tokens into your app code (recommended)
```bash
# From your app repo (e.g. homeworkout/), one-time:
curl -O https://raw.githubusercontent.com/<you>/<repo>/main/colors_and_type.css
mv colors_and_type.css css/tokens.css
```
Then in `index.html`, replace the inline `:root { ... }` block with:
```html
<link rel="stylesheet" href="css/tokens.css">
```

### 2. Reference visually
For SwiftUI / native targets, open the preview cards and port values by hand.

## Theming

Switch theme by setting `data-theme` on `<html>`:
```html
<html data-theme="hc">     <!-- High Contrast -->
<html data-theme="midnight">
<html data-theme="forest">
<html data-theme="light">
<html>                      <!-- Default: Dark -->
```

## License

MIT. See `LICENSE`.

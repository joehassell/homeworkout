# Design System Reference

## Where it lives

- **Tokens**: `css/tokens.css` -- single source of truth for all design tokens
- **Components**: `css/styles.css` -- imports tokens.css, all component styles
- Tokens are CSS custom properties on `:root`; never hardcode values that tokens cover

## Theme switching

Set `data-theme` on the root element. Five themes ship: **dark** (default), **midnight**, **forest**, **high-contrast**, **light**. Dark-first: the base `:root` block is the dark theme; others override via `[data-theme="..."]`.

## Spacing scale

| Token | Value |
|-------|-------|
| `--sp-1` | 4px |
| `--sp-2` | 6px |
| `--sp-3` | 8px |
| `--sp-4` | 10px |
| `--sp-5` | 12px |
| `--sp-6` | 14px |
| `--sp-7` | 16px |
| `--sp-8` | 20px |
| `--sp-9` | 24px |
| `--sp-10` | 28px |
| `--sp-12` | 32px |

## Radius scale

| Token | Value | Use |
|-------|-------|-----|
| `--r-sm` | 6px | Small chips, badges |
| `--r-md` | 8px | Buttons, inputs |
| `--r-lg` | 10px | Cards, list items |
| `--r-xl` | 12px | Large cards |
| `--r-2xl` | 14px | Modals |
| `--r-3xl` | 16px | Sheets |
| `--r-pill` | 999px | Pill shapes, toggles |

## Motion

| Token | Value | Use |
|-------|-------|-----|
| `--t-quick` | 0.15s ease | Buttons, taps, micro-interactions |
| `--t-base` | 0.2s ease | Card transitions, hover states |
| `--t-slow` | 0.4s ease | Background washes, screen transitions |

## Typography

Font stack: `--font-sans` (system SF Pro / Segoe UI). Monospace: `--font-mono`.

| Token | Size | Use |
|-------|------|-----|
| `--fs-display` | 2.5rem | Done screen heading |
| `--fs-h1` | 2rem | Setup header |
| `--fs-h2` | 1.6rem | Screen headers |
| `--fs-h3` | 1.2rem | Section headings |
| `--fs-body` | 1rem | Body text |
| `--fs-small` | 0.85rem | Secondary text |
| `--fs-xs` | 0.75rem | Captions |
| `--fs-eyebrow` | 0.7rem | Uppercased section labels |
| `--fs-timer` | 8rem | Countdown display |
| `--fs-timer-final` | 11rem | Final 3-second bloom |

Letter-spacing: `--tracking-eyebrow` (0.06em), `--tracking-tight` (-0.02em), `--tracking-display` (-0.03em).

User-tunable font scale via `--font-scale` (0.875 / 1 / 1.125 / 1.25 / 1.5).

## Icons

Lucide icons at **22px** size, **1.6px** stroke width. Applied via `.bottom-nav .nav-item svg { stroke-width: 1.6; }`. Keep all icons consistent with this spec.

## Color system

Each theme defines: `--bg`, `--surface`, `--surface2`, `--border`, `--text`, `--text-dim`, `--accent` + glow/soft variants, semantic colors (`--green`, `--red`, `--orange`, `--yellow` + soft variants), timer phase backgrounds (`--work-bg`, `--rest-bg`), heatmap levels (`--hm-1` through `--hm-4`), and focus-pill states (`--include`, `--increase`, `--exclude`).

## Adding a new component

1. Define styles in `css/styles.css` (never in tokens.css)
2. Use token variables for all spacing, radii, colors, motion, and type sizes
3. Follow existing naming: `.component-name`, `.component-name-part`
4. Use `touch-action: manipulation` on all interactive elements
5. Use `var(--t-quick)` for button/tap transitions, `var(--t-base)` for cards
6. Use `var(--r-lg)` or `var(--r-xl)` for card border-radius
7. Test across all five themes -- especially light and high-contrast

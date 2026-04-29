# SimpleWorkoutGen — Pricing & Monetization Handoff

**Status:** Strategy locked, awaiting implementation
**Owner:** Joe Hassell
**Repo:** github.com/joehassell/homeworkout
**Bundle ID:** com.nomaen.homeworkout
**Target:** iOS 15+ / watchOS 10+
**Last updated:** 2026-04-29

---

## 1. TL;DR for the implementing agent

Build a two-tier paywall (Free + Pro) with a one-time lifetime upgrade option, using Apple StoreKit 2 and a single-product subscription group. The PWA at `joehassell.github.io/homeworkout` stays free forever — it's the top of the funnel. iOS-only features (Apple Watch, Live Activities, HealthKit two-way, themes, full history) are the paywall.

**Three SKUs total:**

1. `pro_monthly` — auto-renewing, NZ$5.99 / US$3.49
2. `pro_yearly` — auto-renewing, NZ$29 / US$17.99 (with 7-day free trial)
3. `pro_lifetime` — non-consumable IAP, NZ$59 / US$34.99 (Founders tier NZ$39 / US$22.99 for first 1,000)

Annual is the hero. Monthly exists to make annual look cheap. Lifetime is the conversion machine and front-loads cash.

---

## 2. Strategy summary

### Positioning

SimpleWorkoutGen is a **smart workout generator with native Apple ecosystem integration** — not a logger (Strong, Hevy) and not a content library (Peloton, Apple Fitness+). The pricing reflects this middle ground: more than a logger ($30–45/year comparables), priced below to capture share via "obvious value" perception.

### Comparable apps (pricing benchmarks)

| App | Annual | Lifetime | Notes |
|---|---|---|---|
| Strong | US$30 | US$80 | Pure logger, no generator, no Watch HR app |
| Hevy Pro | US$45 | none | Logger + social, no lifetime option |
| SmartGym | US$30 | US$90 | Closest competitor, Watch app, generator |
| **SimpleWorkoutGen** | **US$18** | **US$35** | Undercuts on price, matches on feature parity |

We are deliberately ~40% cheaper than Strong on annual and ~55% cheaper on lifetime. This positions us as "obvious deal" rather than premium — the right move for a new entrant building install base.

### Why this works

- **Generous free tier creates habit.** Users open the app daily before they convert.
- **Paywall triggers are natural wants, not artificial restrictions.** User buys a kettlebell → equipment unlock. User puts on Apple Watch → Watch unlock.
- **Lifetime tier is sustainable** because the app has zero server costs (no accounts, no cloud sync). Users sense this and trust the offer.
- **Founders tier creates launch urgency** and rewards early adopters with a permanent badge — drives App Store chart momentum in launch week.

---

## 3. Tier specification (build to this exactly)

### Free tier (default state)

Available immediately on install, no auth required.

**Generator:**
- All 4 workout types (Strength, HIIT, Conditioning, Functional)
- All 5 session lengths (15/20/30/45/60 min)
- All 3 intensity levels (Light, Moderate, High)
- 1–4 sets selection
- Focus areas: include/exclude only (no "boost" state)
- Equipment: **Bodyweight + Mat only** (lock the other 7)
- Standard warm-up + cooldown (not session-tailored)
- Single-sided exercise switching (audio + visual)

**Timer:**
- Full countdown timer
- 3-2-1 audio beeps
- Voice cues
- Pause / skip / restart / previous controls
- Fullscreen mode

**History:**
- Last 14 days of session history
- Basic list view (no heatmap, no analytics)

**HealthKit:**
- Workout write to Apple Health (so users see activity rings update)
- MET-based calorie estimate (phone-only, no HR)

**Personalization:**
- 2 themes: Dark + Light only
- Default font size

**No:**
- Apple Watch companion
- Live Activities / Dynamic Island
- HealthKit read (body weight, HR)
- JSON backup/import
- Weight tracking per set
- 3+ themes, font scaling
- Smart session-tailored warm-ups

### Pro tier (paywall unlock)

Everything in Free, plus:

**Generator:**
- All 9 equipment types unlocked (DB, KB, Barbell, Bench, Chin-up Bar, Med Ball, Skipping Rope)
- Focus areas full 3-state cycle (include / **boost** / exclude)
- Smart warm-up tailored to workout type and session length
- Cooldown biased toward muscles loaded in main workout

**Apple Watch:**
- Live exercise name, countdown, phase on watch face
- Heart rate monitoring from watch sensors
- Pause/Resume/Skip from wrist
- Watch haptics (phase changes, countdown, side switches)
- Local countdown fallback when phone disconnects
- HKWorkoutSession with HR-based calories

**Live Activities:**
- Lock screen widget during active workout
- Dynamic Island integration
- ActivityKit phase updates

**HealthKit (full):**
- Read body weight (for accurate calorie math)
- Read heart rate
- Two-way sync with Fitness app

**Tracking:**
- Weight per set (strength workouts)
- Set-level RPE (future)
- PR detection (future, post-launch)

**History & analytics:**
- Unlimited history
- Heatmap calendar view
- Stats: total volume, sessions/week, streak, top exercises
- Past workout detail drill-down

**Personalization:**
- All 5 themes (Dark, Midnight, Forest, High Contrast, Light)
- Font scaling 0.875x – 1.5x (5 steps)

**Data ownership:**
- JSON export (full history + settings)
- JSON import (restore on new device)

### Founders Lifetime tier (launch only)

- Identical to lifetime — same product entitlement
- Different price tier (US$22.99 vs US$34.99)
- Cap at 1,000 redemptions, then auto-disable
- Adds a "Founder" badge in the app's About screen
- Unlocks a "founder@joehassell.com" priority email channel for feature requests (handled by Joe, not a real support team)

---

## 4. App Store Connect setup

### Subscription Group

Create one subscription group: **"SimpleWorkoutGen Pro"**

Both monthly and yearly belong to this group (so Apple handles upgrades/downgrades automatically). Lifetime is a **non-consumable IAP outside the group**.

### Product IDs

Use this exact naming. Don't deviate — these are referenced in code below.

| Product ID | Type | Reference Name | Duration |
|---|---|---|---|
| `com.nomaen.homeworkout.pro.monthly` | Auto-renewable subscription | Pro Monthly | 1 month |
| `com.nomaen.homeworkout.pro.yearly` | Auto-renewable subscription | Pro Yearly | 1 year |
| `com.nomaen.homeworkout.pro.lifetime` | Non-consumable | Pro Lifetime | — |
| `com.nomaen.homeworkout.pro.lifetime.founders` | Non-consumable | Pro Lifetime Founders | — |

### Pricing tiers (set per-territory, do not rely on auto-conversion)

| Territory | Monthly | Yearly | Lifetime | Founders |
|---|---|---|---|---|
| New Zealand | NZ$5.99 | NZ$29.00 | NZ$59.00 | NZ$39.00 |
| United States | US$3.49 | US$17.99 | US$34.99 | US$22.99 |
| Australia | AU$5.49 | AU$26.99 | AU$54.99 | AU$36.99 |
| United Kingdom | £2.99 | £14.99 | £29.99 | £18.99 |
| Eurozone | €3.49 | €17.99 | €34.99 | €22.99 |
| Canada | CA$4.99 | CA$24.99 | CA$49.99 | CA$32.99 |
| Japan | ¥500 | ¥2,800 | ¥5,500 | ¥3,500 |

For all other territories, use Apple's tier-equivalents that round cleanly. Do not let auto-conversion produce numbers like "NZ$42.37".

### Free trial configuration

- **Yearly subscription only** gets a **7-day free trial** introductory offer
- Monthly: no trial (cannibalization risk)
- Lifetime: no trial (doesn't apply)

Configure as an "Introductory Offer → Free Trial → 7 days" eligible to all new subscribers in all territories.

### Promotional offers (post-launch tools)

Create these but don't use them at launch:

- **Win-back offer:** 50% off first year for lapsed annual subscribers (after 30 days lapsed)
- **Trial extension:** 14-day trial for users who downloaded but didn't subscribe (push notification campaign)
- **Founders late entry:** US$22.99 lifetime offered to free users after their 30th workout (auto-trigger)

---

## 5. Implementation requirements

### StoreKit 2 (iOS 15+)

Use StoreKit 2 throughout. Do not use StoreKit 1 — we have iOS 15 minimum so there's no compat reason for it.

### Capacitor bridge

The app is Capacitor-based with the web app in `index.html`. We need:

1. A native Swift plugin: `IAPPlugin.swift` in `ios/App/App/Plugins/`
2. JS-side wrapper in `js/iap.js`
3. Paywall UI in `index.html` (or modal injected from JS)

The IAP plugin should expose these JS methods:

```javascript
// js/iap.js public API
IAP.getProducts() // returns [{id, title, price, priceString, period}]
IAP.purchase(productId) // returns {success, transactionId, productId}
IAP.restore() // returns [{productId, purchaseDate}]
IAP.getEntitlement() // returns {tier: 'free' | 'pro', source: 'monthly'|'yearly'|'lifetime'|null, expiresAt: ISO8601 | null, isFounder: bool}
IAP.observeEntitlement(callback) // subscribes to entitlement changes
```

### Entitlement check

Single source of truth: `IAP.getEntitlement().tier === 'pro'` gates every premium feature. Cache the result in `localStorage` under key `swg.entitlement.v1` for offline access, but always re-validate on app foreground via StoreKit's `Transaction.currentEntitlements`.

**Critical:** Lifetime purchases must work offline forever. Once verified, store the receipt locally and trust it. Re-verify with Apple opportunistically when online.

### Founders tier logic

Track founders count via a CloudKit public database record (single record, atomic increment). When user attempts founders purchase:

1. Read counter
2. If `counter < 1000`, allow purchase, increment counter on successful transaction
3. If `counter >= 1000`, hide the founders SKU and show regular lifetime SKU

Fallback: if CloudKit is unavailable, default to *allowing* the founders price (better to oversell by a few than block legitimate purchases). Log discrepancies for manual reconciliation.

The "Founder" badge is granted by checking `Transaction.productID == "com.nomaen.homeworkout.pro.lifetime.founders"` — no separate flag needed.

### Paywall placement (where to show it)

**1. Equipment selector (highest converting)**
When free user taps a locked equipment chip (DB, KB, etc.), show paywall modal with that equipment highlighted: *"Unlock kettlebell workouts and 6 more equipment types with Pro."*

**2. Apple Watch settings**
Settings → Apple Watch → "Pair Watch" tapped. Modal: *"The Watch companion is part of Pro — unlock heart rate tracking, wrist controls, and haptic phase cues."*

**3. History view**
Free users see last 14 days, then a card: *"See your full history, heatmap, and stats with Pro."*

**4. Theme picker**
Locked themes show a Pro badge. Tapping shows the paywall.

**5. After workout completion (every 5th workout)**
Soft prompt only, dismissible: *"Loving SimpleWorkoutGen? Unlock everything with Pro."* Cap at once per week so it's not annoying.

**6. Settings → Upgrade**
Always-available entry point for users who actively seek to pay.

### Paywall UI structure

Single full-screen modal, three product cards, lifetime card visually emphasized as "Best Value":

```
┌─────────────────────────────┐
│  Unlock SimpleWorkoutGen Pro │
│                              │
│  ✓ Apple Watch companion    │
│  ✓ Live heart rate          │
│  ✓ All 9 equipment types    │
│  ✓ Live Activities          │
│  ✓ All 5 themes             │
│  ✓ Unlimited history        │
│  ✓ HealthKit two-way sync   │
│                              │
│  ┌──────────────────────┐   │
│  │ Monthly  NZ$5.99/mo  │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ Yearly   NZ$29/yr    │   │
│  │ 7-DAY FREE TRIAL     │   │
│  │ Save 60% vs monthly  │   │
│  └──────────────────────┘   │
│  ┌──────────────────────┐   │
│  │ ★ LIFETIME  NZ$59    │ ← │
│  │ Pay once, own forever│   │
│  └──────────────────────┘   │
│                              │
│  Restore Purchases           │
│  Terms · Privacy             │
└─────────────────────────────┘
```

If founders tier is still available, the lifetime card shows:

```
│ ★ FOUNDERS LIFETIME           │
│ NZ$39 (was NZ$59)             │
│ Only 247 of 1,000 left        │
```

### Restore Purchases

Required by App Store Review Guidelines (3.1.1). Implement as a button on the paywall and in Settings. Calls `Transaction.currentEntitlements` and updates entitlement state. Show a success toast: *"Pro restored — welcome back."*

### Family Sharing

- **Subscriptions** (monthly, yearly): Enable Family Sharing in App Store Connect. Standard practice, doesn't materially hurt revenue because of churn dynamics.
- **Lifetime** (both SKUs): **Disable Family Sharing.** Lifetime + family = 6 entitlements for the price of 1. The non-consumable IAP setting in App Store Connect lets you toggle this per-product.

### Receipt validation

For v1, do client-side validation only (StoreKit 2 handles signature verification). No server needed. If/when we add server-side receipt validation later (for analytics or fraud prevention), the entitlement model already centralizes it via `IAP.getEntitlement()`.

---

## 6. Free tier "tasting" mechanics (conversion boosters)

These are post-launch experiments — build them, but feature-flag them off initially. Turn on once we have baseline conversion data (~30 days post-launch).

### "Pro Mondays" — weekly Pro sample

Once per week (every Monday, user's local time), free users get a single full Pro workout. The Apple Watch companion runs, Live Activity fires, HR-based calories log. After completion, paywall modal: *"You just did a Pro workout. Keep going for NZ$29/year."*

Implementation: server-free flag based on `Date()` + last sample timestamp in localStorage.

### Milestone-based trial unlock

After the user's 30th completed workout, auto-grant 7 days of Pro and notify: *"You've earned 7 days of Pro. We'll remind you before it ends."* Heavy-investor users convert at 8–12% in similar apps. This trial is in addition to (not replacing) the App Store free trial.

Use StoreKit 2 promotional offers for this — generate a signed offer code from a CloudKit function and present it via `Product.purchase(options:)`.

### Streak-based one-time discount

Users who hit a 30-day workout streak get a one-time 25% off lifetime offer (US$22.99 founders price even after the 1,000 cap). Show in-app, expires in 72 hours.

---

## 7. App Store metadata changes

The free/paid story needs to be reflected in the App Store listing.

### Subtitle (30 chars)

Current: *(unknown — set if blank)*
New: **"Smart workouts. Watch ready."**

### Promotional text (170 chars, updateable without review)

> No accounts. No cloud. No tracking. Generate workouts in seconds, run them with your Apple Watch, and own your data. Free to start, Pro unlocks everything.

### Description — first 3 lines (above the fold)

> SimpleWorkoutGen builds workouts for you and runs them on your wrist.
>
> Pick a duration, pick a focus, get a full workout with smart warm-up, perfect rest periods, and live heart rate from your Apple Watch.
>
> No accounts. No cloud sync. No tracking. Your data stays on your device.

### "What's New" for v1.0

> SimpleWorkoutGen is here.
>
> • Free forever for bodyweight and mat workouts
> • Pro unlocks Apple Watch, Live Activities, and 7 more equipment types
> • Founder lifetime price for the first 1,000 customers — own it forever for NZ$39

### Privacy nutrition label

Use the existing privacy story to your advantage:

- **Data Not Collected** ← check this box. The whole box.

This is rare in fitness apps and worth highlighting. Most competitors collect identifiers, usage, and health data. You collect none.

---

## 8. Analytics & measurement

We need conversion funnel data without violating the "no tracking" promise. Use **App Store Connect's built-in analytics + StoreKit transaction reports** only — no third-party SDKs, no Firebase, no Mixpanel.

### KPIs to watch (App Store Connect)

- **Install → free user activation** (defined as: user completes 1 workout in first 7 days)
- **Free → trial start rate**
- **Trial → paid conversion** (target: 35%+, industry avg ~30%)
- **Free → lifetime direct purchase rate** (no trial)
- **Founders tier sell-through velocity** (target: 1,000 in 60 days)
- **Annual renewal rate at month 12** (target: 60%+)

### In-app event tracking (local only)

Track these in `localStorage` for in-app personalization (e.g., milestone trial unlock):

- Workouts completed count
- Last paywall shown timestamp (per surface)
- Last paywall dismissed timestamp
- Streak length

Never send these off-device. Never tie to an identifier.

---

## 9. Launch sequence

### Pre-launch (T-14 days)

- [ ] All 4 SKUs created in App Store Connect, prices set per territory
- [ ] Subscription group configured
- [ ] Free trial configured on yearly only
- [ ] Family Sharing toggled correctly per SKU
- [ ] Privacy nutrition label submitted
- [ ] Age rating questionnaire submitted (Jan 2026 mandatory format)
- [ ] Export compliance answered (no encryption beyond ATS)
- [ ] Screenshots showing free vs Pro tier (lock badges visible)
- [ ] Founders counter CloudKit record initialized at 0

### Launch day (T-0)

- [ ] Submit binary for review (expect 2–7 days currently)
- [ ] Founders tier is "live" the moment app is approved
- [ ] Personal launch post on Joe's channels: *"SimpleWorkoutGen is live. First 1,000 lifetime buyers get NZ$20 off."*
- [ ] Submit to /r/iOSProgramming "Showoff Saturday" thread

### T+7 days

- [ ] Check trial conversion data (need ~50 trials minimum for signal)
- [ ] Check founders tier velocity — adjust marketing if slow
- [ ] First A/B test: paywall headline copy

### T+30 days

- [ ] Enable "Pro Mondays" experiment for 50% of users
- [ ] Enable milestone trial unlock for 50% of users
- [ ] Win-back campaign for any churned annual subscribers (none yet, but pipe ready)

### T+90 days

- [ ] Re-evaluate pricing based on real conversion data
- [ ] If founders tier sold out fast: launch a "Year One Founder" tier at slightly higher price (US$26.99)
- [ ] If founders tier slow: extend cap from 1,000 to 2,500

---

## 10. Things to deliberately NOT do

These are anti-patterns that hurt conversion in similar apps. The implementing agent should push back if asked to do any of these:

- **No "Plus" middle tier.** Two tiers + lifetime is optimal. Three subscription tiers paralyze decisions and reduce conversion.
- **No ads, ever.** Even on free tier. Fitness audiences hate ads during workouts and review bomb apps that show them.
- **No account creation requirement.** The "no accounts" promise is a marketing weapon. Don't break it.
- **No discount on annual at launch.** Discount lifetime via Founders tier instead. Annual price needs to anchor stable for year-2 renewals.
- **No "limited-time launch sale" on the subscription tiers.** Apple's price drop notifications create awkward expectations.
- **No social/leaderboard features behind paywall.** They're not built yet, and adding them post-launch as "Pro features" feels gross. If we add social, it should be free.
- **No server-side accounts to "sync across devices."** Use iCloud-backed `NSUbiquitousKeyValueStore` if cross-device sync becomes essential. Keeps the no-server promise.
- **No HealthKit write gated by Pro.** Saving workouts to Apple Health is table stakes — give it away on free.
- **No bait-and-switch.** If a feature is free at launch, it stays free. Never claw features back into Pro.

---

## 11. Open questions for Joe

1. **Are we OK with 7-day trial, or should we test 14-day?** Industry data suggests 7-day converts better (urgency), 14-day converts more total volume. Default: 7-day. Revisit after 30 days of data.

2. **Should the Apple Watch app launch as Pro-only, or free with limited features?** Default: Pro-only. The watch app is the strongest single conversion driver in the feature set. Keeping it Pro-locked is the highest-EV decision.

3. **Founders cap at 1,000 — comfortable with this number?** It's $23K USD if all sell. Could go to 2,500 ($57K) without diluting the "founders" feel too much. Default: 1,000 with the option to extend if velocity is high.

4. **Do we want a "Pay What You Want" tier above lifetime?** Some indie devs do this — a US$99 "Patron" tier with no extra features beyond a thank-you note. Surprisingly converts in indie utilities. Default: skip for v1, revisit if founders sells out fast.

5. **Localized messaging for NZ?** "Built in Hamilton, NZ" in the App Store description performs well in NZ but not internationally. Default: include in NZ App Store description only (App Store Connect supports per-locale text).

---

## 12. File-level implementation checklist

Files to create or modify:

```
homeworkout/
├── ios/App/App/Plugins/
│   └── IAPPlugin.swift                  [NEW] StoreKit 2 bridge
├── ios/App/App/
│   ├── Info.plist                       [MODIFY] Add SKAdNetwork (no, skip — we don't track)
│   └── App.entitlements                 [MODIFY] Add CloudKit for founders counter
├── js/
│   ├── iap.js                           [NEW] JS-side IAP wrapper
│   ├── paywall.js                       [NEW] Paywall modal logic
│   └── entitlement.js                   [NEW] Single source of truth for tier
├── css/
│   └── paywall.css                      [NEW] Paywall modal styles
├── index.html                           [MODIFY] Add paywall modal + lock badges on UI
├── README.md                            [MODIFY] Add monetization section
├── HANDOFF.md                           [MODIFY] Reference this doc
└── ASSETS/screenshots/
    └── (regenerate showing free vs Pro)  [NEW]
```

---

## 13. Pricing rationale appendix (for Joe's reference, not the agent)

If anyone asks why these specific numbers:

- **NZ$29/year** is below the psychological "feels expensive" threshold of NZ$30, and breaks down to ~NZ$2.40/month — a number people round down mentally.
- **NZ$59 lifetime** is exactly 2.03x the annual price — Strong's lifetime is 2.67x their annual. We're more aggressive on the lifetime conversion incentive, which is correct for a new entrant.
- **NZ$39 founders** is exactly 1.34x the annual — buyers do the math and realize it pays back in 16 months.
- **NZ$5.99/month** makes annual look like a 60% discount, which is the "obvious deal" zone.
- **1,000 founders cap** is high enough to be achievable but low enough to feel exclusive.

---

## 14. Success criteria for v1.0 launch

We'll call the monetization launch a success if, in the first 90 days post-approval:

- [ ] 1,000+ total iOS installs
- [ ] 3%+ free → paid conversion (industry avg 2.5% for utility fitness)
- [ ] 60%+ of paid customers choose annual (vs monthly)
- [ ] Founders tier 50%+ sold (500+ founders)
- [ ] App Store rating 4.5+ stars (paywall not damaging perception)
- [ ] Zero ASC review rejections related to IAP/paywall implementation

If all six hit, the model works and we scale. If conversion is below 2%, the paywall friction is too high — soften the free tier. If founders tier doesn't move, the lifetime pitch needs work.

---

**End of handoff.** Implementing agent should ask clarifying questions on any of section 11 before writing code.

# App Store Connect Setup — IAP & Pricing

**Status:** Code complete, awaiting App Store Connect configuration
**Bundle ID:** `com.nomaen.homeworkout`
**Target:** iOS 15+ / watchOS 10+
**Date:** 2026-04-30

---

## What's already built (don't touch the code)

The codebase on branch `feat/pricing-paywall` (PR pending merge) has:
- StoreKit 2 native plugin (`IAPPlugin.swift`) handling products, purchase, restore, entitlements
- JS entitlement system with feature gating at 6 surfaces
- Paywall modal with 3 product cards + founders tier
- CloudKit integration for founders counter
- iOS entitlements file updated for IAP + CloudKit

All that's needed now is the **App Store Connect side** — creating the products, subscription group, CloudKit schema, and metadata updates.

---

## Step 1: Create Subscription Group

1. Go to **App Store Connect > Your App > Monetization > Subscriptions**
2. Create a new Subscription Group: **"SimpleWorkoutGen Pro"**

---

## Step 2: Create the 4 Products

### Product 1: Pro Monthly (auto-renewable subscription)

| Field | Value |
|-------|-------|
| **Reference Name** | Pro Monthly |
| **Product ID** | `com.nomaen.homeworkout.pro.monthly` |
| **Subscription Group** | SimpleWorkoutGen Pro |
| **Subscription Duration** | 1 Month |
| **Free Trial** | None |
| **Family Sharing** | Enabled |

**Pricing by territory:**

| Territory | Price |
|-----------|-------|
| New Zealand | NZ$5.99 |
| United States | US$3.49 |
| Australia | AU$5.49 |
| United Kingdom | £2.99 |
| Eurozone | €3.49 |
| Canada | CA$4.99 |
| Japan | ¥500 |

**Subscription Display Name:** Pro Monthly
**Description:** All equipment, Apple Watch, full history, all themes. Cancel anytime.

---

### Product 2: Pro Yearly (auto-renewable subscription)

| Field | Value |
|-------|-------|
| **Reference Name** | Pro Yearly |
| **Product ID** | `com.nomaen.homeworkout.pro.yearly` |
| **Subscription Group** | SimpleWorkoutGen Pro |
| **Subscription Duration** | 1 Year |
| **Free Trial** | 7 days |
| **Family Sharing** | Enabled |

**Pricing by territory:**

| Territory | Price |
|-----------|-------|
| New Zealand | NZ$29.00 |
| United States | US$17.99 |
| Australia | AU$26.99 |
| United Kingdom | £14.99 |
| Eurozone | €17.99 |
| Canada | CA$24.99 |
| Japan | ¥2,800 |

**Subscription Display Name:** Pro Yearly
**Description:** All equipment, Apple Watch, full history, all themes. 7-day free trial, then annual billing. Save 60% vs monthly.

---

### Product 3: Pro Lifetime (non-consumable)

| Field | Value |
|-------|-------|
| **Reference Name** | Pro Lifetime |
| **Product ID** | `com.nomaen.homeworkout.pro.lifetime` |
| **Type** | Non-Consumable |
| **Family Sharing** | **Disabled** (lifetime + family = 6 entitlements for price of 1) |

**Pricing by territory:**

| Territory | Price |
|-----------|-------|
| New Zealand | NZ$59.00 |
| United States | US$34.99 |
| Australia | AU$54.99 |
| United Kingdom | £29.99 |
| Eurozone | €34.99 |
| Canada | CA$49.99 |
| Japan | ¥5,500 |

**Display Name:** Pro Lifetime
**Description:** Pay once, own forever. Every Pro feature, no recurring charges.

---

### Product 4: Founders Lifetime (non-consumable)

| Field | Value |
|-------|-------|
| **Reference Name** | Founders Lifetime |
| **Product ID** | `com.nomaen.homeworkout.pro.lifetime.founders` |
| **Type** | Non-Consumable |
| **Family Sharing** | **Disabled** |

**Pricing by territory:**

| Territory | Price |
|-----------|-------|
| New Zealand | NZ$39.00 |
| United States | US$22.99 |
| Australia | AU$36.99 |
| United Kingdom | £18.99 |
| Eurozone | €22.99 |
| Canada | CA$32.99 |
| Japan | ¥3,500 |

**Display Name:** Founders Lifetime
**Description:** Limited to 1,000 customers. Pay once at a reduced price, own Pro forever. Includes Founder badge.

---

## Step 3: Subscription Group Ordering

In the subscription group "SimpleWorkoutGen Pro", set the **subscription level** (upgrade/downgrade priority):

1. Pro Yearly (Level 1 — highest)
2. Pro Monthly (Level 2 — lower)

This ensures yearly is treated as an upgrade from monthly. The lifetime products are non-consumable and not part of the subscription hierarchy.

---

## Step 4: CloudKit Setup (Founders Counter)

1. Go to **CloudKit Dashboard** (https://icloud.developer.apple.com)
2. Select container: **iCloud.com.nomaen.homeworkout**
   - If it doesn't exist yet, create it in Xcode: Signing & Capabilities > iCloud > CloudKit, add the container identifier `iCloud.com.nomaen.homeworkout`
3. In the **Production** environment, create a Record Type:

| Field | Value |
|-------|-------|
| **Record Type Name** | `FoundersCounter` |
| **Fields** | `count` (Int64) |

4. Create an initial record:
   - **Record Name:** `foundersCounter`
   - **Zone:** Default Zone
   - **count:** `0`

5. Set permissions:
   - **Security Role:** World (read)
   - **Authenticated Users:** Read + Write (the app increments the counter after purchase)

The code in `IAPPlugin.swift` reads/increments this counter atomically when a founders purchase succeeds. If CloudKit is unavailable, it falls back to allowing the purchase (better to over-sell slightly than block a paying customer).

---

## Step 5: App Store Metadata Updates

### Subtitle (30 chars max)
```
Smart workouts. Watch ready.
```

### Promotional Text (170 chars max)
```
No accounts. No cloud. No tracking. Generate workouts in seconds, run them with your Apple Watch, and own your data. Free to start, Pro unlocks everything.
```

### Description (first 3 lines)
```
SimpleWorkoutGen builds workouts for you and runs them on your wrist.

Pick a duration, pick a focus, get a full workout with smart warm-up, perfect rest periods, and live heart rate from your Apple Watch.

No accounts. No cloud sync. No tracking. Your data stays on your device.
```

### What's New (for the version that ships IAP)
```
SimpleWorkoutGen is here.

- Free forever for bodyweight and mat workouts
- Pro unlocks Apple Watch, Live Activities, and 7 more equipment types
- Founder lifetime price for the first 1,000 customers — own it forever for NZ$39
```

### Privacy Nutrition Label
- Check **"Data Not Collected"** — entire box
- No analytics SDKs, no third-party tracking, no server-side anything

---

## Step 6: Review Checklist

Before submitting the binary for review:

- [ ] All 4 product IDs created and approved in App Store Connect
- [ ] Subscription group "SimpleWorkoutGen Pro" created with correct level ordering
- [ ] 7-day free trial configured on yearly only (not monthly, not lifetime)
- [ ] Family Sharing enabled for monthly + yearly, disabled for both lifetime SKUs
- [ ] CloudKit container `iCloud.com.nomaen.homeworkout` exists with `FoundersCounter` record type
- [ ] Initial `foundersCounter` record created with `count: 0`
- [ ] Privacy nutrition label set to "Data Not Collected"
- [ ] App subtitle, promotional text, and description updated
- [ ] "What's New" text ready for the IAP version
- [ ] Age rating questionnaire completed
- [ ] Export compliance answered (no encryption beyond HTTPS = exempt)
- [ ] Screenshots showing free vs Pro states (lock badges visible on equipment/themes)
- [ ] Binary includes StoreKit 2 entitlements

---

## Step 7: Post-Launch Promotional Offers (set up now, activate later)

These are **feature-flagged off** in code initially. Set them up in App Store Connect so they're ready to activate:

### Win-back offer (for lapsed annual subscribers)
- **Target:** Users whose yearly subscription lapsed 30+ days ago
- **Offer:** 50% off first year
- **Type:** Win-back offer

### Trial extension (for engaged free users)
- **Target:** Users who downloaded but didn't subscribe, 14+ days post-install
- **Offer:** 14-day extended trial on yearly
- **Type:** Promotional offer (requires signed offer codes)

These can be activated at T+30 days post-launch based on conversion data.

---

## Product ID Quick Reference

| Product | ID | Type |
|---------|-----|------|
| Monthly | `com.nomaen.homeworkout.pro.monthly` | Auto-renewable |
| Yearly | `com.nomaen.homeworkout.pro.yearly` | Auto-renewable |
| Lifetime | `com.nomaen.homeworkout.pro.lifetime` | Non-consumable |
| Founders | `com.nomaen.homeworkout.pro.lifetime.founders` | Non-consumable |

---

## Important Notes

- The code expects **exactly these product IDs**. Do not change them.
- The StoreKit 2 plugin handles all receipt validation client-side. No server needed.
- Lifetime purchases work offline forever once verified locally.
- The founders counter is eventually consistent (CloudKit) — a few extra sales beyond 1,000 is acceptable and by design (the code falls back to "allow" if CloudKit is unreachable).

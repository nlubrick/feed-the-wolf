# Feed the Wolf — Apple App Review handoff
**Status: release-build workflow prepared; NOT submitted.** Last verified code base is the 110-stage game (100 pin puzzles and 10 different mini-games). Do not submit an internal TestFlight/tester IPA; that build contains a practice checkout.

## 1. Owner steps in App Store Connect (required)
1. Open [App Store Connect](https://appstoreconnect.apple.com/) → Business. Accept the Paid Apps Agreement and finish tax and banking details. Never send banking details or credentials in chat or GitHub.
2. Open Apps → Feed the Wolf → Monetization → In-App Purchases. Add these four products exactly as named (IDs are immutable after creation):
   - `feed_the_wolf_full_unlock` — **non-consumable**, “The Full Adventure”, US price $2.99.
   - `ftw_gems_50` — **consumable**, “Gem Pouch”, suggested US price $0.99.
   - `ftw_gems_150` — **consumable**, “Gem Chest”, suggested US price $1.99.
   - `ftw_gems_400` — **consumable**, “Gem Vault”, suggested US price $3.99.
   Supply required purchase localizations and a real review screenshot for each; use the official price tiers Apple offers and check all prices before saving.
3. Add the iOS app (bundle ID `com.failureentertainment.feedthewolf`) to RevenueCat; connect its App Store integration, import these products, create entitlement `full_game` linked to `feed_the_wolf_full_unlock`, and ensure all four products are accessible to the SDK.
4. In Codemagic create the **secure** variable group `revenuecat_production` with `FTW_RC_IOS_KEY` set to the correct RevenueCat **public Apple-specific SDK key** (starts `appl_`). Do not use a RevenueCat Test Store key or any RevenueCat secret key. The release workflow rejects a missing/invalid iOS key.
5. Public support contact configured on `support.html` and `privacy.html`: `nlubrick@gmail.com` (verify the deployed URLs show it before submitting). Confirm the privacy disclosure matches the active RevenueCat SDK and any data collected.

## 2. Real-money sandbox verification — physical iPhone
- Build `ios-appstore-review` (or validate purchases with the clean external beta using the correct Apple SDK key). Do not use `ios-beta-signed`: it contains a simulated checkout.
- Confirm: the five free pin levels and first mini-game work; at the next gated stage the $2.99 App Store purchase sheet appears, an approved purchase unlocks the game, gifting the pet and accessory.
- Try purchase cancellation, restore purchase, offline/error handling, and app restart. All four product IDs must load and show Apple's localized prices. Buy a gem pack twice, verify gems credit **once per transaction**, and verify restore behavior. Check refund/revocation behavior where possible.
- Test the FE intro alone, sound effects after leaving/returning from another app, background music, castle sizing and all tappable footer links on real iPhone devices. A simulated or muted sound test is not sufficient.
- Test the production release flavor for the same Level 1–110 gameplay; saves, cosmetics, and Hard Mode should survive an app update.

## 3. App Store listing and review materials
- Follow `store/LISTING.md` for the draft title, subtitle, keywords, description, promo text, purchase IDs, age-rating and privacy guidance; verify the live answers yourself.
- Supply **real app screenshots** from a supported device, not images generated from concept art. Capture gameplay and the store on the final production version.
- Privacy URL: https://feed-the-wolf.onrender.com/privacy.html
- Support URL: https://feed-the-wolf.onrender.com/support.html — public contact: `nlubrick@gmail.com` (confirm deployed page).
- App price: **Free**, with $2.99 non-consumable full unlock and optional consumable gem packs; avoid setting a $2.99 download price as well.
- Set age rating, Apple App Privacy, copyright, availability, and pricing/tax category.
- Prepare App Review contact information and notes explaining the 5 free levels, first free mini-game, no login, $2.99 full unlock, optional gems and Restore Purchases. The reviewer may use Apple's sandbox; no test login is needed.
- Create/select **iOS App 1.0.0**, which matches the release candidate's marketing version; attach the processed 1.0.0 IPA, not a 0.2.0 internal beta build. Add the **app version and the first non-consumable and consumable IAPs to the same review submission** (Apple requires a new app version with the first of each type).
- Choose **manual release** so approval does not publish immediately.
- Only after confirming all content and the owner explicitly authorizes submission: choose the processed production build, Add for Review, and Submit for Review. This repository workflow does not press those buttons.

## 4. Manual Codemagic workflow
`ios-appstore-review`: `main`, requires `revenuecat_production` group.
It runs npm tests and strict release checks, creates a fresh Capacitor iOS project, installs the unbadged FTW native icon, signs with the existing Apple Distribution profile, and uploads to App Store Connect. It has `submit_to_testflight: false` and `submit_to_app_store: false`. Upload is **not** submission and not publication.

## Still unverified
The code cannot verify the owner's App Store Connect Paid Apps Agreement, tax/bank status, IAP creation/localization, RevenueCat products/entitlement, successful deployment and reachability of the support page, screenshots, legal/privacy answers, iOS device bug resolution, or Apple's approval. These remain required gates. Do not label the game “ready for App Review” until they are completed.

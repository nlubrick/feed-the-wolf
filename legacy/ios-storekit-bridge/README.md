# Superseded

These Swift files were an iPhone-only StoreKit bridge for the unlock alone. The app now uses a Capacitor shell with RevenueCat for both stores (see MOBILE-BUILD.md). Kept for reference; not part of any build.

# Feed the Wolf — iPhone build notes

The repository contains a browser/PWA game and two Swift source files that can be added to a native iPhone Xcode target. **This is not yet an installable .ipa or a submitted App Store app.**

## Game and pricing

- Levels **1–5** are free.
- Levels **6–100**, all Hard Mode variants beyond the free levels, and daily puzzles require one non-consumable purchase.
- App Store Connect product ID: `feed_the_wolf_full_unlock`.
- Intended U.S. selling price: **$2.99**. The actual localized StoreKit product price is authoritative.
- Purchases restore through the same Apple Account; no subscription, forced ads, or consumable cash purchase.

## Wiring the iPhone app

1. Create a new iOS 16+ Swift UIKit target in Xcode; add `FeedTheWolfViewController.swift` and `FeedTheWolfStoreBridge.swift`.
2. Make `FeedTheWolfViewController` the initial/root view controller (for example from a SceneDelegate or SwiftUI `UIViewControllerRepresentable`).
3. Add a **blue folder reference** named `www` to Copy Bundle Resources, containing `index.html`, `expansion-levels.js`, `studio-boot-v2.js`, `studio-credits-roll-v2.js`, `failure-entertainment-intro-v2.html`, `feed-the-wolf-icon.svg`, `manifest.webmanifest`, and `service-worker.js`. The `www` files must be from the **same release commit**.
4. Enable In-App Purchase capability and create a **non-consumable** product with exact ID `feed_the_wolf_full_unlock` in App Store Connect. Set the price tier corresponding to $2.99 in the U.S.
5. Test with a StoreKit Configuration locally and App Store sandbox/TestFlight. Confirm purchase, cancellation, pending, offline, revoked/refunded, fresh install, and Restore Purchases. Only a current verified StoreKit transaction opens premium content.
6. Before any production build, remove the `DEVELOPER PREVIEW` panel, `DEV_PREVIEW` / `previewFull` logic, and the `?dev=1` unlock mode completely. Run `npm test` and `npm run release:check`.

## Notes

The web/PWA version is intentionally **demo only** and cannot take App Store payments. A hosted web page alone cannot enforce purchase ownership securely, because clients control their JavaScript. The native iPhone app uses StoreKit 2 verified current entitlements. The game currently persists progress in browser storage; cloud save/sync is not implemented.

The Swift files are integration source, not a fully configured Xcode project. Signing, bundle identifier, store configuration, actual device testing, age ratings, privacy disclosure, icon assets, screenshots, and App Review remain required.

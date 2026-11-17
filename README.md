# Feed the Wolf — Failure Entertainment

A 110-stage (100 pull-the-pin puzzles + 10 mini-games) illustrated puzzle adventure, with five themed locations, Hard Mode, a gem economy, optional cosmetic purchases, and local progress saving.

## Builds

- **DEV web** — https://feed-the-wolf.onrender.com — developer controls and simulated purchases; not for public App Store submission.
- **BETA web** — https://feed-the-wolf-beta.onrender.com — no Developer panel, clearly labeled simulated checkout for testing.
- **iOS internal TestFlight** — Codemagic `ios-beta-signed`, tester build with simulated no-charge checkout.
- **iOS external beta** — `ios-external-beta`, real Apple sandbox purchases (requires properly configured RevenueCat iOS key).
- **iOS App Store review candidate** — `ios-appstore-review`, production build with **no beta shortcuts or simulated checkout**. Requires the `revenuecat_production` Codemagic group with `FTW_RC_IOS_KEY`. Upload to App Store Connect is not submission.
- **Android debug** — `android-beta-debug`, sideload testing only; Play release/signing not configured.

## Run checks

```sh
npm install --no-audit --no-fund
npm test
npm run release:check
```

Strict iOS review preflight (requires the public Apple-specific SDK key in the environment):

```sh
FTW_RC_IOS_KEY=appl_your_public_key_here node scripts/check-release.cjs --target production --strict --platform ios
```

Do not commit keys, sign-in credentials, signing certificates or other secrets.

See [store/APP_STORE_REVIEW.md](store/APP_STORE_REVIEW.md), [store/TESTING.md](store/TESTING.md), and [store/LISTING.md](store/LISTING.md) for Apple launch steps, test requirements and store listing drafts.

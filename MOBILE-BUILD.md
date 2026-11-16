# Feed the Wolf: beta and production builds, iPhone and Android

One codebase, two builds, two stores.

| | Beta | Production |
|---|---|---|
| Made by | `npm run build:beta` | `npm run build:production` |
| Developer panel, level jumper, full-game preview, progress reset | yes | removed |
| Practice checkout (no money) | yes, wherever there is no real store | removed |
| Real store purchases | sandbox, once a store key is set | verified purchases, once a store key is set |
| Marked on screen | "BETA TEST BUILD" badge | nothing |
| Game content, levels, music, Store items | identical | identical |

The website on Render is the repository itself, which is the beta. Building never changes source files.

## How the split works

- Everything test-only sits between `BETA-START` and `BETA-END` markers in `index.html`, plus the file `test-store-v2.js`. The production build deletes those blocks and that file.
- The game asks one question, `hasFullAccess()`. In production it is true only after the store bridge reports a verified purchase. The beta adds its preview and practice purchase through a `BETA` hook that does not exist in production.
- **New test-only code must go inside a `BETA` block.** If it does not, `npm run release:check` fails.

## Commands

```
npm test                  # rules, levels, economy, gates, and both builds
npm run release:check     # builds production and fails if any developer shortcut or practice purchase is left
npm run build:beta        # -> dist/beta
npm run build:production  # -> dist/production
npm run app:add           # once: create the android/ and ios/ projects (ios needs a Mac)
npm run app:beta          # beta build -> www/ -> both app projects
npm run app:production    # release check, production build -> www/ -> both app projects
```

Then open `android/` in Android Studio, or `ios/App` in Xcode, to run on a phone or upload to a store.

## Cloud builds (Codemagic)

`codemagic.yaml` has four manual workflows; none publishes anything.

| Workflow | Build | For |
|---|---|---|
| `android-beta-debug` | tester | a debug APK to sideload |
| `ios-beta-simulator` | tester | a compile check, no signing |
| `ios-beta-signed` | tester | **internal** TestFlight: practice checkout, clearly labeled, no money |
| `ios-external-beta` | external | **outside** testers: no practice checkout, Apple sandbox purchases |

- Every build is stamped with a unique build number (minutes since 1970, UTC) and the version in `package.json`, by `scripts/set-app-version.cjs`. To release a new version, raise `version` in `package.json`.
- `ios-external-beta` needs a Codemagic variable group named `revenuecat_beta` holding `FTW_RC_IOS_KEY`. It stops at the first step if the key is missing.

## Store setup (RevenueCat)

Real purchases stay off until store keys are set. With no key the app has no store and nothing can be bought.

1. In App Store Connect and Google Play Console, create these products with exactly these IDs:
   - `feed_the_wolf_full_unlock`: non-consumable (Google: one-time product), $2.99
   - `ftw_gems_50`, `ftw_gems_150`, `ftw_gems_400`: consumable, $0.99 / $1.99 / $3.99
2. In RevenueCat, add both apps with bundle/package ID `com.failureentertainment.feedthewolf`, import the four products, and create an entitlement named **`full_game`** attached to `feed_the_wolf_full_unlock`.
3. Put RevenueCat's public SDK keys in `build.config.json` (or the environment variables `FTW_RC_IOS_KEY`, `FTW_RC_ANDROID_KEY`). Fill in `beta` first. Leave `production` empty until real sales are approved.
4. `npm run release:check -- --strict` also requires the production keys; use it on the day sales are switched on.

A beta app with keys uses each store's sandbox: TestFlight on iPhone, a licensed tester account on Google Play. No real money moves in either.

## Player progress

- Saves live under the key `ftw-save` at the app's address. `capacitor.config.json` pins that address; changing `server` or the app ID would orphan every saved game, and a test guards it.
- The app also keeps a second copy of the save in native storage and puts it back if the web copy goes missing.
- Purchases are held by the store, so the unlock and gem packs come back on a new phone through Restore Purchases.

## Not verified yet

Written and unit-tested against RevenueCat's published interface, but never run on a device: the store bridge (`store-bridge-v1.js`) and the native save backup. The Android project generates cleanly with both plugins; the iPhone project has not been generated (needs a Mac). First sandbox purchase on each platform is the real test.

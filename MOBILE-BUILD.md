# Feed the Wolf: building the iPhone and Android apps

One web game, two store apps. The app shells load the files in `www/`.

**Status: not yet a store build.** The web bundle step below works and is tested. The app projects, real payments and the release strip-down are not done.

## What works today

```
npm test            # rules, levels, economy, purchase gates
npm run build:www   # copies the game into www/ (the list comes from service-worker.js)
```

`capacitor.config.json` points a Capacitor shell at `www/`. The app ID in it (`com.failureentertainment.feedthewolf`) is a placeholder: it is permanent once an app is published, so confirm it before creating either store listing.

## Still to do, in order

1. **Create the app projects** (needs a Mac with Xcode for iPhone; Android Studio for Android):
   `npm i @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android`, then `npx cap add ios`, `npx cap add android`, `npx cap sync`.
2. **Real payments.** The game talks to a bridge called `window.FeedTheWolfStore` with `status`, `purchase` and `restore`. Each must answer `{productId, verified:true, entitled:true}` only for a purchase the store itself has verified. Products:
   - `feed_the_wolf_full_unlock`: one-time, non-consumable, $2.99
   - `ftw_gems_50`, `ftw_gems_150`, `ftw_gems_400`: consumable gem packs ($0.99, $1.99, $3.99). The game only credits these from the test store today; real crediting is part of this step.
   - Restore Purchases must work on both stores.
   The older `ios/` Swift files are an iPhone-only StoreKit bridge for the unlock alone; a cross-platform plugin replaces them.
3. **Release strip-down.** Remove the developer panel, `?dev=1`, the test checkout and `test-store-v2.js`. `npm run release:check` fails until this is done, on purpose.
4. **Device testing** on a real iPhone and a real Android phone: touch feel, sound, performance, purchase, cancel, restore, fresh install.
5. **Store listings**: icon set, screenshots, description, age rating, privacy policy.

## Rules that stay true

- Levels 1 to 5 and the first mini-game (level 6) are free. Everything else needs the unlock.
- Progress past the free levels pays no gems or trophies without the unlock.
- Gem packs never buy gameplay advantage, and the five location trophies and two full-game gifts are never sold.

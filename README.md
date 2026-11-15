# Feed the Wolf — 100-Level Beta

An illustrated pull-the-pin puzzle game from Failure Entertainment.

## Current game
- **100 main levels and 100 Hard Mode variants** across five 20-level locations.
- The first 40 original puzzles are unchanged. Sixty additional solver-certified puzzles use working pressure gears, water blooms, and fire beacons.
- Extra characters, companion pets, and wearable rewards appear greyed out until the full game is unlocked.

## Home-screen app: purchase-flow testing

The PWA installed on an iPhone starts as a normal **five-level free trial**. After Level 5, choose **See the full game**, then tap **Unlock full game · $2.99 (TEST)**.

**No money is charged.** This is a clearly marked simulated transaction for this beta version, not an Apple App Store purchase. The purchase button opens a no-charge confirmation before it grants test access.

### Optional test Store items

The **Store** button on the game's home screen opens a six-item test catalog:
- **The Full Adventure — $2.99:** all levels, Hard Mode and daily puzzles.
- **Copper Fox — $0.99:** optional early playable character.
- **Moss Fox — $0.99:** optional early playable character.
- **Firefly Companion — $0.99:** optional companion pet.
- **Mini Phoenix — $1.49:** optional companion pet.
- **Grand Crown — $0.99:** optional wearable.

These are *fake store transactions* for experimenting with checkout, persistent ownership and the wardrobe. Players can still earn the five cosmetics through normal gameplay instead of buying them. Test cosmetics unlock in the wardrobe immediately and don't deduct in-game gems. The full game is still a single one-time unlock and no subscription is involved.

**Reset test purchase** removes the simulated full-game unlock **and all five optional store purchases**, while preserving completed levels, stars and legitimately earned rewards. **Reset game progress** preserves those test purchases and re-grants purchased cosmetics. **Reset purchase + progress** clears both. The simulated unlock is stored **locally in the installed app** and stays active after closing and reopening it. Game progress/last-played level are also stored locally.

**Developer tools** are accessible from the game footer, or from the purchase screen. They include a no-purchase full-game preview, level jump, **Reset test purchase** (retains progress), **Reset game progress** (retains purchase), and **Reset purchase + progress** (fresh install state). Every reset asks for confirmation.

To test a genuine free trial from scratch: open **Developer → Reset purchase + progress**, then complete Levels 1–5 and tap the TEST purchase button. To retest the paywall with saved progress, use **Reset test purchase**.

If you install the PWA separately from a browser, it may have separate local storage. Reset the installed copy directly. Avoid private browsing or disabling storage.

## Verification
```bash
npm test
npm run release:check
```

The puzzle suite searches all 200 normal/hard levels; the purchase-flow tests cover reset and persistence. **The release guard intentionally fails** while this test checkout or Developer interface exists.

## App Store release is a separate future build
Before selling, remove the simulated purchase key and developer console, integrate the real StoreKit 2 non-consumable `feed_the_wolf_full_unlock` at an intended U.S. price of $2.99, and test a signed native app with sandbox transactions, restores, refunds, pending transactions and real iPhones. This public web beta must not be presented as a live payment system.

# Feed the Wolf — 100-Level Beta

An illustrated pull-the-pin puzzle game by Failure Entertainment. All 100 original/expansion normal levels and 100 Hard Mode variants remain in place.

## One Store

The previous Wardrobe and separate test Store are **one Store**, opened from the wolf's Store button at the top of the game. This screen contains the current gem balance, gem packs and (only when not already owned) the full-game purchase, plus **all** playable characters, pets and costumes. There are **no individual cash cosmetics**.

- **Full Adventure: $2.99, one-time** — Levels 6–100, Hard Mode and daily puzzles (Levels 1–5 free).
- **Gem Pouch: 50 gems for $0.99**
- **Gem Chest: 150 gems for $1.99**
- **Gem Vault: 400 gems for $3.99**

All prices above are **SIMULATED TEST CHECKOUTS ONLY** in the home-screen PWA. There is no real charge, Apple receipt, or payment processing in the browser. The gem packs can be purchased repeatedly in the test simulator. The full-game unlock is a one-time purchase.

All cosmetic items have a **gem price**, including level rewards and Hard Mode companion prizes. A player can buy these early with gems, or earn milestone items by solving the relevant levels as before. There are no combat benefits from cosmetics. **Buying gems does not unlock the full game**; the $2.99 unlock remains separate. Gem-pack test purchases and cosmetic unlocks persist when the installed home-screen app is reopened.

## Developer testing

A temporary **Developer** button is available in the footer, the Store, and the full-game paywall. It opens Developer Mode for testing the five-level trial, the Store, and Levels 6–100.

The development tools include:
- Preview the full game without buying it, or return to demo mode.
- Jump to any of the 100 levels, with permission checks.
- View the full-game checkout screen.
- **Reset test purchases** — remove full-game unlock and all test gem-pack purchases, retain level progress and cosmetics bought/earned with gems. If purchased gems have already been spent, the remaining gem balance may fall to zero.
- **Reset game progress** — erase completed levels, hints and cosmetic unlocks, but retain the simulated full-game purchase and purchased gem packs.
- **Reset purchases + progress** — return to brand-new-install state.

Resets ask for confirmation. Fake receipts are intentionally stored separately from game progress so these resets can be independent.

## Tests and release blockers

Run `npm test` for puzzle and gem-store regressions. The `npm run release:check` command **intentionally fails** while the developer tools, simulated checkout and local fake receipts are present.

**Before selling the game**, remove all simulator code and developer access. Build/sign the native iPhone app, configure the full-game non-consumable and gem-pack consumables in App Store Connect, verify server/client entitlement and gem crediting, test purchases/restore/refunds/reinstalls in StoreKit sandbox, and perform actual iPhone gameplay and accessibility tests. The StoreKit files in `ios/` currently cover the full-game entitlement only: real gem-pack StoreKit purchases are **not yet implemented**. This is a playtest beta, not the App Store release.

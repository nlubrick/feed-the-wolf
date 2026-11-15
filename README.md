# Feed the Wolf — 100-Level Edition

An illustrated pull-the-pin puzzle game from Failure Entertainment.

## Current game

- **100 main levels** plus 100 Hard Mode variants.
- **Five destinations, 20 levels each:** The Castle (1–20), Wizard's Tower (21–40), Clockwork Citadel (41–60), Moonlit Conservatory (61–80), Ghostlight Theatre (81–100).
- The original **first 40 levels are unchanged**. The next 60 are solver-tested remixes of established rooms with new puzzles and dependencies.
- New chapter toys: **pressure gear** (drop a boulder onto it), **magic bloom** (water activates it), **light beacon** (lava ignites it). Each opens a physical gate.
- Eight additional playable characters, ten illustrated pets, and twelve wearable chapter prizes alongside the original wardrobe.

## Demo and purchases

The game is free to start: **levels 1–5 are playable**, then the full edition is planned as a **$2.99 one-time App Store non-consumable** `feed_the_wolf_full_unlock`. The web/PWA is a demo; no web checkout or fake purchase. The iOS StoreKit 2 bridge lives in `ios/`.

**Development branch only:** the `QA: Demo → Full` toggle temporarily previews premium content without a purchase. This must be **removed** before launching or merging a production release. It is not an entitlement.

## Running and verification

Serve the repository as a static website or install the PWA. Do not open only `index.html` without its sibling `expansion-levels.js`.

Run:
```bash
npm test
npm run release:check
```

The first command searches for solutions for all **200 normal/hard puzzles** and verifies the first 40's source fingerprint. The release check intentionally **fails** while the QA preview switch remains; see `ios/README.md`.

The prototype is not App Store ready until the native app is built and its StoreKit transactions, restore, iPhone layout and performance are tested.

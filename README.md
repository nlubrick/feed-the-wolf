# Feed the Wolf

A pull-the-pin puzzle adventure by Failure Entertainment. The wolf is the good guy.

## Content

- **100 main levels**, each with a Hard Mode variant, plus daily puzzles.
- **Levels 1–20 – The Castle:** the original pin, lava, water, TNT, boulder, spring and seesaw challenges.
- **Levels 21–40 – The Wizard's Tower:** the original portal and ghost challenges.
- **Levels 41–60 – Clockwork Citadel:** new pressure gears, which open a linked wall when a boulder lands on them.
- **Levels 61–80 – Moonlit Conservatory:** water-activated flowers that open linked walls.
- **Levels 81–100 – Ghostlight Theatre:** lava-activated beacons that open linked walls.
- Eight new playable character appearances, ten new pet companions, twelve new illustrated chapter rewards, in addition to existing collections.
- The original **40 puzzle definitions are preserved**. The new sixty build on the tested rules-engine patterns and introduce each chapter's unique cause-and-effect mechanism. They are not yet visually playtested.

## Pricing model (not yet live)

- Free browser / iPhone download, with **only Levels 1–5 free**.
- Full-game purchase: intended **$2.99 one-time** in-app unlock, enabling the other 95 levels, all Hard Mode puzzles, daily puzzles, and premium wardrobe items.
- Premium characters, accessories and pets remain visible but greyed out in the demo.
- The existing wardrobe gem currency remains an in-game reward, not real money. Full-game access does not mean every cosmetic is immediately earned.
- Browser pages **do not process real purchases**. A future iOS app must supply a StoreKit 2 bridge exposing `window.FeedTheWolfStore.status/purchase/restore` and report only **verified active entitlements** for product `feed_the_wolf_full_unlock`. Do not emulate verification with local storage.

## Developer-only preview — REMOVE BEFORE LAUNCH

On a preview build of **this development branch**, open the URL with `?dev=1`. For example, `https://your-preview-url/?dev=1`.

A clearly labeled **DEVELOPER PREVIEW** panel appears above the board:

1. Toggle **Preview FULL game** on to test all 100 levels, Hard Mode, daily puzzles and the full wardrobe. This does not create a purchase.
2. Toggle it off to inspect the **five-level demo**, paywall and greyed-out premium rewards. Progress and real purchase state are not erased.
3. Enter any level number from 1 to 100 and press **Jump** for QA. A jump above Level 5 while in demo mode still opens the purchase gate.

The preview switch is intentionally temporary and *not secure*. Before any public production deployment or App Store submission, remove the panel, CSS, `DEV_PREVIEW`, `previewFull`, `setPreviewFull` and development jump handlers, then re-test. Do not ship a development build containing this bypass.

## Files and testing

- `index.html`: the main rules engine, scenes, level flow, cosmetics, and demo/paywall UI.
- `expansion-levels.js`: the 60 additional level definitions.
- `service-worker.js`: offline app-shell cache (includes the expansion).
- `tests/verify-levels.cjs`: deterministic solver test covering all 100 normal and 100 hard levels.

Run from the repository root:

```bash
node tests/verify-levels.cjs
```

It checks the original 40 definitions' fingerprint, 100 unique levels, 200 solvable variants, and that all 120 new chapter variants **require** their pressure gear, bloom or beacon to finish.

## Still needed for a commercial release

- Native iPhone wrapper and verified StoreKit 2 in-app purchase and Restore Purchases flow.
- App Store Connect product configuration, pricing, and sandbox purchases / cancellations / restores.
- Remove the developer bypass in **all** public release assets.
- Hands-on playtesting on iPhone (including small screens, offline, level completion, effects, audio, and device performance).
- Playtest the first five levels with unfamiliar players; fix any onboarding or difficulty frustrations.
- Final art/animation, accessibility, store listing, privacy, and release checks.

**This branch is a beta preview, not a ready-to-sell App Store build.**

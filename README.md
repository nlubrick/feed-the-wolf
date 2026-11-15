# Feed the Wolf — 115-Stage Playable Beta

Feed the Wolf by Failure Entertainment is a spooky-fun illustrated puzzle adventure. The existing **100 pull-the-pin levels** and all their original Hard Mode variants remain unchanged. There are now **15 fully playable optional bonus mini-games**, for **115 numbered story stages**.

## Stage numbers — find every bonus easily

Every chapter has 20 original pull-the-pin puzzles and three new bonus stages, interleaved just after that chapter's 5th, 12th and 19th pull-the-pin puzzle:

| Chapter | Match-3: Feast Match | Rotating Pipes: Pantry Panic | Hidden Objects: Dinner Detective |
|---|---|---|---|
| The Castle | **6** The Larder Shuffle | **14** Copper Pipes | **22** The Missing Feast |
| Wizard's Tower | **29** Enchanted Ingredients | **37** Potion Plumbing | **45** The Vanished Recipe |
| Clockwork Citadel | **52** Clockwork Snacks | **60** Factory Feedline | **68** The Hidden Gear |
| Moonlit Conservatory | **75** Moonlit Harvest | **83** Garden Irrigation | **91** The Secret Bouquet |
| Ghostlight Theatre | **98** Curtain Call Combo | **106** Backstage Flow | **114** The Final Prop |

**Final pull-the-pin puzzle is Level 115.** Original pull-the-pin Level 6 is now story Level **7**. All old underlying puzzle indices, achievements, saved stars, prizes and Hard Mode solutions are preserved.

The mini-games actually work: Feast Match has a six-by-six food board with swapping, gravity, cascades, chain scoring and an unlockable Wolf Howl clearing power; Pantry Panic has a five-by-five grid of rotatable pipes with genuine connectivity testing and five solvable chapter-specific paths; Dinner Detective has original responsive SVG room drawings and twelve tappable, keyboard-accessible objects with a three-object challenge.

Every bonus level offers **Skip mini-game** with no progression penalty. Completing a bonus for the first time pays 5–13 bonus gems depending on chapter; skipped stages pay no reward, but you can replay them later to earn gems. Earned bonus gems are counted once, saved and persist across relaunches.

The first five pull-the-pin puzzles **plus bonus Level 6** are free. The $2.99 one-time full-game unlock allows the remaining stages. Your trial uses the exact same fake, no-charge checkout as before.

## Five different musical locations

The Castle retains its original castle-caper WAV soundtrack. The Wizard's Tower, Clockwork Citadel, Moonlit Conservatory, and Ghostlight Theatre each have an original synthesized musical theme that starts upon entering that chapter. Each bonus mini-game plays a slight variation of its location's motif: upbeat for Match, clockwork/rhythmic for Pipes, and mysterious/soft for Detective. Returning to normal puzzle levels restores the main chapter loop. Music on/off remains saved.

## Playing and testing on iPhone

Open https://feed-the-wolf.onrender.com or your existing home-screen web app (the service worker cache is updated to v12). Tap **Developer** to jump directly to **any stage 1–115** or enable full-game preview, and to reset game progress or simulated purchases independently.

The Store remains gem-only for cosmetics. The only test-money purchases are $2.99 full game, and repeatable 50/$0.99, 150/$1.99 and 400/$3.99 gem packs. All cash prices are **simulated, no real money is charged**.

## Developer/release safeguards

Run `npm test` to verify all 100 original puzzles, 100 Hard variants, 15 bonus-stage IDs, game rules, music WAV generation and app integration. `npm run release:check` **intentionally fails** while mock payment/developer bypasses remain. Before an App Store launch, remove test checkout and developer controls, integrate actual verified StoreKit 2 consumables and non-consumable and test on signed iPhones. The current browser build is a playtest only.

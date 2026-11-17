# Feed the Wolf: beta testing plan

Three stages. Each uses a different build so that nobody outside the team ever sees a practice checkout, and nobody at all is charged.

| Stage | Who | Codemagic workflow | Checkout | Apple review needed |
|---|---|---|---|---|
| 1. Internal | You and people you add to the App Store Connect team (up to 100) | `ios-beta-signed` | Practice, marked TEST, no money | No |
| 2. External | Friends, family, anyone with the invite link (up to 10,000) | `ios-external-beta` | Apple's own sandbox: looks real, charges nothing | Yes, a short beta review |
| 3. Release | Everyone | not set up yet | Real purchases | Yes, full App Review |

## Stage 1: internal TestFlight (now)

1. Run **Feed the Wolf BETA · Signed iPhone IPA** in Codemagic. It uploads the build to App Store Connect.
2. In App Store Connect open Feed the Wolf, then TestFlight. Wait for the build to finish processing (usually 5 to 30 minutes).
3. If it shows "Missing Compliance", answer the encryption question. The game uses only the phone's standard HTTPS encryption.
4. Under Internal Testing, create a group, add yourself, and add the build.
5. Install the TestFlight app on your iPhone, accept the invite, install Feed the Wolf.
6. Paste the Beta App Description and What to Test from `store/LISTING.md` into TestFlight's Test Information.

### Tester instructions (send these to each tester)

> Thanks for testing Feed the Wolf!
>
> - Install **TestFlight** from the App Store, then open the invite link on your iPhone.
> - Play from Level 1. Levels 1 to 5 and the first mini-game are free.
> - At the unlock screen, use the checkout marked **TEST**. It is a practice checkout. **No payment is taken and you will not be charged.**
> - Play as far as you like. There are 110 levels.
> - Found a problem? Take a screenshot, tap the thumbnail, choose **Share Beta Feedback**, and tell us which level you were on and what happened.

### Gameplay checklist

Tick each one, or note the level and what went wrong.

**First run**
- [ ] The Failure Entertainment intro plays. First tap turns on sound and shows Skip.
- [ ] Level 1 loads and the wolf, pins and dinner are all visible without scrolling.
- [ ] Pulling a pin works on the first tap, and Undo and Hint work.

**Free section and unlock**
- [ ] Levels 1 to 5 can be finished.
- [ ] Level 6 (Feast Match) is playable for free; a 2 by 2 square makes a Wolf Howl.
- [ ] Level 7 shows the unlock screen, with the two free gifts shown.
- [ ] The TEST checkout unlocks the game and says clearly that no money was taken.
- [ ] After unlocking you are on the level you were on, wearing the Chick and Bandana.

**Mini-games (thumb feel is the main thing here)**
- [ ] 15 Dinner Dash: taps register instantly; the roasts bob smoothly.
- [ ] 28 Pipes: Test Flow fills from START, joint by joint, and drains back on a miss.
- [ ] 37 Catch the Feast: sliding on the bottom strip moves the wolf; your thumb does not cover him.
- [ ] 50 The Dinner Machine: tapping a plank tilts it; Drop! runs the meatball; the bell opens the lid.
- [ ] 59 Gear Jump: he leaps the way his head points.
- [ ] 72 Firefly Chase: the joystick appears where you touch; winnable?
- [ ] 81 Garden Delivery: tap hops forward, swipe steps sideways.
- [ ] 94 Hidden Room: you can swipe the room and see every object.
- [ ] 103 Spotlight Sneak: hold moves, release freezes.
- [ ] Losing a mini-game three times makes it ease off; Skip always works.

**Sound**
- [ ] Music plays in each location and changes in mini-games.
- [ ] Sound comes back after switching to another app and returning.
- [ ] The silent switch silences the game.

**Store and rewards**
- [ ] Gems go up for stars, every fifth level, mini-games and the daily puzzle.
- [ ] A pet, a character and an accessory can be bought with gems and worn.
- [ ] Finishing Level 22 (the Castle's last) awards the Crown trophy, with its sparkle effect.
- [ ] Trophies and the two gifts cannot be bought with gems.
- [ ] Hard Mode can be switched on after unlocking, and its levels differ.

**Saving**
- [ ] Force-quit and reopen: same level, same gems, same outfit.
- [ ] Install a newer build over the old one: progress is still there.

**Device**
- [ ] Nothing is hidden behind the notch, Dynamic Island or home bar.
- [ ] The phone does not get hot and the game does not stutter after 20 minutes.
- [ ] Turning the phone sideways does not break the layout.

### Reporting a bug

A good report has four things:
1. **Device and iOS version** (TestFlight adds these automatically if you use Share Beta Feedback).
2. **Level number** from the top of the screen, and whether Hard Mode was on.
3. **What you did, what you expected, what happened.** One sentence each.
4. **A screenshot or screen recording.**

Rate it: **Blocker** (cannot continue), **Wrong** (works but incorrectly), or **Polish** (looks or feels off).

## Stage 2: external TestFlight (prepared, not switched on)

The external build is the production code: no developer tools and no practice checkout. Testers buy through Apple's sandbox, which shows the real purchase sheet but never charges a TestFlight tester.

Before the first external build:
1. **Paid Apps agreement, tax and banking** completed in App Store Connect. Sandbox purchases do not load without them.
2. **Four in-app purchases created** in App Store Connect with the IDs in `store/LISTING.md`, each with a price and a review screenshot.
3. **RevenueCat project** with the iOS app added, the four products imported, and an entitlement named `full_game` attached to `feed_the_wolf_full_unlock`.
4. **Codemagic variable group `revenuecat_beta`** containing `FTW_RC_IOS_KEY` (RevenueCat's public iOS SDK key).
5. Run **Feed the Wolf EXTERNAL BETA** in Codemagic. It refuses to build without the key.
6. On your own phone first: buy the unlock, buy a gem pack, cancel a purchase, delete and reinstall, tap Restore purchases.
7. Only then add the build to an external group. Apple reviews the first external build; fill in Test Information and a contact email first.

What changes for testers: the unlock screen shows the real Apple purchase sheet with "[Environment: Sandbox]". They are not charged.

## Stage 3: App Store review candidate (prepared; NOT submitted)

The manual `ios-appstore-review` Codemagic workflow builds the real production
flavor (no Developer panel, practice checkout, or BETA badge), signs an IPA,
and **uploads it to App Store Connect only**. It does NOT select the build
for a version, submit anything for App Review, or make the game public.

Before triggering it, create a Codemagic group `revenuecat_production` with
the real iOS-specific **public** RevenueCat SDK key `FTW_RC_IOS_KEY`.
Never use a RevenueCat Test Store key, and never provide secret API keys.
The workflow fails closed if the iOS key is missing or has the wrong prefix.

Before **submitting** the app for review, also finish Paid Apps, tax/banking,
configure all four Apple in-app products and RevenueCat entitlement/offering,
test real purchase and restore in Apple sandbox on a physical iPhone,
confirm the resolved iOS sound-after-resume issue, upload actual game
screenshots, fill in App Store Connect metadata/privacy/age rating,
confirm nlubrick@gmail.com appears on the deployed support and privacy pages, and select **manual release**.
See `store/APP_STORE_REVIEW.md` for exact steps. The user must explicitly approve submission.

Android signed release, Play Billing and Google Play closed testing remain separate.

## Android

There is a debug APK workflow for sideloading. A signed Play build, Play Billing products and the closed test (12 testers for 14 days on a personal account) are not set up yet.

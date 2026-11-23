# Side games: brief

Status: rules approved by Oswin and built 20 November 2026. Tested locally (fake Firebase, two phones). Not yet on a real round.

## The problem
Mates play for more than the card. Testers like the scoring, but the games they actually play on the day (skins, Nassau, better ball, closest to the pin) still get worked out on paper or argued about in the bar.

## What we're building
Four side games you can switch on when you set up a round, on top of the main format (stroke play or Stableford). You can switch on any mix of them. Each one has a **How it works** link at setup that opens the explanation below, written for someone who has never played it.

The app only keeps the count (skins won, holes up, points). **It never handles money.** If you play for R10 a skin, that's between you and your mates.

## How each game works (this is the text the app will show)

### Skins
**The idea:** every hole is a prize, called a skin. Win the hole outright and you win the skin.

**How a hole is won:** the player with the lowest score on the hole wins one skin. It has to be the lowest on their own. If two or more players tie for the lowest score, nobody wins the skin.

**Carry-overs:** when nobody wins a hole, its skin carries over to the next one. So the next hole is worth 2 skins, then 3, and so on, until someone wins a hole outright and takes all of them.

**Handicaps:** if handicaps and a full stroke index are entered, skins use **net** scores (your score minus the strokes you get on that hole). Otherwise they use the strokes you actually took.

**End of the round:** if the last hole is tied, the skins still carrying over aren't won by anyone. The app shows them as "3 skins not won". Settle them however your group likes (a chip-off, split them, or leave them).

**Example (3 players):**
| Hole | Sam | Lee | Max | Result |
|---|---|---|---|---|
| 1 | 4 | 4 | 5 | Sam and Lee tie → no winner, 1 skin carries |
| 2 | 5 | 5 | 5 | All tie → 2 skins carry |
| 3 | 3 | 4 | 4 | Sam wins outright → **Sam takes 3 skins** |
| 4 | 5 | 4 | 6 | Lee wins → **Lee takes 1 skin** |

**Who can play:** 2 or more players.

### Nassau
**The idea:** three contests in one round: the **front 9**, the **back 9**, and the **full 18**. Each one is won separately, so a bad start doesn't end your day.

**With 2 players (match play):** on each hole, the lower score wins the hole; a tie halves it. Whoever wins more holes on the front 9 wins the front. The same goes for the back 9 and for all 18 holes. The app shows the running state like a club match: "Sam 2 up after 6", "All square".

**With 2 teams (when better ball is also on):** the same, but each team counts its better score on each hole.

**With 3 or more players:** match play doesn't work with 3 or more players, so it becomes the **lowest total** over each stretch: lowest front-9 total, lowest back-9 total, lowest 18-hole total. With Stableford as the main format, it's the most points instead.

**Ties:** a stretch that finishes level is a tie (halved). Nobody wins it.

**Handicaps:** net scores when handicaps and a full stroke index are entered, the same as skins.

**Example (2 players):** on the front 9, Sam wins holes 1, 3 and 7 and Lee wins holes 2 and 9. Holes 4, 5, 6 and 8 are halved. **Sam wins the front 9, 1 up.** On the back 9, Lee wins two more holes than Sam, so **Lee wins the back 9, 2 up.** Over all 18 holes that's Lee by 1, so **Lee wins the overall.** Result: Sam 1 contest, Lee 2.

**Who can play:** 18-hole rounds only (a 9-hole round has no back 9). 2 or more players, or 2 teams.

### Better ball (4BBB)
**The idea:** you play in pairs. Each of you plays your own ball, but on each hole the team only counts the **better** of the two scores. If your partner has a shocker, your par saves the hole.

**Setting up:** at setup you put players into teams of two. You need an even number of players, so 2, 4, 6 or 8.

**Scoring:**
- **Stableford main format** (the usual "4BBB Stableford"): the team scores the higher of the two players' points on each hole. The team with the most points wins.
- **Stroke play main format:** the team scores the lower of the two scores on each hole. The lowest team total wins.

**Handicaps:** each player gets their own strokes on their own holes, as usual, before the better score is picked. Club competitions usually play off a reduced handicap allowance [INFERRED: under the World Handicap System, four-ball allowances are below 100%, 85% for stroke play; check against the WHS rules before quoting a number]. The app uses the handicap exactly as you type it in, so enter the reduced one if that's how your group plays.

**Example (Stableford, one hole):** Sam scores 1 point and Lee scores 3. **The team scores 3.**

**Who can play:** 4, 6 or 8 players. (With only 2 players it's one team, which isn't a match.)

### Closest to the pin
**The idea:** on par 3s, the player whose tee shot finishes closest to the flag wins that hole's prize.

**The usual rule:** the ball must finish **on the green**. A ball closer to the flag but in the fringe or a bunker doesn't count.

**In the app:** on each par 3 there's a "Closest to the pin" line with everyone's names and a **Nobody on the green** option. Tap who won once you've had a look on the green. The app doesn't measure the distance; your group decides. Anyone in the round can set it or change it.

**At the end:** a count per player: "Lee 2, Sam 1".

**Who can play:** 2 or more players, on any par 3 in the round.

## Where it shows
- **Setup:** a "Side games" section with a switch for each game and a **How it works** link. Better ball adds a step to pick teams.
- **Hole screen:** one short line per game that's on, for example "Skins: 3 riding on this hole" or "Nassau: Sam 1 up (front)". Par 3s also get the closest-to-the-pin picker.
- **Summary:** a results card per game, under the leaderboard.
- **Share text:** the side game results are added to the message.

## Not in this batch
Presses (a new bet started by the player who's losing) · Wolf · Bingo Bango Bongo · team skins · money amounts · automatic measuring for closest to the pin.

## Decisions and why
| Decision | Why | Rejected |
|---|---|---|
| Side games sit on top of the main format | The leaderboard people already use stays as it is; games are extras | Making each game its own format |
| Count only, never money | Real-money betting is out of scope in `plans/ROADMAP.md`; keeps the app clear of gambling rules [INFERRED] | Rand amounts per skin |
| Skins tie = carry over; unclaimed at the end shown, not decided | The most common version; the app shouldn't invent a play-off | Splitting tied skins; voiding carries |
| Nassau with 3+ players uses totals, not match play | Match play is between two sides | Every pair playing their own match (too much to show on a phone) |
| Handicap used as typed for better ball | Allowances vary by club and competition; the app shouldn't guess | Applying 85% automatically |
| Closest to the pin is tapped, not measured | GPS isn't accurate enough to tell 2 m from 3 m | Measuring with the phone |

## Must never be guessed
- A missing score. A skin, Nassau hole or team score is only decided once every player involved has entered a score on that hole.
- Who was closest. The app doesn't record a winner until someone taps one.

## Technical notes (for the build)
- New fields on a round: `games` (which games are on), `team` (each player's better ball team number; Firestore can't store the pairs as nested lists), `ctp` (closest-to-the-pin winner per par 3).
- Mates who joined a round can currently only change `scores`, `claims` and `memberNames` (`firestore.rules`). For closest to the pin to work from any phone, `ctp` has to be added to that list, and **Oswin must publish the updated rules in the Firebase console** again.
- All the results are worked out from the scores, so no other data is stored. The game logic is in `src/games.js`, with tests for the examples above in `src/games.test.js` (`npm test`). The hole-screen lines and result cards are in `src/GameLines.jsx`; the How it works text is in `src/GameHelp.jsx`.

## How we'll know it works
1. Each worked example above gives the same answer in the app.
2. A 4-player round with every game on, two phones: closest to the pin set on one phone shows on the other.
3. Edge cases: a tied last hole in skins, a 9-hole round (Nassau not offered), an odd number of players (better ball not offered), handicaps without a stroke index (games fall back to strokes taken).
4. A real round with mates (Oswin).

## Built
- Setup: a Side games section with a switch and How it works for each game; games that don't fit the setup are greyed out with the reason. Better ball pairs players in order, with team buttons to move someone.
- Hole screen: a side games card (skins riding, Nassau state, better ball totals) and the closest-to-the-pin picker on par 3s.
- Summary: a card per game; the share and WhatsApp text include the results.
- `firestore.rules`: players in a round can now also change `ctp`. **Needs publishing in the Firebase console before this goes live.**
- Tested locally 20 Nov 2026: a 4-player Stableford round, all four games on. Skins (Saver 1, Lee 9, Max 5, 3 not won), Nassau (all halved), better ball (38 v 38) and closest to the pin all match the hand-counted values. Closest to the pin set on a guest's phone showed on the starter's phone.

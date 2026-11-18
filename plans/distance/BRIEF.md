# Distance to the green: brief

Status: agreed 18 November 2026; stages A and B built and tested on the fake Firebase, not yet on a real course. Privacy page and Delete are on hold on `claude/privacy-delete`.

## The problem
People who try Fore Birdies say the scoring is good, but they miss GPS distances on the course. The app has none today.

## What we're building (version 1)
On the hole screen, the distance from where you're standing to the **front, middle and back of the green**, updating as you walk. Phone GPS only, while the app is open.

- **Where greens come from**
  1. A course list built once from OpenStreetMap and shipped with the app: all ~595 South African courses (name, location), plus the green outlines and hole numbers where OSM has them.
  2. Players saving greens: on any hole without a green, a signed-in player standing on it taps **Save this green**. It's shared with everyone who plays that course. Those holes show the **middle only** (no front/back).
- **Picking the course**: at round start, courses near you first (asks for location), plus search by name. Typing your own course name still works, and that course can collect saved greens too.
- **Fixing a bad save**: any signed-in player on the green can tap **Fix this green**. Newest save wins; who saved it and when are kept. Guests can't save. Saving needs a GPS fix of ±15 m or better, and a save within 25 m of another hole's green asks "Is it the same green?" first (some 9-hole courses share greens). Holes with an OpenStreetMap green have no Save or Fix button: a mapped outline is more accurate than one GPS point; a wrong one gets fixed in OpenStreetMap.
- **Units**: metres by default, a yards switch remembered per phone.

## Not in version 1
Measuring your shot · hazards, bunkers, layups · a satellite map to tap · a paid course database · distances while the app is in the background or the screen is off · courses outside South Africa (the list is SA only).

## Decisions and why
| Decision | Why | Rejected |
|---|---|---|
| OSM + player saves | Rough count: ~52 of 595 SA courses in OSM have 18 greens mapped. But a green is only usable when OSM also says which hole it is: the built list has 292 named courses, 62 with numbered greens, 37 with all 18 (rebuilt 18 Nov 2026 from current data; the first build came from a lagging backup server) | OSM only (most testers see nothing); paid database (monthly cost, needs a server); private saves (everyone re-saves every green) |
| Stand on the green to save | Free, no map service, works offline then syncs | Satellite map tap (map provider, terms, bigger build); kept as a later idea |
| Course list shipped with the app | The free OSM servers refused three requests in a row on 18 Nov 2026, so the app can't depend on them on the course | Live OSM lookups; typed names only (spelling variants split one course into many) |
| Newest save wins, signed-in only | Simple, the course corrects itself over time | Averaging saves; first save sticks |

## Must never be guessed
- **A green position.** No distance is better than a wrong one. If a hole has no green, show "No green saved yet", never an estimate.
- **Which OSM green belongs to which hole.** Use OSM's hole numbers; if a green can't be matched to a hole for sure, leave that hole for players to save.

## Changes outside the app code
- New shared data in Firebase (course greens), with access rules: anyone signed in reads, signed-in non-guests save. The rules need publishing in the Firebase console.
- The privacy page (on hold) must mention location: used on your phone to work out distances, not stored, except the green position when you save one, with your name on it.
- OSM data is ODbL: the app must show "© OpenStreetMap contributors" where course data is used.

## How we'll know it works
1. On a desk: fake GPS positions in the browser give the right distances (checked against a known distance).
2. On the fake Firebase: saving, fixing and guest-refusal work, and two "phones" see the same saved green.
3. On a real course (Oswin): an OSM-mapped course shows front/middle/back; an unmapped course gets greens saved during the round, and a second phone sees them. Distances match a rangefinder or the yardage markers to within about 5–10 m.

## Built
- `scripts/build-courses.mjs` (`npm run courses`) builds `public/courses/` from OSM; rerun now and then to pick up new mapping, and check the printed map date (backup servers can lag). It joins a course OSM draws as several same-name areas (Bellville, Strand), and keeps old course ids working when a course is redrawn. The files are cached for offline use (~512 KB).
- Hole screen: `src/Distance.jsx`; maths in `src/geo.js`; shared saves in `src/data.js` (`greens/{course}/holes/{n}`) and `firestore.rules`.
- Tested on the fake Firebase with fake GPS: front/middle/back on Glenvista hole 1 (137/150/161 from 150 m), OSM pars filled in, courses near me, save + second phone (guest) sees it, yards, weak fix, too far, next-to-another-green question; 13/13 access-rule checks.

## Open flags
- The course list includes a few driving ranges tagged as golf courses in OSM (e.g. Wits Golf Academy Driving Range).
- `firestore.rules` here doesn't yet have the stage 4 claims change from `claude/privacy-delete`; whichever merges second must carry both before the rules are published.
- Delete my account (on hold) should also clear the name on greens you saved.
- Which courses do the testers play? Check those against the OSM count before building.
- Phone GPS accuracy on the course is unknown until the real-course test.
- iPhone home-screen apps ask for location again more often than Android does [INFERRED]; check on the real test.

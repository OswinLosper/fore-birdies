# Roadmap

## Version 1 (now)
- [x] React + Vite project, ported from `prototype/fore-birdies.html`
- [x] Installable on the home screen, works offline
- [x] Publish on Vercel (fore-birdies.vercel.app)
- [ ] Test a real round on Android and iPhone, including offline on the course
- [x] Accounts, rounds saved to a profile, live shared rounds with join codes (Firebase)
- [x] Offline-first score saving that syncs when signal returns

## Version 2 (now)
- [x] GPS distance to the green: OpenStreetMap greens where mapped, players save the rest (see `plans/distance/BRIEF.md`)
- [ ] Test distances on a real course, mapped and unmapped, on Android and iPhone
- [x] Hole map: Esri satellite view, tap for distances, tap to save a green (see `plans/hole-map/BRIEF.md`)
- [x] Stroke index per hole (from OpenStreetMap or typed in) and playing handicaps: strokes on the hardest holes, net Stableford, net/gross stroke play
- [x] Side games: skins, Nassau, better ball, closest to the pin (see `plans/side-games/BRIEF.md`)
- [x] Stats: rounds, averages, best rounds, how your holes go, par 3/4/5 averages, birdies, head to head; a Rounds / Stats tab bar
- [x] Mates and crews: saved mates with handicaps, named crews, tap a crew to add everyone to a round; a Mates tab
- [ ] Two mates with the same name (two Lees): tell them apart in head to head and on the card

## Later ideas
- Measure my shot; hazards and layups; a satellite map to save greens from
- More side games (presses, Wolf, Bingo Bango Bongo), reactions
- More stats: trend over the last 10 rounds, front 9 v back 9, best streak, side game totals, per-course stats
- App store versions via Capacitor (Google Play US$25 once, Apple US$99 a year)

## Out of scope
- Real-money betting
- Club tournament management (ForeScore's lane)

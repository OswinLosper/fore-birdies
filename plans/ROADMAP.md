# Roadmap

## Version 1 (now)
- [x] React + Vite project, ported from `prototype/fore-birdies.html`
- [x] Installable on the home screen, works offline
- [ ] Publish on Vercel or Netlify
- [ ] Test a real round on Android and iPhone, including offline on the course
- [ ] Accounts, rounds saved to a profile, live shared rounds with join codes (choose Supabase or Firebase first)
- [ ] Offline-first score saving that syncs when signal returns

## Version 2 ideas
- Course database with GPS distance to the green. Use OpenStreetMap where a course is mapped, and let players pin greens where it isn't (needs the backend). Check OSM coverage of South African courses first.
- Crews, side games (skins, Nassau), bragging stats, reactions
- Handicaps and stroke index for Stableford
- App store versions via Capacitor (Google Play US$25 once, Apple US$99 a year)

## Out of scope
- Real-money betting
- Club tournament management (ForeScore's lane)

# Hole map: brief

Status: stage 1 built and tested locally 18 November 2026 (fake GPS, fake Firebase, real Esri photos). Not yet on a real course.

## The problem
Testers compare Fore Birdies with apps like SwingU, whose hole screen is a satellite photo of the hole with the flag, markers and a big distance. Ours shows numbers only.

## What we're building (stage 1)
- **"Hole map" button** on the "To the green" card opens a full-screen satellite view of the current hole. **"Back to scores"** returns you. The scoring screen itself doesn't change.
- **The view**: satellite photo, turned so the tee is at the bottom and the green at the top where the course list knows the tee (OpenStreetMap hole lines); north-up, framed on you and the green, everywhere else. A flag on the green, a dot for you, a line from you to the green with its distance.
- **Tap anywhere** for two distances: you → that spot, and that spot → the green (layups, carries).
- **Save or fix a green by tapping the photo**, from anywhere, including at home before the round. Same rules as saving by standing on it: signed-in players only, newest save wins, who saved it is recorded. Holes with an OpenStreetMap green can't be overridden.
- Metres or yards, as set on the card.

## Not in stage 1
Bunkers, water and tee markers (stage 2) · stroke index · plays-like, wind, elevation · map instead of the scorecard · offline map photos.

## Decisions and why
| Decision | Why | Rejected |
|---|---|---|
| Esri satellite photos (ArcGIS Location Platform) | 2 million tiles a month free; pay-as-you-go is off by default, so going over stops the map rather than billing (sources below) | Mapbox (probably needs a card), Google (needs a card), MapTiler (free plan non-commercial, low-res satellite) |
| Map behind a button | Scorecard stays fast, light on data, works with no signal; the map loads only when opened | Map on the scores screen; map as the hole screen |
| Tap-to-save in stage 1 | ~230 of 292 courses have no green distances; tapping lets a course be set up from home | Map only first |
| Esri World Imagery tiles (`ibasemaps-api.arcgis.com/.../World_Imagery/MapServer/tile`) | The 'static basemap tiles' service only offers satellite *labels*, not the photo itself (checked 18 Nov 2026); the key opens World Imagery | — |
| MapLibre for the map | Can turn the map tee-to-green; loaded only when the map opens, so the app start stays fast | Leaflet (lighter, but can't rotate the map) |

## Must never be guessed
- A green position: a tap-saved green is exactly where the player tapped; nothing is estimated.
- The tee: if the course list has no tee for a hole, the map is north-up. No guessed orientation.

## Constraints
- **No signal, no photos**: Esri's terms don't allow storing photos ahead of time, only the browser's normal short-term cache while connected [per Esri's terms summary and forum answers; check the current terms at build]. The numbers keep working offline.
- **The key**: a public key in the app, limited to fore-birdies.vercel.app and localhost in the Esri dashboard, with only the basemap permission. Keep pay-as-you-go **off**.
- **Credit**: "Powered by Esri" and the imagery providers on the map, plus the OpenStreetMap credit.
- **Data and battery**: a hole map uses more of both than the numbers; it loads only when opened.

## Oswin's part
1. Create an ArcGIS Location Platform account (free) at location.arcgis.com. Note whether it asks for a card.
2. Create an API key with only the basemap permission, limited to `fore-birdies.vercel.app` and `localhost`.
3. Put it in `.env.local` as `VITE_ESRI_KEY=…` (both the main checkout and the worktree) and in Vercel's project environment variables (Production and Preview). Don't paste it in chat.

## How we'll know it works
1. On the desk with fake GPS: map opens on Glenvista hole 1 turned tee-to-green, flag on the green, line distance matches the card, tap distances add up.
2. Tap-to-save on a course with no greens; a second phone sees it on the card and the map.
3. Offline: the map says it needs signal, and the card still shows distances.
4. Real course (Oswin): the map lines up with where you're standing; distances match the card.

## Built
- `src/HoleMap.jsx` (loaded only when opened; its map library isn't stored offline), opened from **Hole map** on the "To the green" card (`src/Distance.jsx`). Holes keep their tee in the course files (`scripts/build-courses.mjs`), which also now carries old course ids forward.
- Tested locally: Glenvista hole 1 turned tee-to-green with live Esri photos; Front/Middle/Back match the card (142/150/160); tap shows 97 m + 57 m to green; no Fix on a mapped green; Test Links hole 3 saved by tapping (in the database, card shows Middle 40, "Fix this green"); "same green?" question; offline message.

## Open flags
- Esri sign-up didn't ask for a card (Oswin, 18 Nov 2026); pay-as-you-go is disabled.
- The Esri key expires; note the date and renew it before then.
- Vercel preview links aren't on the key's allowed list, so the map is blank on previews.
- The privacy page (on hold) must mention that map photos come from Esri, which sees the area being viewed and your internet address.

## Sources
- Esri pricing and free tier: https://developers.arcgis.com/pricing · https://location.arcgis.com/pricing/
- Esri pay-as-you-go off by default / services stop past the free tier: https://developers.arcgis.com/documentation/mapping-apis-and-services/deployment/accounts/ · https://location.arcgis.com/help/billing/
- Esri offline/caching terms summary: https://downloads2.esri.com/arcgisonline/docs/tou_summary.pdf
- Mapbox free tier: https://superdupr.com/blog/mapbox-pricing
- MapTiler terms (free plan non-commercial): https://www.maptiler.com/cloud/terms/
- Google Map Tiles billing: https://developers.google.com/maps/documentation/tile/usage_limits

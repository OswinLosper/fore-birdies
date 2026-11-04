# Fore Birdies

Score it. Share it. Rub it in.

A social golf scorecard for casual rounds with your mates. Start a round, keep score hole by hole, celebrate birdies, and send the leaderboard to WhatsApp. It installs on a phone's home screen and works without signal.

## Run it on your computer

You need Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Open the address it prints. To try it on your phone, connect to the same Wi-Fi and open the "Network" address.

## Build for the web

```bash
npm run build
npm run preview
```

`build` puts the finished app in `dist/`. `preview` serves that folder so you can check it before publishing. The home-screen install and offline mode only work in the built version, not in `npm run dev`.

## Publish it for free

Either of these works and redeploys automatically every time you push to GitHub:

- **Vercel:** "Add New Project", pick this GitHub repo, keep the detected Vite settings, deploy.
- **Netlify:** "Add new site", pick this repo, build command `npm run build`, publish directory `dist`.

## Install on a phone

- **Android (Chrome):** open the site and tap **Install app**.
- **iPhone (Safari):** tap **Share**, then **Add to Home Screen**.

## Project layout

| Path | What it is |
|---|---|
| `src/App.jsx` | Which screen shows, and saving rounds |
| `src/screens/` | Home, New round, Scorecard, Leaderboard |
| `src/scoring.js` | Stroke play and Stableford maths, share text |
| `src/storage.js` | Saving to the phone (browser storage, key `fore-birdies-v1`) |
| `src/InstallTip.jsx` | The "put it on your home screen" card |
| `public/` | Icons. Run `npm run icons` after changing `public/icon-source.svg` |
| `prototype/` | The original single-file prototype, kept for reference |
| `plans/` | Handoffs and the roadmap |

Scores are stored on each phone only for now. Shared live rounds come with the backend; see `plans/ROADMAP.md`.

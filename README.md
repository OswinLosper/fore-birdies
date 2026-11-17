# Fore Birdies

Score it. Share it. Rub it in.

A social golf scorecard for casual rounds with your mates. Start a round, keep score hole by hole, celebrate birdies, and send the leaderboard to WhatsApp. It installs on a phone's home screen and works without signal.

## Run it on your computer

You need Node.js 20.19 or newer, and a `.env.local` with the Firebase keys (copy `.env.example`; the values are in Firebase console → Project settings → Your apps).

```bash
npm install
npm run dev
```

Open the address it prints. To try it on your phone, connect to the same Wi-Fi and open the "Network" address.

### Test without touching the real Firebase

A fake Firebase can run on your Mac, with throwaway accounts and data. It needs Java 21 (`brew install openjdk@21`). Run these in two terminals:

```bash
PATH="/opt/homebrew/opt/openjdk@21/bin:$PATH" npm run emulators
```

```bash
npm run dev:emu
```

The emulator's sign-in emails aren't sent. They're listed at `http://127.0.0.1:9099/emulator/v1/projects/demo-fore-birdies/oobCodes`.

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
| `src/screens/` | Sign in, Home, New round, Join a round, Scorecard, Leaderboard |
| `src/firebase.js` | Connects to Firebase, with offline saving on |
| `src/auth.js` | Sign-in: Google, email link, email and password |
| `src/data.js` | Reading and saving rounds and courses in Firestore, and the one-off import of old phone rounds |
| `firestore.rules` | Who can read and change what in the database |
| `src/scoring.js` | Stroke play and Stableford maths, share text |
| `src/storage.js` | The pre-accounts phone storage (key `fore-birdies-v1`), read once for the import |
| `src/InstallTip.jsx` | The "put it on your home screen" card |
| `public/` | Icons. Run `npm run icons` after changing `public/icon-source.svg` |
| `prototype/` | The original single-file prototype, kept for reference |
| `plans/` | Handoffs and the roadmap |

Rounds are saved to each person's account in Firebase (Johannesburg) and work offline. Mates join a round with its 6-character code or a shared `?join=CODE` link, as guests or with an account. See `plans/backend/BRIEF.md` for how it all works.

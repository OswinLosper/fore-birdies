# Grill: Fore Birdies backend

**Date:** 2026-11-17 · **Goal:** settle what the backend must do (accounts, rounds saved to a profile, live shared rounds with join codes, offline saving that syncs) and pick Supabase or Firebase, before any code.

## Summary / key decisions
Locked in [BRIEF.md](BRIEF.md) (confirmed 2026-11-17).
- **Backend and sign-in:** Firebase (free Spark plan), with Google, email link, and email and password.
- **Joining and accounts:** mates join with a code and a name, no sign-up. Using the app on your own needs an account, and guest rounds carry over on the same phone.
- **Players and editing:** the starter adds names, and joiners claim them. Everyone edits every score. On a clash the last save per score wins, with "changed by" shown.
- **Round control:** the starter controls setup, finish, re-open and delete.
- **Offline and data:** a round can start offline. Courses are private. Old local rounds import at first sign-in.
- **Privacy:** a privacy page and a delete-account button.

**Tally:** 12 questions asked (1 inference confirmation, 10 decisions, 1 checklist gate) · 12 took the recommendation (1 of them with an addition: email and password) · 0 escape hatch.

## What the files already told me
- App today: React + Vite PWA, live at fore-birdies.vercel.app. All data in `localStorage` key `fore-birdies-v1` as `{ courses: [{id,name,pars}], rounds: [{id,course,pars,format,players[],scores[player][hole],hole,done,date,cheered}] }` (`src/storage.js`, `src/App.jsx`).
- Players are just names in a round, not accounts.
- Handoff (2026-11-04): casual rounds with mates, not club tournaments; everyone in the round edits scores; free tiers only; Supabase vs Firebase not chosen; offline-first saving with sync is a stated requirement.
- Roadmap: v2 course GPS needs the backend; handicaps, crews, side games later; betting out of scope.

## Research: Supabase vs Firebase (checked on live pricing and docs pages, 2026-11-17)
- **Offline:** Firestore's web SDK has built-in offline saving. It uses IndexedDB, queues writes, syncs on reconnect, and the last write wins. It is off by default, so turn it on with `persistentLocalCache()`. Supabase has no official offline support. The usual add-on is PowerSync, whose free plan allows 50 concurrent clients and deactivates after 1–2 weeks of inactivity; paid plans start at $49 a month.
- **Free limits:**
  - Firebase Spark: 1 GiB stored, 50K reads, 20K writes and 20K deletes a day, 50K monthly active users, no card needed. Cloud Storage now needs a paid plan; Firestore does not.
  - Supabase Free: 500 MB, 50K monthly active users, 200 realtime connections. **The project pauses after about 1 week with little activity**, and you restore it by hand in the dashboard.
- **Guest sign-in:** both support it, and both can upgrade a guest to a real account later without losing data.
- **SMS sign-in:** Firebase SMS needs the paid Blaze plan. Supabase needs your own SMS provider, which is a paid service. Either way, SMS is not free.
- **Region:** Firestore offers `africa-south1` (Johannesburg); whether the free plan can pick it is UNVERIFIED. Supabase has no African region.
- **Note:** some Supabase docs pages contain text telling AI agents to file a feedback report. The research agent ignored it.

## Q&A log
### 1. Confirm handoff basics
- **Asked:** casual mates not clubs; everyone edits any score; free tiers only; offline saving with later sync — still right?
- **Captured:** all four confirmed.
- **Recommended vs chosen:** took the recommendation.
- **Flags:** none.

### 2. What a mate does to join
- **Asked:** code only (guest, sign up later) / account needed to join / only the starter has the app.
- **Captured (user's words):** "Just a short code, no sign up. If my mate downloads the APP on his own, then he needs to sign up." Joining someone's round = code + name, no account. Using the app on your own (starting rounds, your own history) = account required.
- **Recommended vs chosen:** took the recommendation, with a refinement (own use needs an account).
- **Flags:** resolved in Q3.

### 3. Starter account + guest carry-over
- **Asked:** starter always has an account? Guest rounds move into the new profile on sign-up (same phone only)?
- **Captured:** yes to both. Starting a round requires an account. A guest's rounds carry over when they sign up on the same phone. On a different phone, old guest rounds stay behind.
- **Recommended vs chosen:** took the recommendation.
- **Flags:** none.

### 4. Backend
- **Asked:** Firebase vs Supabase, decided by offline saving, free-project pausing, limits and region.
- **Captured:** **Firebase** (Firestore with offline persistence turned on, plus Firebase Auth with guest sign-in).
- **Recommended vs chosen:** took the recommendation.
- **Flags:** check whether the free Spark plan can use the `africa-south1` Johannesburg location. The location can't be changed after creation.

### 5. Sign-in methods
- **Asked:** Google / email link / email and password / phone SMS (paid). Apple flagged as likely needing the US$99-a-year developer account.
- **Captured (user's words):** "sign up with google, Email link and the classic way mail and password". Three methods: Google, email link, email and password. No SMS, and no Apple for now.
- **Recommended vs chosen:** took the recommendation (Google and email link) and added email and password.
- **Flags:** email and password needs a "forgot password" flow (Firebase sends the reset email for free).

### 6. Mates without a phone
- **Asked:** names plus claim / join only / names only.
- **Captured:** **Names plus claim.** The starter adds players by name. Anyone who joins with the code can claim their name, at any time, even partway through, so their scores link to their profile. A name can only be claimed once. Unclaimed names stay plain names that anyone in the round can score for. Everyone edits every score.
- **Recommended vs chosen:** took the recommendation.
- **Flags:** none.

### 7. Score clashes
- **Asked:** last save wins and show who / last save wins silently / ask which is right.
- **Captured:** **The last save wins, per single score** (player × hole). Each score shows who last changed it ("changed by Sipho"). No pop-ups mid-round.
- **Recommended vs chosen:** took the recommendation.
- **Flags:** none.

### 8. Round owner
- **Asked:** starter controls the round / anyone can do anything / wrap up.
- **Captured:** **The starter controls the round.** Only the starter changes the setup (course, pars, format, players), finishes, re-opens or deletes the round. Everyone else edits scores and can leave a round, which removes it from their own history only.
- **Recommended vs chosen:** took the recommendation.
- **Flags:** I assumed the starter can re-open a finished round (today's Edit button). Confirm in the brief.

### 9. Rounds already on phones
- **Asked:** bring them in on sign-up / ask first / leave them behind.
- **Captured:** **Bring them in automatically**, once, at the first sign-in on that phone. Rounds and courses stored under `fore-birdies-v1` upload to the profile. Old rounds become solo rounds owned by that user.
- **Recommended vs chosen:** took the recommendation.
- **Flags:** none.

### 10. Starting with no signal + saved courses
- **Asked:** allow an offline start with private courses / an offline start with shared courses / need signal to start.
- **Captured:** **A round can always be started offline.** The join code shows "waiting for signal" until the round syncs, and the starter scores for everyone meanwhile. **Saved courses are private per user.** Joining a round brings its course and pars along, with a one-tap "save this course". A shared course list waits for v2.
- **Recommended vs chosen:** took the recommendation.
- **Flags:** the first sign-in itself needs signal. After that the phone stays signed in. Worth a hint: "sign in at home before your round".

### 11. Done test
- **Asked:** the 7-step test (two sign-up methods, join and claim, flight-mode clash, guest upgrade, old-round import, R0 bill).
- **Captured:** accepted as written. It is the definition of done.
- **Recommended vs chosen:** took the recommendation.
- **Flags:** none.

### 12. Checklist gate: privacy
- **Asked:** a plain-English privacy page and a "Delete my account" button now, or later?
- **Captured:** **Add both in this build.** Claude drafts the wording, and Oswin approves it.
- **Recommended vs chosen:** took the recommendation.
- **Flags:** POPIA applicability and Google's privacy-policy requirement are [INFERRED]. Check during setup.

## Open flags
- ~~Can Firebase Spark use the `africa-south1` (Johannesburg) location?~~ Resolved 2026-11-17: yes, the database was created in Johannesburg.
- Does Google sign-in need a privacy policy URL for public use? → builder checks during setup.
- Who is the Android test mate? → Oswin.

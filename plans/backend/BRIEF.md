# Brief: Fore Birdies backend (accounts + live shared rounds)

**Confirmed by Oswin:** 2026-11-17 · **Notes behind it:** [261117_GRILL_backend.md](261117_GRILL_backend.md)

This file is the work instruction. A builder starts here, not from the chat.

## The output
Fore Birdies gains accounts and live shared rounds, built on **Firebase (free Spark plan)**: Firebase Auth plus Firestore with offline persistence turned on (`persistentLocalCache`). Scores save on the phone with no signal and sync when signal returns.

## Who it's for
Casual rounds with mates (South Africa), 2–8 players per round. It is not for clubs or tournaments.

## Decisions
| Area | Decision | Why |
|---|---|---|
| Backend | Firebase, not Supabase | Offline saving and sync are built in and free. It never pauses. Spark needs no card. It has a Johannesburg location. Supabase needs PowerSync or hand-built sync, and free Supabase projects pause after about 1 week. |
| Joining a round | Short code and a name, no sign-up (Firebase anonymous auth) | No friction on the first tee |
| Own use | Starting rounds and keeping a history needs an account. The starter always has one. | Oswin: "If my mate downloads the APP on his own, then he needs to sign up" |
| Guest upgrade | A guest's rounds move into their profile when they sign up **on the same phone** (link the anonymous account) | Nobody loses rounds already played. On another phone, guest rounds stay behind. |
| Sign-in | Google, email link, email and password (with a forgot-password reset) | All free. No SMS (paid plan), no Apple (likely needs the US$99/yr developer account [INFERRED]). |
| Players | The starter adds names. Joiners **claim** a name at any time, and each name can be claimed only once. Unclaimed names can be scored by anyone. | Works with one phone or eight, and with dead batteries |
| Editing scores | Everyone in the round edits every score | Social |
| Score clashes | The last save wins **per single score** (player × hole), and each score stores and shows who last changed it ("changed by Sipho") | No mid-round pop-ups, and nobody is fooled silently |
| Round control | Only the starter changes the setup (course, pars, format, players), finishes, re-opens or deletes the round. Others can leave, which removes it from their own history only. | A mis-tap can't wipe the group's card |
| Offline start | A round can always be created offline. The code shows "waiting for signal" until it syncs, and the starter scores for everyone meanwhile. | No signal at the first tee is common |
| Courses | Private per user. Joining a round brings its course and pars along, with a one-tap "save this course". | A shared list waits for the v2 course database |
| Existing data | At the first sign-in on a phone, the `fore-birdies-v1` localStorage rounds and courses upload once into the profile as solo rounds | Nothing is lost |
| Privacy | A short plain-English privacy page (what is stored, why, where, how to delete) plus a "Delete my account" button. Claude drafts the wording and Oswin approves it. | POPIA and Google sign-in setup [INFERRED] |

## Not doing now
SMS or Apple sign-in · a shared course list · GPS distances · handicaps · crews and side games · app store versions · betting · any paid Firebase plan or card on file.

## Must never be guessed
- **Never put the app on a paid plan or add a card.** If a feature needs Blaze, stop and ask.
- **The Firestore location is permanent.** It was set to `africa-south1` (Johannesburg) on 2026-11-17, confirmed by Oswin.
- **No scores lost silently.** An unsynced score must never be dropped. Clashes resolve only by the last-save rule above.
- **Privacy wording** is drafted for Oswin's approval, never published as-is.
- Any account creation, Firebase project setup or API key handling is done by Oswin or with his OK at each step. Keys go in env config, never in the chat.

## How it will be verified (definition of done)
1. Oswin signs up with Google on his iPhone. A mate signs up with email and password on an Android.
2. Oswin starts a 9-hole round with 4 names. Two phones join with the code, and each claims a name.
3. Halfway through, both phones go into flight mode and keep scoring, with one deliberate clash on the same hole.
4. Flight mode off: within a minute, both phones show the same card, and the clash shows "changed by".
5. A guest joins with only the code, signs up later on that phone, and the round appears in his profile.
6. Old rounds on the phone appear in the profile after first sign-in.
7. Firebase is still on the free Spark plan with no card, and the bill is R0.

## Open items for the builder
- ~~Confirm the Spark plan can use `africa-south1`.~~ Done: the project `fore-birdies` is on Spark with Firestore in `africa-south1`. Auth providers are Email/Password (+ email link), Google and Anonymous. The connection was checked on 2026-11-17 and is blocked by production rules, as expected.
- Confirm whether Google sign-in needs a privacy policy URL for public use.
- Design the Firestore security rules so only round members (starter plus joiners holding the code) can read or write a round, and only the starter can change setup or delete.
- Pick who the test mate is (Oswin).

# Handoff: Fore Birdies, version 1 build

**Generated:** 2026-11-04  ·  **Chain:** fore-birdies (seq 1)  ·  **Branch:** main (new repo)  ·  **Mode:** summary

## Source transcript (the complete record)
- **Full session transcript:** a claude.ai chat, not a Claude Code session, so there is no `.jsonl` on disk. The user can reopen it in claude.ai (chat about naming, logo and planning Fore Birdies, 4 Nov 2026).
- **Transcript landmarks** (search the chat for these phrases):

  | What it covers | Search phrase | Why it matters |
  |---|---|---|
  | Name clash found with a South African competitor | `"ForeScore (Pty) Ltd"` | Explains why the name and positioning avoid club tournaments |
  | Version 1 feature list | `"Version 1: the must-haves"` | The agreed scope |
  | Tech and build order | `"How it's built (low-budget option)"` | Stack and sequencing |
  | Prototype features and gaps | `"What it doesn't do yet"` | What the prototype covers |

## The Goal
Fore Birdies is a social golf scorecard app for casual rounds with mates, built by Oswin (based in South Africa, some coding knowledge) on little to no budget. A group starts a round, everyone keeps score together on their phones, birdies get celebrated by a mascot, and the final leaderboard is shared to WhatsApp. Code lives in Oswin's own GitHub repo.

## Where We Are
- A working single-file prototype exists: `prototype/fore-birdies.html` (vanilla HTML/CSS/JS, no build step). It's also hosted as a claude.ai artifact for testing on a phone.
- Prototype features: course setup (name, 9 or 18 holes, tap to cycle par 3/4/5 per hole, courses saved for reuse); stroke play or gross Stableford (2 pts for par, +1 per stroke under, 0 floor); up to 8 players; per-hole score entry with plus/minus starting at par; running totals; hole strip to jump between holes; birdie-or-better celebration overlay shown when leaving the hole; leaderboard, full scorecard table, WhatsApp share (wa.me link) and Web Share API; round history and resume; delete round.
- Prototype storage is `localStorage` under the key `fore-birdies-v1`, so data lives on one phone only. There are no accounts and no syncing.
- Light and dark mode via CSS variables on `:root`.
- The repo has just been created; nothing has been committed from this session yet.

## What We Tried
- **Name "Birdie Book"** → abandoned: an existing iPhone app "BirdieBook: Golf Tracker" does golf scoring, and "birdie book" is also a generic term for course guides.
- **Name "Tee Sheet"** → abandoned: an industry term for tee-time booking software, crowded, and misleading for a scorecard app.
- **Name "Fore Score"** → abandoned: forescore.co.za is ForeScore (Pty) Ltd, a South African golf tournament scoring app (photo scorecard submission, live standings, Clubmaster partnership). Same name, same country, same category.
- **Name "Fore Birdies"** → kept: no app found with this name; only a US charity tournament ("Birdies Fore Birdies") and a podcast ("Fore The Birdies"). App store, CIPC trademark and domain checks are still to be done by the user.
- **Logo concepts** (four birds, bird on flag, golf ball bird, "4" monogram) → bird on flag kept as the app icon, golf ball bird kept as the mascot.

## Key Decisions
| Decision | Chosen | Rejected alternative | Rationale |
|---|---|---|---|
| Positioning | Casual, social rounds with mates | Club tournament management | That's ForeScore's lane, and much more complex |
| Who edits scores | Everyone in the round | One scorekeeper | More social |
| App type | Installable web app (PWA) | Native app stores first | Avoids developer fees; works on iPhone and Android |
| Backend (planned) | Supabase or Firebase free tier | Not yet chosen between the two | Both cover sign-in, saved rounds and live sync |
| Hosting (planned) | Vercel or Netlify, linked to GitHub | — | Free, auto-deploys on push |
| Framework (suggested) | React with Vite | — | Suggested only; not confirmed by the user |
| Courses | User enters par per hole once, saved | Course database | Free and simple for v1 |
| Stableford | Gross points, no handicaps in v1 | Handicap and stroke index | Kept simple; handicaps later |
| Real-money betting | Out of scope | — | Legal and payment headaches |

## Evidence & Data
- Brand colours: fairway green `#1F5D3A`, sunny yellow `#F2C230`, coral accent `#FF7A59`, dark green `#143D26`, light background `#F3F6F1`.
- Fonts: Fredoka 600 (headings, wordmark), Nunito (body), from Google Fonts.
- Tagline: "Score it. Share it. Rub it in."
- Icon and mascot SVGs are inline in `prototype/fore-birdies.html` (constants `FLAG` and `MASCOT`).

## User Feedback
- Prefers plain, simple explanations and short steps.
- Wants to "just get a working app up" before adding features.
- Chose to skip on-course testing for now and set up the repo first.
- Budget matters: favour free tiers and avoid paid services.

## Where We're Going
- The prototype is not yet in a proper project structure (no framework, no build, no repo history).
- The app is not yet deployed to free hosting or installable as a PWA (no manifest, no service worker, no offline cache).
- Accounts, rounds saved to a profile, and live shared rounds with join codes are not yet implemented; they depend on choosing Supabase or Firebase.
- Offline-first score saving with sync when signal returns is a stated requirement for the shared version.
- Version 2 ideas (crews, side games such as skins and Nassau, bragging stats, reactions) are out of scope for now.

## Routing hint
- **Ambiguity:** low for moving the prototype into a project, deploying and adding PWA support. Medium for the backend and live sync, where a short planning step is worthwhile first.

## Suggested skills for the next session
- `/bb-grill-me` — before the backend step, to settle Supabase vs Firebase and the data model.
- `/bb-handover` — at the end of the next session, to keep this chain going.

## Context manifest
**Files & folders** (once the user copies them into the repo)
- `prototype/fore-birdies.html` — the working v1 prototype; the starting point for the real app.
- `plans/handoffs/261104_HANDOFF_fore-birdies-v1.md` — this file.

**Artifacts produced this session** (claude.ai, the user's account)
- https://claude.ai/artifact/2XZdaVjKz3oBV2aKBFUby1 — hosted prototype for phone testing.
- https://claude.ai/artifact/4UmZEX2Jk5HyGqZZDfHPgx — logo concepts canvas, plus home screen and birdie screen mockups.

**Research & sources**
- https://forescore.co.za — the South African competitor to stay distinct from.
- https://appadvice.com/app/birdiebook-golf-tracker/6746895382 — why "Birdie Book" was dropped.

**Related handoffs (chain)**
- _none, this is seq 1_

---

## Quick Start — paste this into the next session
```
Read this handoff: plans/handoffs/261104_HANDOFF_fore-birdies-v1.md (chain fore-birdies, seq 1).
It describes a session you did not see. Treat EVERY claim in it as context to
verify against the live code — not as fact to trust blindly. Read
prototype/fore-birdies.html and each item in the Context manifest before acting.
The full original conversation is a claude.ai chat and isn't on disk.
The next task is: turn the prototype into a proper project, deploy it for free,
and make it installable on a phone's home screen.
Then wait for my instructions before taking any action.
```

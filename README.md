# Project Showcase — CSCI-UA 102

A live, shared submission table for the Data Structures extra-credit
project. Runs as a static site (GitHub Pages) backed by Firebase Firestore
for real-time shared data.

## What's in this repo

- `index.html` — page structure
- `style.css` — all styling (dark theme, starfield background)
- `script.js` — app logic, wired to Firestore
- `firebase-config.js` — your Firebase project's web config
- `firestore.rules` — security rules (paste into the Firebase console)

## How data is split (and why)

- **`submissions` collection — public.** Team name, description, link.
  This is the only thing the page ever displays or reads. No names, no
  NetIDs — nobody's personal info sits in a public page just because
  they're on a team.
- **`rosters` collection — private.** Names + NetIDs, one document per
  team. `allow read: if false` in the rules means **no client can ever
  read this — not the public page, not even the team that submitted it.**
  You see it only by opening Firestore Database → Data in the Firebase
  console (which requires your login), for grading.
- **Submissions are immutable.** Once a team is created, nobody —
  including that team — can edit or delete it from the site. This is
  what stops one team from (accidentally or otherwise) overwriting
  another team's entry, without needing logins or per-team secret codes.
  If a team needs a correction, that's a manual edit for you in the
  Firebase console (Firestore Database → Data → submissions →
  the team's document → edit the field directly).

## Setup

1. Firebase project + Firestore already set up (done).
2. Paste the contents of `firestore.rules` into **Firestore Database →
   Rules** in the console, and click Publish.
3. Push these files to your GitHub repo, main branch. GitHub Pages picks
   up the change automatically once it's already enabled.

## Notes

- There's no voting/leaderboard. Ranking students' projects against each
  other without real logins made ballot-stuffing trivial (anyone can open
  an incognito tab and vote again under a different typed NetID) — rather
  than pretend that number was trustworthy, we dropped it. The table is a
  plain, live, shared submission list, newest first.
- There's still no real authentication anywhere in this app — NetID entry
  in the member fields is self-reported, same as before. That's fine here
  since that data is private (grading-only) and never displayed or acted
  on publicly.

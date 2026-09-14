# Project Showcase — CSCI-UA 102

A read-only, live-updating showcase of extra-credit projects. Students
submit via a Google Form; you (the TA) add approved entries through a
private admin page. The public page just displays what's been added —
no public write access, no accounts needed, no bugs to chase from a
public form.

## Files

- `index.html` / `app.js` — the public page. Read-only card gallery.
- `admin.html` / `admin.js` — **your** private page for adding entries.
  Not linked from the public page anywhere — bookmark the URL.
- `background.js` — the shared starfield/constellation animation.
- `firebase-init.js` — shared Firebase setup, used by both pages.
- `firebase-config.js` — your Firebase project's web config.
- `firestore.rules` — security rules (paste into the Firebase console).
- `style.css` — all styling.

## Workflow

1. Send students the Google Form link (see below for suggested fields).
2. As responses come in, open `admin.html` on your own device, fill in
   the team name, one member row per teammate (name + NetID, add as
   many as needed), description, and link from the Form response, and
   click Submit.
3. The public page updates instantly for everyone viewing it — no
   redeploy needed.

## Suggested Google Form fields

- Team name (short answer)
- Team members — name + NetID for each (short answer, one line per
  person works fine; you'll retype these into the paired rows on the
  admin page)
- Project link (short answer)
- What does it illustrate? (short answer / paragraph)

## Data model (why it's split this way)

- **`submissions` collection — public.** Team name, description, link.
  This is the only thing the public page ever reads. No names, no
  NetIDs ever appear there.
- **`rosters` collection — private.** Names + NetIDs, one document per
  team, for your grading records. `allow read: if false` means no
  client can ever read this back — not the public page, not even
  `admin.html`. You see it only in Firebase console → Firestore
  Database → Data, under your own login.
- **Submissions are immutable** — once added, an entry can't be edited
  or deleted from either page. If you make a typo on the admin page,
  fix it directly in the Firebase console (find the document under
  `submissions`, edit the field, save).

## Setup

1. Firebase project + Firestore already set up.
2. Paste `firestore.rules` into Firestore Database → Rules → Publish.
3. Push these files to the repo's main branch — GitHub Pages picks it
   up automatically.
4. Bookmark `https://<your-pages-url>/admin.html` for yourself.

## Notes

- There's no voting/leaderboard — dropped because there was no way to
  make it trustworthy without real logins.
- There's no public write access at all now, which sidesteps the
  earlier headaches around tampering, immutability edge cases, and
  self-serve UX confusion. The trade-off is that you're now the one
  transcribing Form responses — for a class-sized number of teams,
  that should be a couple of minutes per submission, not a bottleneck.
- `admin.html` isn't password-protected — it's just not linked or
  discoverable anywhere. That's "security by obscurity," not real
  security. Fine for a low-stakes class tool; don't treat it as safe
  from someone who's specifically trying to find it (e.g. by guessing
  the URL or reading the repo, which is public).

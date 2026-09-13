# Project Showcase — CSCI-UA 102

A live, shared submission table + peer-voting leaderboard for the Data Structures
extra-credit project. Runs as a static site (GitHub Pages) backed by Firebase
Firestore for real-time shared data.

## What's in this repo

- `index.html` — page structure
- `style.css` — all styling (dark theme, starfield background)
- `script.js` — app logic, wired to Firestore
- `firebase-config.js` — your Firebase project's web config (edit this)
- `roster.js` — your class roster, NetID + name (edit this)
- `firestore.rules` — security rules to paste into the Firebase console

## 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project (the free **Spark** plan is enough for a class of any normal size).
2. In the left sidebar, go to **Build → Firestore Database → Create database**. Choose **production mode** and a region close to you (e.g. `us-east1`).

## 2. Get your web config

1. In the Firebase console, click the gear icon → **Project settings**.
2. Under **Your apps**, click the **</>** (web) icon to register a new web app. Give it any nickname.
3. Firebase shows you a `firebaseConfig` object — copy it.
4. Paste those values into `firebase-config.js` in this repo, replacing the `REPLACE_ME` placeholders.

These values are not secret keys — Firestore access is controlled by the rules
below, not by hiding this file. It's normal and expected for them to be
visible in a public repo.

## 3. Set Firestore security rules

1. In the Firebase console, go to **Firestore Database → Rules**.
2. Replace the contents with everything in `firestore.rules` from this repo.
3. Click **Publish**.

These rules let anyone read and submit data (no login required, matching the
class's low-stakes use case) but validate the shape of what's written and
block deletes from the client — so a stray script can't wipe the collection,
even though it also can't stop someone from spoofing a NetID they don't own.

## 4. Add your real class roster

Open `roster.js` and replace the placeholder entries with your actual
students:

```js
export const ROSTER = [
  { netid: 'ab1234', name: 'Real Student Name' },
  // ...
];
```

**Privacy note:** this roster is visible to anyone who opens the deployed
page (view source shows it) — including students who haven't submitted a
project yet. If your repo/site will be fully public, consider either:
- keeping the repo **private** and using GitHub Pages via a private repo (needs GitHub Pro, or Free for GitHub Education accounts — most NYU students have this), or
- listing NetIDs only, without full names, or
- only sharing the page link through Brightspace rather than a public/indexed page.

## 5. Push to GitHub and enable Pages

1. Create a new GitHub repo and push these files to the `main` branch.
2. Go to the repo's **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Save. GitHub gives you a URL like `https://<username>.github.io/<repo>/` within a minute or two.

## 6. Test it

1. Open the published URL.
2. Add a test team using the bottom row of the table (search the roster for a
   member, pick a link, description).
3. Confirm it shows up in **Firebase console → Firestore Database → Data**
   under a `submissions` collection.
4. Click **Vote** on a row, submit a score, confirm a `votes` document
   appears and the leaderboard reorders.
5. Delete your test data from the Firestore console when you're done testing
   (the app itself can't delete, by design).

## Notes

- The leaderboard updates live for everyone viewing the page — Firestore
  pushes changes instantly, no manual refresh needed.
- Self-votes (a team member voting for their own team) are excluded from the
  average automatically, based on the members listed on that submission.
- There's no real authentication — NetID entry is self-reported everywhere
  (adding a team, voting). Fine for an informal, low-stakes class tool; not a
  substitute for your actual grading process.

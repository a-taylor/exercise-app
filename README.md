# Daily Exercise Progression App

A single-user, installable PWA that guides you through a daily bodyweight
routine (30s per exercise, 10s rest) and tracks completion. Start at level 1
(one exercise) and manually Level Up toward the full 12-exercise routine.
See [SPEC.md](./SPEC.md) for the full spec.

## Stack

- Next.js (App Router, TypeScript), React 19
- Postgres via `DATABASE_URL` (`pg`), with a zero-setup PGlite fallback for
  local development
- Hand-rolled web manifest + service worker for PWA installability

## Local development

```sh
npm install
npm run dev
```

Open http://localhost:3000.

**Database:** if `DATABASE_URL` is unset, the app uses [PGlite](https://pglite.dev)
(Postgres compiled to WASM) persisted to the gitignored `./.pglite` directory —
no local Postgres install needed. To use a real Postgres instead, set
`DATABASE_URL` in `.env.local`:

```
DATABASE_URL=postgres://user:pass@localhost:5432/exerciseapp
```

The schema (a `state` row and a `completions` table) is created automatically
on first query — no migration step.

**Resetting local data:** delete the `./.pglite` directory (or truncate the
tables in your Postgres).

**Service worker:** only registered in production builds, so it won't
interfere with `next dev`. To test PWA behavior locally: `npm run build &&
npm start`.

## Deploying to Vercel

1. Provision a Postgres database — either **Vercel Postgres / Neon** via the
   Vercel dashboard (Storage → Create Database → Postgres/Neon, which
   auto-adds env vars), or any Neon database directly.
2. Ensure the `DATABASE_URL` environment variable is set on the Vercel
   project. If the integration only created `POSTGRES_URL`, add
   `DATABASE_URL` with the same value (include `?sslmode=require`).
3. Deploy:

   ```sh
   npm i -g vercel
   vercel        # first deploy, links the project
   vercel --prod
   ```

4. Open the deployed URL on your phone and add it to your home screen
   (iOS: Share → Add to Home Screen; Android: install prompt / menu →
   Add to Home screen). It launches full-screen with no browser chrome.

## API

- `GET /api/state?date=YYYY-MM-DD` → `{ currentLevel, completedToday, completionsAtLevel, daysAtLevel }`
- `POST /api/level-up` → `{ currentLevel }` (increments, no-op at 12)
- `POST /api/level-down` → `{ currentLevel }` (decrements, floor of 1; retags the
  old level's completions so counts are preserved)
- `POST /api/complete` with `{ "date": "YYYY-MM-DD" }` → idempotent per date
- `GET /api/history?start=YYYY-MM-DD&end=YYYY-MM-DD` → `{ completed: [...] }` (the
  completed dates within the range)

"Today" is the client's local calendar date, sent by the app with each
request; the server falls back to its own UTC date if the parameter is
omitted.

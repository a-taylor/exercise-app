# CLAUDE.md

Orientation for working in this repo. See `README.md` for setup/deploy and
`SPEC.md` for the original product spec (some parts superseded — it flags them).

## What this is

A single-user, installable PWA that guides Andrew through a daily bodyweight
routine and tracks completion. No auth — one implicit user. Levels 1–12; the
routine at level N is exercises #1..N in a fixed order (`lib/exercises.ts`).

## Stack

Next.js (App Router, TypeScript) + React 19, deployed on Vercel. Postgres via
`DATABASE_URL` (`pg`), with a zero-setup PGlite (WASM Postgres) fallback for
local dev, persisted to the gitignored `./.pglite`.

## Run it

```sh
npm install
npm run dev        # http://localhost:3000, no DB setup needed
```

`npm run dev` uses PGlite automatically when `DATABASE_URL` is unset. Reset
local data by deleting `./.pglite`. The service worker registers only in
production builds, so it never interferes with `next dev`.

## Architecture

- `components/App.tsx` — top-level client component and the **screen switch**.
  It holds `state` (fetched from `/api/state`) plus boolean flags (`inSession`,
  `showHistory`) and renders exactly one of `Home` / `Session` / `History`
  full-screen inside `<main className="app">`. New full-screen views follow
  this pattern: add a flag, render the view, pass an `onExit` that clears it.
- `components/Home.tsx` — the default screen: header (with the `Menu`), routine
  list, Start / Level Up.
- `components/Menu.tsx` — burger dropdown for app-wide actions (currently "Last
  4 weeks" and "Level down"). Lives in the `Home` header row, not absolutely
  positioned (it must stay clear of the iOS status bar — see v1.1.1).
- `components/Session.tsx` — the guided timer flow; posts `/api/complete` when
  the last exercise finishes.
- `components/History.tsx` — the 4-week completion grid.
- `lib/db.ts` — DB access + idempotent schema setup (runs once per process).
- `lib/dates.ts` (server) / `lib/localDate.ts` (client) / `lib/calendar.ts`
  (the 4-week window math).

## Conventions

- **"Today" is the client's local date.** The browser sends `date=YYYY-MM-DD`
  with each request (`localToday()`); server routes fall back to their own UTC
  date only if it's omitted (`serverToday()`). Do date arithmetic in UTC on
  plain `YYYY-MM-DD` strings to avoid timezone drift (see `lib/calendar.ts`).
- API routes validate any date param with `isValidDateString` and return 400 on
  bad input; they set `export const dynamic = "force-dynamic"`.
- Schema changes go in `SCHEMA_SQL` in `lib/db.ts` as additive, idempotent
  statements (`CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`) — there
  is no migration runner.
- The `completions` table is the source of truth for history; it stores one row
  per completed date (plus the `level` at the time). Prefer querying it over
  adding new tracking state.
- Styling is a single hand-written `app/globals.css` using CSS custom properties
  (`--accent` is the app green). No CSS framework. Mobile-first, `max-width:
  480px`, honor `env(safe-area-inset-*)`.

## Docs to keep current

When you add a feature, update `CHANGELOG.txt`, bump the version in
`package.json`, and update the API list in `README.md` if endpoints change.

## API

- `GET  /api/state?date=YYYY-MM-DD` → `{ currentLevel, completedToday,
  completionsAtLevel, daysAtLevel }`
- `POST /api/level-up` → increments level (no-op at 12)
- `POST /api/level-down` → decrements level (floor 1); retags the old level's
  completions to preserve counts, restarts "days at level"
- `POST /api/complete` `{ date }` → records a completion, idempotent per date
- `GET  /api/history?start=YYYY-MM-DD&end=YYYY-MM-DD` → `{ completed: [...] }`,
  the completed dates in range (client supplies its local 4-week window)

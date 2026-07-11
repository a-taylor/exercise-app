---
name: env-and-spec-notes
description: Dev machine has no Postgres/Docker/psql or image CLIs; PGlite is the local DB fallback; "today" = client local date per 2026-07-11 decision
metadata:
  type: project
---

Dev machine (Andrew's Mac) has NO local Postgres, Docker, psql, or image tooling (magick/rsvg-convert/sips-for-svg). Homebrew exists but no Postgres formula installed.

**Why:** The app targets Vercel Postgres/Neon; installing system services locally was judged too invasive. `lib/db.ts` therefore falls back to PGlite (WASM Postgres, file-backed at gitignored `./.pglite`) when DATABASE_URL is unset. PNG app icons were generated with a pure-node zlib script (no image CLI available).

**How to apply:** Don't assume psql/docker exist for verification — use curl against the API routes and the PGlite fallback. Reset local data by deleting `./.pglite` while the dev server is stopped. Note PGlite's constructor does not mkdir parents recursively — create the data dir first.

Recurring spec-ambiguity type: the SPEC.md for this project omitted timezone semantics for "today". Resolved (reported as judgment call, 2026-07-11): client sends its local YYYY-MM-DD date to /api/state and /api/complete; server falls back to UTC. Future specs touching dates/streaks should be checked for the same gap.

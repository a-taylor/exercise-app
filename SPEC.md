# Daily Exercise Progression App — Spec

## Overview

A single-user mobile web app (installable PWA) that guides Andrew through a daily bodyweight exercise routine and tracks completion over time. He starts with 1 exercise/day and manually levels up to 2, 3, ... up to all 12 as he's ready.

Hosted on Vercel. No login/accounts — implicit single user.

## The 12 Exercises (fixed order)

Sourced from a NYT article graphic (image not reused directly — see Visual Design below).

1. Jumping Jacks
2. Wall Sit
3. Push-Up
4. Abdominal Crunch
5. Step-Up onto Chair
6. Squat
7. Triceps Dip on Chair
8. Plank
9. High Knees Running in Place
10. Lunge
11. Push-Up and Rotation
12. Side Plank

## Core Concept

- App has a **current level** (integer, 1–12, starts at 1).
- "Today's routine" = exercises #1 through #`current level`, in the fixed order above.
- Example: level 1 → just Jumping Jacks. Level 3 → Jumping Jacks, Wall Sit, Push-Up, in that order.
- At level 12, the routine includes all 12 and stays there indefinitely (no further progression logic needed).

## Progression ("Level Up")

- A "Level Up" button/control is **always available** (not gated on completing today's routine).
- Tapping it increments current level by 1, up to a max of 12.
- At level 12, the control is disabled/hidden with a message (e.g. "Full routine reached").
- No level-down / undo functionality needed.
  (Superseded in v1.1 — see CHANGELOG.txt.)

## Daily Session Flow

Home screen shows **Today's Routine**: the list of exercises at the current level, with a "Start" action.

Guided session, once started:
- Each exercise runs a **30-second countdown timer**.
- Between exercises, a **10-second rest/transition timer** plays automatically before the next exercise starts.
- Each exercise screen shows the exercise name + a simple icon (see Visual Design).
- Auto-advances through the full sequence; no reps or weight input required.
- When the last exercise's timer completes, today is marked **complete** in the data store.

Implementation is free to add small UX niceties (pause, skip, audio/vibration cue at transitions) at its discretion — none of these are required for v1.

## Missed Days

- Missing a day does **not** reset the current level and does **not** punish/reset anything.
- A missed day simply has no completion record. No streak-tracking UI is required for v1 (but see Data Model — store data so this could be added later without migration).

## Home Screen Scope (v1)

- Only **Today's Routine** is required on the home screen.
- No streak counter, stats, or history calendar in v1 — but the data model below should support adding these later without restructuring.

## Data Model / Persistence

Single implicit user, no auth. Suggested schema (Postgres):

```
state
  current_level   int, default 1, range 1–12

completions
  date            date, unique
  completed_at    timestamptz
```

API surface (implementation detail, adjust as needed):
- `GET /api/state` → `{ currentLevel, completedToday: boolean }`
- `POST /api/level-up` → increments level (no-op / rejected at 12)
- `POST /api/complete` → records today's completion (idempotent per date)

## Visual Design

- **Do not reuse the NYT article's artwork.** Represent each exercise as text (name) + a simple icon from an open icon set (e.g. lucide-react or similar generic fitness/body icons).
- Mobile-first layout, large touch targets, readable at arm's length during a workout (big timer digits).

## PWA Requirements

- Installable to iOS/Android home screen: web manifest (name, icons, theme color, `display: standalone`) + service worker for basic offline app-shell caching.
- Should open full-screen (no browser chrome) when launched from the home screen icon.

## Explicit Non-Goals (v1)

- No login / accounts / multi-user support
- No push notifications or reminders
- No per-exercise custom durations or rep/weight logging — uniform 30s timer for every exercise
- No streak counters or history/calendar view on the home screen
- No custom illustrations matching the source image

## Recommended Tech Stack

- **Next.js** (App Router, TypeScript) — deployed on **Vercel**
- **Vercel Postgres** (or Neon via the Vercel integration) for persistence
- `next-pwa` or a hand-rolled manifest + minimal service worker for the PWA requirement
- No external auth provider needed

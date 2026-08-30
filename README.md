# SENSEMAP

**Know the place before you go.**

SENSEMAP is a free, no-ads map-based accessibility and sensory-information project. It helps people understand practical environmental characteristics of a place before visiting: noise, lighting, crowding, quiet areas, seating, toilets, step-free access, and other concrete observations.

SENSEMAP does **not** assign a universal safety score and does not claim that a place is objectively safe or unsafe. Personal fit is calculated from preferences stored locally on the device by default.

## Product promises

- Free for everyone; no premium tier, paywall, or advertising.
- Browsing, search, filters, place profiles, and personal preferences work without an account.
- An account is required only for community contributions and moderation-related writes.
- Precise device location is used transiently for nearby results or the optional “Right now” proximity check; it is not stored as a location history.
- Nynorsk (`nn`) and English (`en`) are first-class languages.
- OpenStreetMap-derived place data stays logically separate from SENSEMAP community observations.

## Stack

- React + TypeScript + Vite
- MapLibre GL JS
- OpenStreetMap-derived map/place data through replaceable providers
- Supabase: PostgreSQL, PostGIS, Auth, RLS, RPCs, Edge Functions
- i18next / react-i18next
- Vitest + React Testing Library
- Playwright
- vite-plugin-pwa

## Local setup

Requirements: Node.js 22 LTS, pnpm 10, Supabase CLI, Docker-compatible local runtime for Supabase, and Deno for Edge Function unit tests.

```bash
corepack enable
pnpm install
supabase start
supabase db reset
supabase status -o env
cp .env.example .env.local
```

Copy the local public/anon key from `supabase status -o env` into `VITE_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Never place the service-role key in a `VITE_` variable.

Set local Edge Function provider secrets as described in [`docs/development.md`](docs/development.md), then run:

```bash
pnpm dev
```

## Test and release commands

```bash
supabase db reset
supabase test db
deno test supabase/functions/_shared/*.test.ts
pnpm test
pnpm typecheck
pnpm build
pnpm exec playwright test
```

The Playwright contributor flow additionally needs `SUPABASE_SERVICE_ROLE_KEY` in the shell environment so it can create and delete a disposable local test account.

## Architecture overview

The browser reads public place/profile RPCs and sends authenticated contributions to Supabase tables protected by Row Level Security. External place search/discovery is performed only by server-side Edge Functions through replaceable provider URLs and caches. Sensor preferences and personal-fit calculation stay client-side. The PWA service worker caches only the application shell/static assets; it does not treat API responses as authoritative offline sensory data.

See [`docs/development.md`](docs/development.md) for provider, privacy, OSM, test, and deployment boundaries.

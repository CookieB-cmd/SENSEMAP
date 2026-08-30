# SENSEMAP development and deployment boundaries

## Toolchain

Use **Node 22 LTS** and **pnpm 10**. The local backend uses the Supabase CLI/PostgreSQL/PostGIS. Deno is required for direct Edge Function shared-module tests.

```bash
corepack enable
pnpm install
supabase start
supabase db reset
supabase test db
```

Use `supabase status -o env` to obtain local keys. Client configuration belongs in `.env.local`:

```dotenv
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<local anon/publishable key>
VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty
```

The **service-role key must never be exposed through a `VITE_` variable or client bundle**. It is used only by server-side functions and by the local Playwright test harness for disposable test users.

## Edge Function provider secrets

The search/discovery functions read these server-only variables:

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
PLACE_SEARCH_PROVIDER_URL
PLACE_DISCOVERY_PROVIDER_URL
PLACE_PROVIDER_USER_AGENT
PLACE_DISCOVERY_MAX_AREA_KM2   (optional; defaults to 100)
```

For low-volume local development, a Nominatim-compatible search URL and an Overpass-compatible discovery URL may be configured. The provider URLs are deliberately environment variables: changing providers must not require UI changes.

Example local development values (not a production capacity recommendation):

```text
PLACE_SEARCH_PROVIDER_URL=https://nominatim.openstreetmap.org/search
PLACE_DISCOVERY_PROVIDER_URL=https://overpass-api.de/api/interpreter
PLACE_PROVIDER_USER_AGENT=SENSEMAP/0.1 (development; contact=<project contact>)
PLACE_DISCOVERY_MAX_AREA_KM2=100
```

## OpenStreetMap infrastructure rules

SENSEMAP must show OpenStreetMap attribution wherever OSM-derived place data is used.

**Public Nominatim:** use only for explicit, low-volume searches behind the server-side provider/cache boundary. Do not implement client-side autocomplete against the public service. Respect its published usage policy and rate limits.

**Public Overpass:** suitable for development and low-frequency discovery only. It is **not** the production routine viewport backend. A production deployment must use a capacity-appropriate hosted/self-hosted provider or preprocessed place dataset behind `PLACE_DISCOVERY_PROVIDER_URL`.

OpenStreetMap source objects and SENSEMAP community sensory data remain separate in the database so source refreshes cannot overwrite community provenance.

## Privacy boundaries

- Searching and viewing require no account.
- Sensor preferences remain in browser local storage by default.
- Nearby GPS coordinates are RPC parameters, not a stored user-location history.
- “Right now” checks use device location only as a client-side plausibility check; the report row contains structured conditions, not contributor coordinates.
- Public place-profile RPCs do not expose contributor IDs.
- Moderator access to internal identifiers exists only for abuse handling and is protected by RLS/role checks.

## PWA / offline boundary

The service worker precaches the app shell/static assets. `runtimeCaching` is intentionally empty in v0.1. Supabase/API responses are not cached as authoritative offline place conditions. When offline, the UI explicitly warns that live place data may be unavailable or stale.

## Running checks

Unit/component tests:

```bash
pnpm vitest run
```

Database reset and pgTAP/RLS tests:

```bash
supabase db reset
supabase test db
```

Edge Function shared-module tests:

```bash
deno test supabase/functions/_shared/*.test.ts
```

TypeScript project-reference check:

```bash
pnpm typecheck
```

Production build/PWA generation:

```bash
pnpm build
pnpm preview --host 127.0.0.1
```

End-to-end tests:

```bash
export SUPABASE_SERVICE_ROLE_KEY=<local service role key>
pnpm exec playwright test
```

The Playwright web server builds the app at `http://127.0.0.1:4173`; that origin is listed in local Supabase Auth redirect URLs.

## Provider swapping

To switch search or discovery provider:

1. Choose a provider compatible with the current normalized contract.
2. Set `PLACE_SEARCH_PROVIDER_URL` and/or `PLACE_DISCOVERY_PROVIDER_URL` server-side.
3. Set an identifiable `PLACE_PROVIDER_USER_AGENT` appropriate for that provider's policy.
4. Re-run Edge Function tests and a manual search/discovery smoke test.
5. Do not change client `SearchService` callers; the provider boundary is server-side by design.

## Release gate

A SENSEMAP v0.1 release candidate is acceptable only when all of these pass with dependencies and local Supabase available:

```bash
supabase db reset
supabase test db
deno test supabase/functions/_shared/*.test.ts
pnpm vitest run
pnpm typecheck
pnpm build
pnpm exec playwright test
```

Core visitor/contributor/localization E2E flows must not be skipped. Also run the deferred-scope leakage scan documented in the implementation plan before release.

## Accessibility release checklist

Before release, verify on both desktop and a narrow mobile viewport:

- Every primary action is reachable and operable by keyboard; Tab order remains logical.
- Focus indicators are visibly distinct on buttons, links, inputs, selects, textareas, and disclosure summaries.
- The map page exposes the same nearby places through the visible “Nearby places as a list / Stader i nærleiken som liste” alternative.
- Interactive controls have programmatic accessible names; form controls use labels/legends.
- Loading, success, offline, and error changes use `role="status"` or `role="alert"` where appropriate.
- Map marker meaning is not color-only: size/shape differs and the accessible marker label states data coverage/personal-match meaning.
- At 200% browser zoom, text, navigation, contribution controls, place-profile values, and the list alternative remain readable and operable without losing actions off-screen.
- Nynorsk and English are both exercised through the Playwright localization flow and the locale-parity unit gate.

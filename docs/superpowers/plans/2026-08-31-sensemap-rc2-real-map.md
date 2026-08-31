# SENSEMAP RC2 Real Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to execute this plan task-by-task. Before touching product code, use `superpowers:using-git-worktrees`. Every product change follows RED → GREEN → refactor. Before any completion claim, use `superpowers:verification-before-completion`.

**Goal:** Turn the public RC from an empty-map prototype into a mobile-first hybrid OSM/SENSEMAP experience where real visitable places appear automatically, zero-report places are honestly labelled, reported places are visually distinct, marker selection opens a compact preview, and a first contribution promotes a place into a SENSEMAP-informed state.

**Architecture:** Reuse the existing `places`, `nearby_places`, `get_place_profile`, search, contribution and marker-state model. Make `place-discovery` deployable with safe server-side defaults, query a conservative set of visitable OpenStreetMap destinations, upsert them through the existing stable source identity, and invoke discovery only after settled viewport changes. The map always renders known data first. Discovery is background-only and cannot erase working results. Marker selection stays map-centric through a compact preview before the full profile.

**Tech stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, Testing Library, Playwright, MapLibre GL 5, Supabase/Postgres/PostGIS, Supabase Edge Functions on Deno, i18next, vite-plugin-pwa, Vercel.

**Approved design:** `docs/superpowers/specs/2026-08-31-sensemap-rc2-real-map-design.md`

## Non-negotiable constraints

- SENSEMAP describes environments; it never declares a place objectively safe or unsafe.
- OSM-only places never imply known noise, lighting, crowding or accessibility characteristics.
- Marker states remain `osm-only`, `limited-data`, `substantial-data`, and `strong-match`.
- No red/green traffic-light metaphor for environmental quality.
- Nynorsk and English ship together with exact translation-key parity.
- Browser code contains only public Supabase/map/release configuration.
- `SUPABASE_SERVICE_ROLE_KEY` remains server-side only.
- Geolocation is invoked only after an explicit user action.
- Discovery retains server-side area limits, caching and provider throttling; client debounce is additional protection only.
- A discovery failure never clears already-known places.
- No schema migration is planned for RC2. If implementation exposes a real schema invariant that the current model cannot satisfy, stop and amend the design before adding DDL.
- Public RC data plane: Supabase project `hzrwzoyfpmgvmsdtqgkk`.
- Existing Vercel RC project remains the deployment target; RC2 is identified through the public release metadata rather than requiring a new custom domain.

## Exact file map

### New files

- `supabase/functions/_shared/discoveryQuery.ts`
- `supabase/functions/_shared/discoveryQuery.test.ts`
- `src/features/map/discoveryViewport.ts`
- `src/features/map/discoveryViewport.test.ts`
- `src/features/map/usePlaceDiscovery.ts`
- `src/features/map/usePlaceDiscovery.test.tsx`
- `src/features/map/SenseMap.test.tsx`
- `src/features/map/useNearbyPlaces.test.tsx`
- `src/pages/MapPage.test.tsx`
- `src/features/places/PlacePreview.tsx`
- `src/features/places/PlacePreview.test.tsx`
- `src/features/map/MapStatusStrip.tsx`
- `src/features/map/MapStatusStrip.test.tsx`
- `src/features/places/PlaceProfile.test.tsx`
- `src/pages/PlacePage.test.tsx`
- `src/components/BottomNav.test.tsx`
- `src/features/search/SearchBox.test.tsx`
- `src/config/pwaConfig.ts`
- `src/config/pwaConfig.test.ts`
- `tests/e2e/rc2-map.spec.ts`

### Existing files to modify

- `supabase/functions/_shared/osmNormalize.ts`
- `supabase/functions/_shared/osmNormalize.test.ts`
- `supabase/functions/place-discovery/index.ts`
- `src/features/map/SenseMap.tsx`
- `src/features/map/useNearbyPlaces.ts`
- `src/features/search/searchService.ts`
- `src/pages/MapPage.tsx`
- `src/features/places/PlaceSummaryCard.tsx`
- `src/features/places/PlaceProfile.tsx`
- `src/pages/PlacePage.tsx`
- `src/components/BottomNav.tsx`
- `src/components/AppShell.tsx`
- `src/features/search/SearchBox.tsx`
- `src/styles/global.css`
- `src/i18n/locales/nn/common.json`
- `src/i18n/locales/en/common.json`
- `src/test/i18nParity.test.ts`
- `vite.config.ts`
- `vercel.json`
- `src/config/vercelConfig.test.ts`
- `tests/e2e/helpers.ts`
- `scripts/release-gate.sh`

`src/features/search/types.ts` already exports `DiscoveryBounds`; reuse it unchanged.

---

## Task 1: Conservative destination policy

**Files:** `supabase/functions/_shared/osmNormalize.ts`, `supabase/functions/_shared/osmNormalize.test.ts`

- [ ] Write failing table-driven tests for supported destinations: `amenity=cafe`, `amenity=restaurant`, `amenity=library`, `shop=supermarket`, `tourism=museum`, `leisure=fitness_centre`, `railway=station`, and `public_transport=station`.
- [ ] Write failing rejection tests for `boundary=administrative`, `natural=water`, `waterway=river`, `highway=residential`, unnamed infrastructure, and elements without a supported destination tag.
- [ ] Run `deno test supabase/functions/_shared/osmNormalize.test.ts` and confirm RED.
- [ ] Add an explicit, reviewable destination allowlist. Extend category selection so supported `railway=station` / `public_transport=station` normalise to a stable `station` category. Require a usable name.
- [ ] Keep `normalizeNominatim` text-search behaviour separate; this policy governs viewport discovery, not free-text search.
- [ ] Run `deno test supabase/functions/_shared/*.test.ts` and confirm GREEN.
- [ ] Commit: `feat: filter discovery to visitable places`.

Acceptance: irrelevant geographic geometry cannot become an RC2 discovery place, while normal town-centre destinations do.

---

## Task 2: Make `place-discovery` complete and deployable

**Files:** `supabase/functions/_shared/discoveryQuery.ts`, `supabase/functions/_shared/discoveryQuery.test.ts`, `supabase/functions/place-discovery/index.ts`

- [ ] Write failing pure tests for `buildDiscoveryQuery(bounds)` proving the Overpass query includes `amenity`, `shop`, `tourism`, `leisure`, `railway=station`, and `public_transport=station`, uses the supplied bbox, and keeps `out center tags 250`.
- [ ] Write failing tests for `discoveryAreaKm2(bounds)` and the 75 km² default cap boundary.
- [ ] Run `deno test supabase/functions/_shared/discoveryQuery.test.ts` and confirm RED.
- [ ] Implement the pure query/area helpers and consume them from `place-discovery/index.ts`.
- [ ] Replace mandatory provider configuration with the same pattern already used by `place-search`:
  - `envOrDefault('PLACE_DISCOVERY_PROVIDER_URL', 'https://overpass-api.de/api/interpreter')`
  - `envOrDefault('PLACE_PROVIDER_USER_AGENT', 'SENSEMAP/0.1 (https://github.com/CookieB-cmd/SENSEMAP)')`
  These are server-side defaults, not browser configuration and not secrets.
- [ ] Keep `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` mandatory server-side values.
- [ ] Before an uncached external request, call `claimProviderRequestSlot(supabase, 'overpass', 1000)`. Return a retryable 429 response when the slot is unavailable.
- [ ] Preserve rounded bbox cache keys and six-hour discovery caching.
- [ ] Run `deno test supabase/functions/_shared/*.test.ts` and confirm GREEN.
- [ ] Commit: `feat: harden public place discovery`.

Acceptance: RC2 discovery finds shops and meaningful stations as well as amenities/leisure/tourism, does not require a custom provider secret to deploy, and cannot hammer the public provider.

---

## Task 3: Viewport identity and repeat suppression

**Files:** `src/features/map/discoveryViewport.ts`, `src/features/map/discoveryViewport.test.ts`

- [ ] Write failing tests for finite/in-order bounds, three-decimal normalisation, stable request keys, and tiny-pan suppression.
- [ ] Require `discoveryKey({south:61.45004,west:5.85004,north:61.46004,east:5.87004})` to equal `61.450:5.850:61.460:5.870`.
- [ ] Run `pnpm vitest run src/features/map/discoveryViewport.test.ts` and confirm RED.
- [ ] Implement dependency-free `normalizeDiscoveryBounds`, `discoveryKey`, and `isMeaningfulDiscoveryChange` using the existing `DiscoveryBounds` type.
- [ ] Run the test and confirm GREEN.
- [ ] Commit: `feat: define discovery viewport contract`.

---

## Task 4: Debounced non-blocking discovery hook

**Files:** `src/features/map/usePlaceDiscovery.ts`, `src/features/map/usePlaceDiscovery.test.tsx`, `src/features/search/searchService.ts`

Target interface:

```ts
interface PlaceDiscoveryState {
  discovering: boolean
  error: Error | null
  refreshToken: number
}

usePlaceDiscovery(bounds: DiscoveryBounds | null, delayMs = 450): PlaceDiscoveryState
```

- [ ] With fake timers and a mocked `discoverPlaces`, write failing tests proving no call before 450 ms, one call after settling, successful-key suppression, new-viewport discovery, failure without `refreshToken` increment, and successful retry after leaving/revisiting a failed viewport.
- [ ] Run `pnpm vitest run src/features/map/usePlaceDiscovery.test.tsx` and confirm RED.
- [ ] Implement timer cleanup and cancellation guards. Store only successfully completed request keys; failed keys remain retryable.
- [ ] Discovery state must never own or clear the visible place list.
- [ ] Keep `searchService.discoverPlaces` as the single transport call and normalise thrown unknown values to `Error` at the hook boundary.
- [ ] Run the hook tests and confirm GREEN.
- [ ] Commit: `feat: add debounced place discovery`.

---

## Task 5: MapLibre viewport emission and marker selection

**Files:** `src/features/map/SenseMap.tsx`, `src/features/map/SenseMap.test.tsx`, `src/features/map/mapMarkers.test.ts`

Target callbacks:

```ts
onViewportChanged?: (center: GeoPoint, bounds: DiscoveryBounds) => void
onPlaceSelected?: (place: PlaceSummary) => void
```

- [ ] Mock MapLibre and write failing tests proving `moveend` emits both center and visible bounds.
- [ ] Write a failing marker test proving click emits the complete `PlaceSummary`, not only the id.
- [ ] Add/retain a test proving `navigator.geolocation.getCurrentPosition` is not called on initial render.
- [ ] Run `pnpm vitest run src/features/map/SenseMap.test.tsx src/features/map/mapMarkers.test.ts` and confirm RED.
- [ ] Implement the callback changes only. `SenseMap` must remain presentation/input; it does not call discovery itself.
- [ ] Run the same tests and confirm GREEN.
- [ ] Commit: `feat: expose map viewport and selected place`.

---

## Task 6: Wire hybrid discovery into the map without destructive refreshes

**Files:** `src/features/map/useNearbyPlaces.ts`, `src/features/map/useNearbyPlaces.test.tsx`, `src/pages/MapPage.tsx`, `src/pages/MapPage.test.tsx`

- [ ] Write a failing `useNearbyPlaces` test proving `refreshToken` refetches the same geographic input.
- [ ] Write a failing test proving a refresh failure for the same geographic key preserves already-rendered places and adds an error state.
- [ ] Write a failing test proving a genuinely new geographic key does not keep stale places from the previous area after a primary query failure.
- [ ] Extend options to `{ includeProfiles?: boolean; refreshToken?: number }` and implement the two distinct failure semantics above.
- [ ] Write failing `MapPage` tests proving known places render before discovery resolves, successful discovery increments/refetches nearby data, discovery failure leaves known places visible, and external text-search selection still recentres the map.
- [ ] Wire `center`, `bounds`, filters and `usePlaceDiscovery`; feed its `refreshToken` into `useNearbyPlaces`.
- [ ] Sort the list/map-facing summary predictably: reported places first, then OSM-only places, with distance as the tie-breaker. Do not turn this into a quality ranking.
- [ ] Run `pnpm vitest run src/features/map/useNearbyPlaces.test.tsx src/pages/MapPage.test.tsx` and confirm GREEN.
- [ ] Commit: `feat: populate map from background discovery`.

Acceptance: moving around Førde can populate the database/map, while provider failure never makes a working map suddenly empty.

---

## Task 7: Compact place preview and map status strip

**Files:** `src/features/places/PlacePreview.tsx`, `src/features/places/PlacePreview.test.tsx`, `src/features/map/MapStatusStrip.tsx`, `src/features/map/MapStatusStrip.test.tsx`, `src/pages/MapPage.tsx`, `src/features/places/PlaceSummaryCard.tsx`

- [ ] Write failing zero-report preview tests: show `Ingen SENSEMAP-data enno` / `No SENSEMAP data yet`, show no synthetic sensory values, and offer `View place` plus first-contribution action.
- [ ] Write failing reported-place preview tests: report count is visible; personal-fit badge appears only when present; no safe/unsafe or generic rating wording appears.
- [ ] Write failing status-strip tests for total/reported/unreported counts, discovery-in-progress, zero results, and discovery error while existing places remain visible.
- [ ] Run `pnpm vitest run src/features/places/PlacePreview.test.tsx src/features/map/MapStatusStrip.test.tsx` and confirm RED.
- [ ] Implement marker selection as local `selectedPlace` state. Marker click must not navigate immediately.
- [ ] `Sjå stad` / `View place` navigates to `/places/:id`.
- [ ] `Korleis er det her?` / `What is it like here?` navigates to `/places/:id?contribute=1`, reusing the existing contribution flow rather than duplicating it on the map.
- [ ] Make `PlaceSummaryCard` explicitly label zero-report places instead of silently omitting report metadata.
- [ ] Run preview/status/MapPage tests and confirm GREEN.
- [ ] Commit: `feat: add map-centric place previews`.

---

## Task 8: Full place profile and first-report transition

**Files:** `src/features/places/PlaceProfile.tsx`, `src/features/places/PlaceProfile.test.tsx`, `src/pages/PlacePage.tsx`, `src/pages/PlacePage.test.tsx`

- [ ] Write a failing profile test with `typical.reportCount === 0`: null facts must read as unreported/not enough evidence, never as a reported `No`.
- [ ] Write a separate test proving boolean `false` remains a real reported negative fact when reports exist.
- [ ] Write failing route tests for `/places/<id>?contribute=1`: after profile load, the existing `ContributionSheet` opens; the query flag is removed/replaced after opening so refresh/back does not force an endless reopen.
- [ ] Mock `getPlaceProfile` with zero reports first and one report after `onSubmitted`; assert the page transitions to reported state without reload.
- [ ] Add a recoverable profile-load error with translated `Back to map` / `Tilbake til kartet` navigation.
- [ ] Run `pnpm vitest run src/features/places/PlaceProfile.test.tsx src/pages/PlacePage.test.tsx` and confirm GREEN.
- [ ] Commit: `feat: distinguish unreported place data`.

---

## Task 9: Mobile shell, search, localisation, attribution and PWA metadata

**Files:** `src/components/BottomNav.tsx`, `src/components/BottomNav.test.tsx`, `src/components/AppShell.tsx`, `src/features/search/SearchBox.tsx`, `src/features/search/SearchBox.test.tsx`, `src/styles/global.css`, `src/i18n/locales/nn/common.json`, `src/i18n/locales/en/common.json`, `src/test/i18nParity.test.ts`, `src/config/pwaConfig.ts`, `src/config/pwaConfig.test.ts`, `vite.config.ts`, `vercel.json`, `src/config/vercelConfig.test.ts`

- [ ] Write failing bottom-nav tests requiring icon+text links, accessible names, unchanged routes (`/`, `/for-me`, `/?mode=contribute`) and touch-friendly structure.
- [ ] Write a failing `AppShell` assertion proving the redundant standalone OSM footer is gone; retain MapLibre's legally required attribution on the map.
- [ ] Write failing SearchBox tests for one accessible search form, active need chips, and results contained in an overlay-capable region without changing existing search semantics.
- [ ] Extend the existing `src/test/i18nParity.test.ts`; do not create a second parity test. Add required RC2 semantic-key assertions while retaining exact recursive key parity.
- [ ] Add matching NN/EN strings for discovery status/failure, no-data status, place counts, preview actions, back-to-map, and reported/unreported distinctions.
- [ ] Create `src/config/pwaConfig.ts` exporting the manifest object; set primary manifest language to `nn`; import it from `vite.config.ts`. Test name, start URL, standalone display, icons and `lang === 'nn'`.
- [ ] Extend `vercel.json` with public `VITE_RELEASE_CHANNEL=rc` and `VITE_RELEASE_VERSION=RC2`; extend `src/config/vercelConfig.test.ts` to require them while retaining the public Supabase/map/SPA contract.
- [ ] Implement mobile CSS: shorter-but-dominant map, bottom-sheet preview on phone, side-panel behaviour on wide screens, compact locate control, search overlay, neutral/stronger marker hierarchy, focus-visible outlines, and `env(safe-area-inset-bottom)` padding on bottom navigation.
- [ ] Keep interactive touch targets at least 44 CSS px where practical.
- [ ] Run:

```bash
pnpm vitest run src/components/BottomNav.test.tsx src/features/search/SearchBox.test.tsx src/test/i18nParity.test.ts src/config/pwaConfig.test.ts src/config/vercelConfig.test.ts
pnpm typecheck
pnpm build
```

- [ ] Confirm GREEN and commit: `feat: polish RC2 mobile map experience`.

---

## Task 10: RC2 mobile end-to-end journey

**Files:** `tests/e2e/rc2-map.spec.ts`, `tests/e2e/helpers.ts`

The existing Playwright configuration already includes a Pixel 7 mobile project; reuse it.

- [ ] Extend `tests/e2e/helpers.ts` only with deterministic helpers needed to seed/query RC2 test places through the existing local service-role test path. Never add a production bypass.
- [ ] Write the failing `tests/e2e/rc2-map.spec.ts` journey:
  1. open the map on the mobile project;
  2. provide/intercept a deterministic discovery response that creates an OSM-only destination;
  3. verify the marker appears;
  4. tap it and confirm the URL does not change while the preview opens;
  5. verify no-data wording;
  6. open the full profile;
  7. enter the established contributor flow and submit the first report;
  8. verify the profile becomes reported;
  9. return to the map and verify the place is no longer `osm-only`;
  10. direct-load `/places/<id>`;
  11. switch NN/EN and verify RC2 copy.
- [ ] Add a second test that forces `place-discovery` failure after a known place is visible and asserts the known place remains plus the non-destructive status message.
- [ ] Add a no-geolocation-permission path proving manual map/search still works.
- [ ] Run `pnpm exec playwright test tests/e2e/rc2-map.spec.ts` and confirm RED, then implement only integration gaps required by the approved design.
- [ ] Re-run and confirm GREEN.
- [ ] Commit: `test: cover RC2 mobile map journey`.

---

## Task 11: Harden the RC2 release gate

**File:** `scripts/release-gate.sh`

Keep the existing workflow file unchanged; it already installs Deno, Supabase and Playwright and invokes the script.

- [ ] Update the Deno phase to run all shared tests, including `discoveryQuery.test.ts`.
- [ ] Keep order: DB reset → DB tests → Deno tests → Vitest → typecheck → build → secret scan → Playwright.
- [ ] After `pnpm build`, add quiet bundle checks that do not echo matches/secrets:

```bash
if grep -RqE 'SUPABASE_SERVICE_ROLE_KEY|sb_secret_' dist; then
  echo 'ERROR: privileged server material referenced in client bundle' >&2
  exit 1
fi
if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && grep -RFq -- "$SUPABASE_SERVICE_ROLE_KEY" dist; then
  echo 'ERROR: service-role value found in client bundle' >&2
  exit 1
fi
```

Do not reject the public Supabase URL, publishable key, map-style URL, optional provider endpoint name, or public release metadata.

- [ ] Change final success text to `SENSEMAP RC2 release gate passed`.
- [ ] Run `bash scripts/release-gate.sh` and require fresh full GREEN.
- [ ] Commit: `test: harden RC2 release gate`.

---

## Task 12: Deploy exact green RC2 and smoke-test Førde

**Deployment targets:** Supabase `hzrwzoyfpmgvmsdtqgkk`; existing Vercel SENSEMAP RC project.

- [ ] Verify the exact implementation commit has a fresh full-green `bash scripts/release-gate.sh` and green GitHub Actions run.
- [ ] Deploy `place-discovery` from the reviewed source plus imported `_shared` files. Because the public map must work without sign-in and the existing public `place-search` uses the same visitor model, deploy discovery as a public Edge Function (`verify_jwt=false`) while retaining bbox cap, cache and provider rate limiting.
- [ ] Do not create browser/provider secrets. The default Overpass endpoint and user-agent remain server-side defaults with optional server-side overrides; service-role access remains Supabase-managed and server-only.
- [ ] Confirm `place-discovery` becomes ACTIVE.
- [ ] Invoke a small bbox around Førde sentrum. Require real visitable destinations, including ordinary shops/amenities where present, and reject administrative regions/rivers/road geometry.
- [ ] Verify the discovered rows are returned by `nearby_places` around the same coordinates.
- [ ] Deploy the exact same green frontend commit to the existing Vercel RC project with only intended public Vite configuration. Require deployment state `READY`.
- [ ] Verify `/`, `/for-me`, `/map` behaviour as applicable, `manifest.webmanifest`, and direct `/places/<id>` SPA loading.
- [ ] Run the approved live mobile Førde smoke test: multiple real markers, neutral OSM-only versus reported state, compact previews, honest zero-report profile, one suitable first contribution, refreshed reported state, manual operation without geolocation permission, NN/EN switch, and no visible production errors.
- [ ] Inspect Supabase Edge Function logs, Supabase security/performance advisors, Vercel build logs and Vercel runtime errors. New RC2-caused security findings or production errors are blockers.
- [ ] Record release evidence without secrets: implementation SHA, GitHub Actions run, Supabase function version/status, Vercel deployment ID/URL, and concise smoke-test outcome.
- [ ] Merge/release only after all evidence is GREEN.

---

## Plan self-review

### Spec coverage

- Hybrid OSM/SENSEMAP discovery: Tasks 1–7.
- Shops/transport/town-centre usefulness: Tasks 1–2.
- Honest zero-report semantics: Tasks 1, 7, 8.
- Marker hierarchy and personal fit: Tasks 5, 7 plus existing `markerKindFor` regression tests.
- Debounce/repeat suppression/retry: Tasks 3–4.
- Non-destructive failure behaviour: Tasks 4, 6, 10.
- Compact preview → full profile → first contribution: Tasks 7–8, 10.
- Mobile polish/search/nav/safe area/attribution: Task 9.
- NN/EN parity and PWA language: Task 9.
- Geolocation/privacy and client-secret protection: Tasks 5, 11, 12.
- Automated release gate: Task 11.
- Live Førde validation: Task 12.

### Placeholder scan

- No `TBD`/`TODO` items.
- Every planned test path is explicit.
- Existing parity and E2E locations are reused (`src/test/i18nParity.test.ts`, `tests/e2e/...`).
- `DiscoveryBounds` is known to exist and is reused unchanged.
- No conditional database migration or speculative workflow edit is included.

### Type/data consistency

- `DiscoveryBounds` flows from MapLibre bounds → viewport helpers → `usePlaceDiscovery` → `searchService.discoverPlaces`.
- `SenseMap.onPlaceSelected` emits `PlaceSummary`; routing consumes `place.id` only in the page layer.
- `usePlaceDiscovery.refreshToken` is a refetch signal, not a second place store.
- Same-area refresh errors preserve known data; new-area primary errors cannot masquerade stale places as current-area results.
- `PlacePreview.onContribute(id)` routes to `/places/:id?contribute=1`; `PlacePage` consumes the flag and reuses `ContributionSheet`.
- OSM metadata and SENSEMAP evidence remain separate concepts throughout the UI.

### Execution entry

After this planning PR is accepted, merge the planning documents, create an isolated implementation worktree from updated `main`, and execute Tasks 1–12 in order. Each task gets its own RED evidence, GREEN evidence, diff review and commit. Do not batch deployment with unverified source changes.
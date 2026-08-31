# SENSEMAP RC2 Real Map Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the public RC from an empty-map prototype into a mobile-first hybrid OSM/SENSEMAP experience where real visitable places appear automatically, zero-report places are honestly labelled, reported places are visually distinct, marker selection opens a compact preview, and first contributions promote a place into a SENSEMAP-informed state.

**Architecture:** Reuse the existing Supabase `places`, `nearby_places`, `get_place_profile`, search, contribution, and marker-state model. Add a conservative destination filter to shared OSM normalisation, deploy and call `place-discovery` after settled viewport changes, then refresh the existing nearby-place query. Keep discovery non-blocking and server-protected; add a focused map preview layer and mobile UI polish without introducing a new recommendation engine or schema unless a concrete missing invariant appears during implementation.

**Tech Stack:** React 19, TypeScript 5.9, Vite 7, Vitest 3, Testing Library, Playwright, MapLibre GL 5, Supabase/Postgres/PostGIS, Supabase Edge Functions on Deno, i18next, vite-plugin-pwa, Vercel.

**Spec:** `docs/superpowers/specs/2026-08-31-sensemap-rc2-real-map-design.md`

## Global Constraints

- SENSEMAP describes environments; it must never label places objectively safe or unsafe.
- OSM-only places must never imply known sensory/accessibility attributes.
- Marker states remain `osm-only`, `limited-data`, `substantial-data`, and `strong-match`.
- Red/green traffic-light semantics for environmental quality are prohibited.
- Nynorsk and English ship together with translation-key parity.
- Browser code may contain only public Supabase/map configuration; provider credentials and service-role credentials remain server-side.
- Geolocation must only run after an explicit user action.
- Discovery must preserve server-side area caps, caching, and provider controls; client debounce is additional protection only.
- Discovery failure must not erase or block already-known places.
- RC2 remains mobile-first and must handle bottom safe-area insets.
- No native Android packaging, generic ratings, safety scoring, background geolocation, offline tile packs, social/gamification, or monetisation work in RC2.
- The intended live data plane for the public RC is Supabase project `hzrwzoyfpmgvmsdtqgkk`.
- Do not add a database migration unless implementation exposes a concrete invariant that cannot be satisfied by the current schema/RPC surface.

---

## File Structure

### New focused frontend units
- `src/features/map/discoveryViewport.ts` — converts MapLibre bounds into validated discovery bounds, creates a stable rounded request key, and decides whether a viewport change is meaningfully different.
- `src/features/map/discoveryViewport.test.ts` — unit tests for bounds/key/repeat suppression helpers.
- `src/features/map/usePlaceDiscovery.ts` — debounced, non-blocking discovery orchestration and refresh signal.
- `src/features/map/usePlaceDiscovery.test.tsx` — hook tests for debounce, suppression, success refresh, and failure preservation.
- `src/features/places/PlacePreview.tsx` — compact mobile/desktop marker-selection preview with honest zero-report state.
- `src/features/places/PlacePreview.test.tsx` — preview semantics/navigation tests.
- `src/features/map/MapStatusStrip.tsx` — count/status summary below map.
- `src/features/map/MapStatusStrip.test.tsx` — count copy/status tests.

### Existing files to modify
- `supabase/functions/_shared/osmNormalize.ts` — conservative visitable-destination allowlist/filter.
- `supabase/functions/_shared/osmNormalize.test.ts` — destination filtering regression tests.
- `supabase/functions/place-discovery/index.ts` — keep bounded provider query/caching; make filtering explicit and testable via shared normalisation.
- `supabase/functions/place-discovery/index.test.ts` — create boundary tests for invalid/oversized viewports and provider failure if no such function-level test exists already.
- `src/features/search/searchService.ts` — keep `discoverPlaces()` as transport API; type failure consistently.
- `src/features/map/SenseMap.tsx` — emit full visible bounds after settled map movement and expose marker selection without direct navigation.
- `src/pages/MapPage.tsx` — wire nearby places + discovery + selection + preview + status strip.
- `src/features/places/PlaceSummaryCard.tsx` — explicit no-SENSEMAP-data wording for zero-report list cards.
- `src/features/places/PlaceProfile.tsx` — distinguish unreported from reported false/no values and improve before-you-go hierarchy.
- `src/pages/PlacePage.tsx` — recoverable back-to-map error/loading flow and refresh after first contribution.
- `src/components/BottomNav.tsx` — icons/accessible labels while retaining routes.
- `src/components/AppShell.tsx` — remove duplicate attribution footer treatment.
- `src/features/search/SearchBox.tsx` — mobile integrated search treatment and visible chips; no behavioural rewrite beyond RC2 needs.
- `src/styles/global.css` — RC2 mobile layout, bottom sheet, marker hierarchy, safe areas, compact controls.
- `src/i18n/locales/nn/common.json` — RC2 Nynorsk copy.
- `src/i18n/locales/en/common.json` — matching English copy.
- `src/i18n/locales.test.ts` — translation-key parity and required RC2 string coverage.
- `vite.config.ts` — PWA manifest primary language consistency.
- `tests/rc2-map.spec.ts` — mobile E2E journey for hybrid discovery/preview/first-report transition.
- `scripts/release-gate.sh` — RC2-labelled gate plus generated-client secret scan.
- `.github/workflows/release-gate.yml` — modify only if the new function-level Deno test requires explicit test environment configuration.

---

### Task 1: Conservative OSM Destination Policy

**Files:**
- Modify: `supabase/functions/_shared/osmNormalize.ts`
- Modify: `supabase/functions/_shared/osmNormalize.test.ts`

**Interfaces:**
- Consumes: raw OSM `tags: Record<string, unknown>` already passed to `normalizeOsmElement`.
- Produces: `isSupportedDestination(tags: Record<string, unknown>): boolean` and unchanged `normalizeOsmElement(row): ExternalPlace | null`; unsupported geographic/infrastructure rows return `null`.

- [ ] **Step 1: Write failing tests for supported destinations**

Add table-driven cases covering at least `amenity=cafe`, `amenity=restaurant`, `shop=supermarket`, `tourism=museum`, `leisure=fitness_centre`, and `amenity=library`. Assert each normalises to a non-null place with the expected category.

```ts
it.each([
  ['amenity', 'cafe'],
  ['amenity', 'restaurant'],
  ['shop', 'supermarket'],
  ['tourism', 'museum'],
  ['leisure', 'fitness_centre'],
  ['amenity', 'library'],
])('keeps visitable %s=%s destinations', (key, value) => {
  expect(normalizeOsmElement(osmElement({ name: 'Test place', [key]: value }))).not.toBeNull()
})
```

- [ ] **Step 2: Write failing tests for rejected noise**

Cover `boundary=administrative`, `natural=water`, `waterway=river`, `highway=residential`, unnamed amenity/infrastructure, and an element with no supported destination tag. Assert `null`.

- [ ] **Step 3: Run the shared-module test and confirm RED**

Run: `deno test supabase/functions/_shared/osmNormalize.test.ts`

Expected: new rejection tests fail because current normalisation does not enforce the RC2 destination allowlist.

- [ ] **Step 4: Implement the minimal allowlist policy**

```ts
const supported: Record<'amenity'|'shop'|'tourism'|'leisure', ReadonlySet<string>> = {
  amenity: new Set(['cafe','restaurant','fast_food','library','cinema','theatre','community_centre','townhall','post_office','pharmacy','clinic','hospital','bus_station']),
  shop: new Set(['supermarket','convenience','mall','department_store','clothes','electronics','books','chemist']),
  tourism: new Set(['museum','gallery','attraction','information']),
  leisure: new Set(['fitness_centre','sports_centre','swimming_pool','bowling_alley']),
}

export function isSupportedDestination(tags: Record<string, unknown>): boolean {
  return (Object.entries(supported) as Array<[keyof typeof supported, ReadonlySet<string>]>).some(
    ([key, values]) => typeof tags[key] === 'string' && values.has(tags[key] as string),
  )
}
```

Call this before producing an `ExternalPlace` in `normalizeOsmElement`. Keep Nominatim text search behaviour separate so ordinary search is not accidentally crippled.

- [ ] **Step 5: Run Deno tests and confirm GREEN**

Run: `deno test supabase/functions/_shared/*.test.ts`

Expected: all shared Edge Function tests pass.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/_shared/osmNormalize.ts supabase/functions/_shared/osmNormalize.test.ts
git commit -m "feat: filter discovery to visitable places"
```

---

### Task 2: Viewport Contract and Repeat Suppression

**Files:**
- Create: `src/features/map/discoveryViewport.ts`
- Create: `src/features/map/discoveryViewport.test.ts`
- Modify: `src/features/search/types.ts` only if `DiscoveryBounds` is not already exported in a reusable form.

**Interfaces:**
- Consumes: visible south/west/north/east bounds from MapLibre.
- Produces:
  - `normalizeDiscoveryBounds(bounds): DiscoveryBounds`
  - `discoveryKey(bounds): string`
  - `isMeaningfulDiscoveryChange(previous, next): boolean`

- [ ] **Step 1: Write failing unit tests**

Require coordinates rounded to three decimals for stable request identity, reject inverted/non-finite bounds, and suppress tiny pans that resolve to the same rounded key.

```ts
expect(discoveryKey({south:61.45004,west:5.85004,north:61.46004,east:5.87004}))
  .toBe('61.450:5.850:61.460:5.870')
expect(isMeaningfulDiscoveryChange(a, {...a, west: a.west + 0.00001})).toBe(false)
```

- [ ] **Step 2: Run test and confirm RED**

Run: `pnpm vitest run src/features/map/discoveryViewport.test.ts`

Expected: module/functions do not exist.

- [ ] **Step 3: Implement the pure helpers**

Keep them dependency-free so MapLibre specifics stay in `SenseMap`.

- [ ] **Step 4: Run test and confirm GREEN**

Run: `pnpm vitest run src/features/map/discoveryViewport.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/features/map/discoveryViewport.ts src/features/map/discoveryViewport.test.ts src/features/search/types.ts
git commit -m "feat: define discovery viewport contract"
```

---

### Task 3: Debounced Non-Blocking Discovery Hook

**Files:**
- Create: `src/features/map/usePlaceDiscovery.ts`
- Create: `src/features/map/usePlaceDiscovery.test.tsx`
- Modify: `src/features/search/searchService.ts`

**Interfaces:**
- Consumes: `DiscoveryBounds | null`, existing `discoverPlaces(bounds)`, debounce delay.
- Produces:

```ts
interface PlaceDiscoveryState {
  discovering: boolean
  error: Error | null
  refreshToken: number
}
export function usePlaceDiscovery(bounds: DiscoveryBounds | null, delayMs = 450): PlaceDiscoveryState
```

`refreshToken` increments only after a successful discovery so `MapPage` can re-run `useNearbyPlaces` without storing duplicate place data in two client states.

- [ ] **Step 1: Write failing hook tests with fake timers and mocked `discoverPlaces`**

Verify: no call before 450 ms; one call after settled bounds; same rounded key is suppressed; a meaningfully new viewport triggers a new call; failure sets `error` but leaves previous `refreshToken` unchanged; later success clears error and increments token.

- [ ] **Step 2: Run hook tests and confirm RED**

Run: `pnpm vitest run src/features/map/usePlaceDiscovery.test.tsx`

- [ ] **Step 3: Implement minimal hook**

Use `useRef<Set<string>>` for completed request keys, timer cleanup in `useEffect`, and a cancellation guard. Mark a key completed after success; on failure allow a later meaningful revisit/retry rather than permanently poisoning the key. Do not clear any nearby-place state from this hook.

- [ ] **Step 4: Run hook tests and confirm GREEN**

Run: `pnpm vitest run src/features/map/usePlaceDiscovery.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/features/map/usePlaceDiscovery.ts src/features/map/usePlaceDiscovery.test.tsx src/features/search/searchService.ts
git commit -m "feat: add debounced place discovery"
```

---

### Task 4: MapLibre Bounds Emission and Marker Selection

**Files:**
- Modify: `src/features/map/SenseMap.tsx`
- Create: `src/features/map/SenseMap.test.tsx`

**Interfaces:**
- Consumes: `places: PlaceSummary[]`.
- Produces callbacks:

```ts
onViewportChanged?: (center: GeoPoint, bounds: DiscoveryBounds) => void
onPlaceSelected?: (place: PlaceSummary) => void
```

- [ ] **Step 1: Write failing component tests around a mocked MapLibre Map**

Assert `moveend` reads both `getCenter()` and `getBounds()` and emits them once. Assert clicking a generated marker emits the complete `PlaceSummary`, not only the id. Assert `navigator.geolocation.getCurrentPosition` is not called on initial render.

- [ ] **Step 2: Run and confirm RED**

Run: `pnpm vitest run src/features/map/SenseMap.test.tsx`

- [ ] **Step 3: Implement callback changes**

Translate MapLibre bounds into `{south, west, north, east}`. Do not call discovery from inside `SenseMap`; it remains a presentation/input component.

- [ ] **Step 4: Run and confirm GREEN**

Run: `pnpm vitest run src/features/map/SenseMap.test.tsx src/features/map/mapMarkers.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/features/map/SenseMap.tsx src/features/map/SenseMap.test.tsx
git commit -m "feat: expose map viewport and selected place"
```

---

### Task 5: Wire Hybrid Discovery Into MapPage

**Files:**
- Modify: `src/pages/MapPage.tsx`
- Modify: `src/features/map/useNearbyPlaces.ts`
- Create: `src/pages/MapPage.test.tsx`
- Create: `src/features/map/useNearbyPlaces.test.tsx`

**Interfaces:**
- Consumes: `usePlaceDiscovery(bounds)` from Task 3 and callbacks from Task 4.
- Produces: immediate known-place rendering plus background discovery/refetch, selected place state for preview.

- [ ] **Step 1: Write failing MapPage tests**

Mock nearby places and discovery. Verify known places render before discovery resolves; successful discovery causes a nearby refetch; discovery rejection keeps known cards visible and renders a small non-destructive status; selecting an external text-search result still recentres rather than pretending it already has SENSEMAP data.

- [ ] **Step 2: Run and confirm RED**

Run: `pnpm vitest run src/pages/MapPage.test.tsx`

- [ ] **Step 3: Add a refresh input to `useNearbyPlaces`**

Extend the existing options shape without changing existing callers:

```ts
options: { includeProfiles?: boolean; refreshToken?: number } = {}
```

Include `options.refreshToken ?? 0` in the effect dependency list; preserve current failure semantics.

- [ ] **Step 4: Write and pass the hook refetch test**

Render with `refreshToken=0`, resolve one request, rerender with `refreshToken=1`, and assert `listNearbyPlaces` is called again while the same geographic input is retained.

Run: `pnpm vitest run src/features/map/useNearbyPlaces.test.tsx`

- [ ] **Step 5: Wire viewport bounds and discovery state in MapPage**

Maintain `center`, `bounds`, `selectedPlace`, and filters. Pass bounds into `usePlaceDiscovery`; pass `refreshToken` into `useNearbyPlaces`. Keep discovery error distinct from primary nearby-query error.

- [ ] **Step 6: Run tests and confirm GREEN**

Run: `pnpm vitest run src/pages/MapPage.test.tsx src/features/map/useNearbyPlaces.test.tsx`

- [ ] **Step 7: Commit**

```bash
git add src/pages/MapPage.tsx src/pages/MapPage.test.tsx src/features/map/useNearbyPlaces.ts src/features/map/useNearbyPlaces.test.tsx
git commit -m "feat: populate map from background discovery"
```

---

### Task 6: Compact Place Preview and Status Strip

**Files:**
- Create: `src/features/places/PlacePreview.tsx`
- Create: `src/features/places/PlacePreview.test.tsx`
- Create: `src/features/map/MapStatusStrip.tsx`
- Create: `src/features/map/MapStatusStrip.test.tsx`
- Modify: `src/pages/MapPage.tsx`
- Modify: `src/features/places/PlaceSummaryCard.tsx`

**Interfaces:**
- `PlacePreview` consumes `place: PlaceSummary`, `onOpen(id: string)`, `onContribute(id: string)`, `onClose()`.
- `MapStatusStrip` consumes `places: PlaceSummary[]`, `discovering: boolean`, and `discoveryError: Error | null`.

- [ ] **Step 1: Write failing zero-report preview test**

Assert a `reportCount: 0` place shows the translated `No SENSEMAP data yet`/`Ingen SENSEMAP-data enno`, does not render noise/lighting/crowding values, and offers both full-profile and first-contribution actions.

- [ ] **Step 2: Write failing reported-place preview test**

Assert report count and personal-fit badge are shown only where available; no safety/quality wording appears.

- [ ] **Step 3: Write failing status-strip tests**

For 12 places with 3 reported, require counts equivalent to `12 stadar i området · 3 med SENSEMAP-data · 9 utan rapportar`. Test zero places, discovery-in-progress, and discovery-error-with-existing-places variants.

- [ ] **Step 4: Run and confirm RED**

Run: `pnpm vitest run src/features/places/PlacePreview.test.tsx src/features/map/MapStatusStrip.test.tsx`

- [ ] **Step 5: Implement preview and strip, wire MapPage selection**

Marker click sets `selectedPlace`; it must not navigate immediately. `Sjå stad`/`View place` navigates to `/places/:id`. `Korleis er det her?`/`What is it like here?` navigates to `/places/:id?contribute=1` so Task 7 can open the existing contribution sheet rather than creating a duplicate form.

- [ ] **Step 6: Make list cards honest for zero-report places**

`PlaceSummaryCard` explicitly shows the zero-report status instead of simply omitting report metadata.

- [ ] **Step 7: Run and confirm GREEN**

Run: `pnpm vitest run src/features/places/PlacePreview.test.tsx src/features/map/MapStatusStrip.test.tsx src/pages/MapPage.test.tsx`

- [ ] **Step 8: Commit**

```bash
git add src/features/places/PlacePreview.tsx src/features/places/PlacePreview.test.tsx src/features/map/MapStatusStrip.tsx src/features/map/MapStatusStrip.test.tsx src/pages/MapPage.tsx src/features/places/PlaceSummaryCard.tsx
git commit -m "feat: add map-centric place previews"
```

---

### Task 7: Place Profile No-Data Semantics and First-Report Transition

**Files:**
- Modify: `src/features/places/PlaceProfile.tsx`
- Create: `src/features/places/PlaceProfile.test.tsx`
- Modify: `src/pages/PlacePage.tsx`
- Create: `src/pages/PlacePage.test.tsx`

**Interfaces:**
- Consumes existing `PlaceProfileData` and `ContributionSheet` refresh callback.
- Reads `?contribute=1` via React Router search params and opens the existing contribution sheet once the profile is available.
- Produces explicit unreported state where `typical.reportCount === 0`; after contribution, refreshes `getPlaceProfile` and displays reported state.

- [ ] **Step 1: Write failing profile test for zero reports**

Use `typical.reportCount: 0` and null facts. Assert the primary section states that SENSEMAP has no reports rather than presenting `No` for null facts. Null means `not reported`; boolean `false` means a user-reported negative fact.

- [ ] **Step 2: Write failing first-report refresh and query-open tests**

Mock `getPlaceProfile` to return zero-report data first and one-report data after `onSubmitted`. Render `/places/<id>?contribute=1`; assert the contribution sheet opens after profile load, submission closes/refreshes it, and the page transitions without reload.

- [ ] **Step 3: Run and confirm RED**

Run: `pnpm vitest run src/features/places/PlaceProfile.test.tsx src/pages/PlacePage.test.tsx`

- [ ] **Step 4: Implement the minimal hierarchy/query change**

Add a zero-report explanatory block. Keep the existing primary attributes for reported profiles; retain current/typical separation and `ConfidenceBadge` when evidence exists. Read `contribute=1` with `useSearchParams`; after opening, remove or replace the query flag so browser back/refresh does not repeatedly force the sheet open.

- [ ] **Step 5: Add recoverable profile error navigation**

On profile failure render a translated error plus a `Back to map`/`Tilbake til kartet` link.

- [ ] **Step 6: Run and confirm GREEN**

Run: `pnpm vitest run src/features/places/PlaceProfile.test.tsx src/pages/PlacePage.test.tsx`

- [ ] **Step 7: Commit**

```bash
git add src/features/places/PlaceProfile.tsx src/features/places/PlaceProfile.test.tsx src/pages/PlacePage.tsx src/pages/PlacePage.test.tsx
git commit -m "feat: distinguish unreported place data"
```

---

### Task 8: Mobile RC2 Shell, Search, Navigation, Attribution, and PWA Language

**Files:**
- Modify: `src/components/BottomNav.tsx`
- Modify: `src/components/AppShell.tsx`
- Modify: `src/features/search/SearchBox.tsx`
- Modify: `src/styles/global.css`
- Modify: `vite.config.ts`
- Create: `src/components/BottomNav.test.tsx`
- Modify or create: `src/features/search/SearchBox.test.tsx`
- Modify: `src/config/vercelConfig.test.ts` or create `src/config/pwaConfig.test.ts` if keeping PWA assertions separate is clearer.

**Interfaces:**
- No data-model changes.
- Bottom navigation routes remain `/`, `/for-me`, and `/?mode=contribute`.

- [ ] **Step 1: Write failing shell/navigation tests**

Require accessible icon+text links for all three nav items and verify no duplicate standalone OpenStreetMap footer is emitted by `AppShell` once MapLibre attribution is retained.

- [ ] **Step 2: Write failing search/mobile tests**

Assert the search control remains one labelled search form, active parsed needs are visible as chips, and result markup has a stable class/region for overlay positioning without changing search semantics.

- [ ] **Step 3: Write failing PWA language assertion**

Factor the manifest object into an exported `pwaManifest` constant in `vite.config.ts` or `src/config/pwaManifest.ts`; assert `lang === 'nn'` and the existing name/start/display/icon fields remain valid.

- [ ] **Step 4: Run and confirm RED**

Run: `pnpm vitest run src/components/BottomNav.test.tsx src/features/search/SearchBox.test.tsx src/config/vercelConfig.test.ts src/config/pwaConfig.test.ts`

Run only the config test file that exists after choosing the factoring approach.

- [ ] **Step 5: Implement mobile polish**

In CSS: make the map dominant but shorter than RC1 on phone; style `PlacePreview` as a bottom sheet and side panel at desktop breakpoint; make geolocation a compact map control; add `padding-bottom: max(.6rem, env(safe-area-inset-bottom))` to bottom nav; keep tap targets at least 44 CSS px tall/wide where interactive; remove redundant footer spacing; keep focus-visible outlines.

Do not hard-code Android-only dimensions and do not remove legally required map attribution.

- [ ] **Step 6: Run component tests and production build**

Run:

```bash
pnpm vitest run src/components/BottomNav.test.tsx src/features/search/SearchBox.test.tsx src/config/vercelConfig.test.ts
pnpm typecheck
pnpm build
```

If PWA assertions live in a separate `pwaConfig.test.ts`, include it in the Vitest command.

- [ ] **Step 7: Commit**

```bash
git add src/components/BottomNav.tsx src/components/AppShell.tsx src/features/search/SearchBox.tsx src/styles/global.css vite.config.ts src/components/BottomNav.test.tsx src/features/search/SearchBox.test.tsx src/config/vercelConfig.test.ts src/config/pwaConfig.test.ts
git commit -m "feat: polish RC2 mobile map shell"
```

Add only files that exist/change.

---

### Task 9: Nynorsk/English RC2 Copy Parity

**Files:**
- Modify: `src/i18n/locales/nn/common.json`
- Modify: `src/i18n/locales/en/common.json`
- Create: `src/i18n/locales.test.ts`

**Interfaces:**
- New keys used by Tasks 5–8 must exist in both locales with identical key structure.

- [ ] **Step 1: Write failing parity test before adding copy**

Recursively flatten both JSON objects and assert identical key sets.

```ts
expect([...flattenKeys(nn)].sort()).toEqual([...flattenKeys(en)].sort())
```

Also assert semantic keys used by RC2 exist for discovery failure/status, zero-report status, place counts, preview actions, back-to-map, and reported/unreported distinctions.

- [ ] **Step 2: Run and confirm RED**

Run: `pnpm vitest run src/i18n/locales.test.ts`

- [ ] **Step 3: Add both language sets together**

Required core wording:

```text
nn: Ingen SENSEMAP-data enno
nn: Kunne ikkje hente fleire stadar akkurat no
nn: stadar i området
nn: med SENSEMAP-data
nn: utan rapportar
nn: Sjå stad
nn: Korleis er det her?

en: No SENSEMAP data yet
en: Could not load more places right now
en: places in this area
en: with SENSEMAP data
en: without reports
en: View place
en: What is it like here?
```

- [ ] **Step 4: Run parity and relevant UI tests**

Run: `pnpm vitest run src/i18n/locales.test.ts src/features/places/PlacePreview.test.tsx src/features/map/MapStatusStrip.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/i18n/locales/nn/common.json src/i18n/locales/en/common.json src/i18n/locales.test.ts
git commit -m "feat: localize RC2 map experience"
```

---

### Task 10: RC2 Mobile End-to-End Journey

**Files:**
- Create: `tests/rc2-map.spec.ts`
- Modify: `playwright.config.ts` only if a dedicated mobile project is cleaner than per-test viewport.

**Interfaces:**
- Exercises public app behaviour against local Supabase seeded/test-controlled data.

- [ ] **Step 1: Write the failing narrow-viewport E2E scenario**

Set viewport `390x844`. Cover: map opens; discovery response populates a zero-report destination; marker opens preview without URL change; preview says no data; `View place` opens `/places/<id>`; first contribution is submitted through the established local test helper/data path; refreshed profile becomes reported; direct `page.goto('/places/<id>')` works; switching `NN`/`EN` changes RC2 copy.

- [ ] **Step 2: Add discovery-failure degradation E2E**

Intercept or force `place-discovery` failure after a known place is loaded. Assert the known place remains visible and the non-destructive discovery message appears.

- [ ] **Step 3: Run RC2 E2E and confirm RED**

Run: `pnpm exec playwright test tests/rc2-map.spec.ts`

- [ ] **Step 4: Fix only integration gaps exposed by the agreed journey**

Do not weaken assertions. If the test needs deterministic data, use the existing local Supabase service-role test setup already provided by the release gate rather than adding production-only bypasses.

- [ ] **Step 5: Re-run RC2 E2E and confirm GREEN**

Run: `pnpm exec playwright test tests/rc2-map.spec.ts`

- [ ] **Step 6: Commit**

```bash
git add tests/rc2-map.spec.ts playwright.config.ts
git commit -m "test: cover RC2 mobile map journey"
```

Add `playwright.config.ts` only if changed.

---

### Task 11: Release Gate and Client-Secret Scan

**Files:**
- Modify: `scripts/release-gate.sh`
- Modify: `.github/workflows/release-gate.yml` only if Task 10/Edge-function tests require explicit CI environment wiring.

**Interfaces:**
- Produces one command, `bash scripts/release-gate.sh`, that proves DB + Deno + unit + typecheck + production build + secret scan + E2E.

- [ ] **Step 1: Add generated-assets secret scan after `pnpm build`**

```bash
if grep -R -E 'SUPABASE_SERVICE_ROLE_KEY|PLACE_DISCOVERY_PROVIDER_URL|sb_secret_' dist; then
  echo 'ERROR: privileged server configuration found in client bundle' >&2
  exit 1
fi
if [[ -n "${SUPABASE_SERVICE_ROLE_KEY:-}" ]] && grep -RF -- "$SUPABASE_SERVICE_ROLE_KEY" dist; then
  echo 'ERROR: service-role value found in client bundle' >&2
  exit 1
fi
```

Do not flag the public Supabase URL, publishable key, or map-style URL.

- [ ] **Step 2: Update the gate label to RC2**

Keep ordering: reset DB → DB tests → Deno tests → Vitest → typecheck → build → secret scan → Playwright.

- [ ] **Step 3: Run complete gate locally and capture fresh evidence**

Run: `bash scripts/release-gate.sh`

Expected: every phase passes; final line states `SENSEMAP RC2 release gate passed`.

- [ ] **Step 4: Commit**

```bash
git add scripts/release-gate.sh .github/workflows/release-gate.yml
git commit -m "test: harden RC2 release gate"
```

Add the workflow only if changed.

---

### Task 12: Deploy Edge Discovery, Vercel RC2, and Run Live Førde Smoke Test

**Files:**
- No source change expected unless live verification finds a release blocker.
- Deployment targets: Supabase `hzrwzoyfpmgvmsdtqgkk`; Vercel SENSEMAP RC project.

**Interfaces:**
- Supabase Edge Function `place-discovery` must be reachable by the public Vite client while privileged provider/upsert operations remain server-side inside the function.

- [ ] **Step 1: Verify the implementation branch is fully green before deployment**

Run: `bash scripts/release-gate.sh`

Expected: fresh full GREEN on the exact commit to deploy.

- [ ] **Step 2: Review Edge Function authentication contract before deployment**

Compare the established public `place-search` deployment and RC threat model with `place-discovery`. If discovery is intentionally public, keep `verify_jwt=false` only with its existing bounded viewport/cache/provider controls; otherwise use normal client JWT verification. Record the chosen mode in the PR without exposing secrets.

- [ ] **Step 3: Configure only server-side discovery environment on Supabase**

Ensure the function has `PLACE_DISCOVERY_PROVIDER_URL`, `PLACE_PROVIDER_USER_AGENT`, `SUPABASE_URL`, and service-role access through Supabase-managed server environment. Never place these secret values in Vercel/Vite client env, source literals, screenshots, PR text, or copied logs.

- [ ] **Step 4: Deploy `place-discovery` from the exact reviewed source**

Deploy `supabase/functions/place-discovery/index.ts` plus all imported `_shared` files. Verify function status becomes ACTIVE.

- [ ] **Step 5: Smoke the function with a bounded Førde viewport**

Use a small bbox around Førde sentrum. Expected: success; results include real visitable destinations; no administrative regions/rivers/road geometry; returned/upserted rows become visible through `nearby_places`.

- [ ] **Step 6: Deploy the exact green frontend commit to Vercel RC2**

Use only the intended public Vite values: Supabase URL, publishable key, OpenFreeMap style URL. Verify deployment `READY` and direct `/places/<id>` serves the SPA correctly.

- [ ] **Step 7: Perform the live Førde mobile smoke test**

Verify all ten items from spec section 14: public URL loads; real Førde destinations appear; OSM-only/reported markers differ; multiple marker previews work; normal/direct place profile loading works; zero-report wording is honest; first contribution changes state; map/search work without geolocation permission; and relevant Supabase/Vercel logs show no visible production error.

- [ ] **Step 8: Run post-deploy security/performance checks**

Check Supabase security and performance advisors and inspect Vercel runtime/build logs. Treat new security findings or production errors caused by RC2 as release blockers.

- [ ] **Step 9: Record release evidence and merge only after live GREEN**

Record exact commit SHA, GitHub release-gate run, Supabase function version/status, Vercel deployment ID/URL, and concise smoke-test result. Do not include secret values.

---

## Plan Self-Review

### Spec coverage
- Hybrid OSM/SENSEMAP map: Tasks 1–6.
- Honest OSM-only semantics: Tasks 1, 6, 7.
- Data-depth/personal-fit marker hierarchy: Tasks 4, 6 plus existing `markerKindFor` regression coverage.
- Debounced/suppressed background discovery: Tasks 2–5.
- Failure degradation: Tasks 3, 5, 10.
- Compact preview and full profile: Tasks 6–7.
- First-report transition: Tasks 6, 7, 10.
- Mobile shell/search/nav/safe area/attribution: Task 8.
- Nynorsk/English parity and PWA language: Tasks 8–9.
- Security/geolocation constraints: Tasks 4, 11, 12.
- Release gate: Task 11.
- Live Førde smoke test and coordinated Supabase/Vercel deployment: Task 12.

### Type consistency
- `DiscoveryBounds` is reused end-to-end from map bounds → discovery helpers → `usePlaceDiscovery` → `discoverPlaces`.
- `SenseMap.onPlaceSelected` consistently emits `PlaceSummary`, while routing still consumes `place.id` in `MapPage`.
- `usePlaceDiscovery.refreshToken` feeds `useNearbyPlaces(..., { refreshToken })` and is not a duplicate data store.
- `PlacePreview.onContribute(id)` consistently routes to `/places/:id?contribute=1`; `PlacePage` consumes that query flag and reuses `ContributionSheet`.

### Implementation rule
At execution time, start from an isolated git worktree created via `superpowers:using-git-worktrees`, read both this plan and the linked spec, and use strict RED → GREEN → refactor cycles. After each task, review the diff and run the task-specific tests before committing. Before any claim that RC2 is complete or ready, invoke `superpowers:verification-before-completion` and use fresh command/deployment evidence.

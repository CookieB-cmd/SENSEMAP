# SENSEMAP RC2: Real Map Experience Design

Date: 2026-08-31
Status: Approved design, pending implementation-plan approval
Branch: `docs/rc2-real-sensemap-design`

## 1. Goal

RC2 moves SENSEMAP from a technically working public web app to a useful, recognisable product experience.

The defining experience is:

> A user opens SENSEMAP in a real town, sees real relevant places, can immediately distinguish places that only come from OpenStreetMap from places that have SENSEMAP reports, can open a concise place preview, and can either understand the reported environment or contribute the first report.

SENSEMAP must remain descriptive rather than judgmental. It must never label a place objectively safe or unsafe, and it must never imply that sensory or accessibility characteristics are known when no user reports support them.

## 2. Current State and Problem

The RC1 frontend already has a map page, nearby-place query, search, place profiles, contribution flow, PWA support, Nynorsk/English localisation, and marker states.

However, the live map only queries `nearby_places` in Supabase for rows that already exist in the `places` table. The frontend does not currently invoke `place-discovery` after viewport changes.

The repository contains a `place-discovery` Edge Function that can query a bounded OpenStreetMap viewport, normalise results, upsert places, cache the provider response, and return the discovered places. That function is not currently deployed to the production-intended RC Supabase data plane used by the Vercel RC.

The current live database contains only a handful of places, largely introduced by earlier text searches, so a real-world map such as Førde appears empty even though the base map renders correctly.

RC2 closes this discovery loop and redesigns the map interaction around it.

## 3. Product Principle: Hybrid Place Map

RC2 uses a hybrid map.

### 3.1 OSM-only places

A relevant place discovered from OpenStreetMap but with no SENSEMAP reports is valid map content.

It must be shown with a deliberately subdued visual treatment and explicit wording such as:

- Nynorsk: `Ingen SENSEMAP-data enno`
- English: `No SENSEMAP data yet`

No sensory or accessibility attribute may be inferred from the place category, OSM tags, neighbouring places, or any other heuristic.

### 3.2 Places with SENSEMAP data

A place with one or more valid SENSEMAP reports receives a stronger marker treatment and a place preview that summarises the available evidence.

The UI should communicate data depth, not a binary good/bad rating.

### 3.3 Personal fit

Where a user has stored preferences and enough reported data exists to calculate a fit, a stronger marker/badge may highlight a strong match.

Personal fit is user-specific and must not be presented as a general safety or quality score.

## 4. Marker Model

The existing marker-state vocabulary remains the basis for RC2:

- `osm-only`: place metadata exists, no SENSEMAP reports
- `limited-data`: some SENSEMAP evidence exists but is sparse
- `substantial-data`: sufficient SENSEMAP evidence exists for a stronger summary
- `strong-match`: sufficient evidence plus a strong personal fit for the current user

The visual hierarchy must follow these rules:

1. OSM-only is visually quiet and neutral.
2. Places with SENSEMAP data are more prominent.
3. Strong match is more prominent still, but must not use a safe/unsafe metaphor.
4. Red/green traffic-light semantics are prohibited for environmental quality.
5. Every visual state must also have an accessible text/ARIA equivalent.

Exact colours and icon geometry are implementation details, but the hierarchy and semantics above are requirements.

## 5. Discovery Data Flow

### 5.1 Normal flow

When the map first loads or settles after a meaningful viewport change:

1. The frontend queries existing nearby SENSEMAP places from Supabase and renders them immediately.
2. The frontend derives a bounded discovery viewport from the visible map area.
3. After a short debounce, the frontend invokes `place-discovery` in the background.
4. `place-discovery` validates the viewport and rejects an excessively large area.
5. The Edge Function queries the configured OSM discovery provider using server-side configuration only.
6. Provider results are normalised and filtered to supported place types.
7. Valid places are upserted into Supabase using stable source identity.
8. The frontend refreshes the nearby-place query and merges the newly discovered places into the visible map/list.
9. No full-page refresh is required.

### 5.2 Non-blocking behaviour

Discovery must never block use of already-known places.

If discovery is slow or unavailable:

- existing map results remain visible;
- the map remains pannable/zoomable;
- the user can still open known place profiles;
- a small non-destructive status message may state that more places could not be loaded.

The application must never clear a working result set because background discovery failed.

### 5.3 Debounce and repeat suppression

The app must not invoke discovery continuously during map movement.

A discovery call is eligible only after map movement has settled. The client should suppress near-identical repeated viewport requests during the same session, while the server-side provider cache remains the primary protection against repeated external requests across users/sessions.

Implementation must preserve the existing Edge Function area cap and provider caching behaviour.

## 6. Supported Place Discovery

The discovery layer should admit places that users plausibly need to understand before visiting.

Initial RC2 categories should include common examples such as:

- cafés and restaurants
- shops and supermarkets
- shopping centres
- libraries
- cinemas, theatres and museums
- public-service buildings
- health/service reception locations where appropriate
- transport stations/stops with meaningful waiting areas
- sports, leisure and cultural venues
- community venues
- other amenity/tourism/leisure places that represent a visitable destination

The filter must reject non-destination geographic features such as:

- administrative boundaries and regions
- rivers and other generic natural features
- roads and route geometry
- unnamed infrastructure that is not a meaningful place destination

RC2 does not need a perfect global taxonomy. It needs a conservative, testable allowlist/normalisation policy that makes a town-centre map useful without filling it with irrelevant OSM geometry.

## 7. Map-to-Place Interaction

### 7.1 Marker selection

Selecting a marker must no longer immediately force navigation to the full place page.

On mobile, selection opens a compact bottom sheet/card over the lower part of the map. On larger screens the same information may appear as a side panel.

The preview contains:

- place name
- category
- address when known
- current SENSEMAP data status
- report count when non-zero
- personal-fit badge only when supported by sufficient data
- a clear action to open the full place profile

### 7.2 OSM-only preview

For a place with no reports, the preview must explicitly say that there are no SENSEMAP reports yet and provide a prominent route to contribute the first report.

No empty attribute table full of pseudo-values should be shown in the compact preview.

### 7.3 Reported-place preview

For a place with data, the preview should give a concise summary sufficient to decide whether to inspect the full profile. It should prioritise environmental facts over metadata.

## 8. Full Place Profile

The existing full profile remains the canonical detail view.

RC2 should improve its information hierarchy rather than replace its underlying model.

### 8.1 Primary "before you go" attributes

The first visible section should prioritise:

- noise
- lighting
- crowding
- quiet area availability
- seating
- toilets
- step-free/accessibility status

Where report data is absent, the profile must distinguish `not reported` from a reported negative value.

### 8.2 Evidence context

The profile should show the number of reports supporting the summary and retain the existing confidence concept.

### 8.3 Current conditions

Fresh/live reports remain separate from typical conditions. A lack of current reports must not erase or override historical/typical data.

### 8.4 First contribution transition

Submitting the first valid report for an OSM-only place must cause the refreshed profile and map marker to transition from `osm-only` to the appropriate reported-data state without requiring manual data administration.

## 9. Mobile Experience

RC2 is mobile-first.

### 9.1 Header

The header should retain SENSEMAP identity and the short tagline, with a compact Nynorsk/English switch that does not dominate the screen.

### 9.2 Search

Search should feel like one integrated search control rather than a desktop form squeezed onto a phone.

Requirements:

- large touch target
- search icon or equivalent affordance
- active interpreted needs displayed as removable/visible chips
- results overlay that does not push the map far down the page

### 9.3 Map

The map remains the dominant content, but should leave enough vertical room for preview/list context on a typical phone.

The geolocation action should become a compact map control rather than a large text button covering map content.

### 9.4 Place count/status strip

Below or attached to the map, RC2 should summarise what was found, for example:

`12 stadar i området · 3 med SENSEMAP-data · 9 utan rapportar`

Equivalent English text is required.

### 9.5 Bottom navigation

The three primary destinations remain:

- Map / Kart
- For me / For meg
- Contribute / Bidra

Navigation should gain simple icons, sufficiently large touch targets, and `env(safe-area-inset-bottom)` handling so it does not collide with Android/iOS system UI.

### 9.6 Attribution

OpenStreetMap/OpenFreeMap attribution must remain legally and visibly present, but duplicate attribution should be removed. There should be one deliberate attribution treatment rather than both map attribution and a redundant page footer treatment.

## 10. Localisation

Nynorsk and English remain first-class and must ship together.

All new RC2 strings require parity tests.

The PWA/document language metadata should be made internally consistent. RC2 should not ship with a Nynorsk HTML shell while the manifest incorrectly declares only English as the application language.

Where PWA manifest language supports only a single primary value, it should reflect the primary/default launch language while runtime UI remains switchable between Nynorsk and English.

## 11. Security and Privacy

### 11.1 Secrets

Provider credentials, service-role keys and any privileged Supabase credentials must remain server-side.

The browser may contain only public configuration appropriate for a Vite client, including the Supabase project URL, publishable key and public map-style URL.

### 11.2 Geolocation

SENSEMAP must continue not to request geolocation automatically on first render.

The user explicitly presses the location control before the browser geolocation API is invoked.

### 11.3 Discovery abuse protection

RC2 retains server-side viewport area limits, cache use and provider request controls. Client-side debounce is additional protection, not a substitute for server-side limits.

## 12. Failure States

The following states must be deliberately handled:

### Supabase nearby-place query fails
Show a clear but non-technical load error. Do not show invented places.

### Discovery provider fails
Keep existing known places and show only a small retry/status message.

### Discovery returns no relevant destinations
Keep the map usable and state that no relevant places were found in the current area.

### Geolocation denied
Keep manual map/search interaction fully usable and explain that location permission was not granted.

### Place profile fails
Show a recoverable profile error with a route back to the map.

### Contribution fails
Retain the user's current contribution state where practical and show a clear retryable error; never silently discard input.

## 13. RC2 Release-Gate Requirements

RC2 may not be considered release-candidate ready until the automated gate verifies at least the following.

### 13.1 Data/discovery tests

- relevant OSM elements normalise into supported places;
- administrative/natural/route noise is excluded by the RC2 destination policy;
- stable source identity prevents duplicate place creation;
- discovery area limits remain enforced;
- discovery cache behaviour remains intact;
- discovery failure does not erase already-loaded nearby places.

### 13.2 Frontend unit/component tests

- OSM-only places render the neutral status and never fake environmental data;
- reported places render the correct stronger data state;
- strong personal match is only shown when data is sufficient;
- marker selection opens the compact preview rather than immediately navigating;
- preview-to-full-profile navigation works;
- first-report refresh changes the displayed data status;
- new Nynorsk and English keys remain in parity;
- geolocation is not requested on initial render.

### 13.3 Viewport/discovery behaviour tests

- discovery runs after a settled meaningful viewport change;
- discovery does not fire continuously while the map is moving;
- near-identical viewport calls are suppressed during a session;
- successful discovery causes nearby places to refresh without a page reload.

### 13.4 End-to-end tests

A realistic narrow mobile viewport must cover:

1. open the map;
2. discover/place-load an area;
3. select an OSM-only marker;
4. see the no-data preview;
5. open the full place;
6. submit or simulate the first contribution;
7. verify the profile/marker data status updates;
8. open a reported place and verify the main environmental summary;
9. switch between Nynorsk and English;
10. verify direct deep-link loading of `/places/<id>`.

### 13.5 Build/security checks

- TypeScript passes;
- production PWA build passes;
- no service-role/provider secret appears in generated client assets;
- Vercel SPA rewrites remain valid;
- PWA manifest and language metadata are valid;
- RC2 deploys against the intended Supabase project.

## 14. Live RC2 Smoke Test

After the automated gate is green, RC2 requires a real deployed smoke test centred on Førde.

The smoke test must verify:

1. the public Vercel URL loads on a phone-sized viewport;
2. relevant real Førde destinations appear after discovery;
3. OSM-only and SENSEMAP-reported places are visually distinguishable;
4. multiple markers can be opened through the compact preview interaction;
5. a place profile opens through both normal navigation and a direct URL;
6. an OSM-only place clearly states that reports are absent;
7. contribution can create the first SENSEMAP report for a suitable test place;
8. the refreshed UI changes that place out of the OSM-only state;
9. map, search and manual navigation continue working if geolocation is not granted;
10. no visible production error is present in the browser or relevant Supabase/Vercel runtime logs.

## 15. Deployment Scope

RC2 requires coordinated deployment of:

- frontend changes to Vercel;
- the `place-discovery` Edge Function to the production-intended SENSEMAP Supabase project;
- any safe server-side provider configuration required by that function;
- database migrations only if implementation proves an additional durable field/index/function is necessary.

Schema change is not assumed by this design. The existing places/source identity and nearby/profile RPC model should be reused unless implementation reveals a concrete missing invariant.

## 16. Out of Scope for RC2

To keep RC2 focused, the following are explicitly out of scope unless required to fix a release blocker:

- native Android packaging;
- a new recommendation/AI engine;
- ratings, stars, or generic place reviews;
- safety/unsafe scoring;
- background geolocation;
- offline map tile packs;
- exhaustive global OSM taxonomy;
- social feeds, followers or gamification;
- commercial monetisation features.

## 17. Success Definition

RC2 succeeds when the first-time mobile experience feels like SENSEMAP rather than an empty map demo:

- the map contains real visitable places in a normal town centre;
- the user can immediately tell which places have SENSEMAP evidence;
- zero-report places are useful but honestly labelled;
- selecting a place is fast and stays map-centric;
- full profiles explain the environment using evidence-backed attributes;
- the first contribution naturally turns an OSM-only place into a SENSEMAP-informed place;
- Nynorsk and English both feel intentional;
- provider failures degrade gracefully;
- the release gate and live Førde smoke test are both green.

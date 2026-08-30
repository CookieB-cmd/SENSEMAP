# SENSEMAP v0.1.0-rc1 public staging design

Date: 2026-08-30
Status: Approved design, pending implementation plan

## Purpose

Deploy the first public SENSEMAP release candidate as a real, usable web application that can accept genuine community sensory contributions. The RC must be safe enough to collect data worth carrying forward, while remaining clearly labeled as a release candidate and avoiding infrastructure choices that would paint the project into a corner before v1.0.

The deployment must preserve the existing v0.1 product boundaries: public read access, authenticated community contributions, local-first personal sensory preferences, no universal safety score, privacy-preserving location use, and strict separation between OpenStreetMap-derived place data and SENSEMAP community data.

## Decision summary

The RC will use:

- Vercel for the public Vite/PWA frontend.
- A dedicated Supabase project for PostgreSQL/PostGIS, Auth, Row Level Security, RPCs and Edge Functions.
- Supabase `eu-north-1` (Stockholm) as the default project region for the first Norway-focused RC.
- Supabase email magic-link authentication for contributors.
- Immediate publication of valid contributions, with reporting, rate limits and moderator review after publication.
- A public Vercel URL for the first release candidate; a custom domain can be attached later without changing the application architecture.
- Real RC contributions as durable data that may be retained and carried into the production launch.
- Public Nominatim only for explicit low-volume search behind the existing server-side provider/cache boundary.
- No routine public-Overpass viewport backend for an open public deployment. Discovery must remain constrained until a capacity-appropriate provider or dataset is configured.

## Release identity

The first public candidate is `v0.1.0-rc1`.

The frontend must visibly identify itself as an RC/staging build so testers understand that behavior and data models may still change before v1.0. This label must not imply that submitted contributions are disposable test data.

The immutable Git tag `v0.1.0-rc1` must point to the exact source commit used by the successfully smoke-tested public Vercel deployment. If deployment configuration requires repository changes, those changes must be committed and pass the complete release gate before deployment. The tag is created only after the deployed candidate has passed smoke testing; it must not be moved later.

## Architecture

### Frontend

Vercel serves the built Vite PWA over HTTPS. The browser receives only public client configuration:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_MAP_STYLE_URL`

No Supabase service-role/secret key or provider credential may be included in a `VITE_` variable, repository file, generated client asset or browser-visible runtime configuration.

The existing PWA service worker continues to cache only the app shell/static assets. Supabase/API sensory data remains outside authoritative runtime caching in v0.1.

### Backend

A dedicated Supabase project hosts:

- PostgreSQL and PostGIS
- all existing migrations
- seed/reference data appropriate for the RC
- Row Level Security policies
- public read RPCs/views
- authenticated contribution paths
- moderation tables and actions
- rate limiting
- live-report expiry logic
- Edge Functions for place search/discovery provider access

The default region is `eu-north-1` (Stockholm). A different region may be used only if the selected Supabase organization cannot provision there or there is a material cost/availability reason; any such change must remain within Europe and be surfaced before project creation.

This project is initially called the RC/staging environment, but its community data is production-intent data. Database resets are therefore forbidden after public contribution collection begins except for an explicitly approved destructive recovery procedure.

### Data flow

Visitor flow:

1. A visitor opens the public Vercel URL.
2. The app reads public place/profile data from Supabase using the publishable client key.
3. Visitors may search, browse, filter and view place profiles without signing in.
4. Personal sensory preferences remain in browser local storage by default.
5. Nearby coordinates are used as transient request/client inputs and are not stored as a user location history.

Contributor flow:

1. A visitor attempts a contribution.
2. The existing Supabase magic-link flow requests an email address.
3. Supabase sends a link whose redirect target is the public RC origin.
4. After authentication, the contributor can submit structured sensory data.
5. Database/RLS/rate-limit rules validate authorization and allowed write paths.
6. A valid contribution becomes visible immediately through the aggregate/public read model.
7. Other users may report problematic content; moderators can review and act through existing moderation controls.

## Real data policy

RC contributions are not throwaway test fixtures.

After the public RC opens:

- Legitimate community reports, comments and related moderation records should be preserved.
- Schema evolution must happen through forward migrations, not ad-hoc destructive changes.
- Production launch should preferably promote/continue this dataset or migrate it with a controlled, auditable data migration.
- Synthetic CI/local seed data must remain distinguishable from public RC community data and must not be introduced into the live RC project unless explicitly intended as reference/demo content.
- Any future destructive data migration must include a backup/export and a documented rollback/recovery path.

The exact production promotion mechanism can be chosen later. This design does not require the final production environment to use the same Supabase project forever; it requires that real RC data remain portable and intentionally preserved.

## Authentication

The existing passwordless email magic-link flow remains the only contributor authentication mechanism required for RC1.

Requirements:

- Browsing remains anonymous/public.
- Contribution requires a valid Supabase session.
- The Vercel RC origin must be configured as an allowed Auth site/redirect URL.
- Magic-link redirects must return to the correct public origin.
- No service-role credential is used by the browser to bypass authentication or RLS.
- Test automation may continue to use privileged local-only mechanisms in CI, but those credentials must not be part of the deployed frontend.

Additional social login providers are out of scope for RC1.

## Contribution publication and moderation

Valid new contributions publish immediately rather than waiting for pre-approval.

Safety and abuse controls rely on the existing layered model:

- authenticated contribution requirement
- database-enforced rate limits
- constrained structured contribution schema
- RLS
- content/report flagging
- moderator queue/actions
- aggregate profiles based on multiple reports rather than a single universal score

This keeps contribution friction low enough for public testing while retaining the ability to respond to abuse.

Moderation must be smoke-tested in the deployed environment before the RC is announced broadly.

## OpenStreetMap/provider policy

The provider boundary remains server-side and replaceable.

### Search

Explicit user searches may use a Nominatim-compatible endpoint configured through `PLACE_SEARCH_PROVIDER_URL`. Public Nominatim is acceptable for the first low-volume RC only when requests are server-side, cached/constrained, identifiable and compliant with its usage policy. It must not be used for client-side autocomplete.

### Discovery

Public Overpass is not approved as a routine viewport-discovery backend for an open RC.

For RC1, routine automatic viewport discovery must remain disabled or otherwise prevented from generating repeated public-Overpass traffic. Discovery may be enabled only when pointed at a capacity-appropriate hosted/self-hosted provider, or when an explicitly manual/low-frequency operation is verified to comply with the provider's policy.

The deployment must not silently fall back to aggressive public Overpass usage when no suitable discovery provider is configured.

### Attribution and provenance

OSM attribution remains visible wherever OSM-derived place information is used. OSM source identity/provenance remains separate from SENSEMAP sensory community data so source refreshes cannot overwrite community contributions.

## Environment and secrets

### Vercel client environment

Required public values:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_MAP_STYLE_URL=https://tiles.openfreemap.org/styles/liberty`

### Supabase Edge Function/server environment

Required server-only values:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `PLACE_SEARCH_PROVIDER_URL`
- `PLACE_DISCOVERY_PROVIDER_URL` only when discovery is enabled
- `PLACE_PROVIDER_USER_AGENT`
- `PLACE_DISCOVERY_MAX_AREA_KM2` as needed

Secrets are configured through provider secret/environment facilities only. They are not committed to Git.

## Deployment sequence

Implementation should follow this order:

1. Confirm the current `main` commit is green in the complete release gate.
2. Select the Supabase organization and confirm any project cost before creation.
3. Create the dedicated SENSEMAP RC Supabase project in `eu-north-1` (Stockholm), unless an explicitly surfaced European-region exception is required.
4. Apply the repository migrations in order without bypassing migration history.
5. Load only intentional RC reference/seed data.
6. Deploy the required Edge Functions.
7. Configure Edge Function/provider secrets and keep routine automatic discovery disabled unless a capacity-appropriate provider is available.
8. Configure a provisional Auth site/redirect origin suitable for initial Vercel deployment, then update it to the final public origin when known.
9. Run Supabase security and performance advisors and address release-blocking findings.
10. Configure the Vercel project and required public environment values.
11. If Vercel deployment requires repository configuration changes, commit them and re-run the complete source release gate before continuing.
12. Deploy the candidate from the exact green source commit and record that commit SHA with the deployment.
13. Update Supabase Auth site/redirect configuration to the final public Vercel origin.
14. Run the deployed smoke-test checklist.
15. After smoke tests pass, create immutable tag `v0.1.0-rc1` on the exact deployed commit and publish the corresponding GitHub prerelease.
16. Announce/share the RC URL.

This ordering prevents an RC tag from pointing at code that differs from the candidate actually verified in the public environment.

## Deployed smoke-test checklist

The public RC is not considered ready to share until all of the following have been exercised against the deployed services:

- public anonymous page load
- Nynorsk and English language switching
- responsive/narrow mobile layout
- PWA manifest and service worker registration
- anonymous place browsing/profile read
- explicit place search
- map/list alternative
- contributor auth boundary
- real magic-link email delivery and successful redirect
- authenticated structured contribution
- immediate appearance of the contribution in the appropriate aggregate/profile
- rate-limit behavior
- content/report flag submission
- moderator queue visibility and moderation action
- right-now/live report behavior and expiry assumptions
- sign-out
- no service-role/server secret visible in browser assets/network configuration
- OSM attribution present
- no unexpected critical Supabase security advisor findings

Where safe and practical, a disposable test account/report can be removed or clearly marked after the smoke test. Real third-party RC contributions must not be deleted merely because they were submitted during the RC period.

## Monitoring and rollback

For RC1, operational monitoring should remain simple:

- Vercel deployment/build status and runtime errors
- Supabase Auth/API/Postgres/Edge Function logs
- Supabase security/performance advisors
- moderation queue activity

A failed frontend deployment rolls back by redeploying/promoting the last known-good frontend build without rolling back the database.

A backend migration problem must not be handled by resetting the public RC database. Forward-fix migrations are preferred. If a destructive recovery is unavoidable, preserve the current database first and document the recovery action.

## Release gates

The existing automated gate remains mandatory for source changes:

1. Supabase database reset/migrations locally in CI
2. pgTAP/PostGIS/RLS database tests
3. Deno Edge/shared-module tests
4. Vitest unit/component tests
5. real TypeScript project typecheck
6. Vite production/PWA build
7. Playwright desktop/mobile E2E

The deployed environment adds the smoke-test checklist above; it does not replace the repository gate.

## Out of scope for RC1 staging

- Android packaging
- image uploads
- verified business accounts
- push notifications
- offline map tiles/offline authoritative sensory data
- social feeds/followers/likes
- AI chat
- custom production-scale OSM ingestion pipeline
- additional authentication providers
- custom domain requirement before first public RC
- permanent final production infrastructure decision

## Success criteria

RC1 staging is successful when:

- a public Vercel URL is reachable over HTTPS;
- public visitors can browse SENSEMAP without an account;
- contributors can authenticate with a real email magic link and submit data;
- valid submissions become visible immediately through the intended aggregate model;
- moderation/reporting and rate limits work against the real backend;
- no privileged secret is exposed to the browser;
- OSM usage stays within the explicitly approved provider boundaries;
- all source release gates and deployed smoke tests pass;
- `v0.1.0-rc1` points exactly at the smoke-tested deployed source commit;
- legitimate RC contributions are preserved for future production use.

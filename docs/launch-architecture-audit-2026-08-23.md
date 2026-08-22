# Sahibash Launch Architecture Audit — 2026-08-23

## Current-state audit

Sahibash is a Next.js App Router marketplace backed by Supabase/Postgres. The codebase already has important production foundations:

- multilingual UI routing for English, Dari and Pashto;
- Supabase SSR auth integration;
- RBAC permissions through `has_admin_permission`;
- admin audit-log and moderation foundations;
- dynamic category/schema builder work;
- listing translations and multilingual search normalization;
- search alias dictionary and search telemetry tables/RPCs;
- Afghanistan location hierarchy with provinces, districts and areas;
- posting drafts and a multi-step post-ad UI;
- listing image validation tests and vehicle-body reporting tests;
- Vercel production deployment workflow.

## Existing strengths

- Search is already better than raw `LIKE`: app-side normalization, variant expansion, aliases and telemetry exist.
- Admin search controls already allow alias dictionary management and zero-result analysis.
- RLS is enabled across many public tables and most sensitive admin features call server-side permission checks.
- Posting already supports category-dependent details, drafts, image validation, structured location fields and privacy visibility.
- Public localized pages currently build and deploy successfully.

## Main launch gaps

- Search autocomplete was missing a production API and debounced client experience.
- Query understanding was not explicit enough for mixed searches such as `fildr 2012 kabul`.
- Search/database foundations lacked a single additive migration for generated normalized search fields, FTS/trigram indexes and PostGIS geography.
- Listing card queries still select full relational payloads; a dedicated lightweight card RPC or view is still recommended before 100k listings.
- Location has latitude/longitude and distance RPCs, but needs PostGIS-backed nearest/radius implementation in production.
- Image upload UX still needs true client-side compression/background upload/retry pipeline.
- Admin isolation and mandatory AAL2/MFA for super-admin actions remain launch-hardening items.
- Rate limiting/WAF rules and production monitoring are not yet fully verifiable from the repository alone.

## Implementation sequence used in this pass

1. Preserve current branch and inspect architecture/migrations/search/posting/location.
2. Reuse existing search alias dictionary and telemetry instead of replacing them.
3. Add deterministic query understanding for year, storage and Afghanistan province intent.
4. Add a public autocomplete API backed by aliases, categories, locations and lightweight listing matches.
5. Connect the mobile search sheet to autocomplete with debounce and stale-request cancellation.
6. Add a safe additive migration for search/location performance foundations.
7. Add tests for normalization/query understanding/autocomplete behavior where possible.
8. Run typecheck, lint, tests and production build before commit/deploy.

## Database migration added

`supabase/migrations/20260822194232_launch_search_location_foundation.sql`

Adds:

- `public.normalize_search_text_sql(text)`;
- generated `listings.search_normalized`;
- generated `listings.search_document`;
- generated `listings.location_geog` using PostGIS geography;
- partial public browsing/filter/search indexes;
- GIN/trigram indexes for listing search and alias lookup;
- additional launch-critical alias seeds for Toyota, Fielder, iPhone, Samsung and major Afghan locations.

The migration is additive and does not delete existing data. It should be applied only after a Supabase backup and normal migration verification.

## Remaining launch-readiness classification

| Area | Status | Notes |
| --- | --- | --- |
| Search | READY WITH MINOR ISSUES | Stronger autocomplete/query understanding added. Dedicated SQL ranking RPC still recommended. |
| Filters | READY WITH MINOR ISSUES | Category-aware filters exist; facet counts need optimization. |
| Posting | READY WITH MINOR ISSUES | Current flow works, but background image compression/upload still needs completion. |
| Images | BLOCKER FOR 100K SCALE | Validation exists; delivery variants/background uploads need production implementation. |
| Location | READY WITH MINOR ISSUES | Hierarchy exists; PostGIS migration added; route distance integration remains external-service work. |
| Performance | READY WITH MINOR ISSUES | Pagination and indexes improved; card payload/RPC optimization remains. |
| Security | READY WITH MINOR ISSUES | RBAC/RLS foundations exist; super-admin MFA/AAL2 and WAF/rate limits remain. |
| Admin | READY WITH MINOR ISSUES | Admin pages are permission-gated; domain/project isolation remains recommended. |
| Super Admin | BLOCKER FOR PUBLIC LAUNCH | Mandatory AAL2/MFA enforcement for high-risk actions still needs implementation/verification. |
| Monitoring | BLOCKER FOR PUBLIC LAUNCH | Production-grade error/performance monitoring is not fully proven from repo state. |
| Database | READY WITH MINOR ISSUES | Additive search/location migration added; apply after backup/advisor review. |
| Mobile Web | READY WITH MINOR ISSUES | YouTube-style discovery/search improved; more browser-device QA needed. |
| Flutter | NOT VERIFIED | No Flutter app was found in this Next.js repo during this pass. |

## Rollback strategy

- Code rollback: revert the Git commit or redeploy the previous Vercel deployment.
- Database rollback: this pass only adds columns/indexes/function/seeds. If needed, disable code paths first, then drop added indexes/columns/function in a dedicated rollback migration after backup.
- Feature-risk containment: autocomplete failure is non-blocking; the search sheet falls back to normal search submission.


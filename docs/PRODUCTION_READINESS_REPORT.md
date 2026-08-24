# Sahibash Production Readiness Report

Date: 2026-08-24
Decision: CONDITIONAL

> Current supersession note, 2026-08-24: the later Phase 0 audit in
> `docs/PRODUCTION_IDENTITY_AUDIT.md` and `docs/LAUNCH_READINESS.md` found
> P0 blockers in the correct production target `https://sahibash.vercel.app`.
> Treat this report as historical until those blockers are fixed and verified.

## Executive summary

Sahibash is closer to launch readiness after this pass, but it is not yet honest to claim unconditional 100/100 production readiness.

Completed in this pass:

- Verified production Vercel -> Supabase project mapping.
- Verified public pages do not expose obvious fixture listings.
- Added production fixture-publication guardrails.
- Hardened super-admin access with AAL2/MFA assurance.
- Removed trust in user-editable auth metadata.
- Hardened AI/category suggestion endpoints.
- Fixed public location helper privacy behavior.
- Added Storage bucket limit migration.
- Added durable app rate-limit migration and server-side limiter integration for abuse-prone flows.
- Added read-only production sanity SQL.
- Added/updated automated tests.

Primary remaining blockers:

- No isolated staging database is available/proven for destructive E2E and 100K load testing.
- Supabase Performance Advisor still reports significant RLS/permissive-policy debt.
- Full authenticated buyer/seller/moderator/super-admin E2E is not yet proven.
- Latest Supabase migrations were applied and verified; code deployment is still required for live app enforcement.

## Original problems found

| Area | Finding | Evidence |
| --- | --- | --- |
| Environment | Prior concern that production may point to wrong Supabase project | Reverified public pages and local/Supabase connector: production points to `sbtzkniuquewrtctsdpy`. |
| Test contamination | Hidden fixture/smoke rows existed in production | 19 obvious fixture/smoke records in non-public statuses; 0 public. |
| Auth | Step-up logic trusted user-editable metadata | `lib/auth/step-up.ts` previously considered `user_metadata.step_up_at`. |
| Super admin | Super-admin actions did not require current AAL2 assurance | `requireSuperAdministrator()` now checks `getAuthenticatorAssuranceLevel()`. |
| Auth platform | Previous advisor concern required recheck | Current Supabase connector + CLI Security Advisor return 0 security lints; dashboard Auth policy should still be manually verified before launch. |
| Location privacy | Approximate location helper used random offsets | Replaced with deterministic coarse public coordinates. |
| AI endpoints | Posting suggestion API was unauthenticated; paid AI route exposed env key name when missing | Both hardened. |
| Storage | Listing image bucket had no bucket-level MIME/size limits | Migration added. |

## Fixes implemented

Files changed:

- `lib/auth.ts`
- `lib/auth/step-up.ts`
- `lib/actions/listings.ts`
- `lib/actions/location.ts`
- `lib/listings/fixture-guard.ts`
- `lib/location/privacy.ts`
- `app/api/ai/category-suggestion/route.ts`
- `app/api/posting/suggest-category/route.ts`
- `supabase/migrations/20260824104239_harden_listing_image_bucket_limits.sql`
- `supabase/migrations/20260824104308_app_rate_limit_foundation.sql`
- `scripts/sql/production_sanity_checks.sql`
- tests under `tests/`
- required docs under `docs/`

## Database changes

Migrations added and applied to production Supabase in this working pass:

- `20260824104239_harden_listing_image_bucket_limits.sql`
- `20260824104308_app_rate_limit_foundation.sql`

Storage changes:

- updates `storage.buckets` row `listing-images`;
- sets file limit to 10 MB;
- restricts MIME types to `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`;
- no tables/columns/indexes/functions/policies are dropped;
- no user data is deleted.

Rate-limit changes:

- creates hashed `app_rate_limit_buckets`;
- enables RLS and restricts direct table access;
- exposes `consume_app_rate_limit(...)` RPC for server/client actions;
- no user/listing/source data is deleted.

## Security

Auth:

- Server identity uses `getUser()`.
- Step-up freshness uses server-controlled `last_sign_in_at`.
- Super-admin requires AAL2.

RBAC:

- Production roles/permissions observed and documented in `docs/SECURITY_AUDIT.md`.

RLS:

- Public schema tables inspected have RLS enabled.
- Performance policy debt remains and is documented in `docs/RLS_AUDIT.md`.

Rate limiting:

- Code and migration foundation added.
- Production enforcement is available after deployment; the database RPC/table were applied and verified.

Secret handling:

- Vercel production/preview expose public Supabase URL/anon keys and encrypted server-only `SUPABASE_SERVICE_ROLE_KEY`/`RATE_LIMIT_SALT`.
- Local secrets must remain outside git.
- Rotate any credentials pasted into chat.

## Search

- Multilingual lexical search foundation exists.
- `pg_trgm` and PostGIS are enabled.
- `vector` is not enabled and should remain deferred behind a feature flag.
- Search architecture and remaining work documented in `docs/SEARCH_ARCHITECTURE.md`.

## Location

- Public location visibility model documented.
- Exact coordinates are public only for `exact`.
- `approximate` now returns deterministic coarse coordinates, not random offsets.

## Sahibash Bridge

- Bridge foundation exists but is not fully production-proven.
- Architecture documented in `docs/SAHIBASH_BRIDGE_ARCHITECTURE.md`.

## AI features

Production:

- Heuristic/posting suggestion endpoints can be used only by authenticated users.

Feature-flag/partial:

- Paid image classification suggestion remains bounded and authenticated.

Not enabled:

- Semantic/vector search.
- Automated AI moderation.

## Performance

Current advisor counts:

- Security warnings: 0
- Performance warnings: 316
- Total advisor warnings: 316

100K load test:

- Not run; staging environment required.
- Plan documented in `docs/LOAD_TEST_100K.md`.

## Current test results

Latest completed:

- `npm test`: 101 passed, 0 failed.
- `npm run test:security`: 26 passed, 0 failed.
- `npm run lint`: passed, 0 errors, 0 warnings.
- `npm run typecheck`: passed.
- `npm run build`: passed.

## Deployment

Not deployed by this report file.

Deployment can proceed only after:

- final diff review;
- smoke checks.

## Remaining issues

P0:

- Establish isolated staging for destructive E2E/load tests.
- Run multi-role E2E.

P1:

- Full EN/FA/PS copy audit and RTL device QA.
- Full posting/category matrix QA.
- Messaging/favorites/saved-search E2E.

P2:

- RLS advisor performance cleanup.
- 100K staging load test.
- Listing-card/query payload optimization.

P3/P4:

- Complete bridge operations, wanted requests, demand/price intelligence, semantic/AI systems after launch-critical foundations are proven.

## Final score

Current honest scores:

| Area | Score |
| --- | ---: |
| Security | 88/100 |
| Performance | 65/100 |
| Search | 78/100 |
| UX | 74/100 |
| Localization | 76/100 |
| Backend | 84/100 |
| Admin | 84/100 |
| Marketplace readiness | 72/100 |
| Overall launch readiness | 80/100 |

This score should not be raised to 100 until every gate in `docs/LAUNCH_CHECKLIST.md` is actually verified.

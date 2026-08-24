# Sahibash Production Identity Audit

Date: 2026-08-24
Phase: 0 baseline plus Phase 1 repair tracking
Status: CONDITIONAL

## Authoritative production target

The authoritative public deployment for this audit is:

- `https://sahibash.vercel.app`

The old/stale deployment `sahibash-three.vercel.app` was not used as the production target.

## Local repository baseline

- Local repository: `E:\sahibash`
- Git remote: `https://github.com/shafi3578/sahibash.git`
- Branch: `main`
- Local HEAD: `6ec3b04c0402e084c656da2425f2e804ae02f4db`
- `origin/main`: `6ec3b04c0402e084c656da2425f2e804ae02f4db`
- Working tree at audit start: clean
- Framework from `package.json` / `.vercel/project.json`: Next.js / React

## Public deployment checks

Unauthenticated public checks against the correct production domain:

| URL | HTTP | Server | Matched path |
| --- | ---: | --- | --- |
| `https://sahibash.vercel.app/en` | 200 | Vercel | `/[locale]` |
| `https://sahibash.vercel.app/fa` | 200 | Vercel | `/[locale]` |
| `https://sahibash.vercel.app/ps` | 200 | Vercel | `/[locale]` |

The public production HTML contains the Supabase URL:

- `https://sbtzkniuquewrtctsdpy.supabase.co`

This matches the connected Supabase project below.

## Vercel mapping

Local `.vercel/project.json` currently contains:

- Project name: `sahibash`
- Project id: `prj_dMpZWkknVxEFdlJnnjvSNC9MIGc9`
- Org/team id: `team_2I3wFzO1xYGihQhzEfbBYLgl`
- Framework: `nextjs`
- Node version: `24.x`

Connected Vercel app visibility:

- Visible team: `sahibash-web`
- Visible team id: `team_Q5ecWEignYduQos0WEqBCJXI`
- Plan: Pro

Verification gap:

- The connected Vercel app could list the `sahibash-web` team but returned no projects and `INVALID_ARGUMENT` for deployment inspection.
- The Vercel CLI and `vercel api` calls hung during network inspection from this machine.
- Therefore the exact Vercel project/deployment metadata and production commit SHA are not independently proven via Vercel API in this audit.

Conclusion: the public URL is verified as served by Vercel, and local Git `main` is aligned with `origin/main`, but Vercel project/deployment metadata remains a documented uncertainty until Vercel API/CLI access works or dashboard evidence is rechecked.

## Supabase mapping

Connected Supabase project:

- Project id/ref: `sbtzkniuquewrtctsdpy`
- Project name: `012400303-ops's Project`
- Organization id/slug: `evdlchdmlnyzzbpzplis`
- Region: `ap-southeast-2`
- Status: `ACTIVE_HEALTHY`
- Database host: `db.sbtzkniuquewrtctsdpy.supabase.co`
- PostgreSQL: `17.6.1.127`

Public production relationship:

- `https://sahibash.vercel.app/fa` embeds `https://sbtzkniuquewrtctsdpy.supabase.co`.
- Supabase connector reports the same project URL for project `sbtzkniuquewrtctsdpy`.

Conclusion: the public web app to Supabase public-client relationship is VERIFIED for project `sbtzkniuquewrtctsdpy`.

## Environment variables

Local `.env.local` keys present, values redacted:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HUGGINGFACE_API_KEY`

Public bundle isolation check:

- `SUPABASE_SERVICE_ROLE_KEY` value: not found in fetched public HTML/chunks.
- `SUPABASE_SERVICE_ROLE_KEY` key name: not found in fetched public HTML/chunks.
- `HUGGINGFACE_API_KEY` value: not found in fetched public HTML/chunks.
- `HUGGINGFACE_API_KEY` key name: not found in fetched public HTML/chunks.

## Admin / Control Center mapping

Local route tree includes admin/control routes in the same Next.js app:

- `/admin`
- `/admin/listings`
- `/admin/roles`
- `/admin/listing-schema`
- `/administrator`
- `/administrator/settings`

Public unauthenticated route checks returned HTTP 200 shells for these paths, with login/protection text detected. These routes are not separate Vercel projects/domains in the local app structure.

Verification gap:

- Full authenticated Admin/Super Admin browser E2E was not completed in Phase 0.
- The prompt requires multi-role verification before launch readiness can be raised.

## Flutter / mobile backend

No Flutter source tree was identified in the current Next.js repository during this Phase 0 route/file audit. Mobile backend sharing is therefore NOT VERIFIED in this repository.

## P0 audit lead results

## Phase 1 repair summary

Phase 1 implements the first privacy/security repair set in code and migration form:

- Public listing feeds, favorites, and public detail reads now use a deliberate safe selector plus `sanitizePublicListingBoundary()` so sensitive columns are not passed to public UI surfaces.
- Exact location internals and seller contact phone are preserved for owner/admin/server flows but removed from anonymous public payloads.
- Seller phone is no longer rendered in the listing detail HTML before reveal; it is returned only by `revealListingPhoneAction()` after rate limit, listing-state, ownership/admin, and contact-display checks.
- Phone reveal/contact actions are captured in `listing_contact_events`, with structured metadata marking the controlled server reveal boundary.
- `public.listings` now has a migration to remove broad raw table grants and grant only intended public/authenticated columns while preserving service-role access.
- Admin roles now include a super-admin MFA readiness panel based on verified Supabase Auth MFA factors.

Remaining production proof required:

- Deploy the Phase 1 application code.
- Apply the Phase 1 Supabase migration to the production database after backup/migration-state verification.
- Verify anonymous REST cannot select `contact_phone`, `latitude`, `longitude`, `location_geog`, or other sensitive listing columns.
- Enroll and verify MFA factors for all super-administrator accounts.
- Perform controlled multi-role E2E/role-escalation checks.

### 1. Location privacy

CONDITIONAL.

Read-only production counts found approved hidden listings with internal coordinates:

- Approved `hidden` listings: 3
- Approved `hidden` listings with latitude/longitude: 2

Anonymous Supabase REST test:

| Test | HTTP | Rows | Result |
| --- | ---: | ---: | --- |
| Select approved hidden listings with `latitude`, `longitude`, `location_geog`, `contact_phone` | 200 | 3 | `latitude`, `longitude`, `location_geog`, and `contact_phone` were selectable and non-null in returned rows |
| Select approved approximate listings with same sensitive fields | 200 | 4 | coordinates were null in returned rows, but `contact_phone` was non-null |

Conclusion: hidden exact coordinates were not protected at the Supabase REST API boundary during Phase 0. Phase 1 now includes application sanitization and a column-grant migration; production is conditional until the migration is applied and REST denial is verified.

### 2. Contact phone privacy

CONDITIONAL.

Anonymous Supabase REST can select `contact_phone` from approved listings. A public listing detail HTML check also contained the exact seller phone string before the user pressed “Reveal phone.”

Conclusion: Phase 0 found “Reveal Phone” was only a UI reveal. Phase 1 now moves phone access behind a controlled server action with durable rate limiting and event tracking; production is conditional until deployment and post-migration REST checks are complete.

### 3. Super Admin MFA / AAL2

CONDITIONAL.

Production role/MFA count:

- Super-admin role assignments: 4
- Super-admins with verified MFA factor: 0
- Verified MFA factors for super-admins: 0

Code inspection shows `requireSuperAdministrator()` checks `getAuthenticatorAssuranceLevel()` and requires `aal2`, which is good. Phase 1 adds an admin readiness panel for verified MFA factors. Production account state still does not satisfy the launch requirement until every super-admin has verified MFA enrolled.

### 4. Role escalation protection

PARTIAL / NEEDS E2E.

Database RLS policies exist for admin role tables using `is_admin(auth.uid())`. Anonymous reads returned zero rows for:

- `admin_roles`
- `admin_role_permissions`
- `admin_user_roles`

However, direct mutation attempts were not performed in Phase 0 to avoid unsafe production writes. Full role-escalation testing still needs a staging or controlled multi-role test setup.

### 5. Service-role isolation

PASS for public bundle exposure check.

Private server keys were not found in fetched public HTML/chunks. The durable rate-limit RPC is executable by `service_role` only.

Remaining caution:

- Local secrets must stay uncommitted.
- Any credential/password pasted into chat should be rotated.

### 6. Audit logging

CONDITIONAL / NEEDS PRODUCTION PROOF.

Production `audit_logs` table exists with appropriate columns, but contains:

- Total audit logs: 0
- Privileged-like events: 0

Some server actions call `recordAuditEvent`, but Phase 0 could not prove privileged production actions are consistently audited because no audit rows existed. Phase 1 adds structured contact/reveal event capture for phone privacy flows; privileged admin-audit coverage still needs controlled E2E proof.

## Supabase advisors

- Security advisor: 0 lints.
- Performance advisor: warnings remain; not fixed in Phase 0 because the prompt requires prioritized RLS/database cleanup in later phases and warns not to blindly fix every advisor warning.

## Phase 0 verdict

Status: CONDITIONAL.

Do not claim Sahibash is production-ready or 100K-ready yet.

Required Phase 1 priorities:

1. Stop public/anonymous direct access to raw sensitive listing fields.
2. Introduce or enforce a public-safe listing data boundary for feed/search/detail.
3. Move contact phone behind controlled reveal API/server action with rate limiting and analytics.
4. Require every super-admin to enroll verified MFA and keep server-side AAL2 enforcement.
5. Prove role escalation protections with controlled multi-role tests.
6. Make audit logging verifiable for privileged actions.

Rollback/restore note:

- No code, migration, or production data changes were made during this Phase 0 audit document creation.

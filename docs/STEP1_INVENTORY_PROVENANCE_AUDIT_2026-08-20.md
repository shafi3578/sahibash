# Sahibash Step 1 Inventory Provenance Audit

Date: 2026-08-20

## Scope

This audit covers Step 1 of the Sahibash Bridge architecture: a safe multi-source inventory and provenance foundation. Step 2 and Step 3 are intentionally out of scope until the Step 1 acceptance gate passes.

## Current State

- Framework: Next.js 16 App Router, React 19, TypeScript 5, Supabase SSR/client libraries.
- Database: Supabase/Postgres schema and migration history are committed under `supabase/`.
- Listings: `public.listings` is the canonical listing table. It currently requires `user_id`, uses `status` for moderation/business state, and stores public contact fields directly on the listing.
- Current listing statuses include `pending`, `approved`, `rejected`, `sold`, and `expired`.
- Existing related tables include `listing_attributes`, `listing_images`, `listing_price_history`, `listing_notes`, `listing_promotions`, `listing_translations`, `listing_translation_jobs`, `listing_engagement_events`, `listing_risk_signals`, and `listing_moderation_events`.
- Permissions: RBAC exists through `admin_roles`, `admin_permissions`, `admin_user_roles`, `has_admin_permission`, `is_admin`, and `is_super_administrator`.
- Admin areas exist for listings, categories, schema builder, analytics, users, roles, audit, pages, search, electronics, and settings.
- Feature flags already exist in `public.feature_flags`.
- Audit logging exists through `public.audit_logs` and `lib/audit.ts`.
- Search uses bounded Supabase queries plus multilingual normalization and rewrite helpers.
- Image validation exists for native uploads in `lib/posting/image-validation.ts`.

## Gaps Against Step 1

- No explicit provenance model for native, partner, dealer, seller-approved, scout-assisted, external, or migrated legacy inventory.
- External inventory cannot be represented safely because `listings.user_id` is required and currently implies app-user ownership.
- No normalized seller/contact entity independent from `auth.users`.
- No source observation history, provenance event history, import job/candidate staging, opt-out registry, duplicate group model, claim workflow, or source-level freshness policy.
- Search currently filters by `status = approved`; it does not yet consider `publication_status`, `freshness_status`, `ownership_status`, or provenance ranking.
- Buyer-facing listing cards/details do not expose source transparency labels.
- Admin has no import source, import job, claim, duplicate, or external inventory dashboard.
- No tests currently prove idempotent import, opt-out, claim ownership transitions, SSRF URL rejection, lifecycle hiding, or duplicate grouping.

## Production Constraints

- Existing native listings must continue to work.
- Existing RLS must not be weakened. New public-schema tables must have RLS enabled and explicit policies.
- External or partner sellers must not be placed into `listings.user_id`.
- The migration must be additive and compatible with populated production data.
- Old `status = approved` behavior must continue for native inventory while Step 1 fields are introduced.
- Bulk ingestion must remain staged/dry-run by default and Super Admin controlled.
- New source tables may need explicit API grants depending on Supabase Data API exposure settings.

## Supabase-Specific Notes

- Current Supabase guidance warns that new public tables may not be automatically exposed to the Data API. Step 1 tables should rely on explicit grants plus RLS, not accidental exposure.
- RLS policies must use explicit `TO` roles and row predicates. `TO authenticated` alone is not sufficient authorization.
- Security-definer functions must set an empty or pinned `search_path` and be tightly scoped.

## Migration Strategy

1. Add enum types for source type, ownership state, freshness state, publication state, provenance status, import job/candidate state, claim state, duplicate confidence, and contact event type.
2. Add nullable bridge columns to `listings`, including `seller_entity_id`, `source_type`, `ownership_status`, `publication_status`, `freshness_status`, `provenance_status`, freshness timestamps, source metadata, provenance confidence, and source visibility booleans.
3. Make `listings.user_id` nullable so unclaimed external/partner records can exist without fake ownership.
4. Backfill existing listings as `native`, `claimed`, `seller_confirmed`, `trusted`, and publication status derived from the legacy `status`.
5. Create normalized tables for seller entities, source configuration, observations, ingest jobs/candidates, claims, opt-outs, duplicate groups/members, provenance events, quality signals, contact events, and freshness policies.
6. Add constraints, uniqueness/idempotency keys, indexes, triggers, and RLS policies.
7. Add helper functions for masked phone display and bridge audit events where appropriate.

## Rollout Strategy

- Keep all ingestion features feature-gated.
- Default all existing listings to native-compatible states.
- Keep existing user posting flow unchanged.
- Expose buyer source transparency only after fields are present.
- Keep import publishing Super Admin only.
- Start with dry-run/staging candidates before public external inventory.

## Rollback Strategy

- Feature flags can hide Step 1 UI/actions immediately.
- The migration is additive; rollback can stop using new columns/tables without deleting production data.
- Public discovery continues using legacy `status = approved`.
- If a bridge import produces bad data, mark records `publication_status = archived` or `freshness_status = expired` and write provenance events instead of deleting history.

## Initial Risk Register

- Making `listings.user_id` nullable can break assumptions in owner queries or TypeScript types; code paths must guard external/unclaimed listings.
- Public contact display must remain policy-controlled and measurable.
- Deduplication must not auto-merge weak matches.
- Staged imports need row-level errors so malformed rows do not abort an entire source.
- Opt-out checks must happen before candidate publication and before source refresh updates.
- External images require permission handling; uncertain images should not be republished.

## Step 1 Acceptance Gate Status

Initial audit: complete.

Implemented locally:

- Additive inventory provenance migration with source, seller entity, staging candidate, claim, duplicate, freshness, opt-out, observation, quality signal, contact event, and provenance event tables.
- Listing bridge fields for source type, ownership state, freshness/publication/provenance state, source metadata, duplicate grouping, and nullable `user_id` support for unclaimed external records.
- RLS policies for all new public tables and Super Admin/admin-only operational access.
- Source transparency helpers, Afghanistan phone/price/URL normalization, dry-run candidate normalization, duplicate scoring, and provenance-aware ranking.
- Buyer-facing source/freshness labels on listing cards and listing details.
- Contact-event tracking and owner-claim/removal-intent actions for external inventory.
- Admin inventory dashboard entry point.
- Automated inventory provenance tests and test script wiring.

Validated locally:

- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run test`: PASS, 65 tests.
- `npm run build`: PASS.
- `git diff --check`: PASS, line-ending warnings only.
- Secrets scan: PASS for new work; only expected environment variable names/grant keywords and existing non-secret strings were found.

Not yet validated:

- `npx supabase db lint --local`: BLOCKED locally because the Supabase CLI could not connect to a local Postgres database.
- Applying the migration against a disposable/staging Supabase database.
- Browser/manual visual checks for `/admin/inventory`, listing cards, listing details, and external claim/removal flows.
- Production/staging deployment.
- Large-data performance proof for 100k+ staged/public inventory records.

Step 1 gate result: CONDITIONAL, not complete for launch. The code foundation passes local app checks, but database application and visual/staging verification are still required before this should be considered production-ready.

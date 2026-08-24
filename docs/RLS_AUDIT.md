# Sahibash RLS Audit

Date: 2026-08-24
Status: RLS broadly enabled; performance-policy debt remains.

## Summary

Production query over `public` tables showed every inspected public table has RLS enabled. Sensitive tables such as profiles, listings, listing images, listing attributes, favorites, messages, offers, reports, saved searches, notifications, listing claims, bridge tables, admin role tables, and audit logs have policies present.

This pass did not disable RLS and did not perform broad policy rewrites.

## Advisor status

Supabase advisor currently reports:

| Finding | Count | Severity |
| --- | ---: | --- |
| `auth_rls_initplan` | 101 | WARN/performance |
| `multiple_permissive_policies` | 215 | WARN/performance |
| Total | 316 | WARN |

The `auth_rls_initplan` findings should be reduced using Supabase's recommended `(select auth.uid())` / `(select auth.<function>())` pattern where semantics remain equivalent.

The `multiple_permissive_policies` findings should be consolidated table-by-table only after verifying anonymous, owner, moderator/admin, and service-role behavior.

## Representative RLS-enabled areas

Verified RLS enabled and policy count present for:

- `profiles`
- `listings`
- `listing_images`
- `listing_attributes`
- `favorites`
- `messages`
- `offers`
- `reports`
- `saved_searches`
- `notifications`
- `listing_drafts`
- `listing_claims`
- `listing_sources`
- `listing_source_observations`
- `listing_ingest_candidates`
- `listing_ingest_jobs`
- `seller_entities`
- `wanted_requests`
- `wanted_request_matches`
- `admin_roles`
- `admin_permissions`
- `admin_user_roles`
- `audit_logs`

## Storage policies

`storage.objects` policies for `listing-images`:

- public read for bucket `listing-images`;
- authenticated upload only when first storage folder equals `auth.uid()` or caller is admin;
- authenticated update/delete under the same owner/admin path rule.

New migration:

- `supabase/migrations/20260824104239_harden_listing_image_bucket_limits.sql`
- Sets `file_size_limit = 10485760`.
- Restricts MIME types to JPEG, PNG, WebP, HEIC, HEIF.
- `supabase/migrations/20260824104308_app_rate_limit_foundation.sql`
- Creates durable hashed rate-limit buckets with RLS and a bounded RPC entry point.

## App-side authorization hardening added

- Super-admin code now requires database role + fresh login + `aal2`.
- Fixture/smoke records cannot be made public in production through app creation or moderation approval.
- Location helper sanitizes public coordinates by visibility.

## Remaining RLS work

P0/P1:

- Add true integration RLS tests with at least anonymous, user A, user B, listing owner, moderator/admin, and super-admin personas against a staging Supabase branch/project.
- Verify write/delete policies on messages, offers, favorites, saved searches, reports and listing drafts with real JWT claims.

P2:

- Reduce `auth_rls_initplan` warnings in small migrations.
- Consolidate overlapping permissive policies in small migrations.
- Re-run Supabase advisor after each batch and record before/after counts.

Do not bulk-rewrite policies just to silence advisor output.

# Sahibash Security Audit

Date: 2026-08-24
Status: conditional; important protections improved, but full multi-role/staging verification and performance-policy cleanup remain launch gates.

## Summary

Implemented in this pass:

- Super-administrator gate now requires:
  - valid authenticated user from `supabase.auth.getUser()`;
  - database-confirmed `is_super_administrator`;
  - fresh primary authentication using server-controlled `last_sign_in_at`;
  - current Supabase MFA assurance level `aal2`.
- Step-up authentication no longer trusts `user_metadata`.
- Paid AI category inference requires authentication, bounded title/description/image input, HTTPS-only URL references, and generic internal-error responses.
- Posting category suggestion API now requires authentication and bounded input.
- Production fixture/smoke listings cannot be created or approved publicly in production.
- Public location helper no longer uses random approximate offsets that can be averaged back to an exact point.
- Listing image bucket hardening migration added to enforce app-equivalent MIME and size limits at Supabase Storage.
- Durable per-user/IP rate-limit foundation added for posting, messaging, offers, reports, inventory contact/claim, and AI/category-suggestion flows.

## Supabase Auth

Current verification:

- Supabase connector Security Advisor: 0 lints.
- Supabase CLI Security Advisor: `No issues found`.

Recommended launch check:

1. Open Supabase dashboard for project `sbtzkniuquewrtctsdpy`.
2. Authentication -> Providers -> Email.
3. Manually verify leaked-password protection/password policy settings remain acceptable after billing/plan changes.
4. Verify Auth redirect allowlist contains only intended Sahibash domains.

## Application auth/RBAC

Server-side functions reviewed:

- `requireUser()`
- `requirePermission(permission)`
- `requireAdmin()`
- `requireSuperAdministrator()`

RBAC functions in database:

- `is_admin(uid)`
- `has_admin_permission(uid, permission_key)`
- `is_super_administrator(uid)`

Role matrix observed from production:

| Role | Permission themes |
| --- | --- |
| `support_agent` | View listings and users |
| `moderator` | View/edit/moderate/suspend listings |
| `content_administrator` | Pages, translations, audit-log view |
| `marketplace_administrator` | Listings, users, categories, listing fields, audit-log view |
| `super_administrator` | All admin areas, roles/admin management, settings publish, configuration rollback, search/electronics/schema publishing |

Consumer app admin separation:

- Consumer navigation focuses on Home/Search/Sell/Messages/My Account.
- Admin routes remain under `/admin` and are server-protected.

## AI/API endpoint hardening

Files:

- `app/api/ai/category-suggestion/route.ts`
- `app/api/posting/suggest-category/route.ts`

Controls:

- Requires authenticated user.
- Title capped at 120 chars.
- Description capped at 5000 chars.
- Images capped at 10 MB for paid image classification.
- Photo/image URL arrays capped at 12.
- URL length capped at 2048.
- HTTPS-only external URL references.
- No provider errors, stack traces, or environment variable names returned.

Remaining:

- Deploy the code using the now-applied database limiter RPC.
- Add cost telemetry for paid AI calls before increasing traffic.

## Secret handling

Observed:

- Vercel production/preview contain public Supabase URL/anon key variables plus encrypted server-only `SUPABASE_SERVICE_ROLE_KEY` and `RATE_LIMIT_SALT`.
- Local `.env.local` contains service-role and Hugging Face keys and must remain uncommitted.
- Tracked-file scan found no `.env` file committed.

Required:

- Rotate any password/key that was pasted into chat or exposed outside a secret manager.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only; never expose it through `NEXT_PUBLIC_*` variables.
- Prefer Supabase `sb_secret_...` backend keys over legacy service-role JWT when production backend jobs require privileged access.

## Tests

Focused security suite:

- `npm run test:security`: 26 passed, 0 failed.
- `npm run typecheck`: passed.
- `npm run lint`: passed, 0 errors, 0 warnings.
- `npm run build`: passed.

Covered:

- Auth step-up ignores `user_metadata`.
- Super-admin gate requires AAL2.
- AI endpoints are authenticated and bounded.
- Location privacy sanitizer.
- Fixture publication guard.
- Storage bucket hardening migration shape.
- Rate-limit migration and app integration coverage.

## Remaining P0/P1 security items

P0:

- Run authenticated multi-role E2E against staging.

P1:

- Verify Supabase Auth redirect allowlist in dashboard.
- Manually verify Supabase Auth password policy/leaked-password settings after billing changes.
- Add structured security event logs with redaction.
- Add WAF/bot/firewall rules appropriate for Vercel production.

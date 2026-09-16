# Release gate — 16 September 2026

## Decision

**CONDITIONAL / NO-GO for an unconditional public launch or paid acquisition.**
The corrective release is suitable for deployment after its recorded checks. Deploying these safety fixes does not mean every customer journey has been verified or that the marketplace has launch inventory.

## Verified scope

- Repository: shafi3578/sahibash. Production is Vercel team sahibash-web, project sahibash, domain sahibash.vercel.app. The unrelated locally linked Vercel target is not used.
- Supabase production project: sbtzkniuquewrtctsdpy.
- Preserve all existing user data, credentials, MFA enrollment, and roles. No password, email, role assignment, or existing factor was changed.
- Three reviewed migrations applied and local filenames aligned with the recorded production versions:
  - 20260916075729 — archive_unauthorized_external_publications
  - 20260916080840 — admin_mutation_mfa_policy_boundary
  - 20260916082613 — public_location_listing_visibility_boundary

## Evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Dependency audit | PASS | npm audit: 0 vulnerabilities |
| Lint / typecheck / build | PASS | Full commands exited 0; Next.js 16.3.5 generated 87 pages |
| Automated tests | PASS | 299 passed, 0 failed, 0 skipped; includes 67 security tests |
| Test coverage inventory | PASS | Ten previously omitted suites now run in npm test; only explicitly opt-in live Auth MFA suite is excluded |
| Security Advisor | PASS | Before: 0; after each migration: 0 security notices |
| RLS coverage | PASS | 0 public tables lacking RLS; 0 public SECURITY DEFINER functions executable by anon/authenticated |
| Admin mutation MFA | PASS (database layer) | 119 policies hardened; 0 admin-bearing mutation policies without an AAL2 gate |
| Read-policy preservation | PASS | All original non-target/read definitions unchanged; 28 ALL policies retain identical SELECT authority |
| User data preservation | PASS | Before/after: 56 listings, 217 image records, 8 Auth users; verified MFA factors remain 1 |
| External publication safety | PASS | 43 unverifiable published external ads archived with 43 provenance events; content/media preserved; cleanup hold prevents later deletion |
| Location disclosure | PASS (code/SQL) | Public-only status, active categories, positive price, expiry and publication checks; deterministic approximate coordinates, hidden coordinates null, owner IDs redacted |
| Location RPC expiry regression | PASS | Expired approved row returned before: 1; after: 0; both RPCs return 0 for pending-status requests |
| Database sanity | PASS with explained internal backlog | 14 checks return 0 rows; provenance check returns 28 non-public historical rows with incomplete source metadata; public provenance-gap count is 0 |
| Authenticated production browser journeys | NOT VERIFIED in this release | No full successful two-user posting/chat/notifications/contact/payment/admin browser run recorded |
| Launch inventory | BLOCKED | 0 currently discoverable ads after expiry and rights rules; the remaining approved native ad was already expired |

The 299 tests include behavioral units and source/SQL contract tests. They must not be represented as 299 browser E2E tests. Database role simulation proves policy enforcement but is not an Auth-provider login/enrollment E2E.

## Exact live MFA policy proof

scripts/sql/admin_mfa_release_smoke.sql uses existing identities internally and performs no-op updates inside a transaction that is rolled back. It emits only counts, not identities or credentials.

| Session | Admin-role rows readable | Category rows updated | Other/own draft rows updated |
| --- | ---: | ---: | ---: |
| Super Admin AAL1 | 4 | 0 | 0 (other user) |
| Super Admin AAL2 | 4 | 1 | 1 (other user) |
| Normal owner AAL1 | 0 | 0 | 1 (own draft) |
| Normal owner AAL2 | 0 | 0 | 1 (own draft) |

All four assertions passed. Every write and trigger effect was rolled back. Before/after policy counts: public 272 → 356; storage 9 → 9. The increase is the safe split of 28 ALL policies into unchanged SELECT plus three MFA-protected mutation policies.

## Additional repairs

- Stable ten-item homepage offsets, preserving page 1 items 1–10 and page 2 items 11–20.
- CSP permits the actual reverse-geocoding origin without opening arbitrary connections.
- No missing coordinate is coerced into a false 0/0 location.
- Production sanity SQL now uses the actual promotion_type column.
- Live synthetic MFA fixtures fail closed against production, including local commands aimed at the production project.
- Prior corrective commit e841b8f2f3774061a76fd5f3e344593b4c742b05 includes brand/locale cleanup, search variants, safe public caching, locale route handling, source/contact transparency, footer/phone fixes, dependency updates and browser security headers.

## Backup and recovery

Private logical backups are in the ignored .temp/release-backups directory: listing/content/image metadata, original trigger/function definitions, all public and Storage policies, and both location RPC definitions. These are scoped backups, not a verified full-database disaster-recovery backup or downloaded Storage-object backup. No Storage objects were deleted by this release.

The first data backup SHA-256 is 090569DE6D06DB7C151E67EF5E34ACF1E6D3AD5E314B7695AB8A3D870DD30F8F.
Held external ads retain actual before/after publication snapshots in listing_provenance_events. Restoration requires valid source-scoped permission review; do not bypass that gate to populate the marketplace. Do not automatically renew the expired native ad: renewal belongs to its seller.

## Remaining launch conditions

1. Obtain current, rights-approved supply or real seller renewals/posts. No fabricated inventory or blanket rights verification.
2. Record authenticated desktop/mobile production E2E for posting/recovery, two-user messaging, notifications, contact/WhatsApp, claim/removal/report/block and promotion review. Existing passwords, MFA and roles must stay unchanged.
3. Verify provider/operational readiness where applicable: real payment fulfillment/refund operation, SMS when enabled, deliverability, restore drill and native-editor language review. Code checks alone do not prove those services.
4. Performance Advisor follow-ups are explained, not hidden: 22 overlapping permissive-policy notices, 2 unindexed-FK informational findings, 149 unused-index informational findings and fixed Auth connection allocation of 10. No indexes were blindly removed and no RLS was weakened to clear a performance notice.

The opt-in live MFA suite must run only against a local or explicitly confirmed disposable non-production Supabase project. The local checkout currently has public Supabase configuration but no service-role key; production database verification used the authorized Supabase connection without extracting or persisting that key.

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
| Automated tests | PASS | 300 passed, 0 failed, 0 skipped in the final rerun; includes 67 security tests |
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

The 300 tests include behavioral units and source/SQL contract tests. They must not be represented as 300 browser E2E tests. Database role simulation proves policy enforcement but is not an Auth-provider login/enrollment E2E.

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

The opt-in live MFA suite must run only against a local or explicitly confirmed disposable non-production Supabase project. Production database verification used the authorized Supabase connection without extracting or persisting a service-role key.

## Completion follow-up — 16 September 2026

Further inspection found additional defects; the earlier passing test count was not proof that these flows were complete.

### Repairs

- Manual province/district selection in both reachable posting forms now discards old device coordinates and accuracy. A request-generation guard ignores late geolocation/reverse-lookup callbacks after manual selection. Draft hydration and persistence are unchanged.
- Account profile saves now show EN/FA/PS success or validation/failure feedback, retain entered values on validation failure, and disable fields while saving. A zero-row profile update is no longer reported as success. Existing account values, roles, passwords and factors were not modified for testing.
- Featured requests and receipt submissions reject expired, unpublished, removed, sold, inactive-category and non-positive-price targets. The database guard also checks direct transitions, including approval. Rejected proof corrections clear stale review fields only for the owner; the previous review is retained in an atomic, private audit trigger. Approval and rejection audit writes moved from application best-effort calls into that transaction.
- AI search now shares exact field constraints between its prompt and validator. Safe failure-stage codes distinguish network, timeout, envelope, refusal, truncation, invalid JSON and schema failures without logging raw prompts, completions or credentials. Returned model/usage metadata survives validation failure. Model routing, timeout, output budget and deterministic fallback remain unchanged.

### Newly observed runtime evidence and boundaries

- An existing signed-in Super Admin session opened My Account, Messages, Favorite Searches, Notifications and Offers. The latter three activity feeds were empty where applicable. These checks establish navigation/rendering, not two-user message/offer/notification delivery.
- Super Administrator control-center navigation correctly required fresh MFA: the browser reported current AAL1, available AAL2 and one verified factor. A handoff was left open; no factor was changed and no bypass was introduced.
- The existing unfinished posting form was inspected without editing, navigating or reloading it. It must not be used as a disposable QA fixture: another production posting tab under the same account can update the same latest server draft through the page-exit beacon.
- At 13:44:12 UTC, a production AI search for a Toyota Corolla in Kabul rendered the expected model/province filters, but telemetry recorded deterministic fallback / invalid_response, 1,889 ms. This is evidence of fallback availability, not a successful gateway request. The old telemetry does not identify that event's root cause.
- Source inventory remains 150 candidates: 46 awaiting review, 43 linked to held ads, 43 rejected and 18 duplicates; zero publishable candidates and zero source-specific permission records. All 12 native listings are expired. No candidate was published, fabricated or auto-renewed during this follow-up.
- Recovery inspection found only production and its default main branch, no disposable restore target. The four earlier scoped backups parse, but they do not cover the full 115-table database or bytes of 705 Storage objects. The provider backup dashboard requires sign-in. No production restore/reset or new billable project was attempted.

### Still requires completion before unconditional release approval

- Fresh browser AAL2 plus a separate authorized buyer/seller test context and safe current listings are required for full authenticated production journeys.
- Featured promises 30 days, while an otherwise eligible ad may expire sooner. The commercial policy needs an explicit choice: seller-consented extension, clearly disclosed shorter term, or deferring paid Featured. This follow-up does not silently renew listings, shorten purchased terms, or perform a paid transaction.
- Current source-scoped publication permissions or real seller submissions/renewals, provider backup evidence, an isolated restore drill and Storage recovery proof remain necessary for a populated, operationally verified launch.
- SMS OTP remains intentionally deferred; ordinary posting does not require it. No SMS was sent. Native-speaker editorial review is still not established by automated translation checks.

The payment pre-migration function backup is stored only in ignored .temp/release-backups/2026-09-16-before-payment-resubmission.json; SHA-256 97D7B16A67CEAE973AB0A3F0961BBA1B103EA20DE74735F59B4B587E6F5C7563. It is a scoped rollback aid, not a disaster-recovery backup.

### Final follow-up verification before deployment

- Full `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` completed with exit code 0 in the authoritative E: checkout. The combined run passed **321 tests**, zero failures, cancellations or skips. The build generated 87 pages. The separate `npm run test:security` rerun passed **67/67**; those tests are already included in the 321, not additional distinct tests.
- The final Security Advisor rerun returned **0** security notices. Independent read-only review found no blocking issue in the Gateway/profile changes. `git diff --check` passed.
- Location request guards also invalidate callbacks when a posting form unmounts; confirmation remains disabled until reverse lookup finishes and both location IDs and finite coordinates are present.
- Signed-in Settings, Language, and the account form structure were inspected without saving preferences or exposing field values. The Settings hub was visually checked at 390 × 844 and the browser viewport reset afterwards. This does not prove the complete mobile posting or two-user interaction flows.
- No real account settings, paid transaction, new publication, seller renewal, production test fixture, MFA factor or password was changed in this follow-up.

Payment migration 20260916135905_featured_payment_target_and_resubmission_safety was applied after function drift checks and scoped function/policy backups. Security Advisor: 0 before, 0 after. Live counts remain 56 listings, 217 images, 8 users, 1 verified MFA factor and 0 payment requests. The new audit trigger is not directly executable by anon, authenticated or service_role; payment-evidence reads require payment permission in addition to the existing admin read policy. Earlier policy definitions remain intact.

`node scripts/check-featured-payment-safety.mjs` passes 38 isolated, in-memory PostgreSQL assertions, including proof rejection/correction/approval, previous evidence retention, AAL1 denial, content-admin read denial, owner isolation, idempotency and rollback on audit failure. It uses synthetic local fixtures, not production identities/data. Surrounding Auth/RLS is minimally modeled; this is not live payment-provider fulfillment, concurrency testing or a Supabase disaster-recovery drill. The optional pinned PGlite dependency is installed only under ignored .temp, with no application dependency/lockfile changes.

## Post-deployment verification and workspace relocation

- GitHub main and its successful Vercel status confirmed aabb5998d713db4895ff0d52f9fa73317cc7f0eb. Production HTML identified dpl_2GAhs2aGtje3vbYwmKz7vvjBnzdf, matching that status.
- The anonymous production smoke passed 39/39 routes: 36 public routes across EN/FA/PS and three protected routes resolving to login. The inventory redirect was also checked in a browser. These results are not authenticated user-journey evidence.
- A second independent read-only check passed 15 EN/FA/PS home, login, listing, category and search URLs with the correct language/direction and no visible server errors.
- Mobile FA login automated accessibility scan: 0 violations, 38 passes, one incomplete color-contrast rule requiring manual review. This is not whole-site accessibility certification.
- A separate storage task relocated the active checkout from C: to E:\Drive C\Documents\Codex\2026-08-04\referenced-chatgpt-conversation-this-is-an-3\sahibash during final verification. This temporarily split the working tree across drives. No broad restore, reset or overwrite was performed on either original location. After the transfer, the E: checkout has zero missing tracked files, the same deployed HEAD, and only the two expected final UI/test edits before this report update. Final verification resumed there.
- A separate recovery clone was made while the transfer was incomplete. Four ignored scoped backups were also recovered from retained audit snapshots; the first matches its original SHA-256 above. This does not replace a full disaster-recovery backup or restore drill.
- Production data counts and Security Advisor results were rechecked after the local relocation and remained unchanged. The final small homepage repair reuses the existing EN/FA/PS empty-listing message without changing layout, calls to action, or publication rules.
- Full lint, typecheck and the production build passed again in the relocated checkout. One initial test rerun with a temporary 768 MB heap limit terminated the search worker without assertion diagnostics; the isolated normal search command then passed all 13 tests, and a full normal npm test rerun passed all 300. No test was removed or skipped to obtain that result. The final three-file follow-up passed independent review and a secret-pattern diff scan.

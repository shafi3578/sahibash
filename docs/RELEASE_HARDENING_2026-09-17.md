# Authenticated release follow-up — 17 September 2026

## Release decision

**CONDITIONAL. This is not unconditional launch approval.**

This focused follow-up addresses two defects found during authenticated production inspection. It does not replace the earlier release evidence or claim complete posting, two-account, payment-provider or disaster-recovery E2E.

## Authenticated evidence

The user confirmed their existing authenticator themselves. At `2026-09-16T21:38:46.662Z`, the live Account Security page showed current session `aal2`, available level `aal2`, one verified factor and no confirmation-required banner. No code, token, password, email, role or MFA setting was read, retained or changed by the test.

Read-only production checks established:

- Authenticated My Account and its Settings link work. Language, notification preferences, blocked users, account management and account security rendered at mobile widths without document horizontal overflow. No setting was submitted.
- AAL2 access to `/administrator`, its actual Promotion & AI Control Center link, `/admin/featured-payments`, `/admin/listing-schema` and `/admin/inventory` rendered successfully. No approve, publish, activate, reject, payment or schema-save action was submitted.
- Dari and Pashto Settings rendered with `fa-AF/rtl` and `ps-AF/rtl` at 390 and 1280 px without document horizontal overflow. These are sampled layout checks, not native-editor approval of every translation.
- Explicitly selecting City Bike loaded published schema version 3 with condition, bicycle type, frame size, seller type, delivery and exchange fields; no fuel or mileage field appeared in this sample. Local Dari/Pashto editor tabs displayed translated labels; nothing was saved.

Initial streamed loading shells and local browser/control timeouts were not counted as passes. Fresh, fully rendered observations provided the results above. A fresh tab in the same authenticated browser recovered a temporarily blank administrator view. No permanent application cause or measured production latency is inferred.

Live AAL2 acquisition and protected reads are now proven. The earlier rollback-only database role tests and isolated SQL tests are distinct evidence; they do not prove a real browser privileged mutation or a complete Auth-provider E2E.

## Defects and focused fixes

### Missing payment destination

The live campaign still used `Configure merchant destination in Super Admin before launch`. An otherwise eligible payment request could previously snapshot that placeholder.

- New requests now fail closed in the server action and database INSERT boundary for blank or seeded placeholder destinations, including case and all ECMAScript whitespace variants.
- Receipt submission and seller instructions use the request's immutable destination snapshot, not a later campaign setting. Invalid legacy requests retain their evidence and show localized support guidance rather than requesting payment or proof upload.
- The administrator sees an EN/FA/PS configuration warning. Free posting and existing active promotions remain unchanged.
- The private trigger uses SECURITY INVOKER, an empty search path and no direct API-role EXECUTE grants. It follows the existing consent/snapshot guard. It does not change RLS, authorization, payment methods, existing rows or UPDATE behavior.
- This detects missing setup only; it does not verify merchant ownership, settlement, refunds or the validity of an arbitrary merchant identifier.

### Misleading schema selection after search

Filtering could remove the active option from the native dropdown while the editor and publication target remained on that category. The browser could visually display the first matching option instead.

- The actual current option remains present and is clearly labeled when outside the filter results.
- Match counts exclude that retained nonmatching option.
- Search typing never navigates, publishes or changes category availability. Only explicit selection loads another editor.
- An explicit label association improves the select's accessibility.

## Verification

Full lint and typecheck exited 0. `npm test` passed **342 tests**, with zero failures, cancellations, skips or todos. The separate security rerun passed **71/71**; these tests are already included in the 342. The Next.js 16.3.5 production build exited 0 in 146 seconds, generating 87 pages. A final lint of the last-added regression test also exited 0. Post-deployment verification is recorded separately after this commit.

Focused checks before full validation: 26 payment tests and 18 schema tests passed. A further persistent migration-boundary test brings the final payment group to 27, included in the complete passing test run. Separately, 164 isolated in-memory SQL checks passed, including 111 JS/SQL normalization parity cases. The SQL checks also preserve historical requests, consent, AAL1 denial, owner isolation and prior evidence. They use synthetic local data, not production fixtures. Independent read-only code review found no actionable defect in the navigator or migration.

## Production migration verification

Applied only `20260916220149_featured_merchant_destination_readiness` to production project `sbtzkniuquewrtctsdpy`, after scoped backup and unchanged-state checks. Post-verification at `2026-09-16T22:02:11.827532Z` confirmed all six prior function definitions, four prior triggers, fourteen policies, relation/private-schema ACLs, RLS settings and five data fingerprints unchanged. Exactly one private function, one INSERT trigger and one migration ledger row were added. The guard body and recorded SQL match the reviewed content; client roles and PUBLIC have no direct EXECUTE privilege. Security Advisor: **0 before → 0 after**.

The initial CLI dry run safely stopped because eleven historical local migration timestamps differ from the remote ledger for matching names. No old migration was replayed, renamed, deleted or repaired. The targeted Supabase migration API applied only the reviewed new SQL; its newly assigned version was then reflected in this new local filename and test reference. The original prepared filename was `20260916214416_featured_merchant_destination_readiness.sql`; the SQL itself is byte-identical. Historical bulk CLI migration reconciliation remains a separate maintenance task requiring statement-level review, not blind timestamp repair.

Scoped backup and sanitized post-verification evidence are retained privately under ignored `.temp/release-backups/2026-09-16-merchant-readiness-preapply-2150/`. The catalog backup SHA-256 is `c73d1982f65cb9d7caff8fdc8980774f3485d5770aa30d9485dfbdad18f44bc5`. These fingerprints verify preservation; they are not a full restore drill.

## Preserved data and remaining launch conditions

At `2026-09-16T21:44:09.627820Z`, production contained 56 listings, zero currently public visible listings, 43 rights-held external listings, zero payment requests and one verified MFA factor. These counts are not additive status buckets. Security Advisor returned zero security notices.

No source listing was fabricated, published, renewed or deleted; no user or payment fixture was created. The existing unfinished posting draft was not opened, edited, reloaded or navigated away from. Messages/offers and notification read actions were avoided because opening them can change read/seen state.

Remaining conditions include current seller-authorized launch inventory, controlled two-account desktop/mobile journeys, safe posting/draft-recovery E2E, real merchant configuration and settlement/refund evidence before accepting paid promotions, an isolated restore drill with off-machine recovery-key escrow, and native-editor review. SMS OTP remains intentionally deferred, not required for ordinary posting.

Previously completed encrypted database and all 705 Storage-object exports remain preserved. Authenticated readback is not an actual restore, and Windows CurrentUser DPAPI currently ties key recovery to this user/machine. No new paid project or recovery target was created.

The correct-project Vercel dashboard became accessible in a fresh authenticated tab after the older tab crashed. Its pre-deployment production log view (00:33–01:03 local time) showed zero Error/Fatal entries and six identical Supabase `getSession()` user-object warnings on MFA/protected administration pages. They are not hidden by a "clean logs" claim.

Read-only source review found the installed Auth SDK's `getAuthenticatorAssuranceLevel()` reads `session.user.factors` to derive the available next level, triggering its server warning. The application first authenticates with `getUser()`, obtains role permissions server-side, and checks the current AAL2 level plus fresh authentication; it does not authorize from that factor list or `nextLevel`. A new SSR client for MFA does not inherit the prior client's warning-suppression flag. The six observed routes match this call chain, but per-event attribution remains an inference without a stack trace. No release-blocking authorization defect was demonstrated; no warning suppression, Auth setting or security bypass was introduced. Post-deployment log results are recorded separately. Drain configuration and alert delivery remain unverified; a successful build or HTTP smoke must not be presented as proof of those operational checks.

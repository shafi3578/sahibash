# Final hardening follow-up — 16 September 2026

## Release decision

**CONDITIONAL. This is not 100% public-launch approval.**

This follow-up closes specific payment and social-interaction defects found after the earlier audit. It does not turn source tests, simulated database roles, or anonymous HTTP checks into authenticated browser E2E evidence. The earlier report is `docs/RELEASE_GATE_2026-09-16.md`; this document supersedes its open Featured-duration policy question and records the new verification scope.

## Changes

### Featured payments

- The seller must explicitly accept the full-term expiry-extension disclosure before receiving payment instructions. The checkbox starts unchecked; EN/FA/PS disclosures explain that the ad must still be active and public at approval and can still be sold or removed.
- The database stamps consent time and snapshots the consent version, configuration revision, amount, currency, duration, payment method, destination and localized instructions. Clients cannot manufacture historical consent or change purchased terms later.
- Stale displayed terms are rejected. The manage page displays an allowlisted EN/FA/PS alert directing the seller to review the current terms; unknown or duplicate query values are not echoed and consent is never preselected. Approval requires existing payment-review permission plus AAL2. The approval trigger locks the listing and extends only a currently eligible active listing to cover the purchased period; it never republishes an expired, sold, removed or held ad.
- Activation, expiry changes and the private evidence audit are atomic for both the RPC and direct authorized updates. Repeated approval is idempotent and an approved request cannot be reopened.
- Closed requests allow another consented purchase with a new attempt-scoped idempotency key. Pending/rejected requests retain their evidence and existing flow. A duplicate-key error is not reported as success unless a real pending request is found.

### Messages, blocking and reports

- Fixed the message counter trigger that could prevent seller replies or silently omit buyer message counts under listing RLS. The private trigger checks the authenticated sender and accountable listing participants and can update only the counter, with the existing updated-at trigger side effect.
- Message content, routing, attribution and creation time are immutable. Senders cannot forge an already-read message; receipt times are server-stamped. Existing recipient and AAL2-administrator update scopes remain in place.
- New reports must start open without administrator metadata. Original report evidence cannot be rewritten; review requires the existing administrator role and AAL2, with server-stamped resolver/time.
- Blocking removes both follow directions atomically, rather than relying on a client deletion that RLS could only partially permit. Message, follow and block operations use the same canonical user-pair transaction lock before checking the block boundary.
- Removed unnecessary TRUNCATE, TRIGGER and REFERENCES privileges from API roles on messages/reports. No RLS policy was broadened, and no existing messages, reports, follows or blocks were rewritten or deleted.

## Verification

| Check | Result | Scope / evidence |
| --- | --- | --- |
| Lint | PASS | Full `npm run lint`, exit 0 |
| Typecheck | PASS | `npm run typecheck`, exit 0 |
| Automated tests | PASS | `npm test`: 330 passed, 0 failed/cancelled/skipped, including the final localized consent-alert regression |
| Security tests | PASS | Separate `npm run test:security`: 71/71; already included in 330 |
| Production build | PASS | `npm run build`, exit 0, Next.js 16.3.5 |
| Dependency audit | PASS | `npm audit`: 0 vulnerabilities |
| Payment database harness | PASS | 98 isolated PGlite checks; real migration SQL, synthetic local identities; zero production writes |
| Social database harness | PASS | 36 isolated checks; includes SQL roles, boundaries and helper/source contracts |
| Independent review | PASS | Payment and social changes cross-reviewed; no remaining blocking finding in the scoped patch |
| Pre-migration drift | PASS | Three payment function definitions/privileges unchanged; 28 social grants, 12 mutation policies and 12 triggers/function definitions exactly match the scoped backup |
| Pre-migration Security Advisor | PASS | 0 security notices |
| Pre-migration data sanity | PASS with explained backlog | 14 checks have 0 findings; 28 historical non-public provenance records still require source review |
| Secret-pattern/diff review | PASS | No private-key/JWT/provider-token patterns in changed files; `git diff --check` clean |

The SQL harnesses use a minimal modeled surrounding schema and synthetic Auth claims. They do not prove real provider login, browser sessions, Realtime delivery, payment settlement, or multi-session concurrency. The shared transaction-lock structure is tested, but no empirical concurrent-session test is claimed.

## Data protection and remaining release gates

- Pre-migration counts: 56 listings, 217 listing images, 8 Auth users, 1 verified MFA factor, 0 payment requests, 1 message, 2 reports, 0 follows and 0 blocks.
- Scoped migration rollback aids are kept only in ignored `.temp/release-backups`. Their function/policy definitions were compared with live production before applying changes.
- No administrator password, email, MFA enrollment, role assignment or account preference was changed. No real payment, seller renewal, synthetic production fixture or new external publication was performed.
- The existing unfinished production posting form was preserved. Browser page control timed out even though browser inventory was reachable; repeated failed operations were stopped. Full authenticated desktop/mobile and two-account journeys remain unverified, not passed.
- Current rights-approved launch supply remains absent: the previous audit found zero discoverable ads, expired native ads and held external inventory without source-specific evidence. Do not auto-renew sellers' ads or manufacture source permissions to clear this gate.
- Provider fulfillment/refunds, an isolated restore drill (including Storage-object recovery) and native-speaker editorial review still require evidence. SMS OTP remains deliberately deferred and is not required for ordinary posting.

## Production migration verification

- Applied `20260916144729_featured_full_term_extension_consent` and `20260916144743_social_interaction_integrity` to `sbtzkniuquewrtctsdpy`. Local filenames match the production ledger.
- Security Advisor: **0 before, 0 after**. Public tables without RLS: **0**. Public SECURITY DEFINER functions directly executable by anon/authenticated: **0**.
- All baseline record counts are unchanged. Saved aggregate row hashes for listings, images, messages, reports, follows and blocks are identical before/after; no pre-existing row was modified by these migrations.
- Social grants changed only as intended: 28 to 16, removing 12 unnecessary privileges. All 17 scoped policy identities/roles/permissiveness and all 12 saved mutation expressions are unchanged. The pre-snapshot did not include SELECT expressions, so exact SELECT-expression equality is not claimed; the migration contains no policy DDL.
- Scoped triggers changed from 12 to 16: four additions and replacement of the message-counter attachment. All eight existing listing trigger definitions/functions are unchanged. New/replaced social function bodies match the migration; all nine trigger/helper entry points are revoked from anon/authenticated/service_role.
- Payment attestation confirms seven nullable/no-default columns, two validated checks and three function bodies identical to the reviewed migration. RPC grants and the existing mutation guard are unchanged; the two private trigger helpers have owner-only execution. Audit RLS and its restrictive payment-evidence read policy remain intact.
- Sanity-check results remain unchanged: 14 empty result sets and 28 explained historical non-public provenance findings.
- After aligning migration filenames, 26 focused unit/source tests and both isolated SQL harnesses passed again (98 payment and 36 social assertions).

## Recovery evidence

- The normal project-local Supabase CLI confirmed seven completed provider physical backups, dated 9–15 September 2026. The newest was `2026-09-15T17:14:51.005Z`; PITR is not enabled. No new paid project/branch was created and no production restore/reset was attempted.
- A current encrypted logical export is complete under ignored `.temp/recovery-backups/database-2026-09-16T14-50-51-111Z-9ba2dcb8-252b-4547-b507-d5959e6406a5`. It contains the database archive, role definitions without role passwords, and a separate migration-ledger archive.
- Full archive: 3,129,148 encrypted bytes; 3,524 table-of-contents entries. Auth data, Storage metadata and migration history are present. AES-256-GCM authentication and hashes passed, followed by a full `pg_restore` SQL-output parse drained to a hash/discard sink. No restore SQL was executed or written to a plaintext file.
- An initial offline reader failure was recovered without exporting the full database again. The original ciphertext and failed checkpoint are preserved; an encrypted recovery receipt and final manifest identify the usable artifact. The original producer exit code was not retained in that older run, so the manifest explicitly records this limitation alongside independent full-archive validation.
- PostgreSQL clients were verified against a signed official EDB installer and pinned extracted-file hashes. Client TLS uses `verify-full` and the pinned official Supabase CA. Supavisor reports its backend TLS separately and ignores startup options here; connectivity was verified with an explicit read-only transaction, and native `pg_dump` uses its own read-only transaction.
- Encryption keys are protected with Windows CurrentUser DPAPI and backup directories have current-user-only ACLs. Credentials remain in process memory; no plaintext database dump, credential log, global install or global trust-store modification was made.
- A separate bounded Storage backup script covers the reviewed 705-object, 123,084,660-byte inventory. It passed 23 offline synthetic checks and targeted lint. It permits only fixed-project read operations, encrypts object names and bytes, checks source versions before/after, and verifies each encrypted file. The local credential field was empty; the optional CLI path reads an existing project-specific credential only into memory, without creating or rotating a key. A run is not complete until its final encrypted manifest says so; the completed-run result is recorded with the final deployment evidence, not inferred from script tests.
- **This is not a completed disaster-recovery drill.** The database archive does not contain Storage-object bytes. Platform configuration and independent/off-machine key escrow are not included. A same-user/machine DPAPI dependency remains. Database archive parsing and Storage backup authentication do not prove successful restoration into a complete Supabase environment.

Deployment results are recorded separately after the Git-integrated build and production smoke checks.

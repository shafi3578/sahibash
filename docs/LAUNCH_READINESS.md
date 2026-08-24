# Sahibash Launch Readiness

Date: 2026-08-24
Current status: CONDITIONAL

This file records the current launch-readiness gate from the Phase 0 production identity and Phase 1 privacy-boundary repair. It supersedes older optimistic readiness language until every remaining launch gate is fixed and verified.

## Phase 1 update

Phase 1 has been implemented in the repository for:

- public listing data boundary;
- phone reveal privacy;
- super-admin MFA readiness visibility;
- contact/audit event capture around reveal/contact actions.

The application now reads public listing feeds/details through a safe selector and server-side sanitizer, keeps exact coordinates and phone values out of public payloads, moves seller-phone access behind a rate-limited server action, and adds a Supabase migration that removes broad public/authenticated raw-column grants from `public.listings`.

Production launch status remains **CONDITIONAL** until the Phase 1 code is deployed, the production Supabase migration is applied after backup/migration-state verification, and post-deploy browser/API checks prove the public REST boundary denies sensitive columns.

## Phase gate summary

| Area | Status | Evidence |
| --- | --- | --- |
| Production mapping | READY WITH UNCERTAINTY | Correct public site and Supabase project are verified. Vercel API/CLI deployment metadata could not be independently inspected from this machine. |
| Authentication | READY WITH MINOR ISSUES | Auth code uses server `getUser()` and step-up helpers, but full multi-role E2E remains. |
| Super Admin | CONDITIONAL | Code requires AAL2 and admin roles page now reports verified-factor readiness, but production super-admins still need verified MFA enrollment. |
| Admin | READY WITH UNCERTAINTY | Admin routes are in the same app and server gates exist, but full authenticated E2E is not complete. |
| RLS | CONDITIONAL | Phase 1 migration restricts raw listing column grants; production application is pending safe migration application/verification. |
| Public privacy | CONDITIONAL | Public-safe selectors/sanitizers are implemented; direct REST denial must be verified after migration. |
| Location privacy | CONDITIONAL | Server-side public location sanitization is implemented; direct REST denial must be verified after migration. |
| Contact privacy | CONDITIONAL | Phone reveal is moved behind a server action with rate limiting/event capture; direct REST denial must be verified after migration. |
| Listings | READY WITH MAJOR ISSUE | Listings load, but public data boundary is unsafe. |
| Search | NOT PHASE-VERIFIED | Later phase. |
| Filters | NOT PHASE-VERIFIED | Later phase. |
| Post Ad | NOT PHASE-VERIFIED | Later phase. |
| Drafts | NOT PHASE-VERIFIED | Later phase. |
| Images | NOT PHASE-VERIFIED | Later phase. |
| Messaging | READY WITH UNCERTAINTY | Anonymous message reads returned no rows, but multi-user E2E is still needed. |
| Favorites | NOT PHASE-VERIFIED | Later phase. |
| Saved Searches | NOT PHASE-VERIFIED | Later phase. |
| Localization | NOT PHASE-VERIFIED | Later phase. |
| Dari RTL | NOT PHASE-VERIFIED | Later phase. |
| Pashto RTL | NOT PHASE-VERIFIED | Later phase. |
| Database | READY WITH MAJOR ISSUE | Security advisor clean; performance advisor still has warnings and sensitive raw table exposure remains. |
| Performance | NOT PHASE-VERIFIED | Later phase. |
| 100K scalability | BLOCKER | No safe staging/load validation performed. |
| Monitoring | NOT PHASE-VERIFIED | Later phase. |
| Rate limiting | READY WITH UNCERTAINTY | Durable RPC exists and is service-role-only; Phase 1 phone reveal now uses the controlled server boundary. |
| AI endpoints | READY WITH UNCERTAINTY | Existing endpoint tests pass historically, but Phase 0 did not re-run all code checks. |
| External inventory | NOT PHASE-VERIFIED | Later phase. |
| Web | READY WITH MAJOR ISSUE | `/en`, `/fa`, `/ps` load from production, but privacy blockers remain. |
| Mobile/Flutter | NOT VERIFIED | No Flutter source found in the current repo audit. |

## P0 exit checklist

- [x] Correct production public URL inspected: `https://sahibash.vercel.app`
- [ ] Correct production Vercel project independently identified through Vercel API/CLI
- [x] Correct production Supabase project proven from public production HTML: `sbtzkniuquewrtctsdpy`
- [ ] Exact hidden coordinates cannot be retrieved publicly after production migration
- [ ] Approximate location cannot leak internal exact coordinates after production migration
- [x] Public listing payload uses only intended application fields in server code
- [x] Phone number is not intentionally rendered before reveal in the public detail UI
- [x] Reveal Phone is rate limited through a controlled server boundary
- [x] Contact actions are safely tracked from the controlled reveal/contact flow
- [ ] Super Administrator has MFA available/enforced at account state level
- [x] Sensitive Super Admin code gate checks AAL2
- [ ] User role cannot be self-escalated, proven by controlled write tests
- [x] `service_role` secret is server-only in fetched public bundle checks
- [x] No private environment secret found in fetched browser bundle checks
- [ ] Cross-account RLS tests pass against production-like/staging identities
- [ ] Admin/Super Admin actions are auditable and audit entries are verified

## Next recommendation

Finish the Phase 1 production rollout:

1. Deploy the Phase 1 application code.
2. Apply `supabase/migrations/20260824124823_phase1_public_listing_privacy_boundary.sql` to production after backup/migration-state verification.
3. Verify anonymous REST cannot select `contact_phone`, hidden coordinates, or `location_geog`.
4. Enroll verified MFA factors for every super-administrator account and verify the admin readiness panel shows all ready.
5. Run authenticated multi-role browser/E2E checks.

Do not move to AI, external inventory, or 100K production data until these blockers are fixed and verified.

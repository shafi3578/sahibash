# Sahibash Launch Readiness

Date: 2026-08-24
Current status: CONDITIONAL

This file records the current launch-readiness gate from the Phase 0 production identity and Phase 1 privacy-boundary repair. It supersedes older optimistic readiness language until every remaining launch gate is fixed and verified.

## Phase 1 update

Phase 1 has been implemented, pushed, deployed, and applied to production for:

- public listing data boundary;
- phone reveal privacy;
- super-admin MFA readiness visibility and in-app MFA setup/confirmation;
- contact/audit event capture around reveal/contact actions;
- service-role-backed, redacted audit writes for privileged events.

The application now reads public listing feeds/details through a safe selector and server-side sanitizer, keeps exact coordinates and phone values out of public payloads, moves seller-phone access behind a rate-limited server action, and applies a Supabase migration that removes broad public/authenticated raw-column grants from `public.listings`.

Production launch status remains **CONDITIONAL** because the human super-admin accounts still need to enroll verified MFA factors and authenticated multi-role E2E is still required. Post-deploy checks verified that public REST can still select safe listing columns, but anonymous selection of `contact_phone`, `latitude`, `longitude`, and `location_geog` is denied.

## Phase gate summary

| Area | Status | Evidence |
| --- | --- | --- |
| Production mapping | READY WITH UNCERTAINTY | Correct public site and Supabase project are verified. Vercel API/CLI deployment metadata could not be independently inspected from this machine. |
| Authentication | READY WITH MINOR ISSUES | Auth code uses server `getUser()` and step-up helpers, but full multi-role E2E remains. |
| Super Admin | CONDITIONAL | Code requires AAL2, account security now provides TOTP MFA setup/confirmation, and admin roles reports verified-factor readiness; production super-admins still need human MFA enrollment. |
| Admin | READY WITH UNCERTAINTY | Admin routes are in the same app and server gates exist, but full authenticated E2E is not complete. |
| RLS | READY WITH E2E GAP | Phase 1 migration restricts raw listing column grants and REST denial is verified; cross-account E2E remains. |
| Public privacy | READY WITH E2E GAP | Public-safe selectors/sanitizers are implemented and sensitive REST column selection is denied. |
| Location privacy | READY WITH E2E GAP | Server-side public location sanitization is implemented and exact coordinate REST column selection is denied. |
| Contact privacy | READY WITH E2E GAP | Phone reveal is behind a rate-limited audited server action; public HTML/REST pre-reveal exposure is blocked. |
| Listings | READY WITH E2E GAP | Listings load and public data boundary is enforced; full buyer/seller browser E2E remains. |
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
| Database | READY WITH PERFORMANCE GAP | Security advisor clean and Phase 1 sensitive listing column exposure is closed; performance advisor warnings remain. |
| Performance | NOT PHASE-VERIFIED | Later phase. |
| 100K scalability | BLOCKER | No safe staging/load validation performed. |
| Monitoring | NOT PHASE-VERIFIED | Later phase. |
| Rate limiting | READY WITH UNCERTAINTY | Durable RPC exists and is service-role-only; Phase 1 phone reveal now uses the controlled server boundary. |
| AI endpoints | READY WITH UNCERTAINTY | Existing endpoint tests pass historically, but Phase 0 did not re-run all code checks. |
| External inventory | NOT PHASE-VERIFIED | Later phase. |
| Web | READY WITH E2E GAP | `/en`, `/fa`, `/ps`, `/en/search`, and a listing detail page load from production after Phase 1 privacy hardening. |
| Mobile/Flutter | NOT VERIFIED | No Flutter source found in the current repo audit. |

## P0 exit checklist

- [x] Correct production public URL inspected: `https://sahibash.vercel.app`
- [ ] Correct production Vercel project independently identified through Vercel API/CLI
- [x] Correct production Supabase project proven from public production HTML: `sbtzkniuquewrtctsdpy`
- [x] Exact hidden coordinates cannot be retrieved publicly through direct REST column selection after production migration
- [x] Approximate location cannot leak internal exact coordinates through public application payloads after production migration
- [x] Public listing payload uses only intended application fields in server code
- [x] Phone number is not intentionally rendered before reveal in the public detail UI
- [x] Reveal Phone is rate limited through a controlled server boundary
- [x] Contact actions are safely tracked from the controlled reveal/contact flow
- [x] Super Administrator has an in-app MFA setup/confirmation path
- [ ] Every Super Administrator has a verified MFA factor at account state level
- [x] Sensitive Super Admin code gate checks AAL2
- [ ] User role cannot be self-escalated, proven by controlled write tests
- [x] `service_role` secret is server-only in fetched public bundle checks
- [x] No private environment secret found in fetched browser bundle checks
- [ ] Cross-account RLS tests pass against production-like/staging identities
- [x] Admin/Super Admin audit writer is service-role-capable and redacts unsafe safe-change fields
- [ ] Production privileged audit entries are verified from a controlled admin action

## Next recommendation

Finish the remaining launch-readiness gates:

1. Enroll verified MFA factors for every super-administrator account through `/dashboard/account-security` and verify the admin readiness panel shows all ready.
2. Run authenticated multi-role browser/E2E checks.
3. Prove role-escalation protections with controlled write tests.
4. Verify admin audit rows are created for privileged admin actions.
5. Continue performance advisor cleanup and production monitoring hardening.

Do not move to AI, external inventory, or 100K production data until these blockers are fixed and verified.

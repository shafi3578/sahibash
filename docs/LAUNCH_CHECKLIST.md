# Sahibash Launch Checklist

Date: 2026-08-24
Status: conditional.

## P0 launch blockers

| Gate | Status | Evidence / action |
| --- | --- | --- |
| Production Supabase environment verified | Done | Public bundle/pages and local CLI point to `sbtzkniuquewrtctsdpy`. |
| No public test fixtures | Done | Production read-only count: 0 obvious public fixtures; guardrails added. |
| Production/staging separated | Not done | No verified isolated staging DB available for destructive/load testing. |
| Supabase Security Advisor | Done | Connector and CLI security advisors currently return 0 security lints. |
| Auth dashboard policy review | Manual recommended | Verify password policy/leaked-password and redirect allowlist in Supabase dashboard after billing/plan changes. |
| Admin authorization tests | Done | `npm run test:security` passes. |
| Super-admin protected appropriately | Improved | Code requires role + fresh auth + AAL2; interactive MFA flow still needs staging/production validation. |
| Durable app rate limiting | Improved | Server-side limiter added; Supabase migration applied and verified; deploy required for live app enforcement. |
| RLS isolation tests | Partial | RLS enabled broadly; true multi-JWT integration tests still needed. |
| Location privacy tests | Done for helper layer | Sanitizer tests pass; route/RLS staging tests still recommended. |
| No production credentials exposed in repo | Partial | Tracked scan found no `.env`; rotate any credentials pasted into chat. |

## P1 core quality

| Gate | Status |
| --- | --- |
| English/Dari/Pashto UI consistency | Partial; automated parity exists, full copy audit still required |
| RTL screens | Partial; structural support exists, device QA still required |
| Category-specific fields | Partial; schema builder and category logic exist, full manual category matrix QA still required |
| Posting end-to-end | Partial; code/tests exist, staging E2E still required |
| Images end-to-end | Improved; app validation and bucket migration applied, staging E2E still required |
| Messaging | Partial; routes/actions exist, two-account E2E still required |
| Favorites | Partial; code exists, E2E still required |
| Saved searches | Partial; code exists, E2E still required |
| No serious broken routes | Partial; key public pages returned 200 |

## P2 scale

| Gate | Status |
| --- | --- |
| Supabase Performance Advisor | Not clean; 316 performance warnings remain |
| 100K staging load test | Not run |
| Search query plans | Partial; needs staging `EXPLAIN` suite |
| Pagination at scale | Partial; bounded limits exist, 100K validation pending |

## P3/P4

Bridge, wanted requests, demand intelligence, price intelligence, and AI/semantic search foundations exist but are not all fully proven for broad launch. Keep risky AI/vector systems feature-flagged or disabled until P0/P1/P2 pass.

## Deployment checklist

Before deploy:

1. `git status --short` reviewed.
2. Final diff reviewed for secrets/destructive changes.
3. `npm run lint`
4. `npm run typecheck`
5. `npm test`
6. `npm run build`
7. Database migration state confirmed for storage bucket limits and app rate-limit foundation.
8. Supabase production migrations applied and verified.
9. Deploy to Vercel.
10. Smoke check `/en`, `/fa`, `/ps`, `/en/search`, one listing detail, login/posting entry, admin redirect.

Rollback:

- Code: redeploy previous Vercel deployment or revert commit.
- Database: bucket limit migration is reversible by setting prior bucket limits back to null in a reviewed rollback migration if needed.

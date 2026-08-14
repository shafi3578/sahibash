# Sahibash production-readiness audit — 2026-08-14

## A. Readiness decision

**CONDITIONAL — not yet an unconditional production-ready sign-off.**

- Audited baseline: `5ea6ebb57a481b6f4b03186935dd45b0be2bbebd`
- Production URL: `https://sahibash-three.vercel.app`
- Database: Supabase project `sbtzkniuquewrtctsdpy`
- Code gates: 49/49 tests passed; TypeScript passed; ESLint passed; Next.js 16.3.0 production build passed; production npm audit found 0 vulnerabilities.
- Blocking/critical defects: 0 found in the inspected and exercised scope.
- Conditional items: broad legacy RLS performance debt, absent platform-wide distributed abuse throttling, leaked-password screening disabled, incomplete authenticated multi-account E2E coverage, and poor-quality existing public listing content.

## B. Executive summary

- The repository was clean at baseline except for the supplied audit PDF and generated audit artifacts; no pre-existing work was overwritten.
- Production has 19 root categories, 597 taxonomy nodes, 483 active nodes, and 433 active leaf nodes.
- The Listing Schema Builder has a published version for all 597 nodes; all 433 active leaves have published schema coverage.
- Schema publishing is optimistic-versioned and super-administrator-only. Category activation changes are super-administrator-only and audited.
- The old application migration endpoint is permanently disabled with HTTP 410; reviewed migrations remain the only supported migration path.
- A paid AI inference route accepted unauthenticated/unbounded input. It now requires a valid user, bounds text and image input, validates URL schemes, and hides internal errors.
- Production branding incorrectly displayed “Afghan”. The guarded database update now restores “Sahibash”; live title/header verification passed.
- The database security advisor reports only one warning: leaked-password screening is disabled.
- The performance advisor reports 430 notices: 101 RLS init-plan warnings, 204 multiple-permissive-policy warnings, and 125 unused indexes. These are primarily legacy performance debt and require measured consolidation, not an unreviewed bulk rewrite.
- Production currently contains 33 listings: 7 approved, 21 pending, 4 rejected, and 1 sold. Three have malformed phone shape; visible approved examples include placeholder-quality titles. No listing was deleted or silently rewritten.

## C. Issue counts

| Severity | Open | Fixed in this audit |
| --- | ---: | ---: |
| Blocker | 0 | 0 |
| Critical | 0 | 0 |
| High | 3 | 1 |
| Medium | 4 | 2 |
| Low | 3 | 1 |

## D. Audit ledger

| ID | Severity | Area | Evidence / impact | Disposition |
| --- | --- | --- | --- | --- |
| SEC-01 | High | AI/API abuse | Paid Hugging Face endpoint allowed anonymous requests and had no file/text bounds. | **Fixed**: authentication, 10 MB image cap, MIME check, 120/5000 text caps, 12 validated HTTP(S) URLs, generic 500 response; regression test added. Distributed per-user throttling remains SEC-03. |
| SEC-02 | Medium | Auth | Supabase leaked-password protection is disabled. | Open. Enable before broad public launch and verify login/reset behavior. [Remediation](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). |
| SEC-03 | High | Abuse controls | No proven shared/distributed rate limiter covers login, registration, posting, messaging, reports, contact reveal, or AI calls. | Open. Add a durable IP+account limiter and alerting; do not rely on process memory in serverless functions. |
| DB-01 | High | RLS performance | Advisor: 101 auth init-plan and 204 multiple-permissive-policy warnings. At scale these increase per-row policy work. | Open. Consolidate table-by-table with anonymous/owner/admin behavior tests and query plans. [RLS guidance](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select). |
| DB-02 | Low | Indexing | `listing_risk_signals.reviewed_by` lacked a covering index. | **Fixed** with a partial index; advisor no longer reports the unindexed FK. |
| DB-03 | Low | Index hygiene | Advisor reports 125 unused indexes, including the newly created index before production traffic exercises it. | Monitor over a representative traffic window; never bulk-drop from a snapshot. |
| DATA-01 | High | Listing quality | 3/33 listings have malformed phone shape; approved homepage examples include placeholder titles. Trust and conversion risk. | Open. Moderate through the control center and add normalization/quality scoring. No destructive cleanup performed. |
| BRAND-01 | Medium | CMS/SEO | Live header and document title showed “Afghan”, conflicting with canonical Sahibash identity. | **Fixed** by a conditional migration; live header/title now show Sahibash. |
| I18N-01 | Low | English copy | English footer fallback and location helper still used “Afghan” as the product name. | **Fixed** to Sahibash; locale parity tests pass. |
| QA-01 | Medium | E2E | Anonymous production journeys were exercised, but no controlled seller/moderator/super-admin test accounts were available for destructive-safe multi-role E2E. | Open. Establish dedicated non-production fixtures and test accounts. |
| PERF-01 | Medium | Field performance | Build and structural checks passed, but no sustained load test or real-user Core Web Vitals sample was available. | Open. Add Web Vitals/trace dashboards and baseline p75 by route/device. |

## E. Journey matrix

| Journey | Result | Evidence / limitation |
| --- | --- | --- |
| Anonymous homepage, Dari RTL | Pass | `lang=fa-AF`, `dir=rtl`, no desktop horizontal overflow; categories and listings render. |
| English/Dari/Pashto localization | Pass (structural) | Translation-key parity and multilingual search tests pass; schema labels are complete in all three languages. |
| Browse categories/subcategories | Pass | Active taxonomy renders; database reports 433 active leaves. |
| Search and multilingual equivalence | Pass (automated) | 8 multilingual search parity tests passed. |
| Open approved listing detail | Pass (anonymous surface) | Production links resolve; structured listing rendering exists. Quality varies by stored listing. |
| Start posting while signed out | Pass | Protected posting URLs redirect to localized login with a safe return target. |
| Seller posting/edit/publish | Partial | Validation, upload signatures, schema selection and access-control tests pass; no dedicated production seller fixture was used. |
| Vehicle seller 2D damage → buyer 3D | Pass (automated) | Tests prove only non-original seller-reported panels map to buyer 3D; six valid GLB families and fallback behavior are covered. |
| Favorites/messages/offers/notifications | Partial | Routes/data controls exist; end-to-end two-account delivery was not proven in this run. |
| Admin routes as anonymous/non-admin | Pass (code/RLS) | Server-side role checks and guarded database helpers are present; migration endpoint returns 410. |
| Super-admin Schema Builder | Pass (code/data) | Super-admin guard, version conflict protection, audit record, ordering/visibility/options and 597-node production coverage verified. Interactive authenticated production edit was intentionally not performed. |
| Moderation/control center | Partial | Tables, events, risk signals and admin surfaces exist; operational SLA/escalation drills remain unproven. |

## F. Security and data conclusions

- Service-role credentials are confined to the server-only admin client; no `NEXT_PUBLIC_` service key pattern was found.
- Listing writes use Zod core validation plus dynamic schema validation; image content is checked by file signature, MIME and size.
- RLS helper execution is guarded so callers cannot inspect another identity.
- The migration API cannot execute SQL and returns 410.
- No advisor-detected missing-RLS or exposed-privileged-function security finding remains.
- Existing malformed or placeholder listings must be moderated, not deleted by an audit script.

## G. Control center conclusions

The project includes admin surfaces for listings, users, roles, categories, listing schemas, pages, search, analytics and audit. Listing schema publishing is versioned and activation changes are audited. Production operations still need explicit owners, moderation SLA, abuse thresholds, incident runbooks, and tested rollback drills.

## H. Performance, SEO, PWA and accessibility

- Production build succeeds and generates robots, sitemap and web manifest routes.
- Responsive RTL homepage checks passed; the prior mobile verification used 360×740 without horizontal overflow.
- Listing images and six vehicle GLBs have validation/fallback coverage; 3D assets are deferred.
- Remaining proof gap: measured p75 LCP/INP/CLS, screen-reader journeys, full keyboard audit, reduced-motion validation and sustained database/load testing.

## I. Deployment and rollback

- Database migrations are idempotent/guarded: brand changes only when the current value is exactly `Afghan`; the index uses `if not exists`.
- Database verification: `site_name = Sahibash`; reviewer index exists.
- Rollback for the index: `drop index concurrently if exists public.idx_listing_risk_signals_reviewed_by` during a reviewed maintenance operation.
- The brand can be changed through the audited super-admin settings/version workflow; do not hard-reset it blindly.

## J. Prioritized backlog

### P0 before unrestricted public launch

1. Add durable distributed rate limiting and abuse telemetry for auth, posting, messaging, reports, contact reveal and AI.
2. Moderate the seven approved listings; correct or reject malformed phones and placeholder content through normal admin workflows.
3. Enable leaked-password protection and verify password registration/reset.

### P1

1. Consolidate RLS policies in small migrations with owner/admin/anonymous behavior tests and `EXPLAIN (ANALYZE, BUFFERS)` baselines.
2. Add controlled seller, buyer, moderator and super-admin E2E fixtures in a preview/branch environment.
3. Establish Web Vitals, error-rate, moderation-latency and abuse dashboards with alert thresholds.
4. Run accessibility testing across keyboard, screen reader, zoom, reduced motion and all locales.

### P2

1. Review unused indexes after a representative traffic period.
2. Remove or clearly quarantine legacy unused posting components/routes after route-usage proof.
3. Add sustained search/listing/detail load tests and 3D asset budgets by device tier.

## K. Exact sign-off statement

**Proven:** the audited commit builds cleanly; its 49 automated checks pass; production schema coverage is complete for every active leaf; core anonymous RTL browsing works; Schema Builder writes are super-admin-only, versioned and audited; the migration API is disabled; the discovered paid-AI authorization/input defect and brand defect are fixed; and npm reports no production dependency vulnerabilities.

**Not proven:** safe behavior under sustained/hostile load, complete multi-account authenticated journeys, every admin workflow through the production UI, real-user Core Web Vitals, or full assistive-technology conformance. Because these launch-hardening items remain, readiness is **CONDITIONAL**, not an unconditional “100/100” declaration.

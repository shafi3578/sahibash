# Sahibash Network Readiness Report

Generated: 2026-08-22

## Launch decision

CONDITIONAL.

Sahibash now has a safe Step 3 foundation for marketplace liquidity intelligence, bootstrap-retirement simulation, price cohorts, trust quality labels, and source-health dashboards. It is not yet a fully automated self-sustaining marketplace because enforcement jobs, partner/scout payout workflows, notification delivery, large-scale load testing, and search-console monitoring still require production operating decisions and further rollout.

## Implemented Step 3 foundation

| Requirement area | Status | Evidence |
| --- | --- | --- |
| Market cells and liquidity metrics | PASS | `admin_market_cell_liquidity` aggregates category/subcategory, geography, demand, supply, search success, contact rate, stale rate, wanted match rate, native share, and status classification with minimum thresholds. |
| Next Best Market recommendations | PASS | `admin_next_best_markets` ranks privacy-safe cells and provides admin acquisition guidance. |
| Controlled bootstrap retirement | PARTIAL | `admin_external_retirement_simulation`, `market_cell_retirement_policies`, and `next_bootstrap_retirement_stage` simulate gradual stages and rollback. Enforcement remains feature-flagged off. |
| Price intelligence | PARTIAL | `admin_price_intelligence_cohorts` computes seller-facing asking-price ranges only when sample count is sufficient. Buyer-facing estimates and time-series storage remain later work. |
| Trust and listing quality | PARTIAL | `admin_listing_trust_quality` computes internal bands and buyer-label guidance without guarantees. Full fraud graph, appeal UI, and moderation workbench automation remain later work. |
| Fraud and abuse intelligence | PARTIAL | Report clusters and provenance/freshness are represented in quality bands. Dedicated graph rules, incident automation, and false-positive monitoring remain later work. |
| Smart notifications | PARTIAL | Step 2 wanted requests and matches exist. Frequency caps, quiet hours, and delivery workers are not yet shipped. |
| Demand-to-supply activation | PARTIAL | Admin demand and next-best-market views exist. Dealer/scout weekly summaries are not yet automated. |
| Search/recommendation maturity | PARTIAL | Search telemetry and demand capture exist. Golden EN/FA/PS test sets and semantic fallback are not fully implemented. |
| Shops as distribution nodes | PARTIAL | Organizations foundation exists. Shop QR, analytics, staff least-privilege UI, and partner verification workflow remain later work. |
| Observability dashboards | PASS foundation | Network readiness admin page shows liquidity, retirement simulation, price cohorts, trust bands, and source health without raw PII. |
| Scale architecture | PARTIAL | Rollup run table and idempotency key foundation exist. Background workers/queues/load tests are still required. |
| SEO at scale | PARTIAL | Existing sitemap/canonical routes remain. Indexing policy for external retirement and expired valuable pages needs a dedicated SEO pass. |
| Monetization guardrails | PARTIAL | Promotions already cannot be treated as trust guarantees in the spec; server-side entitlement model is not yet complete. |
| Expansion strategy support | PASS foundation | Next-best-market and market-cell views support category x geography rollout decisions. |

## Current operating rules

- Do not enforce external inventory retirement until `bootstrap_retirement_enforcement` is intentionally enabled after simulation review.
- Do not display buyer-facing price estimates until methodology, category coverage, and sample thresholds are approved.
- Do not label external or paid sellers as verified. Trust bands are internal safeguards and public copy must remain non-guarantee language.
- Do not expose raw wanted requests, buyer identity, phone numbers, or event-level demand in dashboards.
- Do not reward scouts for raw volume. Reward rules must remain server-side and abuse-reviewed before launch.

## Rollback and safety

- External retirement is simulation-first and gradual: `ranking_demotion → quota_reduction → pause_new_ingestion → expiry_only → archive_noindex`.
- If liquidity collapses below configured thresholds, `next_bootstrap_retirement_stage` recommends `rollback_restore`.
- Current enforcement flag is disabled by default: `bootstrap_retirement_enforcement = false`.
- No migration hard-deletes listing, user, source, or event data.

## Known blockers before declaring READY

1. Enable Supabase Auth leaked-password protection in the Supabase dashboard.
2. Clean remaining Supabase advisor performance warnings: RLS init-plan and multiple permissive policy debt.
3. Build scheduled/idempotent workers for market-cell rollups, matching, notifications, source-health alerts, and retirement enforcement.
4. Add full EN/FA/PS golden search relevance suites and require no regression before ranking changes.
5. Add load tests for realistic inventory/search targets.
6. Add a full 404/link crawl and SEO indexability audit.
7. Finalize partner/scout legal/permission rules before any external ingestion expansion.

## Next phase criteria

Move from CONDITIONAL to READY only when:

- Top market cells show stable search success, healthy contact rate, fresh native/claimed supply, and acceptable stale rate for at least one operating window.
- Retirement simulation proves result retention is acceptable before any enforcement.
- Price intelligence has enough clean cohorts and is labeled as guidance, not a promise.
- Admin dashboards are reviewed by operations and contain no PII leakage.
- Security checks, DB lint, typecheck, unit tests, production build, deployment, and post-deploy smoke tests pass.

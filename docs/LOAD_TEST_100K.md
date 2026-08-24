# Sahibash 100,000 Listing Load Test Plan

Date: 2026-08-24
Status: not executed; this remains a mandatory pre-scale launch gate.

## Important

Do not insert 100,000 synthetic listings into production.

The required 100K load test must run against an isolated staging Supabase project or branch with staging Vercel environment variables.

## Current blocker

No isolated staging database was available in this run. Production contains real project data and hidden non-public fixture rows, so large synthetic data generation was intentionally not run.

## Dataset shape

Target approximately 100,000 listings with realistic distribution:

- vehicles: cars, motorcycles, bicycles, rickshaws, parts;
- real estate: sale, rent, gerawy, rooms/student housing, land;
- mobile/electronics: phones, laptops, accessories, appliances;
- second-hand/home/furniture;
- external/native/claimed ratios;
- approved/pending/sold/expired statuses;
- realistic Afghanistan provinces/districts;
- realistic price ranges and currencies;
- translated EN/FA/PS text where possible;
- image references or generated lightweight placeholders.

## Required measurements

Measure p50/p95/p99 for:

- homepage feed;
- search with typo and aliases;
- category filter;
- province/district filter;
- price filter;
- listing detail;
- similar listings;
- moderation queue;
- bridge ingestion/admin queue;
- saved-search matching.

Use:

- production-like Vercel build;
- staging Supabase branch/project;
- `EXPLAIN (ANALYZE, BUFFERS)` for slow database queries;
- browser performance sampling for mobile widths.

## Exit criteria

Before claiming 100/100 readiness:

- homepage and search remain responsive under expected launch traffic;
- no query has unresolved sequential scans on high-volume public paths;
- no serious RLS policy performance explosion remains on hot tables;
- listing-card payload is bounded;
- pagination is stable under inserts/deletes;
- 100K test data cleanup is proven and isolated from production.

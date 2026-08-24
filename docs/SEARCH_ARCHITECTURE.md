# Sahibash Search Architecture

Date: 2026-08-24
Status: lexical multilingual search foundation exists; semantic/vector search is intentionally not enabled yet.

## Current foundation

The project already uses a layered search architecture:

- app-side normalization in `lib/search/normalization.ts`;
- query understanding for year/storage/location hints;
- multilingual aliases and variants;
- `search_alias_dictionary`;
- `search_telemetry`;
- listing translations;
- generated/indexed search fields added by previous launch migration;
- PostgreSQL `pg_trgm` extension confirmed enabled.

Confirmed extensions:

- `pg_trgm`: enabled
- `postgis`: enabled
- `vector`: not enabled

## Public search behavior goal

Ranking should prefer:

1. exact normalized title/category/brand/model matches;
2. alias-dictionary matches;
3. prefix/partial matches;
4. full-text/trigram matches;
5. category compatibility;
6. location relevance;
7. freshness and quality;
8. bounded promotion boost.

Featured/promoted status must never make irrelevant listings outrank relevant listings. This is covered by `tests/marketplace-ranking.test.ts`.

## Existing tests

- `tests/multilingual-search-parity.test.ts`
- `tests/marketplace-ranking.test.ts`

Examples covered include phone variants, iPhone/Samsung/Redmi/Xiaomi, negotiable/exchange terms, Fielder/Toyota searches, and promotion-boost bounds.

## Search telemetry

Tables/RPCs exist for search telemetry. Intended reporting:

- top queries;
- zero-result queries;
- misspellings/rewrites;
- query language;
- selected category/location;
- click-through where available.

Privacy rule: telemetry must not collect passwords, session tokens, or unnecessary personal messages.

## Pgvector status

`vector` is not enabled. This is intentional for launch until lexical search and telemetry are stable.

If added later:

- enable behind a feature flag;
- keep embeddings server-side;
- generate embeddings from title, description, category hierarchy, brand/model, structured attributes, and location names;
- combine semantic score with lexical/category/location/freshness/quality scores;
- never hallucinate inventory.

## Remaining search work

P1:

- Expand admin alias workflow from live zero-result telemetry.
- Add location/search E2E across English, Dari and Pashto.
- Add route-level monitoring for search latency and zero-result spikes.

P2:

- Add dedicated lightweight listing-card view/RPC for high-volume feed/search pages.
- Use `EXPLAIN (ANALYZE, BUFFERS)` on representative queries before dropping any "unused" search indexes.

P4:

- Pgvector hybrid search only after staging tests prove lexical search health.

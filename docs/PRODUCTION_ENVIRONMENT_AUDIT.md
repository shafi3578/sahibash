# Sahibash Production Environment Audit

Date: 2026-08-24
Scope: Vercel production/preview/local configuration, Supabase project mapping, public fixture contamination.

## Verdict

Status: verified with remaining operational action.

The currently deployed public site `https://sahibash-three.vercel.app` is using Supabase project `sbtzkniuquewrtctsdpy`, which matches the local Supabase CLI link and local development `NEXT_PUBLIC_SUPABASE_URL`.

The old suspected project `onprntcokdirmiarykfn` was not detected in the checked public pages.

## Vercel mapping

Local `.vercel/project.json`:

- Project name: `sahibash`
- Project id: `prj_dMpZWkknVxEFdlJnnjvSNC9MIGc9`
- Org/team id: `team_2I3wFzO1xYGihQhzEfbBYLgl`

Vercel CLI project list:

- Account/context: `shafiullah-s-projects1`
- Project: `sahibash`
- Latest production URL: `https://sahibash-three.vercel.app`
- Node version: `24.x`

Vercel environment variables currently listed:

| Target | Key | Type |
| --- | --- | --- |
| production | `NEXT_PUBLIC_SUPABASE_URL` | encrypted |
| production | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | encrypted |
| production | `SUPABASE_SERVICE_ROLE_KEY` | encrypted/sensitive |
| production | `RATE_LIMIT_SALT` | encrypted/sensitive |
| preview | `NEXT_PUBLIC_SUPABASE_URL` | encrypted |
| preview | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | encrypted |
| preview | `SUPABASE_SERVICE_ROLE_KEY` | encrypted/sensitive |
| preview | `RATE_LIMIT_SALT` | encrypted/sensitive |

`SUPABASE_SERVICE_ROLE_KEY` is configured only as a server-side Vercel variable. It is required by the durable app rate limiter and must never be exposed through `NEXT_PUBLIC_*`.

## Supabase mapping

Supabase connector project list:

- Project ref/id: `sbtzkniuquewrtctsdpy`
- Name: `012400303-ops's Project`
- Organization slug/id: `evdlchdmlnyzzbpzplis`
- Region: `ap-southeast-2`
- Status: `ACTIVE_HEALTHY`
- Database host: `db.sbtzkniuquewrtctsdpy.supabase.co`
- PostgreSQL: `17.6.1.127`

Local Supabase CLI:

- `supabase/.temp/project-ref`: `sbtzkniuquewrtctsdpy`

Local `.env.local` keys present without exposing values:

- `NEXT_PUBLIC_SUPABASE_URL`, ref `sbtzkniuquewrtctsdpy`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HUGGINGFACE_API_KEY`

## Public live-page verification

Checked unauthenticated:

| URL | HTTP | Detected Supabase ref | Obvious fixture markers |
| --- | ---: | --- | --- |
| `https://sahibash-three.vercel.app/en` | 200 | `sbtzkniuquewrtctsdpy` | none |
| `https://sahibash-three.vercel.app/fa` | 200 | `sbtzkniuquewrtctsdpy` | none |
| `https://sahibash-three.vercel.app/ps` | 200 | `sbtzkniuquewrtctsdpy` | none |
| `https://sahibash-three.vercel.app/en/search` | 200 | `sbtzkniuquewrtctsdpy` | none |

## Production data contamination

Read-only production database counts:

- Approved listings: 7
- Approved featured listings: 0
- Obvious public fixture listings: 0
- Obvious fixture/smoke listings in any non-public status: 19

The remaining obvious fixture/smoke records are not public. They should be archived or deleted through an explicit admin cleanup process only after confirmation, not through an audit script.

New code guardrail added:

- Seller creation/form-action blocks obvious fixture publication in production.
- Moderator approval blocks obvious fixture listings in production.
- Test coverage added in `tests/production-fixture-guard.test.ts`.

## Corrective actions

Completed in code:

- Verified production/local Supabase ref alignment.
- Added production fixture-publication guardrails.
- Added read-only recurring sanity SQL in `scripts/sql/production_sanity_checks.sql`.

Remaining:

- Keep staging and production physically separated before 100K load/E2E work.
- If a staging Supabase branch/project is created, copy schema/migrations only first; do not seed production fixtures into production.
- Keep service-role credentials server-only and rotate them if they are ever exposed outside a secret manager.

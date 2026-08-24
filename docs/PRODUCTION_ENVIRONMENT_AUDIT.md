# Sahibash Production Environment Audit

Date: 2026-08-24
Status: superseded by `docs/PRODUCTION_IDENTITY_AUDIT.md`

## Current authoritative production target

Use:

- `https://sahibash.vercel.app`

Do not use `sahibash-three.vercel.app` as the authoritative production target unless explicitly doing historical comparison.

## Current verified environment facts

- Public production pages `/en`, `/fa`, and `/ps` return 200 from Vercel.
- The public production HTML contains `https://sbtzkniuquewrtctsdpy.supabase.co`.
- The connected Supabase project with ref `sbtzkniuquewrtctsdpy` is active and healthy.
- Local Git `main` and `origin/main` both point to `6ec3b04c0402e084c656da2425f2e804ae02f4db`.

## Vercel verification caveat

Vercel API/CLI inspection was not fully available from this machine during the Phase 0 audit:

- Connected Vercel app could list the `sahibash-web` team.
- It could not list projects or inspect the production deployment.
- CLI/API calls hung during network inspection.

Therefore the exact Vercel project/deployment commit must remain a documented uncertainty until Vercel API/CLI/dashboard inspection succeeds.

## Launch readiness caveat

The production environment is not launch-ready yet. The Phase 0 audit found P0 blockers:

- anonymous REST can select hidden listing coordinates;
- anonymous REST and public listing detail HTML expose contact phone before reveal;
- super-admin accounts have no verified MFA factors;
- audit logging is not proven because `audit_logs` contains zero rows.

See:

- `docs/PRODUCTION_IDENTITY_AUDIT.md`
- `docs/LAUNCH_READINESS.md`

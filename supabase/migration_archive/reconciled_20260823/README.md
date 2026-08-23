# Supabase migration timestamp reconciliation — 2026-08-23

These files were moved out of `supabase/migrations` during a safe migration-history reconciliation.

The production Supabase project `sbtzkniuquewrtctsdpy` already had the corresponding migrations recorded under later production timestamps. Keeping the older duplicate timestamp files in the active `supabase/migrations` folder caused `supabase db push --dry-run --linked` to report migration drift.

No production schema changes were made by this archive move. The active migration files now use the timestamps recorded in production, and `supabase db push --dry-run --linked` reports the remote database is up to date.

The affected files were also copied to a local external backup before moving:

`E:\sahibash-db-backups\migration_files_pre_reconcile_20260823_232640`

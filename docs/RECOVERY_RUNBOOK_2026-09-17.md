# Recovery rehearsal runbook — 17 September 2026

## Decision and scope

**An actual restore has not been demonstrated. Do not start one on the current host yet.** A local rehearsal can avoid new cloud charges and off-machine data transfer, but the current machine lacks memory headroom, an approved encrypted scratch target, and a compatible initialized server/runtime. The next safe step is preparation and synthetic validation, not production-data restoration.

This assessment used source at `aeb3f3443b7f19318d6d38f4bf3350c5ba46a2f3`, existing sanitized receipts, encrypted-file hashes, filesystem/package inventories, and resource checks. A separately authorized metadata-only query supplied the source PostgreSQL/extension versions. No database service, restore, installation, object download, production write, key export, or data decryption was performed for this assessment.

The authoritative checkout is `E:\Drive C\Documents\Codex\2026-08-04\referenced-chatgpt-conversation-this-is-an-3\sahibash`. Paths below are relative to that checkout unless explicitly described as a future approved target.

## Existing recovery inputs

| Input | Preserved evidence | Important boundary |
| --- | --- | --- |
| Database | `.temp/recovery-backups/database-2026-09-16T14-50-51-111Z-9ba2dcb8-252b-4547-b507-d5959e6406a5/verification-summary.redacted.json` | Export began 14:51 UTC and completion of the separate exports was recorded at 15:05 UTC on 16 September. |
| Full archive | `database-full.dump.aesgcm.partial`, 3,129,148 encrypted bytes; 3,524 TOC entries; Auth data, Storage metadata and migration ledger present | The suffix is intentional: the authenticated recovered artifact and original failed checkpoint were preserved. Do not rename it or discard it as an unverified partial. Original producer exit status was not retained; later GCM/hash and full archive-to-SQL discard readback passed. |
| Roles and ledger | `roles.sql.aesgcm` and `migration-ledger.dump.aesgcm` | Database-role passwords were deliberately excluded. These separate exports are not one atomic snapshot with the full dump. |
| Storage | `.temp/recovery-backups/storage-2026-09-16T15-21-41-604Z-6002b1ce-ec3e-48ff-a393-9097eaa27265/verification-summary.redacted.json` | All 705 objects / 123,084,660 plaintext bytes exported; 124 reused and 581 completed on resume; zero partial object files. Final source identity/version/ETag/size/metadata and all persisted GCM/hash checks passed at 15:58:57 UTC. |

The database receipt's three artifact hashes, sizes and final-manifest hash were rechecked successfully during this assessment. The two `key.dpapi` files exist; their contents were not read. The prior Storage completion review independently matched its aggregate file sizes/counts, restricted ACLs and final encrypted-manifest hash.

Full database ciphertext SHA-256: `d2013f105846f9ae092a85864fb1edc78e894f65693b3c43acb51b1fc797b240`.

Database final-manifest SHA-256: `fd8d816a7b999104159b229152364582d1d3d4f6a90e566d51ce9dfcb3521e76`.

Storage final manifest: `manifest-resumed-7334139f-c547-43ce-b7c2-caf0597befc1.json.aesgcm`, SHA-256 `4a0f2e2b8ff1b57746c38957318e2456a3caa9ec6e1ee0a91e3f10e9faa7a630`.

The full dump already includes migration history. Do not blindly import the additional ledger on top of it. Compare the two snapshots and retain the evidence for any deliberate reconciliation.

## Current host and compatibility evidence

Read-only observations on 17 September 2026, around 06:41 UTC; resource headroom must be measured again before any execution:

| Check | Observation | Consequence |
| --- | --- | --- |
| RAM | 7,867 MiB total; 448 MiB free physical; 1,309 MiB free virtual at sampling | Do not add a database/VM while the current workload is running. |
| Disk | C: 2,096,381,952 bytes free; E: 48,743,972,864 bytes free | E: has capacity for bounded preparation, but compressed backup size alone does not establish restored DB/WAL/runtime footprint. Avoid C: defaults. |
| Disk independence | C: and E: are both on physical disk 0 | Another drive letter is not an independent backup. Disk failure can remove both checkout and backups. |
| At-rest encryption | Both volumes report `FullyDecrypted`, protection `Off`, 0% BitLocker encryption | Existing encrypted archives remain encrypted. A restored PostgreSQL data directory would contain sensitive readable database pages; ACLs alone do not provide volume encryption. |
| Containers | No Docker/Podman command on PATH or matching service found; no current-user WSL distribution registered | The presence of `wsl.exe` does not establish a usable Linux/container runtime. No runtime was installed or started. |
| PostgreSQL package | Reviewed local 17.11 clients and server executable files exist under `.temp/recovery-tools/postgresql-17.11-3/signed-extracted/bin` | The extracted tree lacks `share` templates/extension controls and is not yet an initdb-ready installation. The separate extracted `pgsql` tree contains only `bin`. |
| Existing ZIP | The local 341,325,378-byte ZIP contains initialization templates and 60 extension controls; 907,896,760 bytes total uncompressed entries | Completing a stock distribution is possible preparation without a new download, subject to source/hash review and explicit extraction approval. It still lacks PostGIS and Vault controls. Nothing was extracted during this assessment. |
| PGlite | `@electric-sql/pglite` 0.5.8 exists under `.temp/release-sql-harness/node_modules` | Existing synthetic SQL checks are useful, but no compatible full Supabase restore or Storage service has been demonstrated with this package. |

The source currently reports PostgreSQL **17.6** (`server_version_num=170006`). Installed extensions reported by the authorized metadata-only check are `pg_stat_statements 1.11`, `pg_trgm 1.6`, `pgcrypto 1.3`, `plpgsql 1.0`, `postgis 3.3.7`, `supabase_vault 0.3.1`, and `uuid-ossp 1.1`. This is current compatibility evidence, not proof of the precise extension versions at the older dump's snapshot. Verify those against archive metadata before a rehearsal.

That sanitized metadata inventory is retained at `.temp/release-backups/2026-09-17-readonly-followup-0639/readiness-and-history-evidence.redacted.json`.

Stock PostgreSQL 17.11 alone is not a complete Supabase target. Do not remove PostGIS/Vault definitions or silently skip errors to claim a full restore. A deliberately reduced data-only exercise must be labeled partial, with every excluded dependency listed. Supabase's local stack requires a container runtime; its CLI recommends at least 7 GB RAM for all services. [Local development](https://supabase.com/docs/guides/local-development), [CLI start requirements](https://supabase.com/docs/reference/cli/supabase-start)

## Recovery dependencies and gaps

- Each backup set has its own AES-256-GCM key, wrapped by Windows **DPAPI CurrentUser**. `key.dpapi` plus the encrypted files is not proven recoverable on a replacement machine or account. Preserve the current Windows profile and machine context until an independently tested recovery method exists; never reset credentials as part of this rehearsal. [Microsoft DPAPI behavior](https://learn.microsoft.com/en-us/windows/win32/api/dpapi/nf-dpapi-cryptprotectdata)
- Existing backup ACLs allow the current user; descendants include built-in Administrators ownership. This is not protection from a privileged Windows administrator. No off-machine key escrow or independently recoverable backup copy has been verified.
- Supabase Vault's project encryption root key is separate from the logical dump. A manual restore does not by itself recover Vault plaintext. Vault is installed, but this assessment did not query whether it contains secrets. Any required key recovery/custody step needs a separate secure plan; do not print or fetch that key during this runbook. [Vault key portability](https://supabase.com/docs/guides/database/vault)
- Database-role passwords, platform/Auth configuration, JWT/API keys, external provider settings, deployed service versions, and other encryption-key dependencies are not covered by the logical-export proof. End-user Auth rows can still contain sensitive authentication material. Restoring `auth.users` alone does not prove working login or MFA. [Platform-to-self-hosted recovery boundaries](https://supabase.com/docs/guides/self-hosting/restore-from-platform)
- The database and Storage exports are separate snapshots. Storage objects must be restored separately; database metadata is not the object bytes. Reconcile references against the chosen snapshot, preserving extra objects and reporting missing references without exposing names. [Database backup coverage](https://supabase.com/docs/guides/platform/backups)
- These exports predate `20260916220149_featured_merchant_destination_readiness.sql`. A current-release rehearsal must first validate the restored backup state, then deliberately replay that reviewed migration locally and validate its private function/INSERT trigger, privileges, existing policies and unchanged payment data. Inventory any additional later migrations at execution time. Historical local/remote timestamp mismatches remain a separate reviewed reconciliation task: never bulk-push or blindly repair the restored ledger.
- A successful local rehearsal would still not prove off-machine recovery, acceptable RPO/RTO, provider settlement/email/SMS, or a production restore. Record measured timings and the actual recovered snapshot, not estimated guarantees.

## Gated execution plan — not executed

### 1. Prepare and review without production rows

Develop a restore wrapper and test it only with synthetic encrypted fixtures first. It must fail on wrong keys/tags, modified hashes, unexpected artifact paths, reparse-point escapes, incomplete manifests, remote connection targets and nonempty target directories. Inventory archive TOC/schema dependencies in memory with a metadata-only output allowlist; do not log SQL bodies, role definitions, object names, credentials or table values.

Select and verify a compatible PostgreSQL 17/Supabase runtime with PostGIS and Vault support, including ownership/bootstrap requirements. Prefer a pinned compatible runtime over adapting a stock server with stubs. Review the complete dump's treatment of managed schemas rather than feeding it blindly into an already initialized Supabase database. Current Supabase releases restrict managed-schema changes; self-hosted defaults have also changed. [Managed-schema restrictions](https://supabase.com/changelog/realtime-schema-locked-down-against-modification), [PostgreSQL 17 self-hosting change](https://supabase.com/changelog/46080-self-hosted-supabase-upgrading-from-pg-15-to-17-breaking-change)

### 2. Obtain an approved local target and resource window

The owner must approve a local encrypted scratch location and runtime setup before any production-data restore. Do not default to the repository, C: temporary folders, Downloads, or the existing backup directories. Record one explicit absolute encrypted scratch root and create only a fresh `sahibash-restore-<UUID>` child with `pgdata`, `wal`, `temp`, `logs`, and `storage` subdirectories. Reject pre-existing target content and resolved paths outside that root. Keep original backups read-only and unchanged.

Verify encryption and restricted ACLs before the first sensitive write. Include database pages, WAL, temporary files, container volumes and logs. Account for Windows paging/crash dumps too: encrypted application files do not prove plaintext never reaches an unencrypted pagefile. A strict no-plaintext-at-rest claim requires a separately verified host/scratch arrangement; it is not satisfied on the current host.

Recheck available RAM/disk and agree a bounded serial run with time/space abort thresholds. Do not close unrelated user apps, change paging/encryption settings, install software or mount volumes without approval. No paid service or cloud target is needed for the local design, but absence of new cloud charges is not a claim of zero local resource cost.

### 3. Establish isolation before restoring

Create a fresh disposable local instance only after gates 1–2 pass. Use a separately generated local-only credential, explicit authentication, and a verified loopback-only endpoint/unused port or an equivalently isolated container transport. Do not register an auto-start service. Record the target's unique cluster identity and marker, then verify them before every restore phase.

The wrapper must start with a minimal environment: never inherit the repository's `.env.local`, production `PG*` variables, linked-project credentials, SMTP/payment keys or cloud URLs. Forbid production hosts and non-loopback database targets. Prevent outbound network access from the restore environment before importing executable SQL. Keep scheduled jobs, hooks, replication subscriptions, foreign connections, email/SMS/payment workers and app traffic disabled. Binding inbound ports to localhost alone does not block outbound effects.

### 4. Restore and attest the database

Authenticate each entire ciphertext and expected hash first; only then decrypt a second pass directly into the reviewed restore process through a pipe. Keep the same immutable/read-locked artifact across both passes, or retain bounded authenticated ciphertext in memory, so verification and consumption cannot use different bytes. Do not emit a plaintext dump or SQL file. GCM streaming can yield bytes before its final tag is checked, so the first complete authentication pass is required before consuming executable SQL.

Use a single worker, fail on the first unexpected error, and explicitly target only the disposable database. Restore roles/ownership through a reviewed local bootstrap procedure; do not blindly grant production role attributes on any existing server. Preserve schema/RLS/function semantics for a full rehearsal. Where transaction support permits, use a single transaction; streaming input cannot use parallel `pg_restore` jobs. Capture errors privately with row/credential-safe classification, never raw SQL stderr. [PostgreSQL restore semantics](https://www.postgresql.org/docs/17/app-pgrestore.html)

Before starting application services, verify aggregate table counts, canonical row hashes, migration history, constraints, indexes, sequences, functions, triggers, roles, grants and RLS against snapshot-derived expectations. Compare data without returning personal rows. First attest the historical snapshot, then apply the explicitly approved post-export migration(s) locally and test expected security boundaries. Re-enable nothing that can contact a real provider.

### 5. Rehearse Storage recovery separately

Use only an approved local Storage API/backend with encrypted volumes, isolated networking and fresh test credentials. Authenticate each original object before streaming it from the encrypted backup into the local target. Keep bucket/object-name mappings inside encrypted manifests and process memory, not filenames or logs. Do not call the production SDK client or reuse its service key. Restore the 705-object inventory without deleting unmatched objects or altering original backups; reconcile metadata with the selected database snapshot.

Read every restored local object back into a hash/discard sink, compare all 705 hashes and the 123,084,660-byte total, and check public/private bucket authorization using local synthetic sessions. Hashing original backup files again is useful integrity evidence but is not this Storage restore test. A directory extraction alone also does not prove Storage API behavior.

### 6. Record evidence and stop safely

Success evidence must identify the approved isolated target, runtime versions, selected backup timestamps/hashes, restored scopes and exclusions, all aggregate validations, post-export migration results, measured timings, and whether login/MFA/Storage access was actually tested. Keep sensitive diagnostics encrypted; publish only sanitized counts/hashes and pass/fail results.

Stop only processes created by this rehearsal and verify its listeners/workers are gone. Do not delete, overwrite or move the backup sets. Retention and eventual destruction of the disposable restored data require a separate exact-target decision; recursive cleanup against a drive, repository, or broad temporary root is prohibited.

## Ownership of remaining work

| Requires owner choice/approval | Implementation work after approval |
| --- | --- |
| A safe memory/resource window; encrypted local scratch and paging/privacy policy | Fail-closed resource/path/target checks and minimal runtime configuration |
| Runtime installation/extraction/container setup, if needed | Compatible server/extension provenance and synthetic bootstrap tests |
| Local production-data rehearsal and any sensitive encryption-key handling | Authenticated streaming restore, aggregate attestation, and migration replay |
| Independent/off-machine backup and key custody destination; not authorized here | Portable recovery-key wrapping and a separately authorized recovery test without exposing keys |
| Retention/destruction policy for the disposable restored copy | Exact-target shutdown and a separately reviewed cleanup plan |

**Safe next step:** finish the metadata compatibility inventory and synthetic-only restore-wrapper design/review. Do not launch a real restore until the host, runtime and encrypted-target gates are satisfied. The present result is a recovery plan and verified backup inputs, not a passed disaster-recovery drill.

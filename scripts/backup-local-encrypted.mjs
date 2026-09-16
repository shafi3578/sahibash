/**
 * Windows-only, project-scoped logical backup. Default: synthetic offline self-test.
 * No restore command exists. Never executes Supabase's generated shell.
 *
 * node scripts/backup-local-encrypted.mjs --self-test
 * node scripts/backup-local-encrypted.mjs --check
 * node scripts/backup-local-encrypted.mjs --verify-partial <private-backup-directory>
 * node scripts/backup-local-encrypted.mjs --complete-partial <private-backup-directory> --confirm-project sbtzkniuquewrtctsdpy
 * node scripts/backup-local-encrypted.mjs --export --confirm-project sbtzkniuquewrtctsdpy
 *
 * Requires reviewed EDB PostgreSQL 17 binaries in the fixed ignored directory.
 * DPAPI CurrentUser protection is NOT independent/off-machine disaster recovery.
 */
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID, X509Certificate } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { lstat, mkdir, open, readFile, readdir, realpath, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable, Transform, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'sbtzkniuquewrtctsdpy';
const BACKUPS = path.join(ROOT, '.temp', 'recovery-backups');
const TOOLS = path.join(ROOT, '.temp', 'recovery-tools', 'postgresql-17.11-3');
const BIN = path.join(TOOLS, 'signed-extracted', 'bin');
const INSTALLER = path.join(TOOLS, 'postgresql-17.11-3-windows-x64.exe');
// Official EDB download linked by postgresql.org/download/windows/, Authenticode
// Valid / EnterpriseDB Corporation. Extracted with --extract-only 1, no install.
// All 67 extracted bin files also matched the official portable zip byte-for-byte.
const INSTALLER_SHA256 = '2fd19749560be03020026f2d842b69af47f0ea2c7946bda17eed26a4a9235695';
const BIN_TREE_SHA256 = '18a5bcca55006cd9788bb85e863e3e2b3b780ba52bccfd9734170467232c7113';
const CA_FILE = path.join(TOOLS, 'prod-ca-2021.crt');
// Source verified in Supabase's own Studio custom-content.json certificate URL:
// https://github.com/supabase/supabase/blob/master/apps/studio/hooks/custom-content/custom-content.json
// https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt
const CA_SHA256 = '700723581420dd1ac98fd7e9ac529f0ef210eadcaf87fc868a3ad7d114c2f3b7';
const CLI = path.join(ROOT, 'node_modules', '@supabase', 'cli-windows-x64', 'bin', 'supabase.exe');
const POWERSHELL = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe');
const MAGIC = Buffer.from('SBBAK001');
const PG_NAMES = ['PGHOST', 'PGPORT', 'PGUSER', 'PGDATABASE', 'PGPASSWORD'];
const TIMEOUT_MS = 15 * 60_000;

class SafeFailure extends Error {}
function requireSafe(condition, code) { if (!condition) throw new SafeFailure(code); }
function report(value) { process.stdout.write(`${JSON.stringify(value)}\n`); }

function childEnvironment(extra = {}) {
  const env = {};
  for (const name of ['SystemRoot', 'WINDIR', 'PATH', 'PATHEXT', 'USERPROFILE', 'APPDATA', 'LOCALAPPDATA']) {
    if (process.env[name]) env[name] = process.env[name];
  }
  return { ...env, ...extra };
}

function start(command, args, env, timeout = TIMEOUT_MS) {
  const child = spawn(command, args, { cwd: ROOT, env, shell: false, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
  let stderrBytes = 0;
  const categories = new Set();
  // Never forward tool stderr: SQL errors can contain row values or credentials.
  child.stderr.on('data', (chunk) => {
    stderrBytes += chunk.length;
    const text = chunk.toString('utf8');
    if (/certificate|sslrootcert|root cert|SSL error/i.test(text)) categories.add('tls_certificate');
    if (/password authentication failed|no password supplied/i.test(text)) categories.add('authentication');
    if (/permission denied|must be owner|must be superuser/i.test(text)) categories.add('permission');
    if (/permission denied to set role/i.test(text)) categories.add('role_selection');
    if (/permission denied for schema/i.test(text)) categories.add('schema_access');
    if (/permission denied for (table|relation)/i.test(text)) categories.add('table_access');
    if (/connection refused|could not translate host|network is unreachable|timeout expired/i.test(text)) categories.add('network');
  });
  const timer = setTimeout(() => child.kill(), timeout);
  const completion = new Promise((resolve, reject) => {
    child.once('error', () => { clearTimeout(timer); reject(new SafeFailure('child_start_failed')); });
    child.once('close', (code, signal) => {
      clearTimeout(timer);
      if (code !== 0 || signal) {
        const category = signal ? 'timeout_or_signal' : [...categories].sort().join('_') || 'nonzero_exit';
        reject(new SafeFailure(`${path.basename(command)}_${category}`));
      }
      else resolve({ stderrBytes });
    });
  });
  // Attach immediately so a fast failure cannot become an unhandled rejection.
  completion.catch(() => {});
  child.stdin.on('error', () => {});
  return { child, completion };
}

async function capture(command, args, { env = childEnvironment(), input = '', limit = 2_000_000, timeout = 60_000 } = {}) {
  const { child, completion } = start(command, args, env, timeout);
  const chunks = [];
  let bytes = 0;
  let overflow = false;
  child.stdout.on('data', (chunk) => {
    bytes += chunk.length;
    if (bytes > limit) { overflow = true; child.kill(); }
    else chunks.push(chunk);
  });
  child.stdin.end(input);
  try {
    const result = await completion;
    requireSafe(!overflow, 'capture_limit');
    return { ...result, output: Buffer.concat(chunks).toString('utf8') };
  } finally { for (const chunk of chunks) chunk.fill(0); }
}

async function powershell(script, input = '') {
  return capture(POWERSHELL, ['-NoLogo', '-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], { input });
}

async function assertContained(target, parent) {
  const actualParent = await realpath(parent);
  const actualTarget = await realpath(target);
  const relative = path.relative(actualParent, actualTarget);
  requireSafe(relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative), 'path_outside_private_root');
}

async function makePrivateDirectory(directory) {
  await mkdir(directory, { recursive: true });
  await assertContained(directory, ROOT);
  const info = await lstat(directory);
  requireSafe(info.isDirectory() && !info.isSymbolicLink(), 'unsafe_directory');
  await powershell(String.raw`
$ErrorActionPreference='Stop'
$target=[Console]::In.ReadToEnd()
$sid=[System.Security.Principal.WindowsIdentity]::GetCurrent().User
$acl=New-Object System.Security.AccessControl.DirectorySecurity
$acl.SetAccessRuleProtection($true,$false)
$acl.SetOwner($sid)
$rule=New-Object System.Security.AccessControl.FileSystemAccessRule($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
$acl.AddAccessRule($rule)
Set-Acl -LiteralPath $target -AclObject $acl
$actual=Get-Acl -LiteralPath $target
if(-not $actual.AreAccessRulesProtected){throw 'acl'}
foreach($entry in $actual.Access){
  if($entry.IdentityReference.Translate([System.Security.Principal.SecurityIdentifier]).Value -ne $sid.Value -or $entry.AccessControlType -ne 'Allow'){throw 'acl'}
}
[Console]::Out.Write('private')`, directory);
}

async function dpapi(bytes, unprotect = false) {
  const operation = unprotect ? 'Unprotect' : 'Protect';
  const { output } = await powershell(`
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Security
$bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd())
$result=[System.Security.Cryptography.ProtectedData]::${operation}($bytes,$null,[System.Security.Cryptography.DataProtectionScope]::CurrentUser)
[Array]::Clear($bytes,0,$bytes.Length)
[Console]::Out.Write([Convert]::ToBase64String($result))
[Array]::Clear($result,0,$result.Length)`, bytes.toString('base64'));
  return Buffer.from(output, 'base64');
}

// Accept literals only; no expansion, interpolation, concatenation, eval, or shell.
export function parsePgEnvironment(text) {
  const values = {};
  for (const name of PG_NAMES) {
    const matches = [...text.matchAll(new RegExp(`^\\s*(?:export\\s+)?${name}=(.*)$`, 'gm'))];
    requireSafe(matches.length === 1, 'missing_or_duplicate_pg_variable');
    const raw = matches[0][1].trim();
    let value;
    if (/^'[^']*'$/.test(raw)) value = raw.slice(1, -1);
    else if (/^"[^"$`\\]*"$/.test(raw)) value = raw.slice(1, -1);
    else if (/^[A-Za-z0-9._~:/@%+!,=-]+$/.test(raw)) value = raw;
    else throw new SafeFailure('nonliteral_pg_variable');
    requireSafe(value.length > 0 && !/[\r\n\0]/.test(value), 'invalid_pg_variable');
    values[name] = value;
  }
  requireSafe(/^[a-z0-9.-]+\.supabase\.(com|co)$/.test(values.PGHOST), 'unexpected_pg_host');
  requireSafe(values.PGPORT === '5432', 'not_session_connection');
  requireSafe(values.PGUSER.endsWith(`.${PROJECT}`), 'unexpected_pg_project');
  requireSafe(values.PGDATABASE === 'postgres', 'unexpected_pg_database');
  return values;
}

async function credentials() {
  requireSafe((await readFile(path.join(ROOT, 'supabase', '.temp', 'project-ref'), 'utf8')).trim() === PROJECT, 'linked_project_mismatch');
  const { output } = await capture(CLI, ['db', 'dump', '--linked', '--schema', 'public', '--dry-run', '--log-level', 'error']);
  return parsePgEnvironment(output);
}

function pgEnvironment(pg, workingDirectory) {
  return childEnvironment({
    ...pg,
    TEMP: workingDirectory, TMP: workingDirectory,
    PGCONNECT_TIMEOUT: '20', PGAPPNAME: 'sahibash-encrypted-readonly-backup',
    PGSSLMODE: 'verify-full', PGSSLROOTCERT: CA_FILE,
    PGOPTIONS: '-c default_transaction_read_only=on -c statement_timeout=600000 -c lock_timeout=10000',
  });
}

async function verifyBinaries() {
  const caBytes = await readFile(CA_FILE);
  requireSafe(createHash('sha256').update(caBytes).digest('hex') === CA_SHA256, 'ca_hash_mismatch');
  const ca = new X509Certificate(caBytes);
  requireSafe(ca.ca && ca.verify(ca.publicKey) && Date.now() >= Date.parse(ca.validFrom) && Date.now() < Date.parse(ca.validTo), 'ca_invalid');
  requireSafe((await hashFile(INSTALLER)).ciphertextSha256 === INSTALLER_SHA256, 'installer_hash_mismatch');
  const { output } = await powershell(String.raw`
$ErrorActionPreference='Stop'
$installer=[Console]::In.ReadToEnd()
$signature=Get-AuthenticodeSignature -LiteralPath $installer
if($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'CN=EnterpriseDB Corporation'){throw 'signature'}
[Console]::Out.Write('verified')`, INSTALLER);
  requireSafe(output === 'verified', 'binary_signature_failed');
  const files = (await readdir(BIN, { withFileTypes: true })).filter((file) => file.isFile()).map((file) => file.name).sort();
  requireSafe(files.length === 67, 'binary_tree_file_count_mismatch');
  const tree = createHash('sha256');
  for (const name of files) {
    const digest = createHash('sha256').update(await readFile(path.join(BIN, name))).digest('hex');
    tree.update(`${name}\0${digest}\n`);
  }
  requireSafe(tree.digest('hex') === BIN_TREE_SHA256, 'binary_tree_hash_mismatch');
  const version = await capture(path.join(BIN, 'pg_dump.exe'), ['--version']);
  requireSafe(/^pg_dump \(PostgreSQL\) 17\.11\s*$/.test(version.output), 'unexpected_pg_client_version');
}

async function connectivity(env) {
  // Match Supabase's --role=postgres *after* the pooler authenticates the login.
  // SET ROLE only changes this read-only session; it does not mutate any role.
  const { output, stderrBytes } = await capture(path.join(BIN, 'psql.exe'), ['-X', '-w', '-q', '-A', '-t', '-v', 'ON_ERROR_STOP=1',
    '-c', '\\conninfo', '-c',
    "BEGIN READ ONLY; SET LOCAL ROLE postgres; SELECT json_build_object('serverVersion',current_setting('server_version_num')::int,'readOnly',current_setting('transaction_read_only')='on','backendTls',(SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()),'migrationLedgerPresent',to_regclass('supabase_migrations.schema_migrations') IS NOT NULL); ROLLBACK;"], { env });
  // \conninfo contains host/login names: inspect internally and never print it.
  const clientTls = /SSL connection\s*\(protocol:\s*TLSv1\.[23]\b/.test(output);
  const jsonLines = output.split(/\r?\n/).filter((line) => line.startsWith('{'));
  requireSafe(jsonLines.length === 1, 'unexpected_connectivity_response');
  const metadata = { ...JSON.parse(jsonLines[0]), clientTls, clientTlsCertificateVerified: clientTls };
  if (metadata.readOnly !== true || !clientTls || metadata.migrationLedgerPresent !== true) {
    report({ mode: 'read-only-connectivity-safety', readOnly: metadata.readOnly === true, clientTls, backendTls: metadata.backendTls === true, migrationLedgerPresent: metadata.migrationLedgerPresent === true });
  }
  // pg_stat_ssl is the pooler-to-database leg, not libpq-to-pooler TLS. Preserve
  // its actual value; client verify-full and \conninfo are the client proof.
  requireSafe(metadata.readOnly === true && clientTls && metadata.migrationLedgerPresent === true, 'connection_safety_check_failed');
  requireSafe(metadata.serverVersion >= 120000 && metadata.serverVersion < 180000, 'unsupported_server_version');
  requireSafe(stderrBytes === 0, 'connection_warning');
  return metadata;
}

async function hashFile(filename) {
  const hash = createHash('sha256');
  let bytes = 0;
  for await (const chunk of createReadStream(filename)) { hash.update(chunk); bytes += chunk.length; }
  return { ciphertextSha256: hash.digest('hex'), ciphertextBytes: bytes };
}

async function encryptStream(source, filename, key) {
  const iv = randomBytes(12);
  const header = Buffer.concat([MAGIC, iv]);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  cipher.setAAD(header);
  const plaintextHash = createHash('sha256');
  let plaintextBytes = 0;
  const observer = new Transform({ transform(chunk, _encoding, done) {
    plaintextBytes += chunk.length;
    plaintextHash.update(chunk);
    done(null, chunk);
  } });
  const destination = createWriteStream(`${filename}.partial`, { flags: 'wx', mode: 0o600, flush: true });
  destination.write(header);
  await pipeline(source, observer, cipher, destination, { end: false });
  destination.end(cipher.getAuthTag());
  await new Promise((resolve, reject) => { destination.once('close', resolve); destination.once('error', reject); });
  requireSafe(plaintextBytes > 0, 'empty_artifact');
  return { plaintextBytes, plaintextSha256: plaintextHash.digest('hex'), ...await hashFile(`${filename}.partial`) };
}

async function verifyEncrypted(filename, key, expected) {
  const info = await lstat(filename);
  requireSafe(info.isFile() && info.size > MAGIC.length + 12 + 16, 'invalid_encrypted_file');
  const handle = await open(filename, 'r');
  const header = Buffer.alloc(20);
  const tag = Buffer.alloc(16);
  try { await handle.read(header, 0, 20, 0); await handle.read(tag, 0, 16, info.size - 16); }
  finally { await handle.close(); }
  requireSafe(header.subarray(0, 8).equals(MAGIC), 'bad_encryption_header');
  const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(8));
  decipher.setAAD(header); decipher.setAuthTag(tag);
  const hash = createHash('sha256');
  let bytes = 0;
  await pipeline(createReadStream(filename, { start: 20, end: info.size - 17 }), decipher,
    new Writable({ write(chunk, _encoding, done) { bytes += chunk.length; hash.update(chunk); done(); } }));
  const plaintextSha256 = hash.digest('hex');
  const actual = await hashFile(filename);
  if (expected) {
    requireSafe(bytes === expected.plaintextBytes && plaintextSha256 === expected.plaintextSha256, 'encrypted_integrity_mismatch');
    requireSafe(actual.ciphertextSha256 === expected.ciphertextSha256, 'ciphertext_hash_mismatch');
  }
  return { plaintextBytes: bytes, plaintextSha256, ...actual };
}

async function archiveReadback(filename, key, fullSqlReadback = false) {
  // Caller authenticates the entire file first. Never feed unauthenticated bytes
  // into pg_restore, and never supply a database/connection or restore arguments.
  const info = await lstat(filename);
  const handle = await open(filename, 'r');
  const header = Buffer.alloc(20);
  const tag = Buffer.alloc(16);
  try { await handle.read(header, 0, 20, 0); await handle.read(tag, 0, 16, info.size - 16); }
  finally { await handle.close(); }
  const decipher = createDecipheriv('aes-256-gcm', key, header.subarray(8));
  decipher.setAAD(header); decipher.setAuthTag(tag);
  const { child, completion } = start(path.join(BIN, 'pg_restore.exe'), [fullSqlReadback ? '--file=-' : '--list'], childEnvironment(), 60_000);
  const chunks = [];
  let bytes = 0;
  const sqlHash = createHash('sha256');
  child.stdout.on('data', (chunk) => {
    bytes += chunk.length;
    if (fullSqlReadback) { sqlHash.update(chunk); return; } // Discard SQL; never execute or persist it.
    if (bytes > 10_000_000) child.kill();
    else chunks.push(chunk);
  });
  try {
    let pipeFailure;
    try { await pipeline(createReadStream(filename, { start: 20, end: info.size - 17 }), decipher, child.stdin); }
    catch (error) { pipeFailure = error; }
    const result = await completion;
    // --list may finish once it reads the TOC and close stdin before table data.
    // The caller already authenticated every ciphertext byte. Accept that early
    // pipe close only when pg_restore exited successfully and its TOC validates.
    requireSafe(!pipeFailure || (!fullSqlReadback && ['EPIPE', 'ERR_STREAM_PREMATURE_CLOSE'].includes(pipeFailure.code)), 'archive_readback_pipe_failed');
    requireSafe(result.stderrBytes === 0 && (fullSqlReadback || bytes <= 10_000_000), 'archive_list_failed');
    if (fullSqlReadback) return { fullArchiveSqlReadback: true, sqlBytes: bytes, sqlSha256: sqlHash.digest('hex'), sqlExecuted: false };
    const list = Buffer.concat(chunks).toString('utf8');
    const summary = {
      tocEntries: list.split('\n').filter((line) => /^\d+;/.test(line)).length,
      authDataPresent: /\bTABLE DATA auth\s/.test(list),
      storageMetadataPresent: /\bTABLE DATA storage\s/.test(list),
      migrationLedgerPresent: /\bTABLE DATA supabase_migrations\s/.test(list),
    };
    requireSafe(summary.tocEntries > 0, 'empty_archive_table_of_contents');
    return summary;
  } finally { child.kill(); await completion.catch(() => {}); for (const chunk of chunks) chunk.fill(0); }
}

async function exportArtifact(directory, name, command, args, env, key) {
  const filename = path.join(directory, `${name}.aesgcm`);
  const { child, completion } = start(command, args, env);
  child.stdin.end();
  try {
    const encrypted = await encryptStream(child.stdout, filename, key);
    const result = await completion;
    // Warnings can signal omitted data. Fail closed; leave only private ciphertext.
    requireSafe(result.stderrBytes === 0, 'export_warning_requires_review');
    await verifyEncrypted(`${filename}.partial`, key, encrypted);
    // Preserve expected hashes before offline TOC work so that a recoverable
    // reader/pipe failure never requires another production dump.
    await saveManifest(directory, { name, ...encrypted, producerExitedZero: true, authenticatedReadback: true, semanticReadbackComplete: false }, key, `artifact-receipt-${name}`);
    const archive = name.endsWith('.dump') ? await archiveReadback(`${filename}.partial`, key) : undefined;
    if (name === 'database-full.dump') requireSafe(archive.authDataPresent && archive.storageMetadataPresent && archive.migrationLedgerPresent, 'full_database_archive_missing_required_schema');
    if (name === 'migration-ledger.dump') requireSafe(archive.migrationLedgerPresent, 'migration_ledger_missing');
    await rename(`${filename}.partial`, filename);
    return { name, ...encrypted, authenticatedReadback: true, ...(archive ? { archive } : {}) };
  } catch (error) { child.kill(); await completion.catch(() => {}); throw error; }
}

async function saveManifest(directory, manifest, key, name) {
  const filename = path.join(directory, `${name}.json.aesgcm`);
  const metadata = await encryptStream(Readable.from([Buffer.from(JSON.stringify(manifest))]), filename, key);
  await verifyEncrypted(`${filename}.partial`, key, metadata);
  await rename(`${filename}.partial`, filename);
}

async function readSmallEncryptedJson(filename, key) {
  const encrypted = await readFile(filename);
  requireSafe(encrypted.length > 36 && encrypted.length < 2_000_000 && encrypted.subarray(0, 8).equals(MAGIC), 'invalid_encrypted_metadata');
  const decipher = createDecipheriv('aes-256-gcm', key, encrypted.subarray(8, 20));
  decipher.setAAD(encrypted.subarray(0, 20)); decipher.setAuthTag(encrypted.subarray(-16));
  const plaintext = Buffer.concat([decipher.update(encrypted.subarray(20, -16)), decipher.final()]);
  try { return JSON.parse(plaintext.toString('utf8')); } finally { plaintext.fill(0); }
}

async function verifyPartial(directory) {
  await assertContained(directory, BACKUPS);
  await verifyBinaries();
  const key = await dpapi(await readFile(path.join(directory, 'key.dpapi')), true);
  try {
    const original = await readSmallEncryptedJson(path.join(directory, 'manifest-checkpoint-0.json.aesgcm'), key);
    requireSafe(original.projectRef === PROJECT && original.complete === false, 'unexpected_partial_manifest');
    const filename = path.join(directory, 'database-full.dump.aesgcm.partial');
    await assertContained(filename, directory);
    const integrity = await verifyEncrypted(filename, key);
    const archive = await archiveReadback(filename, key);
    requireSafe(archive.authDataPresent && archive.storageMetadataPresent && archive.migrationLedgerPresent, 'recovered_archive_missing_required_schema');
    const fullReadback = await archiveReadback(filename, key, true);
    const receipt = { name: 'database-full.dump', ...integrity, archive, ...fullReadback, authenticatedReadback: true, recoveredAfterReaderFailure: true, originalProducerExitNotRetained: true };
    await saveManifest(directory, receipt, key, 'artifact-recovered-database-full.dump');
    report({ mode: 'offline-partial-verification', passed: true, ...archive, ciphertextBytes: integrity.ciphertextBytes, fullArchiveSqlReadback: true, sqlExecuted: false, backupComplete: false, productionConnected: false });
  } finally { key.fill(0); }
}

async function completePartial(directory) {
  await assertContained(directory, BACKUPS);
  await verifyBinaries();
  const key = await dpapi(await readFile(path.join(directory, 'key.dpapi')), true);
  let pg; let env; let manifest;
  try {
    manifest = await readSmallEncryptedJson(path.join(directory, 'manifest-checkpoint-0.json.aesgcm'), key);
    requireSafe(manifest.projectRef === PROJECT && manifest.complete === false, 'unexpected_partial_manifest');
    const recovered = await readSmallEncryptedJson(path.join(directory, 'artifact-recovered-database-full.dump.json.aesgcm'), key);
    requireSafe(recovered.name === 'database-full.dump' && recovered.fullArchiveSqlReadback === true && recovered.sqlExecuted === false && recovered.archive.authDataPresent && recovered.archive.storageMetadataPresent && recovered.archive.migrationLedgerPresent, 'missing_offline_recovery_proof');
    const originalFilename = path.join(directory, 'database-full.dump.aesgcm.partial');
    await assertContained(originalFilename, directory);
    await verifyEncrypted(originalFilename, key, recovered);
    // Preserve the original artifact and failure manifest exactly. The explicit
    // filename tells a future reader that .partial now has authenticated proof.
    manifest.artifacts = [{ ...recovered, file: 'database-full.dump.aesgcm.partial' }];
    manifest.resumedAt = new Date().toISOString();
    manifest.originalReaderFailurePreserved = true;
    await saveManifest(directory, manifest, key, 'manifest-resume-checkpoint-0');
    pg = await credentials(); env = pgEnvironment(pg, directory);
    manifest.resumeConnection = await connectivity(env);
    // Only the two missing exports. No call to the full-database pg_dump exists
    // in this resume path; all files use exclusive-create and cannot overwrite.
    manifest.artifacts.push(await exportArtifact(directory, 'roles.sql', path.join(BIN, 'pg_dumpall.exe'), ['--no-password', '--role=postgres', '--roles-only', '--no-role-passwords'], env, key));
    await saveManifest(directory, manifest, key, 'manifest-resume-checkpoint-1');
    manifest.artifacts.push(await exportArtifact(directory, 'migration-ledger.dump', path.join(BIN, 'pg_dump.exe'), ['--no-password', '--role=postgres', '--format=custom', '--schema=supabase_migrations', '--lock-wait-timeout=10s'], env, key));
    manifest.complete = true; manifest.finishedAt = new Date().toISOString();
    await saveManifest(directory, manifest, key, 'manifest');
    report({ mode: 'encrypted-logical-export-resumed', complete: true, fullDatabaseReexported: false, restoreTested: false, storageObjectBytesIncluded: false, artifacts: manifest.artifacts.length, directory });
  } catch (error) {
    if (manifest) {
      manifest.complete = false;
      manifest.failure = error instanceof SafeFailure ? error.message : 'operation_failed_no_raw_details';
      await saveManifest(directory, manifest, key, `manifest-resume-failed-${randomUUID()}`).catch(() => {});
    }
    throw error;
  } finally { key.fill(0); if (pg) pg.PGPASSWORD = ''; if (env) env.PGPASSWORD = ''; }
}

async function selfTest() {
  const literal = PG_NAMES.map((name) => `export ${name}='${({ PGHOST: 'aws-0-test.pooler.supabase.com', PGPORT: '5432', PGUSER: `cli_login_postgres.${PROJECT}`, PGDATABASE: 'postgres', PGPASSWORD: 'synthetic-not-a-secret' })[name]}'`).join('\n');
  assert.equal(parsePgEnvironment(literal).PGPORT, '5432');
  assert.throws(() => parsePgEnvironment(literal.replace("'synthetic-not-a-secret'", '"$(dangerous)"')));
  assert.throws(() => parsePgEnvironment(`${literal}\nexport PGPASSWORD='duplicate'`));
  assert.throws(() => parsePgEnvironment(literal.replace(PROJECT, 'wrong-project')));
  const directory = path.join(BACKUPS, `synthetic-${randomUUID()}`);
  await makePrivateDirectory(directory);
  const key = randomBytes(32);
  try {
    const wrapped = await dpapi(key);
    const unwrapped = await dpapi(wrapped, true);
    assert.ok(unwrapped.equals(key)); unwrapped.fill(0);
    const filename = path.join(directory, 'synthetic.aesgcm');
    const metadata = await encryptStream(Readable.from([Buffer.from('SYNTHETIC ONLY: no production data.\n')]), filename, key);
    await verifyEncrypted(`${filename}.partial`, key, metadata);
    await rename(`${filename}.partial`, filename);
    const wrongKey = randomBytes(32);
    await assert.rejects(verifyEncrypted(filename, wrongKey, metadata)); wrongKey.fill(0);
    await writeFile(path.join(directory, 'synthetic-key.dpapi'), wrapped, { flag: 'wx', mode: 0o600 });
    report({ mode: 'synthetic-self-test', passed: true, productionDataExported: false, directory });
  } finally { key.fill(0); }
}

async function main() {
  requireSafe(process.platform === 'win32', 'windows_dpapi_required');
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && args[0] === '--self-test')) return selfTest();
  if (args.length === 2 && args[0] === '--verify-partial') return verifyPartial(path.resolve(args[1]));
  if (args.length === 4 && args[0] === '--complete-partial' && args[2] === '--confirm-project' && args[3] === PROJECT) return completePartial(path.resolve(args[1]));
  const checkOnly = args.length === 1 && args[0] === '--check';
  const exporting = args.length === 3 && args[0] === '--export' && args[1] === '--confirm-project' && args[2] === PROJECT;
  requireSafe(checkOnly || exporting, 'invalid_arguments');
  await verifyBinaries();
  const directory = path.join(BACKUPS, `${checkOnly ? 'check' : 'database'}-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`);
  await makePrivateDirectory(directory);
  const pg = await credentials();
  const env = pgEnvironment(pg, directory);
  let key;
  let manifest;
  let checkpoint = 0;
  try {
    const connection = await connectivity(env);
    if (checkOnly) return report({ mode: 'read-only-connectivity', passed: true, ...connection, productionDataExported: false });
    key = randomBytes(32);
    await writeFile(path.join(directory, 'key.dpapi'), await dpapi(key), { flag: 'wx', mode: 0o600, flush: true });
    const diskKey = await dpapi(await readFile(path.join(directory, 'key.dpapi')), true);
    requireSafe(diskKey.equals(key), 'persisted_key_roundtrip_failed');
    key.fill(0); key = diskKey;
    manifest = {
      version: 1, projectRef: PROJECT, startedAt: new Date().toISOString(), connection,
      complete: false, restoreTested: false, storageObjectBytesIncluded: false,
      databaseRolePasswordsIncluded: false, platformConfigurationIncluded: false,
      encryption: 'AES-256-GCM; SBBAK001 + 12-byte IV + ciphertext + 16-byte tag; header authenticated as AAD',
      keyProtection: 'Windows DPAPI CurrentUser; same-user/machine dependency, no off-machine escrow',
      caveats: [
        'Supabase-managed extensions and encryption root keys require a separately reviewed isolated recovery plan.',
        'Separate exports have separate database snapshots.',
        'Supavisor ignores startup PGOPTIONS here. Connectivity uses an explicit read-only transaction; PostgreSQL 17 pg_dump itself sets REPEATABLE READ, READ ONLY; pg_dumpall is restricted to role metadata SELECTs.',
        'backendTls describes the pooler-to-database leg, not client transport. Client TLS is independently required by verify-full with pinned CA and confirmed using internal psql conninfo.',
      ],
      artifacts: [],
    };
    await saveManifest(directory, manifest, key, `manifest-checkpoint-${checkpoint++}`);
    const dump = path.join(BIN, 'pg_dump.exe');
    manifest.artifacts.push(await exportArtifact(directory, 'database-full.dump', dump, ['--no-password', '--role=postgres', '--format=custom', '--compress=gzip:1', '--lock-wait-timeout=10s'], env, key));
    await saveManifest(directory, manifest, key, `manifest-checkpoint-${checkpoint++}`);
    manifest.artifacts.push(await exportArtifact(directory, 'roles.sql', path.join(BIN, 'pg_dumpall.exe'), ['--no-password', '--role=postgres', '--roles-only', '--no-role-passwords'], env, key));
    await saveManifest(directory, manifest, key, `manifest-checkpoint-${checkpoint++}`);
    manifest.artifacts.push(await exportArtifact(directory, 'migration-ledger.dump', dump, ['--no-password', '--role=postgres', '--format=custom', '--schema=supabase_migrations', '--lock-wait-timeout=10s'], env, key));
    manifest.complete = true; manifest.finishedAt = new Date().toISOString();
    await saveManifest(directory, manifest, key, 'manifest');
    report({ mode: 'encrypted-logical-export', complete: true, restoreTested: false, artifacts: manifest.artifacts.length, directory });
  } catch (error) {
    if (manifest && key) {
      manifest.complete = false;
      manifest.failure = error instanceof SafeFailure ? error.message : 'operation_failed_no_raw_details';
      await saveManifest(directory, manifest, key, `manifest-failed-${checkpoint}`).catch(() => {});
    }
    throw error;
  } finally {
    if (key) key.fill(0);
    pg.PGPASSWORD = ''; env.PGPASSWORD = '';
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => { report({ ok: false, reason: error instanceof SafeFailure ? error.message : 'operation_failed_no_raw_details' }); process.exitCode = 1; });
}

// Storage-only backup reuses local primitives, never this module's DB commands.
export { makePrivateDirectory, dpapi, encryptStream, verifyEncrypted, saveManifest };

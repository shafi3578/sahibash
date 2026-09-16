/** Storage-only read/export. Default is a synthetic, offline self-test.
 * node scripts/backup-storage-encrypted.mjs --export --confirm-project sbtzkniuquewrtctsdpy
 * No upload, delete, SQL, restore, signed-URL creation, or authentication persistence.
 */
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { makePrivateDirectory, dpapi, encryptStream, verifyEncrypted, saveManifest } from './backup-local-encrypted.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PROJECT = 'sbtzkniuquewrtctsdpy';
const ORIGIN = `https://${PROJECT}.supabase.co`;
const EXPECTED_BUCKETS = new Map([['listing-images', true], ['listing-ingest-media', false], ['payment-receipts', false]]);
const EXPECTED_OBJECTS = 705;
const EXPECTED_BYTES = 123084660;
const REQUEST_TIMEOUT = 45_000;
const RUN_TIMEOUT = 10 * 60_000;
class SafeFailure extends Error {}
const check = (condition, reason) => { if (!condition) throw new SafeFailure(reason); };
const report = (value) => process.stdout.write(`${JSON.stringify(value)}\n`);
const etag = (value) => typeof value === 'string' ? value.replace(/^W\//, '').replace(/^"|"$/g, '').toLowerCase() : '';
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function configuration(text, credentialSource = 'project-env') {
  const get = (name) => {
    const matches = [...text.matchAll(new RegExp(`^${name}=(.*)$`, 'gm'))];
    check(matches.length === 1, 'project_configuration_missing_or_duplicate');
    let value = matches[0][1].trim();
    if (value.startsWith('"')) value = JSON.parse(value);
    else if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    check(typeof value === 'string' && value.length > 0 && !/[\r\n\0]/.test(value), 'project_configuration_invalid');
    return value;
  };
  const url = new URL(get('NEXT_PUBLIC_SUPABASE_URL'));
  check(url.origin === ORIGIN && url.pathname === '/' && !url.username && !url.password && !url.search && !url.hash, 'project_origin_mismatch');
  if (credentialSource === 'linked-cli') return { url: ORIGIN, key: null };
  const key = get('SUPABASE_SERVICE_ROLE_KEY');
  check(key.length > 30, 'project_configuration_invalid');
  return { url: ORIGIN, key };
}

function cliCredential(output) {
  let rows;
  try { rows = JSON.parse(output.toString('utf8')); }
  catch { throw new SafeFailure('cli_credential_response_invalid'); }
  check(Array.isArray(rows), 'cli_credential_response_invalid');
  const matches = rows.filter((row) => row?.name === 'service_role');
  check(matches.length === 1, 'cli_existing_service_credential_unavailable');
  const key = matches[0].api_key;
  check(typeof key === 'string' && key.length > 30 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key), 'cli_existing_service_credential_unavailable');
  let header; let claims;
  try { const parts = key.split('.'); header = JSON.parse(Buffer.from(parts[0], 'base64url')); claims = JSON.parse(Buffer.from(parts[1], 'base64url')); }
  catch { throw new SafeFailure('cli_credential_metadata_invalid'); }
  // This checks binding metadata, not a locally verified JWT signature. Storage authenticates it.
  check(header.alg === 'HS256' && claims.iss === 'supabase' && claims.ref === PROJECT && claims.role === 'service_role' && Number.isSafeInteger(claims.exp) && claims.exp > Math.floor(Date.now() / 1000) + 300, 'cli_credential_metadata_invalid');
  return key;
}

async function linkedCliCredential() {
  check((await readFile(path.join(ROOT, 'supabase', '.temp', 'project-ref'), 'utf8')).trim() === PROJECT, 'linked_project_mismatch');
  const filename = path.join(ROOT, 'node_modules', '@supabase', 'cli-windows-x64', 'bin', 'supabase.exe');
  const output = await new Promise((resolve, reject) => {
    const child = execFile(filename, ['projects', 'api-keys', '--project-ref', PROJECT, '--output', 'json', '--log-level', 'error', '--workdir', ROOT], { cwd: ROOT, windowsHide: true, timeout: 30_000, maxBuffer: 256 * 1024, encoding: 'buffer', env: { ...process.env, TEMP: path.join(ROOT, '.temp'), TMP: path.join(ROOT, '.temp') } }, (error, stdout, stderr) => {
      if (Buffer.isBuffer(stderr)) stderr.fill(0);
      if (error || !Buffer.isBuffer(stdout)) { if (Buffer.isBuffer(stdout)) stdout.fill(0); reject(new SafeFailure('cli_credential_read_failed')); }
      else resolve(stdout);
    });
    child.stdin?.end();
  });
  try { return cliCredential(output); }
  finally { output.fill(0); }
}

function objectName(value) {
  check(typeof value === 'string' && value.length > 0 && !/[\u0000-\u001f\u007f?#%\\]/.test(value), 'unsafe_object_name');
  check(value.split('/').every((part) => part && part !== '.' && part !== '..'), 'unsafe_object_name');
  return value;
}

function listIdentity(bucket, row) {
  const name = objectName(row.key ?? row.name);
  const size = Number(row.metadata?.size);
  const tag = etag(row.metadata?.eTag ?? row.metadata?.etag);
  check(typeof row.id === 'string' && row.id && Number.isSafeInteger(size) && size > 0 && tag && typeof row.updated_at === 'string' && typeof row.created_at === 'string', 'incomplete_object_listing');
  return { bucket, name, id: row.id, size, etag: tag, updatedAt: row.updated_at, createdAt: row.created_at };
}

function infoIdentity(expected, row) {
  check(row && row.id === expected.id && row.name === expected.name && row.bucketId === expected.bucket, 'object_identity_changed');
  const size = Number(row.size ?? row.metadata?.size);
  const tag = etag(row.etag ?? row.eTag ?? row.metadata?.eTag ?? row.metadata?.etag);
  check(size === expected.size && tag === expected.etag, 'object_content_metadata_changed');
  check(typeof row.version === 'string' && row.version.length > 0 && typeof row.lastModified === 'string', 'object_version_metadata_missing');
  return { ...expected, version: row.version, lastModified: row.lastModified, contentType: row.contentType ?? null, cacheControl: row.cacheControl ?? null, metadata: row.metadata ?? null };
}

async function twoWorkers(items, callback, signal) {
  let next = 0;
  const results = new Array(items.length);
  let firstFailure;
  const worker = async () => {
    while (!firstFailure && next < items.length) {
      check(!signal?.aborted, 'backup_deadline_or_cancelled');
      const index = next++;
      try { results[index] = await callback(items[index], index); }
      catch (error) { firstFailure ??= error; }
    }
  };
  const settled = await Promise.allSettled([worker(), worker()]);
  if (firstFailure) throw firstFailure;
  const rejected = settled.find((result) => result.status === 'rejected');
  if (rejected) throw rejected.reason;
  return results;
}

function guardedFetch(signal, pendingDownloads, baseFetch = fetch) {
  return async (input, init = {}) => {
    const url = new URL(typeof input === 'string' ? input : input.url);
    const method = String(init.method ?? 'GET').toUpperCase();
    check(url.origin === ORIGIN && !url.username && !url.password && !url.hash, 'unexpected_request_origin');
    const bucketRequest = method === 'GET' && url.pathname === '/storage/v1/bucket';
    const infoRequest = method === 'GET' && url.pathname.startsWith('/storage/v1/object/info/');
    const listRequest = method === 'POST' && [...EXPECTED_BUCKETS.keys()].some((bucket) => url.pathname === `/storage/v1/object/list-v2/${bucket}`);
    const download = method === 'GET' ? pendingDownloads.get(url.pathname) : undefined;
    check(bucketRequest || infoRequest || listRequest || download, 'unexpected_storage_operation');
    const response = await baseFetch(input, { ...init, redirect: 'error', cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(REQUEST_TIMEOUT), ...(init.signal ? [init.signal] : [])]) });
    if (download && response.ok) {
      check(etag(response.headers.get('etag')) === download.etag, 'download_etag_mismatch');
      const length = response.headers.get('content-length');
      check(length === null || Number(length) === download.size, 'download_size_header_mismatch');
    }
    return response;
  };
}

async function buckets(client) {
  const { data, error } = await client.storage.listBuckets();
  check(!error && Array.isArray(data) && data.length === EXPECTED_BUCKETS.size, 'bucket_inventory_unavailable_or_changed');
  const result = data.map((row) => {
    check(EXPECTED_BUCKETS.has(row.id) && row.name === row.id && row.public === EXPECTED_BUCKETS.get(row.id), 'bucket_configuration_changed');
    return { id: row.id, name: row.name, public: row.public, fileSizeLimit: row.file_size_limit ?? null, allowedMimeTypes: row.allowed_mime_types ?? null };
  }).sort((a, b) => a.id.localeCompare(b.id));
  check(new Set(result.map((row) => row.id)).size === EXPECTED_BUCKETS.size, 'duplicate_bucket');
  return result;
}

async function inventory(client, signal) {
  const bucketList = await buckets(client);
  const objects = [];
  const seen = new Set();
  for (const bucket of bucketList) {
    let cursor; const cursors = new Set();
    for (let page = 0; page < 20; page++) {
      const { data, error } = await client.storage.from(bucket.id).listV2({ limit: 1000, with_delimiter: false, sortBy: { column: 'name', order: 'asc' }, ...(cursor ? { cursor } : {}) }, { signal });
      check(!error && data && Array.isArray(data.objects) && Array.isArray(data.folders) && data.folders.length === 0 && typeof data.hasNext === 'boolean', 'inventory_listing_failed');
      for (const row of data.objects) {
        const identity = listIdentity(bucket.id, row);
        const id = `${identity.bucket}\0${identity.name}`;
        check(!seen.has(id), 'duplicate_inventory_object'); seen.add(id); objects.push(identity);
      }
      check(objects.length <= EXPECTED_OBJECTS, 'inventory_count_exceeds_reviewed_bound');
      if (!data.hasNext) break;
      check(typeof data.nextCursor === 'string' && data.nextCursor && !cursors.has(data.nextCursor) && page < 19, 'invalid_inventory_cursor');
      cursor = data.nextCursor; cursors.add(cursor);
    }
  }
  objects.sort((a, b) => `${a.bucket}\0${a.name}`.localeCompare(`${b.bucket}\0${b.name}`));
  check(objects.length === EXPECTED_OBJECTS && objects.reduce((sum, row) => sum + row.size, 0) === EXPECTED_BYTES, 'inventory_differs_from_reviewed_aggregate');
  return { buckets: bucketList, objects };
}

async function detailedInventory(client, snapshot, signal) {
  return twoWorkers(snapshot.objects, async (expected) => {
    const { data, error } = await client.storage.from(expected.bucket).info(expected.name);
    check(!error && data, 'object_info_unavailable');
    return infoIdentity(expected, data);
  }, signal);
}

async function saveObject(directory, key, object, source) {
  const filename = path.join(directory, 'objects', `${object.opaqueId}.aesgcm`);
  const evidence = await encryptStream(source, filename, key);
  check(evidence.plaintextBytes === object.size, 'download_actual_size_mismatch');
  await verifyEncrypted(`${filename}.partial`, key, evidence);
  const result = { ...object, file: `objects/${object.opaqueId}.aesgcm`, ...evidence, authenticatedReadback: true };
  await saveManifest(directory, result, key, `receipt-${object.opaqueId}`);
  await rename(`${filename}.partial`, filename);
  return result;
}

async function exportStorage(credentialSource = 'project-env') {
  check(process.platform === 'win32', 'windows_dpapi_required');
  const directory = path.join(ROOT, '.temp', 'recovery-backups', `storage-${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}`);
  await makePrivateDirectory(directory); await mkdir(path.join(directory, 'objects'));
  const controller = new AbortController(); const deadline = setTimeout(() => controller.abort(), RUN_TIMEOUT);
  const pending = new Map(); let key; let manifest; let configurationValue;
  try {
    configurationValue = configuration(await readFile(path.join(ROOT, '.env.local'), 'utf8'), credentialSource);
    if (credentialSource === 'linked-cli') configurationValue.key = await linkedCliCredential();
    const client = createClient(configurationValue.url, configurationValue.key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: guardedFetch(controller.signal, pending) } });
    const start = await inventory(client, controller.signal);
    const detailed = await detailedInventory(client, start, controller.signal);
    check(digest(await inventory(client, controller.signal)) === digest(start), 'inventory_changed_during_start');
    const planned = detailed.map((object) => ({ ...object, opaqueId: randomUUID() }));
    key = randomBytes(32);
    await writeFile(path.join(directory, 'key.dpapi'), await dpapi(key), { flag: 'wx', mode: 0o600, flush: true });
    const restoredKey = await dpapi(await readFile(path.join(directory, 'key.dpapi')), true);
    check(restoredKey.equals(key), 'persisted_key_roundtrip_failed'); key.fill(0); key = restoredKey;
    manifest = { version: 1, projectRef: PROJECT, startedAt: new Date().toISOString(), complete: false, restoredToStorage: false, atomicSnapshot: false, buckets: start.buckets, expectedObjects: EXPECTED_OBJECTS, expectedBytes: EXPECTED_BYTES, planned, objects: [], limitations: ['Separate from database snapshot.', 'Local DPAPI CurrentUser key has no off-machine escrow.', 'Object versions must remain stable throughout export; no historical versions are exported.'] };
    await saveManifest(directory, manifest, key, 'inventory-start');
    report({ mode: 'storage-encrypted-export', phase: 'inventory-verified', objects: planned.length, bytes: EXPECTED_BYTES, downloadsStarted: false });
    const completed = await twoWorkers(planned, async (object) => {
      const requestPath = new URL(`${ORIGIN}/storage/v1/object/${object.bucket}/${object.name}`).pathname;
      pending.set(requestPath, object);
      try {
        const { data, error } = await client.storage.from(object.bucket).download(object.name, { cacheNonce: object.version }, { signal: controller.signal, cache: 'no-store' }).asStream();
        check(!error && data, 'object_download_failed');
        const record = await saveObject(directory, key, object, Readable.fromWeb(data));
        manifest.objects.push(record);
        if (manifest.objects.length % 100 === 0) report({ mode: 'storage-encrypted-export', phase: 'authenticated-bytes', objects: manifest.objects.length, totalObjects: planned.length });
        return record;
      } finally { pending.delete(requestPath); }
    }, controller.signal);
    const end = await inventory(client, controller.signal);
    check(digest(end) === digest(start), 'inventory_changed_during_download');
    const finalDetails = await detailedInventory(client, end, controller.signal);
    check(digest(finalDetails) === digest(detailed), 'object_version_or_metadata_changed');
    check(digest(await inventory(client, controller.signal)) === digest(start), 'inventory_changed_during_final_verification');
    check(completed.length === EXPECTED_OBJECTS && completed.reduce((sum, item) => sum + item.plaintextBytes, 0) === EXPECTED_BYTES, 'download_totals_incomplete');
    manifest.objects = completed; manifest.planned = undefined; manifest.complete = true;
    manifest.finishedAt = new Date().toISOString(); manifest.unchangedEndInventory = true; manifest.authenticatedReadbackObjects = completed.length;
    await saveManifest(directory, manifest, key, 'manifest');
    report({ mode: 'storage-encrypted-export', complete: true, objects: completed.length, plaintextBytes: EXPECTED_BYTES, restoredToStorage: false, directory });
  } catch (error) {
    controller.abort();
    if (manifest && key) { manifest.complete = false; manifest.failure = error instanceof SafeFailure ? error.message : 'operation_failed_redacted'; await saveManifest(directory, manifest, key, 'manifest-incomplete').catch(() => {}); }
    throw error;
  } finally { clearTimeout(deadline); controller.abort(); if (key) key.fill(0); if (configurationValue) configurationValue.key = ''; }
}

async function selfTest() {
  let checks = 0;
  const sample = { bucket: 'synthetic', name: 'folder/only-synthetic.bin', id: 'synthetic-id', size: 4, etag: 'abcd', updatedAt: '2026-01-01', createdAt: '2026-01-01' };
  const detail = { id: sample.id, name: sample.name, bucketId: sample.bucket, size: 4, etag: '"abcd"', version: 'v1', lastModified: '2026-01-01' };
  assert.equal(infoIdentity(sample, detail).version, 'v1'); checks++;
  assert.throws(() => infoIdentity(sample, { ...detail, version: undefined })); checks++;
  assert.throws(() => infoIdentity(sample, { ...detail, size: 5 })); checks++;
  for (const name of ['../unsafe', 'x?y', 'x#y', 'x%2fy', '/absolute']) { assert.throws(() => objectName(name)); checks++; }
  assert.throws(() => configuration('NEXT_PUBLIC_SUPABASE_URL=https://unrelated.invalid\nSUPABASE_SERVICE_ROLE_KEY=synthetic-only-configuration-key-long')); checks++;
  const syntheticKey = (claims = {}) => `${Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')}.${Buffer.from(JSON.stringify({ iss: 'supabase', ref: PROJECT, role: 'service_role', exp: Math.floor(Date.now() / 1000) + 3600, ...claims })).toString('base64url')}.synthetic_signature_not_a_real_credential`;
  const cliFixture = (key) => Buffer.from(JSON.stringify([{ name: 'service_role', api_key: key }]));
  const validSyntheticKey = syntheticKey();
  assert.equal(cliCredential(cliFixture(validSyntheticKey)), validSyntheticKey); checks++;
  for (const claims of [{ ref: 'unrelated' }, { role: 'anon' }, { exp: 1 }]) { assert.throws(() => cliCredential(cliFixture(syntheticKey(claims)))); checks++; }
  assert.throws(() => cliCredential(cliFixture(null))); checks++;
  assert.throws(() => configuration('NEXT_PUBLIC_SUPABASE_URL=https://unrelated.invalid', 'linked-cli')); checks++;
  let active = 0; let max = 0;
  await twoWorkers([1, 2, 3, 4], async () => { max = Math.max(max, ++active); await new Promise((resolve) => setTimeout(resolve, 5)); active--; });
  assert.equal(max, 2); checks++;
  const abort = new AbortController();
  let remoteCalls = 0;
  const fakeFetch = guardedFetch(abort.signal, new Map(), async () => { remoteCalls++; return new Response('{}'); });
  await assert.rejects(fakeFetch('https://unrelated.invalid/storage/v1/bucket')); checks++;
  await assert.rejects(fakeFetch(`${ORIGIN}/storage/v1/bucket`, { method: 'DELETE' })); checks++;
  assert.equal(remoteCalls, 0); checks++;
  const directory = path.join(ROOT, '.temp', 'recovery-backups', `synthetic-storage-${randomUUID()}`);
  await makePrivateDirectory(directory); await mkdir(path.join(directory, 'objects'));
  const key = randomBytes(32);
  try {
    const wrapped = await dpapi(key); const unwrapped = await dpapi(wrapped, true); assert.ok(key.equals(unwrapped)); unwrapped.fill(0); checks++;
    const record = await saveObject(directory, key, { ...sample, opaqueId: randomUUID() }, Readable.from([Buffer.from('TEST')]));
    assert.equal(record.plaintextBytes, 4); checks++;
    await assert.rejects(saveObject(directory, key, { ...sample, opaqueId: randomUUID(), size: 5 }, Readable.from([Buffer.from('TEST')]))); checks++;
    const wrong = randomBytes(32); await assert.rejects(verifyEncrypted(path.join(directory, record.file), wrong, record)); wrong.fill(0); checks++;
  } finally { key.fill(0); }
  report({ mode: 'synthetic-storage-self-test', passed: true, checks, productionConnected: false, objectsDownloaded: 0 });
}

const args = process.argv.slice(2);
const operation = args.length === 0 || (args.length === 1 && args[0] === '--self-test') ? selfTest
  : args.length === 3 && args[0] === '--export' && args[1] === '--confirm-project' && args[2] === PROJECT ? exportStorage
  : args.length === 5 && args[0] === '--export' && args[1] === '--confirm-project' && args[2] === PROJECT && args[3] === '--credential-source' && args[4] === 'linked-cli' ? () => exportStorage('linked-cli') : null;
if (!operation) { report({ ok: false, reason: 'invalid_arguments' }); process.exitCode = 1; }
else operation().catch((error) => { report({ ok: false, reason: error instanceof SafeFailure ? error.message : 'operation_failed_redacted' }); process.exitCode = 1; });

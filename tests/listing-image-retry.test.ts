import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as retryHelpers from "../lib/listings/image-retry";
import { MAX_LISTING_IMAGE_BYTES, validateListingImage } from "../lib/posting/image-validation";

// Actual action + actual validation/hash helpers, synthetic IO only. No SDK,
// environment, network, production identities, browser storage or live RLS.
const owner = "11111111-1111-4111-8111-111111111111";
const otherOwner = "22222222-2222-4222-8222-222222222222";
const listingId = "33333333-3333-4333-8333-333333333333";
const otherListing = "44444444-4444-4444-8444-444444444444";
const source = ts.createSourceFile("listings.ts", readFileSync(join(process.cwd(), "lib/actions/listings.ts"), "utf8"), ts.ScriptTarget.ES2022, true);
const actionNode = source.statements.find((node): node is ts.FunctionDeclaration => ts.isFunctionDeclaration(node) && node.name?.text === "uploadListingImageAction");
assert.ok(actionNode, "The tested production action must exist");
const actionJavascript = ts.transpileModule(`${actionNode.getText(source).replace(/^export\s+/, "")}\nuploadListingImageAction;`, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
}).outputText;

type ActionResult = { ok: boolean; message: string; statusCode?: number; imageId?: string };
type UploadAction = (listing: string, image: File, primary?: boolean, stagedId?: string) => Promise<ActionResult>;
type IoError = { code?: string; status?: number; statusCode?: string; message: string };
type ImageRow = { id: string; listing_id: string; storage_path: string; public_url: string; is_primary: boolean; sort_order: number };
const duplicate: IoError = { status: 409, statusCode: "ResourceAlreadyExists", message: "The resource already exists" };

function photo(suffix = "one") {
  return new File([new Uint8Array([0xff, 0xd8, 0xff]), suffix], "synthetic.jpg", { type: "image/jpeg" });
}

function harness() {
  const rows = new Map<string, ImageRow>();
  const objects = new Map<string, Blob>();
  const events: string[] = [];
  const state = {
    userId: owner as string | null, listingOwner: owner, profileRole: "user",
    readError: null as IoError | null, insertErrorOnce: null as IoError | null,
    uploadErrorOnce: null as IoError | null, downloadError: null as IoError | null,
    commitThenErrorOnce: false, uploadCommitThenErrorOnce: false, emptyInsertResponseOnce: false,
    beforeInsert: null as (() => Promise<void>) | null,
  };
  const client = {
    from(table: string) {
      const filters = new Map<string, unknown>();
      let inserted: Partial<ImageRow> | undefined;
      const execute = async () => {
        if (table === "listings") {
          events.push("listing:read");
          return { data: { user_id: state.listingOwner }, error: null };
        }
        if (table === "profiles") return { data: { role: state.profileRole }, error: null };
        assert.equal(table, "listing_images");
        if (inserted) {
          events.push("image:insert");
          await state.beforeInsert?.();
          if (state.insertErrorOnce) {
            const error = state.insertErrorOnce;
            state.insertErrorOnce = null;
            return { data: null, error };
          }
          const row = { ...inserted, id: inserted.id ?? randomUUID() } as ImageRow;
          if (rows.has(row.id) || [...rows.values()].some((existing) => existing.storage_path === row.storage_path)) {
            return { data: null, error: { code: "23505", message: "Synthetic unique constraint" } };
          }
          rows.set(row.id, row);
          if (state.commitThenErrorOnce) {
            state.commitThenErrorOnce = false;
            return { data: null, error: { code: "NETWORK", message: "Synthetic response lost after commit" } };
          }
          if (state.emptyInsertResponseOnce) {
            state.emptyInsertResponseOnce = false;
            return { data: null, error: null };
          }
          return { data: { id: row.id }, error: null };
        }
        events.push("image:read");
        if (state.readError) return { data: null, error: state.readError };
        assert.equal(String(filters.get("listing_id")).toLowerCase(), listingId, "Retry reads must be scoped to the authorized listing");
        const row = rows.get(String(filters.get("id")));
        return { data: row?.listing_id === String(filters.get("listing_id")).toLowerCase() ? row : null, error: null };
      };
      const query = {
        select() { return query; },
        eq(key: string, value: unknown) { filters.set(key, value); return query; },
        insert(row: Partial<ImageRow>) { inserted = row; return query; },
        single: execute,
        maybeSingle: execute,
        // Intentionally no update/upsert/delete implementation: those are forbidden.
      };
      return query;
    },
    storage: {
      from(bucket: string) {
        assert.equal(bucket, "listing-images");
        return {
          getPublicUrl(path: string) { return { data: { publicUrl: `https://synthetic.invalid/${path}` } }; },
          async upload(path: string, image: Blob, options: { upsert: boolean }) {
            events.push("storage:upload");
            assert.equal(options.upsert, false, "Retries must never overwrite an object");
            if (state.uploadErrorOnce) {
              const error = state.uploadErrorOnce;
              state.uploadErrorOnce = null;
              return { data: null, error };
            }
            if (objects.has(path)) return { data: null, error: duplicate };
            objects.set(path, image);
            if (state.uploadCommitThenErrorOnce) {
              state.uploadCommitThenErrorOnce = false;
              return { data: null, error: { status: 500, statusCode: "NETWORK", message: "Synthetic upload response lost" } };
            }
            return { data: { path }, error: null };
          },
          async download(path: string) {
            events.push("storage:download");
            return { data: state.downloadError ? null : objects.get(path) ?? null, error: state.downloadError };
          },
        };
      },
    },
  };
  const action = runInNewContext(actionJavascript, {
    ...retryHelpers, validateListingImage, crypto: { randomUUID },
    getCurrentUser: async () => state.userId ? { id: state.userId } : null,
    createSupabaseServerClient: async () => { events.push("client:create"); return client; },
    revalidatePublicMarketplaceCache: () => events.push("cache:revalidate"),
    revalidatePath: () => events.push("path:revalidate"),
    fetch: () => { throw new Error("Network is forbidden in image retry tests"); },
  }, { timeout: 5000 }) as UploadAction;
  return { action, state, rows, objects, events };
}

function count(events: string[], name: string) { return events.filter((event) => event === name).length; }

test("retry identity is bounded, namespaced and content-bound without changing its slot ID", async () => {
  for (const invalid of [null, undefined, true, {}, "", " ", "../image", "a/b", "x".repeat(129)]) {
    assert.equal(retryHelpers.isValidListingImageRetryKey(invalid), false);
  }
  assert.equal(retryHelpers.isValidListingImageRetryKey("1700000000000-1a2b"), true);
  assert.equal(retryHelpers.isValidListingImageRetryKey("x".repeat(128)), true);
  const build = (user: string, listing: string, id: string, file = photo()) => retryHelpers.buildListingImageRetryIdentity(user, listing, id, file, "jpg");
  const first = await build(owner, listingId, "staged-one");
  assert.ok(first);
  assert.match(first.imageId, /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.deepEqual(await build(owner, listingId, "staged-one"), first);
  assert.deepEqual(await build(owner.toUpperCase(), listingId.toUpperCase(), "staged-one"), first);
  for (const identity of [await build(otherOwner, listingId, "staged-one"), await build(owner, otherListing, "staged-one"), await build(owner, listingId, "staged-two")]) {
    assert.notEqual(identity?.imageId, first.imageId);
  }
  const changed = await build(owner, listingId, "staged-one", photo("two"));
  assert.equal(changed?.imageId, first.imageId);
  assert.notEqual(changed?.storagePath, first.storagePath);
  assert.match(first.storagePath, new RegExp(`^${owner}/${listingId}/${first.imageId}-[a-f0-9]{64}\\.jpg$`));
  assert.equal(await build(owner, "../listing", "staged-one"), null);
});

test("Storage collision classification does not turn permission, timeout or arbitrary 400/409 errors into success", () => {
  for (const error of [duplicate, { status: 409, statusCode: "KeyAlreadyExists", message: "exists" }, { status: 400, statusCode: "400", message: "Asset Already Exists" }]) {
    assert.equal(retryHelpers.isListingImageStorageCollision(error), true);
  }
  for (const error of [{ status: 404, statusCode: "NoSuchKey", message: "Object not found" }, { status: 404, statusCode: "404", message: "not found" }]) {
    assert.equal(retryHelpers.isListingImageStorageMissing(error), true);
  }
  for (const error of [{ status: 403, statusCode: "AccessDenied", message: "Object not found" }, { status: 500, statusCode: "NoSuchKey", message: "Object not found" }]) {
    assert.equal(retryHelpers.isListingImageStorageMissing(error), false);
  }
  for (const error of [{ status: 403, statusCode: "AccessDenied", message: "denied" }, { status: 500, statusCode: "DatabaseTimeout", message: "timeout" }, { status: 400, statusCode: "400", message: "bad input" }, { status: 409, statusCode: "409", message: "conflict" }]) {
    assert.equal(retryHelpers.isListingImageStorageCollision(error), false);
  }
});

test("committed image with lost response is returned once without another Storage upload or insert", async () => {
  const h = harness();
  h.state.commitThenErrorOnce = true;
  assert.equal((await h.action(listingId, photo(), true, "slot-one")).ok, false);
  const result = await h.action(listingId, photo(), true, "slot-one");
  assert.equal(result.ok, true);
  assert.equal(h.rows.size, 1);
  assert.equal(h.objects.size, 1);
  assert.equal(count(h.events, "storage:upload"), 1);
  assert.equal(count(h.events, "image:insert"), 1);
  assert.equal(result.imageId, [...h.rows.keys()][0]);
});

test("Storage success followed by DB failure retries using verified stored bytes", async () => {
  const h = harness();
  h.state.insertErrorOnce = { code: "57014", message: "Synthetic DB timeout" };
  assert.equal((await h.action(listingId, photo(), true, "slot-one")).ok, false);
  assert.equal(h.rows.size, 0);
  assert.equal(h.objects.size, 1);
  assert.equal((await h.action(listingId, photo(), true, "slot-one")).ok, true);
  assert.equal(count(h.events, "storage:download"), 1);
  assert.equal(h.rows.size, 1);
  assert.equal(h.objects.size, 1);
});

test("lost Storage response is not success until a subsequent retry verifies the committed bytes", async () => {
  const h = harness();
  h.state.uploadCommitThenErrorOnce = true;
  assert.equal((await h.action(listingId, photo(), true, "slot")).ok, false);
  assert.equal(h.rows.size, 0);
  assert.equal(h.objects.size, 1);
  assert.equal((await h.action(listingId, photo(), true, "slot")).ok, true);
  assert.equal(count(h.events, "storage:download"), 1);
  assert.equal(h.rows.size, 1);
});

test("partial batch retry does not duplicate an image uploaded before a later image failed", async () => {
  const h = harness();
  assert.equal((await h.action(listingId, photo("first"), true, "first")).ok, true);
  h.state.uploadErrorOnce = { status: 503, statusCode: "SlowDown", message: "Synthetic unavailable" };
  assert.equal((await h.action(listingId, photo("second"), false, "second")).ok, false);
  assert.equal((await h.action(listingId, photo("first"), true, "first")).ok, true);
  assert.equal((await h.action(listingId, photo("second"), false, "second")).ok, true);
  assert.equal(h.rows.size, 2);
  assert.equal(h.objects.size, 2);
  assert.equal(count(h.events, "image:insert"), 2);
  assert.equal(count(h.events, "storage:upload"), 3); // Includes the failed second upload.
});

test("reused staged ID with different bytes or unexpected row bindings never succeeds or overwrites", async () => {
  const h = harness();
  await h.action(listingId, photo("first"), true, "slot");
  assert.equal((await h.action(listingId, photo("other"), true, "slot")).statusCode, 409);
  const row = [...h.rows.values()][0];
  row.public_url = "https://synthetic.invalid/unexpected";
  assert.equal((await h.action(listingId, photo("first"), true, "slot")).ok, false);
  assert.equal(count(h.events, "storage:upload"), 1);
  assert.equal(h.rows.size, 1);
});

test("a claimed content-bound Storage path is insufficient without matching actual bytes", async () => {
  for (const failure of ["bytes", "download"] as const) {
    const h = harness();
    const identity = await retryHelpers.buildListingImageRetryIdentity(owner, listingId, "slot", photo("one"), "jpg");
    assert.ok(identity);
    h.objects.set(identity.storagePath, photo("two")); // Same length, different bytes.
    if (failure === "download") h.state.downloadError = { status: 403, message: "Synthetic denied" };
    assert.equal((await h.action(listingId, photo("one"), true, "slot")).ok, false);
    assert.equal(h.rows.size, 0);
    assert.equal(count(h.events, "image:insert"), 0);
    assert.equal(h.objects.size, 1); // Never delete an unverified/conflicting object.
  }
});

test("an exact database row safely restores a missing immutable object without another database insert", async () => {
  const h = harness();
  assert.equal((await h.action(listingId, photo("one"), true, "slot")).ok, true);
  const path = [...h.objects.keys()][0];
  h.objects.delete(path);
  const retried = await h.action(listingId, photo("one"), true, "slot");
  assert.equal(retried.ok, true);
  assert.equal(count(h.events, "storage:download"), 2);
  assert.equal(count(h.events, "storage:upload"), 2);
  assert.equal(count(h.events, "image:insert"), 1);
  assert.equal(h.rows.size, 1);
  assert.equal(h.objects.size, 1);
});

test("an exact database row with mismatched bytes or an unreadable object remains fail-closed", async () => {
  for (const failure of ["bytes", "denied"] as const) {
    const h = harness();
    assert.equal((await h.action(listingId, photo("one"), true, "slot")).ok, true);
    const path = [...h.objects.keys()][0];
    if (failure === "bytes") h.objects.set(path, photo("two"));
    else h.state.downloadError = { status: 403, statusCode: "AccessDenied", message: "Synthetic denied" };
    const retried = await h.action(listingId, photo("one"), true, "slot");
    assert.equal(retried.ok, false);
    assert.equal(retried.statusCode, 409);
    assert.match(retried.message, /Could not verify/);
    assert.equal(count(h.events, "storage:upload"), 1);
    assert.equal(count(h.events, "image:insert"), 1);
    assert.equal(h.rows.size, 1);
  }
});

test("authentication, ownership, invalid input and image-read RLS failures happen before Storage mutation", async () => {
  const unauthorized = harness();
  unauthorized.state.userId = null;
  assert.equal((await unauthorized.action(listingId, photo(), false, "slot")).statusCode, 401);
  assert.equal(unauthorized.events.length, 0);
  const forbidden = harness();
  forbidden.state.listingOwner = otherOwner;
  assert.equal((await forbidden.action(listingId, photo(), false, "slot")).statusCode, 403);
  assert.equal(count(forbidden.events, "image:read"), 0);
  for (const invalid of ["", "../escape", "x".repeat(129)]) {
    const h = harness();
    assert.equal((await h.action(listingId, photo(), false, invalid)).statusCode, 400);
    assert.equal(h.events.length, 0);
  }
  const invalidFile = harness();
  assert.equal((await invalidFile.action(listingId, new File([new Uint8Array(MAX_LISTING_IMAGE_BYTES + 1)], "big.jpg", { type: "image/jpeg" }), false, "slot")).ok, false);
  const denied = harness();
  denied.state.readError = { code: "42501", message: "Synthetic SELECT denied" };
  assert.equal((await denied.action(listingId, photo(), false, "slot")).ok, false);
  for (const h of [forbidden, invalidFile, denied]) assert.equal(count(h.events, "storage:upload"), 0);
});

test("Storage and INSERT RLS failures are not mistaken for duplicate success", async () => {
  const storage = harness();
  storage.state.uploadErrorOnce = { status: 403, statusCode: "AccessDenied", message: "Synthetic Storage RLS" };
  assert.equal((await storage.action(listingId, photo(), false, "slot")).ok, false);
  assert.equal(count(storage.events, "storage:download"), 0);
  assert.equal(count(storage.events, "image:insert"), 0);
  const insert = harness();
  insert.state.insertErrorOnce = { code: "42501", message: "Synthetic INSERT RLS" };
  assert.equal((await insert.action(listingId, photo(), false, "slot")).ok, false);
  assert.equal(insert.rows.size, 0);
  assert.equal(insert.objects.size, 1); // No destructive cleanup on failure.
});

test("unrelated primary-index 23505 and empty insert results never count as retry success", async () => {
  const h = harness();
  h.state.insertErrorOnce = { code: "23505", message: "Synthetic primary index collision" };
  assert.equal((await h.action(listingId, photo(), true, "slot")).ok, false);
  assert.equal(h.rows.size, 0);
  const ambiguous = harness();
  ambiguous.state.emptyInsertResponseOnce = true;
  assert.equal((await ambiguous.action(listingId, photo(), true, "slot")).ok, false);
  assert.equal((await ambiguous.action(listingId, photo(), true, "slot")).ok, true);
  assert.equal(ambiguous.rows.size, 1);
});

test("a conflicting ID attached to another listing is never accepted as this listing's retry", async () => {
  const h = harness();
  const identity = await retryHelpers.buildListingImageRetryIdentity(owner, listingId, "slot", photo(), "jpg");
  assert.ok(identity);
  h.rows.set(identity.imageId, { id: identity.imageId, listing_id: otherListing, storage_path: identity.storagePath, public_url: `https://synthetic.invalid/${identity.storagePath}`, is_primary: true, sort_order: 0 });
  assert.equal((await h.action(listingId, photo(), true, "slot")).ok, false);
  assert.equal(h.rows.size, 1);
  assert.equal(h.rows.get(identity.imageId)?.listing_id, otherListing);
});

function twoInsertBarrier() {
  let arrived = 0;
  let release!: () => void;
  const ready = new Promise<void>((resolve) => { release = resolve; });
  return async () => { if (++arrived === 2) release(); await ready; };
}

test("concurrent identical requests converge through plain INSERT conflict and exact-row verification", { timeout: 5000 }, async () => {
  const h = harness();
  h.state.beforeInsert = twoInsertBarrier();
  const results = await Promise.all([h.action(listingId, photo(), true, "slot"), h.action(listingId, photo(), true, "slot")]);
  assert.equal(results.every((result) => result.ok), true);
  assert.equal(results[0].imageId, results[1].imageId);
  assert.equal(h.rows.size, 1);
  assert.equal(h.objects.size, 1);
  assert.equal(count(h.events, "image:insert"), 2);
  assert.equal(count(h.events, "storage:download"), 2);
});

test("concurrent different payloads sharing one slot cannot both succeed or overwrite either object", { timeout: 5000 }, async () => {
  const h = harness();
  h.state.beforeInsert = twoInsertBarrier();
  const results = await Promise.all([h.action(listingId, photo("first"), true, "slot"), h.action(listingId, photo("other"), true, "slot")]);
  assert.equal(results.filter((result) => result.ok).length, 1);
  assert.equal(h.rows.size, 1);
  assert.equal(h.objects.size, 2); // Losing object's cleanup is intentionally a separate concern.
});

test("legacy callers without a staged ID retain independent random uploads", async () => {
  const h = harness();
  const first = await h.action(listingId, photo());
  const second = await h.action(listingId, photo());
  assert.equal(first.ok && second.ok, true);
  assert.notEqual(first.imageId, second.imageId);
  assert.equal(h.rows.size, 2);
  assert.equal(h.objects.size, 2);
  assert.equal(count(h.events, "image:read"), 0);
});

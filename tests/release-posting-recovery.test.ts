import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { buildMessageThreads } from "../lib/messages/threading";
import { buildQuickPublishListingId, isValidQuickPublishRequestId } from "../lib/listings/publish-retry";
import { runQuickPostPublishAttempt } from "../lib/posting/quick-publish";
import type { Message } from "../types/database";

// Execute actual production function bodies with synthetic dependencies only.
// No imports of app modules, environment files, SDK clients or browser storage.
// These are deterministic behavior tests, not React/browser or live-RLS E2E.
const quickPostPath = "components/posting/QuickPostForm.tsx";
const sourceFiles = new Map<string, ts.SourceFile>();

function functionsFromSource<T>(path: string, names: string[], dependencies: Record<string, unknown> = {}): T {
  let source = sourceFiles.get(path);
  if (!source) {
    source = ts.createSourceFile(path, readFileSync(join(process.cwd(), path), "utf8"), ts.ScriptTarget.ES2022, true, path.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    sourceFiles.set(path, source);
  }
  const declarations = new Map<string, string>();
  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.name && names.includes(node.name.text)) {
      assert.equal(declarations.has(node.name.text), false, `Ambiguous function ${node.name.text}`);
      declarations.set(node.name.text, node.getText(source).replace(/^export\s+(?:default\s+)?/, ""));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.deepEqual([...declarations.keys()].sort(), [...names].sort());
  const javascript = ts.transpileModule(`${[...declarations.values()].join("\n")}\n({ ${names.join(", ")} });`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  return runInNewContext(javascript, {
    FormData, Request, Response, TextEncoder, Error,
    fetch: () => { throw new Error("Network is forbidden in synthetic recovery tests"); },
    ...dependencies,
  }, { timeout: 1000 }) as T;
}

test("draft recovery never fabricates coordinates from missing or nonnumeric values", () => {
  const { readDraftNumber } = functionsFromSource<{ readDraftNumber: (value: unknown) => number | null }>(quickPostPath, ["readDraftNumber"]);
  for (const value of [null, undefined, "", " \t\r\n ", true, false, [], [34], {}, Number.NaN, Infinity, -Infinity, "Infinity", "not-a-number"]) {
    assert.equal(readDraftNumber(value), null, `Reject coordinate ${JSON.stringify(value)}`);
  }
  for (const [value, expected] of [[0, 0], [34.555, 34.555], [-12.5, -12.5], ["0", 0], [" 69.2075 ", 69.2075]] as const) {
    assert.equal(readDraftNumber(value), expected);
  }
});

test("recovered missing coordinates are omitted from actual publish FormData while explicit zero remains", () => {
  const { readDraftNumber } = functionsFromSource<{ readDraftNumber: (value: unknown) => number | null }>(quickPostPath, ["readDraftNumber"]);
  for (const savedCoordinate of [null, 0]) {
    const { buildPublishFormData } = functionsFromSource<{ buildPublishFormData: () => FormData }>(quickPostPath, ["appendIfPresent", "buildPublishFormData", "readDraftBoolean"], {
      draftId: "synthetic-draft", priceValueForSubmit: () => "120",
      provinceOptions: [{ id: 1, name: "Synthetic province" }], districtOptions: [{ id: 2, name: "Synthetic district" }],
      selectedProvinceId: 1, selectedDistrictId: 2, buildSuggestedQuickPostTitle: () => "Synthetic item title",
      title: "Synthetic item title", description: "A synthetic item description used only inside a local test.",
      quickKind: "second-hand", details: {}, categoryLabel: "Synthetic category", areaText: "", streetText: "",
      transaction: "sale", c: { forSale: "For sale", forRent: "For rent", forLease: "For lease" }, locale: "en",
      selectedCategory: { id: 20, category_id: 2, path: "second-hand-items/table" }, priceMode: "fixed", currency: "AFN",
      sellerContactPhone: "0000000000", sellerContactName: "Synthetic seller", locationSource: "manual",
      locationVisibility: "province_district", locationConfirmed: true, whatsappEnabled: false,
      publishRequestId: "synthetic-publish-request", latitude: readDraftNumber(savedCoordinate),
      longitude: readDraftNumber(savedCoordinate), locationAccuracy: readDraftNumber(savedCoordinate),
      isHousing: false, isDormitory: false, isCarDamageEligible: false,
    });
    const form = buildPublishFormData();
    assert.equal(form.get("draft_id"), "synthetic-draft");
    assert.equal(form.get("publish_request_id"), "synthetic-publish-request");
    for (const field of ["latitude", "longitude", "location_accuracy"]) {
      assert.equal(form.has(field), savedCoordinate !== null);
      assert.equal(form.get(field), savedCoordinate === null ? null : "0");
    }
  }
});

test("local recovery keys remain separate for synthetic accounts and guests", () => {
  const { quickDraftStorageKey } = functionsFromSource<{ quickDraftStorageKey: (owner: string) => string }>(quickPostPath, ["quickDraftStorageKey"], { QUICK_DRAFT_KEY: "synthetic-draft" });
  const keys = ["owner-a", "owner-b", "guest"].map(quickDraftStorageKey);
  assert.equal(new Set(keys).size, 3);
  assert.equal(quickDraftStorageKey("owner-a"), "synthetic-draft:owner-a");
});

test("draft actions fail closed before creating a data client when no verified user exists", async () => {
  let clients = 0;
  const actions = functionsFromSource<Record<string, (input?: unknown) => Promise<{ ok: boolean; statusCode?: number }>>>("lib/actions/drafts.ts", ["saveListingDraftAction", "getMyActiveDraftAction", "deleteMyDraftAction"], {
    getCurrentUser: async () => null,
    createSupabaseServerClient: () => { clients++; throw new Error("No client should be created"); },
  });
  for (const name of ["saveListingDraftAction", "getMyActiveDraftAction", "deleteMyDraftAction"]) {
    const result = await actions[name]({ title: "Synthetic draft" });
    assert.equal(result.ok, false);
    assert.equal(result.statusCode, 401);
  }
  assert.equal(clients, 0);
});

test("Save and Exit retains local work on failed checkpoint and navigates only after persistence", async () => {
  for (const persisted of [false, true]) {
    const events: string[] = [];
    const { saveDraftAndExit } = functionsFromSource<{ saveDraftAndExit: () => Promise<void> }>(quickPostPath, ["saveDraftAndExit"], {
      step: 2, saveCurrentDraftNow: async () => ({ persisted, draftId: persisted ? "synthetic-draft" : null }),
      persistQuickPostImages: async () => { events.push("persist-images"); }, imagesRef: { current: [] }, draftOwnerScope: "owner-a",
      c: { draftSaveFailed: "synthetic save failed" }, setError: (error: string) => events.push(`error:${error}`),
      window: { localStorage: { removeItem: (key: string) => events.push(`remove:${key}`) } },
      quickDraftKey: "synthetic:owner-a", locale: "fa", localizePath: (path: string, locale: string) => `/${locale}${path}`,
      router: { push: (path: string) => events.push(`navigate:${path}`) },
    });
    await saveDraftAndExit();
    assert.deepEqual(events, persisted ? ["persist-images", "remove:synthetic:owner-a", "navigate:/fa/dashboard"] : ["persist-images", "error:synthetic save failed"]);
  }
});

test("publish requires an awaited byte checkpoint and durable server draft before creating anything", async () => {
  for (const failure of ["bytes", "draft"] as const) {
    const events: string[] = [];
    const result = await runQuickPostPublishAttempt({
      images: [{ id: "slot", file: new File(["synthetic bytes"], "one.jpg", { type: "image/jpeg" }), isPrimary: true }],
      persistLocalImages: async () => {
        events.push("persist-bytes");
        if (failure === "bytes") throw new Error("Synthetic persistence failure");
      },
      checkpointDraft: async () => {
        events.push("checkpoint-draft");
        return { persisted: false, draftId: null };
      },
      buildFormData: () => { throw new Error("FormData must not be built"); },
      createOrReuseListing: async () => { events.push("create"); return { ok: true, message: "", listingId: "listing" }; },
      uploadImage: async () => { events.push("upload"); return { ok: true, message: "" }; },
      finalizeRecovery: async () => { events.push("finalize"); },
      persistenceErrorMessage: "Synthetic draft checkpoint failed",
    });
    assert.deepEqual(result, { ok: false, message: "Synthetic draft checkpoint failed" });
    assert.deepEqual(events, failure === "bytes" ? ["persist-bytes"] : ["persist-bytes", "checkpoint-draft"]);
  }
});

test("partial image failure, reload and retry preserve exact local bytes and converge on one listing", async () => {
  const owner = "11111111-1111-4111-8111-111111111111";
  const requestId = "stable-publish-request";
  const listingId = buildQuickPublishListingId(owner, requestId);
  assert.ok(listingId);
  const initialImages = [
    { id: "slot-first", file: new File([new Uint8Array([1, 2, 3]), "first"], "first.jpg", { type: "image/jpeg" }), isPrimary: true },
    { id: "slot-second", file: new File([new Uint8Array([4, 5, 6]), "second"], "second.jpg", { type: "image/jpeg" }), isPrimary: false },
  ];
  const byteStore = new Map<string, { bytes: Uint8Array; name: string; type: string; isPrimary: boolean }>();
  const listingIds = new Set<string>();
  const uploadedSlots = new Set<string>();
  const events: string[] = [];
  let failSecondOnce = true;

  const persist = async (images: typeof initialImages) => {
    events.push("persist");
    byteStore.clear();
    for (const image of images) {
      byteStore.set(image.id, { bytes: new Uint8Array(await image.file.arrayBuffer()), name: image.file.name, type: image.file.type, isPrimary: image.isPrimary });
    }
  };
  const attempt = (images: typeof initialImages, draftId: string) => runQuickPostPublishAttempt({
    images,
    persistLocalImages: persist,
    checkpointDraft: async () => ({ persisted: true, draftId }),
    buildFormData: (savedDraftId) => {
      const form = new FormData();
      form.set("draft_id", savedDraftId);
      form.set("publish_request_id", requestId);
      return form;
    },
    createOrReuseListing: async (form) => {
      assert.equal(form.get("publish_request_id"), requestId);
      listingIds.add(listingId);
      events.push(`create-or-reuse:${listingId}`);
      return { ok: true, message: "", listingId };
    },
    uploadImage: async (resolvedListingId, _file, _primary, slot) => {
      assert.equal(resolvedListingId, listingId);
      events.push(`upload:${slot}`);
      if (slot === "slot-second" && failSecondOnce) {
        failSecondOnce = false;
        return { ok: false, message: "Synthetic Storage unavailable" };
      }
      uploadedSlots.add(`${resolvedListingId}:${slot}`);
      return { ok: true, message: "" };
    },
    finalizeRecovery: async () => {
      events.push("finalize");
      byteStore.clear();
    },
    persistenceErrorMessage: "Synthetic draft checkpoint failed",
  });

  const first = await attempt(initialImages, "draft-one");
  assert.equal(first.ok, false);
  assert.equal(byteStore.size, 2);
  assert.equal(events.includes("finalize"), false);
  for (const image of initialImages) {
    const stored = byteStore.get(image.id);
    assert.ok(stored);
    const expected = createHash("sha256").update(new Uint8Array(await image.file.arrayBuffer())).digest("hex");
    assert.equal(createHash("sha256").update(stored.bytes).digest("hex"), expected);
  }

  const reloadedImages = [...byteStore.entries()].map(([id, stored]) => ({
    id,
    file: new File([
      stored.bytes.buffer.slice(stored.bytes.byteOffset, stored.bytes.byteOffset + stored.bytes.byteLength) as ArrayBuffer,
    ], stored.name, { type: stored.type }),
    isPrimary: stored.isPrimary,
  }));
  const second = await attempt(reloadedImages, "draft-two");
  assert.deepEqual(second, { ok: true, listingId, draftId: "draft-two" });
  assert.equal(listingIds.size, 1);
  assert.deepEqual([...uploadedSlots].sort(), [`${listingId}:slot-first`, `${listingId}:slot-second`]);
  assert.equal(byteStore.size, 0);
  assert.equal(events.filter((event) => event === "finalize").length, 1);
});

test("quick publish IDs are bounded and deterministic across draft replacement", () => {
  const owner = "11111111-1111-4111-8111-111111111111";
  for (const invalid of ["", " ", "../escape", "a/b", "x".repeat(129)]) assert.equal(isValidQuickPublishRequestId(invalid), false);
  assert.equal(isValidQuickPublishRequestId("request-one"), true);
  const first = buildQuickPublishListingId(owner, "request-one");
  assert.match(first ?? "", /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.equal(buildQuickPublishListingId(owner.toUpperCase(), "request-one"), first);
  assert.notEqual(buildQuickPublishListingId(owner, "request-two"), first);
});

test("a replacement in-progress draft reconnects to the prior published listing by request ID", async () => {
  const requestId = "stable-publish-request";
  const listingId = "33333333-3333-4333-8333-333333333333";
  const owner = "11111111-1111-4111-8111-111111111111";
  const { getExistingQuickPublishedListingId } = functionsFromSource<{
    getExistingQuickPublishedListingId: (client: unknown, userId: string, formData: FormData) => Promise<{ listingId: string | null; error: string | null }>;
  }>("lib/actions/listings.ts", ["toFormValueText", "isQuickPostingMode", "readQuickPublishedListingId", "getExistingQuickPublishedListingId"], {
    isValidQuickPublishRequestId,
  });
  const client = {
    from(table: string) {
      assert.equal(table, "listing_drafts");
      const filters = new Map<string, unknown>();
      let contained: Record<string, unknown> | null = null;
      const query = {
        select() { return query; },
        eq(key: string, value: unknown) { filters.set(key, value); return query; },
        contains(_key: string, value: Record<string, unknown>) { contained = value; return query; },
        order() { return query; },
        limit() { return query; },
        async maybeSingle() {
          if (filters.get("id") === "draft-two") {
            return { data: { status: "in_progress", details: { publishRequestId: requestId } }, error: null };
          }
          assert.equal(filters.get("user_id"), owner);
          assert.equal(filters.get("posting_type"), "quick");
          assert.equal(filters.get("status"), "published");
          assert.equal(contained?.publishRequestId, requestId);
          return { data: { details: { publishRequestId: requestId, published_listing_id: listingId } }, error: null };
        },
      };
      return query;
    },
  };
  const form = new FormData();
  form.set("posting_mode", "quick");
  form.set("draft_id", "draft-two");
  form.set("publish_request_id", requestId);
  const resolved = await getExistingQuickPublishedListingId(client, owner, form);
  assert.equal(resolved.listingId, listingId);
  assert.equal(resolved.error, null);
});

function recoveryRoute(save: (payload: Record<string, unknown>) => Promise<{ ok: boolean; statusCode?: number }>) {
  return functionsFromSource<{ POST: (request: Request) => Promise<Response> }>("app/api/posting/draft/route.ts", ["objectValue", "POST"], {
    MAX_RECOVERY_BYTES: 60_000, saveListingDraftAction: save,
    NextResponse: { json: (body: unknown, init: ResponseInit = {}) => new Response(JSON.stringify(body), { ...init, headers: { "content-type": "application/json" } }) },
  }).POST;
}

test("recovery POST executes byte limits and malformed/empty handling without saving anything", async () => {
  let saves = 0;
  const post = recoveryRoute(async () => { saves++; return { ok: true }; });
  for (const [body, expectedStatus] of [["", 413], ["{", 400], ["[]", 200], ["{}", 200], [JSON.stringify({ description: "د".repeat(30_000) }), 413]] as const) {
    const response = await post(new Request("http://synthetic.invalid/api/posting/draft", { method: "POST", body }));
    assert.equal(response.status, expectedStatus);
  }
  assert.equal(saves, 0);
});

test("recovery POST carries synthetic locale/category/location snapshots and propagates auth failure", async () => {
  for (const authorized of [false, true]) {
    const saved: Record<string, unknown>[] = [];
    const post = recoveryRoute(async (payload) => { saved.push(payload); return authorized ? { ok: true } : { ok: false, statusCode: 401 }; });
    const recovery = { title: "Synthetic recovery", selectedRootSlug: "second-hand-items", selectedCategory: { id: 20, path: "second-hand-items/table" }, language: "ps", photos: Array.from({ length: 20 }, (_, id) => ({ name: `synthetic-${id}.jpg` })), location: { provinceId: 1, districtId: 2, latitude: null, longitude: null }, publishRequestId: "synthetic-request" };
    const response = await post(new Request("http://synthetic.invalid/api/posting/draft", { method: "POST", body: JSON.stringify(recovery) }));
    assert.equal(response.status, authorized ? 200 : 401);
    assert.equal(saved.length, 1);
    assert.equal(saved[0].postingType, "quick");
    assert.equal(saved[0].language, "ps");
    assert.equal((saved[0].photos as unknown[]).length, 15);
    assert.equal((saved[0].details as Record<string, unknown>).publishRequestId, "synthetic-request");
    assert.equal((saved[0].location as Record<string, unknown>).latitude, null);
    assert.equal((saved[0].category as Record<string, unknown>).categoryNodeId, 20);
  }
});

test("message thread computation excludes unrelated users and never marks synthetic messages read", () => {
  const message = (id: string, sender: string, recipient: string, listing: string, status: "sent" | "read"): Message => ({ id, sender_user_id: sender, recipient_user_id: recipient, listing_id: listing, status, body: "Synthetic message", created_at: "2026-01-01T00:00:00.000Z", read_at: null } as Message);
  const messages = [message("incoming", "seller", "viewer", "listing-a", "sent"), message("outgoing", "viewer", "seller", "listing-a", "sent"), message("read", "seller", "viewer", "listing-b", "read"), message("unrelated", "other-a", "other-b", "listing-a", "sent")];
  const before = structuredClone(messages);
  const threads = buildMessageThreads(messages, "viewer");
  assert.equal(threads.length, 2);
  assert.equal(threads.flatMap((thread) => thread.messages).some((entry) => entry.id === "unrelated"), false);
  assert.equal(threads.find((thread) => thread.listingId === "listing-a")?.unreadIncomingCount, 1);
  assert.equal(threads.find((thread) => thread.listingId === "listing-b")?.unreadIncomingCount, 0);
  assert.deepEqual(messages, before);
});

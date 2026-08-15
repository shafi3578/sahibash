import test from "node:test";
import assert from "node:assert/strict";
import { getLeafById } from "../data/electronics-categories";
import { resolveElectronicsLeafId } from "../lib/posting/electronics-dynamic";

test("resolves database slug aliases to the matching electronics leaf", () => {
  assert.equal(getLeafById("tvs")?.id, "tv");
  assert.equal(getLeafById("gaming-consoles")?.id, "game-consoles");
  assert.equal(getLeafById("networking-equipment")?.id, "network-equipment");
  assert.equal(getLeafById("solar-power-equipment")?.id, "solar-power");
  assert.equal(getLeafById("phone-accessories")?.id, "mobile-accessories");
  assert.equal(getLeafById("mobile-phones")?.id, "mobile-phones");
});

test("resolveElectronicsLeafId uses the same aliases for posting flow", () => {
  assert.equal(resolveElectronicsLeafId("tvs"), "tv");
  assert.equal(resolveElectronicsLeafId("gaming-consoles"), "game-consoles");
  assert.equal(resolveElectronicsLeafId("networking-equipment"), "network-equipment");
});

test("resolveElectronicsLeafId resolves slug-like dynamic leaf ids", () => {
  assert.equal(resolveElectronicsLeafId(null, "gaming-consoles"), "game-consoles");
  assert.equal(resolveElectronicsLeafId(null, "tvs"), "tv");
  assert.equal(resolveElectronicsLeafId(null, "phone-accessories"), "mobile-accessories");
});

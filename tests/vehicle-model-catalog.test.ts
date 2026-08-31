import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import {
  defaultVehicleDamageParts,
  getNonOriginalVehicleDamageParts,
  normalizeVehicleDamageParts,
  shouldShowVehicleDamageDiagram,
  VEHICLE_DAMAGE_CONDITIONS,
} from "../lib/vehicles/damage-report";

const bodyDiagram = readFileSync(join(process.cwd(), "components", "vehicles", "VehicleBodyDiagram.tsx"), "utf8");
const buyerCard = readFileSync(join(process.cwd(), "components", "vehicles", "VehicleDamageCard.tsx"), "utf8");
const listingDetail = readFileSync(join(process.cwd(), "app", "listings", "[id]", "page.tsx"), "utf8");
const packageJson = readFileSync(join(process.cwd(), "package.json"), "utf8");
const exactBodyReference = readFileSync(join(process.cwd(), "public", "vehicle-body-reference.svg"), "utf8");

test("normalizes all professional seller body states and rejects unknown input", () => {
  const normalized = normalizeVehicleDamageParts([
    { key: "hood", label: "Attacker-controlled label", condition: "painted" },
    { key: "hood", condition: "changed" },
    { key: "roof", condition: "repaired" },
    { key: "unknown_panel", condition: "painted" },
    { key: "front_left_door", condition: "damaged" },
  ]);

  assert.deepEqual(normalized, [
    { key: "hood", label: "Hood", condition: "painted" },
    { key: "roof", label: "Roof", condition: "repaired" },
    { key: "front_left_door", label: "Front-left door", condition: "damaged" },
  ]);
  assert.equal(defaultVehicleDamageParts().length, 13);
  assert.deepEqual(
    VEHICLE_DAMAGE_CONDITIONS.map((condition) => condition.value),
    ["original", "local_painted", "painted", "repaired", "changed", "damaged"],
  );
});

test("shows the seller body-condition diagram only for applicable vehicle branches", () => {
  assert.equal(shouldShowVehicleDamageDiagram("vehicles", "cars"), true);
  assert.equal(shouldShowVehicleDamageDiagram("vehicles", "pickup"), true);
  assert.equal(shouldShowVehicleDamageDiagram("vehicles", "parts"), false);
  assert.equal(shouldShowVehicleDamageDiagram("vehicles", "bicycles"), false);
  assert.equal(shouldShowVehicleDamageDiagram("real-estate", "cars"), false);
});

test("buyer report uses the same responsive professional 2D body model as the seller", () => {
  for (const marker of ["viewBox=\"0 0 404 433\"", "role=\"img\"", "aria-label", "aria-pressed", "onKeyDown", "vehicle-body-reference.svg", "maskType", "feDropShadow", "data-vehicle-panel", "front_left_door", "rear_right_fender"]) {
    assert.match(bodyDiagram, new RegExp(marker));
  }
  assert.match(exactBodyReference, /viewBox="0 0 404 433"/);
  assert.match(exactBodyReference, /data:image\/jpeg;base64,/);
  assert.match(buyerCard, /VehicleBodyDiagram/);
  assert.match(listingDetail, /VehicleDamageCard/);
});

test("door and fender hit areas are edge-to-edge without overlapping touch strokes", () => {
  assert.match(bodyDiagram, /pointerEvents="fill"/);
  assert.doesNotMatch(bodyDiagram, /strokeWidth="16"/);

  for (const boundary of [
    "M31 151 L64 151",
    "M31 220 L84 232 L139 220",
    "M31 289 L84 302 L139 291",
    "M332 151 L299 151",
    "M332 220 L296 232 L242 220",
    "M332 289 L296 302 L242 291",
  ]) {
    assert.match(bodyDiagram, new RegExp(boundary));
  }
});

test("seller-reported non-original parts remain connected to the buyer 2D report", () => {
  const report = normalizeVehicleDamageParts([
    { key: "hood", condition: "local_painted" },
    { key: "roof", condition: "original" },
    { key: "front_left_door", condition: "repaired" },
    { key: "rear_bumper", condition: "changed" },
  ]);
  assert.deepEqual(getNonOriginalVehicleDamageParts(report).map((part) => [part.key, part.condition]), [
    ["hood", "local_painted"],
    ["front_left_door", "repaired"],
    ["rear_bumper", "changed"],
  ]);
});

test("buyer-facing 3D runtime and model-viewer package are removed", () => {
  assert.doesNotMatch(listingDetail, /VehicleModelViewer|selectVehicleModel3D|ENABLE_BUYER_VEHICLE_3D/);
  assert.doesNotMatch(packageJson, /@google\/model-viewer/);
});

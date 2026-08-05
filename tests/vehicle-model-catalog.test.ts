import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { selectVehicleModel3D, VEHICLE_MODELS_3D } from "../lib/vehicles/model-catalog";
import { defaultVehicleDamageParts, normalizeVehicleDamageParts, shouldShowVehicleDamageDiagram } from "../lib/vehicles/damage-report";

test("maps all six supported Toyota model families to local GLB assets", () => {
  const cases = [
    [{ make: "Toyota", model: "Corolla Fielder", year: 2005 }, "corolla-fielder-2005"],
    [{ make: "Toyota", model: "4Runner", year: 2015 }, "4runner-2015"],
    [{ make: "Toyota", model: "Land Cruiser 300", year: 2022 }, "land-cruiser-300-2022"],
    [{ make: "Toyota", model: "Auris", year: 2014 }, "auris-wagon"],
    [{ make: "Toyota", model: "Corolla", year: 1995 }, "corolla-1995"],
    [{ make: "Toyota", model: "Corolla", year: 2020 }, "corolla-2020"],
  ] as const;

  for (const [input, expected] of cases) assert.equal(selectVehicleModel3D(input)?.id, expected);
  assert.equal(VEHICLE_MODELS_3D.length, 6);
});

test("does not show an inaccurate Toyota model for unrelated vehicles", () => {
  assert.equal(selectVehicleModel3D({ make: "Honda", model: "Civic", year: 2020 }), null);
  assert.equal(selectVehicleModel3D({ make: "Toyota", model: "Hilux", year: 2020 }), null);
});

test("all configured vehicle assets are valid GLB v2 containers", () => {
  for (const model of VEHICLE_MODELS_3D) {
    const bytes = readFileSync(join(process.cwd(), "public", model.src.replace(/^\//, "")));
    assert.equal(bytes.subarray(0, 4).toString("ascii"), "glTF", model.label);
    assert.equal(bytes.readUInt32LE(4), 2, model.label);
    assert.equal(bytes.readUInt32LE(8), bytes.length, model.label);
  }
});

test("normalizes vehicle body reports and rejects unknown panels or conditions", () => {
  const normalized = normalizeVehicleDamageParts([
    { key: "hood", label: "Attacker-controlled label", condition: "painted" },
    { key: "hood", condition: "changed" },
    { key: "unknown_panel", condition: "painted" },
    { key: "roof", condition: "not-valid" },
    { key: "front_left_door", condition: "damaged" },
  ]);

  assert.deepEqual(normalized, [
    { key: "hood", label: "Hood", condition: "painted" },
    { key: "front_left_door", label: "Front-left door", condition: "damaged" },
  ]);
  assert.equal(defaultVehicleDamageParts().length, 13);
});

test("shows the seller body-condition diagram for applicable vehicle branches", () => {
  assert.equal(shouldShowVehicleDamageDiagram("vehicles", "cars"), true);
  assert.equal(shouldShowVehicleDamageDiagram("vehicles", "pickup"), true);
  assert.equal(shouldShowVehicleDamageDiagram("vehicles", "parts"), false);
  assert.equal(shouldShowVehicleDamageDiagram("vehicles", "bicycles"), false);
  assert.equal(shouldShowVehicleDamageDiagram("real-estate", "cars"), false);
});

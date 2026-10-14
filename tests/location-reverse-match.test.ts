import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { matchAfghanistanLocationRows, type LocationRow } from "../lib/location/reverse-match";
import { canConfirmDetectedLocation, createLocationRequestGuard, createManualLocationSelection } from "../lib/location/posting-selection";

const provinces: LocationRow[] = [
  { id: 1, name_en: "Kabul", name_fa: "کابل", name_ps: "کابل", aliases: ["Kabul Province"] },
  { id: 2, name_en: "Herat", name_fa: "هرات", name_ps: "هرات" },
];
const districts: LocationRow[] = [
  { id: 10, province_id: 1, name_en: "Kabul City", name_fa: "شهر کابل", aliases: ["Kabul"] },
  { id: 11, province_id: 1, name_en: "Paghman", name_fa: "پغمان" },
  { id: 20, province_id: 2, name_en: "Herat City", name_fa: "شهر هرات", aliases: ["Herat"] },
];

test("reverse matching resolves multilingual Afghanistan province and district aliases", () => {
  const result = matchAfghanistanLocationRows({ provinces, districts, provinceNames: ["Kabul Province"], districtNames: ["Kabul"] });
  assert.equal(result.province?.id, 1);
  assert.equal(result.district?.id, 10);
});

test("district matching is constrained to the resolved province", () => {
  const result = matchAfghanistanLocationRows({ provinces, districts, provinceNames: ["هرات"], districtNames: ["Herat"] });
  assert.equal(result.province?.id, 2);
  assert.equal(result.district?.id, 20);
});

test("unknown locations fail closed instead of guessing a taxonomy row", () => {
  const result = matchAfghanistanLocationRows({ provinces, districts, provinceNames: ["Unknown"], districtNames: ["Unknown"] });
  assert.deepEqual(result, { province: null, district: null });
});

test("a manual province or district selection discards the previous exact device location", () => {
  const detected = {
    source: "device",
    latitude: 33.333,
    longitude: 69.917,
    accuracy: 20,
    confirmed: true,
    hint: "Detected location",
    visibility: "exact",
    title: "Unchanged draft title",
  };
  const selectingProvince = { ...detected, ...createManualLocationSelection(1, null) };
  assert.deepEqual(selectingProvince, {
    source: "manual",
    latitude: null,
    longitude: null,
    accuracy: null,
    confirmed: false,
    hint: null,
    visibility: "exact",
    title: "Unchanged draft title",
  });
  const selectingDistrict = { ...detected, ...createManualLocationSelection(1, 10) };
  assert.equal(selectingDistrict.confirmed, true);
  assert.equal(selectingDistrict.latitude, null);
  assert.equal(selectingDistrict.longitude, null);
  assert.equal(selectingDistrict.source, "manual");
  assert.equal(createManualLocationSelection(null, 10).confirmed, false);
  assert.equal(detected.latitude, 33.333, "the reset does not mutate an existing draft object");
});

test("manual selection invalidates both pending geolocation and reverse-geocoding callbacks", () => {
  const requests = createLocationRequestGuard();
  const isCurrentRequest = requests.begin();
  let selection: { source: string; latitude: number | null; longitude: number | null } = {
    source: "device", latitude: 33.333, longitude: 69.917,
  };
  const applyDelayedDetection = () => {
    if (!isCurrentRequest()) return;
    selection = { source: "device", latitude: 33.333, longitude: 69.917 };
  };
  assert.equal(isCurrentRequest(), true);
  requests.cancel();
  selection = createManualLocationSelection(1, 10);
  applyDelayedDetection();
  assert.equal(isCurrentRequest(), false);
  assert.equal(selection.source, "manual");
  assert.equal(selection.latitude, null);
  assert.equal(selection.longitude, null);
  const isNewRequest = requests.begin();
  assert.equal(isNewRequest(), true, "explicitly requesting GPS again remains supported");
  assert.equal(isCurrentRequest(), false);
  const isNewestRequest = requests.begin();
  assert.equal(isNewRequest(), false, "a newer GPS request also supersedes an older response");
  assert.equal(isNewestRequest(), true);
});

test("unmount cancellation prevents a late device callback from launching a reverse lookup", () => {
  const requests = createLocationRequestGuard();
  const isCurrentRequest = requests.begin();
  let reverseLookups = 0;
  const onDevicePosition = () => {
    if (!isCurrentRequest()) return;
    reverseLookups += 1;
  };
  requests.cancel(); // The posting form's effect cleanup runs on unmount.
  onDevicePosition();
  assert.equal(reverseLookups, 0);
  assert.equal(isCurrentRequest(), false);
});

test("detected locations cannot be confirmed before reverse lookup settles with valid coordinates and IDs", () => {
  const resolved = {
    isDetectingLocation: false,
    source: "device",
    provinceId: 1,
    districtId: 10,
    latitude: 34.55,
    longitude: 69.2,
  };
  assert.equal(canConfirmDetectedLocation(resolved), true);
  assert.equal(canConfirmDetectedLocation({ ...resolved, isDetectingLocation: true }), false, "even old complete location IDs cannot be confirmed during lookup");
  assert.equal(canConfirmDetectedLocation({ ...resolved, provinceId: null, districtId: null }), false);
  assert.equal(canConfirmDetectedLocation({ ...resolved, districtId: null }), false);
  assert.equal(canConfirmDetectedLocation({ ...resolved, latitude: null }), false);
  assert.equal(canConfirmDetectedLocation({ ...resolved, longitude: Number.NaN }), false);
  assert.equal(canConfirmDetectedLocation({ ...resolved, source: "manual" }), false);
});

test("reachable posting forms are manual-only and collect Afghanistan street context", () => {
  for (const path of [
    "components/posting/QuickPostForm.tsx",
    "app/post-ad/post-ad-form.tsx",
    "app/post-ad/electronics/post-ad-electronics-form.tsx",
    "components/posting/LocationModal.tsx",
  ]) {
    const form = readFileSync(join(process.cwd(), path), "utf8");
    assert.doesNotMatch(form, /navigator\.geolocation/);
    assert.doesNotMatch(form, /Use My Location|useCurrentLocation|detectAutomatically/);
  }

  const quickPost = readFileSync(join(process.cwd(), "components/posting/QuickPostForm.tsx"), "utf8");
  assert.match(quickPost, /Street, avenue or landmark/);
  assert.match(quickPost, /سرک، جاده یا نشانی نزدیک/);
  assert.match(quickPost, /سړک، کوڅه یا نږدې نښه/);
  assert.match(quickPost, /location_source\", locationSource/);
  assert.match(quickPost, /latitude: null/);
  assert.match(quickPost, /longitude: null/);

  const standard = readFileSync(join(process.cwd(), "app/post-ad/post-ad-form.tsx"), "utf8");
  assert.match(standard, /streetAvenueOptional/);
  assert.match(standard, /streetText/);
  assert.match(standard, /form\.set\("location_source", "manual"\)/);
  assert.doesNotMatch(standard, /form\.set\("latitude"/);
  assert.doesNotMatch(standard, /form\.set\("longitude"/);
});

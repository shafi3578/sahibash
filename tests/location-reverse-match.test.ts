import assert from "node:assert/strict";
import test from "node:test";
import { matchAfghanistanLocationRows, type LocationRow } from "../lib/location/reverse-match";

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

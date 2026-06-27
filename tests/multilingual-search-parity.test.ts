import test from "node:test";
import assert from "node:assert/strict";
import { buildSearchKeywordIndex, expandSearchVariants, normalizeSearchText } from "@/lib/search/multilingual";

type FixtureListing = {
  id: string;
  title: string;
  description: string;
};

const FIXTURES: FixtureListing[] = [
  {
    id: "listing-phone-core",
    title: "iPhone 13 phone Samsung Redmi",
    description: "Clean mobile, negotiable, exchange possible",
  },
  {
    id: "listing-fa-core",
    title: "موبایل آیفون سامسونگ ردمی",
    description: "جور آمد، مالچه هم می شود",
  },
  {
    id: "listing-ps-core",
    title: "ټیلیفون ایفون سامسنگ",
    description: "بدل او تبادله، قیمت قابل جور آمد",
  },
];

function findRelevantListingIds(query: string): string[] {
  const normalizedQuery = normalizeSearchText(query);
  const variants = Array.from(new Set([normalizedQuery, ...expandSearchVariants(normalizedQuery)]));

  return FIXTURES.filter((listing) => {
    const normalizedText = normalizeSearchText(`${listing.title} ${listing.description}`);
    const keywordIndex = buildSearchKeywordIndex(listing.title, listing.description);

    return variants.some((variant) => {
      if (!variant) return false;
      return normalizedText.includes(variant) || keywordIndex.includes(variant);
    });
  })
    .map((listing) => listing.id)
    .sort();
}

function expectEquivalentResults(groupName: string, terms: string[]) {
  const baseline = findRelevantListingIds(terms[0]);
  assert.ok(baseline.length > 0, `${groupName} baseline has no results`);

  for (const term of terms.slice(1)) {
    const next = findRelevantListingIds(term);
    assert.deepEqual(
      next,
      baseline,
      `${groupName} mismatch for term '${term}'. baseline=${JSON.stringify(baseline)} got=${JSON.stringify(next)}`
    );
  }
}

test("Phone variants return equivalent relevant listings", () => {
  expectEquivalentResults("phone", [
    "phone",
    "mobile",
    "موبایل",
    "مبایل",
    "گوشی",
    "تلیفون",
    "ټیلیفون",
  ]);
});

test("iPhone variants return equivalent relevant listings", () => {
  expectEquivalentResults("iphone", [
    "iPhone",
    "iphone",
    "i phone",
    "آیفون",
    "ایفون",
  ]);
});

test("Samsung variants return equivalent relevant listings", () => {
  expectEquivalentResults("samsung", [
    "Samsung",
    "سامسونگ",
    "سامسنگ",
  ]);
});

test("Redmi and Xiaomi variants return equivalent relevant listings", () => {
  expectEquivalentResults("redmi", [
    "Redmi",
    "ردمی",
    "ریدمی",
    "شیائومی",
  ]);
});

test("Negotiable variants return equivalent relevant listings", () => {
  expectEquivalentResults("negotiable", [
    "negotiable",
    "جور آمد",
    "جورامد",
    "قابل جور آمد",
  ]);
});

test("Exchange variants return equivalent relevant listings", () => {
  expectEquivalentResults("exchange", [
    "exchange",
    "مالچه",
    "بدل",
    "تبادله",
  ]);
});

test("Fielder variants return equivalent relevant listings", () => {
  expectEquivalentResults("fielder", [
    "fielder",
    "فیلدر",
    "فیلډر",
  ]);
});

test("Dari transliteration expands to useful Latin variants", () => {
  const variants = expandSearchVariants("فیلدر");
  assert.ok(variants.includes("fildr") || variants.includes("fielder"));
});

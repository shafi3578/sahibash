import test from "node:test";
import assert from "node:assert/strict";
import { parseSmartPostingText } from "@/lib/posting/smart-parser";

test("Detects phone category and negotiable phrase from Dari text", () => {
  const parsed = parseSmartPostingText({
    rawText: "آیفون ۱۳ پرو مکس فروشی، حافظه ۱۲۸، فیس آیدی فعال، قیمت جور آمد، موقعیت هرات",
  });

  assert.equal(parsed.categorySlug, "mobile-phones-tablets");
  assert.equal(parsed.negotiable, true);
  assert.equal(parsed.priceType, "negotiable");
});

test("Detects vehicle category from Toyota Corolla ad", () => {
  const parsed = parseSmartPostingText({
    title: "Toyota Corolla 2010",
    description: "Good condition, Kabul",
  });

  assert.equal(parsed.categorySlug, "vehicles");
  assert.equal(parsed.listingType, "for_sale");
});

test("Detects real-estate from rent intent", () => {
  const parsed = parseSmartPostingText({
    title: "House for rent",
    description: "3 rooms, Herat",
  });

  assert.equal(parsed.categorySlug, "real-estate");
});

test("Detects wanted listing intent from local wanted phrases", () => {
  const parsed = parseSmartPostingText({
    rawText: "خریدارم لپتاب دل i5 ضرورت دارم",
  });

  assert.equal(parsed.listingType, "wanted");
  assert.equal(parsed.categorySlug, "wanted-request-ads");
});

test("Detects jobs and services with Afghan terms", () => {
  const jobParsed = parseSmartPostingText({ rawText: "وظیفه کارگر با معاش خوب" });
  assert.equal(jobParsed.categorySlug, "jobs");

  const serviceParsed = parseSmartPostingText({ rawText: "خدمات ترمیم موبایل و کمپیوتر" });
  assert.equal(serviceParsed.categorySlug, "services");
});

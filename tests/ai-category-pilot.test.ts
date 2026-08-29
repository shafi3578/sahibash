import test from "node:test";
import assert from "node:assert/strict";
import { mapSignalsToCategory } from "@/lib/ai/category-mapping";

const PILOT_CASES = [
  ["Toyota Prado 2018", "Clean SUV in Kabul", "vehicles/cars/toyota/land-cruiser-prado"],
  ["پرادو ۲۰۱۶", "موتر آماده فروش", "vehicles/cars/toyota/land-cruiser-prado"],
  ["Toyota Land Cruiser 2020", "Diesel automatic", "vehicles/cars/toyota/land-cruiser"],
  ["لند کروزر فروشی", "موقعیت کابل", "vehicles/cars/toyota/land-cruiser"],
  ["Toyota Corolla 2012", "Low mileage sedan", "vehicles/cars/toyota/corolla"],
  ["کرولا ۲۰۱۰", "موتر شخصی پاک", "vehicles/cars/toyota/corolla"],
  ["Honda Civic 2019", "Automatic car", "vehicles/cars/honda/civic"],
  ["هوندا سیویک", "کم کارکرد", "vehicles/cars/honda/civic"],
  ["Hyundai Elantra 2017", "Family sedan", "vehicles/cars/hyundai/elantra"],
  ["النترا فروشی", "حالت خوب", "vehicles/cars/hyundai/elantra"],
  ["Nissan Patrol 2015", "4x4 vehicle", "vehicles/cars/nissan/patrol"],
  ["نیسان پترول", "موتر آفرود", "vehicles/cars/nissan/patrol"],
  ["Honda CG125 motorcycle", "New tires", "vehicles/motorcycles/honda-cg125-honda-125"],
  ["هوندا 125", "موتورسایکل فروشی", "vehicles/motorcycles/honda-cg125-honda-125"],
  ["Electric rickshaw", "Three wheeler for sale", "vehicles/rickshaws-three-wheelers/electric-rickshaw"],
  ["برقی رکشا", "باتری سالم", "vehicles/rickshaws-three-wheelers/electric-rickshaw"],
  ["Mountain bike", "Used bicycle", "vehicles/bicycles/mountain-bike"],
  ["بایسکل کوهی", "حالت خوب", "vehicles/bicycles/mountain-bike"],
  ["Solar panels 550W", "Photovoltaic equipment", "second-hand-items/electronics-computers/solar-power-equipment/solar-panels"],
  ["پنل سولر", "وسایل برق آفتابی", "second-hand-items/electronics-computers/solar-power-equipment/solar-panels"],
  ["Dell laptop", "Used computer notebook", "second-hand-items/electronics-computers/laptops"],
  ["لپ تاپ مستعمل", "کمپیوتر قابل حمل", "second-hand-items/electronics-computers/laptops"],
  ["Refrigerator", "Second-hand fridge", "second-hand-items/home-appliances/refrigerator"],
  ["یخچال فروشی", "سالم و پاک", "second-hand-items/home-appliances/refrigerator"],
  ["Handmade carpet", "Large rug", "second-hand-items/home-furniture-appliances/carpets-rugs"],
  ["قالین دستباف", "فروشی", "second-hand-items/home-furniture-appliances/carpets-rugs"],
  ["Men's winter jacket", "Used male clothing", "second-hand-items/clothing-personal-items/mens-clothing"],
  ["لباس مردانه", "کاپشن زمستانی", "second-hand-items/clothing-personal-items/mens-clothing"],
  ["School books", "Complete textbook set", "second-hand-items/books"],
  ["کتاب های درسی", "صنف دوازده", "second-hand-items/books"],
  ["Furnished apartment", "For rent in Kabul", "real-estate/apartments/furnished-apartment"],
  ["اپارتمان مبله", "برای کرایه", "real-estate/apartments/furnished-apartment"],
  ["Villa for sale", "Private yard", "real-estate/houses/villa"],
  ["ویلا فروشی", "حویلی بزرگ", "real-estate/houses/villa"],
  ["Agricultural land", "Farmland for sale", "real-estate/land/for-sale/agricultural-land"],
  ["زمین زراعتی", "برای فروش", "real-estate/land/for-sale/agricultural-land"],
  ["Warehouse", "Storage warehouse for rent", "real-estate/warehouses"],
  ["گدام کرایی", "نزدیک بازار", "real-estate/warehouses"],
  ["Commercial shop", "Business unit for rent", "real-estate/shops-commercial"],
  ["دکان تجارتی", "برای کرایه", "real-estate/shops-commercial"],
  ["Apartment", "Two-bedroom aprtmnt", "real-estate/apartments/apartment"],
  ["اپارتمان فروشی", "دو اتاق", "real-estate/apartments/apartment"],
  ["Apple iPad tablet", "Wi-Fi model", "mobile-phones-tablets/tablets"],
  ["تبلت سامسونگ", "حافظه 128", "mobile-phones-tablets/tablets"],
  ["Smart watch", "Fitness smartwatch", "mobile-phones-tablets/smart-watches"],
  ["ساعت هوشمند", "باتری سالم", "mobile-phones-tablets/smart-watches"],
  ["Google Pixel 8", "Android mobile", "mobile-phones-tablets/mobile-phones/google-pixel"],
  ["گوگل پیکسل", "موبایل فروشی", "mobile-phones-tablets/mobile-phones/google-pixel"],
  ["Apple iPhone 15", "Smartphone for sale", "mobile-phones-tablets/mobile-phones/apple-iphone"],
  ["Used iPhone 13", "Apple phone", "mobile-phones-tablets/mobile-phones/apple-iphone"],
  ["Samsung Galaxy S23", "Mobile phone", "mobile-phones-tablets/mobile-phones/samsung"],
  ["Galaxy A54", "Samsung mobile", "mobile-phones-tablets/mobile-phones/samsung"],
  ["Xiaomi Redmi Note", "Android phone", "mobile-phones-tablets/mobile-phones/xiaomi"],
  ["Poco X6", "Xiaomi mobile", "mobile-phones-tablets/mobile-phones/xiaomi"],
] as const;

test("54-case multilingual pilot maps every representative signal to its expected leaf", () => {
  const startedAt = performance.now();
  const results = PILOT_CASES.map(([title, description, expectedPath]) => {
    const suggestion = mapSignalsToCategory({ title, description, labels: [], specsMatch: null });
    return { expectedPath, actualPath: suggestion?.pathSlugs.join("/") ?? null };
  });
  const durationMs = performance.now() - startedAt;

  assert.equal(results.length, 54);
  assert.deepEqual(results.filter((result) => result.actualPath !== result.expectedPath), []);
  assert.equal(results.filter((result) => !result.actualPath).length, 0);
  assert.ok(durationMs < 1_000, `deterministic pilot took ${durationMs.toFixed(1)}ms`);
});

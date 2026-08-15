export type CatalogLocale = "en" | "fa" | "ps";

export type CatalogLabel = Record<CatalogLocale, string>;

export type CatalogOption = {
  value: string;
  label: CatalogLabel;
};

export type CatalogField = {
  key: string;
  label: CatalogLabel;
  type: "text" | "number" | "date" | "select" | "multiselect" | "textarea";
  required?: boolean;
  allowCustom?: boolean;
  options?: CatalogOption[];
  dependsOn?: string;
  min?: number;
  max?: number;
};

export type CatalogCard = {
  key: string;
  label: CatalogLabel;
};

export type CatalogRow = {
  key: string;
  label: CatalogLabel;
};

export type ElectronicsLeafKey =
  | "electronics_mobile_phones"
  | "electronics_tablets"
  | "electronics_smart_watches"
  | "electronics_laptops"
  | "electronics_desktop_computers"
  | "electronics_sim_cards_numbers"
  | "electronics_mobile_repair_services"
  | "electronics_computer_parts"
  | "electronics_other_group"
  | "electronics_monitors"
  | "electronics_tvs"
  | "electronics_game_consoles"
  | "electronics_cameras"
  | "electronics_audio_equipment"
  | "electronics_network_equipment"
  | "electronics_printers_scanners"
  | "electronics_projectors"
  | "electronics_storage_devices"
  | "electronics_solar_power"
  | "electronics_mobile_accessories"
  | "electronics_computer_accessories"
  | "electronics_other_electronics";

export type ElectronicsLeafConfig = {
  kind: ElectronicsLeafKey;
  title: CatalogLabel;
  emptyMaintenance: CatalogLabel;
  maintenanceTitle: CatalogLabel;
  featureTitle: CatalogLabel;
  fields: CatalogField[];
  topCards: CatalogCard[];
  rows: CatalogRow[];
  featureOptions: CatalogOption[];
  makeModels: Record<string, string[]>;
};

const L = (en: string, fa: string, ps: string): CatalogLabel => ({ en, fa, ps });
const O = (value: string, fa?: string, ps?: string): CatalogOption => ({
  value,
  label: L(value, fa ?? value, ps ?? value),
});

function withOther(options: CatalogOption[]) {
  const hasOther = options.some((option) => option.value.toLowerCase() === "other");
  if (hasOther) return options;
  return [...options, O("Other", "دیگر", "نور")];
}

const CONDITION_OPTIONS = withOther([
  O("New", "نو", "نوی"),
  O("Used", "کارکرده", "کارول شوی"),
  O("Needs Repair", "نیاز به ترمیم", "ترمیم ته اړتیا لري"),
]);

const COLOR_OPTIONS = withOther([
  O("Black", "سیاه", "تور"),
  O("White", "سفید", "سپین"),
  O("Silver", "نقریی", "سپین زر"),
  O("Gray", "خاکستری", "خړ"),
  O("Blue", "آبی", "آبي"),
  O("Gold", "طلایی", "طلایي"),
  O("Red", "سرخ", "سور"),
  O("Green", "سبز", "شنه"),
  O("Purple", "بنفش", "ارغواني"),
]);

const AFGHAN_PROVINCE_OPTIONS = [
  "Kabul", "Herat", "Balkh", "Kandahar", "Nangarhar", "Kunduz", "Badakhshan", "Baghlan", "Bamyan",
  "Daykundi", "Farah", "Faryab", "Ghazni", "Ghor", "Helmand", "Jawzjan", "Khost", "Kapisa", "Laghman",
  "Logar", "Maidan Wardak", "Nimroz", "Nuristan", "Paktia", "Paktika", "Panjshir", "Parwan", "Samangan",
  "Sar-e Pol", "Takhar", "Uruzgan", "Zabul", "Badghis", "Kunar",
].map((province) => O(province));

const BOOLEAN_YES_NO = withOther([
  O("Yes", "بلی", "هو"),
  O("No", "نخیر", "نه"),
]);

const PHONE_BRAND_MODELS: Record<string, string[]> = {
  Apple: [
    "iPhone 6", "iPhone 6s", "iPhone 7", "iPhone 7 Plus", "iPhone 8", "iPhone 8 Plus", "iPhone X", "iPhone XR", "iPhone XS", "iPhone XS Max",
    "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max", "SE 2020", "iPhone 12", "iPhone 12 Pro", "iPhone 12 Pro Max",
    "iPhone 13", "iPhone 13 Pro", "iPhone 13 Pro Max", "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro", "iPhone 14 Pro Max",
    "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro", "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro", "iPhone 16 Pro Max",
    "Other",
  ],
  Samsung: [
    "A05", "A05s", "A06", "A15", "A16", "A25", "A35", "A55", "A10", "A10s", "A20", "A30", "A50", "A51", "A52", "A70", "A71", "A72",
    "S8-S25 Ultra", "Note 8-Note 20 Ultra", "J2", "J5", "J7", "Grand Prime", "Other",
  ],
  Xiaomi: [
    "Redmi 9", "Redmi 9A", "Redmi 9C", "Redmi 10", "Redmi 10C", "Redmi 12", "Redmi 12C", "Redmi 13", "Redmi 13C", "Redmi 14C",
    "Note 8-Note 14 Pro", "Poco X3-X6 Pro", "M3-M5", "F3-F5", "C40", "C55", "C65", "Other",
  ],
  Redmi: ["Redmi 9", "Redmi 9A", "Redmi 9C", "Redmi 10", "Redmi 10C", "Redmi 12", "Redmi 12C", "Redmi 13", "Redmi 13C", "Redmi 14C", "Note 8-Note 14 Pro", "C40", "C55", "C65", "Other"],
  Poco: ["X3-X6 Pro", "M3-M5", "F3-F5", "Other"],
  Huawei: ["Y5", "Y6", "Y7", "Y9", "Y9 Prime", "P20-P40", "Mate 10", "Mate 20", "Nova 3i", "Nova 5T", "Nova 7i", "Nova 9", "Other"],
  Honor: ["8X", "9X", "X6-X9", "50", "70", "90", "Other"],
  Oppo: ["A3s", "A5s", "A12-A96", "F9-F21", "Reno 4-Reno 11", "Other"],
  Vivo: ["Y11-Y91", "V20-V29", "Other"],
  Realme: ["C11-C65", "5-11", "Narzo", "Other"],
  Infinix: ["Hot 9-Hot 40", "Note 7-Note 40", "Smart 5-8", "Zero", "Other"],
  Tecno: ["Spark 5-Spark 20", "Camon 12-Camon 30", "Pop", "Pova", "Other"],
  Itel: ["A16-A70", "S23", "Vision", "Other"],
  Nokia: ["105", "106", "110", "130", "150", "216", "3310", "C1-C21", "G10-G21", "Other"],
  OnePlus: ["OnePlus", "Other"],
  "Google Pixel": ["Google Pixel", "Other"],
  Motorola: ["Motorola", "Other"],
  Other: ["Other"],
};

const TABLET_BRAND_MODELS: Record<string, string[]> = {
  "Apple iPad": ["iPad 5-10", "Air 1-5", "Pro 11\"/12.9\"", "mini 1-6", "Other"],
  Samsung: ["Galaxy Tab A7", "A8", "A9", "S6-S9", "Other"],
  Huawei: ["MatePad", "MediaPad", "Other"],
  Lenovo: ["Lenovo Tablet", "Other"],
  "Amazon Fire": ["Amazon Fire", "Other"],
  Other: ["Other"],
};

const SMART_WATCH_BRAND_MODELS: Record<string, string[]> = {
  "Apple Watch": ["Series 3-10", "SE", "Ultra 1/2", "Other"],
  "Samsung Galaxy Watch": ["Galaxy Watch 4-7", "Other"],
  Huawei: ["Huawei Watch", "Other"],
  "Xiaomi (Mi Band)": ["Mi Band 5-9", "Other"],
  Amazfit: ["Amazfit", "Other"],
  Honor: ["Honor Watch", "Other"],
  "Ultra copies": ["Ultra Copy", "Other"],
  Other: ["Other"],
};

function baseMeta(title: CatalogLabel) {
  return {
    title,
    emptyMaintenance: L("No maintenance history available", "تاریخچه سرویس موجود نیست", "د ترمیم تاریخچه نشته"),
    maintenanceTitle: L("Maintenance History", "تاریخچه سرویس", "د ترمیم تاریخچه"),
    featureTitle: L("Features", "ویژگی ها", "ځانګړتیاوې"),
  };
}

function provinceField(required = true): CatalogField {
  return {
    key: "locationProvince",
    label: L("Location", "موقعیت", "موقعیت"),
    type: "select",
    required,
    allowCustom: true,
    options: withOther(AFGHAN_PROVINCE_OPTIONS),
  };
}

const ELECTRONICS_LEAF_CONFIGS: Record<ElectronicsLeafKey, ElectronicsLeafConfig> = {
  electronics_mobile_phones: {
    kind: "electronics_mobile_phones",
    ...baseMeta(L("Mobile Phones", "موبایل", "موبایل")),
    makeModels: PHONE_BRAND_MODELS,
    featureOptions: withOther([
      O("With Box", "قطی دارد", "بکس لري"),
      O("With Charger", "چارجر دارد", "چارجر لري"),
      O("No Scratches", "بدون داغ", "بې داغه"),
      O("Exchange Possible", "تبادله ممکن", "تبادله ممکن"),
      O("Non-Registered", "غیر رجستر", "غیر راجستر"),
      O("Registered", "رجستر شده", "راجستر شوی"),
    ]),
    topCards: [
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "storage", label: L("Storage", "حافظه", "حافظه") },
      { key: "ram", label: L("RAM", "رم", "رم") },
      { key: "batteryHealth", label: L("Battery %", "صحت بطری", "د بیټرۍ سلنه") },
    ],
    rows: [
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "model", label: L("Model", "مدل", "ماډل") },
      { key: "storage", label: L("Storage", "حافظه", "حافظه") },
      { key: "ram", label: L("RAM", "رم", "رم") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "batteryHealth", label: L("Battery Health %", "صحت بطری", "د بیټرۍ حالت") },
      { key: "color", label: L("Color", "رنگ", "رنګ") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", required: true, allowCustom: true, options: withOther(Object.keys(PHONE_BRAND_MODELS).filter((brand) => brand !== "Other").map((brand) => O(brand))) },
      { key: "model", label: L("Model", "مدل", "ماډل"), type: "select", required: true, dependsOn: "brand", allowCustom: true, options: withOther([O("Other", "دیگر", "نور")]) },
      { key: "storage", label: L("Storage", "حافظه", "حافظه"), type: "select", required: true, allowCustom: true, options: withOther(["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"].map((value) => O(value))) },
      { key: "ram", label: L("RAM", "رم", "رم"), type: "select", required: true, allowCustom: true, options: withOther(["1 GB", "2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"].map((value) => O(value))) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      { key: "batteryHealth", label: L("Battery Health %", "صحت بطری", "د بیټرۍ سلنه"), type: "number", min: 0, max: 100 },
      { key: "color", label: L("Color", "رنگ", "رنګ"), type: "select", allowCustom: true, options: COLOR_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([
        O("With Box", "قطی دارد", "بکس لري"), O("With Charger", "چارجر دارد", "چارجر لري"), O("No Scratches", "بدون داغ", "بې داغه"), O("Exchange Possible", "تبادله ممکن", "تبادله ممکن"), O("Non-Registered", "غیر رجستر", "غیر راجستر"), O("Registered", "رجستر شده", "راجستر شوی"),
      ]) },
    ],
  },
  electronics_tablets: {
    kind: "electronics_tablets",
    ...baseMeta(L("Tablets", "تبلت", "ټابلیټ")),
    makeModels: TABLET_BRAND_MODELS,
    featureOptions: withOther([O("With Box", "قطی دارد", "بکس لري"), O("With Charger", "چارجر دارد", "چارجر لري"), O("With Pen", "قلم دارد", "قلم لري"), O("With Keyboard", "کیبورد دارد", "کېبورډ لري"), O("Exchange Possible", "تبادله ممکن", "تبادله ممکن")]),
    topCards: [
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "storage", label: L("Storage", "حافظه", "حافظه") },
      { key: "ram", label: L("RAM", "رم", "رم") },
      { key: "screenSize", label: L("Screen Size", "اندازه سکرین", "د سکرین اندازه") },
    ],
    rows: [
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "model", label: L("Model", "مدل", "ماډل") },
      { key: "storage", label: L("Storage", "حافظه", "حافظه") },
      { key: "ram", label: L("RAM", "رم", "رم") },
      { key: "screenSize", label: L("Screen Size", "اندازه سکرین", "د سکرین اندازه") },
      { key: "simSupport", label: L("SIM", "سیم کارت", "سیم") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", required: true, allowCustom: true, options: withOther(Object.keys(TABLET_BRAND_MODELS).filter((brand) => brand !== "Other").map((brand) => O(brand))) },
      { key: "model", label: L("Model", "مدل", "ماډل"), type: "select", required: true, dependsOn: "brand", allowCustom: true, options: withOther([O("Other", "دیگر", "نور")]) },
      { key: "storage", label: L("Storage", "حافظه", "حافظه"), type: "select", required: true, allowCustom: true, options: withOther(["16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB"].map((value) => O(value))) },
      { key: "ram", label: L("RAM", "رم", "رم"), type: "select", required: true, allowCustom: true, options: withOther(["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB"].map((value) => O(value))) },
      { key: "screenSize", label: L("Screen Size", "اندازه سکرین", "د سکرین اندازه"), type: "select", allowCustom: true, options: withOther(["7\"", "8\"", "10\"", "11\"", "12.9\""].map((value) => O(value))) },
      { key: "simSupport", label: L("SIM", "سیم کارت", "سیم"), type: "select", required: true, allowCustom: true, options: withOther([O("Yes", "دارد", "لري"), O("WiFi Only", "فقط وای فای", "یوازې وای فای")]) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Box", "قطی دارد", "بکس لري"), O("With Charger", "چارجر دارد", "چارجر لري"), O("With Pen", "قلم دارد", "قلم لري"), O("With Keyboard", "کیبورد دارد", "کېبورډ لري"), O("Exchange Possible", "تبادله ممکن", "تبادله ممکن")]) },
    ],
  },
  electronics_smart_watches: {
    kind: "electronics_smart_watches",
    ...baseMeta(L("Smart Watches", "ساعت هوشمند", "هوښیار ساعت")),
    makeModels: SMART_WATCH_BRAND_MODELS,
    featureOptions: withOther([O("With Box", "قطی دارد", "بکس لري"), O("With Charger", "چارجر دارد", "چارجر لري"), O("Extra Strap", "بند اضافه", "اضافي بند")]),
    topCards: [
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "size", label: L("Size", "سایز", "سایز") },
      { key: "battery", label: L("Battery", "بطری", "بیټرۍ") },
    ],
    rows: [
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "model", label: L("Model", "مدل", "ماډل") },
      { key: "size", label: L("Size", "سایز", "سایز") },
      { key: "originality", label: L("Originality", "اصالت", "اصالت") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "color", label: L("Color", "رنگ", "رنګ") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", required: true, allowCustom: true, options: withOther(Object.keys(SMART_WATCH_BRAND_MODELS).filter((brand) => brand !== "Other").map((brand) => O(brand))) },
      { key: "model", label: L("Model", "مدل", "ماډل"), type: "select", required: true, dependsOn: "brand", allowCustom: true, options: withOther([O("Other", "دیگر", "نور")]) },
      { key: "size", label: L("Size", "سایز", "سایز"), type: "select", allowCustom: true, options: withOther(["38 mm", "40 mm", "41 mm", "42 mm", "44 mm", "45 mm", "46 mm", "49 mm"].map((value) => O(value))) },
      { key: "originality", label: L("Originality", "اصالت", "اصالت"), type: "select", required: true, allowCustom: true, options: withOther([O("Original", "اصلی", "اصلي"), O("Copy", "کاپی", "کاپي")]) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      { key: "color", label: L("Color", "رنگ", "رنګ"), type: "select", allowCustom: true, options: COLOR_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Box", "قطی دارد", "بکس لري"), O("With Charger", "چارجر دارد", "چارجر لري"), O("Extra Strap", "بند اضافه", "اضافي بند")]) },
    ],
  },
  electronics_laptops: {
    kind: "electronics_laptops",
    ...baseMeta(L("Laptops", "لپ تاپ", "لېپ ټاپ")),
    makeModels: {},
    featureOptions: withOther([O("With Charger", "چارجر دارد", "چارجر لري"), O("With Bag", "بکس دارد", "بکس لري"), O("New Battery", "بطری جدید", "نوې بیټرۍ"), O("Touch Screen", "تاچ سکرین", "ټچ سکرین"), O("Backlit Keyboard", "کیبورد نوری", "روښانه کېبورډ"), O("Exchange Possible", "تبادله ممکن", "تبادله ممکن")]),
    topCards: [
      { key: "processor", label: L("Processor", "پروسیسور", "پروسیسر") },
      { key: "ram", label: L("RAM", "رم", "رم") },
      { key: "storage", label: L("Storage", "حافظه", "حافظه") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
    ],
    rows: [
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "model", label: L("Model", "مدل", "ماډل") },
      { key: "processor", label: L("Processor", "پروسیسور", "پروسیسر") },
      { key: "ram", label: L("RAM", "رم", "رم") },
      { key: "storage", label: L("Storage", "حافظه", "حافظه") },
      { key: "graphics", label: L("Graphics", "گرافیک", "ګرافیک") },
      { key: "screenSize", label: L("Screen Size", "اندازه سکرین", "د سکرین اندازه") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", required: true, allowCustom: true, options: withOther(["HP", "Dell", "Lenovo", "Asus", "Acer", "Apple MacBook", "Toshiba", "MSI", "Microsoft Surface"].map((value) => O(value))) },
      { key: "model", label: L("Model", "مدل", "ماډل"), type: "text", required: true },
      { key: "processor", label: L("Processor", "پروسیسور", "پروسیسر"), type: "select", required: true, allowCustom: true, options: withOther(["Core i3", "Core i5", "Core i7", "Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M1", "Apple M2", "Apple M3", "Celeron"].map((value) => O(value))) },
      { key: "generation", label: L("Generation", "نسل", "نسل"), type: "select", allowCustom: true, options: withOther(["4th", "5th", "6th", "7th", "8th", "9th", "10th", "11th", "12th", "13th"].map((value) => O(value))) },
      { key: "ram", label: L("RAM", "رم", "رم"), type: "select", required: true, allowCustom: true, options: withOther(["4 GB", "8 GB", "16 GB", "32 GB"].map((value) => O(value))) },
      { key: "storage", label: L("Storage", "حافظه", "حافظه"), type: "select", required: true, allowCustom: true, options: withOther(["HDD 500GB", "HDD 1TB", "SSD 128GB", "SSD 256GB", "SSD 512GB", "SSD 1TB", "Both HDD + SSD"].map((value) => O(value))) },
      { key: "graphics", label: L("Graphics", "گرافیک", "ګرافیک"), type: "text" },
      { key: "screenSize", label: L("Screen Size", "اندازه سکرین", "د سکرین اندازه"), type: "select", allowCustom: true, options: withOther(["11\"", "13\"", "14\"", "15.6\"", "17\""].map((value) => O(value))) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Charger", "چارجر دارد", "چارجر لري"), O("With Bag", "بکس دارد", "بکس لري"), O("New Battery", "بطری جدید", "نوې بیټرۍ"), O("Touch Screen", "تاچ سکرین", "ټچ سکرین"), O("Backlit Keyboard", "کیبورد نوری", "روښانه کېبورډ"), O("Exchange Possible", "تبادله ممکن", "تبادله ممکن")]) },
    ],
  },
  electronics_desktop_computers: {
    kind: "electronics_desktop_computers",
    ...baseMeta(L("Desktop Computers", "کمپیوتر رومیزی", "ډیسکتاپ کمپیوټر")),
    makeModels: {},
    featureOptions: withOther([O("Keyboard and Mouse", "کیبورد و ماوس دارد", "کېبورډ او ماوس لري"), O("Built-in WiFi", "وای فای دارد", "وای فای لري"), O("DVD Drive", "DVD درایو دارد", "DVD ډرایو لري")]),
    topCards: [
      { key: "processor", label: L("Processor", "پروسیسور", "پروسیسر") },
      { key: "ram", label: L("RAM", "رم", "رم") },
      { key: "storage", label: L("Storage", "حافظه", "حافظه") },
      { key: "computerType", label: L("Type", "نوعیت", "ډول") },
    ],
    rows: [
      { key: "computerType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "processor", label: L("Processor", "پروسیسور", "پروسیسر") },
      { key: "ram", label: L("RAM", "رم", "رم") },
      { key: "storage", label: L("Storage", "حافظه", "حافظه") },
      { key: "graphicsCard", label: L("Graphics Card", "گرافیک کارت", "ګرافیک کارت") },
      { key: "monitorSize", label: L("Monitor Size", "اندازه مانیتور", "د مانېټر اندازه") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "computerType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther([O("Case Only", "کیس تنها", "یوازې کیس"), O("Full Set", "سیت مکمل", "مکمل سیټ"), O("All-in-One", "آل این وان", "آل ان ون"), O("Gaming PC", "گیمینگ", "ګیمینګ")]) },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", required: true, allowCustom: true, options: withOther(["HP", "Dell", "Lenovo", "Asus", "Custom Built"].map((value) => O(value))) },
      { key: "processor", label: L("Processor", "پروسیسور", "پروسیسر"), type: "select", required: true, allowCustom: true, options: withOther(["Core i3", "Core i5", "Core i7", "Core i9", "AMD Ryzen 3", "AMD Ryzen 5", "AMD Ryzen 7", "Apple M1", "Apple M2", "Apple M3", "Celeron"].map((value) => O(value))) },
      { key: "ram", label: L("RAM", "رم", "رم"), type: "select", required: true, allowCustom: true, options: withOther(["4 GB", "8 GB", "16 GB", "32 GB", "64 GB"].map((value) => O(value))) },
      { key: "storage", label: L("Storage", "حافظه", "حافظه"), type: "select", required: true, allowCustom: true, options: withOther(["HDD 500GB", "HDD 1TB", "SSD 128GB", "SSD 256GB", "SSD 512GB", "SSD 1TB", "Both HDD + SSD"].map((value) => O(value))) },
      { key: "graphicsCard", label: L("Graphics Card", "گرافیک کارت", "ګرافیک کارت"), type: "text" },
      { key: "monitorSize", label: L("Monitor Size", "اندازه مانیتور", "د مانېټر اندازه"), type: "select", allowCustom: true, options: withOther(["17\"", "19\"", "22\"", "24\"", "27\"", "32\""].map((value) => O(value))) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("Keyboard and Mouse", "کیبورد و ماوس دارد", "کېبورډ او ماوس لري"), O("Built-in WiFi", "وای فای دارد", "وای فای لري"), O("DVD Drive", "DVD درایو دارد", "DVD ډرایو لري")]) },
    ],
  },
  electronics_sim_cards_numbers: {
    kind: "electronics_sim_cards_numbers",
    ...baseMeta(L("SIM Cards & Numbers", "سیم کارت و نمبر", "سیم او نمبر")),
    makeModels: {},
    featureOptions: [],
    topCards: [
      { key: "network", label: L("Network", "شبکه", "شبکه") },
      { key: "number", label: L("Number", "نمبر", "نمبر") },
      { key: "simType", label: L("Type", "نوعیت", "ډول") },
      { key: "credit", label: L("Credit", "کریدت", "کریډیټ") },
    ],
    rows: [
      { key: "network", label: L("Network", "شبکه", "شبکه") },
      { key: "number", label: L("Number", "نمبر", "نمبر") },
      { key: "simType", label: L("Type", "نوعیت", "ډول") },
      { key: "registration", label: L("Registration", "راجستر", "راجستر") },
      { key: "credit", label: L("Credit", "کریدت", "کریډیټ") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "network", label: L("Network", "شبکه", "شبکه"), type: "select", required: true, allowCustom: true, options: withOther([O("Roshan", "روشن", "روشن"), O("Etisalat", "اتصالات", "اتصالات"), O("AWCC", "افغان بیسیم", "افغان بیسیم"), O("MTN", "ام تی ان", "ام ټي این"), O("Salaam", "سلام", "سلام")]) },
      { key: "number", label: L("Number", "نمبر", "نمبر"), type: "text", required: true },
      { key: "simType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther([O("Golden Number", "نمبر طلایی", "طلایي نمبر"), O("Normal", "نمبر ساده", "ساده نمبر"), O("New SIM", "سیم کارت جدید", "نوی سیم")]) },
      { key: "registration", label: L("Registration", "سند/راجستر", "راجستر"), type: "select", required: true, allowCustom: true, options: withOther([O("Transferable", "به نام خریدار قابل انتقال", "انتقالېدونکی"), O("Registered", "راجستر شده", "راجستر شوی")]) },
      { key: "credit", label: L("Credit", "کریدت", "کریډیټ"), type: "text" },
      provinceField(true),
    ],
  },
  electronics_mobile_repair_services: {
    kind: "electronics_mobile_repair_services",
    ...baseMeta(L("Mobile Repair Services", "خدمات ترمیم موبایل", "د موبایل ترمیم خدمتونه")),
    makeModels: {},
    featureOptions: withOther([O("With Warranty", "گرنتی دارد", "ګرنټي لري"), O("Home Service", "خدمات در محل", "په کور کې خدمت"), O("Original Parts", "پرزه اصلی", "اصلي پرزې")]),
    topCards: [
      { key: "serviceType", label: L("Service Type", "نوع خدمات", "د خدمت ډول") },
      { key: "experienceYears", label: L("Experience", "تجربه", "تجربه") },
      { key: "serviceArea", label: L("Service Area", "ساحه خدمات", "د خدمت ساحه") },
      { key: "warranty", label: L("Warranty", "گرنتی", "ګرنټي") },
    ],
    rows: [
      { key: "serviceType", label: L("Service Type", "نوع خدمات", "د خدمت ډول") },
      { key: "brandsCovered", label: L("Brands Covered", "برندهای تحت پوشش", "پوښل شوي برانډونه") },
      { key: "experienceYears", label: L("Experience (years)", "تجربه", "تجربه") },
      { key: "shopAddress", label: L("Shop Address", "آدرس دکان", "د دوکان پته") },
      { key: "workingHours", label: L("Working Hours", "ساعات کاری", "کاري وخت") },
      { key: "serviceArea", label: L("Service Area", "ساحه خدمات", "د خدمت ساحه") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "serviceType", label: L("Service Type", "نوع خدمات", "د خدمت ډول"), type: "multiselect", required: true, allowCustom: true, options: withOther([O("Screen Replacement", "تبدیلی سکرین", "سکرین بدلول"), O("Battery Replacement", "تبدیلی بطری", "بیټرۍ بدلول"), O("Software Repair", "ترمیم سافت ویر", "سافټویر ترمیم"), O("Flash & Unlock", "فلش و آنلاک", "فلش او انلاک"), O("Board Repair", "ترمیم برد", "بورډ ترمیم"), O("iCloud", "آی کلود", "آی کلاوډ"), O("FRP", "FRP", "FRP"), O("Charging Port", "تبدیلی سوکت چارج", "چارج پورټ بدلول")]) },
      { key: "brandsCovered", label: L("Brands Covered", "برندهای تحت پوشش", "پوښل شوي برانډونه"), type: "select", required: true, allowCustom: true, options: withOther([O("All", "همه", "ټول"), O("Apple", "اپل", "اپل"), O("Samsung", "سامسونگ", "سامسونګ")]) },
      { key: "experienceYears", label: L("Experience (years)", "تجربه", "تجربه"), type: "number", min: 0 },
      { key: "shopAddress", label: L("Shop Address", "آدرس دکان", "د دوکان پته"), type: "text", required: true },
      { key: "workingHours", label: L("Working Hours", "ساعات کاری", "کاري وخت"), type: "text" },
      { key: "serviceArea", label: L("Service Area", "ساحه خدمات", "د خدمت ساحه"), type: "text" },
      provinceField(true),
      { key: "startingFromPrice", label: L("Starting From (AFN)", "از ... افغانی شروع", "له ... افغانی پیل"), type: "text" },
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Warranty", "گرنتی دارد", "ګرنټي لري"), O("Home Service", "خدمات در محل", "په کور کې خدمت"), O("Original Parts", "پرزه اصلی", "اصلي پرزې")]) },
    ],
  },
  electronics_computer_parts: {
    kind: "electronics_computer_parts",
    ...baseMeta(L("Computer Parts", "پرزه جات کمپیوتر", "د کمپیوټر پرزې")),
    makeModels: {},
    featureOptions: withOther([O("With Warranty", "گرنتی دارد", "ګرنټي لري"), O("Tested", "تست شده", "ټسټ شوی")]),
    topCards: [
      { key: "partType", label: L("Part Type", "نوع پرزه", "د پرزې ډول") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "compatibility", label: L("Compatibility", "سازگاری", "سازګاري") },
    ],
    rows: [
      { key: "partType", label: L("Part Type", "نوع پرزه", "د پرزې ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "specs", label: L("Specs", "مشخصات", "مشخصات") },
      { key: "compatibility", label: L("Compatible With", "سازگاری", "سازګاري") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "originality", label: L("Originality", "اصالت", "اصالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "partType", label: L("Part Type", "نوع پرزه", "د پرزې ډول"), type: "select", required: true, allowCustom: true, options: withOther(["RAM", "HDD", "SSD", "CPU", "Motherboard", "GPU", "Power Supply", "Case", "Cooling", "Laptop Battery", "Laptop Charger", "Laptop Screen", "Laptop Keyboard"].map((value) => O(value))) },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "text" },
      { key: "specs", label: L("Specs", "مشخصات", "مشخصات"), type: "text", required: true },
      { key: "compatibility", label: L("Compatible With", "سازگاری", "سازګاري"), type: "text" },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      { key: "originality", label: L("Originality", "اصالت", "اصالت"), type: "select", allowCustom: true, options: withOther([O("Original", "اصلی", "اصلي"), O("Copy", "کاپی", "کاپي")]) },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Warranty", "گرنتی دارد", "ګرنټي لري"), O("Tested", "تست شده", "ټسټ شوی")]) },
    ],
  },
  electronics_other_group: {
    kind: "electronics_other_group",
    ...baseMeta(L("Other (Electronics Group)", "سایر", "نور")),
    makeModels: {},
    featureOptions: [],
    topCards: [
      { key: "itemName", label: L("Item Name", "نام جنس", "د توکي نوم") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    rows: [
      { key: "itemName", label: L("Item Name", "نام جنس", "د توکي نوم") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "itemName", label: L("Item Name", "نام جنس", "د توکي نوم"), type: "text", required: true },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
    ],
  },
  electronics_monitors: {
    kind: "electronics_monitors",
    ...baseMeta(L("Monitors", "مانیتور", "مانېټر")),
    makeModels: {},
    featureOptions: withOther([O("No Screen Marks", "بدون داغ سکرین", "بې داغه سکرین"), O("With Cable", "کیبل دارد", "کېبل لري"), O("With Stand", "پایه دارد", "سټنډ لري")]),
    topCards: [
      { key: "size", label: L("Size", "اندازه", "اندازه") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "resolution", label: L("Resolution", "ریزولوشن", "ریزولوشن") },
    ],
    rows: [
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "size", label: L("Size", "اندازه", "اندازه") },
      { key: "resolution", label: L("Resolution", "ریزولوشن", "ریزولوشن") },
      { key: "ports", label: L("Ports", "پورت", "پورټ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", required: true, allowCustom: true, options: withOther(["Samsung", "LG", "Dell", "HP", "Asus", "Acer"].map((value) => O(value))) },
      { key: "size", label: L("Size", "اندازه", "اندازه"), type: "select", required: true, allowCustom: true, options: withOther(["17\"", "19\"", "22\"", "24\"", "27\"", "32\"", "Larger"].map((value) => O(value))) },
      { key: "resolution", label: L("Resolution", "ریزولوشن", "ریزولوشن"), type: "select", allowCustom: true, options: withOther(["HD", "Full HD", "2K", "4K"].map((value) => O(value))) },
      { key: "ports", label: L("Ports", "پورت", "پورټ"), type: "multiselect", allowCustom: true, options: withOther(["HDMI", "VGA", "DisplayPort", "HDMI + VGA"].map((value) => O(value))) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("No Screen Marks", "بدون داغ سکرین", "بې داغه سکرین"), O("With Cable", "کیبل دارد", "کېبل لري"), O("With Stand", "پایه دارد", "سټنډ لري")]) },
    ],
  },
  electronics_tvs: {
    kind: "electronics_tvs",
    ...baseMeta(L("TV", "تلویزیون", "ټلویزیون")),
    makeModels: {},
    featureOptions: withOther([O("With Remote", "ریموت دارد", "ریموټ لري"), O("Wall Mount", "دیوارکوب دارد", "وال ماونټ لري"), O("With Receiver", "رسیور دارد", "رسیور لري"), O("No Screen Marks", "بدون داغ سکرین", "بې داغه سکرین")]),
    topCards: [
      { key: "size", label: L("Size", "اندازه", "اندازه") },
      { key: "tvType", label: L("Type", "سمارت/ساده", "ډول") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
    ],
    rows: [
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "size", label: L("Size", "اندازه", "اندازه") },
      { key: "tvType", label: L("Type", "نوعیت", "ډول") },
      { key: "resolution", label: L("Resolution", "ریزولوشن", "ریزولوشن") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", required: true, allowCustom: true, options: withOther(["Samsung", "LG", "Sony", "TCL", "Haier", "Changhong", "Nikai", "Star-X", "Shownic", "GLD"].map((value) => O(value))) },
      { key: "size", label: L("Size", "اندازه", "اندازه"), type: "select", required: true, allowCustom: true, options: withOther(["24\"", "32\"", "40\"", "43\"", "50\"", "55\"", "65\"", "75\""].map((value) => O(value))) },
      { key: "tvType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther([O("Smart", "سمارت", "سمارټ"), O("Android", "اندروید", "انډرایډ"), O("Simple", "ساده", "ساده")]) },
      { key: "resolution", label: L("Resolution", "ریزولوشن", "ریزولوشن"), type: "select", allowCustom: true, options: withOther(["HD", "Full HD", "4K"].map((value) => O(value))) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Remote", "ریموت دارد", "ریموټ لري"), O("Wall Mount", "دیوارکوب دارد", "وال ماونټ لري"), O("With Receiver", "رسیور دارد", "رسیور لري"), O("No Screen Marks", "بدون داغ سکرین", "بې داغه سکرین")]) },
    ],
  },
  electronics_game_consoles: {
    kind: "electronics_game_consoles",
    ...baseMeta(L("Game Consoles", "کنسول بازی", "ګیم کنسول")),
    makeModels: {},
    featureOptions: withOther([O("Games Installed", "بازی نصب شده", "نصب شوې لوبې"), O("With Box", "قطی دارد", "بکس لري"), O("All Cables", "کیبل مکمل", "بشپړ کېبل")]),
    topCards: [
      { key: "model", label: L("Model", "مدل", "ماډل") },
      { key: "storage", label: L("Storage", "حافظه", "حافظه") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "controllers", label: L("Controllers", "تعداد دسته", "د کنټرولر شمېر") },
    ],
    rows: [
      { key: "consoleType", label: L("Type", "نوعیت", "ډول") },
      { key: "model", label: L("Model", "مدل", "ماډل") },
      { key: "storage", label: L("Storage", "حافظه", "حافظه") },
      { key: "controllers", label: L("Controllers", "تعداد دسته", "کنټرولرونه") },
      { key: "jailbroken", label: L("Jailbroken", "جیلبریک", "جېل بریک") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "consoleType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther(["PlayStation", "Xbox", "Nintendo", "Handheld"].map((value) => O(value))) },
      { key: "model", label: L("Model", "مدل", "ماډل"), type: "select", required: true, allowCustom: true, options: withOther(["PS3", "PS4 Slim", "PS4 Pro", "PS5", "PS5 Slim", "Xbox 360", "Xbox One", "Series S", "Series X", "Nintendo Switch"].map((value) => O(value))) },
      { key: "storage", label: L("Storage", "حافظه", "حافظه"), type: "select", allowCustom: true, options: withOther(["500GB", "1TB", "2TB"].map((value) => O(value))) },
      { key: "controllers", label: L("Controllers", "تعداد دسته", "کنټرولرونه"), type: "select", allowCustom: true, options: withOther(["1", "2", "More"].map((value) => O(value))) },
      { key: "jailbroken", label: L("Jailbroken", "جیلبریک/کاپی خور", "جېل بریک"), type: "select", allowCustom: true, options: BOOLEAN_YES_NO },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("Games Installed", "بازی نصب شده", "نصب شوې لوبې"), O("With Box", "قطی دارد", "بکس لري"), O("All Cables", "کیبل مکمل", "بشپړ کېبل")]) },
    ],
  },
  electronics_cameras: {
    kind: "electronics_cameras",
    ...baseMeta(L("Cameras", "کمره", "کمره")),
    makeModels: {},
    featureOptions: withOther([O("With Bag", "بکس دارد", "بکس لري"), O("With Memory Card", "کارت حافظه", "میموري کارت لري"), O("With Tripod", "سه پایه", "ټرایپاډ لري"), O("Charger & Battery", "چارجر و بطری", "چارجر او بیټرۍ")]),
    topCards: [
      { key: "cameraType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "model", label: L("Model", "مدل", "ماډل") },
    ],
    rows: [
      { key: "cameraType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "model", label: L("Model", "مدل", "ماډل") },
      { key: "lens", label: L("Lens", "لنز", "لېنز") },
      { key: "cameraCount", label: L("Number of Cameras", "تعداد کمره", "د کمرې شمېر") },
      { key: "dvrNvr", label: L("DVR/NVR", "DVR/NVR", "DVR/NVR") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "cameraType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther(["DSLR", "Mirrorless", "Video Camera", "CCTV", "Drone", "Action Cam"].map((value) => O(value))) },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", required: true, allowCustom: true, options: withOther(["Canon", "Nikon", "Sony", "Hikvision", "Dahua", "DJI", "GoPro"].map((value) => O(value))) },
      { key: "model", label: L("Model", "مدل", "ماډل"), type: "text", required: true },
      { key: "lens", label: L("Lens", "لنز", "لېنز"), type: "text" },
      { key: "cameraCount", label: L("Number of Cameras", "تعداد کمره", "د کمرې شمېر"), type: "number", min: 0 },
      { key: "dvrNvr", label: L("DVR/NVR", "DVR/NVR", "DVR/NVR"), type: "select", allowCustom: true, options: BOOLEAN_YES_NO },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Bag", "بکس دارد", "بکس لري"), O("With Memory Card", "کارت حافظه", "میموري کارت لري"), O("With Tripod", "سه پایه", "ټرایپاډ لري"), O("Charger & Battery", "چارجر و بطری", "چارجر او بیټرۍ")]) },
    ],
  },
  electronics_audio_equipment: {
    kind: "electronics_audio_equipment",
    ...baseMeta(L("Audio Equipment", "تجهیزات صوتی", "غږیز تجهیزات")),
    makeModels: {},
    featureOptions: withOther([O("Bluetooth", "بلوتوث دارد", "بلوتوث لري"), O("With Remote", "ریموت دارد", "ریموټ لري"), O("All Cables", "کیبل مکمل", "بشپړ کېبل")]),
    topCards: [
      { key: "audioType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "power", label: L("Power", "قدرت", "قدرت") },
    ],
    rows: [
      { key: "audioType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "power", label: L("Power", "قدرت", "قدرت") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "audioType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther(["Speaker", "Amplifier", "Full Sound System", "Mixer", "Microphone", "Mosque Sound System", "Event Speakers"].map((value) => O(value))) },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", allowCustom: true, options: withOther(["JBL", "Sony", "Pioneer", "Yamaha", "Behringer", "Max"].map((value) => O(value))) },
      { key: "power", label: L("Power (Watts)", "قدرت", "قدرت"), type: "text" },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("Bluetooth", "بلوتوث دارد", "بلوتوث لري"), O("With Remote", "ریموت دارد", "ریموټ لري"), O("All Cables", "کیبل مکمل", "بشپړ کېبل")]) },
    ],
  },
  electronics_network_equipment: {
    kind: "electronics_network_equipment",
    ...baseMeta(L("Network Equipment", "تجهیزات شبکه", "شبکې تجهیزات")),
    makeModels: {},
    featureOptions: withOther([O("With Adapter", "آداپتر دارد", "اډاپټر لري"), O("Configured", "تنظیم شده", "تنظیم شوی")]),
    topCards: [
      { key: "networkType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "speedPorts", label: L("Speed", "سرعت", "سرعت") },
    ],
    rows: [
      { key: "networkType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "model", label: L("Model", "مدل", "ماډل") },
      { key: "speedPorts", label: L("Speed/Ports", "سرعت/پورت", "سرعت/پورټ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "networkType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther(["WiFi Router", "Modem", "Switch", "Access Point", "Antenna", "ISP Equipment", "Network Cable", "Mikrotik"].map((value) => O(value))) },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", allowCustom: true, options: withOther(["TP-Link", "Mikrotik", "Tenda", "D-Link", "Ubiquiti", "Cisco", "Huawei"].map((value) => O(value))) },
      { key: "model", label: L("Model", "مدل", "ماډل"), type: "text" },
      { key: "speedPorts", label: L("Speed/Ports", "سرعت/پورت", "سرعت/پورټ"), type: "text" },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Adapter", "آداپتر دارد", "اډاپټر لري"), O("Configured", "تنظیم شده", "تنظیم شوی")]) },
    ],
  },
  electronics_printers_scanners: {
    kind: "electronics_printers_scanners",
    ...baseMeta(L("Printers & Scanners", "پرنتر و اسکنر", "پرنټر او سکینر")),
    makeModels: {},
    featureOptions: withOther([O("With Toner/Ink", "تونر/رنگ دارد", "ټونر/رنګ لري"), O("With Cable", "کیبل دارد", "کېبل لري"), O("WiFi", "وای فای دارد", "وای فای لري")]),
    topCards: [
      { key: "printerType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "printType", label: L("Color/BW", "رنگه/سیاه", "رنګ/تور") },
    ],
    rows: [
      { key: "printerType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "model", label: L("Model", "مدل", "ماډل") },
      { key: "printType", label: L("Print", "چاپ", "چاپ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "printerType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther(["Laser Printer", "Inkjet Color", "Scanner", "All-in-One", "Photocopier"].map((value) => O(value))) },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", allowCustom: true, options: withOther(["HP", "Canon", "Epson", "Brother", "Ricoh", "Kyocera"].map((value) => O(value))) },
      { key: "model", label: L("Model", "مدل", "ماډل"), type: "text" },
      { key: "printType", label: L("Print", "چاپ", "چاپ"), type: "select", allowCustom: true, options: withOther([O("B&W", "سیاه و سفید", "تور او سپین"), O("Color", "رنگه", "رنګین")]) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Toner/Ink", "تونر/رنگ دارد", "ټونر/رنګ لري"), O("With Cable", "کیبل دارد", "کېبل لري"), O("WiFi", "وای فای دارد", "وای فای لري")]) },
    ],
  },
  electronics_projectors: {
    kind: "electronics_projectors",
    ...baseMeta(L("Projectors", "پروژکتور", "پروژکټر")),
    makeModels: {},
    featureOptions: withOther([O("With Screen", "پرده دارد", "پرده لري"), O("With Remote", "ریموت دارد", "ریموټ لري"), O("All Cables", "کیبل مکمل", "بشپړ کېبل"), O("New Lamp", "لمپ جدید", "نوی لامپ")]),
    topCards: [
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "brightness", label: L("Lumens", "روشنایی", "روښانتیا") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "resolution", label: L("Resolution", "ریزولوشن", "ریزولوشن") },
    ],
    rows: [
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "model", label: L("Model", "مدل", "ماډل") },
      { key: "brightness", label: L("Brightness", "روشنایی", "روښانتیا") },
      { key: "resolution", label: L("Resolution", "ریزولوشن", "ریزولوشن") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", required: true, allowCustom: true, options: withOther(["Epson", "BenQ", "Sony", "InFocus", "Mini Projector"].map((value) => O(value))) },
      { key: "model", label: L("Model", "مدل", "ماډل"), type: "text" },
      { key: "brightness", label: L("Brightness (Lumens)", "روشنایی", "روښانتیا"), type: "text" },
      { key: "resolution", label: L("Resolution", "ریزولوشن", "ریزولوشن"), type: "select", allowCustom: true, options: withOther(["SVGA", "XGA", "HD", "Full HD", "4K"].map((value) => O(value))) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Screen", "پرده دارد", "پرده لري"), O("With Remote", "ریموت دارد", "ریموټ لري"), O("All Cables", "کیبل مکمل", "بشپړ کېبل"), O("New Lamp", "لمپ جدید", "نوی لامپ")]) },
    ],
  },
  electronics_storage_devices: {
    kind: "electronics_storage_devices",
    ...baseMeta(L("Storage Devices", "وسایل ذخیره سازی", "د ذخیرې وسایل")),
    makeModels: {},
    featureOptions: withOther([O("Tested", "تست شده", "ټسټ شوی"), O("With Box", "قطی دارد", "بکس لري")]),
    topCards: [
      { key: "storageType", label: L("Type", "نوعیت", "ډول") },
      { key: "capacity", label: L("Capacity", "ظرفیت", "ظرفیت") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
    ],
    rows: [
      { key: "storageType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "capacity", label: L("Capacity", "ظرفیت", "ظرفیت") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "originality", label: L("Originality", "اصالت", "اصالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "storageType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther(["External HDD", "External SSD", "USB Flash", "Memory Card", "NAS"].map((value) => O(value))) },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", allowCustom: true, options: withOther(["WD", "Seagate", "Toshiba", "SanDisk", "Kingston", "Samsung"].map((value) => O(value))) },
      { key: "capacity", label: L("Capacity", "ظرفیت", "ظرفیت"), type: "select", required: true, allowCustom: true, options: withOther(["8 GB", "16 GB", "32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "2 TB", "4 TB"].map((value) => O(value))) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      { key: "originality", label: L("Originality", "اصالت", "اصالت"), type: "select", allowCustom: true, options: withOther([O("Original", "اصلی", "اصلي"), O("Copy", "کاپی", "کاپي")]) },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("Tested", "تست شده", "ټسټ شوی"), O("With Box", "قطی دارد", "بکس لري")]) },
    ],
  },
  electronics_solar_power: {
    kind: "electronics_solar_power",
    ...baseMeta(L("Solar & Power Equipment", "تجهیزات سولر و برق", "د سولر او برېښنا تجهیزات")),
    makeModels: {},
    featureOptions: withOther([O("With Warranty", "گرنتی دارد", "ګرنټي لري"), O("Free Installation", "نصب رایگان", "وړیا نصب"), O("Low Usage", "کم کارکرد", "کم کارول شوی")]),
    topCards: [
      { key: "powerType", label: L("Type", "نوعیت", "ډول") },
      { key: "powerCapacity", label: L("Power/Capacity", "قدرت/ظرفیت", "قدرت/ظرفیت") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
    ],
    rows: [
      { key: "powerType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "powerCapacity", label: L("Power/Capacity", "قدرت/ظرفیت", "قدرت/ظرفیت") },
      { key: "voltage", label: L("Voltage", "ولتاژ", "ولتاژ") },
      { key: "fuelType", label: L("Fuel Type", "نوع سوخت", "د سونګ ډول") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "powerType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther(["Solar Panel", "Inverter", "Battery", "Charge Controller", "Generator", "Stabilizer", "UPS", "Transformer", "Power Cables"].map((value) => O(value))) },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", allowCustom: true, options: withOther(["Jinko", "Longi", "JA Solar", "Canadian Solar", "Growatt", "Inverex", "Phoenix", "AGS", "Osaka", "Exide", "Narada", "Jasco", "Honda", "Perkins", "Cummins"].map((value) => O(value))) },
      { key: "powerCapacity", label: L("Power/Capacity", "قدرت/ظرفیت", "قدرت/ظرفیت"), type: "text", required: true },
      { key: "voltage", label: L("Voltage", "ولتاژ", "ولتاژ"), type: "select", allowCustom: true, options: withOther(["12V", "24V", "48V"].map((value) => O(value))) },
      { key: "fuelType", label: L("Fuel Type (Generator)", "نوع سوخت", "د سونګ ډول"), type: "select", allowCustom: true, options: withOther([O("Diesel", "دیزل", "ډیزل"), O("Petrol", "پطرول", "پټرول"), O("Gas", "گاز", "ګاز")]) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Warranty", "گرنتی دارد", "ګرنټي لري"), O("Free Installation", "نصب رایگان", "وړیا نصب"), O("Low Usage", "کم کارکرد", "کم کارول شوی")]) },
    ],
  },
  electronics_mobile_accessories: {
    kind: "electronics_mobile_accessories",
    ...baseMeta(L("Mobile Accessories", "لوازم موبایل", "د موبایل لوازم")),
    makeModels: {},
    featureOptions: withOther([O("With Box", "قطی دارد", "بکس لري")]),
    topCards: [
      { key: "accessoryType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "originality", label: L("Originality", "اصالت", "اصالت") },
    ],
    rows: [
      { key: "accessoryType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "originality", label: L("Originality", "اصالت", "اصالت") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "accessoryType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther(["AirPods/Earbuds", "Earphones", "Charger", "Power Bank", "Cover", "Screen Protector", "Cable", "Holder", "Ring Light"].map((value) => O(value))) },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", allowCustom: true, options: withOther(["Apple", "Samsung", "Anker", "Baseus", "JBL", "Xiaomi", "Joyroom"].map((value) => O(value))) },
      { key: "originality", label: L("Originality", "اصالت", "اصالت"), type: "select", required: true, allowCustom: true, options: withOther([O("Original", "اصلی", "اصلي"), O("Copy", "کاپی", "کاپي")]) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("With Box", "قطی دارد", "بکس لري")]) },
    ],
  },
  electronics_computer_accessories: {
    kind: "electronics_computer_accessories",
    ...baseMeta(L("Computer Accessories", "لوازم جانبی کمپیوتر", "د کمپیوټر لوازم")),
    makeModels: {},
    featureOptions: withOther([O("RGB", "RGB لایت دارد", "RGB لري"), O("Gaming", "گیمینگ", "ګیمینګ")]),
    topCards: [
      { key: "accessoryType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "connection", label: L("Connection", "اتصال", "اتصال") },
    ],
    rows: [
      { key: "accessoryType", label: L("Type", "نوعیت", "ډول") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "connection", label: L("Connection", "اتصال", "اتصال") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "accessoryType", label: L("Type", "نوعیت", "ډول"), type: "select", required: true, allowCustom: true, options: withOther(["Keyboard", "Mouse", "Headset", "Webcam", "Mouse Pad", "PC Speakers", "Cooling Pad", "Hub & Cables", "Laptop Bag", "Stand"].map((value) => O(value))) },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "select", allowCustom: true, options: withOther(["Logitech", "A4Tech", "Razer", "HP", "Dell"].map((value) => O(value))) },
      { key: "connection", label: L("Connection", "اتصال", "اتصال"), type: "select", required: true, allowCustom: true, options: withOther([O("Wired", "سیم دار", "تار لرونکی"), O("Wireless", "بی سیم", "بېسیم"), O("Bluetooth", "بلوتوث", "بلوتوث")]) },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
      { key: "features", label: L("Features", "ویژگی ها", "ځانګړتیاوې"), type: "multiselect", allowCustom: true, options: withOther([O("RGB", "RGB لایت دارد", "RGB لري"), O("Gaming", "گیمینگ", "ګیمینګ")]) },
    ],
  },
  electronics_other_electronics: {
    kind: "electronics_other_electronics",
    ...baseMeta(L("Other Electronics", "سایر الکترونیک", "نور الکترونیک")),
    makeModels: {},
    featureOptions: [],
    topCards: [
      { key: "itemName", label: L("Item Name", "نام جنس", "د توکي نوم") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    rows: [
      { key: "itemName", label: L("Item Name", "نام جنس", "د توکي نوم") },
      { key: "brand", label: L("Brand", "برند", "برنډ") },
      { key: "condition", label: L("Condition", "حالت", "حالت") },
      { key: "locationProvince", label: L("Location", "موقعیت", "موقعیت") },
    ],
    fields: [
      { key: "itemName", label: L("Item Name", "نام جنس", "د توکي نوم"), type: "text", required: true },
      { key: "brand", label: L("Brand", "برند", "برنډ"), type: "text" },
      { key: "condition", label: L("Condition", "حالت", "حالت"), type: "select", required: true, allowCustom: true, options: CONDITION_OPTIONS },
      provinceField(true),
    ],
  },
};

const ELECTRONICS_PATH_MATCHERS: Array<{ key: ElectronicsLeafKey; patterns: RegExp[] }> = [
  { key: "electronics_mobile_phones", patterns: [/mobile-phones/, /phones?$/] },
  { key: "electronics_tablets", patterns: [/tablets?/] },
  { key: "electronics_smart_watches", patterns: [/smart-?watches?/, /watches?/] },
  { key: "electronics_laptops", patterns: [/laptops?/] },
  { key: "electronics_desktop_computers", patterns: [/desktop-computers?/, /desktops?/] },
  { key: "electronics_sim_cards_numbers", patterns: [/sim-cards?/, /numbers?/, /sim|number/] },
  { key: "electronics_mobile_repair_services", patterns: [/mobile-repair/, /repair-services?/, /repair/] },
  { key: "electronics_computer_parts", patterns: [/computer-parts?/] },
  { key: "electronics_other_group", patterns: [/other$/, /other-in/] },
  { key: "electronics_monitors", patterns: [/monitors?/] },
  { key: "electronics_tvs", patterns: [/(^|\/)tvs?(\/|$)/, /television/] },
  { key: "electronics_game_consoles", patterns: [/gaming-consoles?/, /consoles?/] },
  { key: "electronics_cameras", patterns: [/cameras?/] },
  { key: "electronics_audio_equipment", patterns: [/audio-equipment/, /audio/] },
  { key: "electronics_network_equipment", patterns: [/networking-equipment/, /network-equipment/] },
  { key: "electronics_printers_scanners", patterns: [/printers?-scanners?/, /printer/, /scanner/] },
  { key: "electronics_projectors", patterns: [/projectors?/] },
  { key: "electronics_storage_devices", patterns: [/storage-devices?/] },
  { key: "electronics_solar_power", patterns: [/solar-power-equipment/, /solar/, /power-equipment/] },
  { key: "electronics_mobile_accessories", patterns: [/phone-accessories/, /mobile-accessories/] },
  { key: "electronics_computer_accessories", patterns: [/computer-accessories/] },
  { key: "electronics_other_electronics", patterns: [/other-electronics/] },
];

export function detectElectronicsLeafKey(path: string): ElectronicsLeafKey | null {
  const normalizedPath = String(path ?? "").toLowerCase();
  for (const candidate of ELECTRONICS_PATH_MATCHERS) {
    if (candidate.patterns.some((pattern) => pattern.test(normalizedPath))) {
      return candidate.key;
    }
  }
  return null;
}

export function getElectronicsLeafConfigByPath(path: string): ElectronicsLeafConfig | null {
  const key = detectElectronicsLeafKey(path);
  return key ? ELECTRONICS_LEAF_CONFIGS[key] : null;
}

export { ELECTRONICS_LEAF_CONFIGS };

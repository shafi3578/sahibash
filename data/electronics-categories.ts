// ============================================================
// Sahibash — Electronics Category Definitions (22 leaves)
// Single source of truth for: Post-Ad form, Detail page, Filters
// Languages: en / fa (Dari) / ps (Pashto)
// ============================================================

export type Lang = "en" | "fa" | "ps";
export type Labels = { en: string; fa: string; ps: string };

export type FieldType =
  | "select"
  | "cascading-select"
  | "multi-select"
  | "number"
  | "text"
  | "textarea";

export interface Option {
  value: string;
  labels: Labels;
}

export interface FieldDef {
  key: string;
  type: FieldType;
  labels: Labels;
  required?: boolean;
  options?: Option[];
  /** for cascading-select: options grouped by parent value */
  optionsByParent?: Record<string, Option[]>;
  dependsOn?: string;
  unit?: Labels;
  placeholder?: Labels;
  /** always append "Other" with free-text input */
  allowOther?: boolean;
  min?: number;
  max?: number;
}

export interface FeatureDef {
  key: string;
  labels: Labels;
}

export interface LeafSubcategory {
  id: string;
  slug: string;
  labels: Labels;
  /** field keys shown as the top 4 stat cards on detail page */
  topCards: string[];
  fields: FieldDef[];
  features: FeatureDef[];
}

// ============================================================
// HELPERS
// ============================================================

/** option with identical Latin label in all languages (model names etc.) */
const m = (v: string): Option => ({ value: v, labels: { en: v, fa: v, ps: v } });

/** option with translated labels */
const o = (value: string, en: string, fa: string, ps: string): Option => ({
  value,
  labels: { en, fa, ps },
});

const L = (en: string, fa: string, ps: string): Labels => ({ en, fa, ps });

const OTHER = o("other", "Other", "دیگر", "نور");

// ============================================================
// SHARED OPTION LISTS
// ============================================================

export const CONDITION_OPTIONS: Option[] = [
  o("new", "New", "نو", "نوی"),
  o("used", "Used", "کارکرده", "کارول شوی"),
  o("needs_repair", "Needs Repair", "نیاز به ترمیم", "ترمیم ته اړتیا لري"),
];

export const CONDITION_SIMPLE: Option[] = [
  o("new", "New", "نو", "نوی"),
  o("used", "Used", "کارکرده", "کارول شوی"),
];

export const COLOR_OPTIONS: Option[] = [
  o("black", "Black", "سیاه", "تور"),
  o("white", "White", "سفید", "سپین"),
  o("silver", "Silver", "نقریی", "نقره‌يي"),
  o("gray", "Gray", "خاکستری", "خړ"),
  o("blue", "Blue", "آبی", "شین"),
  o("gold", "Gold", "طلایی", "طلایي"),
  o("red", "Red", "سرخ", "سور"),
  o("green", "Green", "سبز", "زرغون"),
  o("purple", "Purple", "بنفش", "بنفش"),
  OTHER,
];

export const ORIGINALITY_OPTIONS: Option[] = [
  o("original", "Original", "اصلی", "اصلي"),
  o("copy", "Copy", "کاپی", "کاپي"),
];

export const YES_NO: Option[] = [
  o("yes", "Yes", "بلی", "هو"),
  o("no", "No", "نخیر", "نه"),
];

export const STORAGE_OPTIONS: Option[] = [
  m("16 GB"), m("32 GB"), m("64 GB"), m("128 GB"),
  m("256 GB"), m("512 GB"), m("1 TB"),
];

export const RAM_OPTIONS: Option[] = [
  m("1 GB"), m("2 GB"), m("3 GB"), m("4 GB"),
  m("6 GB"), m("8 GB"), m("12 GB"), m("16 GB"),
];

export const PROVINCES: Option[] = [
  o("kabul", "Kabul", "کابل", "کابل"),
  o("herat", "Herat", "هرات", "هرات"),
  o("kandahar", "Kandahar", "قندهار", "کندهار"),
  o("balkh", "Balkh (Mazar-i-Sharif)", "بلخ (مزار شریف)", "بلخ (مزار شریف)"),
  o("nangarhar", "Nangarhar (Jalalabad)", "ننگرهار (جلال‌آباد)", "ننګرهار (جلال‌آباد)"),
  o("kunduz", "Kunduz", "کندز", "کندز"),
  o("baghlan", "Baghlan", "بغلان", "بغلان"),
  o("parwan", "Parwan", "پروان", "پروان"),
  o("logar", "Logar", "لوگر", "لوګر"),
  o("paktia", "Paktia", "پکتیا", "پکتیا"),
  o("paktika", "Paktika", "پکتیکا", "پکتیکا"),
  o("khost", "Khost", "خوست", "خوست"),
  o("ghazni", "Ghazni", "غزنی", "غزني"),
  o("wardak", "Maidan Wardak", "میدان وردک", "میدان وردګ"),
  o("bamyan", "Bamyan", "بامیان", "بامیان"),
  o("daikundi", "Daikundi", "دایکندی", "دایکندي"),
  o("ghor", "Ghor", "غور", "غور"),
  o("badghis", "Badghis", "بادغیس", "بادغیس"),
  o("farah", "Farah", "فراه", "فراه"),
  o("nimroz", "Nimroz", "نیمروز", "نیمروز"),
  o("helmand", "Helmand", "هلمند", "هلمند"),
  o("uruzgan", "Uruzgan", "ارزگان", "ارزګان"),
  o("zabul", "Zabul", "زابل", "زابل"),
  o("jowzjan", "Jowzjan", "جوزجان", "جوزجان"),
  o("sarepul", "Sar-e Pul", "سرپل", "سرپل"),
  o("faryab", "Faryab", "فاریاب", "فاریاب"),
  o("samangan", "Samangan", "سمنگان", "سمنګان"),
  o("takhar", "Takhar", "تخار", "تخار"),
  o("badakhshan", "Badakhshan", "بدخشان", "بدخشان"),
  o("nuristan", "Nuristan", "نورستان", "نورستان"),
  o("kunar", "Kunar", "کنر", "کونړ"),
  o("laghman", "Laghman", "لغمان", "لغمان"),
  o("kapisa", "Kapisa", "کاپیسا", "کاپیسا"),
  o("panjshir", "Panjshir", "پنجشیر", "پنجشیر"),
];

// Shared field builders
const conditionField = (required = true): FieldDef => ({
  key: "condition",
  type: "select",
  labels: L("Condition", "حالت", "حالت"),
  required,
  options: CONDITION_OPTIONS,
});

const colorField: FieldDef = {
  key: "color",
  type: "select",
  labels: L("Color", "رنگ", "رنګ"),
  options: COLOR_OPTIONS,
};

const locationField: FieldDef = {
  key: "location",
  type: "select",
  labels: L("Location", "موقعیت", "ځای"),
  required: true,
  options: PROVINCES,
};

const modelTextField: FieldDef = {
  key: "model",
  type: "text",
  labels: L("Model", "مدل", "ماډل"),
  placeholder: L("Enter model", "مدل را بنویسید", "ماډل ولیکئ"),
};

// ============================================================
// PHONE MODELS (cascading by brand)
// ============================================================

const PHONE_MODELS: Record<string, Option[]> = {
  apple: [
    "iPhone 6", "iPhone 6s", "iPhone 6s Plus", "iPhone 7", "iPhone 7 Plus",
    "iPhone 8", "iPhone 8 Plus", "iPhone X", "iPhone XR", "iPhone XS",
    "iPhone XS Max", "iPhone 11", "iPhone 11 Pro", "iPhone 11 Pro Max",
    "iPhone SE 2020", "iPhone 12 mini", "iPhone 12", "iPhone 12 Pro",
    "iPhone 12 Pro Max", "iPhone 13 mini", "iPhone 13", "iPhone 13 Pro",
    "iPhone 13 Pro Max", "iPhone 14", "iPhone 14 Plus", "iPhone 14 Pro",
    "iPhone 14 Pro Max", "iPhone 15", "iPhone 15 Plus", "iPhone 15 Pro",
    "iPhone 15 Pro Max", "iPhone 16", "iPhone 16 Plus", "iPhone 16 Pro",
    "iPhone 16 Pro Max",
  ].map(m),
  samsung: [
    "Galaxy A05", "Galaxy A05s", "Galaxy A06", "Galaxy A10", "Galaxy A10s",
    "Galaxy A15", "Galaxy A16", "Galaxy A20", "Galaxy A20s", "Galaxy A25",
    "Galaxy A30", "Galaxy A30s", "Galaxy A35", "Galaxy A50", "Galaxy A51",
    "Galaxy A52", "Galaxy A55", "Galaxy A70", "Galaxy A71", "Galaxy A72",
    "Galaxy A73", "Galaxy M15", "Galaxy M35", "Galaxy S8", "Galaxy S8+",
    "Galaxy S9", "Galaxy S9+", "Galaxy S10", "Galaxy S10+", "Galaxy S20",
    "Galaxy S20 Ultra", "Galaxy S21", "Galaxy S21 Ultra", "Galaxy S22",
    "Galaxy S22 Ultra", "Galaxy S23", "Galaxy S23 Ultra", "Galaxy S24",
    "Galaxy S24 Ultra", "Galaxy S25", "Galaxy S25 Ultra", "Galaxy Note 8",
    "Galaxy Note 9", "Galaxy Note 10", "Galaxy Note 10+", "Galaxy Note 20",
    "Galaxy Note 20 Ultra", "Galaxy J2", "Galaxy J4", "Galaxy J5",
    "Galaxy J6", "Galaxy J7", "Galaxy Grand Prime",
  ].map(m),
  xiaomi: [
    "Redmi 9", "Redmi 9A", "Redmi 9C", "Redmi 10", "Redmi 10A", "Redmi 10C",
    "Redmi 12", "Redmi 12C", "Redmi 13", "Redmi 13C", "Redmi 14C",
    "Redmi A1", "Redmi A2", "Redmi A3", "Redmi Note 8", "Redmi Note 8 Pro",
    "Redmi Note 9", "Redmi Note 9 Pro", "Redmi Note 10", "Redmi Note 10 Pro",
    "Redmi Note 11", "Redmi Note 11 Pro", "Redmi Note 12",
    "Redmi Note 12 Pro", "Redmi Note 13", "Redmi Note 13 Pro",
    "Redmi Note 14", "Redmi Note 14 Pro", "Poco X3", "Poco X3 Pro",
    "Poco X4 Pro", "Poco X5", "Poco X5 Pro", "Poco X6", "Poco X6 Pro",
    "Poco M3", "Poco M4", "Poco M5", "Poco F3", "Poco F4", "Poco F5",
    "Poco C40", "Poco C55", "Poco C65",
  ].map(m),
  huawei: [
    "Y5", "Y6", "Y7", "Y7 Prime", "Y9", "Y9 Prime", "Y9s", "P20", "P20 Pro",
    "P30", "P30 Pro", "P40", "Mate 10", "Mate 20", "Nova 3i", "Nova 5T",
    "Nova 7i", "Nova 9", "Nova 11", "Honor 8X", "Honor 9X", "Honor X6",
    "Honor X7", "Honor X8", "Honor X9", "Honor 50", "Honor 70", "Honor 90",
  ].map(m),
  oppo: [
    "A3s", "A5s", "A12", "A15", "A16", "A17", "A18", "A38", "A57", "A58",
    "A78", "A96", "F9", "F11", "F17", "F19", "F21", "Reno 4", "Reno 5",
    "Reno 6", "Reno 7", "Reno 8", "Reno 10", "Reno 11",
  ].map(m),
  vivo: [
    "Y11", "Y12", "Y15", "Y17", "Y19", "Y20", "Y21", "Y22", "Y27", "Y33s",
    "Y36", "Y53", "Y91", "V20", "V21", "V23", "V25", "V27", "V29",
  ].map(m),
  realme: [
    "C11", "C15", "C21", "C25", "C31", "C33", "C53", "C55", "C65",
    "Realme 5", "Realme 6", "Realme 7", "Realme 8", "Realme 9", "Realme 10",
    "Realme 11", "Narzo 30", "Narzo 50", "Narzo 60",
  ].map(m),
  infinix: [
    "Hot 9", "Hot 10", "Hot 11", "Hot 12", "Hot 30", "Hot 40", "Note 7",
    "Note 8", "Note 10", "Note 11", "Note 12", "Note 30", "Note 40",
    "Smart 5", "Smart 6", "Smart 7", "Smart 8", "Zero 5G", "Zero 30",
  ].map(m),
  tecno: [
    "Spark 5", "Spark 6", "Spark 7", "Spark 8", "Spark 9", "Spark 10",
    "Spark 20", "Camon 12", "Camon 15", "Camon 17", "Camon 18", "Camon 19",
    "Camon 20", "Camon 30", "Pop 5", "Pop 6", "Pop 7", "Pova 4", "Pova 5",
    "Pova 6",
  ].map(m),
  itel: [
    "A16", "A25", "A48", "A58", "A70", "S23", "Vision 1", "Vision 2",
    "Vision 3",
  ].map(m),
  nokia: [
    "105", "106", "110", "130", "150", "216", "3310", "C1", "C2", "C10",
    "C20", "C21", "G10", "G11", "G20", "G21", "X10", "X20",
  ].map(m),
  oneplus: [
    "7", "7 Pro", "8", "8 Pro", "9", "9 Pro", "10 Pro", "11", "12",
    "Nord N10", "Nord N20", "Nord CE",
  ].map(m),
  google: [
    "Pixel 4", "Pixel 4a", "Pixel 5", "Pixel 6", "Pixel 6a", "Pixel 6 Pro",
    "Pixel 7", "Pixel 7 Pro", "Pixel 8", "Pixel 8 Pro", "Pixel 9",
  ].map(m),
  motorola: [
    "Moto G Play", "Moto G Power", "Moto G Stylus", "Moto E", "Edge 30",
    "Edge 40",
  ].map(m),
};

const PHONE_BRANDS: Option[] = [
  o("apple", "Apple", "اپل (آیفون)", "اپل (آیفون)"),
  m("Samsung") && o("samsung", "Samsung", "سامسونگ", "سامسونګ"),
  o("xiaomi", "Xiaomi / Redmi / Poco", "شیایومی / ردمی / پوکو", "شیایومي / ردمي / پوکو"),
  o("huawei", "Huawei / Honor", "هواوی / آنر", "هواوي / آنر"),
  o("oppo", "Oppo", "اوپو", "اوپو"),
  o("vivo", "Vivo", "ویوو", "ویوو"),
  o("realme", "Realme", "ریلمی", "ریلمي"),
  o("infinix", "Infinix", "انفینکس", "انفینکس"),
  o("tecno", "Tecno", "تکنو", "تکنو"),
  o("itel", "Itel", "آیتل", "آیتل"),
  o("nokia", "Nokia", "نوکیا", "نوکیا"),
  o("oneplus", "OnePlus", "وان پلس", "وان پلس"),
  o("google", "Google Pixel", "گوگل پیکسل", "ګوګل پیکسل"),
  o("motorola", "Motorola", "موتورولا", "موتورولا"),
  OTHER,
];

// ============================================================
// THE 22 LEAF SUBCATEGORIES
// ============================================================

export const ELECTRONICS_LEAVES: LeafSubcategory[] = [

  // ────────────────────────────────────────────
  // 1. MOBILE PHONES — موبایل
  // ────────────────────────────────────────────
  {
    id: "mobile-phones",
    slug: "mobile-phones",
    labels: L("Mobile Phones", "موبایل", "موبایل"),
    topCards: ["condition", "storage", "ram", "battery_health"],
    fields: [
      {
        key: "brand", type: "select", required: true,
        labels: L("Brand", "برند", "برنډ"),
        options: PHONE_BRANDS, allowOther: true,
      },
      {
        key: "model", type: "cascading-select", required: true,
        labels: L("Model", "مدل", "ماډل"),
        dependsOn: "brand", optionsByParent: PHONE_MODELS, allowOther: true,
      },
      {
        key: "storage", type: "select", required: true,
        labels: L("Storage", "حافظه", "حافظه"),
        options: STORAGE_OPTIONS,
      },
      {
        key: "ram", type: "select",
        labels: L("RAM", "رم", "رم"),
        options: RAM_OPTIONS,
      },
      conditionField(),
      {
        key: "battery_health", type: "number",
        labels: L("Battery Health", "صحت بطری", "د بیټرۍ روغتیا"),
        unit: L("%", "٪", "٪"), min: 1, max: 100,
      },
      colorField,
      locationField,
    ],
    features: [
      { key: "with_box", labels: L("With Box", "قطی دارد", "قطي لري") },
      { key: "with_charger", labels: L("With Charger", "چارجر دارد", "چارجر لري") },
      { key: "no_scratches", labels: L("No Scratches", "بدون داغ", "بې داغه") },
      { key: "exchange_possible", labels: L("Exchange Possible", "تبادله ممکن", "تبادله ممکنه") },
      { key: "registered", labels: L("Registered", "رجستر شده", "راجستر شوی") },
    ],
  },

  // ────────────────────────────────────────────
  // 2. TABLETS — تبلت
  // ────────────────────────────────────────────
  {
    id: "tablets",
    slug: "tablets",
    labels: L("Tablets", "تبلت", "ټابلیټ"),
    topCards: ["condition", "storage", "ram", "screen_size"],
    fields: [
      {
        key: "brand", type: "select", required: true,
        labels: L("Brand", "برند", "برنډ"),
        options: [
          o("apple", "Apple iPad", "اپل آیپد", "اپل آیپډ"),
          o("samsung", "Samsung", "سامسونگ", "سامسونګ"),
          o("huawei", "Huawei", "هواوی", "هواوي"),
          o("lenovo", "Lenovo", "لینوو", "لینوو"),
          o("amazon", "Amazon Fire", "آمازون فایر", "آمازون فایر"),
          OTHER,
        ],
        allowOther: true,
      },
      {
        key: "model", type: "cascading-select",
        labels: L("Model", "مدل", "ماډل"),
        dependsOn: "brand",
        optionsByParent: {
          apple: [
            "iPad 5", "iPad 6", "iPad 7", "iPad 8", "iPad 9", "iPad 10",
            "iPad Air 1", "iPad Air 2", "iPad Air 3", "iPad Air 4",
            "iPad Air 5", "iPad Pro 11\"", "iPad Pro 12.9\"", "iPad mini 1",
            "iPad mini 2", "iPad mini 3", "iPad mini 4", "iPad mini 5",
            "iPad mini 6",
          ].map(m),
          samsung: [
            "Galaxy Tab A7", "Galaxy Tab A8", "Galaxy Tab A9",
            "Galaxy Tab S6", "Galaxy Tab S7", "Galaxy Tab S8", "Galaxy Tab S9",
          ].map(m),
          huawei: ["MatePad", "MatePad Pro", "MediaPad T5", "MediaPad M5"].map(m),
          lenovo: ["Tab M8", "Tab M10", "Tab P11", "Yoga Tab"].map(m),
        },
        allowOther: true,
      },
      {
        key: "storage", type: "select", required: true,
        labels: L("Storage", "حافظه", "حافظه"),
        options: [m("16 GB"), m("32 GB"), m("64 GB"), m("128 GB"), m("256 GB"), m("512 GB")],
      },
      {
        key: "ram", type: "select",
        labels: L("RAM", "رم", "رم"),
        options: [m("2 GB"), m("3 GB"), m("4 GB"), m("6 GB"), m("8 GB"), m("12 GB")],
      },
      {
        key: "screen_size", type: "select",
        labels: L("Screen Size", "اندازه سکرین", "د سکرین اندازه"),
        options: [m("7\""), m("8\""), m("10\""), m("11\""), m("12.9\"")],
      },
      {
        key: "sim_support", type: "select",
        labels: L("SIM Card", "سیم کارت", "سیم کارت"),
        options: [
          o("sim", "Has SIM", "دارد", "لري"),
          o("wifi", "WiFi Only", "فقط وای فای", "یوازې وای فای"),
        ],
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "with_box", labels: L("With Box", "قطی دارد", "قطي لري") },
      { key: "with_charger", labels: L("With Charger", "چارجر دارد", "چارجر لري") },
      { key: "with_pen", labels: L("With Pen", "قلم دارد", "قلم لري") },
      { key: "with_keyboard", labels: L("With Keyboard", "کیبورد دارد", "کیبورډ لري") },
      { key: "exchange_possible", labels: L("Exchange Possible", "تبادله ممکن", "تبادله ممکنه") },
    ],
  },

  // ────────────────────────────────────────────
  // 3. SMART WATCHES — ساعت هوشمند
  // ────────────────────────────────────────────
  {
    id: "smart-watches",
    slug: "smart-watches",
    labels: L("Smart Watches", "ساعت هوشمند", "هوښیار ساعت"),
    topCards: ["brand", "condition", "size", "originality"],
    fields: [
      {
        key: "brand", type: "select", required: true,
        labels: L("Brand", "برند", "برنډ"),
        options: [
          o("apple", "Apple Watch", "اپل واچ", "اپل واچ"),
          o("samsung", "Samsung Galaxy Watch", "سامسونگ گلکسی واچ", "سامسونګ ګلکسي واچ"),
          o("huawei", "Huawei", "هواوی", "هواوي"),
          o("xiaomi", "Xiaomi / Mi Band", "شیایومی / می بند", "شیایومي / مي بنډ"),
          o("amazfit", "Amazfit", "امیزفیت", "امیزفیټ"),
          o("honor", "Honor", "آنر", "آنر"),
          o("copy", "Copy / Ultra Copy", "کاپی / اولترا کاپی", "کاپي / اولترا کاپي"),
          OTHER,
        ],
        allowOther: true,
      },
      {
        key: "model", type: "cascading-select",
        labels: L("Model", "مدل", "ماډل"),
        dependsOn: "brand",
        optionsByParent: {
          apple: [
            "Series 3", "Series 4", "Series 5", "Series 6", "Series 7",
            "Series 8", "Series 9", "Series 10", "SE", "SE 2", "Ultra",
            "Ultra 2",
          ].map(m),
          samsung: ["Watch 4", "Watch 5", "Watch 6", "Watch 7", "Watch FE"].map(m),
          xiaomi: ["Mi Band 5", "Mi Band 6", "Mi Band 7", "Mi Band 8", "Mi Band 9", "Watch S1"].map(m),
        },
        allowOther: true,
      },
      {
        key: "size", type: "select",
        labels: L("Size", "سایز", "سایز"),
        options: [m("38 mm"), m("40 mm"), m("41 mm"), m("42 mm"), m("44 mm"), m("45 mm"), m("46 mm"), m("49 mm")],
      },
      {
        key: "originality", type: "select", required: true,
        labels: L("Originality", "اصالت", "اصالت"),
        options: ORIGINALITY_OPTIONS,
      },
      conditionField(),
      colorField,
      locationField,
    ],
    features: [
      { key: "with_box", labels: L("With Box", "قطی دارد", "قطي لري") },
      { key: "with_charger", labels: L("With Charger", "چارجر دارد", "چارجر لري") },
      { key: "extra_strap", labels: L("Extra Strap", "بند اضافه", "اضافه بند") },
    ],
  },

  // ────────────────────────────────────────────
  // 4. LAPTOPS — لپ تاپ
  // ────────────────────────────────────────────
  {
    id: "laptops",
    slug: "laptops",
    labels: L("Laptops", "لپ تاپ", "لپټاپ"),
    topCards: ["processor", "ram", "storage", "condition"],
    fields: [
      {
        key: "brand", type: "select", required: true,
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("HP"), m("Dell"), m("Lenovo"), m("Asus"), m("Acer"),
          o("apple", "Apple MacBook", "اپل مکبوک", "اپل مکبوک"),
          m("Toshiba"), m("MSI"),
          o("surface", "Microsoft Surface", "مایکروسافت سرفس", "مایکروسافټ سرفس"),
          OTHER,
        ],
        allowOther: true,
      },
      {
        ...modelTextField,
        placeholder: L("e.g. HP EliteBook 840 G5", "مثلاً HP EliteBook 840 G5", "لکه HP EliteBook 840 G5"),
      },
      {
        key: "processor", type: "select", required: true,
        labels: L("Processor", "پروسیسور", "پروسیسور"),
        options: [
          m("Core i3"), m("Core i5"), m("Core i7"), m("Core i9"),
          m("AMD Ryzen 3"), m("AMD Ryzen 5"), m("AMD Ryzen 7"),
          m("Apple M1"), m("Apple M2"), m("Apple M3"), m("Celeron"), OTHER,
        ],
      },
      {
        key: "cpu_generation", type: "select",
        labels: L("Generation", "نسل", "نسل"),
        options: [
          m("4th"), m("5th"), m("6th"), m("7th"), m("8th"), m("9th"),
          m("10th"), m("11th"), m("12th"), m("13th"),
        ],
      },
      {
        key: "ram", type: "select", required: true,
        labels: L("RAM", "رم", "رم"),
        options: [m("4 GB"), m("8 GB"), m("16 GB"), m("32 GB")],
      },
      {
        key: "storage", type: "select", required: true,
        labels: L("Storage", "حافظه", "حافظه"),
        options: [
          m("HDD 500 GB"), m("HDD 1 TB"), m("SSD 128 GB"), m("SSD 256 GB"),
          m("SSD 512 GB"), m("SSD 1 TB"),
          o("both", "HDD + SSD", "هر دو (HDD + SSD)", "دواړه (HDD + SSD)"),
        ],
      },
      {
        key: "graphics", type: "select",
        labels: L("Graphics", "گرافیک", "ګرافیک"),
        options: [
          o("intel", "Intel (Built-in)", "انتل (داخلی)", "انټل (داخلي)"),
          m("NVIDIA"), m("AMD"), OTHER,
        ],
      },
      {
        key: "screen_size", type: "select",
        labels: L("Screen Size", "اندازه سکرین", "د سکرین اندازه"),
        options: [m("11\""), m("13\""), m("14\""), m("15.6\""), m("17\"")],
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "with_charger", labels: L("With Charger", "چارجر دارد", "چارجر لري") },
      { key: "with_bag", labels: L("With Bag", "بکس دارد", "بکس لري") },
      { key: "new_battery", labels: L("New Battery", "بطری جدید", "نوې بیټرۍ") },
      { key: "touch_screen", labels: L("Touch Screen", "تاچ سکرین", "ټچ سکرین") },
      { key: "backlit_keyboard", labels: L("Backlit Keyboard", "کیبورد نوری", "رڼا لرونکی کیبورډ") },
      { key: "exchange_possible", labels: L("Exchange Possible", "تبادله ممکن", "تبادله ممکنه") },
    ],
  },

  // ────────────────────────────────────────────
  // 5. DESKTOP COMPUTERS — کمپیوتر رومیزی
  // ────────────────────────────────────────────
  {
    id: "desktop-computers",
    slug: "desktop-computers",
    labels: L("Desktop Computers", "کمپیوتر رومیزی", "میز کمپیوټر"),
    topCards: ["processor", "ram", "storage", "desktop_type"],
    fields: [
      {
        key: "desktop_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("case_only", "Case Only", "کیس تنها", "یوازې کیس"),
          o("full_set", "Full Set (Case + Monitor)", "سیت مکمل (کیس + مانیتور)", "بشپړ سیټ (کیس + مانیټور)"),
          o("all_in_one", "All-in-One", "آل این وان", "آل این وان"),
          o("gaming", "Gaming PC", "گیمینگ", "ګیمینګ"),
        ],
      },
      {
        key: "brand", type: "select",
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("HP"), m("Dell"), m("Lenovo"), m("Asus"),
          o("custom", "Custom Built", "اسمبل شده", "اسمبل شوی"),
          OTHER,
        ],
        allowOther: true,
      },
      {
        key: "processor", type: "select", required: true,
        labels: L("Processor", "پروسیسور", "پروسیسور"),
        options: [
          m("Core i3"), m("Core i5"), m("Core i7"), m("Core i9"),
          m("AMD Ryzen 3"), m("AMD Ryzen 5"), m("AMD Ryzen 7"),
          m("Celeron"), OTHER,
        ],
      },
      {
        key: "ram", type: "select", required: true,
        labels: L("RAM", "رم", "رم"),
        options: [m("4 GB"), m("8 GB"), m("16 GB"), m("32 GB"), m("64 GB")],
      },
      {
        key: "storage", type: "select", required: true,
        labels: L("Storage", "حافظه", "حافظه"),
        options: [
          m("HDD 500 GB"), m("HDD 1 TB"), m("SSD 128 GB"), m("SSD 256 GB"),
          m("SSD 512 GB"), m("SSD 1 TB"),
          o("both", "HDD + SSD", "هر دو (HDD + SSD)", "دواړه (HDD + SSD)"),
        ],
      },
      {
        key: "graphics_card", type: "select",
        labels: L("Graphics Card", "گرافیک کارت", "ګرافیک کارت"),
        options: [
          o("none", "None (Built-in)", "ندارد (داخلی)", "نلري (داخلي)"),
          m("NVIDIA GT"), m("NVIDIA GTX"), m("NVIDIA RTX"), m("AMD"), OTHER,
        ],
      },
      {
        key: "monitor_size", type: "select",
        labels: L("Monitor Size", "اندازه مانیتور", "د مانیټور اندازه"),
        options: [m("17\""), m("19\""), m("22\""), m("24\""), m("27\""), m("32\"")],
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "keyboard_mouse", labels: L("With Keyboard & Mouse", "کیبورد و ماوس دارد", "کیبورډ او ماوس لري") },
      { key: "builtin_wifi", labels: L("Built-in WiFi", "وای فای دارد", "وای فای لري") },
      { key: "dvd_drive", labels: L("DVD Drive", "DVD درایو دارد", "DVD ډرایو لري") },
    ],
  },

  // ────────────────────────────────────────────
  // 6. SIM CARDS & NUMBERS — سیم کارت و نمبر
  // ────────────────────────────────────────────
  {
    id: "sim-cards",
    slug: "sim-cards",
    labels: L("SIM Cards & Numbers", "سیم کارت و نمبر", "سیم کارت او نمبر"),
    topCards: ["network", "sim_number", "sim_type", "registration"],
    fields: [
      {
        key: "network", type: "select", required: true,
        labels: L("Network", "شبکه", "شبکه"),
        options: [
          o("roshan", "Roshan", "روشن", "روشن"),
          o("etisalat", "Etisalat", "اتصالات", "اتصالات"),
          o("awcc", "AWCC (Afghan Wireless)", "افغان بیسیم", "افغان بیسیم"),
          o("mtn", "MTN", "ام تی ان", "ام ټي ان"),
          o("salaam", "Salaam", "سلام", "سلام"),
        ],
      },
      {
        key: "sim_number", type: "text", required: true,
        labels: L("Number", "نمبر", "نمبر"),
        placeholder: L("e.g. 079 999 9999", "مثلاً 9999 999 079", "لکه 9999 999 079"),
      },
      {
        key: "sim_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("golden", "Golden Number", "نمبر طلایی", "طلایي نمبر"),
          o("normal", "Normal Number", "نمبر ساده", "ساده نمبر"),
          o("new_sim", "New SIM Card", "سیم کارت جدید", "نوی سیم کارت"),
        ],
      },
      {
        key: "registration", type: "select",
        labels: L("Registration", "سند / راجستر", "سند / راجستر"),
        options: [
          o("transferable", "Transferable to Buyer", "به نام خریدار قابل انتقال", "پیرودونکي ته د لیږد وړ"),
          o("registered", "Registered", "راجستر شده", "راجستر شوی"),
        ],
      },
      {
        key: "credit", type: "text",
        labels: L("Remaining Credit", "کریدت باقی‌مانده", "پاتې کریډیټ"),
      },
      locationField,
    ],
    features: [],
  },

  // ────────────────────────────────────────────
  // 7. MOBILE REPAIR SERVICES — خدمات ترمیم موبایل
  // ────────────────────────────────────────────
  {
    id: "mobile-repair",
    slug: "mobile-repair",
    labels: L("Mobile Repair Services", "خدمات ترمیم موبایل", "د موبایل ترمیم خدمات"),
    topCards: ["service_types", "experience_years", "brands_covered", "working_hours"],
    fields: [
      {
        key: "service_types", type: "multi-select", required: true,
        labels: L("Service Types", "نوع خدمات", "د خدماتو ډول"),
        options: [
          o("screen", "Screen Replacement", "تبدیلی سکرین", "د سکرین بدلول"),
          o("battery", "Battery Replacement", "تبدیلی بطری", "د بیټرۍ بدلول"),
          o("software", "Software Repair", "ترمیم سافت ویر", "د سافټویر ترمیم"),
          o("flash_unlock", "Flash & Unlock", "فلش و آنلاک", "فلش او انلاک"),
          o("board", "Board Repair", "ترمیم برد", "د برد ترمیم"),
          o("icloud", "iCloud Unlock", "آی کلود", "آی کلوډ"),
          o("frp", "FRP Unlock", "FRP", "FRP"),
          o("charging_port", "Charging Port", "تبدیلی سوکت چارج", "د چارج ساکټ بدلول"),
          OTHER,
        ],
      },
      {
        key: "brands_covered", type: "select",
        labels: L("Brands Covered", "برندهای تحت پوشش", "پوښل شوي برنډونه"),
        options: [
          o("all", "All Brands", "همه برندها", "ټول برنډونه"),
          o("apple", "Apple Only", "فقط اپل", "یوازې اپل"),
          o("samsung", "Samsung Only", "فقط سامسونگ", "یوازې سامسونګ"),
          OTHER,
        ],
      },
      {
        key: "experience_years", type: "number",
        labels: L("Experience", "تجربه", "تجربه"),
        unit: L("years", "سال", "کاله"), min: 0, max: 50,
      },
      {
        key: "shop_address", type: "text",
        labels: L("Shop Address", "آدرس دکان", "د دکان پته"),
      },
      {
        key: "working_hours", type: "text",
        labels: L("Working Hours", "ساعات کاری", "کاري ساعتونه"),
        placeholder: L("e.g. 8 AM - 6 PM", "مثلاً ۸ صبح تا ۶ شام", "لکه ۸ سهار تر ۶ ماښام"),
      },
      locationField,
    ],
    features: [
      { key: "warranty", labels: L("With Warranty", "گرنتی دارد", "ګرنټي لري") },
      { key: "home_service", labels: L("Home Service", "خدمات در محل", "کور ته خدمات") },
      { key: "original_parts", labels: L("Original Parts", "پرزه اصلی", "اصلي پرزې") },
    ],
  },

  // ────────────────────────────────────────────
  // 8. COMPUTER PARTS — پرزه جات کمپیوتر
  // ────────────────────────────────────────────
  {
    id: "computer-parts",
    slug: "computer-parts",
    labels: L("Computer Parts", "پرزه جات کمپیوتر", "د کمپیوټر پرزې"),
    topCards: ["part_type", "condition", "brand", "compatibility"],
    fields: [
      {
        key: "part_type", type: "select", required: true,
        labels: L("Part Type", "نوع پرزه", "د پرزې ډول"),
        options: [
          o("ram", "RAM", "رم", "رم"),
          o("hdd", "HDD", "هارد HDD", "هارډ HDD"),
          o("ssd", "SSD", "SSD", "SSD"),
          o("cpu", "Processor (CPU)", "پروسیسور", "پروسیسور"),
          o("motherboard", "Motherboard", "مادربورد", "مادربورډ"),
          o("gpu", "Graphics Card (GPU)", "گرافیک کارت", "ګرافیک کارت"),
          o("psu", "Power Supply", "پاور سپلای", "پاور سپلای"),
          o("case", "Case", "کیس", "کیس"),
          o("cooling", "Fan & Cooling", "فن و کولر", "فن او کولر"),
          o("laptop_battery", "Laptop Battery", "بطری لپ تاپ", "د لپټاپ بیټرۍ"),
          o("laptop_charger", "Laptop Charger", "چارجر لپ تاپ", "د لپټاپ چارجر"),
          o("laptop_screen", "Laptop Screen", "سکرین لپ تاپ", "د لپټاپ سکرین"),
          o("laptop_keyboard", "Laptop Keyboard", "کیبورد لپ تاپ", "د لپټاپ کیبورډ"),
          OTHER,
        ],
      },
      {
        key: "brand", type: "text",
        labels: L("Brand", "برند", "برنډ"),
      },
      {
        key: "specs", type: "text",
        labels: L("Specifications", "مشخصات", "مشخصات"),
        placeholder: L("e.g. DDR4 8GB 2666MHz", "مثلاً DDR4 8GB 2666MHz", "لکه DDR4 8GB 2666MHz"),
      },
      {
        key: "compatibility", type: "text",
        labels: L("Compatible With", "سازگاری", "مطابقت"),
        placeholder: L("e.g. HP EliteBook G5", "مثلاً HP EliteBook G5", "لکه HP EliteBook G5"),
      },
      conditionField(),
      {
        key: "originality", type: "select",
        labels: L("Originality", "اصالت", "اصالت"),
        options: ORIGINALITY_OPTIONS,
      },
      locationField,
    ],
    features: [
      { key: "warranty", labels: L("With Warranty", "گرنتی دارد", "ګرنټي لري") },
      { key: "tested", labels: L("Tested", "تست شده", "ازمویل شوی") },
    ],
  },

  // ────────────────────────────────────────────
  // 9. OTHER (in this group) — سایر
  // ────────────────────────────────────────────
  {
    id: "other-devices",
    slug: "other-devices",
    labels: L("Other", "سایر", "نور"),
    topCards: ["item_name", "condition", "location"],
    fields: [
      {
        key: "item_name", type: "text", required: true,
        labels: L("Item Name", "نام جنس", "د جنس نوم"),
      },
      conditionField(),
      locationField,
    ],
    features: [],
  },

  // ────────────────────────────────────────────
  // 10. MONITORS — مانیتور
  // ────────────────────────────────────────────
  {
    id: "monitors",
    slug: "monitors",
    labels: L("Monitors", "مانیتور", "مانیټور"),
    topCards: ["screen_size", "condition", "brand", "resolution"],
    fields: [
      {
        key: "brand", type: "select", required: true,
        labels: L("Brand", "برند", "برنډ"),
        options: [m("Samsung"), m("LG"), m("Dell"), m("HP"), m("Asus"), m("Acer"), OTHER],
        allowOther: true,
      },
      {
        key: "screen_size", type: "select", required: true,
        labels: L("Size", "اندازه", "اندازه"),
        options: [
          m("17\""), m("19\""), m("22\""), m("24\""), m("27\""), m("32\""),
          o("larger", "Larger", "بزرگتر", "لوی"),
        ],
      },
      {
        key: "resolution", type: "select",
        labels: L("Resolution", "ریزولوشن", "ریزولوشن"),
        options: [m("HD"), m("Full HD"), m("2K"), m("4K")],
      },
      {
        key: "ports", type: "multi-select",
        labels: L("Ports", "پورت", "پورټ"),
        options: [m("HDMI"), m("VGA"), m("DisplayPort"), m("DVI")],
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "no_screen_marks", labels: L("No Screen Marks", "بدون داغ سکرین", "بې داغه سکرین") },
      { key: "with_cable", labels: L("With Cable", "کیبل دارد", "کیبل لري") },
      { key: "with_stand", labels: L("With Stand", "پایه دارد", "پایه لري") },
    ],
  },

  // ────────────────────────────────────────────
  // 11. TV — تلویزیون
  // ────────────────────────────────────────────
  {
    id: "tv",
    slug: "tv",
    labels: L("TV", "تلویزیون", "تلویزیون"),
    topCards: ["screen_size", "storage", "tv_type", "condition"],
    fields: [
      {
        key: "brand", type: "select", required: true,
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("Samsung"), m("LG"), m("Sony"), m("TCL"), m("Haier"),
          m("Changhong"), m("Nikai"), m("Star-X"), m("Shownic"), m("GLD"),
          OTHER,
        ],
        allowOther: true,
      },
      {
        key: "screen_size", type: "select", required: true,
        labels: L("Size", "اندازه", "اندازه"),
        options: [m("24\""), m("32\""), m("40\""), m("43\""), m("50\""), m("55\""), m("65\""), m("75\"")],
      },
      {
        key: "storage", type: "select", required: true,
        labels: L("Storage", "حافظه", "حافظه"),
        options: STORAGE_OPTIONS,
      },
      {
        key: "tv_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("smart", "Smart", "سمارت", "سمارټ"),
          o("android", "Android", "اندروید", "انډرایډ"),
          o("simple", "Simple", "ساده", "ساده"),
        ],
      },
      {
        key: "resolution", type: "select",
        labels: L("Resolution", "ریزولوشن", "ریزولوشن"),
        options: [m("HD"), m("Full HD"), m("4K")],
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "with_remote", labels: L("With Remote", "ریموت دارد", "ریموټ لري") },
      { key: "wall_mount", labels: L("Wall Mount", "دیوارکوب دارد", "دیوال ماونټ لري") },
      { key: "with_receiver", labels: L("With Receiver", "رسیور دارد", "رسیور لري") },
      { key: "no_screen_marks", labels: L("No Screen Marks", "بدون داغ سکرین", "بې داغه سکرین") },
    ],
  },

  // ────────────────────────────────────────────
  // 12. GAME CONSOLES — کنسول بازی
  // ────────────────────────────────────────────
  {
    id: "game-consoles",
    slug: "game-consoles",
    labels: L("Game Consoles", "کنسول بازی", "د لوبې کنسول"),
    topCards: ["model", "storage", "condition", "controllers"],
    fields: [
      {
        key: "console_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("playstation", "PlayStation", "پلی استیشن", "پلی سټیشن"),
          o("xbox", "Xbox", "ایکس باکس", "ایکس باکس"),
          o("nintendo", "Nintendo", "نینتندو", "نینټنډو"),
          o("handheld", "Handheld", "دستی", "لاسي"),
          OTHER,
        ],
      },
      {
        key: "model", type: "cascading-select", required: true,
        labels: L("Model", "مدل", "ماډل"),
        dependsOn: "console_type",
        optionsByParent: {
          playstation: ["PS3", "PS4 Slim", "PS4 Pro", "PS5", "PS5 Slim"].map(m),
          xbox: ["Xbox 360", "Xbox One", "Series S", "Series X"].map(m),
          nintendo: ["Switch", "Switch Lite", "Switch OLED"].map(m),
        },
        allowOther: true,
      },
      {
        key: "storage", type: "select",
        labels: L("Storage", "حافظه", "حافظه"),
        options: [m("500 GB"), m("1 TB"), m("2 TB")],
      },
      {
        key: "controllers", type: "select",
        labels: L("Controllers", "تعداد دسته", "د دستو شمېر"),
        options: [
          m("1"), m("2"),
          o("more", "More", "بیشتر", "ډېر"),
        ],
      },
      {
        key: "jailbroken", type: "select",
        labels: L("Jailbroken", "جیلبریک / کاپی خور", "جیلبریک"),
        options: YES_NO,
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "games_installed", labels: L("Games Installed", "بازی نصب شده", "لوبې نصب شوي") },
      { key: "with_box", labels: L("With Box", "قطی دارد", "قطي لري") },
      { key: "all_cables", labels: L("All Cables", "کیبل مکمل", "بشپړ کیبلونه") },
    ],
  },

  // ────────────────────────────────────────────
  // 13. CAMERAS — کمره
  // ────────────────────────────────────────────
  {
    id: "cameras",
    slug: "cameras",
    labels: L("Cameras", "کمره", "کمره"),
    topCards: ["camera_type", "brand", "condition", "model"],
    fields: [
      {
        key: "camera_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("dslr", "DSLR", "DSLR", "DSLR"),
          o("mirrorless", "Mirrorless", "بدون آینه", "بې هېندارې"),
          o("video", "Video Camera", "کمره فلمبرداری", "د فلم اخیستلو کمره"),
          o("cctv", "Security Camera (CCTV)", "کمره امنیتی", "امنیتي کمره"),
          o("drone", "Drone", "درون", "ډرون"),
          o("action", "Action Camera", "اکشن کمره", "اکشن کمره"),
          OTHER,
        ],
      },
      {
        key: "brand", type: "select", required: true,
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("Canon"), m("Nikon"), m("Sony"), m("Hikvision"), m("Dahua"),
          m("DJI"), m("GoPro"), OTHER,
        ],
        allowOther: true,
      },
      {
        ...modelTextField,
        placeholder: L("e.g. Canon 750D", "مثلاً Canon 750D", "لکه Canon 750D"),
      },
      {
        key: "lens", type: "text",
        labels: L("Lens", "لنز", "لنز"),
        placeholder: L("e.g. 18-55mm / None", "مثلاً 18-55mm / ندارد", "لکه 18-55mm / نلري"),
      },
      {
        key: "cctv_count", type: "number",
        labels: L("Number of Cameras (CCTV)", "تعداد کمره (امنیتی)", "د کمرو شمېر (امنیتي)"),
        min: 1, max: 64,
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "with_bag", labels: L("With Bag", "بکس دارد", "بکس لري") },
      { key: "memory_card", labels: L("With Memory Card", "کارت حافظه دارد", "د حافظې کارت لري") },
      { key: "tripod", labels: L("With Tripod", "سه پایه دارد", "درې پایه لري") },
      { key: "charger_battery", labels: L("Charger & Battery", "چارجر و بطری", "چارجر او بیټرۍ") },
      { key: "dvr_nvr", labels: L("With DVR/NVR", "DVR/NVR دارد", "DVR/NVR لري") },
    ],
  },

  // ────────────────────────────────────────────
  // 14. AUDIO EQUIPMENT — تجهیزات صوتی
  // ────────────────────────────────────────────
  {
    id: "audio-equipment",
    slug: "audio-equipment",
    labels: L("Audio Equipment", "تجهیزات صوتی", "غږیز تجهیزات"),
    topCards: ["audio_type", "brand", "condition", "power"],
    fields: [
      {
        key: "audio_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("speaker", "Speaker", "سپیکر", "سپیکر"),
          o("amplifier", "Amplifier", "امپلیفایر", "امپلیفایر"),
          o("full_system", "Full Sound System", "ساوند سیستم مکمل", "بشپړ غږیز سیسټم"),
          o("mixer", "Mixer", "مکسر", "مکسر"),
          o("microphone", "Microphone", "مایکروفون", "مایکروفون"),
          o("mosque", "Mosque Sound System", "سیستم مسجد", "د جومات غږیز سیسټم"),
          o("event", "Event Speakers", "باند محفل", "د محفل باند"),
          OTHER,
        ],
      },
      {
        key: "brand", type: "select",
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("JBL"), m("Sony"), m("Pioneer"), m("Yamaha"), m("Behringer"),
          m("Max"), OTHER,
        ],
        allowOther: true,
      },
      {
        key: "power", type: "text",
        labels: L("Power", "قدرت", "ځواک"),
        unit: L("Watts", "وات", "واټ"),
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "bluetooth", labels: L("Bluetooth", "بلوتوث دارد", "بلوتوث لري") },
      { key: "with_remote", labels: L("With Remote", "ریموت دارد", "ریموټ لري") },
      { key: "all_cables", labels: L("All Cables", "کیبل مکمل", "بشپړ کیبلونه") },
    ],
  },

  // ────────────────────────────────────────────
  // 15. NETWORK EQUIPMENT — تجهیزات شبکه
  // ────────────────────────────────────────────
  {
    id: "network-equipment",
    slug: "network-equipment",
    labels: L("Network Equipment", "تجهیزات شبکه", "د شبکې تجهیزات"),
    topCards: ["network_type", "brand", "condition", "speed_ports"],
    fields: [
      {
        key: "network_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("router", "WiFi Router", "روتر وای فای", "وای فای روټر"),
          o("modem", "Modem", "مودم", "موډم"),
          o("switch", "Switch", "سویچ", "سویچ"),
          o("access_point", "Access Point", "اکسس پاینت", "اکسس پاینټ"),
          o("antenna", "Antenna", "انتن", "انټن"),
          o("isp", "ISP Equipment", "تجهیزات آی اس پی", "د ISP تجهیزات"),
          o("cable", "Network Cable", "کیبل شبکه", "د شبکې کیبل"),
          o("mikrotik", "Mikrotik", "میکروتیک", "میکروتیک"),
          OTHER,
        ],
      },
      {
        key: "brand", type: "select",
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("TP-Link"), m("Mikrotik"), m("Tenda"), m("D-Link"),
          m("Ubiquiti"), m("Cisco"), m("Huawei"), OTHER,
        ],
        allowOther: true,
      },
      modelTextField,
      {
        key: "speed_ports", type: "text",
        labels: L("Speed / Ports", "سرعت / پورت", "سرعت / پورټ"),
        placeholder: L("e.g. 300Mbps / 8 ports", "مثلاً 300Mbps / ۸ پورت", "لکه 300Mbps / ۸ پورټه"),
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "with_adapter", labels: L("With Adapter", "آداپتر دارد", "اډاپټر لري") },
      { key: "configured", labels: L("Configured", "تنظیم شده", "تنظیم شوی") },
    ],
  },

  // ────────────────────────────────────────────
  // 16. PRINTERS & SCANNERS — پرنتر و اسکنر
  // ────────────────────────────────────────────
  {
    id: "printers-scanners",
    slug: "printers-scanners",
    labels: L("Printers & Scanners", "پرنتر و اسکنر", "پرنټر او سکینر"),
    topCards: ["printer_type", "brand", "condition", "print_color"],
    fields: [
      {
        key: "printer_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("laser", "Laser Printer", "پرنتر لیزری", "لیزري پرنټر"),
          o("inkjet", "Inkjet / Color Printer", "پرنتر رنگه", "رنګه پرنټر"),
          o("scanner", "Scanner", "اسکنر", "سکینر"),
          o("all_in_one", "All-in-One (3-in-1)", "سه کاره", "درې کاره"),
          o("photocopier", "Photocopier", "فوتوکاپی", "فوټوکاپي"),
          OTHER,
        ],
      },
      {
        key: "brand", type: "select", required: true,
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("HP"), m("Canon"), m("Epson"), m("Brother"), m("Ricoh"),
          m("Kyocera"), OTHER,
        ],
        allowOther: true,
      },
      {
        ...modelTextField,
        placeholder: L("e.g. HP LaserJet 1102", "مثلاً HP LaserJet 1102", "لکه HP LaserJet 1102"),
      },
      {
        key: "print_color", type: "select",
        labels: L("Print", "چاپ", "چاپ"),
        options: [
          o("bw", "Black & White", "سیاه و سفید", "تور او سپین"),
          o("color", "Color", "رنگه", "رنګه"),
        ],
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "with_toner", labels: L("With Toner/Ink", "تونر / رنگ دارد", "ټونر / رنګ لري") },
      { key: "with_cable", labels: L("With Cable", "کیبل دارد", "کیبل لري") },
      { key: "wifi", labels: L("WiFi", "وای فای دارد", "وای فای لري") },
    ],
  },

  // ────────────────────────────────────────────
  // 17. PROJECTORS — پروژکتور
  // ────────────────────────────────────────────
  {
    id: "projectors",
    slug: "projectors",
    labels: L("Projectors", "پروژکتور", "پروجکتور"),
    topCards: ["brand", "brightness", "condition", "resolution"],
    fields: [
      {
        key: "brand", type: "select", required: true,
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("Epson"), m("BenQ"), m("Sony"), m("InFocus"),
          o("mini", "Mini Projector", "مینی پروژکتور", "مini پروجکتور"),
          OTHER,
        ],
        allowOther: true,
      },
      modelTextField,
      {
        key: "brightness", type: "text",
        labels: L("Brightness", "روشنایی", "رڼا"),
        unit: L("Lumens", "لومن", "لومن"),
      },
      {
        key: "resolution", type: "select",
        labels: L("Resolution", "ریزولوشن", "ریزولوشن"),
        options: [m("SVGA"), m("XGA"), m("HD"), m("Full HD"), m("4K")],
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "with_screen", labels: L("With Screen", "پرده دارد", "پرده لري") },
      { key: "with_remote", labels: L("With Remote", "ریموت دارد", "ریموټ لري") },
      { key: "all_cables", labels: L("All Cables", "کیبل مکمل", "بشپړ کیبلونه") },
      { key: "new_lamp", labels: L("New Lamp", "لمپ جدید", "نوی لمپ") },
    ],
  },

  // ────────────────────────────────────────────
  // 18. STORAGE DEVICES — وسایل ذخیره سازی
  // ────────────────────────────────────────────
  {
    id: "storage-devices",
    slug: "storage-devices",
    labels: L("Storage Devices", "وسایل ذخیره سازی", "د زیرمې وسایل"),
    topCards: ["storage_type", "capacity", "condition", "brand"],
    fields: [
      {
        key: "storage_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("external_hdd", "External HDD", "هارد اکسترنال", "بهرنی هارډ"),
          o("external_ssd", "External SSD", "SSD اکسترنال", "بهرنی SSD"),
          o("usb_flash", "USB Flash", "فلش USB", "USB فلش"),
          o("memory_card", "Memory Card", "کارت حافظه", "د حافظې کارت"),
          o("nas", "NAS", "NAS", "NAS"),
          OTHER,
        ],
      },
      {
        key: "brand", type: "select",
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("WD"), m("Seagate"), m("Toshiba"), m("SanDisk"), m("Kingston"),
          m("Samsung"), OTHER,
        ],
        allowOther: true,
      },
      {
        key: "capacity", type: "select", required: true,
        labels: L("Capacity", "ظرفیت", "ظرفیت"),
        options: [
          m("8 GB"), m("16 GB"), m("32 GB"), m("64 GB"), m("128 GB"),
          m("256 GB"), m("512 GB"), m("1 TB"), m("2 TB"), m("4 TB"),
        ],
      },
      {
        key: "originality", type: "select",
        labels: L("Originality", "اصالت", "اصالت"),
        options: ORIGINALITY_OPTIONS,
      },
      conditionField(),
      locationField,
    ],
    features: [
      { key: "tested", labels: L("Tested", "تست شده", "ازمویل شوی") },
      { key: "with_box", labels: L("With Box", "قطی دارد", "قطي لري") },
    ],
  },

  // ────────────────────────────────────────────
  // 19. SOLAR & POWER — تجهیزات سولر و برق
  // ────────────────────────────────────────────
  {
    id: "solar-power",
    slug: "solar-power",
    labels: L("Solar & Power Equipment", "تجهیزات سولر و برق", "د سولر او برېښنا تجهیزات"),
    topCards: ["power_type", "capacity", "condition", "brand"],
    fields: [
      {
        key: "power_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("solar_panel", "Solar Panel", "سولر پنل", "سولر پینل"),
          o("inverter", "Inverter", "انورتر", "انورټر"),
          o("battery", "Battery", "بطری", "بیټرۍ"),
          o("charge_controller", "Charge Controller", "چارج کنترولر", "چارج کنټرولر"),
          o("generator", "Generator", "جنراتور", "جنراتور"),
          o("stabilizer", "Stabilizer", "استابلایزر", "سټابلایزر"),
          o("ups", "UPS", "یو پی اس", "یو پي اس"),
          o("transformer", "Transformer", "ترانسفارمر", "ټرانسفارمر"),
          o("cables", "Power Cables", "کیبل برق", "د برېښنا کیبل"),
          OTHER,
        ],
      },
      {
        key: "brand", type: "select",
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("Jinko"), m("Longi"), m("JA Solar"), m("Canadian Solar"),
          m("Growatt"), m("Inverex"), m("Phoenix"), m("AGS"), m("Osaka"),
          m("Exide"), m("Narada"), m("Jasco"), m("Honda"), m("Perkins"),
          m("Cummins"), OTHER,
        ],
        allowOther: true,
      },
      {
        key: "capacity", type: "text", required: true,
        labels: L("Power / Capacity", "قدرت / ظرفیت", "ځواک / ظرفیت"),
        placeholder: L(
          "e.g. 585 Watt / 200 Ah / 5 KW / 10 KVA",
          "مثلاً ۵۸۵ وات / ۲۰۰ امپیر / ۵ کیلووات",
          "لکه ۵۸۵ واټ / ۲۰۰ امپیر / ۵ کیلوواټ"
        ),
      },
      {
        key: "voltage", type: "select",
        labels: L("Voltage", "ولتاژ", "ولټاژ"),
        options: [m("12V"), m("24V"), m("48V")],
      },
      {
        key: "fuel_type", type: "select",
        labels: L("Fuel Type (Generators)", "نوع سوخت (جنراتور)", "د سون ډول (جنراتور)"),
        options: [
          o("diesel", "Diesel", "دیزل", "ډیزل"),
          o("petrol", "Petrol", "پطرول", "پټرول"),
          o("gas", "Gas", "گاز", "ګاز"),
        ],
      },
      {
        key: "condition", type: "select", required: true,
        labels: L("Condition", "حالت", "حالت"),
        options: CONDITION_SIMPLE,
      },
      locationField,
    ],
    features: [
      { key: "warranty", labels: L("With Warranty", "گرنتی دارد", "ګرنټي لري") },
      { key: "free_install", labels: L("Free Installation", "نصب رایگان", "وړیا نصب") },
      { key: "low_usage", labels: L("Low Usage", "کم کارکرد", "لږ کارول شوی") },
    ],
  },

  // ────────────────────────────────────────────
  // 20. MOBILE ACCESSORIES — لوازم موبایل
  // ────────────────────────────────────────────
  {
    id: "mobile-accessories",
    slug: "mobile-accessories",
    labels: L("Mobile Accessories", "لوازم موبایل", "د موبایل لوازم"),
    topCards: ["accessory_type", "brand", "condition", "originality"],
    fields: [
      {
        key: "accessory_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("airpods", "AirPods / Earbuds", "ایرپاد", "ایرپاډ"),
          o("earphones", "Earphones", "هندفری", "هنډفري"),
          o("charger", "Charger", "چارجر", "چارجر"),
          o("powerbank", "Power Bank", "پاوربانک", "پاوربانک"),
          o("cover", "Cover / Case", "قاب", "قاب"),
          o("screen_protector", "Screen Protector", "محافظ سکرین", "د سکرین ساتونکی"),
          o("cable", "Cable", "کیبل", "کیبل"),
          o("holder", "Holder", "هولدر", "هولډر"),
          o("ring_light", "Ring Light", "رینگ لایت", "رینګ لایټ"),
          OTHER,
        ],
      },
      {
        key: "brand", type: "select",
        labels: L("Brand", "برند", "برنډ"),
        options: [
          m("Apple"), m("Samsung"), m("Anker"), m("Baseus"), m("JBL"),
          m("Xiaomi"), m("Joyroom"), OTHER,
        ],
        allowOther: true,
      },
      {
        key: "originality", type: "select",
        labels: L("Originality", "اصالت", "اصالت"),
        options: ORIGINALITY_OPTIONS,
      },
      {
        key: "condition", type: "select", required: true,
        labels: L("Condition", "حالت", "حالت"),
        options: CONDITION_SIMPLE,
      },
      locationField,
    ],
    features: [
      { key: "with_box", labels: L("With Box", "قطی دارد", "قطي لري") },
    ],
  },

  // ────────────────────────────────────────────
  // 21. COMPUTER ACCESSORIES — لوازم جانبی کمپیوتر
  // ────────────────────────────────────────────
  {
    id: "computer-accessories",
    slug: "computer-accessories",
    labels: L("Computer Accessories", "لوازم جانبی کمپیوتر", "د کمپیوټر لوازم"),
    topCards: ["accessory_type", "brand", "condition", "connection"],
    fields: [
      {
        key: "accessory_type", type: "select", required: true,
        labels: L("Type", "نوعیت", "ډول"),
        options: [
          o("keyboard", "Keyboard", "کیبورد", "کیبورډ"),
          o("mouse", "Mouse", "ماوس", "ماوس"),
          o("headset", "Headset", "هدست", "هېډسېټ"),
          o("webcam", "Webcam", "ویب کم", "ویب کم"),
          o("mousepad", "Mouse Pad", "ماوس پد", "ماوس پډ"),
          o("pc_speakers", "PC Speakers", "سپیکر کمپیوتر", "د کمپیوټر سپیکر"),
          o("cooling_pad", "Cooling Pad", "کولینگ پد", "کولینګ پډ"),
          o("hub_cables", "Hub & Cables", "هب و کیبل", "هب او کیبل"),
          o("laptop_bag", "Laptop Bag", "بکس لپ تاپ", "د لپټاپ بکس"),
          o("stand", "Stand", "ستند", "سټنډ"),
          OTHER,
        ],
      },
      {
        key: "brand", type: "select",
        labels: L("Brand", "برند", "برنډ"),
        options: [m("Logitech"), m("A4Tech"), m("Razer"), m("HP"), m("Dell"), OTHER],
        allowOther: true,
      },
      {
        key: "connection", type: "select",
        labels: L("Connection", "اتصال", "اتصال"),
        options: [
          o("wired", "Wired", "سیم دار", "سیم لرونکی"),
          o("wireless", "Wireless", "بی سیم", "بې سیمه"),
          o("bluetooth", "Bluetooth", "بلوتوث", "بلوتوث"),
        ],
      },
      {
        key: "condition", type: "select", required: true,
        labels: L("Condition", "حالت", "حالت"),
        options: CONDITION_SIMPLE,
      },
      locationField,
    ],
    features: [
      { key: "rgb", labels: L("RGB Light", "RGB لایت دارد", "RGB رڼا لري") },
      { key: "gaming", labels: L("Gaming", "گیمینگ", "ګیمینګ") },
    ],
  },

  // ────────────────────────────────────────────
  // 22. OTHER ELECTRONICS — سایر الکترونیک
  // ────────────────────────────────────────────
  {
    id: "other-electronics",
    slug: "other-electronics",
    labels: L("Other Electronics", "سایر الکترونیک", "نور الکترونیک"),
    topCards: ["item_name", "brand", "condition"],
    fields: [
      {
        key: "item_name", type: "text", required: true,
        labels: L("Item Name", "نام جنس", "د جنس نوم"),
      },
      {
        key: "brand", type: "text",
        labels: L("Brand", "برند", "برنډ"),
      },
      conditionField(),
      locationField,
    ],
    features: [],
  },
];

// ============================================================
// LOOKUP HELPERS
// ============================================================

export const getLeafById = (id: string): LeafSubcategory | undefined => {
  const normalized = id?.trim().toLowerCase() ?? "";
  if (!normalized) return undefined;

  const aliases: Record<string, string> = {
    "tvs": "tv",
    "gaming-consoles": "game-consoles",
    "networking-equipment": "network-equipment",
    "solar-power-equipment": "solar-power",
    "phone-accessories": "mobile-accessories",
  };

  const resolvedId = aliases[normalized] ?? normalized;
  return ELECTRONICS_LEAVES.find((leaf) => leaf.id === resolvedId || leaf.slug === resolvedId);
};

export const getFieldLabel = (leaf: LeafSubcategory, key: string, lang: Lang): string =>
  leaf.fields.find((f) => f.key === key)?.labels[lang] ?? key;

export const getOptionLabel = (field: FieldDef, value: string, lang: Lang): string => {
  const all = [
    ...(field.options ?? []),
    ...Object.values(field.optionsByParent ?? {}).flat(),
  ];
  return all.find((op) => op.value === value)?.labels[lang] ?? value;
};

/** Convert Western digits to Persian/Pashto digits for fa/ps display */
export const localizeDigits = (input: string | number, lang: Lang): string => {
  const s = String(input);
  if (lang === "en") return s;
  const map: Record<string, string> = {
    "0": "۰", "1": "۱", "2": "۲", "3": "۳", "4": "۴",
    "5": "۵", "6": "۶", "7": "۷", "8": "۸", "9": "۹",
  };
  return s.replace(/[0-9]/g, (d) => map[d]);
};
import type { ListingSchemaDefinition } from "./shared";
import { firstMeaningfulText, localized, readAttributeValue, yesNo } from "./shared";

const sections = {
  summary: localized("Device Summary", "خلاصه دستگاه", "د وسیلې لنډیز"),
  hardware: localized("Hardware & Storage", "سخت افزار و ذخیره", "هارډویر او زېرمه"),
  battery: localized("Battery / Screen / Body", "بی باتری / صفحه / بدنه", "بیټرۍ / سکرین / بدن"),
  accessories: localized("Accessories & Warranty", "لوازم و گارانتی", "لوازم او تضمین"),
};

function isPhone(path: string) {
  return path.includes("/mobile-phones");
}

function isTablet(path: string) {
  return path.includes("/tablets");
}

function isLaptop(path: string) {
  return path.includes("/laptops");
}

function isTv(path: string) {
  return path.includes("/tvs");
}

function isAccessory(path: string) {
  return path.includes("/accessories") || path.includes("phone-accessories") || path.includes("computer-accessories");
}

export const mobilesElectronicsSchema: ListingSchemaDefinition = {
  key: "mobile-phones-tablets",
  rootSlugs: ["mobile-phones-tablets", "phones-electronics"],
  match: (listing) => {
    const slug = String(listing.category?.slug ?? "");
    return slug === "mobile-phones-tablets" || slug === "phones-electronics";
  },
  fields: [
    {
      key: "brand",
      label: localized("Brand", "برند", "برنډ"),
      sectionKey: "summary",
      order: 1,
      highlight: true,
      consumes: ["brand", "device_brand", "phone_brand"],
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "brand", "device_brand", "phone_brand"));
        return value ? { key: "brand", label: localized("Brand", "برند", "برنډ")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "model",
      label: localized("Model", "مدل", "ماډل"),
      sectionKey: "summary",
      order: 2,
      highlight: true,
      consumes: ["model", "device_model", "phone_model"],
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "model", "device_model", "phone_model"));
        return value ? { key: "model", label: localized("Model", "مدل", "ماډل")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "storage",
      label: localized("Storage", "حافظه", "ذخیره"),
      sectionKey: "hardware",
      order: 1,
      highlight: true,
      consumes: ["storage", "storage_size"],
      showIf: (context) => !isAccessory(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "storage", "storage_size");
        return value ? { key: "storage", label: localized("Storage", "حافظه", "ذخیره")[context.locale], value, sectionKey: "hardware" } : null;
      },
    },
    {
      key: "ram",
      label: localized("RAM", "رم", "رام"),
      sectionKey: "hardware",
      order: 2,
      highlight: true,
      consumes: ["ram"],
      showIf: (context) => !isAccessory(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "ram");
        return value ? { key: "ram", label: localized("RAM", "رم", "رام")[context.locale], value, sectionKey: "hardware" } : null;
      },
    },
    {
      key: "processor",
      label: localized("Processor", "پردازنده", "پراسیسر"),
      sectionKey: "hardware",
      order: 1,
      highlight: true,
      consumes: ["processor"],
      showIf: (context) => isLaptop(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "processor");
        return value ? { key: "processor", label: localized("Processor", "پردازنده", "پراسیسر")[context.locale], value, sectionKey: "hardware" } : null;
      },
    },
    {
      key: "graphics_card",
      label: localized("Graphics Card", "کارت گرافیک", "ګرافیک کارت"),
      sectionKey: "hardware",
      order: 3,
      showIf: (context) => isLaptop(context.path),
      consumes: ["graphics_card"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "graphics_card");
        return value ? { key: "graphics_card", label: localized("Graphics Card", "کارت گرافیک", "ګرافیک کارت")[context.locale], value, sectionKey: "hardware" } : null;
      },
    },
    {
      key: "storage_type",
      label: localized("Storage Type", "نوع ذخیره", "د زېرمه ډول"),
      sectionKey: "hardware",
      order: 4,
      showIf: (context) => isLaptop(context.path),
      consumes: ["storage_type"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "storage_type");
        return value ? { key: "storage_type", label: localized("Storage Type", "نوع ذخیره", "د زېرمه ډول")[context.locale], value, sectionKey: "hardware" } : null;
      },
    },
    {
      key: "screen_size",
      label: localized("Screen Size", "اندازه صفحه", "د سکرین اندازه"),
      sectionKey: "hardware",
      order: 5,
      highlight: true,
      consumes: ["screen_size"],
      showIf: (context) => isTablet(context.path) || isLaptop(context.path) || isTv(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "screen_size");
        return value ? { key: "screen_size", label: localized("Screen Size", "اندازه صفحه", "د سکرین اندازه")[context.locale], value, sectionKey: "hardware" } : null;
      },
    },
    {
      key: "battery_health",
      label: localized("Battery Health", "سلامت باتری", "د بیټرۍ حالت"),
      sectionKey: "battery",
      order: 1,
      showIf: (context) => isPhone(context.path) || isTablet(context.path) || isLaptop(context.path),
      consumes: ["battery_health"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "battery_health");
        return value ? { key: "battery_health", label: localized("Battery Health", "سلامت باتری", "د بیټرۍ حالت")[context.locale], value, sectionKey: "battery" } : null;
      },
    },
    {
      key: "sim_type",
      label: localized("SIM Type", "نوع سیم", "د سیم ډول"),
      sectionKey: "hardware",
      order: 6,
      showIf: (context) => isPhone(context.path) || isTablet(context.path),
      consumes: ["sim_type"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "sim_type");
        return value ? { key: "sim_type", label: localized("SIM Type", "نوع سیم", "د سیم ډول")[context.locale], value, sectionKey: "hardware" } : null;
      },
    },
    {
      key: "pta_status",
      label: localized("PTA / Registration", "ثبت / PTA", "PTA / ثبت"),
      sectionKey: "summary",
      order: 3,
      showIf: (context) => isPhone(context.path),
      consumes: ["pta_status"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "pta_status");
        return value ? { key: "pta_status", label: localized("PTA / Registration", "ثبت / PTA", "PTA / ثبت")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "smart_tv",
      label: localized("Smart TV", "تلویزیون هوشمند", "سمارټ تلویزیون"),
      sectionKey: "summary",
      order: 3,
      showIf: (context) => isTv(context.path),
      consumes: ["smart_tv"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "smart_tv");
        return value ? { key: "smart_tv", label: localized("Smart TV", "تلویزیون هوشمند", "سمارټ تلویزیون")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "resolution",
      label: localized("Resolution", "رزولوشن", "ریزولوشن"),
      sectionKey: "summary",
      order: 4,
      showIf: (context) => isTv(context.path),
      consumes: ["resolution"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "resolution");
        return value ? { key: "resolution", label: localized("Resolution", "رزولوشن", "ریزولوشن")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "wifi_sim",
      label: localized("Wi-Fi / SIM", "وای فای / سیم", "وای فای / سیم"),
      sectionKey: "summary",
      order: 4,
      showIf: (context) => isTablet(context.path),
      consumes: ["wifi_sim"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "wifi_sim");
        return value ? { key: "wifi_sim", label: localized("Wi-Fi / SIM", "وای فای / سیم", "وای فای / سیم")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "condition",
      label: localized("Condition", "حالت", "حالت"),
      sectionKey: "battery",
      order: 2,
      highlight: true,
      consumes: ["condition"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "condition");
        return value ? { key: "condition", label: localized("Condition", "حالت", "حالت")[context.locale], value, sectionKey: "battery" } : null;
      },
    },
    {
      key: "screen_condition",
      label: localized("Screen Condition", "حالت صفحه", "د سکرین حالت"),
      sectionKey: "battery",
      order: 3,
      showIf: (context) => isPhone(context.path) || isTablet(context.path) || isTv(context.path),
      consumes: ["screen_condition"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "screen_condition");
        return value ? { key: "screen_condition", label: localized("Screen Condition", "حالت صفحه", "د سکرین حالت")[context.locale], value, sectionKey: "battery" } : null;
      },
    },
    {
      key: "body_condition",
      label: localized("Body Condition", "حالت بدنه", "د بدن حالت"),
      sectionKey: "battery",
      order: 4,
      showIf: (context) => isPhone(context.path) || isTablet(context.path),
      consumes: ["body_condition"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "body_condition");
        return value ? { key: "body_condition", label: localized("Body Condition", "حالت بدنه", "د بدن حالت")[context.locale], value, sectionKey: "battery" } : null;
      },
    },
    {
      key: "repair_history",
      label: localized("Repair History", "سابقه ترمیم", "د ترمیم تاریخچه"),
      sectionKey: "battery",
      order: 5,
      showIf: (context) => isPhone(context.path) || isTablet(context.path) || isLaptop(context.path),
      consumes: ["repair_history"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "repair_history");
        return value ? { key: "repair_history", label: localized("Repair History", "سابقه ترمیم", "د ترمیم تاریخچه")[context.locale], value, sectionKey: "battery" } : null;
      },
    },
    {
      key: "face_id",
      label: localized("Face ID", "Face ID", "Face ID"),
      sectionKey: "battery",
      order: 6,
      showIf: (context) => isPhone(context.path),
      consumes: ["face_id"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "face_id");
        return value ? { key: "face_id", label: localized("Face ID", "Face ID", "Face ID")[context.locale], value, sectionKey: "battery" } : null;
      },
    },
    {
      key: "fingerprint",
      label: localized("Fingerprint", "اثر انگشت", "د ګوتې نښه"),
      sectionKey: "battery",
      order: 7,
      showIf: (context) => isPhone(context.path),
      consumes: ["fingerprint"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "fingerprint");
        return value ? { key: "fingerprint", label: localized("Fingerprint", "اثر انگشت", "د ګوتې نښه")[context.locale], value, sectionKey: "battery" } : null;
      },
    },
    {
      key: "charger",
      label: localized("Charger Included", "شارژر دارد", "چارجَر شته"),
      sectionKey: "accessories",
      order: 1,
      consumes: ["charger", "charger_included"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "charger", "charger_included");
        return value ? { key: "charger", label: localized("Charger Included", "شارژر دارد", "چارجَر شته")[context.locale], value, sectionKey: "accessories" } : null;
      },
    },
    {
      key: "box_carton",
      label: localized("Box / Carton", "جعبه / کارتن", "بکس / کارتن"),
      sectionKey: "accessories",
      order: 2,
      showIf: (context) => isPhone(context.path) || isTablet(context.path),
      consumes: ["box_carton"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "box_carton");
        return value ? { key: "box_carton", label: localized("Box / Carton", "جعبه / کارتن", "بکس / کارتن")[context.locale], value, sectionKey: "accessories" } : null;
      },
    },
    {
      key: "warranty",
      label: localized("Warranty", "گارانتی", "ګرنټي"),
      sectionKey: "accessories",
      order: 3,
      consumes: ["warranty"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "warranty");
        return value ? { key: "warranty", label: localized("Warranty", "گارانتی", "ګرنټي")[context.locale], value, sectionKey: "accessories" } : null;
      },
    },
    {
      key: "exchange_possible",
      label: localized("Exchange Possible", "تبدیل ممکن است", "د تبادلې امکان"),
      sectionKey: "accessories",
      order: 4,
      consumes: ["exchange_possible", "exchange_available"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "exchange_possible", "exchange_available");
        return value ? { key: "exchange_possible", label: localized("Exchange Possible", "تبدیل ممکن است", "د تبادلې امکان")[context.locale], value, sectionKey: "accessories" } : null;
      },
    },
    {
      key: "accessory_type",
      label: localized("Accessory Type", "نوع لوازم", "د لوازمو ډول"),
      sectionKey: "summary",
      order: 5,
      showIf: (context) => isAccessory(context.path),
      consumes: ["accessory_type"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "accessory_type");
        return value ? { key: "accessory_type", label: localized("Accessory Type", "نوع لوازم", "د لوازمو ډول")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "compatible_brand_model",
      label: localized("Compatible Brand / Model", "برند / مدل سازگار", "جوړ / ماډل چې برابر وي"),
      sectionKey: "summary",
      order: 6,
      showIf: (context) => isAccessory(context.path),
      consumes: ["compatible_brand", "compatible_model"],
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "compatible_brand", "compatible_model"));
        return value ? { key: "compatible_brand_model", label: localized("Compatible Brand / Model", "برند / مدل سازگار", "جوړ / ماډل چې برابر وي")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "original_copy",
      label: localized("Original / Copy", "اصلی / کپی", "اصلي / کاپي"),
      sectionKey: "battery",
      order: 8,
      showIf: (context) => isAccessory(context.path),
      consumes: ["original_copy"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "original_copy");
        return value ? { key: "original_copy", label: localized("Original / Copy", "اصلی / کپی", "اصلي / کاپي")[context.locale], value, sectionKey: "battery" } : null;
      },
    },
  ],
  sections: [
    { key: "summary", title: sections.summary, order: 10, fieldKeys: ["brand", "model", "pta_status", "smart_tv", "resolution", "wifi_sim", "accessory_type", "compatible_brand_model"], hideIfEmpty: true },
    { key: "hardware", title: sections.hardware, order: 20, fieldKeys: ["storage", "ram", "processor", "graphics_card", "storage_type", "screen_size", "sim_type"], hideIfEmpty: true },
    { key: "battery", title: sections.battery, order: 30, fieldKeys: ["battery_health", "condition", "screen_condition", "body_condition", "repair_history", "face_id", "fingerprint", "original_copy"], hideIfEmpty: true },
    { key: "accessories", title: sections.accessories, order: 40, fieldKeys: ["charger", "box_carton", "warranty", "exchange_possible"], hideIfEmpty: true },
  ],
  postingFields: ["brand", "model", "storage", "ram", "processor", "graphics_card", "storage_type", "screen_size", "battery_health", "sim_type", "pta_status", "smart_tv", "resolution", "wifi_sim", "condition", "screen_condition", "body_condition", "repair_history", "face_id", "fingerprint", "charger", "box_carton", "warranty", "exchange_possible", "accessory_type", "compatible_brand_model", "original_copy"],
  requiredFields: ["brand", "model", "storage", "ram", "condition", "price", "province", "district", "photos"],
  optionalFields: ["processor", "graphics_card", "storage_type", "screen_size", "battery_health", "sim_type", "pta_status", "smart_tv", "resolution", "wifi_sim", "screen_condition", "body_condition", "repair_history", "face_id", "fingerprint", "charger", "box_carton", "warranty", "exchange_possible", "accessory_type", "compatible_brand_model", "original_copy"],
  filterFields: ["brand", "model", "storage", "ram", "screen_size", "condition", "price"],
  autoFillRules: [
    { when: localized("When brand and model are selected", "وقتی برند و مدل انتخاب شد", "کله چې برنډ او ماډل وټاکل شي"), suggest: [localized("Suggest storage options", "گزینه های حافظه را پیشنهاد کن", "د زېرمه انتخابونه وړاندیز کړه"), localized("Suggest RAM options", "گزینه های رم را پیشنهاد کن", "د رام انتخابونه وړاندیز کړه"), localized("Suggest release year", "سال عرضه را پیشنهاد کن", "د خپرېدو کال وړاندیز کړه"), localized("Suggest common colors", "رنگ های رایج را پیشنهاد کن", "عام رنګونه وړاندیز کړه")] },
  ],
  safetyTips: {
    en: ["Test the device before payment.", "Check IMEI or serial if possible.", "Check battery, screen, and charging.", "Avoid advance payment.", "Meet in a safe place."],
    fa: ["قبل از پرداخت دستگاه را تست کنید.", "در صورت امکان IMEI یا سریال را بررسی کنید.", "باتری، صفحه و شارژ را بررسی کنید.", "از پیش پرداخت خودداری کنید.", "در یک محل امن ملاقات کنید."],
    ps: ["له پیسو مخکې وسیله وازمویئ.", "که ممکن وي IMEI یا سریال وګورئ.", "بیټرۍ، سکرین او چارج کول وګورئ.", "مخکې له مخکې پیسې مه ورکوئ.", "په خوندي ځای کې ووینئ."],
  },
  translationKeys: {
    sectionSummary: "listing.deviceSummary",
    sectionHardware: "listing.hardwareStorage",
    sectionBattery: "listing.batteryScreenBody",
    sectionAccessories: "listing.accessoriesWarranty",
  },
};

export const mobilesElectronicsSchemas = [mobilesElectronicsSchema];

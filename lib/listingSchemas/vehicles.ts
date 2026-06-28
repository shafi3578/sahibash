import type { ListingSchemaDefinition } from "./shared";
import { firstMeaningfulText, formatList, formatNumber, isMeaningfulValue, localized, readAttributeValue, readListingValue, yesNo } from "./shared";

const vehicleSections = {
  summary: localized("Vehicle Summary", "خلاصه وسایط", "د وسایطو لنډیز"),
  technical: localized("Technical Details", "جزئیات تخنیکی", "تخنیکي جزئیات"),
  registration: localized("Registration & Customs", "اسناد و گمرک", "ثبت او ګمرک"),
  condition: localized("Condition & Accident", "حالت و حادثه", "حالت او حادثه"),
  paint: localized("Painted / Replaced Parts", "رنگ شده / پرزه های تعویضی", "رنګ شوي / بدل شوي پرزې"),
  features: localized("Features", "امکانات", "ځانګړتیاوې"),
};

function carMatch(path: string) {
  return path.includes("/cars") || path === "vehicles/cars";
}

function motorcycleMatch(path: string) {
  return path.includes("/motorcycles");
}

function partsMatch(path: string) {
  return path.includes("vehicle-parts") || path.includes("parts-accessories") || path.includes("/parts");
}

export const vehicleSchema: ListingSchemaDefinition = {
  key: "vehicles",
  rootSlugs: ["vehicles"],
  match: (listing) => String(listing.category?.slug ?? "") === "vehicles",
  fields: [
    {
      key: "make",
      label: localized("Make / Brand", "برند / مارک", "برنډ / مارک"),
      sectionKey: "summary",
      order: 1,
      highlight: true,
      consumes: ["locked__make", "locked__brand", "vehicle_brand", "brand"],
      resolve: (context) => {
        const value = firstMeaningfulText(
          readAttributeValue(context.attributes, "locked__make", "locked__brand", "vehicle_brand", "brand"),
          readListingValue(context.listing, "vehicle_brand"),
          (context.listing.vehicle_variant as { generation?: { model?: { brand?: { name?: string } } } } | null)?.generation?.model?.brand?.name ?? null
        );
        return value ? { key: "make", label: localized("Make / Brand", "برند / مارک", "برنډ / مارک")[context.locale], value, sectionKey: "summary", autoFilled: Boolean(context.attributes.get("locked__make") || context.attributes.get("locked__brand") || context.listing.vehicle_variant_id) } : null;
      },
    },
    {
      key: "model",
      label: localized("Model", "مدل", "ماډل"),
      sectionKey: "summary",
      order: 2,
      highlight: true,
      consumes: ["locked__model", "vehicle_model"],
      resolve: (context) => {
        const value = firstMeaningfulText(
          readAttributeValue(context.attributes, "locked__model", "vehicle_model", "model"),
          readListingValue(context.listing, "vehicle_model"),
          (context.listing.vehicle_variant as { generation?: { model?: { name?: string } } } | null)?.generation?.model?.name ?? null
        );
        return value ? { key: "model", label: localized("Model", "مدل", "ماډل")[context.locale], value, sectionKey: "summary", autoFilled: Boolean(context.attributes.get("locked__model") || context.listing.vehicle_variant_id) } : null;
      },
    },
    {
      key: "series_trim",
      label: localized("Series / Trim", "سری / تریم", "سری / ټریم"),
      sectionKey: "summary",
      order: 3,
      consumes: ["locked__series", "series", "trim"],
      resolve: (context) => {
        const value = firstMeaningfulText(
          readAttributeValue(context.attributes, "locked__series", "series", "trim"),
          (context.listing.vehicle_variant as { name?: string } | null)?.name ?? null,
          (context.listing.vehicle_variant as { generation?: { name?: string } } | null)?.generation?.name ?? null
        );
        return value ? { key: "series_trim", label: localized("Series / Trim", "سری / تریم", "سری / ټریم")[context.locale], value, sectionKey: "summary", autoFilled: Boolean(context.attributes.get("locked__series") || context.listing.vehicle_variant_id) } : null;
      },
    },
    {
      key: "year",
      label: localized("Year", "سال", "کال"),
      sectionKey: "summary",
      order: 4,
      highlight: true,
      consumes: ["year", "vehicle_year"],
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "year", "vehicle_year"), readListingValue(context.listing, "vehicle_year"));
        return value ? { key: "year", label: localized("Year", "سال", "کال")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "mileage",
      label: localized("Mileage / KM", "کارکرد / کیلومتر", "چلېدنه / کیلومتر"),
      sectionKey: "summary",
      order: 5,
      highlight: true,
      consumes: ["mileage", "km"],
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "mileage", "km"), readListingValue(context.listing, "mileage"));
        return value ? { key: "mileage", label: localized("Mileage / KM", "کارکرد / کیلومتر", "چلېدنه / کیلومتر")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "fuel_type",
      label: localized("Fuel Type", "نوع سوخت", "د تېلو ډول"),
      sectionKey: "technical",
      order: 1,
      highlight: true,
      consumes: ["locked__fuel_type", "fuel_type"],
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "locked__fuel_type", "fuel_type"), (context.listing.vehicle_variant as { fuel_type?: string } | null)?.fuel_type ?? null);
        return value ? { key: "fuel_type", label: localized("Fuel Type", "نوع سوخت", "د تېلو ډول")[context.locale], value, sectionKey: "technical", autoFilled: Boolean(context.attributes.get("locked__fuel_type") || context.listing.vehicle_variant_id) } : null;
      },
    },
    {
      key: "transmission",
      label: localized("Transmission", "گیربکس", "ګیربکس"),
      sectionKey: "technical",
      order: 2,
      highlight: true,
      consumes: ["locked__transmission", "locked__gear", "transmission", "gear"],
      resolve: (context) => {
        const value = firstMeaningfulText(
          readAttributeValue(context.attributes, "locked__transmission", "locked__gear", "transmission", "gear"),
          (context.listing.vehicle_variant as { transmission?: string } | null)?.transmission ?? null
        );
        return value ? { key: "transmission", label: localized("Transmission", "گیربکس", "ګیربکس")[context.locale], value, sectionKey: "technical", autoFilled: Boolean(context.attributes.get("locked__transmission") || context.attributes.get("locked__gear") || context.listing.vehicle_variant_id) } : null;
      },
    },
    {
      key: "engine_size",
      label: localized("Engine Size", "حجم انجن", "د انجن اندازه"),
      sectionKey: "technical",
      order: 3,
      consumes: ["locked__engine_capacity", "engine_capacity", "engine_size"],
      resolve: (context) => {
        const value = firstMeaningfulText(
          readAttributeValue(context.attributes, "locked__engine_capacity", "engine_capacity", "engine_size"),
          (context.listing.vehicle_variant as { engine_capacity?: string; engine_size?: string } | null)?.engine_capacity ?? null,
          (context.listing.vehicle_variant as { engine_size?: string } | null)?.engine_size ?? null
        );
        return value ? { key: "engine_size", label: localized("Engine Size", "حجم انجن", "د انجن اندازه")[context.locale], value, sectionKey: "technical", autoFilled: Boolean(context.attributes.get("locked__engine_capacity") || context.listing.vehicle_variant_id) } : null;
      },
    },
    {
      key: "body_type",
      label: localized("Body Type", "نوع بدنه", "د موټر ډول"),
      sectionKey: "technical",
      order: 4,
      consumes: ["locked__body_type", "body_type"],
      showIf: (context) => carMatch(context.path),
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "locked__body_type", "body_type"), (context.listing.vehicle_variant as { body_type?: string } | null)?.body_type ?? null);
        return value ? { key: "body_type", label: localized("Body Type", "نوع بدنه", "د موټر ډول")[context.locale], value, sectionKey: "technical", autoFilled: Boolean(context.attributes.get("locked__body_type") || context.listing.vehicle_variant_id) } : null;
      },
    },
    {
      key: "doors",
      label: localized("Doors", "دروازه ها", "دروازې"),
      sectionKey: "technical",
      order: 5,
      consumes: ["doors"],
      showIf: (context) => carMatch(context.path),
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "doors"), (context.listing.vehicle_variant as { doors?: number } | null)?.doors ?? null);
        return value ? { key: "doors", label: localized("Doors", "دروازه ها", "دروازې")[context.locale], value, sectionKey: "technical" } : null;
      },
    },
    {
      key: "seats",
      label: localized("Seats", "صندلی", "څوکۍ"),
      sectionKey: "technical",
      order: 6,
      consumes: ["seats"],
      showIf: (context) => carMatch(context.path),
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "seats"), (context.listing.vehicle_variant as { seats?: number } | null)?.seats ?? null);
        return value ? { key: "seats", label: localized("Seats", "صندلی", "څوکۍ")[context.locale], value, sectionKey: "technical" } : null;
      },
    },
    {
      key: "color",
      label: localized("Color", "رنگ", "رنګ"),
      sectionKey: "technical",
      order: 7,
      consumes: ["color"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "color");
        return value ? { key: "color", label: localized("Color", "رنگ", "رنګ")[context.locale], value, sectionKey: "technical" } : null;
      },
    },
    {
      key: "condition",
      label: localized("Condition", "حالت", "حالت"),
      sectionKey: "condition",
      order: 1,
      highlight: true,
      consumes: ["condition", "vehicle_status"],
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "condition", "vehicle_status"), readListingValue(context.listing, "vehicle_status"));
        return value ? { key: "condition", label: localized("Condition", "حالت", "حالت")[context.locale], value, sectionKey: "condition" } : null;
      },
    },
    {
      key: "customs_status",
      label: localized("Customs / Clearance", "گمرک / تصفیه", "ګمرک / تصفیه"),
      sectionKey: "registration",
      order: 1,
      consumes: ["customs_status", "clearance_status"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "customs_status", "clearance_status");
        return value ? { key: "customs_status", label: localized("Customs / Clearance", "گمرک / تصفیه", "ګمرک / تصفیه")[context.locale], value, sectionKey: "registration" } : null;
      },
    },
    {
      key: "plate_status",
      label: localized("Plate / Registration", "پلیت / ثبت", "پلېټ / ثبت"),
      sectionKey: "registration",
      order: 2,
      consumes: ["plate_status", "registration_status"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "plate_status", "registration_status");
        return value ? { key: "plate_status", label: localized("Plate / Registration", "پلیت / ثبت", "پلېټ / ثبت")[context.locale], value, sectionKey: "registration" } : null;
      },
    },
    {
      key: "seller_type",
      label: localized("Seller Type", "نوع فروشنده", "د پلورونکي ډول"),
      sectionKey: "registration",
      order: 3,
      consumes: ["seller_type"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "seller_type");
        return value ? { key: "seller_type", label: localized("Seller Type", "نوع فروشنده", "د پلورونکي ډول")[context.locale], value, sectionKey: "registration" } : null;
      },
    },
    {
      key: "exchange",
      label: localized("Exchange Possible", "تبدیل ممکن است", "د تبادلې امکان"),
      sectionKey: "condition",
      order: 2,
      consumes: ["exchange_available"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "exchange_available");
        return value ? { key: "exchange", label: localized("Exchange Possible", "تبدیل ممکن است", "د تبادلې امکان")[context.locale], value, sectionKey: "condition" } : null;
      },
    },
    {
      key: "accident_status",
      label: localized("Accident Status", "وضعیت حادثه", "د حادثې حالت"),
      sectionKey: "condition",
      order: 3,
      consumes: ["accident_status", "salvage_record"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "accident_status", "salvage_record");
        return value ? { key: "accident_status", label: localized("Accident Status", "وضعیت حادثه", "د حادثې حالت")[context.locale], value, sectionKey: "condition" } : null;
      },
    },
    {
      key: "paint_parts",
      label: localized("Painted / Replaced Parts", "پرزه های رنگ شده / تعویضی", "رنګ شوي / بدل شوي پرزې"),
      sectionKey: "paint",
      order: 1,
      showIf: (context) => carMatch(context.path),
      resolve: (context) => {
        const damage = context.listing.vehicle_damage as { vehicle_damage_parts?: Array<{ part_label?: string; condition?: string }> } | null;
        const parts = (damage?.vehicle_damage_parts ?? [])
          .map((part) => [part.part_label, part.condition].filter(Boolean).join(" - "))
          .filter((part) => isMeaningfulValue(part));
        return parts.length > 0 ? { key: "paint_parts", label: localized("Painted / Replaced Parts", "پرزه های رنگ شده / تعویضی", "رنګ شوي / بدل شوي پرزې")[context.locale], value: parts, sectionKey: "paint", autoFilled: false } : null;
      },
    },
    {
      key: "features",
      label: localized("Features", "امکانات", "ځانګړتیاوې"),
      sectionKey: "features",
      order: 1,
      showIf: (context) => carMatch(context.path) || motorcycleMatch(context.path),
      resolve: (context) => {
        const selected = (context.listing.vehicle_features ?? [])
          .map((item) => item.vehicle_feature?.name ?? null)
          .filter((item): item is string => Boolean(item) && isMeaningfulValue(item));
        return selected.length > 0 ? { key: "features", label: localized("Features", "امکانات", "ځانګړتیاوې")[context.locale], value: selected, sectionKey: "features" } : null;
      },
    },
    {
      key: "engine_cc",
      label: localized("Engine CC", "حجم انجن (CC)", "د انجن سي سي"),
      sectionKey: "technical",
      order: 8,
      consumes: ["engine_cc", "engine_capacity"],
      showIf: (context) => motorcycleMatch(context.path),
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "engine_cc", "engine_capacity"), (context.listing.vehicle_variant as { engine_capacity?: string } | null)?.engine_capacity ?? null);
        return value ? { key: "engine_cc", label: localized("Engine CC", "حجم انجن (CC)", "د انجن سي سي")[context.locale], value, sectionKey: "technical" } : null;
      },
    },
    {
      key: "documents",
      label: localized("Documents", "اسناد", "اسناد"),
      sectionKey: "registration",
      order: 4,
      consumes: ["documents", "registration_documents"],
      showIf: (context) => motorcycleMatch(context.path) || partsMatch(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "documents", "registration_documents");
        return value ? { key: "documents", label: localized("Documents", "اسناد", "اسناد")[context.locale], value, sectionKey: "registration" } : null;
      },
    },
    {
      key: "part_type",
      label: localized("Part Type", "نوع پرزه", "د پرزې ډول"),
      sectionKey: "summary",
      order: 1,
      showIf: (context) => partsMatch(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "part_type", "vehicle_part_type");
        return value ? { key: "part_type", label: localized("Part Type", "نوع پرزه", "د پرزې ډول")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "compatible_brand_model",
      label: localized("Compatible Brand / Model", "برند / مدل سازگار", "جوړ / ماډل چې برابر وي"),
      sectionKey: "technical",
      order: 1,
      showIf: (context) => partsMatch(context.path),
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "compatible_brand", "compatible_model", "compatible_brand_model"));
        return value ? { key: "compatible_brand_model", label: localized("Compatible Brand / Model", "برند / مدل سازگار", "جوړ / ماډل چې برابر وي")[context.locale], value, sectionKey: "technical" } : null;
      },
    },
    {
      key: "original_aftermarket",
      label: localized("Original / Aftermarket", "اصلی / غیر اصلی", "اصلي / غیر اصلي"),
      sectionKey: "condition",
      order: 1,
      showIf: (context) => partsMatch(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "original_aftermarket", "part_origin");
        return value ? { key: "original_aftermarket", label: localized("Original / Aftermarket", "اصلی / غیر اصلی", "اصلي / غیر اصلي")[context.locale], value, sectionKey: "condition" } : null;
      },
    },
    {
      key: "warranty",
      label: localized("Warranty", "گارانتی", "ګرنټي"),
      sectionKey: "condition",
      order: 4,
      consumes: ["warranty"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "warranty");
        return value ? { key: "warranty", label: localized("Warranty", "گارانتی", "ګرنټي")[context.locale], value, sectionKey: "condition" } : null;
      },
    },
  ],
  sections: [
    { key: "summary", title: vehicleSections.summary, order: 10, fieldKeys: ["make", "model", "series_trim", "year", "mileage"], hideIfEmpty: true },
    { key: "technical", title: vehicleSections.technical, order: 20, fieldKeys: ["fuel_type", "transmission", "engine_size", "body_type", "doors", "seats", "color", "engine_cc"], hideIfEmpty: true },
    { key: "registration", title: vehicleSections.registration, order: 30, fieldKeys: ["customs_status", "plate_status", "seller_type", "documents"], hideIfEmpty: true },
    { key: "condition", title: vehicleSections.condition, order: 40, fieldKeys: ["condition", "exchange", "accident_status", "warranty"], hideIfEmpty: true },
    { key: "paint", title: vehicleSections.paint, order: 50, fieldKeys: ["paint_parts"], hideIfEmpty: true },
    { key: "features", title: vehicleSections.features, order: 60, fieldKeys: ["features"], hideIfEmpty: true },
  ],
  postingFields: [
    "make",
    "model",
    "series_trim",
    "year",
    "mileage",
    "fuel_type",
    "transmission",
    "engine_size",
    "body_type",
    "color",
    "condition",
    "customs_status",
    "plate_status",
    "seller_type",
    "exchange",
    "accident_status",
    "warranty",
  ],
  requiredFields: ["title", "price", "province", "district", "make", "model", "year", "mileage", "fuel_type", "transmission", "condition", "photos"],
  optionalFields: ["series_trim", "engine_size", "body_type", "color", "customs_status", "plate_status", "seller_type", "exchange", "accident_status", "warranty"],
  filterFields: ["make", "model", "year", "mileage", "fuel_type", "transmission", "body_type", "color", "condition", "seller_type", "exchange"],
  autoFillRules: [
    { when: localized("When make, model, and year are selected", "وقتی برند، مدل و سال انتخاب شد", "کله چې برنډ، ماډل او کال وټاکل شي"), suggest: [localized("Suggest body type", "نوع بدنه را پیشنهاد کن", "د موټر ډول وړاندیز کړه"), localized("Suggest fuel type", "نوع سوخت را پیشنهاد کن", "د تېلو ډول وړاندیز کړه"), localized("Suggest transmission", "گیربکس را پیشنهاد کن", "ګیربکس وړاندیز کړه"), localized("Suggest engine size", "حجم انجن را پیشنهاد کن", "د انجن اندازه وړاندیز کړه"), localized("Suggest common series / trim", "سری / تریم رایج را پیشنهاد کن", "عامه سری / ټریم وړاندیز کړه")] },
  ],
  safetyTips: {
    en: ["Do not pay before seeing the vehicle.", "Check registration documents.", "Confirm ownership before payment.", "Meet in a safe public place.", "Check customs clearance if imported."],
    fa: ["قبل از دیدن موتر پول نپردازید.", "اسناد ثبت را بررسی کنید.", "مالکیت را قبل از پرداخت تایید کنید.", "در محل عمومی امن ملاقات کنید.", "در صورت وارداتی بودن، تصفیه گمرکی را بررسی کنید."],
    ps: ["له لیدلو مخکې پیسې مه ورکوئ.", "د ثبت اسناد وګورئ.", "له پیسو مخکې مالکیت تایید کړئ.", "په خوندي عامه ځای کې ووینئ.", "که وارد وي، د ګمرک تصفیه وګورئ."],
  },
  translationKeys: {
    sectionSummary: "listing.vehicleSummary",
    sectionTechnical: "listing.technicalDetails",
    sectionRegistration: "listing.registrationCustoms",
    sectionCondition: "listing.conditionAccident",
    sectionPaint: "listing.paintParts",
    sectionFeatures: "listing.features",
  },
};

export const vehicleSchemas = [vehicleSchema];

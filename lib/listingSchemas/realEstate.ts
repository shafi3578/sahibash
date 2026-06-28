import type { ListingSchemaDefinition } from "./shared";
import { firstMeaningfulText, localized, readAttributeValue, readListingValue, yesNo } from "./shared";

const sections = {
  summary: localized("Property Summary", "خلاصه ملک", "د ملک لنډیز"),
  size: localized("Size & Rooms", "اندازه و اتاق ها", "اندازه او خونې"),
  utilities: localized("Utilities", "تسهیلات", "اسانتیاوې"),
  access: localized("Access & Location", "دسترسی و موقعیت", "لاسرسی او موقعیت"),
  documents: localized("Documents", "اسناد", "اسناد"),
  features: localized("Features", "امکانات", "ځانګړتیاوې"),
};

function isHouse(path: string) {
  return path.includes("/houses") || path === "real-estate/houses";
}

function isApartment(path: string) {
  return path.includes("/apartments");
}

function isLand(path: string) {
  return path.includes("/land");
}

function isCommercial(path: string) {
  return path.includes("shops-commercial") || path.includes("/offices") || path.includes("/warehouses") || path.includes("commercial-property");
}

function isWarehouse(path: string) {
  return path.includes("/warehouses");
}

function isShopOffice(path: string) {
  return path.includes("shops-commercial") || path.includes("/offices") || path.includes("/shops") || path.includes("commercial-property");
}

function supportsRooms(path: string) {
  return isHouse(path) || isApartment(path) || isStudentHousing(path);
}

function isStudentHousing(path: string) {
  return path.includes("room-house-for-students") || path.includes("/dormitory");
}

function propertyTypeLabel(contextPath: string, locale: "en" | "fa" | "ps"): string {
  if (isApartment(contextPath)) {
    return locale === "fa" ? "آپارتمان" : locale === "ps" ? "اپارتمان" : "Apartment";
  }
  if (isLand(contextPath)) {
    return locale === "fa" ? "زمین" : locale === "ps" ? "ځمکه" : "Land";
  }
  if (isCommercial(contextPath)) {
    return locale === "fa" ? "ملک تجارتی" : locale === "ps" ? "سوداګریز ملکیت" : "Commercial Property";
  }
  if (isStudentHousing(contextPath)) {
    return locale === "fa" ? "استوګنځی محصلین" : locale === "ps" ? "د محصلینو استوګنځی" : "Student Housing";
  }
  return locale === "fa" ? "خانه" : locale === "ps" ? "کور" : "House";
}

export const realEstateSchema: ListingSchemaDefinition = {
  key: "real-estate",
  rootSlugs: ["real-estate"],
  match: (listing) => String(listing.category?.slug ?? "") === "real-estate",
  fields: [
    {
      key: "property_type",
      label: localized("Property Type", "نوع ملک", "د ملک ډول"),
      sectionKey: "summary",
      order: 1,
      highlight: true,
      consumes: ["property_type", "property_type_id"],
      resolve: (context) => {
        const value = firstMeaningfulText(
          readAttributeValue(context.attributes, "property_type", "property_type_id"),
          propertyTypeLabel(context.path, context.locale)
        );
        return value ? { key: "property_type", label: localized("Property Type", "نوع ملک", "د ملک ډول")[context.locale], value, sectionKey: "summary", autoFilled: true } : null;
      },
    },
    {
      key: "listing_type",
      label: localized("Sale / Rent", "فروش / کرایه", "پلور / کرايه"),
      sectionKey: "summary",
      order: 2,
      highlight: true,
      consumes: ["listing_type", "rental_type"],
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "listing_type", "rental_type"), readListingValue(context.listing, "listing_type"));
        return value ? { key: "listing_type", label: localized("Sale / Rent", "فروش / کرایه", "پلور / کرايه")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "rooms",
      label: localized("Rooms", "اتاق ها", "خونې"),
      sectionKey: "size",
      order: 1,
      highlight: true,
      consumes: ["rooms", "bedrooms"],
      showIf: (context) => supportsRooms(context.path),
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "rooms", "bedrooms"));
        return value ? { key: "rooms", label: localized("Rooms", "اتاق ها", "خونې")[context.locale], value, sectionKey: "size" } : null;
      },
    },
    {
      key: "bathrooms",
      label: localized("Bathrooms", "حمام ها", "تشنابونه"),
      sectionKey: "size",
      order: 2,
      consumes: ["bathrooms"],
      showIf: (context) => supportsRooms(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "bathrooms");
        return value ? { key: "bathrooms", label: localized("Bathrooms", "حمام ها", "تشنابونه")[context.locale], value, sectionKey: "size" } : null;
      },
    },
    {
      key: "floors",
      label: localized("Floors", "طبقات", "پوړونه"),
      sectionKey: "size",
      order: 3,
      consumes: ["floors", "floor_count"],
      showIf: (context) => supportsRooms(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "floors", "floor_count");
        return value ? { key: "floors", label: localized("Floors", "طبقات", "پوړونه")[context.locale], value, sectionKey: "size" } : null;
      },
    },
    {
      key: "floor_number",
      label: localized("Floor Number", "طبقه", "پوړ"),
      sectionKey: "size",
      order: 4,
      showIf: (context) => isApartment(context.path) || isShopOffice(context.path),
      consumes: ["floor_number", "floor"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "floor_number", "floor");
        return value ? { key: "floor_number", label: localized("Floor Number", "طبقه", "پوړ")[context.locale], value, sectionKey: "size" } : null;
      },
    },
    {
      key: "land_size",
      label: localized("Land Size", "مساحت زمین", "د ځمکې اندازه"),
      sectionKey: "size",
      order: 5,
      highlight: true,
      consumes: ["land_size", "area_size"],
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "land_size", "area_size"));
        return value ? { key: "land_size", label: localized("Land Size", "مساحت زمین", "د ځمکې اندازه")[context.locale], value, sectionKey: "size" } : null;
      },
    },
    {
      key: "building_size",
      label: localized("Building Size", "مساحت ساختمان", "د ودانۍ اندازه"),
      sectionKey: "size",
      order: 6,
      consumes: ["building_size"],
      showIf: (context) => isHouse(context.path) || isApartment(context.path) || isCommercial(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "building_size");
        return value ? { key: "building_size", label: localized("Building Size", "مساحت ساختمان", "د ودانۍ اندازه")[context.locale], value, sectionKey: "size" } : null;
      },
    },
    {
      key: "total_floors",
      label: localized("Total Building Floors", "مجموع طبقات ساختمان", "د ودانۍ ټول پوړونه"),
      sectionKey: "size",
      order: 7,
      showIf: (context) => isApartment(context.path),
      consumes: ["total_floors"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "total_floors");
        return value ? { key: "total_floors", label: localized("Total Building Floors", "مجموع طبقات ساختمان", "د ودانۍ ټول پوړونه")[context.locale], value, sectionKey: "size" } : null;
      },
    },
    {
      key: "deposit",
      label: localized("Deposit / Advance", "بیعانه / پیش پرداخت", "بیعانه / مخکینی تادیه"),
      sectionKey: "summary",
      order: 3,
      showIf: (context) => !isLand(context.path),
      consumes: ["deposit", "advance_payment"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "deposit", "advance_payment");
        return value ? { key: "deposit", label: localized("Deposit / Advance", "بیعانه / پیش پرداخت", "بیعانه / مخکینی تادیه")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "document_type",
      label: localized("Document Status", "وضعیت سند", "د سند حالت"),
      sectionKey: "documents",
      order: 1,
      highlight: true,
      consumes: ["document_type", "deed_type", "qabala", "title_deed"],
      resolve: (context) => {
        const value = firstMeaningfulText(readAttributeValue(context.attributes, "document_type", "deed_type", "qabala", "title_deed"));
        return value ? { key: "document_type", label: localized("Document Status", "وضعیت سند", "د سند حالت")[context.locale], value, sectionKey: "documents" } : null;
      },
    },
    {
      key: "road_access",
      label: localized("Road Access", "دسترسی سرک", "د سړک لاسرسی"),
      sectionKey: "access",
      order: 1,
      highlight: true,
      consumes: ["road_access"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "road_access");
        return value ? { key: "road_access", label: localized("Road Access", "دسترسی سرک", "د سړک لاسرسی")[context.locale], value, sectionKey: "access" } : null;
      },
    },
    {
      key: "distance_main_road",
      label: localized("Distance from Main Road", "فاصله از سرک اصلی", "له اصلي سړک څخه واټن"),
      sectionKey: "access",
      order: 2,
      consumes: ["distance_main_road", "distance_from_road"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "distance_main_road", "distance_from_road");
        return value ? { key: "distance_main_road", label: localized("Distance from Main Road", "فاصله از سرک اصلی", "له اصلي سړک څخه واټن")[context.locale], value, sectionKey: "access" } : null;
      },
    },
    {
      key: "water",
      label: localized("Water", "آب", "اوبه"),
      sectionKey: "utilities",
      order: 1,
      highlight: true,
      consumes: ["water"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "water");
        return value ? { key: "water", label: localized("Water", "آب", "اوبه")[context.locale], value, sectionKey: "utilities" } : null;
      },
    },
    {
      key: "electricity",
      label: localized("Electricity", "برق", "برېښنا"),
      sectionKey: "utilities",
      order: 2,
      highlight: true,
      consumes: ["electricity"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "electricity");
        return value ? { key: "electricity", label: localized("Electricity", "برق", "برېښنا")[context.locale], value, sectionKey: "utilities" } : null;
      },
    },
    {
      key: "gas",
      label: localized("Gas", "گاز", "ګاز"),
      sectionKey: "utilities",
      order: 3,
      consumes: ["gas"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "gas");
        return value ? { key: "gas", label: localized("Gas", "گاز", "ګاز")[context.locale], value, sectionKey: "utilities" } : null;
      },
    },
    {
      key: "parking",
      label: localized("Parking / Garage", "پارکنگ / گاراژ", "پارکنګ / ګیراج"),
      sectionKey: "features",
      order: 1,
      consumes: ["parking"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "parking");
        return value ? { key: "parking", label: localized("Parking / Garage", "پارکنگ / گاراژ", "پارکنګ / ګیراج")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "furnished",
      label: localized("Furnished", "مبل شده", "فرنیچر لري"),
      sectionKey: "features",
      order: 2,
      consumes: ["furnished"],
      showIf: (context) => isHouse(context.path) || isApartment(context.path) || isStudentHousing(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "furnished");
        return value ? { key: "furnished", label: localized("Furnished", "مبل شده", "فرنیچر لري")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "family_only",
      label: localized("Suitable for Family", "مناسب خانواده", "د کورنۍ لپاره مناسب"),
      sectionKey: "features",
      order: 3,
      showIf: (context) => isHouse(context.path) || isApartment(context.path) || isStudentHousing(context.path),
      consumes: ["family_only"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "family_only");
        return value ? { key: "family_only", label: localized("Suitable for Family", "مناسب خانواده", "د کورنۍ لپاره مناسب")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "security",
      label: localized("Security", "امنیت", "امنیت"),
      sectionKey: "features",
      order: 4,
      showIf: (context) => isApartment(context.path) || isCommercial(context.path) || isStudentHousing(context.path),
      consumes: ["security"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "security");
        return value ? { key: "security", label: localized("Security", "امنیت", "امنیت")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "elevator",
      label: localized("Elevator", "آسانسور", "اېلېوېټر"),
      sectionKey: "features",
      order: 5,
      showIf: (context) => isApartment(context.path),
      consumes: ["elevator"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "elevator");
        return value ? { key: "elevator", label: localized("Elevator", "آسانسور", "اېلېوېټر")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "truck_access",
      label: localized("Truck Access", "دسترسی لاری", "د لارۍ لاسرسی"),
      sectionKey: "features",
      order: 6,
      showIf: (context) => isLand(context.path) || isWarehouse(context.path),
      consumes: ["truck_access"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "truck_access");
        return value ? { key: "truck_access", label: localized("Truck Access", "دسترسی لاری", "د لارۍ لاسرسی")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "loading_access",
      label: localized("Loading Access", "دسترسی بارگیری", "د بارولو لاسرسی"),
      sectionKey: "features",
      order: 7,
      showIf: (context) => isWarehouse(context.path),
      consumes: ["loading_access"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "loading_access");
        return value ? { key: "loading_access", label: localized("Loading Access", "دسترسی بارگیری", "د بارولو لاسرسی")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "warehouse_size",
      label: localized("Warehouse Size", "اندازه گدام", "د ګودام اندازه"),
      sectionKey: "size",
      order: 8,
      showIf: (context) => isWarehouse(context.path),
      consumes: ["warehouse_size"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "warehouse_size");
        return value ? { key: "warehouse_size", label: localized("Warehouse Size", "اندازه گدام", "د ګودام اندازه")[context.locale], value, sectionKey: "size" } : null;
      },
    },
    {
      key: "ceiling_height",
      label: localized("Ceiling Height", "ارتفاع سقف", "د چت لوړوالی"),
      sectionKey: "features",
      order: 9,
      showIf: (context) => isWarehouse(context.path),
      consumes: ["ceiling_height"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "ceiling_height");
        return value ? { key: "ceiling_height", label: localized("Ceiling Height", "ارتفاع سقف", "د چت لوړوالی")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "office_room",
      label: localized("Office Room", "اتاق دفتر", "د دفتر خونه"),
      sectionKey: "features",
      order: 10,
      showIf: (context) => isWarehouse(context.path),
      consumes: ["office_room"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "office_room");
        return value ? { key: "office_room", label: localized("Office Room", "اتاق دفتر", "د دفتر خونه")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "storage_suitability",
      label: localized("Storage Suitability", "مناسب برای ذخیره", "د ذخیرې لپاره مناسب"),
      sectionKey: "features",
      order: 11,
      showIf: (context) => isWarehouse(context.path),
      consumes: ["storage_suitability"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "storage_suitability");
        return value ? { key: "storage_suitability", label: localized("Storage Suitability", "مناسب برای ذخیره", "د ذخیرې لپاره مناسب")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "frontage",
      label: localized("Frontage", "بر خیابان", "مخکینی مخ"),
      sectionKey: "access",
      order: 3,
      showIf: (context) => isShopOffice(context.path),
      consumes: ["frontage"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "frontage");
        return value ? { key: "frontage", label: localized("Frontage", "بر خیابان", "مخکینی مخ")[context.locale], value, sectionKey: "access" } : null;
      },
    },
    {
      key: "suitable_business",
      label: localized("Suitable Business", "مناسب کاروبار", "مناسب کاروبار"),
      sectionKey: "features",
      order: 12,
      showIf: (context) => isShopOffice(context.path),
      consumes: ["suitable_business"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "suitable_business");
        return value ? { key: "suitable_business", label: localized("Suitable Business", "مناسب کاروبار", "مناسب کاروبار")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "land_type",
      label: localized("Land Type", "نوع زمین", "د ځمکې ډول"),
      sectionKey: "summary",
      order: 4,
      showIf: (context) => isLand(context.path),
      consumes: ["land_type"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "land_type");
        return value ? { key: "land_type", label: localized("Land Type", "نوع زمین", "د ځمکې ډول")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "boundary_wall",
      label: localized("Boundary Wall", "دیوار احاطه", "احاطوي دېوال"),
      sectionKey: "features",
      order: 13,
      showIf: (context) => isLand(context.path),
      consumes: ["boundary_wall"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "boundary_wall");
        return value ? { key: "boundary_wall", label: localized("Boundary Wall", "دیوار احاطه", "احاطوي دېوال")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "suitable_use",
      label: localized("Suitable Use", "کاربری مناسب", "مناسب استعمال"),
      sectionKey: "features",
      order: 14,
      showIf: (context) => isLand(context.path),
      consumes: ["suitable_use"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "suitable_use");
        return value ? { key: "suitable_use", label: localized("Suitable Use", "کاربری مناسب", "مناسب استعمال")[context.locale], value, sectionKey: "features" } : null;
      },
    },
    {
      key: "yard",
      label: localized("Yard / Courtyard", "حیاط / صحن", "حویلي / انګړ"),
      sectionKey: "features",
      order: 8,
      showIf: (context) => isHouse(context.path),
      consumes: ["yard"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "yard");
        return value ? { key: "yard", label: localized("Yard / Courtyard", "حیاط / صحن", "حویلي / انګړ")[context.locale], value, sectionKey: "features" } : null;
      },
    },
  ],
  sections: [
    { key: "summary", title: sections.summary, order: 10, fieldKeys: ["property_type", "listing_type", "deposit", "land_type"], hideIfEmpty: true },
    { key: "size", title: sections.size, order: 20, fieldKeys: ["rooms", "bathrooms", "floors", "floor_number", "land_size", "building_size", "total_floors", "warehouse_size"], hideIfEmpty: true },
    { key: "utilities", title: sections.utilities, order: 30, fieldKeys: ["water", "electricity", "gas"], hideIfEmpty: true },
    { key: "access", title: sections.access, order: 40, fieldKeys: ["road_access", "distance_main_road", "frontage"], hideIfEmpty: true },
    { key: "documents", title: sections.documents, order: 50, fieldKeys: ["document_type"], hideIfEmpty: true },
    { key: "features", title: sections.features, order: 60, fieldKeys: ["parking", "furnished", "family_only", "security", "elevator", "truck_access", "loading_access", "yard", "ceiling_height", "office_room", "storage_suitability", "suitable_business", "boundary_wall", "suitable_use"], hideIfEmpty: true },
  ],
  postingFields: ["property_type", "listing_type", "deposit", "land_type", "land_size", "building_size", "rooms", "bathrooms", "floors", "floor_number", "total_floors", "warehouse_size", "document_type", "road_access", "distance_main_road", "frontage", "water", "electricity", "gas", "parking", "furnished", "family_only", "security", "elevator", "truck_access", "loading_access", "yard", "ceiling_height", "office_room", "storage_suitability", "suitable_business", "boundary_wall", "suitable_use"],
  requiredFields: ["property_type", "price", "province", "district", "document_type", "road_access", "water", "electricity", "photos", "description"],
  optionalFields: ["listing_type", "deposit", "land_type", "land_size", "building_size", "rooms", "bathrooms", "floors", "floor_number", "total_floors", "warehouse_size", "distance_main_road", "frontage", "gas", "parking", "furnished", "family_only", "security", "elevator", "truck_access", "loading_access", "yard", "ceiling_height", "office_room", "storage_suitability", "suitable_business", "boundary_wall", "suitable_use"],
  filterFields: ["property_type", "listing_type", "province", "district", "rooms", "bathrooms", "land_size", "building_size", "furnished", "parking"],
  autoFillRules: [
    { when: localized("When property type, title, or room count are detected", "وقتی نوع ملک یا عنوان تشخیص شد", "کله چې د ملک ډول یا سرلیک تشخیص شي"), suggest: [localized("Suggest rooms", "تعداد اتاق را پیشنهاد کن", "د خونو وړاندیز وکړه"), localized("Suggest property type", "نوع ملک را پیشنهاد کن", "د ملک ډول وړاندیز کړه"), localized("Suggest area", "منطقه را پیشنهاد کن", "سیمه وړاندیز کړه")] },
  ],
  safetyTips: {
    en: ["Visit the property before payment.", "Verify ownership documents.", "Do not pay deposit before confirming the property.", "Use a written agreement when possible.", "Confirm the exact location and access."],
    fa: ["قبل از پرداخت از ملک بازدید کنید.", "اسناد مالکیت را بررسی کنید.", "قبل از تایید ملک، بیعانه نپردازید.", "در صورت امکان قرارداد کتبی داشته باشید.", "موقعیت و دسترسی دقیق را تایید کنید."],
    ps: ["له پیسو مخکې ملکیت وګورئ.", "د مالکیت اسناد تایید کړئ.", "له تایید مخکې بیعانه مه ورکوئ.", "که ممکن وي لیکلی تړون وکړئ.", "دقیق موقعیت او لاسرسی تایید کړئ."],
  },
  translationKeys: {
    sectionSummary: "listing.propertySummary",
    sectionSize: "listing.sizeRooms",
    sectionUtilities: "listing.utilities",
    sectionAccess: "listing.accessLocation",
    sectionDocuments: "listing.documents",
    sectionFeatures: "listing.features",
  },
};

export const realEstateSchemas = [realEstateSchema];

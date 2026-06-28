import type { ListingSchemaDefinition } from "./shared";
import { firstMeaningfulText, localized, readAttributeValue } from "./shared";

const sections = {
  summary: localized("Item Summary", "خلاصه جنس", "د توکي لنډیز"),
  details: localized("Item Details", "جزئیات جنس", "د توکي جزئیات"),
  condition: localized("Condition & Warranty", "حالت و گارانتی", "حالت او تضمین"),
};

function isFurniture(path: string) {
  return path.includes("/furniture");
}

function isHomeAppliance(path: string) {
  return path.includes("/home-appliances") || path.includes("/heating-cooling");
}

function isTools(path: string) {
  return path.includes("/tools");
}

export const usedItemsSchema: ListingSchemaDefinition = {
  key: "second-hand-items",
  rootSlugs: ["second-hand-items"],
  match: (listing) => String(listing.category?.slug ?? "") === "second-hand-items",
  fields: [
    {
      key: "item_type",
      label: localized("Item Type", "نوع جنس", "د توکي ډول"),
      sectionKey: "summary",
      order: 1,
      highlight: true,
      consumes: ["item_type"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "item_type");
        return value ? { key: "item_type", label: localized("Item Type", "نوع جنس", "د توکي ډول")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "appliance_type",
      label: localized("Appliance Type", "نوع وسیله", "د وسیلې ډول"),
      sectionKey: "summary",
      order: 1,
      showIf: (context) => isHomeAppliance(context.path),
      consumes: ["appliance_type"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "appliance_type");
        return value ? { key: "appliance_type", label: localized("Appliance Type", "نوع وسیله", "د وسیلې ډول")[context.locale], value, sectionKey: "summary" } : null;
      },
    },
    {
      key: "brand",
      label: localized("Brand", "برند", "برنډ"),
      sectionKey: "details",
      order: 1,
      highlight: true,
      consumes: ["brand"],
      showIf: (context) => !isFurniture(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "brand");
        return value ? { key: "brand", label: localized("Brand", "برند", "برنډ")[context.locale], value, sectionKey: "details" } : null;
      },
    },
    {
      key: "model",
      label: localized("Model", "مدل", "ماډل"),
      sectionKey: "details",
      order: 2,
      consumes: ["model"],
      showIf: (context) => !isFurniture(context.path),
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "model");
        return value ? { key: "model", label: localized("Model", "مدل", "ماډل")[context.locale], value, sectionKey: "details" } : null;
      },
    },
    {
      key: "material",
      label: localized("Material", "مواد", "مواد"),
      sectionKey: "details",
      order: 3,
      showIf: (context) => isFurniture(context.path),
      consumes: ["material"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "material");
        return value ? { key: "material", label: localized("Material", "مواد", "مواد")[context.locale], value, sectionKey: "details" } : null;
      },
    },
    {
      key: "capacity",
      label: localized("Capacity", "ظرفیت", "ظرفیت"),
      sectionKey: "details",
      order: 4,
      showIf: (context) => isHomeAppliance(context.path),
      consumes: ["capacity"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "capacity");
        return value ? { key: "capacity", label: localized("Capacity", "ظرفیت", "ظرفیت")[context.locale], value, sectionKey: "details" } : null;
      },
    },
    {
      key: "size",
      label: localized("Size", "اندازه", "اندازه"),
      sectionKey: "details",
      order: 5,
      showIf: (context) => isFurniture(context.path) || isTools(context.path),
      consumes: ["size"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "size");
        return value ? { key: "size", label: localized("Size", "اندازه", "اندازه")[context.locale], value, sectionKey: "details" } : null;
      },
    },
    {
      key: "color",
      label: localized("Color", "رنگ", "رنګ"),
      sectionKey: "details",
      order: 6,
      showIf: (context) => isFurniture(context.path) || isTools(context.path),
      consumes: ["color"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "color");
        return value ? { key: "color", label: localized("Color", "رنگ", "رنګ")[context.locale], value, sectionKey: "details" } : null;
      },
    },
    {
      key: "pieces",
      label: localized("Number of Pieces", "تعداد قطعات", "د ټوټو شمېر"),
      sectionKey: "details",
      order: 7,
      showIf: (context) => isFurniture(context.path),
      consumes: ["pieces"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "pieces");
        return value ? { key: "pieces", label: localized("Number of Pieces", "تعداد قطعات", "د ټوټو شمېر")[context.locale], value, sectionKey: "details" } : null;
      },
    },
    {
      key: "condition",
      label: localized("Condition", "حالت", "حالت"),
      sectionKey: "condition",
      order: 1,
      highlight: true,
      consumes: ["condition"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "condition");
        return value ? { key: "condition", label: localized("Condition", "حالت", "حالت")[context.locale], value, sectionKey: "condition" } : null;
      },
    },
    {
      key: "power_source",
      label: localized("Power Source", "منبع انرژی", "د برېښنا سرچینه"),
      sectionKey: "condition",
      order: 2,
      showIf: (context) => isTools(context.path) || isHomeAppliance(context.path),
      consumes: ["power_source"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "power_source");
        return value ? { key: "power_source", label: localized("Power Source", "منبع انرژی", "د برېښنا سرچینه")[context.locale], value, sectionKey: "condition" } : null;
      },
    },
    {
      key: "warranty",
      label: localized("Warranty", "گارانتی", "ګرنټي"),
      sectionKey: "condition",
      order: 3,
      showIf: (context) => isTools(context.path) || isHomeAppliance(context.path) || isFurniture(context.path),
      consumes: ["warranty"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "warranty");
        return value ? { key: "warranty", label: localized("Warranty", "گارانتی", "ګرنټي")[context.locale], value, sectionKey: "condition" } : null;
      },
    },
    {
      key: "repair_history",
      label: localized("Repair History", "سابقه ترمیم", "د ترمیم تاریخچه"),
      sectionKey: "condition",
      order: 4,
      showIf: (context) => isHomeAppliance(context.path),
      consumes: ["repair_history"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "repair_history");
        return value ? { key: "repair_history", label: localized("Repair History", "سابقه ترمیم", "د ترمیم تاریخچه")[context.locale], value, sectionKey: "condition" } : null;
      },
    },
    {
      key: "delivery_possible",
      label: localized("Delivery Possible", "تحویل ممکن است", "تحویل ممکن دی"),
      sectionKey: "condition",
      order: 5,
      showIf: (context) => isFurniture(context.path),
      consumes: ["delivery_possible"],
      resolve: (context) => {
        const value = readAttributeValue(context.attributes, "delivery_possible");
        return value ? { key: "delivery_possible", label: localized("Delivery Possible", "تحویل ممکن است", "تحویل ممکن دی")[context.locale], value, sectionKey: "condition" } : null;
      },
    },
  ],
  sections: [
    { key: "summary", title: sections.summary, order: 10, fieldKeys: ["item_type", "appliance_type"], hideIfEmpty: true },
    { key: "details", title: sections.details, order: 20, fieldKeys: ["brand", "model", "material", "capacity", "size", "color", "pieces"], hideIfEmpty: true },
    { key: "condition", title: sections.condition, order: 30, fieldKeys: ["condition", "power_source", "warranty", "repair_history", "delivery_possible"], hideIfEmpty: true },
  ],
  postingFields: ["item_type", "appliance_type", "brand", "model", "material", "capacity", "size", "color", "pieces", "condition", "power_source", "warranty", "repair_history", "delivery_possible"],
  requiredFields: ["item_type", "price", "province", "district", "condition", "photos"],
  optionalFields: ["brand", "model", "material", "capacity", "size", "color", "pieces", "power_source", "warranty", "repair_history", "delivery_possible"],
  filterFields: ["item_type", "brand", "condition", "price"],
  autoFillRules: [
    { when: localized("When item type is detected from title", "وقتی نوع جنس از عنوان مشخص شد", "کله چې د توکي ډول له سرلیک څخه ښکاره شي"), suggest: [localized("Suggest material", "جنس مواد را پیشنهاد کن", "د موادو وړاندیز وکړه"), localized("Suggest size", "اندازه را پیشنهاد کن", "اندازه وړاندیز کړه"), localized("Suggest quantity", "تعداد را پیشنهاد کن", "شمېر وړاندیز کړه")] },
  ],
  safetyTips: {
    en: ["Inspect item condition before payment.", "Test appliances or tools before payment.", "Confirm delivery cost.", "Avoid paying before seeing the item."],
    fa: ["قبل از پرداخت، جنس را بررسی کنید.", "قبل از پرداخت لوازم یا ابزار را تست کنید.", "هزینه تحویل را تایید کنید.", "قبل از دیدن جنس پول نپردازید."],
    ps: ["له پیسو مخکې د توکي حالت وګورئ.", "له پیسو مخکې وسایل یا اوزار وازمویئ.", "د لېږد لګښت تایید کړئ.", "توکی تر لیدلو مخکې پیسې مه ورکوئ."],
  },
  translationKeys: {
    sectionSummary: "listing.itemSummary",
    sectionDetails: "listing.itemDetails",
    sectionCondition: "listing.conditionWarranty",
  },
};

export const usedItemsSchemas = [usedItemsSchema];

"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createListingAction, uploadListingImageAction } from "@/lib/actions/listings";
import { deleteMyDraftAction, getMyActiveDraftAction, saveListingDraftAction } from "@/lib/actions/drafts";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { localizePath } from "@/lib/i18n/routing";
import type { AppLocale, TRANSLATIONS } from "@/lib/i18n/translations";
import { parseSmartPostingText, type SmartPostingParseResult } from "@/lib/posting/smart-parser";
import { ALLOWED_LISTING_IMAGE_TYPES, MAX_LISTING_IMAGE_BYTES } from "@/lib/posting/image-validation";
import type { Category, CategoryNode } from "@/types/database";

type Dictionary = (typeof TRANSLATIONS)["en"];

type SellerProfileContact = {
  full_name: string | null;
  phone: string | null;
};

type QuickPostProps = {
  categories: Category[];
  t: Dictionary;
  locale: AppLocale;
  initialRootSlug?: string;
  sellerProfile?: SellerProfileContact | null;
};

type CandidateNode = Pick<
  CategoryNode,
  "id" | "category_id" | "parent_id" | "name" | "slug" | "path" | "level" | "display_order" | "is_active" | "is_leaf"
>;

type ProvinceOption = { id: number; name: string };
type DistrictOption = { id: number; name: string; province_id: number };

type StagedImage = {
  id: string;
  file: File;
  previewUrl: string;
  isPrimary: boolean;
};

type QuickKind =
  | "vehicle"
  | "phone"
  | "tablet"
  | "dormitory"
  | "land"
  | "housing"
  | "second_hand"
  | "general";

type DetailValue = string | boolean;

type QuickField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox";
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

type AiResponse = {
  suggestion?: {
    rootSlug?: string;
    pathSlugs?: string[];
    label?: string;
    confidence?: number;
  } | null;
  suggestedProduct?: {
    categoryNodeId?: number;
    categoryPath?: string;
    brand?: string;
    model?: string;
  } | null;
  suggestedSpecs?: Record<string, unknown> | null;
  lowConfidence?: boolean;
  message?: string | null;
};

const QUICK_DRAFT_KEY = "sahibash_quick_post_draft_v1";
const QUICK_IMAGE_DB_NAME = "sahibash_quick_post_images_v1";
const QUICK_IMAGE_STORE = "images";

const CATEGORY_ROOTS = [
  "vehicles",
  "real-estate",
  "mobile-phones-tablets",
  "second-hand-items",
] as const;

type QuickRootSlug = (typeof CATEGORY_ROOTS)[number];

type StoredQuickPostImage = {
  id: string;
  name: string;
  type: string;
  lastModified: number;
  isPrimary: boolean;
  blob: Blob;
};

const COPY = {
  en: {
    subtitle: "Photos, description, price and location. Sahibash fills the rest, and you can edit every suggestion.",
    photosTitle: "Add photos first",
    photosHint: "Camera or gallery. JPG, PNG, WebP or HEIC up to 10 MB each.",
    addPhotos: "+ Add photos",
    addMore: "Add more",
    primary: "Primary",
    remove: "Remove",
    description: "Describe what you are selling",
    descriptionPlaceholder: "Example: Toyota Corolla 2012, automatic, clean body, located in Kabul...",
    descriptionRequirement: "At least 20 characters are required before publishing.",
    title: "Suggested title",
    titleHint: "Keep it short and clear. Sahibash can generate one from your description.",
    titleTooShort: "Title is too short; Sahibash will use a safe suggested title unless you edit it.",
    price: "Price",
    amount: "Amount",
    contactForPrice: "Contact for price",
    currency: "Currency",
    transaction: "Transaction",
    forSale: "For Sale",
    forRent: "For Rent",
    forLease: "For Lease",
    monthlyRent: "Monthly rent",
    rahnGerawy: "Rahn / Gerawy?",
    gerawyAmount: "Gerawy/Rahn amount",
    optionalMonthly: "Optional monthly rent",
    dormFee: "Dormitory fee",
    landLeasePrice: "Lease price",
    location: "Location",
    province: "Province",
    district: "District / City",
    area: "Area or neighborhood (optional)",
    select: "Select",
    detected: "Sahibash detected",
    detectionHint: "Edit any chip. If detection is uncertain, choose one category.",
    chooseCategory: "What category is this ad?",
    advanced: "Advanced details (optional)",
    publish: "Publish",
    publishing: "Publishing...",
    saved: "Draft saved",
    saving: "Saving draft...",
    aiWorking: "Reading your ad...",
    aiUnavailable: "AI is optional; smart local suggestions are active.",
    missingPhotos: "Please add at least one clear photo.",
    missingDescription: "Please write at least 20 characters in the description.",
    missingPrice: "Please enter a price or choose contact for price.",
    missingCategory: "Please choose a category so buyers can find it.",
    missingLocation: "Please choose province and district/city.",
    missingContact: "Please complete your profile name and phone before publishing.",
    success: "Listing submitted for review.",
    suitableStudents: "Suitable for students",
    keepOff: "Off by default",
    noOverride: "Uses your profile contact. Sellers cannot override phone/name per ad.",
    lowConfidence: "Detection is not certain yet. Choose a category chip to continue.",
    exactHidden: "Public page shows province/district, not your exact address.",
  },
  fa: {
    subtitle: "عکس، توضیح، قیمت و موقعیت را وارد کنید. صاحباش بقیه را پیشنهاد می‌کند و شما هر مورد را ویرایش می‌کنید.",
    photosTitle: "اول عکس‌ها را اضافه کنید",
    photosHint: "از کمره یا گالری. JPG، PNG، WebP یا HEIC تا ۱۰ MB برای هر عکس.",
    addPhotos: "+ افزودن عکس",
    addMore: "افزودن بیشتر",
    primary: "اصلی",
    remove: "حذف",
    description: "توضیح دهید چه چیزی را می‌فروشید",
    descriptionPlaceholder: "مثال: تویوتا کرولا ۲۰۱۲، اتومات، بدنه پاک، موقعیت کابل...",
    descriptionRequirement: "برای نشر اعلان حداقل ۲۰ حرف لازم است.",
    title: "عنوان پیشنهادی",
    titleHint: "کوتاه و واضح بنویسید. صاحباش می‌تواند از توضیح شما عنوان بسازد.",
    titleTooShort: "عنوان بسیار کوتاه است؛ صاحباش در صورت نیاز یک عنوان مناسب می‌سازد.",
    price: "قیمت",
    amount: "مبلغ",
    contactForPrice: "قیمت به تماس",
    currency: "واحد پول",
    transaction: "نوع معامله",
    forSale: "برای فروش",
    forRent: "برای کرایه",
    forLease: "برای اجاره",
    monthlyRent: "کرایه ماهانه",
    rahnGerawy: "رهن / گروی؟",
    gerawyAmount: "مبلغ گروی/رهن",
    optionalMonthly: "کرایه ماهانه اختیاری",
    dormFee: "فیس خوابگاه",
    landLeasePrice: "قیمت اجاره",
    location: "موقعیت",
    province: "ولایت",
    district: "ولسوالی / شهر",
    area: "ناحیه یا محله (اختیاری)",
    select: "انتخاب",
    detected: "صاحباش تشخیص داد",
    detectionHint: "هر چیپ را ویرایش کنید. اگر تشخیص نامطمئن باشد، یک دسته را انتخاب کنید.",
    chooseCategory: "این اعلان مربوط کدام دسته است؟",
    advanced: "جزئیات پیشرفته (اختیاری)",
    publish: "نشر اعلان",
    publishing: "در حال نشر...",
    saved: "پیش‌نویس ذخیره شد",
    saving: "ذخیره پیش‌نویس...",
    aiWorking: "در حال خواندن اعلان...",
    aiUnavailable: "هوش مصنوعی اختیاری است؛ پیشنهادهای هوشمند محلی فعال است.",
    missingPhotos: "لطفاً حداقل یک عکس واضح اضافه کنید.",
    missingDescription: "لطفاً حداقل ۲۰ نویسه در توضیحات بنویسید.",
    missingPrice: "لطفاً قیمت را وارد کنید یا قیمت به تماس را انتخاب کنید.",
    missingCategory: "لطفاً یک دسته انتخاب کنید تا خریداران اعلان را پیدا کنند.",
    missingLocation: "لطفاً ولایت و ولسوالی/شهر را انتخاب کنید.",
    missingContact: "لطفاً نام و شماره تماس پروفایل خود را تکمیل کنید.",
    success: "اعلان برای بررسی ارسال شد.",
    suitableStudents: "مناسب برای محصلین",
    keepOff: "به‌صورت پیش‌فرض خاموش",
    noOverride: "شماره و نام از پروفایل شما استفاده می‌شود و در هر اعلان قابل تغییر نیست.",
    lowConfidence: "تشخیص هنوز مطمئن نیست. برای ادامه یک چیپ دسته را انتخاب کنید.",
    exactHidden: "در صفحه عمومی ولایت/ولسوالی نمایش داده می‌شود، نه آدرس دقیق شما.",
  },
  ps: {
    subtitle: "انځورونه، تشریح، بیه او ځای ولیکئ. صاحبش پاتې معلومات وړاندیز کوي او تاسو هر وړاندیز سمولای شئ.",
    photosTitle: "لومړی انځورونه زیات کړئ",
    photosHint: "له کمرې یا ګالري. JPG، PNG، WebP یا HEIC؛ هر انځور تر ۱۰ MB پورې.",
    addPhotos: "+ انځورونه زیات کړئ",
    addMore: "نور زیات کړئ",
    primary: "اصلي",
    remove: "لرې کول",
    description: "تشریح کړئ چې څه شی پلورئ",
    descriptionPlaceholder: "بېلګه: ټویوټا کرولا ۲۰۱۲، اتومات، پاک بدن، په کابل کې...",
    descriptionRequirement: "د خپرولو لپاره لږ تر لږه ۲۰ توري اړین دي.",
    title: "وړاندیز شوی سرلیک",
    titleHint: "لنډ او روښانه یې ولیکئ. صاحباش یې ستاسو له تشریح هم جوړولای شي.",
    titleTooShort: "سرلیک ډېر لنډ دی؛ صاحباش به که اړتیا وي مناسب سرلیک وکاروي.",
    price: "بیه",
    amount: "اندازه",
    contactForPrice: "بیه په اړیکه",
    currency: "پیسې",
    transaction: "د معاملې ډول",
    forSale: "د پلور لپاره",
    forRent: "د کرایې لپاره",
    forLease: "د اجارې لپاره",
    monthlyRent: "میاشتنۍ کرایه",
    rahnGerawy: "رهن / ګروي؟",
    gerawyAmount: "د ګروي/رهن اندازه",
    optionalMonthly: "اختیاري میاشتنی کرایه",
    dormFee: "د لیلیې فیس",
    landLeasePrice: "د اجارې بیه",
    location: "ځای",
    province: "ولایت",
    district: "ولسوالي / ښار",
    area: "سیمه یا ګاونډ (اختیاري)",
    select: "وټاکئ",
    detected: "صاحبش وموندل",
    detectionHint: "هر چیپ سمولای شئ. که ډاډ کم وي، یوه کټګوري وټاکئ.",
    chooseCategory: "دا اعلان د کومې کټګورۍ دی؟",
    advanced: "پرمختللي تفصیلات (اختیاري)",
    publish: "اعلان خپور کړئ",
    publishing: "خپرېږي...",
    saved: "مسوده خوندي شوه",
    saving: "مسوده خوندي کېږي...",
    aiWorking: "ستاسو اعلان لوستل کېږي...",
    aiUnavailable: "AI اختیاري دی؛ ځایي هوښیار وړاندیزونه فعال دي.",
    missingPhotos: "مهرباني وکړئ لږ تر لږه یو روښانه انځور زیات کړئ.",
    missingDescription: "مهرباني وکړئ لږ تر لږه ۲۰ توري په تشریح کې ولیکئ.",
    missingPrice: "مهرباني وکړئ بیه ولیکئ یا بیه په اړیکه وټاکئ.",
    missingCategory: "مهرباني وکړئ کټګوري وټاکئ چې پېرودونکي یې ومومي.",
    missingLocation: "مهرباني وکړئ ولایت او ولسوالي/ښار وټاکئ.",
    missingContact: "مهرباني وکړئ د پروفایل نوم او ټیلیفون بشپړ کړئ.",
    success: "اعلان د بیاکتنې لپاره واستول شو.",
    suitableStudents: "د محصلینو لپاره مناسب",
    keepOff: "په اصلي ډول بند",
    noOverride: "نوم او ټیلیفون ستاسو له پروفایل څخه کارېږي؛ په هر اعلان کې نه بدلېږي.",
    lowConfidence: "تشخیص لا ډېر ډاډمن نه دی. د ادامه لپاره یوه کټګوري وټاکئ.",
    exactHidden: "عامه پاڼه یوازې ولایت/ولسوالي ښيي، دقیق ادرس نه.",
  },
} as const;

const VEHICLE_FIELDS: QuickField[] = [
  { key: "make", label: "Brand / Make", type: "text", placeholder: "Toyota" },
  { key: "model", label: "Model", type: "text", placeholder: "Corolla" },
  { key: "year", label: "Year", type: "number", placeholder: "2012" },
  { key: "mileageKm", label: "Mileage (km)", type: "number" },
  { key: "transmission", label: "Transmission", type: "select", options: ["Automatic", "Manual", "CVT", "Other"] },
  { key: "fuelType", label: "Fuel", type: "select", options: ["Petrol", "Diesel", "Hybrid", "Electric", "CNG/LPG", "Other"] },
  { key: "condition", label: "Condition", type: "select", options: ["New", "Like New", "Used", "Damaged", "For Parts"] },
  { key: "color", label: "Color", type: "text" },
  { key: "documentType", label: "Documents", type: "select", options: ["Complete", "Customs", "No Document", "Other"] },
];

const PHONE_FIELDS: QuickField[] = [
  { key: "brand", label: "Brand", type: "text", placeholder: "Apple / Samsung" },
  { key: "model", label: "Model", type: "text" },
  { key: "condition", label: "Condition", type: "select", options: ["New", "Like New", "Used", "Damaged", "For Parts"] },
  { key: "storageGb", label: "Storage", type: "select", options: ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB", "Other"] },
  { key: "ramGb", label: "RAM", type: "select", options: ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB", "Other"] },
  { key: "batteryHealth", label: "Battery health %", type: "number" },
  { key: "color", label: "Color", type: "text" },
  { key: "warranty", label: "Warranty", type: "text" },
  { key: "accessories", label: "Box / charger / accessories", type: "text" },
  { key: "repair_history", label: "Repair history", type: "textarea" },
];

const DORMITORY_FIELDS: QuickField[] = [
  { key: "payment_period", label: "Payment period", type: "select", required: true, options: ["monthly", "semester", "yearly", "daily", "other"] },
  { key: "gender_allowed", label: "Gender allowed", type: "select", required: true, options: ["male", "female", "family", "everyone"] },
  { key: "room_type", label: "Room type", type: "select", required: true, options: ["shared", "private", "single", "bed_space", "other"] },
  { key: "students_per_room", label: "Students per room", type: "number", required: true },
  { key: "available_beds", label: "Available beds/spaces", type: "number" },
  { key: "internet", label: "Internet / Wi-Fi", type: "select", options: ["Available", "Not Available", "Unknown"] },
  { key: "hot_water", label: "Hot water", type: "select", options: ["Available", "Not Available", "Unknown"] },
  { key: "electricity", label: "Electricity", type: "select", options: ["24-hour", "Available", "Limited", "Not Available", "Unknown"] },
  { key: "heating", label: "Heating", type: "select", options: ["Available", "Not Available", "Unknown"] },
  { key: "meals_included", label: "Meals included", type: "select", options: ["Yes", "No", "Optional"] },
  { key: "furnished", label: "Bed / wardrobe", type: "select", options: ["Yes", "No", "Partial"] },
  { key: "security", label: "Security / guard", type: "select", options: ["Yes", "No", "Unknown"] },
  { key: "laundry", label: "Laundry", type: "select", options: ["Available", "Not Available", "Nearby"] },
  { key: "bathroom_type", label: "Bathroom", type: "select", options: ["shared", "private", "unknown"] },
  { key: "nearby_institution", label: "Nearby school/university", type: "text" },
  { key: "distance_to_university", label: "Distance to study place (km)", type: "number" },
  { key: "rules", label: "Rules / curfew", type: "textarea" },
];

const LAND_FIELDS: QuickField[] = [
  { key: "landType", label: "Land type", type: "select", options: ["Residential", "Commercial", "Agricultural", "Industrial", "Other"] },
  { key: "areaSize", label: "Land size", type: "number", required: true },
  { key: "areaUnit", label: "Size unit", type: "select", required: true, options: ["sqm", "biswa", "jerib"] },
  { key: "documentType", label: "Document type", type: "select", options: ["Title Deed", "Qabala", "Customary Document", "No Document", "Other"] },
  { key: "owner_type", label: "Owner / Agent", type: "select", options: ["Owner", "Agent", "Heirs", "Other"] },
  { key: "roadAccess", label: "Road access", type: "select", options: ["Main Road", "Side Road", "No Road Access", "Other"] },
  { key: "water", label: "Water access", type: "select", options: ["Available", "Well", "Irrigation", "Not Available", "Unknown"] },
  { key: "electricity", label: "Electricity access", type: "select", options: ["Available", "Nearby", "Not Available", "Unknown"] },
];

const HOUSING_FIELDS: QuickField[] = [
  { key: "rooms", label: "Rooms", type: "number" },
  { key: "bedrooms", label: "Bedrooms", type: "number" },
  { key: "bathrooms", label: "Bathrooms", type: "number" },
  { key: "areaSize", label: "Size / area", type: "number" },
  { key: "areaUnit", label: "Unit", type: "select", options: ["sqm", "biswa", "jerib"] },
  { key: "floor", label: "Floor", type: "number" },
  { key: "furnished", label: "Furnished", type: "select", options: ["Yes", "No", "Semi Furnished"] },
  { key: "parking", label: "Parking", type: "select", options: ["Yes", "No"] },
  { key: "water", label: "Water", type: "select", options: ["Available", "Well", "Tanker", "Not Available"] },
  { key: "electricity", label: "Electricity", type: "select", options: ["24-hour", "Available", "Limited", "Not Available"] },
  { key: "internet", label: "Internet", type: "select", options: ["Available", "Not Available", "Unknown"] },
  { key: "owner_type", label: "Owner / Agent", type: "select", options: ["Owner", "Agent", "Tenant", "Other"] },
];

const GENERAL_FIELDS: QuickField[] = [
  { key: "condition", label: "Condition", type: "select", options: ["New", "Like New", "Used", "Damaged", "For Parts"] },
  { key: "type", label: "Type", type: "text" },
  { key: "brand", label: "Brand", type: "text" },
  { key: "model", label: "Model", type: "text" },
  { key: "color", label: "Color", type: "text" },
];

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function parseNumber(value: string) {
  const normalized = value
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[٬,\s\u00A0\u202F]/g, "")
    .replace(/٫/g, ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function deriveTitle(description: string) {
  const firstLine = description.split(/\r?\n/).map((part) => part.trim()).find(Boolean) ?? "";
  const firstSentence = firstLine.split(/[.!؟?]/)[0]?.trim() ?? firstLine;
  const compact = firstSentence.replace(/\s+/g, " ").slice(0, 88).trim();
  if (compact.length >= 5) return compact;
  return "";
}

function normalizeTitleCandidate(value: string) {
  const compact = value.replace(/\s+/g, " ").trim().slice(0, 120).trim();
  return compact.length >= 5 ? compact : "";
}

function readDetailText(details: Record<string, DetailValue>, key: string) {
  const value = details[key];
  return typeof value === "string" ? value.trim() : "";
}

function isQuickRootSlug(value: string): value is QuickRootSlug {
  return CATEGORY_ROOTS.includes(value as QuickRootSlug);
}

function normalizeQuickPostRootSlug(value: string | null | undefined) {
  const rootSlug = String(value ?? "").trim();
  if (isQuickRootSlug(rootSlug)) return rootSlug;
  if (rootSlug === "electronics-computers" || rootSlug === "home-furniture-appliances") {
    return "second-hand-items";
  }
  return "";
}

function buildSuggestedQuickPostTitle({
  enteredTitle,
  description,
  kind,
  details,
  categoryLabel,
  provinceName,
  districtName,
  areaText,
  transaction,
  labels,
}: {
  enteredTitle: string;
  description: string;
  kind: QuickKind;
  details: Record<string, DetailValue>;
  categoryLabel: string;
  provinceName?: string;
  districtName?: string;
  areaText: string;
  transaction: "sale" | "rent" | "lease";
  labels: { sale: string; rent: string; lease: string; listing: string; near: string };
}) {
  const manualTitle = normalizeTitleCandidate(enteredTitle);
  if (manualTitle) return manualTitle;

  const location = normalizeTitleCandidate(areaText)
    || normalizeTitleCandidate(districtName ?? "")
    || normalizeTitleCandidate(provinceName ?? "");
  const actionLabel = transaction === "rent" ? labels.rent : transaction === "lease" ? labels.lease : labels.sale;
  const make = readDetailText(details, "make") || readDetailText(details, "brand");
  const model = readDetailText(details, "model");
  const year = readDetailText(details, "year");
  const storage = readDetailText(details, "storageGb") || readDetailText(details, "storage");
  const itemType = readDetailText(details, "type") || categoryLabel;
  const landType = readDetailText(details, "landType") || categoryLabel;
  const institution = readDetailText(details, "nearby_institution");

  const candidates = [
    kind === "vehicle" ? [year, make, model].filter(Boolean).join(" ") : "",
    kind === "phone" || kind === "tablet" ? [make, model, storage].filter(Boolean).join(" ") : "",
    kind === "dormitory" ? [categoryLabel || labels.listing, institution ? `${labels.near} ${institution}` : "", location].filter(Boolean).join(" ") : "",
    kind === "land" ? [landType, actionLabel, location].filter(Boolean).join(" ") : "",
    kind === "housing" ? [categoryLabel || labels.listing, actionLabel, location].filter(Boolean).join(" ") : "",
    kind === "second_hand" ? [itemType, make, model].filter(Boolean).join(" ") : "",
    deriveTitle(description),
    [categoryLabel || labels.listing, actionLabel].filter(Boolean).join(" "),
    labels.listing,
  ];

  for (const candidate of candidates) {
    const title = normalizeTitleCandidate(candidate);
    if (title) return title;
  }

  return "Sahibash listing";
}

function maskSellerPhone(phone: string) {
  const compact = phone.replace(/\s+/g, "");
  if (compact.length <= 7) return compact;
  return `${compact.slice(0, 5)}••••${compact.slice(-2)}`;
}

function inferKind(rootSlug: string, path: string | null | undefined, text: string): QuickKind {
  const normalizedPath = normalizeText(path ?? "");
  const normalizedText = normalizeText(text);

  if (rootSlug === "vehicles" || normalizedPath.startsWith("vehicles")) return "vehicle";
  if (rootSlug === "mobile-phones-tablets" || /phone|mobile|iphone|samsung|tablet|watch|موبایل|تلیفون|ټیلیفون/.test(normalizedText)) {
    if (/tablet|تبلت|ټابلیټ/.test(normalizedPath) || /tablet|تبلت|ټابلیټ/.test(normalizedText)) return "tablet";
    return "phone";
  }
  if (rootSlug === "real-estate" || normalizedPath.startsWith("real estate")) {
    if (/dormitory|student|hostel|لیلیه|خوابگاه|محصل/.test(`${normalizedPath} ${normalizedText}`)) return "dormitory";
    if (/land|زمین|ځمکه|زراعت|jerib|biswa/.test(`${normalizedPath} ${normalizedText}`)) return "land";
    return "housing";
  }
  if (rootSlug === "second-hand-items") return "second_hand";
  return "general";
}

function desiredCategoryTerms(kind: QuickKind, text: string) {
  const normalized = normalizeText(text);
  if (kind === "dormitory") return ["dormitory", "student", "hostel"];
  if (kind === "land") return ["land", "plot", "agricultural"];
  if (kind === "housing") {
    if (/apartment|flat|آپارتمان|اپارتمان/.test(normalized)) return ["apartment", "apartments"];
    if (/room|اتاق|کوټه|کرایی اتاق/.test(normalized)) return ["room", "rooms"];
    return ["house", "houses", "home"];
  }
  if (kind === "vehicle") {
    if (/motorcycle|motorbike|scooter|موترسایکل|موتور/.test(normalized)) return ["motorcycle", "motorcycles"];
    if (/rickshaw|زرنج|ریکشا/.test(normalized)) return ["rickshaw"];
    if (/bicycle|bike|بایسکل/.test(normalized)) return ["bicycle", "bicycles"];
    return ["car", "cars", "vehicle"];
  }
  if (kind === "tablet") return ["tablet", "tablets"];
  if (kind === "phone") return ["phone", "phones", "mobile"];
  return [];
}

function scoreCategoryNode(node: CandidateNode, kind: QuickKind, text: string, aiPath?: string | null) {
  const normalizedPath = normalizeText(node.path);
  const normalizedText = normalizeText(text);
  let score = node.level * 2 + (node.is_leaf ? 8 : 0);

  if (aiPath && node.path === aiPath) score += 100;
  for (const term of desiredCategoryTerms(kind, text)) {
    if (normalizedPath.includes(term)) score += 35;
  }

  for (const token of normalizedText.split(/\s+/).filter((item) => item.length >= 3).slice(0, 30)) {
    if (normalizedPath.includes(token)) score += 2;
  }

  if (kind === "dormitory" && /house|land|apartment/.test(normalizedPath)) score -= 20;
  if (kind === "land" && /house|apartment|room|dormitory/.test(normalizedPath)) score -= 25;
  if (kind === "housing" && /land|dormitory|student|hostel/.test(normalizedPath)) score -= 25;

  return score;
}

async function optimizeImageForAI(file: File) {
  if (!file.type.startsWith("image/")) return null;
  try {
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = objectUrl;
      });
      const maxSide = 768;
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.72));
      return blob ? new File([blob], "sahibash-ai-preview.webp", { type: "image/webp" }) : null;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } catch {
    return file.size <= 1_500_000 ? file : null;
  }
}

function openQuickPostImageDb() {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("IndexedDB is not available."));
  }

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(QUICK_IMAGE_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUICK_IMAGE_STORE)) {
        db.createObjectStore(QUICK_IMAGE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open quick-post image draft store."));
  });
}

async function persistQuickPostImages(images: StagedImage[]) {
  if (typeof indexedDB === "undefined") return;
  const db = await openQuickPostImageDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(QUICK_IMAGE_STORE, "readwrite");
      const store = transaction.objectStore(QUICK_IMAGE_STORE);
      store.clear();
      for (const image of images.slice(0, 15)) {
        store.put({
          id: image.id,
          name: image.file.name,
          type: image.file.type,
          lastModified: image.file.lastModified,
          isPrimary: image.isPrimary,
          blob: image.file,
        } satisfies StoredQuickPostImage);
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save quick-post image draft."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Could not save quick-post image draft."));
    });
  } finally {
    db.close();
  }
}

async function loadQuickPostImages() {
  if (typeof indexedDB === "undefined") return [] as StoredQuickPostImage[];
  const db = await openQuickPostImageDb();
  try {
    return await new Promise<StoredQuickPostImage[]>((resolve, reject) => {
      const transaction = db.transaction(QUICK_IMAGE_STORE, "readonly");
      const request = transaction.objectStore(QUICK_IMAGE_STORE).getAll();
      request.onsuccess = () => resolve((request.result ?? []) as StoredQuickPostImage[]);
      request.onerror = () => reject(request.error ?? new Error("Could not load quick-post image draft."));
    });
  } finally {
    db.close();
  }
}

async function clearQuickPostImages() {
  if (typeof indexedDB === "undefined") return;
  const db = await openQuickPostImageDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(QUICK_IMAGE_STORE, "readwrite");
      transaction.objectStore(QUICK_IMAGE_STORE).clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not clear quick-post image draft."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Could not clear quick-post image draft."));
    });
  } finally {
    db.close();
  }
}

function readDraftString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readDraftBoolean(value: unknown) {
  return value === true || value === "true" || value === "on" || value === "1";
}

export default function QuickPostForm({
  categories,
  t,
  locale,
  initialRootSlug = "",
  sellerProfile = null,
}: QuickPostProps) {
  void t;
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiCacheRef = useRef<Map<string, AiResponse>>(new Map());
  const [isPending, startTransition] = useTransition();
  const c = COPY[locale] ?? COPY.en;
  const direction = locale === "en" ? "ltr" : "rtl";

  const [title, setTitle] = useState("");
  const [titleTouched, setTitleTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [currency, setCurrency] = useState<"AFN" | "USD">("AFN");
  const [contactForPrice, setContactForPrice] = useState(false);
  const [transaction, setTransaction] = useState<"sale" | "rent" | "lease">("sale");
  const [rahnGerawyEnabled, setRahnGerawyEnabled] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState("");
  const [gerawyAmount, setGerawyAmount] = useState("");
  const [dormitoryFee, setDormitoryFee] = useState("");
  const [landLeasePrice, setLandLeasePrice] = useState("");
  const [suitableForStudents, setSuitableForStudents] = useState(false);
  const [details, setDetails] = useState<Record<string, DetailValue>>({});
  const [images, setImages] = useState<StagedImage[]>([]);
  const imagesRef = useRef<StagedImage[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [areaText, setAreaText] = useState("");
  const [selectedRootSlug, setSelectedRootSlug] = useState(() => normalizeQuickPostRootSlug(initialRootSlug));
  const [rootTouched, setRootTouched] = useState(Boolean(normalizeQuickPostRootSlug(initialRootSlug)));
  const [selectedCategory, setSelectedCategory] = useState<CandidateNode | null>(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [smartSuggestion, setSmartSuggestion] = useState<SmartPostingParseResult | null>(null);
  const [aiResponse, setAiResponse] = useState<AiResponse | null>(null);
  const [aiStatus, setAiStatus] = useState<"idle" | "working" | "ready" | "unavailable">("idle");
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [isPublishing, setIsPublishing] = useState(false);
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const sellerContactName = String(sellerProfile?.full_name ?? "").trim();
  const sellerContactPhone = String(sellerProfile?.phone ?? "").trim();
  const maskedSellerContactPhone = sellerContactPhone ? maskSellerPhone(sellerContactPhone) : "";

  const activeCategories = useMemo(
    () => categories.filter((category) => category.is_active !== false && !category.is_coming_soon),
    [categories]
  );

  const rootChoices = useMemo(() => {
    const allowed = new Set(CATEGORY_ROOTS);
    const primary = activeCategories.filter((category) => allowed.has(category.slug as QuickRootSlug));
    return primary.length > 0 ? primary : activeCategories;
  }, [activeCategories]);

  const selectedRoot = useMemo(
    () => activeCategories.find((category) => category.slug === selectedRootSlug) ?? null,
    [activeCategories, selectedRootSlug]
  );

  const detectionText = `${title} ${description} ${Object.values(details).join(" ")}`;
  const quickKind = useMemo(
    () => inferKind(selectedRootSlug, selectedCategory?.path, detectionText),
    [selectedRootSlug, selectedCategory?.path, detectionText]
  );
  const isDormitory = quickKind === "dormitory";
  const isLand = quickKind === "land";
  const isHousing = quickKind === "housing";
  const isRentHousing = isHousing && transaction === "rent";

  const priceMode = useMemo(() => {
    if (contactForPrice) return "contact";
    if (isDormitory) return "dormitory_fee";
    if (isLand && transaction === "lease") return "lease";
    if (isRentHousing && rahnGerawyEnabled) return "gerawy_rahn";
    if (isRentHousing) return "monthly_rent";
    return "fixed";
  }, [contactForPrice, isDormitory, isLand, isRentHousing, rahnGerawyEnabled, transaction]);

  const visibleFields = useMemo<QuickField[]>(() => {
    if (quickKind === "vehicle") return VEHICLE_FIELDS;
    if (quickKind === "phone" || quickKind === "tablet") return PHONE_FIELDS;
    if (quickKind === "dormitory") return DORMITORY_FIELDS;
    if (quickKind === "land") return LAND_FIELDS;
    if (quickKind === "housing") return HOUSING_FIELDS;
    return GENERAL_FIELDS;
  }, [quickKind]);

  const categoryLabel = selectedCategory
    ? localizeCategoryName({
        locale,
        fallbackName: selectedCategory.name,
        slug: selectedCategory.slug,
        path: selectedCategory.path,
      })
    : selectedRoot
      ? localizeCategoryName({ locale, fallbackName: selectedRoot.name, slug: selectedRoot.slug })
      : "";

  const chips = useMemo(() => {
    const items = new Map<string, string>();
    if (categoryLabel) items.set("category", categoryLabel);
    const brand = readDraftString(details.brand) || readDraftString(details.make) || smartSuggestion?.brand || aiResponse?.suggestedProduct?.brand || "";
    const model = readDraftString(details.model) || smartSuggestion?.model || aiResponse?.suggestedProduct?.model || "";
    const year = readDraftString(details.year);
    const condition = readDraftString(details.condition);
    if (brand) items.set("brand", brand);
    if (model) items.set("model", model);
    if (year) items.set("year", year);
    if (condition) items.set("condition", condition);
    if (smartSuggestion?.price && !contactForPrice) items.set("price", `${smartSuggestion.price} ${currency}`);
    if (smartSuggestion?.province) items.set("province", smartSuggestion.province);
    return Array.from(items.entries()).map(([key, value]) => ({ key, value }));
  }, [aiResponse?.suggestedProduct?.brand, aiResponse?.suggestedProduct?.model, categoryLabel, contactForPrice, currency, details, smartSuggestion]);

  const updateDetail = useCallback((key: string, value: DetailValue) => {
    setDetails((current) => ({ ...current, [key]: value }));
  }, []);

  useEffect(() => {
    imagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      for (const image of imagesRef.current) {
        URL.revokeObjectURL(image.previewUrl);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadDraft() {
      try {
        const localRaw = window.localStorage.getItem(QUICK_DRAFT_KEY);
        if (localRaw) {
          const local = JSON.parse(localRaw) as Record<string, unknown>;
          const nextDetails = (local.details && typeof local.details === "object" ? local.details : {}) as Record<string, unknown>;
          setTitle(readDraftString(local.title));
          setDescription(readDraftString(local.description));
          setPriceAmount(readDraftString(local.priceAmount));
          setMonthlyRent(readDraftString(local.monthlyRent));
          setGerawyAmount(readDraftString(local.gerawyAmount));
          setDormitoryFee(readDraftString(local.dormitoryFee));
          setLandLeasePrice(readDraftString(local.landLeasePrice));
          setCurrency(readDraftString(local.currency) === "USD" ? "USD" : "AFN");
          setContactForPrice(readDraftBoolean(local.contactForPrice));
          setTransaction(readDraftString(local.transaction) === "rent" ? "rent" : readDraftString(local.transaction) === "lease" ? "lease" : "sale");
          setRahnGerawyEnabled(readDraftBoolean(local.rahnGerawyEnabled));
          setSuitableForStudents(readDraftBoolean(local.suitableForStudents));
          setSelectedRootSlug(normalizeQuickPostRootSlug(readDraftString(local.selectedRootSlug) || initialRootSlug));
          setDetails(Object.fromEntries(Object.entries(nextDetails).map(([key, value]) => [key, typeof value === "boolean" ? value : readDraftString(value)])));
          const location = (local.location && typeof local.location === "object" ? local.location : {}) as Record<string, unknown>;
          setSelectedProvinceId(Number(location.provinceId) || null);
          setSelectedDistrictId(Number(location.districtId) || null);
          setAreaText(readDraftString(location.areaText));
        }

        const storedImages = await loadQuickPostImages().catch(() => []);
        if (!cancelled && storedImages.length > 0) {
          setImages((current) => {
            for (const image of current) {
              URL.revokeObjectURL(image.previewUrl);
            }

            const next = storedImages
              .map((stored, index) => {
                const file = new File([stored.blob], stored.name || `sahibash-photo-${index + 1}`, {
                  type: stored.type || stored.blob.type || "image/jpeg",
                  lastModified: stored.lastModified || Date.now(),
                });
                return {
                  id: stored.id || createId(),
                  file,
                  previewUrl: URL.createObjectURL(file),
                  isPrimary: Boolean(stored.isPrimary),
                };
              })
              .slice(0, 15);

            if (next.length > 0 && !next.some((image) => image.isPrimary)) {
              next[0] = { ...next[0], isPrimary: true };
            }

            return next;
          });
        }

        const serverDraft = await getMyActiveDraftAction();
        if (cancelled || !serverDraft.ok || serverDraft.draft?.posting_type !== "quick") return;
        setDraftId(serverDraft.draft.id);
        const serverDetails = serverDraft.draft.details ?? {};
        const serverCategory = serverDraft.draft.category ?? {};
        const serverLocation = serverDraft.draft.location ?? {};
        setTitle(readDraftString(serverDetails.title));
        setDescription(readDraftString(serverDetails.description));
        setPriceAmount(readDraftString(serverDetails.priceAmount));
        setMonthlyRent(readDraftString(serverDetails.monthlyRent));
        setGerawyAmount(readDraftString(serverDetails.gerawyAmount));
        setDormitoryFee(readDraftString(serverDetails.dormitoryFee));
        setLandLeasePrice(readDraftString(serverDetails.landLeasePrice));
        setCurrency(readDraftString(serverDetails.currency) === "USD" ? "USD" : "AFN");
        setContactForPrice(readDraftBoolean(serverDetails.contactForPrice));
        setTransaction(readDraftString(serverDetails.transaction) === "rent" ? "rent" : readDraftString(serverDetails.transaction) === "lease" ? "lease" : "sale");
        setRahnGerawyEnabled(readDraftBoolean(serverDetails.rahnGerawyEnabled));
        setSuitableForStudents(readDraftBoolean(serverDetails.suitableForStudents));
        setSelectedRootSlug(normalizeQuickPostRootSlug(readDraftString(serverCategory.rootSlug) || initialRootSlug));
        const nestedDetails = (serverDetails.details && typeof serverDetails.details === "object" ? serverDetails.details : {}) as Record<string, unknown>;
        setDetails(Object.fromEntries(Object.entries(nestedDetails).map(([key, value]) => [key, typeof value === "boolean" ? value : readDraftString(value)])));
        setSelectedProvinceId(Number(serverLocation.provinceId) || null);
        setSelectedDistrictId(Number(serverLocation.districtId) || null);
        setAreaText(readDraftString(serverLocation.areaText));
      } catch {
        // Local draft corruption should not block posting.
      } finally {
        if (!cancelled) setDraftLoaded(true);
      }
    }
    void loadDraft();
    return () => {
      cancelled = true;
    };
  }, [initialRootSlug]);

  useEffect(() => {
    if (!draftLoaded) return;
    void persistQuickPostImages(images).catch(() => undefined);
  }, [draftLoaded, images]);

  useEffect(() => {
    async function loadProvinces() {
      const { data } = await supabase
        .from("provinces")
        .select("id, name")
        .order("name", { ascending: true });
      setProvinceOptions((data ?? []) as ProvinceOption[]);
    }
    void loadProvinces();
  }, [supabase]);

  useEffect(() => {
    if (!selectedProvinceId) {
      return;
    }

    let cancelled = false;
    async function loadDistricts() {
      const { data } = await supabase
        .from("districts")
        .select("id, name, province_id")
        .eq("province_id", selectedProvinceId)
        .order("name", { ascending: true });
      if (!cancelled) setDistrictOptions((data ?? []) as DistrictOption[]);
    }
    void loadDistricts();
    return () => {
      cancelled = true;
    };
  }, [selectedProvinceId, supabase]);

  useEffect(() => {
    if (!draftLoaded) return;
    const localDraft = {
      title,
      description,
      priceAmount,
      currency,
      contactForPrice,
      transaction,
      rahnGerawyEnabled,
      monthlyRent,
      gerawyAmount,
      dormitoryFee,
      landLeasePrice,
      suitableForStudents,
      selectedRootSlug,
      details,
      photos: images.map((image) => ({ name: image.file.name, size: image.file.size, type: image.file.type })),
      location: { provinceId: selectedProvinceId, districtId: selectedDistrictId, areaText },
    };
    window.localStorage.setItem(QUICK_DRAFT_KEY, JSON.stringify(localDraft));

    const hasUsefulDraft =
      description.trim().length > 0
      || title.trim().length > 0
      || images.length > 0
      || Boolean(selectedRootSlug);
    if (!hasUsefulDraft) return;

    const timeout = window.setTimeout(() => {
      setDraftStatus("saving");
      void saveListingDraftAction({
        postingType: "quick",
        category: {
          rootSlug: selectedRootSlug,
          categoryNodeId: selectedCategory?.id ?? null,
          categoryPath: selectedCategory?.path ?? null,
        },
        details: localDraft,
        photos: localDraft.photos,
        location: localDraft.location,
        language: locale,
      }).then((result) => {
        if (result.ok) {
          setDraftId(result.draftId || draftId);
          setDraftStatus("saved");
        } else {
          setDraftStatus(result.statusCode === 401 ? "idle" : "error");
        }
      });
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [
    areaText,
    contactForPrice,
    currency,
    description,
    details,
    dormitoryFee,
    draftId,
    draftLoaded,
    gerawyAmount,
    images,
    landLeasePrice,
    locale,
    monthlyRent,
    priceAmount,
    rahnGerawyEnabled,
    selectedCategory?.id,
    selectedCategory?.path,
    selectedDistrictId,
    selectedProvinceId,
    selectedRootSlug,
    suitableForStudents,
    title,
    transaction,
  ]);

  const applySmartSuggestion = useCallback((suggestion: SmartPostingParseResult) => {
    setSmartSuggestion(suggestion);
    const nextRoot = normalizeQuickPostRootSlug(suggestion.categorySlug);
    if (nextRoot && !rootTouched && rootChoices.some((category) => category.slug === nextRoot)) {
      setSelectedCategory(null);
      setSelectedRootSlug(nextRoot);
    }
    if (suggestion.price && !priceAmount && !contactForPrice) setPriceAmount(String(suggestion.price));
    if (suggestion.priceType === "contact") setContactForPrice(true);
    if (suggestion.negotiable) updateDetail("negotiable", true);
    if (suggestion.brand) {
      updateDetail("brand", suggestion.brand);
      updateDetail("make", suggestion.brand);
    }
    if (suggestion.model) updateDetail("model", suggestion.model);
    if (suggestion.storage) updateDetail("storageGb", suggestion.storage.replace(/GB/i, " GB").replace(/TB/i, " TB"));
    if (suggestion.ram) updateDetail("ramGb", suggestion.ram.replace(/GB/i, " GB"));
    if (suggestion.battery) updateDetail("batteryHealth", suggestion.battery.replace("%", ""));
  }, [contactForPrice, priceAmount, rootChoices, rootTouched, updateDetail]);

  useEffect(() => {
    const meaningful = description.trim().length >= 20 || images.length > 0;
    if (!meaningful) return;
    const signature = `${title.trim()}|${description.trim().slice(0, 500)}|${images[0]?.file.name ?? ""}|${images[0]?.file.size ?? 0}`;

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      const localSuggestion = parseSmartPostingText({ title, description });
      if (!cancelled) applySmartSuggestion(localSuggestion);

      const cached = aiCacheRef.current.get(signature);
      if (cached) {
        setAiResponse(cached);
        setAiStatus("ready");
        return;
      }

      setAiStatus("working");
      void (async () => {
        const payload = new FormData();
        payload.set("title", title);
        payload.set("description", description);
        const optimizedImage = images[0] ? await optimizeImageForAI(images[0].file) : null;
        if (optimizedImage) payload.set("image", optimizedImage);
        const response = await fetch("/api/ai/category-suggestion", {
          method: "POST",
          body: payload,
        });
        const json = (await response.json().catch(() => null)) as AiResponse | null;
        if (!json || cancelled) {
          setAiStatus("unavailable");
          return;
        }
        aiCacheRef.current.set(signature, json);
        setAiResponse(json);
        setAiStatus(json.suggestion || json.suggestedProduct ? "ready" : "unavailable");
        const rootFromProduct = json.suggestedProduct?.categoryPath?.split("/")[0] ?? "";
        const rootFromSuggestion = json.suggestion?.rootSlug ?? "";
        const nextRoot = normalizeQuickPostRootSlug(rootFromProduct || rootFromSuggestion);
        if (nextRoot && !rootTouched && rootChoices.some((category) => category.slug === nextRoot)) {
          setSelectedCategory(null);
          setSelectedRootSlug(nextRoot);
        }
        if (json.suggestedProduct?.brand) updateDetail("brand", json.suggestedProduct.brand);
        if (json.suggestedProduct?.brand) updateDetail("make", json.suggestedProduct.brand);
        if (json.suggestedProduct?.model) updateDetail("model", json.suggestedProduct.model);
      })().catch(() => {
        if (!cancelled) setAiStatus("unavailable");
      });
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [applySmartSuggestion, description, images, rootChoices, rootTouched, title, updateDetail]);

  useEffect(() => {
    if (!selectedRootSlug) {
      return;
    }

    let cancelled = false;
    async function resolveCategory() {
      setCategoryLoading(true);
      const text = `${title} ${description} ${Object.values(details).join(" ")}`;
      const kind = inferKind(selectedRootSlug, selectedCategory?.path, text);
      const aiPath = aiResponse?.suggestedProduct?.categoryPath
        ?? (aiResponse?.suggestion?.pathSlugs?.length ? aiResponse.suggestion.pathSlugs.join("/") : null);

      try {
        if (aiResponse?.suggestedProduct?.categoryNodeId) {
          const { data: exact } = await supabase
            .from("category_nodes")
            .select("id, category_id, parent_id, name, slug, path, level, display_order, is_active, is_leaf")
            .eq("id", aiResponse.suggestedProduct.categoryNodeId)
            .eq("is_active", true)
            .maybeSingle();
          const exactNode = exact as CandidateNode | null;
          if (!cancelled && exactNode?.path?.startsWith(selectedRootSlug)) {
            setSelectedCategory(exactNode);
            return;
          }
        }

        const { data } = await supabase
          .from("category_nodes")
          .select("id, category_id, parent_id, name, slug, path, level, display_order, is_active, is_leaf")
          .eq("is_active", true)
          .ilike("path", `${selectedRootSlug}%`)
          .order("level", { ascending: false })
          .order("display_order", { ascending: true })
          .limit(100);

        const nodes = ((data ?? []) as CandidateNode[]).filter((node) => node.path?.startsWith(selectedRootSlug));
        const best = nodes
          .map((node) => ({ node, score: scoreCategoryNode(node, kind, text, aiPath) }))
          .sort((a, b) => b.score - a.score || b.node.level - a.node.level)[0]?.node ?? null;

        if (!cancelled) setSelectedCategory(best);
      } finally {
        if (!cancelled) setCategoryLoading(false);
      }
    }
    void resolveCategory();
    return () => {
      cancelled = true;
    };
  }, [aiResponse, description, details, selectedCategory?.path, selectedRootSlug, supabase, title]);

  const onPickFiles = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    if (selectedFiles.length === 0) return;
    const accepted = selectedFiles.filter((file) => ALLOWED_LISTING_IMAGE_TYPES.has(file.type) && file.size <= MAX_LISTING_IMAGE_BYTES);
    if (accepted.length !== selectedFiles.length) {
      setError("Only valid JPG, PNG, WebP, or HEIC images under 10 MB are accepted.");
    }
    setImages((current) => [
      ...current,
      ...accepted.map((file, index) => ({
        id: createId(),
        file,
        previewUrl: URL.createObjectURL(file),
        isPrimary: current.length === 0 && index === 0,
      })),
    ].slice(0, 15));
    event.target.value = "";
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((current) => {
      const removed = current.find((image) => image.id === id);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
      const next = current.filter((image) => image.id !== id);
      if (next.length > 0 && !next.some((image) => image.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }
      return next;
    });
  }, []);

  const setPrimary = useCallback((id: string) => {
    setImages((current) => current.map((image) => ({ ...image, isPrimary: image.id === id })));
  }, []);

  function priceValueForSubmit() {
    if (contactForPrice) return "0";
    if (priceMode === "dormitory_fee") return dormitoryFee || priceAmount;
    if (priceMode === "gerawy_rahn") return gerawyAmount || priceAmount;
    if (priceMode === "monthly_rent") return monthlyRent || priceAmount;
    if (priceMode === "lease") return landLeasePrice || priceAmount;
    return priceAmount;
  }

  function validateBeforePublish() {
    if (!sellerContactName || !sellerContactPhone) return c.missingContact;
    if (images.length === 0) return c.missingPhotos;
    if (description.trim().length < 20) return c.missingDescription;
    if (!selectedCategory) return c.missingCategory;
    if (!selectedProvinceId || !selectedDistrictId) return c.missingLocation;
    const submitPrice = parseNumber(priceValueForSubmit());
    if (!contactForPrice && (!submitPrice || submitPrice <= 0)) return c.missingPrice;
    return null;
  }

  function appendIfPresent(formData: FormData, key: string, value: unknown) {
    if (value === null || value === undefined) return;
    const text = String(value).trim();
    if (!text) return;
    formData.set(key, text);
  }

  function buildPublishFormData() {
    const formData = new FormData();
    const submitPrice = priceValueForSubmit();
    const selectedProvince = provinceOptions.find((item) => item.id === selectedProvinceId);
    const selectedDistrict = districtOptions.find((item) => item.id === selectedDistrictId);
    const resolvedTitle = buildSuggestedQuickPostTitle({
      enteredTitle: title,
      description,
      kind: quickKind,
      details,
      categoryLabel,
      provinceName: selectedProvince?.name,
      districtName: selectedDistrict?.name,
      areaText,
      transaction,
      labels: {
        sale: c.forSale,
        rent: c.forRent,
        lease: c.forLease,
        listing: categoryLabel || "Sahibash listing",
        near: locale === "fa" ? "نزدیک" : locale === "ps" ? "نږدې" : "near",
      },
    });

    formData.set("posting_mode", "quick");
    formData.set("title", resolvedTitle);
    formData.set("description", description.trim());
    formData.set("category_id", String(selectedCategory!.category_id));
    formData.set("category_node_id", String(selectedCategory!.id));
    formData.set("subcategory_id", String(selectedCategory!.id));
    formData.set("main_category_id", String(selectedCategory!.category_id));
    formData.set("child_category_id", String(selectedCategory!.id));
    formData.set("price_mode", priceMode);
    formData.set("price", contactForPrice ? "0" : submitPrice);
    formData.set("currency", currency);
    formData.set("contact_phone", sellerContactPhone);
    formData.set("contact_name", sellerContactName);
    formData.set("province_id", String(selectedProvinceId));
    formData.set("district_id", String(selectedDistrictId));
    formData.set("province", selectedProvince?.name ?? "");
    formData.set("district", selectedDistrict?.name ?? "");
    formData.set("area_text", areaText.trim());
    formData.set("location_source", "manual");
    formData.set("location_visibility", "province_district");
    formData.set("is_location_confirmed", "true");
    formData.set("negotiable", readDraftBoolean(details.negotiable) ? "true" : "false");

    if (priceMode === "monthly_rent") {
      formData.set("listing_type", "for_rent");
      formData.set("listing_purpose", "For Rent");
      formData.set("rental_type", "monthly_rent");
      formData.set("monthly_rent", monthlyRent || priceAmount);
    } else if (priceMode === "gerawy_rahn") {
      formData.set("listing_type", "for_rent");
      formData.set("listing_purpose", "For Rent");
      formData.set("rental_type", "gerawy_rahn");
      formData.set("gerawy_amount", gerawyAmount || priceAmount);
      appendIfPresent(formData, "monthly_rent", monthlyRent);
    } else if (priceMode === "dormitory_fee") {
      formData.set("listing_type", "for_rent");
      formData.set("listing_purpose", "For Rent");
      formData.set("rental_type", "dormitory_fee");
      formData.set("student_housing_type", "dormitory");
      formData.set("suitable_for_students", "true");
      formData.set("dormitory_fee", dormitoryFee || priceAmount);
    } else if (priceMode === "lease") {
      formData.set("listing_type", "for_rent");
      formData.set("listing_purpose", "For Lease");
      formData.set("land_lease_price", landLeasePrice || priceAmount);
    } else {
      formData.set("listing_type", transaction === "rent" ? "for_rent" : "for_sale");
      formData.set("listing_purpose", transaction === "rent" ? "For Rent" : "For Sale");
    }

    if (isHousing || isDormitory) {
      const housingType = isDormitory
        ? "dormitory"
        : selectedCategory?.path.includes("apartment")
          ? "apartment"
          : selectedCategory?.path.includes("room")
            ? "room"
            : "house";
      formData.set("student_housing_type", housingType);
      formData.set("suitable_for_students", isDormitory || (isRentHousing && suitableForStudents) ? "true" : "false");
    }

    if (quickKind === "vehicle") {
      formData.set("vehicle_is_manual", "true");
      appendIfPresent(formData, "vehicle_brand", details.make || details.brand);
      appendIfPresent(formData, "vehicle_model", details.model);
      appendIfPresent(formData, "vehicle_year", details.year);
      appendIfPresent(formData, "year", details.year);
      appendIfPresent(formData, "mileage", details.mileageKm);
      appendIfPresent(formData, "mileageKm", details.mileageKm);
      appendIfPresent(formData, "vehicle_type", details.type);
      appendIfPresent(formData, "color", details.color);
    }

    for (const [key, value] of Object.entries(details)) {
      appendIfPresent(formData, key, value);
    }

    return formData;
  }

  function onPublish() {
    if (isPublishing) return;
    const validationMessage = validateBeforePublish();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError(null);
    setStatus(c.publishing);
    setIsPublishing(true);
    startTransition(() => {
      void (async () => {
        const formData = buildPublishFormData();
        const result = await createListingAction(formData);
        if (!result.ok || !result.listingId) {
          setError(result.message);
          setStatus(null);
          setIsPublishing(false);
          return;
        }

        for (const image of images) {
          const upload = await uploadListingImageAction(result.listingId, image.file, image.isPrimary);
          if (!upload.ok) {
            setError(upload.message);
            setStatus(null);
            setIsPublishing(false);
            return;
          }
        }

        window.localStorage.removeItem(QUICK_DRAFT_KEY);
        await clearQuickPostImages().catch(() => undefined);
        if (draftId) await deleteMyDraftAction(draftId);
        setStatus(c.success);
        router.push(localizePath(`/listings/${result.listingId}/manage`, locale));
      })().catch((publishError) => {
        setError(publishError instanceof Error ? publishError.message : "Publishing failed.");
        setStatus(null);
        setIsPublishing(false);
      });
    });
  }

  const renderField = (field: QuickField) => {
    const value = details[field.key] ?? "";
    const commonClass = "mt-1 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

    if (field.type === "textarea") {
      return (
        <label key={field.key} className="text-sm font-semibold">
          {field.label} {field.required ? <span className="text-red-600">*</span> : null}
          <textarea
            value={String(value)}
            placeholder={field.placeholder}
            onChange={(event) => updateDetail(field.key, event.target.value)}
            className={`${commonClass} min-h-24 resize-y`}
          />
        </label>
      );
    }

    if (field.type === "select") {
      return (
        <label key={field.key} className="text-sm font-semibold">
          {field.label} {field.required ? <span className="text-red-600">*</span> : null}
          <select value={String(value)} onChange={(event) => updateDetail(field.key, event.target.value)} className={commonClass}>
            <option value="">{c.select}</option>
            {(field.options ?? []).map((option) => (
              <option key={`${field.key}-${option}`} value={option}>{option}</option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === "checkbox") {
      return (
        <label key={field.key} className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-sm font-semibold">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => updateDetail(field.key, event.target.checked)} className="h-4 w-4" />
          {field.label}
        </label>
      );
    }

    return (
      <label key={field.key} className="text-sm font-semibold">
        {field.label} {field.required ? <span className="text-red-600">*</span> : null}
        <input
          type={field.type}
          value={String(value)}
          placeholder={field.placeholder}
          onChange={(event) => updateDetail(field.key, event.target.value)}
          className={commonClass}
        />
      </label>
    );
  };

  return (
    <div data-testid="quick-post-form" dir={direction} className="mt-6 space-y-4 pb-28">
      <section className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-gradient-to-br from-[#fff7ed] via-white to-[#eef7ff] p-4 shadow-sm sm:p-6">
        <p className="text-sm font-semibold text-[var(--accent)]">Quick Post</p>
        <h2 className="mt-1 font-display text-2xl font-bold text-[var(--ink-1)]">{c.photosTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-2)]">{c.subtitle}</p>
      </section>

      <section data-testid="quick-post-photos" className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">{c.photosTitle}</h3>
            <p className="mt-1 text-xs text-[var(--ink-2)]">{c.photosHint}</p>
          </div>
          <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-bold text-[var(--ink-2)]">{images.length}/15</span>
        </div>
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" multiple className="hidden" onChange={onPickFiles} />
        {images.length === 0 ? (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 flex min-h-44 w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-[var(--line)] bg-[var(--surface-2)] px-4 text-center text-sm font-bold transition hover:border-[var(--accent)] hover:bg-white"
          >
            <span className="text-4xl">📷</span>
            <span className="mt-2">{c.addPhotos}</span>
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {images.map((image) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.previewUrl} alt={image.file.name} className="h-full w-full object-cover" />
                  {image.isPrimary ? <span className="absolute left-1 top-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">{c.primary}</span> : null}
                  <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                    <button type="button" onClick={() => setPrimary(image.id)} className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold shadow">{c.primary}</button>
                    <button type="button" onClick={() => removeImage(image.id)} className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-red-600 shadow">{c.remove}</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-2xl border-2 border-dashed border-[var(--line)] text-sm font-bold">
                {c.addMore}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
        <label data-testid="quick-post-description" className="block text-sm font-bold">
          {c.description}
          <textarea
            value={description}
            onChange={(event) => {
              const nextDescription = event.target.value;
              setDescription(nextDescription);
              if (!titleTouched) {
                const nextTitle = buildSuggestedQuickPostTitle({
                  enteredTitle: "",
                  description: nextDescription,
                  kind: quickKind,
                  details,
                  categoryLabel,
                  provinceName: provinceOptions.find((item) => item.id === selectedProvinceId)?.name,
                  districtName: districtOptions.find((item) => item.id === selectedDistrictId)?.name,
                  areaText,
                  transaction,
                  labels: {
                    sale: c.forSale,
                    rent: c.forRent,
                    lease: c.forLease,
                    listing: categoryLabel || "Sahibash listing",
                    near: locale === "fa" ? "نزدیک" : locale === "ps" ? "نږدې" : "near",
                  },
                });
                if (nextTitle) setTitle(nextTitle);
              }
            }}
            placeholder={c.descriptionPlaceholder}
            className="mt-2 min-h-40 w-full resize-y rounded-3xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-base outline-none transition focus:border-[var(--accent)] focus:bg-white focus:ring-2 focus:ring-[var(--accent)]/15"
          />
          <span className={`mt-1 block text-xs ${description.trim().length >= 20 ? "text-emerald-700" : "text-[var(--ink-2)]"}`}>
            {description.trim().length}/20 · {c.descriptionRequirement}
          </span>
        </label>
        <label className="mt-4 block text-sm font-bold">
          {c.title}
          <input
            value={title}
            maxLength={120}
            onChange={(event) => {
              setTitleTouched(true);
              setTitle(event.target.value);
            }}
            className="mt-2 w-full rounded-2xl border border-[var(--line)] px-3 py-3 text-sm outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15"
          />
          <span className={`mt-1 block text-xs ${title.trim().length > 0 && title.trim().length < 5 ? "text-amber-700" : "text-[var(--ink-2)]"}`}>
            {title.trim().length > 0 && title.trim().length < 5 ? c.titleTooShort : c.titleHint}
          </span>
        </label>
      </section>

      <section data-testid="quick-post-ai-chips" className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-display text-lg font-bold">{c.detected}</h3>
            <p className="mt-1 text-xs text-[var(--ink-2)]">{c.detectionHint}</p>
          </div>
          <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-bold text-[var(--ink-2)]">
            {aiStatus === "working" ? c.aiWorking : aiStatus === "unavailable" ? c.aiUnavailable : categoryLoading ? c.aiWorking : "AI"}
          </span>
        </div>

        {chips.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <span key={chip.key} className="rounded-full border border-[var(--line)] bg-[var(--surface-2)] px-3 py-1 text-sm font-semibold">
                {chip.value}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--ink-2)]">{c.lowConfidence}</p>
        )}

        <div className="mt-4">
          <p className="text-sm font-bold">{c.chooseCategory}</p>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            {rootChoices.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setRootTouched(true);
                  setSelectedCategory(null);
                  setSelectedRootSlug(category.slug);
                }}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold transition ${
                  selectedRootSlug === category.slug
                    ? "border-[var(--accent)] bg-[var(--accent)] text-white"
                    : "border-[var(--line)] bg-white text-[var(--ink-1)]"
                }`}
              >
                {localizeCategoryName({ locale, fallbackName: category.name, slug: category.slug })}
              </button>
            ))}
          </div>
          {categoryLabel ? (
            <p className="mt-2 text-xs font-semibold text-[var(--ink-2)]">
              {categoryLoading ? c.aiWorking : categoryLabel}
            </p>
          ) : null}
        </div>
      </section>

      <section data-testid="quick-post-price" className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
        <h3 className="font-display text-lg font-bold">{c.price}</h3>

        {(isHousing || isLand) && !contactForPrice ? (
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" onClick={() => setTransaction("sale")} className={`rounded-full border px-4 py-2 text-sm font-bold ${transaction === "sale" ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)]"}`}>
              {c.forSale}
            </button>
            {isHousing ? (
              <button type="button" onClick={() => setTransaction("rent")} className={`rounded-full border px-4 py-2 text-sm font-bold ${transaction === "rent" ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)]"}`}>
                {c.forRent}
              </button>
            ) : null}
            {isLand ? (
              <button type="button" onClick={() => setTransaction("lease")} className={`rounded-full border px-4 py-2 text-sm font-bold ${transaction === "lease" ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)]"}`}>
                {c.forLease}
              </button>
            ) : null}
          </div>
        ) : null}

        {isRentHousing && !contactForPrice ? (
          <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm font-bold">
            <span>{c.rahnGerawy} <span className="text-xs text-[var(--ink-2)]">({c.keepOff})</span></span>
            <input name="rahn_gerawy_enabled" type="checkbox" checked={rahnGerawyEnabled} onChange={(event) => setRahnGerawyEnabled(event.target.checked)} className="h-5 w-5" />
          </label>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px]">
          {contactForPrice ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm font-bold">{c.contactForPrice}</div>
          ) : priceMode === "monthly_rent" ? (
            <label className="text-sm font-bold">
              {c.monthlyRent}
              <input type="number" value={monthlyRent} onChange={(event) => setMonthlyRent(event.target.value)} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
            </label>
          ) : priceMode === "gerawy_rahn" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold">
                {c.gerawyAmount}
                <input type="number" value={gerawyAmount} onChange={(event) => setGerawyAmount(event.target.value)} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
              </label>
              <label className="text-sm font-bold">
                {c.optionalMonthly}
                <input type="number" value={monthlyRent} onChange={(event) => setMonthlyRent(event.target.value)} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
              </label>
            </div>
          ) : priceMode === "dormitory_fee" ? (
            <label className="text-sm font-bold">
              {c.dormFee}
              <input type="number" value={dormitoryFee} onChange={(event) => setDormitoryFee(event.target.value)} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
            </label>
          ) : priceMode === "lease" ? (
            <label className="text-sm font-bold">
              {c.landLeasePrice}
              <input type="number" value={landLeasePrice} onChange={(event) => setLandLeasePrice(event.target.value)} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
            </label>
          ) : (
            <label className="text-sm font-bold">
              {c.amount}
              <input type="number" value={priceAmount} onChange={(event) => setPriceAmount(event.target.value)} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
            </label>
          )}
          <label className="text-sm font-bold">
            {c.currency}
            <select value={currency} onChange={(event) => setCurrency(event.target.value === "USD" ? "USD" : "AFN")} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3">
              <option value="AFN">AFN</option>
              <option value="USD">USD</option>
            </select>
          </label>
        </div>

        <label className="mt-4 flex items-center gap-2 text-sm font-bold">
          <input name="contact_for_price" type="checkbox" checked={contactForPrice} onChange={(event) => setContactForPrice(event.target.checked)} className="h-4 w-4" />
          {c.contactForPrice}
        </label>

        {isRentHousing ? (
          <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-bold">
            <span>{c.suitableStudents} <span className="text-xs text-[var(--ink-2)]">({c.keepOff})</span></span>
            <input name="suitable_for_students" type="checkbox" checked={suitableForStudents} onChange={(event) => setSuitableForStudents(event.target.checked)} className="h-5 w-5" />
          </label>
        ) : null}
      </section>

      <section data-testid="quick-post-location" className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">{c.location}</h3>
            <p className="mt-1 text-xs text-[var(--ink-2)]">{c.exactHidden}</p>
          </div>
          <span className="rounded-full bg-[var(--surface-2)] px-3 py-1 text-xs font-bold text-[var(--ink-2)]">Privacy safe</span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">
            {c.province}
            <select
              value={selectedProvinceId ?? ""}
              onChange={(event) => {
                const nextProvinceId = event.target.value ? Number(event.target.value) : null;
                setSelectedProvinceId(nextProvinceId);
                setSelectedDistrictId(null);
                if (!nextProvinceId) setDistrictOptions([]);
              }}
              className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3"
            >
              <option value="">{c.select}</option>
              {provinceOptions.map((province) => (
                <option key={province.id} value={province.id}>{province.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold">
            {c.district}
            <select value={selectedDistrictId ?? ""} onChange={(event) => setSelectedDistrictId(event.target.value ? Number(event.target.value) : null)} disabled={!selectedProvinceId} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3 disabled:bg-[var(--surface-2)]">
              <option value="">{c.select}</option>
              {districtOptions.map((district) => (
                <option key={district.id} value={district.id}>{district.name}</option>
              ))}
            </select>
          </label>
          <label className="text-sm font-bold sm:col-span-2">
            {c.area}
            <input value={areaText} onChange={(event) => setAreaText(event.target.value)} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
          </label>
        </div>
      </section>

      <details data-testid="quick-post-advanced-details" className="rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
        <summary className="cursor-pointer font-display text-lg font-bold">{c.advanced}</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {visibleFields.map(renderField)}
          {isRentHousing && suitableForStudents ? (
            <>
              {DORMITORY_FIELDS.filter((field) => ["gender_allowed", "nearby_institution", "distance_to_university", "furnished"].includes(field.key)).map(renderField)}
            </>
          ) : null}
        </div>
      </details>

      <section className="rounded-3xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--ink-2)] shadow-sm sm:p-5">
        <p className="font-semibold text-[var(--ink-1)]">{sellerContactName || "Profile contact"}</p>
        <p className="mt-1">{maskedSellerContactPhone || c.missingContact}</p>
        <p className="mt-2">{c.noOverride}</p>
      </section>

      {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
      {status ? <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{status}</p> : null}

      <div className="fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 border-t border-[var(--line)] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,.08)] backdrop-blur lg:bottom-0">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <p className="hidden text-xs font-semibold text-[var(--ink-2)] sm:block">
            {draftStatus === "saving" ? c.saving : draftStatus === "saved" ? c.saved : ""}
          </p>
          <button
            type="button"
            onClick={onPublish}
            disabled={isPending || isPublishing}
            className="min-h-12 flex-1 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
          >
            {isPending || isPublishing ? c.publishing : c.publish}
          </button>
        </div>
      </div>
    </div>
  );
}

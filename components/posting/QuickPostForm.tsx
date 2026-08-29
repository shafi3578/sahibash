"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createListingAction, uploadListingImageAction } from "@/lib/actions/listings";
import { deleteMyDraftAction, getMyActiveDraftAction, saveListingDraftAction } from "@/lib/actions/drafts";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { localizePath } from "@/lib/i18n/routing";
import type { AppLocale, TRANSLATIONS } from "@/lib/i18n/translations";
import { parseSmartPostingText, type SmartPostingParseResult } from "@/lib/posting/smart-parser";
import { ALLOWED_LISTING_IMAGE_TYPES, MAX_LISTING_IMAGE_BYTES } from "@/lib/posting/image-validation";
import { reconcileSuggestedDetails, sanitizeSuggestedDetails, type SuggestedDetails } from "@/lib/posting/suggested-details";
import { damageCondition, damagePartLabel, defaultVehicleDamageParts, getNonOriginalVehicleDamageParts, type DamagePart } from "@/lib/vehicles/damage-report";
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
  draftOwnerId?: string | null;
};

type LocationMapPickerProps = {
  onLocationSelected: (location: { latitude: number; longitude: number; accuracy?: number }) => void;
  initialLocation?: { latitude?: number; longitude?: number; accuracy?: number };
};

type VehicleDamageDiagramProps = {
  value: DamagePart[];
  onChange: (parts: DamagePart[]) => void;
  locale?: AppLocale;
};

const LocationMapPicker = dynamic<LocationMapPickerProps>(
  () => import("@/components/location/LocationMapPicker"),
  {
    ssr: false,
    loading: () => <div className="h-32 animate-pulse rounded-2xl bg-[var(--surface-2)]" aria-hidden="true" />,
  }
);

const VehicleDamageDiagram = dynamic<VehicleDamageDiagramProps>(
  () => import("@/components/vehicles/VehicleDamageDiagram").then((mod) => mod.VehicleDamageDiagram),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-2xl bg-[var(--surface-2)]" aria-hidden="true" />,
  }
);

type CandidateNode = Pick<
  CategoryNode,
  "id" | "category_id" | "parent_id" | "name" | "slug" | "path" | "level" | "display_order" | "is_active" | "is_leaf"
>;

type ProvinceOption = { id: number; name: string };
type DistrictOption = { id: number; name: string; province_id: number };
type LocationApiOption = {
  id: number | string;
  province_id?: number | string;
  name?: string | null;
  name_en?: string | null;
};
type LocationApiResponse<T> = { success?: boolean; data?: T[] };
type QuickStep = 1 | 2;
type QuickLocationSource = "manual" | "device" | "map_pin";
type QuickLocationVisibility = "exact" | "approximate" | "province_district" | "hidden";

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

function readLocationOptionName(option: LocationApiOption) {
  return String(option.name ?? option.name_en ?? "").trim();
}

function toProvinceOption(option: LocationApiOption): ProvinceOption | null {
  const id = Number(option.id);
  const name = readLocationOptionName(option);
  return Number.isFinite(id) && name ? { id, name } : null;
}

function toDistrictOption(option: LocationApiOption): DistrictOption | null {
  const id = Number(option.id);
  const provinceId = Number(option.province_id);
  const name = readLocationOptionName(option);
  return Number.isFinite(id) && Number.isFinite(provinceId) && name
    ? { id, province_id: provinceId, name }
    : null;
}

async function fetchLocationOptions<T extends LocationApiOption>(url: string) {
  const response = await fetch(url, { headers: { Accept: "application/json" } });
  if (!response.ok) return [];
  const payload = (await response.json()) as LocationApiResponse<T>;
  return payload.success && Array.isArray(payload.data) ? payload.data : [];
}

type QuickField = {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "checkbox";
  options?: string[];
  required?: boolean;
  placeholder?: string;
};

type AiResponse = {
  source?: "gateway" | "deterministic";
  gatewayStatus?: string;
  gatewayModel?: string | null;
  suggestion?: {
    rootSlug?: string;
    pathSlugs?: string[];
    label?: string;
    confidence?: number;
  } | null;
  suggestions?: Array<{
    rootSlug?: string;
    pathSlugs?: string[];
    label?: string;
    confidence?: number;
    leafCategoryId?: number;
    pathIds?: number[];
  }>;
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
  ownerScope: string;
  name: string;
  type: string;
  lastModified: number;
  isPrimary: boolean;
  blob: Blob;
};

function quickDraftStorageKey(ownerScope: string) {
  return `${QUICK_DRAFT_KEY}:${ownerScope}`;
}

const COPY = {
  en: {
    quickPost: "Quick Post",
    stepOne: "Step 1 of 2",
    stepTwo: "Step 2 of 2",
    stepOneTitle: "Post your ad",
    stepTwoTitle: "Confirm category and details",
    subtitle: "Photos, title, description, location and price. Sahibash fills the rest, and you can edit every suggestion.",
    continue: "Continue",
    back: "Back",
    editStepOne: "Edit Step 1",
    photosTitle: "Add photos first",
    photosHint: "Camera or gallery. JPG, PNG, WebP or HEIC up to 10 MB each.",
    addPhotos: "+ Add photos",
    addMore: "Add more",
    primary: "Primary",
    remove: "Remove",
    moveEarlier: "Move earlier",
    moveLater: "Move later",
    description: "Describe what you are selling",
    descriptionPlaceholder: "Example: Toyota Corolla 2012, automatic, clean body, located in Kabul...",
    descriptionRequirement: "At least 20 characters are required before publishing.",
    title: "Title",
    titleHint: "Keep it short and clear. Sahibash may suggest a better one later, but you stay in control.",
    titleTooShort: "Add a little more detail to the title.",
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
    useCurrentLocation: "Use My Current Location",
    currentLocationHint: "We use your device location only to help set this item's location. Confirm or edit it before publishing.",
    detectingLocation: "Detecting location...",
    detectedLocation: "Detected item location",
    confirmLocation: "Use this location",
    chooseManualLocation: "Choose manually",
    gpsDenied: "Location permission was denied. You can continue by choosing manually.",
    gpsUnavailable: "We could not detect your location right now. Choose manually or set a map pin.",
    setOnMap: "Set on map",
    hideMap: "Hide map",
    mapPinSaved: "Map pin saved. Please confirm province and district.",
    locationPrivacy: "Public location privacy",
    privacyExact: "Exact map pin",
    privacyApproximate: "Approximate area (recommended)",
    privacyDistrict: "District / city only",
    privacyHidden: "Hidden",
    province: "Province",
    district: "District / City",
    area: "Area or neighborhood (optional)",
    street: "Village or street note (optional)",
    select: "Select",
    detected: "Sahibash detected",
    detectionHint: "Edit any chip. If detection is uncertain, choose one category.",
    suggestionsTitle: "Suggested categories",
    manualCategory: "Choose category manually",
    chooseCategory: "What category is this ad?",
    chooseSubcategory: "Choose the exact subcategory",
    selectedSubcategory: "Selected subcategory",
    noSubcategories: "Choose a root category to load active subcategories.",
    categoryBack: "Back one level",
    saveAndExit: "Save draft & exit",
    whatsappOptIn: "Enable WhatsApp for this listing",
    whatsappHint: "Uses your profile phone and appears only when enabled.",
    locationLookupFailed: "We could not match this point confidently. Please choose province and district manually.",
    selected: "Selected",
    suggested: "Suggested",
    otherPossibilities: "Other possibilities",
    additionalDetails: "Additional details",
    advanced: "Advanced details (optional)",
    moreOptionalDetails: "+ More optional details",
    hideOptionalDetails: "Hide optional details",
    carDamageTitle: "Vehicle body condition",
    carDamageHint: "Optional but very useful for car buyers. Tap a body part and choose Original, Painted, Repaired/Replaced, or Damaged.",
    damageSummary: "Body condition summary",
    noDamageSelected: "No painted, replaced, or damaged body parts selected.",
    previewTitle: "Your listing preview",
    publish: "Publish",
    publishing: "Publishing...",
    saved: "Draft saved",
    saving: "Saving draft...",
    draftSaveFailed: "We could not save this draft yet. Your work is still on this device; please try again.",
    aiWorking: "Reading your ad...",
    aiUnavailable: "AI is optional; smart local suggestions are active.",
    missingPhotos: "Please add at least one clear photo.",
    missingDescription: "Please write at least 20 characters in the description.",
    missingPrice: "Please enter a price or choose contact for price.",
    missingCategory: "Please choose a category so buyers can find it.",
    missingLocation: "Please choose province and district/city.",
    locationMustConfirm: "Please confirm the item location before continuing.",
    missingContact: "Please complete your profile name and phone before publishing.",
    success: "Listing submitted for review.",
    suitableStudents: "Suitable for students",
    keepOff: "Off by default",
    noOverride: "Uses your profile contact. Sellers cannot override phone/name per ad.",
    lowConfidence: "Detection is not certain yet. Choose a category chip to continue.",
    exactHidden: "Public page shows province/district, not your exact address.",
  },
  fa: {
    quickPost: "نشر سریع",
    stepOne: "مرحله ۱ از ۲",
    stepTwo: "مرحله ۲ از ۲",
    stepOneTitle: "اعلان خود را ثبت کنید",
    stepTwoTitle: "دسته و جزئیات را تایید کنید",
    subtitle: "عکس‌ها، عنوان، توضیحات، موقعیت و قیمت را وارد کنید. صاحبش جزئیات دیگر را پیشنهاد می‌کند و اختیار ویرایش همیشه با شماست.",
    continue: "ادامه",
    back: "برگشت",
    editStepOne: "ویرایش مرحله ۱",
    photosTitle: "اول عکس‌ها را اضافه کنید",
    photosHint: "از کمره یا گالری. JPG، PNG، WebP یا HEIC تا ۱۰ MB برای هر عکس.",
    addPhotos: "+ افزودن عکس",
    addMore: "افزودن بیشتر",
    primary: "اصلی",
    remove: "حذف",
    moveEarlier: "جابه‌جایی به قبل",
    moveLater: "جابه‌جایی به بعد",
    description: "توضیح دهید چه چیزی را می‌فروشید",
    descriptionPlaceholder: "مثال: تویوتا کرولا ۲۰۱۲، اتومات، بدنه پاک، موقعیت کابل...",
    descriptionRequirement: "برای نشر اعلان حداقل ۲۰ حرف لازم است.",
    title: "عنوان",
    titleHint: "کوتاه و واضح بنویسید. صاحباش می‌تواند بعداً پیشنهاد بهتر بدهد، اما اختیار با شماست.",
    titleTooShort: "کمی جزئیات بیشتر به عنوان اضافه کنید.",
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
    useCurrentLocation: "استفاده از موقعیت فعلی من",
    currentLocationHint: "موقعیت دستگاه فقط برای تنظیم موقعیت همین جنس استفاده می‌شود. پیش از نشر آن را تایید یا ویرایش کنید.",
    detectingLocation: "در حال تشخیص موقعیت...",
    detectedLocation: "موقعیت جنس تشخیص شد",
    confirmLocation: "استفاده از این موقعیت",
    chooseManualLocation: "انتخاب دستی",
    gpsDenied: "اجازه موقعیت داده نشد. می‌توانید دستی ادامه دهید.",
    gpsUnavailable: "فعلاً نتوانستیم موقعیت را تشخیص دهیم. دستی انتخاب کنید یا پین نقشه بگذارید.",
    setOnMap: "تعیین روی نقشه",
    hideMap: "بستن نقشه",
    mapPinSaved: "پین نقشه ذخیره شد. لطفاً ولایت و ولسوالی را تایید کنید.",
    locationPrivacy: "حریم خصوصی موقعیت عمومی",
    privacyExact: "پین دقیق نقشه",
    privacyApproximate: "محدوده تقریبی (پیشنهادی)",
    privacyDistrict: "فقط شهر / ولسوالی",
    privacyHidden: "پنهان",
    province: "ولایت",
    district: "ولسوالی / شهر",
    area: "ناحیه یا محله (اختیاری)",
    street: "قریه یا نشانی سرک (اختیاری)",
    select: "انتخاب",
    detected: "صاحبش تشخیص داد",
    detectionHint: "هر چیپ را ویرایش کنید. اگر تشخیص نامطمئن باشد، یک دسته را انتخاب کنید.",
    suggestionsTitle: "دسته‌های پیشنهادی",
    manualCategory: "انتخاب دستی دسته",
    chooseCategory: "این اعلان مربوط کدام دسته است؟",
    chooseSubcategory: "زیر‌دسته دقیق را انتخاب کنید",
    selectedSubcategory: "زیر‌دسته انتخاب‌شده",
    noSubcategories: "برای بارگذاری زیر‌دسته‌ها، یک دسته اصلی انتخاب کنید.",
    categoryBack: "یک مرحله به عقب",
    saveAndExit: "ذخیره پیش‌نویس و خروج",
    whatsappOptIn: "فعال‌کردن واتساپ برای این اعلان",
    whatsappHint: "از شماره پروفایل شما استفاده می‌کند و فقط در صورت فعال‌بودن نمایش داده می‌شود.",
    locationLookupFailed: "این نقطه با اطمینان کافی تطبیق نشد. ولایت و ولسوالی را دستی انتخاب کنید.",
    selected: "انتخاب‌شده",
    suggested: "پیشنهادی",
    otherPossibilities: "احتمال‌های دیگر",
    additionalDetails: "جزئیات بیشتر",
    advanced: "جزئیات پیشرفته (اختیاری)",
    moreOptionalDetails: "+ جزئیات اختیاری بیشتر",
    hideOptionalDetails: "پنهان کردن جزئیات اختیاری",
    carDamageTitle: "وضعیت بدنه موتر",
    carDamageHint: "اختیاری است اما برای خریداران موتر بسیار مفید است. روی قطعه بدنه بزنید و وضعیت آن را انتخاب کنید.",
    damageSummary: "خلاصه وضعیت بدنه",
    noDamageSelected: "هیچ قطعه رنگ‌شده، تعویض‌شده یا آسیب‌دیده انتخاب نشده است.",
    previewTitle: "پیش‌نمایش اعلان شما",
    publish: "نشر اعلان",
    publishing: "در حال نشر...",
    saved: "پیش‌نویس ذخیره شد",
    saving: "ذخیره پیش‌نویس...",
    draftSaveFailed: "هنوز نتوانستیم این پیش‌نویس را ذخیره کنیم. کار شما در همین دستگاه محفوظ است؛ لطفاً دوباره کوشش کنید.",
    aiWorking: "در حال خواندن اعلان...",
    aiUnavailable: "هوش مصنوعی اختیاری است؛ پیشنهادهای هوشمند محلی فعال است.",
    missingPhotos: "لطفاً حداقل یک عکس واضح اضافه کنید.",
    missingDescription: "لطفاً حداقل ۲۰ نویسه در توضیحات بنویسید.",
    missingPrice: "لطفاً قیمت را وارد کنید یا قیمت به تماس را انتخاب کنید.",
    missingCategory: "لطفاً یک دسته انتخاب کنید تا خریداران اعلان را پیدا کنند.",
    missingLocation: "لطفاً ولایت و ولسوالی/شهر را انتخاب کنید.",
    locationMustConfirm: "لطفاً موقعیت جنس را پیش از ادامه تایید کنید.",
    missingContact: "لطفاً نام و شماره تماس پروفایل خود را تکمیل کنید.",
    success: "اعلان برای بررسی ارسال شد.",
    suitableStudents: "مناسب برای محصلین",
    keepOff: "به‌صورت پیش‌فرض خاموش",
    noOverride: "شماره و نام از پروفایل شما استفاده می‌شود و در هر اعلان قابل تغییر نیست.",
    lowConfidence: "تشخیص هنوز مطمئن نیست. برای ادامه یک چیپ دسته را انتخاب کنید.",
    exactHidden: "در صفحه عمومی ولایت/ولسوالی نمایش داده می‌شود، نه آدرس دقیق شما.",
  },
  ps: {
    quickPost: "چټک اعلان",
    stepOne: "۱ له ۲ مرحلې",
    stepTwo: "۲ له ۲ مرحلې",
    stepOneTitle: "خپل اعلان ثبت کړئ",
    stepTwoTitle: "کټګوري او تفصیلات تایید کړئ",
    subtitle: "انځورونه، سرلیک، تشریح، ځای او بیه ولیکئ. صاحبش نور تفصیلات وړاندیز کوي او تاسو هر وړاندیز سمولای شئ.",
    continue: "دوام",
    back: "شاته",
    editStepOne: "۱مه مرحله سمول",
    photosTitle: "لومړی انځورونه زیات کړئ",
    photosHint: "له کمرې یا ګالري. JPG، PNG، WebP یا HEIC؛ هر انځور تر ۱۰ MB پورې.",
    addPhotos: "+ انځورونه زیات کړئ",
    addMore: "نور زیات کړئ",
    primary: "اصلي",
    remove: "لرې کول",
    moveEarlier: "مخکې یوسئ",
    moveLater: "وروسته یوسئ",
    description: "تشریح کړئ چې څه شی پلورئ",
    descriptionPlaceholder: "بېلګه: ټویوټا کرولا ۲۰۱۲، اتومات، پاک بدن، په کابل کې...",
    descriptionRequirement: "د خپرولو لپاره لږ تر لږه ۲۰ توري اړین دي.",
    title: "سرلیک",
    titleHint: "لنډ او روښانه یې ولیکئ. صاحبش وروسته ښه وړاندیز کولای شي، خو اختیار ستاسو دی.",
    titleTooShort: "سرلیک ته لږ نور تفصیل زیات کړئ.",
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
    useCurrentLocation: "زما فعلي ځای وکاروئ",
    currentLocationHint: "د وسیلې ځای یوازې د همدې توکي د ځای ټاکلو لپاره کارېږي. له خپرولو مخکې یې تایید یا سم کړئ.",
    detectingLocation: "ځای موندل کېږي...",
    detectedLocation: "د توکي ځای وموندل شو",
    confirmLocation: "دا ځای وکاروئ",
    chooseManualLocation: "لاسي انتخاب",
    gpsDenied: "د ځای اجازه رد شوه. تاسو لاسي انتخاب سره ادامه ورکولای شئ.",
    gpsUnavailable: "اوس ځای ونه موندل شو. لاسي انتخاب وکړئ یا د نقشې پین وټاکئ.",
    setOnMap: "په نقشه کې وټاکئ",
    hideMap: "نقشه پټه کړئ",
    mapPinSaved: "د نقشې پین خوندي شو. مهرباني وکړئ ولایت او ولسوالي تایید کړئ.",
    locationPrivacy: "د عامه ځای محرمیت",
    privacyExact: "دقیق نقشه پین",
    privacyApproximate: "نږدې سیمه (سپارښتنه)",
    privacyDistrict: "یوازې ښار / ولسوالي",
    privacyHidden: "پټ",
    province: "ولایت",
    district: "ولسوالي / ښار",
    area: "سیمه یا ګاونډ (اختیاري)",
    street: "کلی یا د سړک پته (اختیاري)",
    select: "وټاکئ",
    detected: "صاحبش وموندل",
    detectionHint: "هر چیپ سمولای شئ. که ډاډ کم وي، یوه کټګوري وټاکئ.",
    suggestionsTitle: "وړاندیز شوې کټګورۍ",
    manualCategory: "کټګوري لاسي وټاکئ",
    chooseCategory: "دا اعلان د کومې کټګورۍ دی؟",
    chooseSubcategory: "دقیق فرعي کټګوري وټاکئ",
    selectedSubcategory: "ټاکل شوې فرعي کټګوري",
    noSubcategories: "د فرعي کټګوریو لپاره یوه اصلي کټګوري وټاکئ.",
    categoryBack: "یو پړاو شاته",
    saveAndExit: "مسوده خوندي او وځئ",
    whatsappOptIn: "د دې اعلان لپاره واټس‌اپ فعال کړئ",
    whatsappHint: "ستاسو د پروفایل شمېره کاروي او یوازې د فعالېدو پر مهال ښکاري.",
    locationLookupFailed: "دا ځای په کافي باور سره ونه پېژندل شو. ولایت او ولسوالۍ لاسي وټاکئ.",
    selected: "ټاکل شوی",
    suggested: "وړاندیز",
    otherPossibilities: "نور احتمالونه",
    additionalDetails: "نور تفصیلات",
    advanced: "پرمختللي تفصیلات (اختیاري)",
    moreOptionalDetails: "+ نور اختیاري تفصیلات",
    hideOptionalDetails: "اختیاري تفصیلات پټ کړئ",
    carDamageTitle: "د موټر د بدنې حالت",
    carDamageHint: "اختیاري دی خو د موټر پېرودونکو لپاره ډېر ګټور دی. د بدنې برخه وټاکئ او حالت یې وښایئ.",
    damageSummary: "د بدنې حالت لنډیز",
    noDamageSelected: "هیڅ رنګ شوی، بدل شوی یا زیانمنه برخه نه ده ټاکل شوې.",
    previewTitle: "ستاسو د اعلان مخکتنه",
    publish: "اعلان خپور کړئ",
    publishing: "خپرېږي...",
    saved: "مسوده خوندي شوه",
    saving: "مسوده خوندي کېږي...",
    draftSaveFailed: "تر اوسه مو دا مسوده خوندي نه شوه کړای. ستاسو کار په همدې وسیله کې خوندي دی؛ بیا هڅه وکړئ.",
    aiWorking: "ستاسو اعلان لوستل کېږي...",
    aiUnavailable: "AI اختیاري دی؛ ځایي هوښیار وړاندیزونه فعال دي.",
    missingPhotos: "مهرباني وکړئ لږ تر لږه یو روښانه انځور زیات کړئ.",
    missingDescription: "مهرباني وکړئ لږ تر لږه ۲۰ توري په تشریح کې ولیکئ.",
    missingPrice: "مهرباني وکړئ بیه ولیکئ یا بیه په اړیکه وټاکئ.",
    missingCategory: "مهرباني وکړئ کټګوري وټاکئ چې پېرودونکي یې ومومي.",
    missingLocation: "مهرباني وکړئ ولایت او ولسوالي/ښار وټاکئ.",
    locationMustConfirm: "مهرباني وکړئ د توکي ځای له ادامه مخکې تایید کړئ.",
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

const QUICK_FIELD_LABELS: Record<string, { fa: string; ps: string }> = {
  make: { fa: "برند / سازنده", ps: "برانډ / جوړوونکی" },
  brand: { fa: "برند", ps: "برانډ" },
  model: { fa: "مدل", ps: "موډل" },
  year: { fa: "سال ساخت", ps: "د جوړېدو کال" },
  mileageKm: { fa: "کارکرد (کیلومتر)", ps: "مزل (کیلومتر)" },
  transmission: { fa: "گیربکس", ps: "ګیربکس" },
  fuelType: { fa: "نوع سوخت", ps: "د سون توکو ډول" },
  condition: { fa: "وضعیت", ps: "حالت" },
  color: { fa: "رنگ", ps: "رنګ" },
  documentType: { fa: "نوع اسناد", ps: "د اسنادو ډول" },
  storageGb: { fa: "حافظه", ps: "ذخیره" },
  ramGb: { fa: "حافظه رم", ps: "رېم" },
  batteryHealth: { fa: "سلامت باتری ٪", ps: "د بټرۍ روغتیا ٪" },
  warranty: { fa: "ضمانت", ps: "تضمین" },
  accessories: { fa: "جعبه / شارژر / لوازم", ps: "بکس / چارجر / لوازم" },
  repair_history: { fa: "سابقه ترمیم", ps: "د ترمیم مخینه" },
  payment_period: { fa: "دوره پرداخت", ps: "د تادیې موده" },
  gender_allowed: { fa: "افراد مجاز", ps: "منل شوی جنسیت" },
  room_type: { fa: "نوع اتاق", ps: "د خونې ډول" },
  students_per_room: { fa: "محصل در هر اتاق", ps: "په هره خونه کې محصلین" },
  available_beds: { fa: "تخت / جای خالی", ps: "خالي کټونه / ځایونه" },
  internet: { fa: "انترنت / وای‌فای", ps: "انټرنېټ / وای‌فای" },
  hot_water: { fa: "آب گرم", ps: "ګرمې اوبه" },
  electricity: { fa: "برق", ps: "برېښنا" },
  heating: { fa: "سیستم گرمایش", ps: "تودوخه" },
  meals_included: { fa: "غذا شامل است", ps: "خواړه پکې شامل دي" },
  furnished: { fa: "وسایل / فرنیچر", ps: "فرنیچر / وسایل" },
  security: { fa: "امنیت / محافظ", ps: "امنیت / ساتونکی" },
  laundry: { fa: "رخت‌شویی", ps: "کالی مینځل" },
  bathroom_type: { fa: "حمام", ps: "تشناب / حمام" },
  nearby_institution: { fa: "مکتب / دانشگاه نزدیک", ps: "نږدې ښوونځی / پوهنتون" },
  distance_to_university: { fa: "فاصله تا محل تحصیل (کیلومتر)", ps: "د زده‌کړې ځای واټن (کیلومتر)" },
  rules: { fa: "قوانین / وقت ورود", ps: "قوانین / د تګ راتګ وخت" },
  landType: { fa: "نوع زمین", ps: "د ځمکې ډول" },
  areaSize: { fa: "مساحت", ps: "مساحت" },
  areaUnit: { fa: "واحد مساحت", ps: "د مساحت واحد" },
  owner_type: { fa: "مالک / نماینده", ps: "مالک / استازی" },
  roadAccess: { fa: "دسترسی سرک", ps: "سړک ته لاسرسی" },
  water: { fa: "آب", ps: "اوبه" },
  rooms: { fa: "اتاق‌ها", ps: "خونې" },
  bedrooms: { fa: "اتاق خواب", ps: "د خوب خونې" },
  bathrooms: { fa: "حمام‌ها", ps: "تشنابونه / حمامونه" },
  floor: { fa: "منزل", ps: "پوړ" },
  parking: { fa: "پارکینگ", ps: "پارکېنګ" },
  type: { fa: "نوع", ps: "ډول" },
};

const QUICK_OPTION_LABELS: Record<string, { fa: string; ps: string }> = {
  Automatic: { fa: "اتومات", ps: "اتومات" }, Manual: { fa: "دستی", ps: "لاسي" }, Other: { fa: "سایر", ps: "نور" },
  Petrol: { fa: "پترول", ps: "پټرول" }, Diesel: { fa: "دیزل", ps: "ډیزل" }, Hybrid: { fa: "هیبرید", ps: "هایبرډ" }, Electric: { fa: "برقی", ps: "برېښنايي" },
  New: { fa: "نو", ps: "نوی" }, "Like New": { fa: "مانند نو", ps: "د نوي په شان" }, Used: { fa: "استفاده‌شده", ps: "کارول شوی" }, Damaged: { fa: "آسیب‌دیده", ps: "زیانمن" }, "For Parts": { fa: "برای پرزه", ps: "د پرزو لپاره" },
  Complete: { fa: "کامل", ps: "بشپړ" }, Customs: { fa: "گمرکی", ps: "ګمرکي" }, "No Document": { fa: "بدون سند", ps: "بې اسناده" },
  monthly: { fa: "ماهانه", ps: "میاشتنی" }, semester: { fa: "سمستر", ps: "سمسټر" }, yearly: { fa: "سالانه", ps: "کلنی" }, daily: { fa: "روزانه", ps: "ورځنی" }, other: { fa: "سایر", ps: "نور" },
  male: { fa: "مردان", ps: "نارینه" }, female: { fa: "زنان", ps: "ښځینه" }, family: { fa: "فامیل", ps: "کورنۍ" }, everyone: { fa: "همه", ps: "ټول" },
  shared: { fa: "مشترک", ps: "ګډ" }, private: { fa: "خصوصی", ps: "خصوصي" }, single: { fa: "یک‌نفره", ps: "یو کسیزه" }, bed_space: { fa: "جای تخت", ps: "د کټ ځای" }, unknown: { fa: "نامعلوم", ps: "نامعلوم" },
  Available: { fa: "موجود", ps: "شته" }, "Not Available": { fa: "موجود نیست", ps: "نشته" }, Unknown: { fa: "نامعلوم", ps: "نامعلوم" }, Limited: { fa: "محدود", ps: "محدود" }, Nearby: { fa: "نزدیک", ps: "نږدې" }, "24-hour": { fa: "۲۴ ساعته", ps: "۲۴ ساعته" },
  Yes: { fa: "بله", ps: "هو" }, No: { fa: "خیر", ps: "نه" }, Optional: { fa: "اختیاری", ps: "اختیاري" }, Partial: { fa: "قسمتی", ps: "یوه برخه" },
  Residential: { fa: "رهایشی", ps: "استوګنیزه" }, Commercial: { fa: "تجارتی", ps: "سوداګریزه" }, Agricultural: { fa: "زراعتی", ps: "کرنیزه" }, Industrial: { fa: "صنعتی", ps: "صنعتي" },
  sqm: { fa: "متر مربع", ps: "متر مربع" }, biswa: { fa: "بسوه", ps: "بسوه" }, jerib: { fa: "جریب", ps: "جریب" },
  "Title Deed": { fa: "قباله رسمی", ps: "رسمي قباله" }, Qabala: { fa: "قباله", ps: "قباله" }, "Customary Document": { fa: "سند عرفی", ps: "عرفي سند" },
  Owner: { fa: "مالک", ps: "مالک" }, Agent: { fa: "نماینده", ps: "استازی" }, Heirs: { fa: "ورثه", ps: "وارثان" }, Tenant: { fa: "کرایه‌نشین", ps: "کرایه‌دار" },
  "Main Road": { fa: "سرک عمومی", ps: "عمومي سړک" }, "Side Road": { fa: "سرک فرعی", ps: "فرعي سړک" }, "No Road Access": { fa: "بدون دسترسی سرک", ps: "سړک ته لاسرسی نشته" },
  Well: { fa: "چاه", ps: "څاه" }, Irrigation: { fa: "آبیاری", ps: "اوبه لګونه" }, Tanker: { fa: "تانکر", ps: "ټانکر" }, "Semi Furnished": { fa: "نیمه‌مبله", ps: "نیمه فرنیچر" },
};

function quickFieldLabel(locale: AppLocale, field: QuickField) {
  if (locale === "en") return field.label;
  return QUICK_FIELD_LABELS[field.key]?.[locale] ?? field.label;
}

function quickOptionLabel(locale: AppLocale, option: string) {
  if (locale === "en") return option;
  return QUICK_OPTION_LABELS[option]?.[locale] ?? option;
}

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

async function persistQuickPostImages(images: StagedImage[], ownerScope: string) {
  if (typeof indexedDB === "undefined") return;
  const db = await openQuickPostImageDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(QUICK_IMAGE_STORE, "readwrite");
      const store = transaction.objectStore(QUICK_IMAGE_STORE);
      const cursorRequest = store.openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (cursor) {
          if ((cursor.value as Partial<StoredQuickPostImage>).ownerScope === ownerScope) cursor.delete();
          cursor.continue();
          return;
        }
        for (const image of images.slice(0, 15)) {
          store.put({
            id: image.id,
            ownerScope,
            name: image.file.name,
            type: image.file.type,
            lastModified: image.file.lastModified,
            isPrimary: image.isPrimary,
            blob: image.file,
          } satisfies StoredQuickPostImage);
        }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error("Could not save quick-post image draft."));
      transaction.onabort = () => reject(transaction.error ?? new Error("Could not save quick-post image draft."));
    });
  } finally {
    db.close();
  }
}

async function loadQuickPostImages(ownerScope: string) {
  if (typeof indexedDB === "undefined") return [] as StoredQuickPostImage[];
  const db = await openQuickPostImageDb();
  try {
    return await new Promise<StoredQuickPostImage[]>((resolve, reject) => {
      const transaction = db.transaction(QUICK_IMAGE_STORE, "readonly");
      const request = transaction.objectStore(QUICK_IMAGE_STORE).getAll();
      request.onsuccess = () => resolve(
        ((request.result ?? []) as StoredQuickPostImage[]).filter((image) => image.ownerScope === ownerScope),
      );
      request.onerror = () => reject(request.error ?? new Error("Could not load quick-post image draft."));
    });
  } finally {
    db.close();
  }
}

async function clearQuickPostImages(ownerScope: string) {
  if (typeof indexedDB === "undefined") return;
  const db = await openQuickPostImageDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(QUICK_IMAGE_STORE, "readwrite");
      const cursorRequest = transaction.objectStore(QUICK_IMAGE_STORE).openCursor();
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) return;
        if ((cursor.value as Partial<StoredQuickPostImage>).ownerScope === ownerScope) cursor.delete();
        cursor.continue();
      };
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

function readDraftNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isQuickPostCarDamageCategory(rootSlug: string | null | undefined, path: string | null | undefined) {
  const normalizedRoot = String(rootSlug ?? "").toLowerCase();
  const normalizedPath = String(path ?? "").toLowerCase();
  if (normalizedRoot !== "vehicles" && !normalizedPath.startsWith("vehicles")) return false;
  if (!normalizedPath) return false;
  if (/motorcycle|motorbike|scooter|rickshaw|bicycle|parts|accessories|truck|bus|van|agricultural/.test(normalizedPath)) {
    return false;
  }
  return normalizedPath === "vehicles/cars" || normalizedPath.includes("/cars");
}

function fieldsForQuickKind(kind: QuickKind) {
  if (kind === "vehicle") return VEHICLE_FIELDS;
  if (kind === "phone" || kind === "tablet") return PHONE_FIELDS;
  if (kind === "dormitory") return DORMITORY_FIELDS;
  if (kind === "land") return LAND_FIELDS;
  if (kind === "housing") return HOUSING_FIELDS;
  return GENERAL_FIELDS;
}

function moveImageInOrder(images: StagedImage[], id: string, direction: -1 | 1) {
  const index = images.findIndex((image) => image.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= images.length) return images;
  const next = [...images];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export default function QuickPostForm({
  categories,
  t,
  locale,
  initialRootSlug = "",
  sellerProfile = null,
  draftOwnerId = null,
}: QuickPostProps) {
  void t;
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiCacheRef = useRef<Map<string, AiResponse>>(new Map());
  const aiInFlightRef = useRef<Map<string, Promise<AiResponse | null>>>(new Map());
  const aiResponseSignatureRef = useRef("");
  const aiRetryAtRef = useRef<Map<string, number>>(new Map());
  const suggestedDetailSourcesRef = useRef<{ local: SuggestedDetails; gateway: SuggestedDetails }>({ local: {}, gateway: {} });
  const managedSuggestedDetailsRef = useRef<SuggestedDetails>({});
  const userEditedDetailKeysRef = useRef<Set<string>>(new Set());
  const lastServerDraftSignatureRef = useRef("");
  const [isPending, startTransition] = useTransition();
  const c = COPY[locale] ?? COPY.en;
  const direction = locale === "en" ? "ltr" : "rtl";
  const draftOwnerScope = draftOwnerId || "guest";
  const quickDraftKey = quickDraftStorageKey(draftOwnerScope);

  const [step, setStep] = useState<QuickStep>(1);
  const [publishRequestId, setPublishRequestId] = useState(() => createId());
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
  const userEditedDuringHydrationRef = useRef(false);
  const [provinceOptions, setProvinceOptions] = useState<ProvinceOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<DistrictOption[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | null>(null);
  const [areaText, setAreaText] = useState("");
  const [streetText, setStreetText] = useState("");
  const [locationSource, setLocationSource] = useState<QuickLocationSource>("manual");
  const [locationVisibility, setLocationVisibility] = useState<QuickLocationVisibility>("approximate");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationConfirmed, setLocationConfirmed] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationHint, setLocationHint] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedRootSlug, setSelectedRootSlug] = useState(() => normalizeQuickPostRootSlug(initialRootSlug));
  const [rootTouched, setRootTouched] = useState(Boolean(normalizeQuickPostRootSlug(initialRootSlug)));
  const [selectedCategory, setSelectedCategory] = useState<CandidateNode | null>(null);
  const [categoryCandidates, setCategoryCandidates] = useState<CandidateNode[]>([]);
  const [categoryNodes, setCategoryNodes] = useState<CandidateNode[]>([]);
  const [manualCategoryPath, setManualCategoryPath] = useState("");
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [smartSuggestion, setSmartSuggestion] = useState<SmartPostingParseResult | null>(null);
  const [aiResponse, setAiResponse] = useState<AiResponse | null>(null);
  const [damageParts, setDamageParts] = useState<DamagePart[]>(() => defaultVehicleDamageParts());
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
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
  const selectedCategoryId = selectedCategory?.id ?? null;
  const selectedCategoryPath = selectedCategory?.path ?? null;
  const manualCurrentNode = useMemo(
    () => categoryNodes.find((node) => node.path === (manualCategoryPath || selectedRootSlug)) ?? null,
    [categoryNodes, manualCategoryPath, selectedRootSlug],
  );
  const manualChildren = useMemo(
    () => manualCurrentNode
      ? categoryNodes
          .filter((node) => node.parent_id === manualCurrentNode.id && node.is_active)
          .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name))
      : [],
    [categoryNodes, manualCurrentNode],
  );
  const manualBreadcrumb = useMemo(() => {
    const path = manualCurrentNode?.path ?? selectedRootSlug;
    if (!path) return [];
    const segments = path.split("/");
    return segments
      .map((_, index) => categoryNodes.find((node) => node.path === segments.slice(0, index + 1).join("/")))
      .filter((node): node is CandidateNode => Boolean(node));
  }, [categoryNodes, manualCurrentNode, selectedRootSlug]);

  const detectionText = `${title} ${description} ${Object.values(details).join(" ")}`;
  const quickKind = useMemo(
    () => inferKind(selectedRootSlug, selectedCategoryPath, detectionText),
    [selectedRootSlug, selectedCategoryPath, detectionText]
  );
  const isDormitory = quickKind === "dormitory";
  const isLand = quickKind === "land";
  const isHousing = quickKind === "housing";
  const isRentHousing = isHousing && transaction === "rent";
  const showContextualPrice = step === 2 && Boolean(selectedCategory);
  const isCarDamageEligible = isQuickPostCarDamageCategory(selectedRootSlug, selectedCategoryPath);
  const nonOriginalDamageParts = useMemo(() => getNonOriginalVehicleDamageParts(damageParts), [damageParts]);

  const priceMode = useMemo(() => {
    if (contactForPrice) return "contact";
    if (isDormitory) return "dormitory_fee";
    if (isLand && transaction === "lease") return "lease";
    if (isRentHousing && rahnGerawyEnabled) return "gerawy_rahn";
    if (isRentHousing) return "monthly_rent";
    return "fixed";
  }, [contactForPrice, isDormitory, isLand, isRentHousing, rahnGerawyEnabled, transaction]);

  const visibleFields = useMemo<QuickField[]>(() => {
    return fieldsForQuickKind(quickKind);
  }, [quickKind]);

  const priorityFieldKeys = useMemo(() => {
    if (quickKind === "vehicle") return new Set(["make", "model", "year", "mileageKm", "transmission", "fuelType", "condition", "color"]);
    if (quickKind === "phone" || quickKind === "tablet") return new Set(["brand", "model", "condition", "storageGb", "ramGb", "batteryHealth"]);
    if (quickKind === "dormitory") return new Set(["payment_period", "gender_allowed", "room_type", "students_per_room", "available_beds", "internet", "hot_water"]);
    if (quickKind === "land") return new Set(["landType", "areaSize", "areaUnit", "documentType", "roadAccess"]);
    if (quickKind === "housing") return new Set(["rooms", "bedrooms", "bathrooms", "areaSize", "areaUnit", "furnished", "parking", "water", "electricity"]);
    return new Set(["condition", "type", "brand", "model"]);
  }, [quickKind]);

  const primaryFields = useMemo(() => visibleFields.filter((field) => priorityFieldKeys.has(field.key)), [priorityFieldKeys, visibleFields]);
  const optionalFields = useMemo(() => visibleFields.filter((field) => !priorityFieldKeys.has(field.key)), [priorityFieldKeys, visibleFields]);

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

  function categoryBreadcrumbLabel(node: CandidateNode) {
    const segments = node.path.split("/");
    return segments.map((_, index) => {
      const path = segments.slice(0, index + 1).join("/");
      const pathNode = categoryNodes.find((candidate) => candidate.path === path);
      return localizeCategoryName({
        locale,
        fallbackName: pathNode?.name ?? segments[index].replace(/-/g, " "),
        slug: pathNode?.slug ?? segments[index],
        path,
      });
    }).join(" › ");
  }

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
    userEditedDetailKeysRef.current.add(key);
    delete managedSuggestedDetailsRef.current[key];
    setDetails((current) => ({ ...current, [key]: value }));
  }, []);

  const applySuggestedDetails = useCallback((source: "local" | "gateway", values: SuggestedDetails) => {
    suggestedDetailSourcesRef.current[source] = sanitizeSuggestedDetails(values);
    const merged = {
      ...suggestedDetailSourcesRef.current.local,
      ...suggestedDetailSourcesRef.current.gateway,
    };
    setDetails((current) => {
      const reconciled = reconcileSuggestedDetails({
        current,
        previousManaged: managedSuggestedDetailsRef.current,
        nextSuggested: merged,
        userEditedKeys: userEditedDetailKeysRef.current,
      });
      managedSuggestedDetailsRef.current = reconciled.managed;
      return reconciled.details;
    });
  }, []);

  const reconcileDetailsForCategoryChange = useCallback((nextRootSlug: string, nextCategoryPath?: string | null) => {
    const nextKind = inferKind(nextRootSlug, nextCategoryPath, `${title} ${description}`);
    if (nextRootSlug === selectedRootSlug && nextKind === quickKind) return;

    const nextFieldKeys = new Set(fieldsForQuickKind(nextKind).map((field) => field.key));
    const allowedKeys = nextRootSlug === selectedRootSlug
      ? new Set(visibleFields.filter((field) => nextFieldKeys.has(field.key)).map((field) => field.key))
      : new Set(["condition", "negotiable"]);

    const retainAllowed = (values: SuggestedDetails) => Object.fromEntries(
      Object.entries(values).filter(([key]) => allowedKeys.has(key)),
    ) as SuggestedDetails;

    suggestedDetailSourcesRef.current = {
      local: retainAllowed(suggestedDetailSourcesRef.current.local),
      gateway: retainAllowed(suggestedDetailSourcesRef.current.gateway),
    };
    managedSuggestedDetailsRef.current = retainAllowed(managedSuggestedDetailsRef.current);
    userEditedDetailKeysRef.current = new Set(
      Array.from(userEditedDetailKeysRef.current).filter((key) => allowedKeys.has(key)),
    );
    setDetails((current) => Object.fromEntries(
      Object.entries(current).filter(([key]) => allowedKeys.has(key)),
    ));
  }, [description, quickKind, selectedRootSlug, title, visibleFields]);

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
      let hasLocalRecovery = false;
      try {
        const localRaw = window.localStorage.getItem(quickDraftKey);
        if (localRaw) {
          const local = JSON.parse(localRaw) as Record<string, unknown>;
          hasLocalRecovery = true;
          const nextDetails = (local.details && typeof local.details === "object" ? local.details : {}) as Record<string, unknown>;
          const managedDetails = sanitizeSuggestedDetails(local.managedSuggestedDetails);
          managedSuggestedDetailsRef.current = managedDetails;
          suggestedDetailSourcesRef.current = { local: managedDetails, gateway: {} };
          userEditedDetailKeysRef.current = new Set(
            Array.isArray(local.userEditedDetailKeys) ? local.userEditedDetailKeys.map(String) : [],
          );
          setStep(local.step === 2 ? 2 : 1);
          if (readDraftString(local.publishRequestId)) setPublishRequestId(readDraftString(local.publishRequestId));
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
          setStreetText(readDraftString(location.streetText));
          const nextVisibility = readDraftString(location.locationVisibility);
          if (["exact", "approximate", "province_district", "hidden"].includes(nextVisibility)) {
            setLocationVisibility(nextVisibility as QuickLocationVisibility);
          }
          const nextSource = readDraftString(location.locationSource);
          if (["manual", "device", "map_pin"].includes(nextSource)) {
            setLocationSource(nextSource as QuickLocationSource);
          }
          setLatitude(readDraftNumber(location.latitude));
          setLongitude(readDraftNumber(location.longitude));
          setLocationAccuracy(readDraftNumber(location.locationAccuracy));
          setLocationConfirmed(readDraftBoolean(location.isConfirmed));
          const localCategory = (local.selectedCategory && typeof local.selectedCategory === "object" ? local.selectedCategory : null) as Record<string, unknown> | null;
          if (localCategory?.id && localCategory?.path) {
            setSelectedCategory({
              id: Number(localCategory.id),
              category_id: Number(localCategory.category_id),
              parent_id: localCategory.parent_id === null ? null : Number(localCategory.parent_id),
              name: readDraftString(localCategory.name),
              slug: readDraftString(localCategory.slug),
              path: readDraftString(localCategory.path),
              level: Number(localCategory.level) || 0,
              display_order: Number(localCategory.display_order) || 0,
              is_active: readDraftBoolean(localCategory.is_active ?? true),
              is_leaf: readDraftBoolean(localCategory.is_leaf ?? true),
            });
          }
          if (Array.isArray(local.damageParts)) {
            const restoredDamage = local.damageParts
              .filter((part): part is DamagePart => Boolean(part) && typeof part === "object" && "key" in part && "condition" in part)
              .map((part) => ({ key: String(part.key), label: String(part.label ?? part.key), condition: String(part.condition) as DamagePart["condition"] }));
            if (restoredDamage.length > 0) setDamageParts(restoredDamage);
          }
          setWhatsappEnabled(readDraftBoolean(local.whatsappEnabled));
        }

        const storedImages = await loadQuickPostImages(draftOwnerScope).catch(() => []);
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
        if (hasLocalRecovery || userEditedDuringHydrationRef.current) return;
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
        const serverSelectedCategory = (serverCategory.selectedCategory && typeof serverCategory.selectedCategory === "object" ? serverCategory.selectedCategory : null) as Record<string, unknown> | null;
        if (serverSelectedCategory?.id && serverSelectedCategory?.path) {
          setSelectedCategory({
            id: Number(serverSelectedCategory.id),
            category_id: Number(serverSelectedCategory.category_id),
            parent_id: serverSelectedCategory.parent_id === null ? null : Number(serverSelectedCategory.parent_id),
            name: readDraftString(serverSelectedCategory.name),
            slug: readDraftString(serverSelectedCategory.slug),
            path: readDraftString(serverSelectedCategory.path),
            level: Number(serverSelectedCategory.level) || 0,
            display_order: Number(serverSelectedCategory.display_order) || 0,
            is_active: readDraftBoolean(serverSelectedCategory.is_active ?? true),
            is_leaf: readDraftBoolean(serverSelectedCategory.is_leaf ?? true),
          });
        }
        const nestedDetails = (serverDetails.details && typeof serverDetails.details === "object" ? serverDetails.details : {}) as Record<string, unknown>;
        const managedDetails = sanitizeSuggestedDetails(serverDetails.managedSuggestedDetails);
        managedSuggestedDetailsRef.current = managedDetails;
        suggestedDetailSourcesRef.current = { local: managedDetails, gateway: {} };
        userEditedDetailKeysRef.current = new Set(
          Array.isArray(serverDetails.userEditedDetailKeys) ? serverDetails.userEditedDetailKeys.map(String) : [],
        );
        setDetails(Object.fromEntries(Object.entries(nestedDetails).map(([key, value]) => [key, typeof value === "boolean" ? value : readDraftString(value)])));
        setStep(serverDetails.step === 2 ? 2 : 1);
        if (readDraftString(serverDetails.publishRequestId)) setPublishRequestId(readDraftString(serverDetails.publishRequestId));
        setSelectedProvinceId(Number(serverLocation.provinceId) || null);
        setSelectedDistrictId(Number(serverLocation.districtId) || null);
        setAreaText(readDraftString(serverLocation.areaText));
        setStreetText(readDraftString(serverLocation.streetText));
        const serverVisibility = readDraftString(serverLocation.locationVisibility);
        if (["exact", "approximate", "province_district", "hidden"].includes(serverVisibility)) {
          setLocationVisibility(serverVisibility as QuickLocationVisibility);
        }
        const serverSource = readDraftString(serverLocation.locationSource);
        if (["manual", "device", "map_pin"].includes(serverSource)) {
          setLocationSource(serverSource as QuickLocationSource);
        }
        setLatitude(readDraftNumber(serverLocation.latitude));
        setLongitude(readDraftNumber(serverLocation.longitude));
        setLocationAccuracy(readDraftNumber(serverLocation.locationAccuracy));
        setLocationConfirmed(readDraftBoolean(serverLocation.isConfirmed));
        if (Array.isArray(serverDetails.damageParts)) {
          const restoredDamage = serverDetails.damageParts
            .filter((part): part is DamagePart => Boolean(part) && typeof part === "object" && "key" in part && "condition" in part)
            .map((part) => ({ key: String(part.key), label: String(part.label ?? part.key), condition: String(part.condition) as DamagePart["condition"] }));
          if (restoredDamage.length > 0) setDamageParts(restoredDamage);
        }
        setWhatsappEnabled(readDraftBoolean(serverDetails.whatsappEnabled));
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
  }, [draftOwnerScope, initialRootSlug, quickDraftKey]);

  useEffect(() => {
    if (!draftLoaded) return;
    void persistQuickPostImages(images, draftOwnerScope).catch(() => undefined);
  }, [draftLoaded, draftOwnerScope, images]);

  useEffect(() => {
    async function loadProvinces() {
      const data = (await fetchLocationOptions("/api/location/provinces"))
        .map(toProvinceOption)
        .filter((row): row is ProvinceOption => Boolean(row));
      setProvinceOptions(data);
    }
    void loadProvinces();
  }, []);

  useEffect(() => {
    if (!selectedProvinceId) {
      return;
    }

    let cancelled = false;
    async function loadDistricts() {
      const data = (await fetchLocationOptions(
        `/api/location/districts?province_id=${encodeURIComponent(String(selectedProvinceId))}`
      ))
        .map(toDistrictOption)
        .filter((row): row is DistrictOption => Boolean(row));
      if (!cancelled) setDistrictOptions(data);
    }
    void loadDistricts();
    return () => {
      cancelled = true;
    };
  }, [selectedProvinceId]);

  useEffect(() => {
    if (!draftLoaded) return;
    const localDraft = {
      ownerScope: draftOwnerScope,
      updatedAt: new Date().toISOString(),
      language: locale,
      step,
      publishRequestId,
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
      selectedCategory: selectedCategory
        ? {
            id: selectedCategory.id,
            category_id: selectedCategory.category_id,
            parent_id: selectedCategory.parent_id,
            name: selectedCategory.name,
            slug: selectedCategory.slug,
            path: selectedCategory.path,
            level: selectedCategory.level,
            display_order: selectedCategory.display_order,
            is_active: selectedCategory.is_active,
            is_leaf: selectedCategory.is_leaf,
          }
        : null,
      aiResponse,
      smartSuggestion,
      details,
      managedSuggestedDetails: managedSuggestedDetailsRef.current,
      userEditedDetailKeys: Array.from(userEditedDetailKeysRef.current),
      damageParts,
      whatsappEnabled,
      photos: images.map((image) => ({ name: image.file.name, size: image.file.size, type: image.file.type })),
      location: {
        provinceId: selectedProvinceId,
        districtId: selectedDistrictId,
        areaText,
        streetText,
        locationSource,
        locationVisibility,
        latitude,
        longitude,
        locationAccuracy,
        isConfirmed: locationConfirmed,
      },
    };
    window.localStorage.setItem(quickDraftKey, JSON.stringify(localDraft));
  }, [
    areaText,
    contactForPrice,
    currency,
    damageParts,
    description,
    details,
    dormitoryFee,
    draftId,
    draftLoaded,
    gerawyAmount,
    images,
    landLeasePrice,
    latitude,
    locationAccuracy,
    locationConfirmed,
    locationSource,
    locationVisibility,
    longitude,
    locale,
    monthlyRent,
    priceAmount,
    publishRequestId,
    rahnGerawyEnabled,
    selectedCategory,
    selectedCategory?.id,
    selectedCategory?.path,
    selectedDistrictId,
    selectedProvinceId,
    selectedRootSlug,
    suitableForStudents,
    streetText,
    step,
    smartSuggestion,
    title,
    transaction,
    aiResponse,
    whatsappEnabled,
    draftOwnerScope,
    quickDraftKey,
  ]);

  useEffect(() => {
    const persistOnPageExit = () => {
      const recovery = window.localStorage.getItem(quickDraftKey);
      if (!recovery || recovery.length > 60_000) return;
      navigator.sendBeacon(
        "/api/posting/draft",
        new Blob([recovery], { type: "application/json" }),
      );
    };
    window.addEventListener("pagehide", persistOnPageExit);
    return () => window.removeEventListener("pagehide", persistOnPageExit);
  }, [quickDraftKey]);

  const applySmartSuggestion = useCallback((suggestion: SmartPostingParseResult) => {
    setSmartSuggestion(suggestion);
    const nextRoot = normalizeQuickPostRootSlug(suggestion.categorySlug);
    if (nextRoot && !rootTouched && rootChoices.some((category) => category.slug === nextRoot)) {
      reconcileDetailsForCategoryChange(nextRoot, null);
      if (!selectedCategoryPath?.startsWith(nextRoot)) setSelectedCategory(null);
      setSelectedRootSlug(nextRoot);
    }
    if (suggestion.price && !priceAmount && !contactForPrice) setPriceAmount(String(suggestion.price));
    if (suggestion.priceType === "contact") setContactForPrice(true);
    const suggestedDetails: SuggestedDetails = {};
    if (suggestion.negotiable) suggestedDetails.negotiable = true;
    if (suggestion.brand) {
      suggestedDetails.brand = suggestion.brand;
      suggestedDetails.make = suggestion.brand;
    }
    if (suggestion.model) suggestedDetails.model = suggestion.model;
    if (suggestion.storage) suggestedDetails.storageGb = suggestion.storage.replace(/GB/i, " GB").replace(/TB/i, " TB");
    if (suggestion.ram) suggestedDetails.ramGb = suggestion.ram.replace(/GB/i, " GB");
    if (suggestion.battery) suggestedDetails.batteryHealth = suggestion.battery.replace("%", "");
    applySuggestedDetails("local", suggestedDetails);
  }, [applySuggestedDetails, contactForPrice, priceAmount, reconcileDetailsForCategoryChange, rootChoices, rootTouched, selectedCategoryPath]);

  useEffect(() => {
    if (step !== 2) return;
    const meaningful = description.trim().length >= 20 || images.length > 0;
    if (!meaningful) return;
    const signature = `${title.trim()}|${description.trim().slice(0, 500)}|${images[0]?.file.name ?? ""}|${images[0]?.file.size ?? 0}`;

    let cancelled = false;
    const timeout = window.setTimeout(() => {
      suggestedDetailSourcesRef.current.gateway = {};
      const localSuggestion = parseSmartPostingText({ title, description });
      if (!cancelled) applySmartSuggestion(localSuggestion);

      const cached = aiCacheRef.current.get(signature);
      if (cached) {
        aiResponseSignatureRef.current = signature;
        setAiResponse(cached);
        setAiStatus("ready");
        applySuggestedDetails("gateway", {
          ...(cached.suggestedProduct?.brand
            ? { brand: cached.suggestedProduct.brand, make: cached.suggestedProduct.brand }
            : {}),
          ...(cached.suggestedProduct?.model ? { model: cached.suggestedProduct.model } : {}),
        });
        return;
      }

      const retryAt = aiRetryAtRef.current.get(signature) ?? 0;
      if (retryAt > Date.now()) {
        setAiStatus("unavailable");
        return;
      }

      setAiStatus("working");
      let request = aiInFlightRef.current.get(signature);
      if (!request) {
        request = (async () => {
          const payload = new FormData();
          payload.set("title", title);
          payload.set("description", description);
          const optimizedImage = images[0] ? await optimizeImageForAI(images[0].file) : null;
          if (optimizedImage) payload.set("image", optimizedImage);
          const response = await fetch("/api/ai/category-suggestion", {
            method: "POST",
            body: payload,
          });
          if (!response.ok) {
            if (response.status === 429) {
              const errorPayload = await response.json().catch(() => null) as { retryAfterSeconds?: number } | null;
              const parsedRetryAfter = Number(errorPayload?.retryAfterSeconds ?? 60);
              const retryAfterSeconds = Number.isFinite(parsedRetryAfter) ? Math.max(1, parsedRetryAfter) : 60;
              aiRetryAtRef.current.set(signature, Date.now() + retryAfterSeconds * 1000);
            }
            return null;
          }
          const json = (await response.json().catch(() => null)) as AiResponse | null;
          if (json) aiCacheRef.current.set(signature, json);
          return json;
        })().catch(() => null);
        aiInFlightRef.current.set(signature, request);
        const createdRequest = request;
        void createdRequest.finally(() => {
          if (aiInFlightRef.current.get(signature) === createdRequest) {
            aiInFlightRef.current.delete(signature);
          }
        });
      }

      void request.then((json) => {
        if (cancelled) return;
        if (!json) {
          applySuggestedDetails("gateway", {});
          setAiStatus("unavailable");
          return;
        }
        aiResponseSignatureRef.current = signature;
        setAiResponse(json);
        setAiStatus(json.suggestions?.length || json.suggestion || json.suggestedProduct ? "ready" : "unavailable");
        const rootFromProduct = json.suggestedProduct?.categoryPath?.split("/")[0] ?? "";
        const rootFromSuggestion = json.suggestions?.[0]?.rootSlug ?? json.suggestion?.rootSlug ?? "";
        const nextRoot = normalizeQuickPostRootSlug(rootFromProduct || rootFromSuggestion);
        if (nextRoot && !rootTouched && rootChoices.some((category) => category.slug === nextRoot)) {
          reconcileDetailsForCategoryChange(nextRoot, json.suggestedProduct?.categoryPath ?? null);
          if (!selectedCategoryPath?.startsWith(nextRoot)) setSelectedCategory(null);
          setSelectedRootSlug(nextRoot);
        }
        applySuggestedDetails("gateway", {
          ...(json.suggestedProduct?.brand
            ? { brand: json.suggestedProduct.brand, make: json.suggestedProduct.brand }
            : {}),
          ...(json.suggestedProduct?.model ? { model: json.suggestedProduct.model } : {}),
        });
      });
    }, 700);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [applySmartSuggestion, applySuggestedDetails, description, images, reconcileDetailsForCategoryChange, rootChoices, rootTouched, selectedCategoryPath, step, title]);

  useEffect(() => {
    if (!selectedRootSlug) {
      return;
    }

    let cancelled = false;
    async function resolveCategory() {
      setCategoryLoading(true);
      const text = `${title} ${description} ${Object.values(details).join(" ")}`;
      const kind = inferKind(selectedRootSlug, selectedCategoryPath, text);
      const aiPaths = (aiResponse?.suggestions ?? [])
        .map((suggestion) => suggestion.pathSlugs?.join("/") ?? "")
        .filter(Boolean);
      const aiPath = aiResponse?.suggestedProduct?.categoryPath
        ?? aiPaths[0]
        ?? (aiResponse?.suggestion?.pathSlugs?.length ? aiResponse.suggestion.pathSlugs.join("/") : null);
      const exactNodes: CandidateNode[] = [];

      try {
        const exactIds = Array.from(new Set([
          aiResponse?.suggestedProduct?.categoryNodeId,
          ...(aiResponse?.suggestions ?? []).map((suggestion) => suggestion.leafCategoryId),
        ].filter((id): id is number => typeof id === "number")));
        if (exactIds.length > 0) {
          const { data: exact } = await supabase
            .from("category_nodes")
            .select("id, category_id, parent_id, name, slug, path, level, display_order, is_active, is_leaf")
            .in("id", exactIds)
            .eq("is_active", true)
            .eq("is_leaf", true);
          exactNodes.push(...((exact ?? []) as CandidateNode[]).filter((node) => node.path?.startsWith(selectedRootSlug)));
        }

        const { data } = await supabase
          .from("category_nodes")
          .select("id, category_id, parent_id, name, slug, path, level, display_order, is_active, is_leaf")
          .eq("is_active", true)
          .ilike("path", `${selectedRootSlug}%`)
          .order("level", { ascending: false })
          .order("display_order", { ascending: true })
          .limit(500);

        const nodes = ((data ?? []) as CandidateNode[]).filter((node) => node.path?.startsWith(selectedRootSlug));
        const ranked = nodes
          .filter((node) => node.is_leaf)
          .map((node) => ({ node, score: scoreCategoryNode(node, kind, text, aiPath) }))
          .sort((a, b) => b.score - a.score || b.node.level - a.node.level || a.node.display_order - b.node.display_order)
          .map((item) => item.node);
        const choices = [
          ...aiPaths.map((path) => exactNodes.find((node) => node.path === path)).filter((node): node is CandidateNode => Boolean(node)),
          ...exactNodes,
          ...ranked,
        ].filter((node, index, all) => all.findIndex((item) => item.id === node.id) === index);

        if (!cancelled) {
          setCategoryNodes(nodes);
          setCategoryCandidates(choices.slice(0, 3));
          setManualCategoryPath((current) => current.startsWith(selectedRootSlug) ? current : selectedRootSlug);
          if (selectedCategoryPath && !selectedCategoryPath.startsWith(selectedRootSlug)) {
            setSelectedCategory(null);
          }
        }
      } finally {
        if (!cancelled) setCategoryLoading(false);
      }
    }
    void resolveCategory();
    return () => {
      cancelled = true;
    };
  }, [aiResponse, description, details, rootTouched, selectedCategoryId, selectedCategoryPath, selectedRootSlug, supabase, title]);

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

  const moveImage = useCallback((id: string, direction: -1 | 1) => {
    setImages((current) => moveImageInOrder(current, id, direction));
  }, []);

  const confirmManualLocationIfReady = useCallback((provinceId: number | null, districtId: number | null) => {
    setLocationSource((current) => current === "device" || current === "map_pin" ? current : "manual");
    setLocationConfirmed(Boolean(provinceId && districtId));
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    setLocationHint(null);
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationHint(c.gpsUnavailable);
      setLocationSource("manual");
      setLocationConfirmed(false);
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void (async () => {
          const nextLatitude = position.coords.latitude;
          const nextLongitude = position.coords.longitude;
          setLatitude(nextLatitude);
          setLongitude(nextLongitude);
          setLocationAccuracy(Math.round(position.coords.accuracy));
          setLocationSource("device");
          setLocationVisibility((current) => current === "exact" || current === "hidden" ? current : "approximate");
          setLocationConfirmed(false);
          try {
            const response = await fetch(`/api/location/reverse?latitude=${encodeURIComponent(String(nextLatitude))}&longitude=${encodeURIComponent(String(nextLongitude))}&locale=${locale}`);
            const result = await response.json() as {
              ok?: boolean;
              province?: ProvinceOption;
              district?: DistrictOption & { provinceId?: number };
            };
            if (!response.ok || !result.ok || !result.province || !result.district) throw new Error("UNMATCHED_LOCATION");
            setProvinceOptions((current) => current.some((item) => item.id === result.province!.id) ? current : [...current, result.province!]);
            setDistrictOptions((current) => current.some((item) => item.id === result.district!.id) ? current : [result.district!, ...current]);
            setSelectedProvinceId(result.province.id);
            setSelectedDistrictId(result.district.id);
            setLocationHint(`${c.detectedLocation}: ${result.province.name} › ${result.district.name}`);
          } catch {
            setSelectedProvinceId(null);
            setSelectedDistrictId(null);
            setLocationHint(c.locationLookupFailed);
          } finally {
            setIsDetectingLocation(false);
          }
        })();
      },
      (geoError) => {
        setLocationHint(geoError.code === 1 ? c.gpsDenied : c.gpsUnavailable);
        setLocationSource("manual");
        setLocationConfirmed(false);
        setIsDetectingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, [c.detectedLocation, c.gpsDenied, c.gpsUnavailable, c.locationLookupFailed, locale]);

  const handleConfirmDetectedLocation = useCallback(() => {
    if (!selectedProvinceId || !selectedDistrictId) {
      setLocationHint(c.locationMustConfirm);
      return;
    }
    setLocationConfirmed(true);
    setLocationHint(c.detectedLocation);
  }, [c.detectedLocation, c.locationMustConfirm, selectedDistrictId, selectedProvinceId]);

  async function saveCurrentDraftNow(stepOverride: QuickStep = step) {
    if (!draftLoaded) return { draftId, persisted: false };
    const localDraft = {
      ownerScope: draftOwnerScope,
      updatedAt: new Date().toISOString(),
      language: locale,
      step: stepOverride,
      publishRequestId,
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
      selectedCategory: selectedCategory
        ? {
            id: selectedCategory.id,
            category_id: selectedCategory.category_id,
            parent_id: selectedCategory.parent_id,
            name: selectedCategory.name,
            slug: selectedCategory.slug,
            path: selectedCategory.path,
            level: selectedCategory.level,
            display_order: selectedCategory.display_order,
            is_active: selectedCategory.is_active,
            is_leaf: selectedCategory.is_leaf,
          }
        : null,
      aiResponse,
      smartSuggestion,
      details,
      managedSuggestedDetails: managedSuggestedDetailsRef.current,
      userEditedDetailKeys: Array.from(userEditedDetailKeysRef.current),
      damageParts,
      whatsappEnabled,
      photos: images.map((image) => ({ name: image.file.name, size: image.file.size, type: image.file.type })),
      location: {
        provinceId: selectedProvinceId,
        districtId: selectedDistrictId,
        areaText,
        streetText,
        locationSource,
        locationVisibility,
        latitude,
        longitude,
        locationAccuracy,
        isConfirmed: locationConfirmed,
      },
    };
    window.localStorage.setItem(quickDraftKey, JSON.stringify(localDraft));
    const serverPayload = {
      postingType: "quick" as const,
      category: {
        rootSlug: selectedRootSlug,
        categoryNodeId: selectedCategory?.id ?? null,
        categoryPath: selectedCategory?.path ?? null,
        selectedCategory: localDraft.selectedCategory,
      },
      details: localDraft,
      photos: localDraft.photos,
      location: localDraft.location,
      language: locale,
    };
    const serverSignature = JSON.stringify(serverPayload);
    if (lastServerDraftSignatureRef.current === serverSignature) {
      return { draftId, persisted: Boolean(draftId) };
    }
    setDraftStatus("saving");
    const result = await saveListingDraftAction(serverPayload);
    if (result.ok) {
      const nextDraftId = result.draftId || draftId;
      lastServerDraftSignatureRef.current = serverSignature;
      setDraftId(nextDraftId);
      setDraftStatus("saved");
      return { draftId: nextDraftId, persisted: Boolean(nextDraftId) };
    } else {
      setDraftStatus(result.statusCode === 401 ? "idle" : "error");
    }
    return { draftId, persisted: false };
  }

  async function saveDraftAndExit() {
    const checkpoint = await saveCurrentDraftNow(step);
    if (!checkpoint.persisted) {
      setError(c.draftSaveFailed);
      return;
    }
    window.localStorage.removeItem(quickDraftKey);
    router.push(localizePath("/dashboard", locale));
  }

  function validateStepOneBeforeContinue() {
    if (description.trim().length < 20) return c.missingDescription;
    const submitPrice = parseNumber(contactForPrice ? "0" : priceAmount);
    if (!contactForPrice && (!submitPrice || submitPrice <= 0)) return c.missingPrice;
    if (!selectedProvinceId || !selectedDistrictId) return c.missingLocation;
    if (!locationConfirmed) return c.locationMustConfirm;
    return null;
  }

  function goToStepTwo() {
    const validationMessage = validateStepOneBeforeContinue();
    if (validationMessage) {
      setError(validationMessage);
      return;
    }
    setError(null);
    setStatus(null);
    const aiSignature = `${title.trim()}|${description.trim().slice(0, 500)}|${images[0]?.file.name ?? ""}|${images[0]?.file.size ?? 0}`;
    if (!aiCacheRef.current.has(aiSignature) && aiResponseSignatureRef.current !== aiSignature) {
      setAiResponse(null);
      setCategoryCandidates([]);
      setAiStatus("working");
    }
    setStep(2);
  }

  function goBackToStepOne() {
    setError(null);
    setStatus(null);
    setStep(1);
  }

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
    if (!locationConfirmed) return c.locationMustConfirm;
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

  function buildPublishFormData(savedDraftId = draftId) {
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
    formData.set("area_text", [areaText.trim(), streetText.trim()].filter(Boolean).join(" · "));
    formData.set("location_source", locationSource);
    formData.set("location_visibility", locationVisibility);
    formData.set("is_location_confirmed", locationConfirmed ? "true" : "false");
    formData.set("whatsapp_enabled", whatsappEnabled ? "true" : "false");
    formData.set("publish_request_id", publishRequestId);
    appendIfPresent(formData, "draft_id", savedDraftId);
    appendIfPresent(formData, "latitude", latitude);
    appendIfPresent(formData, "longitude", longitude);
    appendIfPresent(formData, "location_accuracy", locationAccuracy);
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

    if (isCarDamageEligible) {
      formData.set("damage_parts_json", JSON.stringify(damageParts));
      formData.set("damage_all_original", nonOriginalDamageParts.length === 0 ? "true" : "false");
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
        const checkpoint = await saveCurrentDraftNow(2);
        const savedDraftId = checkpoint.draftId;
        const formData = buildPublishFormData(savedDraftId);
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

        window.localStorage.removeItem(quickDraftKey);
        await clearQuickPostImages(draftOwnerScope).catch(() => undefined);
        if (savedDraftId || draftId) await deleteMyDraftAction(savedDraftId || draftId);
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
    const label = quickFieldLabel(locale, field);
    const commonClass = "mt-1 w-full rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-sm outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/15";

    if (field.type === "textarea") {
      return (
        <label key={field.key} className="text-sm font-semibold">
          {label} {field.required ? <span className="text-red-600">*</span> : null}
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
          {label} {field.required ? <span className="text-red-600">*</span> : null}
          <select value={String(value)} onChange={(event) => updateDetail(field.key, event.target.value)} className={commonClass}>
            <option value="">{c.select}</option>
            {(field.options ?? []).map((option) => (
              <option key={`${field.key}-${option}`} value={option}>{quickOptionLabel(locale, option)}</option>
            ))}
          </select>
        </label>
      );
    }

    if (field.type === "checkbox") {
      return (
        <label key={field.key} className="flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-sm font-semibold">
          <input type="checkbox" checked={Boolean(value)} onChange={(event) => updateDetail(field.key, event.target.checked)} className="h-4 w-4" />
          {label}
        </label>
      );
    }

    return (
      <label key={field.key} className="text-sm font-semibold">
        {label} {field.required ? <span className="text-red-600">*</span> : null}
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
    <div
      data-testid="quick-post-form"
      dir={direction}
      className="mt-6 flex flex-col gap-4 pb-28"
      onInputCapture={() => { userEditedDuringHydrationRef.current = true; }}
      onChangeCapture={() => { userEditedDuringHydrationRef.current = true; }}
      onPointerDownCapture={() => { userEditedDuringHydrationRef.current = true; }}
    >
      <section className="order-0 overflow-hidden rounded-[2rem] border border-[var(--line)] bg-gradient-to-br from-[#fff7ed] via-white to-[#eef7ff] p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-[var(--accent)]">{c.quickPost}</p>
          <p data-testid="quick-post-step-indicator" className="rounded-full bg-white/80 px-3 py-1 text-xs font-black text-[var(--ink-2)] shadow-sm">
            {step === 1 ? c.stepOne : c.stepTwo}
          </p>
        </div>
        <h2 className="mt-1 font-display text-2xl font-bold text-[var(--ink-1)]">{step === 1 ? c.stepOneTitle : c.stepTwoTitle}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--ink-2)]">{c.subtitle}</p>
      </section>

      {step === 1 ? (
        <>
      <section data-testid="quick-post-photos" className="order-10 rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
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
              {images.map((image, index) => (
                <div key={image.id} className="relative aspect-square overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.previewUrl} alt={image.file.name} className="h-full w-full object-cover" />
                  {image.isPrimary ? <span className="absolute left-1 top-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">{c.primary}</span> : null}
                  <div className="absolute inset-x-1 bottom-1 grid grid-cols-2 gap-1">
                    <button type="button" aria-label={c.moveEarlier} onClick={() => moveImage(image.id, -1)} disabled={index === 0} className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold shadow disabled:opacity-50">{direction === "rtl" ? "›" : "‹"}</button>
                    <button type="button" aria-label={c.moveLater} onClick={() => moveImage(image.id, 1)} disabled={index === images.length - 1} className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold shadow disabled:opacity-50">{direction === "rtl" ? "‹" : "›"}</button>
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

      <section data-testid="quick-post-title-description" className="order-20 rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
        <label className="block text-sm font-bold">
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
            className="mt-4 min-h-40 w-full resize-y rounded-3xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-base outline-none transition focus:border-[var(--accent)] focus:bg-white focus:ring-2 focus:ring-[var(--accent)]/15"
          />
          <span className={`mt-1 block text-xs ${description.trim().length >= 20 ? "text-emerald-700" : "text-[var(--ink-2)]"}`}>
            {description.trim().length}/20 · {c.descriptionRequirement}
          </span>
        </label>
      </section>
        </>
      ) : null}

      {step === 2 ? (
      <section
        data-testid="quick-post-ai-chips"
        data-ai-source={aiResponse?.source ?? aiStatus}
        data-ai-status={aiResponse?.gatewayStatus ?? aiStatus}
        data-ai-model={aiResponse?.gatewayModel ?? ""}
        className="order-10 rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5"
      >
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
                  reconcileDetailsForCategoryChange(category.slug, null);
                  setRootTouched(true);
                  setSelectedCategory(null);
                  setCategoryCandidates([]);
                  setCategoryNodes([]);
                  setShowOptionalDetails(false);
                  setSelectedRootSlug(category.slug);
                  setManualCategoryPath(category.slug);
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
          <div className="mt-4 grid gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ink-2)]">{c.suggestionsTitle}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {categoryCandidates.map((candidate, index) => {
                  const isSelected = selectedCategory?.id === candidate.id;
                  return (
                    <button
                      key={`suggested-${candidate.id}`}
                      type="button"
                      onClick={() => {
                        reconcileDetailsForCategoryChange(candidate.path.split("/")[0] ?? selectedRootSlug, candidate.path);
                        setRootTouched(true);
                        setSelectedCategory(candidate);
                        setShowOptionalDetails(false);
                      }}
                      className={`rounded-2xl border px-3 py-3 text-start text-sm font-bold transition ${
                        isSelected
                          ? "border-[var(--accent)] bg-[var(--accent)] text-white shadow-sm"
                          : "border-[var(--line)] bg-[var(--surface-2)] hover:bg-white"
                      }`}
                    >
                      <span className="block text-[11px] uppercase tracking-[0.16em] opacity-75">
                        {index === 0 ? c.suggested : c.otherPossibilities}
                      </span>
                      <span className="mt-1 block">{categoryBreadcrumbLabel(candidate)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--ink-2)]">{c.manualCategory}</p>
              {manualCurrentNode ? (
                <div className="mt-2 rounded-2xl border border-[var(--line)] bg-white p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-3">
                    <p className="text-xs font-bold text-[var(--ink-2)]">
                      {manualBreadcrumb.map((node) => localizeCategoryName({ locale, fallbackName: node.name, slug: node.slug, path: node.path })).join(" › ")}
                    </p>
                    {manualCurrentNode.parent_id ? (
                      <button
                        type="button"
                        onClick={() => {
                          const parent = categoryNodes.find((node) => node.id === manualCurrentNode.parent_id);
                          if (parent) setManualCategoryPath(parent.path);
                        }}
                        className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-xs font-bold"
                      >
                        {c.categoryBack}
                      </button>
                    ) : null}
                  </div>
                  <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
                  {manualChildren.map((candidate) => {
                    const isSelected = candidate.is_leaf && selectedCategory?.id === candidate.id;
                    return (
                      <button
                        key={`manual-${candidate.id}`}
                        type="button"
                        onClick={() => {
                          setRootTouched(true);
                          if (candidate.is_leaf) {
                            reconcileDetailsForCategoryChange(candidate.path.split("/")[0] ?? selectedRootSlug, candidate.path);
                            setSelectedCategory(candidate);
                          } else {
                            setSelectedCategory(null);
                            setManualCategoryPath(candidate.path);
                          }
                          setShowOptionalDetails(false);
                        }}
                        className={`rounded-xl px-3 py-2 text-start text-sm font-semibold transition ${
                          isSelected
                            ? "bg-[var(--ink-1)] text-white"
                            : "bg-[var(--surface-2)] text-[var(--ink-1)] hover:bg-white"
                        }`}
                      >
                        <span>{localizeCategoryName({ locale, fallbackName: candidate.name, slug: candidate.slug, path: candidate.path })}</span>
                        <span aria-hidden="true" className="float-end opacity-60">{candidate.is_leaf ? "✓" : direction === "rtl" ? "‹" : "›"}</span>
                      </button>
                    );
                  })}
                  </div>
                  {manualChildren.length === 0 ? <p className="mt-3 text-sm text-[var(--ink-2)]">{c.noSubcategories}</p> : null}
                </div>
              ) : (
                <p className="mt-2 rounded-2xl bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--ink-2)]">
                  {categoryLoading ? c.aiWorking : c.noSubcategories}
                </p>
              )}
            </div>
          </div>
          {categoryLabel ? (
            <p className="mt-2 text-xs font-semibold text-[var(--ink-2)]">
              {categoryLoading ? c.aiWorking : `${c.selectedSubcategory}: ${categoryLabel}`}
            </p>
          ) : null}
        </div>
      </section>
      ) : null}

      {step === 1 ? (
      <section data-testid="quick-post-price" className="order-40 rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
        <h3 className="font-display text-lg font-bold">{c.price}</h3>

        {showContextualPrice && (isHousing || isLand) && !contactForPrice ? (
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

        {showContextualPrice && isRentHousing && !contactForPrice ? (
          <label className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm font-bold">
            <span>{c.rahnGerawy} <span className="text-xs text-[var(--ink-2)]">({c.keepOff})</span></span>
            <input name="rahn_gerawy_enabled" type="checkbox" checked={rahnGerawyEnabled} onChange={(event) => setRahnGerawyEnabled(event.target.checked)} className="h-5 w-5" />
          </label>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px]">
          {contactForPrice ? (
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-sm font-bold">{c.contactForPrice}</div>
          ) : showContextualPrice && priceMode === "monthly_rent" ? (
            <label className="text-sm font-bold">
              {c.monthlyRent}
              <input type="number" value={monthlyRent} onChange={(event) => setMonthlyRent(event.target.value)} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
            </label>
          ) : showContextualPrice && priceMode === "gerawy_rahn" ? (
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
          ) : showContextualPrice && priceMode === "dormitory_fee" ? (
            <label className="text-sm font-bold">
              {c.dormFee}
              <input type="number" value={dormitoryFee} onChange={(event) => setDormitoryFee(event.target.value)} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
            </label>
          ) : showContextualPrice && priceMode === "lease" ? (
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

        {showContextualPrice && isRentHousing ? (
          <label className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-bold">
            <span>{c.suitableStudents} <span className="text-xs text-[var(--ink-2)]">({c.keepOff})</span></span>
            <input name="suitable_for_students" type="checkbox" checked={suitableForStudents} onChange={(event) => setSuitableForStudents(event.target.checked)} className="h-5 w-5" />
          </label>
        ) : null}
      </section>
      ) : null}

      {step === 1 ? (
      <section data-testid="quick-post-location" className="order-30 rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-lg font-bold">{c.location}</h3>
            <p className="mt-1 text-xs text-[var(--ink-2)]">{c.currentLocationHint}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${locationConfirmed ? "bg-emerald-50 text-emerald-700" : "bg-[var(--surface-2)] text-[var(--ink-2)]"}`}>
            {locationConfirmed ? c.confirmLocation : c.locationMustConfirm}
          </span>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isDetectingLocation}
            className="min-h-12 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-100 disabled:opacity-60"
          >
            {isDetectingLocation ? c.detectingLocation : c.useCurrentLocation}
          </button>
          <button
            type="button"
            onClick={() => {
              setLocationSource("manual");
              setLatitude(null);
              setLongitude(null);
              setLocationAccuracy(null);
              setLocationConfirmed(Boolean(selectedProvinceId && selectedDistrictId));
              setLocationHint(null);
            }}
            className="min-h-12 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold transition hover:bg-[var(--surface-2)]"
          >
            {c.chooseManualLocation}
          </button>
          <button
            type="button"
            onClick={() => setShowMapPicker((current) => !current)}
            className="min-h-12 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-bold transition hover:bg-[var(--surface-2)]"
          >
            {showMapPicker ? c.hideMap : c.setOnMap}
          </button>
        </div>

        {locationHint ? (
          <p className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--ink-2)]">
            {locationHint}
          </p>
        ) : null}

        {locationSource !== "manual" && selectedProvinceId && selectedDistrictId ? (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            <p className="font-bold">{c.detectedLocation}</p>
            <p className="mt-1">
              {provinceOptions.find((item) => item.id === selectedProvinceId)?.name} › {districtOptions.find((item) => item.id === selectedDistrictId)?.name}
            </p>
            <button type="button" onClick={handleConfirmDetectedLocation} className="mt-2 rounded-xl bg-emerald-700 px-3 py-2 text-xs font-black text-white">
              {c.confirmLocation}
            </button>
          </div>
        ) : null}

        {showMapPicker ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--line)]">
            <LocationMapPicker
              initialLocation={{ latitude: latitude ?? undefined, longitude: longitude ?? undefined, accuracy: locationAccuracy ?? undefined }}
              onLocationSelected={(location) => {
                setLatitude(location.latitude);
                setLongitude(location.longitude);
                setLocationAccuracy(location.accuracy ?? null);
                setLocationSource("map_pin");
                setLocationVisibility((current) => current === "hidden" ? current : "approximate");
                setLocationConfirmed(Boolean(selectedProvinceId && selectedDistrictId));
                setLocationHint(c.mapPinSaved);
              }}
            />
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-bold">
            {c.province}
            <select
              value={selectedProvinceId ?? ""}
              onChange={(event) => {
                const nextProvinceId = event.target.value ? Number(event.target.value) : null;
                setSelectedProvinceId(nextProvinceId);
                setSelectedDistrictId(null);
                confirmManualLocationIfReady(nextProvinceId, null);
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
            <select
              value={selectedDistrictId ?? ""}
              onChange={(event) => {
                const nextDistrictId = event.target.value ? Number(event.target.value) : null;
                setSelectedDistrictId(nextDistrictId);
                confirmManualLocationIfReady(selectedProvinceId, nextDistrictId);
              }}
              disabled={!selectedProvinceId}
              className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3 disabled:bg-[var(--surface-2)]"
            >
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
          <label className="text-sm font-bold sm:col-span-2">
            {c.street}
            <input value={streetText} onChange={(event) => setStreetText(event.target.value)} className="mt-1 w-full rounded-2xl border border-[var(--line)] px-3 py-3" />
          </label>
          <fieldset className="sm:col-span-2">
            <legend className="text-sm font-bold">{c.locationPrivacy}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-4">
              {([
                ["approximate", c.privacyApproximate],
                ["province_district", c.privacyDistrict],
                ["hidden", c.privacyHidden],
                ["exact", c.privacyExact],
              ] as const).map(([value, label]) => (
                <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-bold transition ${locationVisibility === value ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line)] bg-white text-[var(--ink-1)]"}`}>
                  <input
                    type="radio"
                    name="location_visibility"
                    value={value}
                    checked={locationVisibility === value}
                    onChange={() => setLocationVisibility(value)}
                    className="h-4 w-4"
                  />
                  {label}
                </label>
              ))}
            </div>
            <p className="mt-2 text-xs text-[var(--ink-2)]">{c.exactHidden}</p>
          </fieldset>
        </div>
      </section>
      ) : null}

      {step === 2 ? (
        <>
          <section data-testid="quick-post-advanced-details" className="order-20 rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold">{c.additionalDetails}</h3>
                <p className="mt-1 text-xs text-[var(--ink-2)]">{selectedCategory ? categoryLabel : c.chooseSubcategory}</p>
              </div>
              {!selectedCategory ? <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">{c.missingCategory}</span> : null}
            </div>

            {selectedCategory ? (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  {primaryFields.map(renderField)}
                  {isRentHousing && suitableForStudents
                    ? DORMITORY_FIELDS
                        .filter((field) => ["gender_allowed", "nearby_institution", "distance_to_university", "furnished"].includes(field.key))
                        .map(renderField)
                    : null}
                </div>

                {optionalFields.length > 0 ? (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowOptionalDetails((current) => !current)}
                      className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-2 text-sm font-black text-[var(--ink-1)]"
                    >
                      {showOptionalDetails ? c.hideOptionalDetails : c.moreOptionalDetails}
                    </button>
                    {showOptionalDetails ? (
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {optionalFields.map(renderField)}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {isCarDamageEligible ? (
            <section data-testid="quick-post-car-damage" className="order-30 rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
              <h3 className="font-display text-lg font-bold">{c.carDamageTitle}</h3>
              <p className="mt-1 text-sm leading-6 text-[var(--ink-2)]">{c.carDamageHint}</p>
              <div className="mt-4">
                <VehicleDamageDiagram value={damageParts} onChange={setDamageParts} locale={locale} />
              </div>
              <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-3">
                <p className="text-sm font-black">{c.damageSummary}</p>
                {nonOriginalDamageParts.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {nonOriginalDamageParts.map((part) => {
                      const condition = damageCondition(part.condition);
                      return (
                        <span key={part.key} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-bold text-[var(--ink-1)]">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: condition.color }} />
                          {damagePartLabel(part.key, locale)} · {condition.labels[locale]}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-[var(--ink-2)]">{c.noDamageSelected}</p>
                )}
              </div>
            </section>
          ) : null}

          <section data-testid="quick-post-review" className="order-40 rounded-3xl border border-[var(--line)] bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-display text-lg font-bold">{c.previewTitle}</h3>
                <p className="mt-1 text-xs text-[var(--ink-2)]">{categoryLabel || c.missingCategory}</p>
              </div>
              <button type="button" onClick={goBackToStepOne} className="rounded-xl border border-[var(--line)] px-3 py-2 text-xs font-black">
                {c.editStepOne}
              </button>
            </div>
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-[96px_1fr]">
              <div className="aspect-square overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-2)]">
                {images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={images.find((image) => image.isPrimary)?.previewUrl ?? images[0].previewUrl} alt={title || c.previewTitle} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">📷</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black text-[var(--ink-1)]">{title.trim() || buildSuggestedQuickPostTitle({
                  enteredTitle: "",
                  description,
                  kind: quickKind,
                  details,
                  categoryLabel,
                  provinceName: provinceOptions.find((item) => item.id === selectedProvinceId)?.name,
                  districtName: districtOptions.find((item) => item.id === selectedDistrictId)?.name,
                  areaText,
                  transaction,
                  labels: { sale: c.forSale, rent: c.forRent, lease: c.forLease, listing: categoryLabel || "Sahibash listing", near: locale === "fa" ? "نزدیک" : locale === "ps" ? "نږدې" : "near" },
                })}</p>
                <p className="mt-1 text-[var(--accent)]">{contactForPrice ? c.contactForPrice : `${priceValueForSubmit() || priceAmount || "—"} ${currency}`}</p>
                <p className="mt-1 text-[var(--ink-2)]">
                  {[provinceOptions.find((item) => item.id === selectedProvinceId)?.name, districtOptions.find((item) => item.id === selectedDistrictId)?.name, areaText, streetText].filter(Boolean).join(" • ") || c.missingLocation}
                </p>
                <p className="mt-2 line-clamp-3 text-[var(--ink-2)]">{description}</p>
                {chips.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {chips.slice(0, 6).map((chip) => (
                      <span key={`preview-${chip.key}`} className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-xs font-semibold">{chip.value}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          </section>

          <section className="order-50 rounded-3xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--ink-2)] shadow-sm sm:p-5">
            <p className="font-semibold text-[var(--ink-1)]">{sellerContactName || "Profile contact"}</p>
            <p className="mt-1">{maskedSellerContactPhone || c.missingContact}</p>
            <p className="mt-2">{c.noOverride}</p>
            <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 font-bold text-[var(--ink-1)]">
              <input type="checkbox" checked={whatsappEnabled} onChange={(event) => setWhatsappEnabled(event.target.checked)} className="h-5 w-5" />
              <span>{c.whatsappOptIn}<span className="mt-1 block text-xs font-normal text-[var(--ink-2)]">{c.whatsappHint}</span></span>
            </label>
          </section>
        </>
      ) : null}

      {error ? <p role="alert" className="order-60 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</p> : null}
      {status ? <p className="order-60 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">{status}</p> : null}

      <div className="order-70 fixed inset-x-0 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-40 border-t border-[var(--line)] bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,.08)] backdrop-blur lg:bottom-0">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
          <p className="hidden text-xs font-semibold text-[var(--ink-2)] sm:block">
            {draftStatus === "saving" ? c.saving : draftStatus === "saved" ? c.saved : ""}
          </p>
          {step === 2 ? (
            <button type="button" onClick={goBackToStepOne} className="min-h-12 rounded-2xl border border-[var(--line)] bg-white px-4 py-3 text-sm font-black">
              {c.back}
            </button>
          ) : null}
          <button type="button" onClick={saveDraftAndExit} disabled={draftStatus === "saving"} className="min-h-12 shrink-0 rounded-2xl border border-[var(--line)] bg-white px-3 py-3 text-xs font-black sm:px-4 sm:text-sm disabled:opacity-60">
            {c.saveAndExit}
          </button>
          {step === 1 ? (
            <button
              type="button"
              onClick={goToStepTwo}
              className="min-h-12 flex-1 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95"
            >
              {c.continue}
            </button>
          ) : (
            <button
              type="button"
              onClick={onPublish}
              disabled={isPending || isPublishing}
              className="min-h-12 flex-1 rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-black text-white shadow-sm transition hover:brightness-95 disabled:opacity-60"
            >
              {isPending || isPublishing ? c.publishing : c.publish}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

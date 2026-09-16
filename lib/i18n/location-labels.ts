import { getProvinceLabel } from "@/lib/constants/marketplace";
import type { AppLocale } from "@/lib/i18n/translations";

export type LocalizedPlace = {
  name?: string | null;
  name_en?: string | null;
  name_fa?: string | null;
  name_ps?: string | null;
};

type LocalizedPlaceRelation = LocalizedPlace | LocalizedPlace[] | null | undefined;

const DISTRICT_LABELS: Record<string, { fa: string; ps: string }> = {
  "herat:adraskan": { fa: "ادرسکن", ps: "ادرسکن" },
  "herat:chishti sharif": { fa: "چشت شریف", ps: "چشت شریف" },
  "herat:farsi": { fa: "فارسی", ps: "فارسي" },
  "herat:ghoryan": { fa: "غوریان", ps: "غوریان" },
  "herat:gulran": { fa: "گلران", ps: "ګلران" },
  "herat:guzara": { fa: "گذره", ps: "ګذره" },
  "herat:herat": { fa: "هرات", ps: "هرات" },
  "herat:injil": { fa: "انجیل", ps: "انجیل" },
  "herat:karukh": { fa: "کرخ", ps: "کرخ" },
  "herat:kohsan": { fa: "کهسان", ps: "کهسان" },
  "herat:kushk": { fa: "کشک", ps: "کشک" },
  "herat:kushk-e-kuhna": { fa: "کشک کهنه", ps: "کشک کهنه" },
  "herat:obe": { fa: "اوبه", ps: "اوبه" },
  "herat:pashtun zarghun": { fa: "پشتون زرغون", ps: "پښتون زرغون" },
  "herat:shindand": { fa: "شیندند", ps: "شیندنډ" },
  "herat:zinda jan": { fa: "زنده جان", ps: "زنده جان" },
};

function clean(value: string | null | undefined) {
  return String(value ?? "").trim();
}

function firstPlace(place: LocalizedPlaceRelation) {
  return Array.isArray(place) ? place[0] : place;
}

export function localizeProvinceName(
  place: LocalizedPlace | null | undefined,
  fallback: string | null | undefined,
  locale: AppLocale
) {
  const english = clean(place?.name_en ?? place?.name ?? fallback);
  if (locale === "en") return english;

  const localized = clean(place?.[`name_${locale}`]);
  if (localized && localized.toLocaleLowerCase() !== english.toLocaleLowerCase()) return localized;
  return english ? getProvinceLabel(english, locale) : "";
}

export function localizeDistrictName(
  place: LocalizedPlace | null | undefined,
  fallback: string | null | undefined,
  locale: AppLocale,
  provinceEnglishName?: string | null,
  localizedProvinceName?: string | null
) {
  const localized = clean(place?.[`name_${locale}`]);
  const english = clean(place?.name_en ?? place?.name ?? fallback);

  if (localized && (locale === "en" || localized !== english)) return localized;
  if (!english) return "";
  if (locale === "en") return english;

  const provinceEnglish = clean(provinceEnglishName);
  const provinceLocalized = clean(localizedProvinceName)
    || (provinceEnglish ? getProvinceLabel(provinceEnglish, locale) : "");
  if (provinceLocalized && provinceEnglish && english.toLowerCase() === `${provinceEnglish} city`.toLowerCase()) {
    return locale === "fa" ? `شهر ${provinceLocalized}` : `${provinceLocalized} ښار`;
  }

  const knownDistrict = DISTRICT_LABELS[`${provinceEnglish.toLowerCase()}:${english.toLowerCase()}`];
  if (knownDistrict) return knownDistrict[locale];

  return localized && localized.toLocaleLowerCase() !== english.toLocaleLowerCase() ? localized : "";
}

export function getLocalizedListingLocation(
  listing: {
    province?: string | null;
    district?: string | null;
    provinces?: LocalizedPlaceRelation;
    districts?: LocalizedPlaceRelation;
  },
  locale: AppLocale
) {
  const provincePlace = firstPlace(listing.provinces);
  const districtPlace = firstPlace(listing.districts);
  const provinceEnglish = clean(provincePlace?.name_en ?? provincePlace?.name ?? listing.province);
  const province = localizeProvinceName(provincePlace, listing.province, locale);
  const district = localizeDistrictName(
    districtPlace,
    listing.district,
    locale,
    provinceEnglish,
    province
  );

  return {
    province,
    district,
    label: [province, district].filter(Boolean).join(" · ") || "-",
  };
}

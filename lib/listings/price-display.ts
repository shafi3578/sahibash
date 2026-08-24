import type { AppLocale } from "@/lib/i18n/translations";
import { formatCurrencyAmount } from "@/lib/i18n/format";

type PriceDisplayListing = {
  price: number;
  currency: string;
  payment_period?: string | null;
  listing_attributes?: Array<Record<string, unknown>> | null;
};

function attributeValue(attribute: Record<string, unknown> | undefined) {
  if (!attribute) return null;
  return (
    attribute.attribute_value_number
    ?? attribute.attribute_value_text
    ?? attribute.attribute_value_boolean
    ?? attribute.attribute_value_json
    ?? null
  );
}

function readAttribute(
  listing: PriceDisplayListing,
  key: string,
  fallbackAttributes?: Map<string, unknown>
) {
  if (fallbackAttributes?.has(key)) {
    const fallback = fallbackAttributes.get(key);
    if (fallback && typeof fallback === "object" && !Array.isArray(fallback)) {
      return attributeValue(fallback as Record<string, unknown>);
    }
    return fallback ?? null;
  }

  const found = (listing.listing_attributes ?? []).find((item) => String(item.attribute_key ?? "") === key);
  return attributeValue(found);
}

function readText(listing: PriceDisplayListing, key: string, fallbackAttributes?: Map<string, unknown>) {
  const value = readAttribute(listing, key, fallbackAttributes);
  return typeof value === "string" ? value.trim() : value === null || value === undefined ? "" : String(value).trim();
}

function readNumber(listing: PriceDisplayListing, key: string, fallbackAttributes?: Map<string, unknown>) {
  const value = readAttribute(listing, key, fallbackAttributes);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const parsed = Number(value.replace(/[٬,\s\u00A0\u202F]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function label(locale: AppLocale, key: "contact" | "monthly" | "gerawy" | "dormitory" | "lease") {
  const labels = {
    en: {
      contact: "Contact for price",
      monthly: "Monthly rent",
      gerawy: "Gerawy/Rahn",
      dormitory: "Dorm fee",
      lease: "Lease price",
    },
    fa: {
      contact: "قیمت به تماس",
      monthly: "کرایه ماهانه",
      gerawy: "گروی/رهن",
      dormitory: "فیس خوابگاه",
      lease: "قیمت اجاره",
    },
    ps: {
      contact: "بیه په اړیکه",
      monthly: "میاشتنۍ کرایه",
      gerawy: "ګروۍ/رهن",
      dormitory: "د لیلیې فیس",
      lease: "د اجارې بیه",
    },
  } as const;
  return labels[locale]?.[key] ?? labels.en[key];
}

function periodLabel(locale: AppLocale, period: string) {
  const normalized = period.trim().toLowerCase();
  const labels: Record<string, Record<AppLocale, string>> = {
    monthly: { en: "month", fa: "ماه", ps: "میاشت" },
    semester: { en: "semester", fa: "سمستر", ps: "سمستر" },
    yearly: { en: "year", fa: "سال", ps: "کال" },
    daily: { en: "day", fa: "روز", ps: "ورځ" },
  };
  return labels[normalized]?.[locale] ?? period;
}

function formatAmount(value: number | null, listing: PriceDisplayListing, locale: AppLocale) {
  if (value === null || value <= 0) return "";
  return formatCurrencyAmount(value, listing.currency, locale);
}

export function formatListingPrice(
  listing: PriceDisplayListing,
  locale: AppLocale,
  fallbackAttributes?: Map<string, unknown>
) {
  const priceMode = readText(listing, "price_mode", fallbackAttributes).toLowerCase();
  const paymentPeriod = readText(listing, "payment_period", fallbackAttributes) || listing.payment_period || "";

  if (priceMode === "contact" || listing.price <= 0) {
    return label(locale, "contact");
  }

  if (priceMode === "monthly_rent") {
    const amount = formatAmount(readNumber(listing, "monthly_rent", fallbackAttributes) ?? listing.price, listing, locale);
    return amount ? `${label(locale, "monthly")}: ${amount}` : label(locale, "contact");
  }

  if (priceMode === "gerawy_rahn") {
    const gerawyAmount = formatAmount(readNumber(listing, "gerawy_amount", fallbackAttributes) ?? listing.price, listing, locale);
    const monthlyRent = formatAmount(readNumber(listing, "monthly_rent", fallbackAttributes), listing, locale);
    if (gerawyAmount && monthlyRent) return `${label(locale, "gerawy")}: ${gerawyAmount} + ${monthlyRent}`;
    return gerawyAmount ? `${label(locale, "gerawy")}: ${gerawyAmount}` : label(locale, "contact");
  }

  if (priceMode === "dormitory_fee") {
    const amount = formatAmount(readNumber(listing, "dormitory_fee", fallbackAttributes) ?? listing.price, listing, locale);
    const period = paymentPeriod ? ` / ${periodLabel(locale, paymentPeriod)}` : "";
    return amount ? `${label(locale, "dormitory")}: ${amount}${period}` : label(locale, "contact");
  }

  if (priceMode === "lease") {
    const amount = formatAmount(readNumber(listing, "land_lease_price", fallbackAttributes) ?? listing.price, listing, locale);
    return amount ? `${label(locale, "lease")}: ${amount}` : label(locale, "contact");
  }

  return formatCurrencyAmount(listing.price, listing.currency, locale);
}

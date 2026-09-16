import type { AppLocale } from "@/lib/i18n/translations";

// Change this version when the meaning of the seller's disclosure changes.
export const FEATURED_EXTENSION_CONSENT_VERSION = "featured-full-term-v1";

export function isClosedFeaturedPaymentRequest(status: string) {
  return ["approved", "cancelled", "expired"].includes(status);
}

export type FeaturedExtensionConsent = {
  extension_consent_version?: string | null;
  extension_consented_at?: string | null;
  purchased_duration_days?: number | null;
};

export function hasFeaturedExtensionConsent(request: FeaturedExtensionConsent) {
  return request.extension_consent_version === FEATURED_EXTENSION_CONSENT_VERSION
    && Number.isFinite(Date.parse(request.extension_consented_at ?? ""))
    && Number.isInteger(request.purchased_duration_days)
    && Number(request.purchased_duration_days) >= 1
    && Number(request.purchased_duration_days) <= 365;
}

export function matchesFeaturedConsentTerms(formData: FormData, config: { id: string; updated_at: string; currency: string; duration_days: number; amount: number }) {
  return formData.get("extension_consent") === FEATURED_EXTENSION_CONSENT_VERSION
    && formData.get("consent_config_id") === config.id
    && formData.get("consent_config_updated_at") === config.updated_at
    && formData.get("consent_currency") === config.currency
    && Number(formData.get("consent_duration_days")) === config.duration_days
    && Number(formData.get("consent_amount")) === config.amount;
}

export function getFeaturedPaymentInstructions(request: { payment_instructions_snapshot?: Partial<Record<AppLocale, string>> | null }, locale: AppLocale) {
  return request.payment_instructions_snapshot?.[locale] ?? "";
}

export function featuredConsentRequiredMessage(status: string | string[] | undefined, locale: AppLocale) {
  if (status !== "consent-required") return null;
  if (locale === "fa") {
    return "رضایت شما تأیید نشد یا شرایط ویژه تغییر کرده است. قیمت، مدت و شرایط تمدید تاریخ انقضا را دوباره بررسی کنید. برای درخواست جدید، فقط اگر موافق هستید گزینهٔ رضایت را خودتان علامت بزنید.";
  }
  if (locale === "ps") {
    return "ستاسو رضایت تایید نه شو یا د ځانګړي اعلان شرایط بدل شوي دي. بیه، موده او د پای نېټې د غځولو شرایط بیا وګورئ. د نوې غوښتنې لپاره، یوازې که موافق یاست د رضایت تشه خانه پخپله نښه کړئ.";
  }
  return "Your consent could not be confirmed, or the Featured terms changed. Review the current price, duration and expiry-extension terms. For a new request, select the unchecked consent box yourself only if you agree.";
}

export function featuredExtensionConsentCopy(locale: AppLocale, days: number) {
  if (locale === "fa") {
    return `موافقم که با تأیید پرداخت، در صورت نیاز تاریخ انقضای این اعلان تا پایان تمام ${days} روز نمایش ویژه از زمان تأیید تمدید شود. اعلان باید هنگام تأیید هنوز فعال و عمومی باشد؛ اعلان فروخته‌شده، حذف‌شده یا منقضی‌شده دوباره فعال نمی‌شود. همچنان می‌توانم آن را فروخته‌شده علامت بزنم یا حذف کنم.`;
  }
  if (locale === "ps") {
    return `زه موافق یم چې د تادیې له تایید سره، که اړتیا وي، د دې اعلان د پای نېټه د تایید له وخته د ځانګړي حالت د ټولو ${days} ورځو تر پایه وغځول شي. اعلان باید د تایید پر مهال لا فعال او عام وي؛ پلورل شوی، لرې شوی یا منقضي شوی اعلان بیا نه فعالېږي. زه بیا هم اعلان د پلورل شوي په توګه نښه کولای یا لرې کولای شم.`;
  }
  return `I agree that payment approval may extend this ad's expiry to cover the full ${days} days of Featured placement from approval. The ad must still be active and public at approval; sold, removed or expired ads are not reactivated. I can still mark it sold or remove it.`;
}

import type { AppLocale } from "@/lib/i18n/translations";

export const WANTED_ALLOWED_FILTERS = new Set([
  "q",
  "province",
  "district",
  "categoryId",
  "categoryNodeId",
  "scope",
  "minPrice",
  "maxPrice",
  "condition",
  "vehicleBrand",
  "vehicleModel",
  "phoneModel",
  "storage",
  "ram",
  "propertyType",
  "rentalType",
]);

export function sanitizeWantedFilters(params: URLSearchParams | Record<string, string | undefined>) {
  const entries = params instanceof URLSearchParams ? Array.from(params.entries()) : Object.entries(params);
  const filters: Record<string, string> = {};

  for (const [key, value] of entries) {
    if (!value || !WANTED_ALLOWED_FILTERS.has(key)) continue;
    const trimmed = String(value).trim();
    if (trimmed.length === 0 || trimmed.length > 240) continue;
    filters[key] = trimmed;
  }

  return filters;
}

export function wantedCopy(locale: AppLocale) {
  if (locale === "fa") {
    return {
      title: "برایم پیدا کن",
      intro: "اگر نتیجه مناسب پیدا نشد، درخواست خود را ذخیره کنید تا هنگام پیدا شدن اعلان مشابه خبر شوید.",
      button: "ثبت درخواست",
      name: "عنوان درخواست",
      urgency: "فوریت",
      flexible: "عادی",
      soon: "به‌زودی",
      urgent: "فوری",
      channels: "روش اطلاع‌رسانی",
      inApp: "داخل صاحباش",
      email: "ایمیل",
      whatsapp: "واتساپ",
    };
  }

  if (locale === "ps") {
    return {
      title: "راته یې پیدا کړئ",
      intro: "که ښه نتیجه نه وي، خپله غوښتنه خوندي کړئ څو د ورته اعلان پر وخت خبر شئ.",
      button: "غوښتنه ثبت کړئ",
      name: "د غوښتنې عنوان",
      urgency: "بیړنۍ کچه",
      flexible: "عادي",
      soon: "ژر",
      urgent: "بیړنی",
      channels: "د خبرتیا لارې",
      inApp: "په صاحباش کې",
      email: "ایمیل",
      whatsapp: "واټس‌اپ",
    };
  }

  return {
    title: "Find It For Me",
    intro: "If the right result is not here yet, save your request and Sahibash can notify you when a strong match appears.",
    button: "Create request",
    name: "Request title",
    urgency: "Urgency",
    flexible: "Flexible",
    soon: "Soon",
    urgent: "Urgent",
    channels: "Notification channels",
    inApp: "In Sahibash",
    email: "Email",
    whatsapp: "WhatsApp",
  };
}

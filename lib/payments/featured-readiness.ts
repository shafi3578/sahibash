import type { AppLocale } from "@/lib/i18n/translations";

const SETUP_DESTINATION_PLACEHOLDER = "configure merchant destination in super admin before launch";

// Keep normalization aligned with private.guard_featured_merchant_destination.
// This rejects missing setup, not merchant IDs, and does not verify ownership.
export function isFeaturedPaymentDestinationReady(reference: unknown) {
  if (typeof reference !== "string") return false;
  const normalized = reference.replace(/\s+/gu, " ").trim().toLowerCase();
  return normalized.length > 0 && normalized !== SETUP_DESTINATION_PLACEHOLDER;
}

export const FEATURED_PAYMENT_UNAVAILABLE_COPY: Record<AppLocale, { seller: string; admin: string }> = {
  en: {
    seller: "Featured payments are unavailable for this destination. Do not pay or upload proof. Contact support if you have an existing request or already paid. Free posting remains available.",
    admin: "New Featured requests are blocked until a real HesabPay destination is configured. Blank values and the setup placeholder are not accepted. This check does not verify merchant ownership.",
  },
  fa: {
    seller: "پرداخت اعلان ویژه برای این مقصد در دسترس نیست. پرداخت نکنید و رسید بارگذاری نکنید. اگر درخواست قبلی دارید یا قبلاً پرداخت کرده‌اید، با پشتیبانی تماس بگیرید. ثبت رایگان اعلان همچنان فعال است.",
    admin: "تا تنظیم مقصد واقعی HesabPay، درخواست تازهٔ اعلان ویژه بسته است. مقدار خالی و متن موقت راه‌اندازی پذیرفته نمی‌شود. این بررسی مالکیت حساب تاجر را تأیید نمی‌کند.",
  },
  ps: {
    seller: "د دې ځای لپاره د ځانګړي اعلان تادیه شونې نه ده. پیسې مه ورکوئ او رسید مه پورته کوئ. که پخوانۍ غوښتنه لرئ یا مو مخکې پیسې ورکړې وي، له ملاتړ سره اړیکه ونیسئ. وړیا اعلان ورکول لا هم فعال دي.",
    admin: "تر هغه چې د HesabPay اصلي د تادیې ځای تنظیم نه شي، د ځانګړي اعلان نوې غوښتنې بندې دي. تش ارزښت او د تنظیم موقتي متن نه منل کېږي. دا کتنه د سوداګر د حساب مالکیت نه تاییدوي.",
  },
};

import { normalizeSearchText } from "@/lib/search/multilingual";
import { AFGHAN_PROVINCES } from "@/lib/constants/marketplace";

export type NormalizedPhone = {
  original: string;
  normalized: string | null;
  hint: string | null;
};

export type TelegramCandidatePrefill = {
  normalizedPhone: string | null;
  priceAmount: number | null;
  priceCurrency: "AFN" | "USD" | null;
  priceAfn: number | null;
  province: (typeof AFGHAN_PROVINCES)[number] | null;
};

const PROVINCE_ALIASES: Partial<Record<(typeof AFGHAN_PROVINCES)[number], string[]>> = {
  Badakhshan: ["بدخشان"],
  Badghis: ["بادغیس"],
  Baghlan: ["بغلان"],
  Balkh: ["بلخ", "مزار", "مزار شریف", "mazar", "mazar-i-sharif"],
  Bamyan: ["بامیان"],
  Daykundi: ["دایکندی", "دایکنډي"],
  Farah: ["فراه"],
  Faryab: ["فاریاب"],
  Ghazni: ["غزنی", "غزني"],
  Ghor: ["غور"],
  Helmand: ["هلمند"],
  Herat: ["هرات"],
  Jowzjan: ["جوزجان"],
  Kabul: ["کابل", "kaboul"],
  Kandahar: ["کندهار"],
  Kapisa: ["کاپیسا"],
  Khost: ["خوست"],
  Kunar: ["کنر", "کنړ"],
  Kunduz: ["کندز"],
  Laghman: ["لغمان"],
  Logar: ["لوگر", "لوګر"],
  Nangarhar: ["ننگرهار", "ننګرهار", "جلال آباد", "جلال اباد", "jalalabad"],
  Nimruz: ["نیمروز"],
  Nuristan: ["نورستان"],
  Paktia: ["پکتیا"],
  Paktika: ["پکتیکا"],
  Panjshir: ["پنجشیر", "پنجشېر"],
  Parwan: ["پروان"],
  Samangan: ["سمنگان", "سمنګان"],
  "Sar-e Pol": ["سرپل", "سر پل", "sar e pol", "sar-e-pul"],
  Takhar: ["تخار"],
  Uruzgan: ["ارزگان", "اروزګان"],
  Wardak: ["وردک", "وردګ", "میدان وردک", "ميدان وردک"],
  Zabul: ["زابل"],
};

function normalizeLocalizedDigits(input: unknown) {
  return String(input ?? "")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)));
}

export function normalizeAfghanistanPhone(input: unknown): NormalizedPhone {
  const original = String(input ?? "").trim();
  const digits = original.replace(/[^\d+]/g, "");
  let numeric = digits.replace(/[^\d]/g, "");

  if (numeric.startsWith("0093")) numeric = numeric.slice(2);
  if (numeric.startsWith("93")) numeric = numeric.slice(2);
  if (numeric.startsWith("0")) numeric = numeric.slice(1);

  if (!/^7\d{8}$/.test(numeric)) {
    return { original, normalized: null, hint: null };
  }

  const normalized = `+93${numeric}`;
  return {
    original,
    normalized,
    hint: `${normalized.slice(0, 5)}••••${normalized.slice(-2)}`,
  };
}

export function extractAfghanistanPhone(input: unknown): NormalizedPhone {
  const text = normalizeLocalizedDigits(input);
  const candidates = text.match(/(?<!\d)(?:(?:\+?93|0093|0)[\s().-]*)?7(?:[\s().-]*\d){8}(?!\d)/g) ?? [];

  for (const candidate of candidates) {
    const normalized = normalizeAfghanistanPhone(candidate);
    if (normalized.normalized) return normalized;
  }

  return { original: "", normalized: null, hint: null };
}

function detectExplicitPrice(input: unknown) {
  const text = normalizeLocalizedDigits(input).replace(/\u00a0/g, " ");
  const amount = "(\\d{1,3}(?:[,،.\\s]\\d{3})+|\\d{2,9})";
  const afn = "(?:afn|افغانی|افغانى|افغانۍ)";
  const usd = "(?:usd|us\\$|\\$|دالر|دلار)";
  const label = "(?:price|قیمت|قيمت|نرخ|بیه|بيه)";
  const patterns: Array<{ regex: RegExp; currency: "AFN" | "USD"; amountGroup: number }> = [
    { regex: new RegExp(`${label}\\s*[:：=-]?\\s*${amount}\\s*${afn}`, "iu"), currency: "AFN", amountGroup: 1 },
    { regex: new RegExp(`${label}\\s*[:：=-]?\\s*${amount}\\s*${usd}`, "iu"), currency: "USD", amountGroup: 1 },
    { regex: new RegExp(`${afn}\\s*${amount}`, "iu"), currency: "AFN", amountGroup: 1 },
    { regex: new RegExp(`${usd}\\s*${amount}`, "iu"), currency: "USD", amountGroup: 1 },
    { regex: new RegExp(`${amount}\\s*${afn}`, "iu"), currency: "AFN", amountGroup: 1 },
    { regex: new RegExp(`${amount}\\s*${usd}`, "iu"), currency: "USD", amountGroup: 1 },
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern.regex);
    if (!match) continue;
    const parsed = Number(match[pattern.amountGroup].replace(/[,،.\s]/g, ""));
    if (Number.isSafeInteger(parsed) && parsed > 0) {
      return { amount: parsed, currency: pattern.currency };
    }
  }

  return { amount: null, currency: null };
}

function containsProvinceAlias(text: string, alias: string) {
  const normalizedAlias = normalizeSearchText(alias).toLowerCase();
  if (!normalizedAlias) return false;
  const escaped = normalizedAlias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, "iu").test(text);
}

function detectProvince(input: unknown): (typeof AFGHAN_PROVINCES)[number] | null {
  const text = normalizeSearchText(normalizeLocalizedDigits(input)).toLowerCase();
  for (const province of AFGHAN_PROVINCES) {
    const aliases = [province, ...(PROVINCE_ALIASES[province] ?? [])];
    if (aliases.some((alias) => containsProvinceAlias(text, alias))) return province;
  }
  return null;
}

export function extractTelegramCandidatePrefill(input: unknown): TelegramCandidatePrefill {
  const phone = extractAfghanistanPhone(input).normalized;
  const price = detectExplicitPrice(input);
  return {
    normalizedPhone: phone,
    priceAmount: price.amount,
    priceCurrency: price.currency,
    priceAfn: price.currency === "AFN" ? price.amount : null,
    province: detectProvince(input),
  };
}

export function normalizePriceToAfn(price: unknown, currency: unknown = "AFN") {
  const raw = String(price ?? "").replace(/[,،\s]/g, "");
  const numeric = Number(raw.replace(/[^\d.]/g, ""));
  const code = String(currency ?? "AFN").trim().toUpperCase();

  return {
    originalText: String(price ?? "").trim(),
    originalCurrency: code || "AFN",
    amountAfn: Number.isFinite(numeric) && numeric >= 0 && code === "AFN" ? numeric : null,
    amountOriginal: Number.isFinite(numeric) && numeric >= 0 ? numeric : null,
  };
}

export function normalizeInventoryText(input: unknown) {
  return normalizeSearchText(String(input ?? ""))
    .replace(/\s+/g, " ")
    .trim();
}

export function assertSafeExternalUrl(input: unknown): { ok: true; url: string } | { ok: false; reason: string } {
  const raw = String(input ?? "").trim();
  if (!raw) return { ok: false, reason: "missing_url" };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, reason: "invalid_url" };
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return { ok: false, reason: "blocked_scheme" };
  }

  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    /^169\.254\./.test(host)
  ) {
    return { ok: false, reason: "private_network_blocked" };
  }

  parsed.hash = "";
  return { ok: true, url: parsed.toString() };
}

export function candidateIdempotencyKey(parts: Array<unknown>) {
  return parts
    .map((part) => normalizeInventoryText(part).toLowerCase())
    .filter(Boolean)
    .join("|");
}

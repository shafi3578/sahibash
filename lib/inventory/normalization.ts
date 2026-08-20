import { normalizeSearchText } from "@/lib/search/multilingual";

export type NormalizedPhone = {
  original: string;
  normalized: string | null;
  hint: string | null;
};

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

const CHAR_NORMALIZATION_MAP: Record<string, string> = {
  ي: "ی",
  ى: "ی",
  ئ: "ی",
  ك: "ک",
  ة: "ه",
  ۀ: "ه",
  أ: "ا",
  إ: "ا",
  ٱ: "ا",
  آ: "ا",
  ؤ: "و",
};

const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";
const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

const SYNONYM_GROUPS: string[][] = [
  ["phone", "mobile", "cellphone", "تلیفون", "ټیلیفون", "موبایل", "مبایل", "گوشی"],
  ["iphone", "i phone", "ایفون", "آیفون", "ایفون"],
  ["samsung", "سامسونگ", "سامسنگ", "galaxy", "گلکسی"],
  ["xiaomi", "redmi", "شیائومی", "شاومی", "شیاومی", "ردمی", "ریدمی"],
  ["huawei", "هواوی", "هواوي"],
  ["toyota", "تویوتا", "تایوتا"],
  ["fielder", "فیلدر", "فیلډر"],
  ["honda", "هوندا", "هندا"],
  ["dell", "دل"],
  ["hp", "اچ پی"],
  ["lenovo", "لنوو"],
  ["جور آمد", "جورامد", "جور امد", "قابل جور آمد", "negotiable"],
  ["مقطوع", "fixed price", "یک کلام", "قیمت آخر", "final price"],
  ["مالچه", "بدل", "تبادله", "exchange", "trade"],
  ["کارتن دار", "کارتن دارد", "with box"],
  ["بی کارتن", "بدون کارتن", "without box"],
  ["راجستر ایران", "رجستر ایران", "iran registered"],
  ["راجستر شده", "registered"],
  ["سیم لاک", "sim lock", "sim locked"],
  ["بایپس", "bypass", "bypassed"],
  ["فنگر", "fingerprint"],
  ["فیس ایدی", "فیس آیدی", "face id"],
  ["باطری کمپنی", "original battery"],
  ["السیدی کمپنی", "original lcd"],
  ["چک چک", "fully working", "working", "ثابت"],
  ["فروشی", "for sale"],
  ["فروش عاجل", "urgent sale"],
  ["خریدارم", "wanted"],
  ["ضرورت دارم", "نیاز دارم", "needed"],
];

function normalizeDigits(input: string): string {
  let out = "";
  for (const char of input) {
    const pIdx = PERSIAN_DIGITS.indexOf(char);
    if (pIdx >= 0) {
      out += String(pIdx);
      continue;
    }
    const aIdx = ARABIC_DIGITS.indexOf(char);
    if (aIdx >= 0) {
      out += String(aIdx);
      continue;
    }
    out += char;
  }
  return out;
}

export function normalizeSearchText(input: string): string {
  const lowered = String(input ?? "").toLowerCase();
  const mapped = Array.from(lowered)
    .map((char) => CHAR_NORMALIZATION_MAP[char] ?? char)
    .join("");

  const withoutControls = mapped
    .replace(/[\u200c\u200d\u200e\u200f\ufeff]/g, "")
    .replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g, "");

  const digitNormalized = normalizeDigits(withoutControls);
  return digitNormalized
    .replace(/[_.:,;!?()[\]{}'"`~|\\/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenizeNormalizedSearch(input: string): string[] {
  return normalizeSearchText(input)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 0);
}

function buildAliasLookup() {
  const lookup = new Map<string, Set<string>>();
  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = Array.from(new Set(group.map((term) => normalizeSearchText(term)).filter(Boolean)));
    for (const term of normalizedGroup) {
      if (!lookup.has(term)) {
        lookup.set(term, new Set<string>());
      }
      for (const item of normalizedGroup) {
        lookup.get(term)?.add(item);
      }
    }
  }
  return lookup;
}

const ALIAS_LOOKUP = buildAliasLookup();

export function expandSearchVariants(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];

  const variants = new Set<string>([normalized]);
  const tokens = tokenizeNormalizedSearch(normalized);

  if (ALIAS_LOOKUP.has(normalized)) {
    for (const alias of ALIAS_LOOKUP.get(normalized) ?? []) {
      variants.add(alias);
    }
  }

  for (const token of tokens) {
    variants.add(token);
    if (ALIAS_LOOKUP.has(token)) {
      for (const alias of ALIAS_LOOKUP.get(token) ?? []) {
        variants.add(alias);
      }
    }
  }

  if (normalized.includes("iphone")) variants.add("i phone");
  if (normalized.includes("i phone")) variants.add("iphone");

  return Array.from(variants)
    .map((term) => term.trim())
    .filter((term) => term.length >= 2)
    .slice(0, 50);
}

export function buildSearchKeywordIndex(title: string, description: string): string {
  const combined = normalizeSearchText(`${title} ${description}`);
  if (!combined) return "";

  const terms = new Set<string>();
  const tokens = tokenizeNormalizedSearch(combined);

  for (const token of tokens) {
    if (token.length >= 2) {
      terms.add(token);
    }
    if (ALIAS_LOOKUP.has(token)) {
      for (const alias of ALIAS_LOOKUP.get(token) ?? []) {
        terms.add(alias);
      }
    }
  }

  for (const group of SYNONYM_GROUPS) {
    const normalizedGroup = group.map((term) => normalizeSearchText(term));
    if (normalizedGroup.some((term) => term && combined.includes(term))) {
      normalizedGroup.forEach((term) => term && terms.add(term));
    }
  }

  return Array.from(terms).join(" ");
}

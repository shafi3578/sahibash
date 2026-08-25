export type ShadowModerationInput = {
  listingId: string;
  title: string;
  description: string;
  price: number;
  categoryPath?: string | null;
};

const PROHIBITED_TERMS = [
  "gun",
  "rifle",
  "pistol",
  "weapon",
  "passport for sale",
  "fake document",
  "drug",
  "اسلحه",
  "تفنگ",
  "کلاشینکوف",
  "مواد مخدر",
  "پاسپورت فروشی",
  "جعلی",
  "وسله",
  "توپک",
  "نشه",
  "جعلي سند",
];

const PHONE_PATTERN = /(?:\+?93|0)?\s*(?:7[0-9])(?:[\s-]?\d){7}\b/;

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function buildShadowModerationSuggestion(input: ShadowModerationInput) {
  const title = String(input.title ?? "").trim();
  const description = String(input.description ?? "").trim();
  const combined = `${title} ${description}`.toLowerCase();
  const prohibited = PROHIBITED_TERMS.filter((term) => combined.includes(term.toLowerCase()));
  const phoneInDescription = PHONE_PATTERN.test(description);
  const suspiciousPrice = Number(input.price) > 0 && Number(input.price) < 50 && /car|موتر|کرولا|corolla|iphone|آیفون/i.test(combined);
  const spamSignals = [
    phoneInDescription ? "phone_in_description" : "",
    /(whatsapp|تلگرام|telegram|واتساپ).{0,25}(only|فقط|یوازې)/i.test(combined) ? "external_contact_push" : "",
    /(urgent|عاجل|بیړه).{0,20}(pay|پرداخت|پیسې)/i.test(combined) ? "pressure_language" : "",
  ].filter(Boolean);
  const qualitySignals = [
    title.length >= 12 ? 0.2 : 0,
    description.length >= 80 ? 0.25 : description.length >= 30 ? 0.12 : 0,
    Number(input.price) > 0 ? 0.2 : 0,
    input.categoryPath ? 0.15 : 0,
    !phoneInDescription ? 0.1 : 0,
    prohibited.length === 0 ? 0.1 : 0,
  ];
  const qualityScore = clamp(qualitySignals.reduce((sum, value) => sum + value, 0));
  const reasonCodes = [
    ...prohibited.map((term) => `prohibited_term:${term}`),
    phoneInDescription ? "phone_in_description" : "",
    suspiciousPrice ? "suspicious_price" : "",
    qualityScore < 0.45 ? "low_listing_quality" : "",
    ...spamSignals,
  ].filter(Boolean);

  const decisionSuggestion = prohibited.length > 0
    ? "block"
    : phoneInDescription || suspiciousPrice || qualityScore < 0.45
      ? "review"
      : "approve";

  const confidence = prohibited.length > 0
    ? 0.92
    : reasonCodes.length > 0
      ? 0.72
      : 0.64;

  return {
    mode: "shadow",
    decision_suggestion: decisionSuggestion,
    confidence,
    quality_score: qualityScore,
    category_confidence: input.categoryPath ? 0.78 : 0.35,
    prohibited_content_signals: prohibited,
    spam_signals: spamSignals,
    duplicate_signals: [],
    phone_in_description: phoneInDescription,
    suspicious_price: suspiciousPrice,
    reason_codes: reasonCodes,
    seller_safe_explanation:
      decisionSuggestion === "approve"
        ? "Listing appears complete enough for normal human/rule review."
        : "Please review missing details, unsafe terms, contact details in description, or suspicious price before publication.",
  } as const;
}

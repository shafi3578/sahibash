import type { AppLocale } from "@/lib/i18n/translations";
import { buildSearchKeywordIndex, normalizeSearchText } from "@/lib/search/multilingual";

export const LISTING_LANGUAGE_CODES = ["en", "fa-AF", "ps-AF"] as const;
export type ListingLanguageCode = (typeof LISTING_LANGUAGE_CODES)[number];

export type TranslationStatus = "pending" | "completed" | "failed" | "stale" | "needs_review";
export type TranslationActor = "ai" | "human" | "seller";

export type ListingTranslationRecord = {
  id: string;
  listing_id: string;
  language_code: ListingLanguageCode;
  title: string;
  description: string;
  normalized_keywords: string | null;
  translation_status: TranslationStatus;
  translated_by: TranslationActor;
  translation_quality: string | null;
  source_hash: string | null;
  is_stale: boolean;
  created_at: string;
  updated_at: string;
};

const APP_TO_LISTING_LOCALE: Record<AppLocale, ListingLanguageCode> = {
  en: "en",
  fa: "fa-AF",
  ps: "ps-AF",
};

const LANGUAGE_LABELS: Record<ListingLanguageCode, string> = {
  en: "English",
  "fa-AF": "Dari",
  "ps-AF": "Pashto",
};

type GlossaryEntry = {
  canonical: string;
  en: string;
  fa: string;
  ps: string;
  aliases?: string[];
};

const AFGHAN_MARKETPLACE_GLOSSARY: GlossaryEntry[] = [
  { canonical: "phone", en: "phone", fa: "موبایل", ps: "تلیفون", aliases: ["مبایل", "mobile", "cellphone"] },
  { canonical: "negotiable", en: "negotiable", fa: "جور آمد", ps: "جوړ راشه", aliases: ["جورامد"] },
  { canonical: "fixed price", en: "fixed price", fa: "مقطوع", ps: "ثابت نرخ" },
  { canonical: "last price", en: "last price", fa: "قیمت آخر", ps: "وروستی نرخ" },
  { canonical: "exchange", en: "exchange", fa: "مالچه", ps: "تبادله" },
  { canonical: "with box", en: "with box", fa: "کارتن دار", ps: "له کارتن سره" },
  { canonical: "without box", en: "without box", fa: "بی کارتن", ps: "بې کارټنه" },
  { canonical: "iran registered", en: "Iran registered", fa: "راجستر ایران", ps: "ایران راجستر" },
  { canonical: "for sale", en: "for sale", fa: "فروشی", ps: "د خرڅلاو لپاره" },
  { canonical: "urgent sale", en: "urgent sale", fa: "فروش عاجل", ps: "بیړنی خرڅلاو" },
  { canonical: "wanted", en: "wanted", fa: "خریدارم", ps: "غواړم واخلم" },
  { canonical: "i need", en: "I need", fa: "ضرورت دارم", ps: "ضرورت لرم" },
  { canonical: "working", en: "working", fa: "ثابت", ps: "کار کوي" },
  { canonical: "fully working", en: "fully working", fa: "چک چک", ps: "پوره کار کوي" },
  { canonical: "guarantee", en: "guarantee", fa: "ضمانت", ps: "تضمین" },
  { canonical: "location", en: "location", fa: "موقعیت", ps: "موقعیت" },
  { canonical: "phone number", en: "phone number", fa: "شماره تماس", ps: "د تماس شمېره" },
  { canonical: "private message", en: "private message", fa: "پیوی", ps: "شخصي پیغام" },
  { canonical: "documents", en: "documents", fa: "اسناد", ps: "اسناد" },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ");
}

function inferScriptLanguage(text: string): ListingLanguageCode {
  const sample = normalizeWhitespace(stripHtml(text));
  if (!sample) {
    return "en";
  }

  const hasArabicScript = /[\u0600-\u06FF]/.test(sample);
  if (!hasArabicScript) {
    return "en";
  }

  const pashtoSignals = /[ټځڅډړږښګڼۍې]/;
  return pashtoSignals.test(sample) ? "ps-AF" : "fa-AF";
}

function detectLocaleFromTitleDescription(title: string, description: string): ListingLanguageCode {
  const combined = `${title} ${description}`;
  return inferScriptLanguage(combined);
}

function placeholdersForProtectedTokens(input: string) {
  const protectedPatterns = [
    /(?:\+?\d[\d\s\-()]{6,}\d)/g,
    /\b\d[\d,.]*\s?(?:AFN|USD|\$)\b/gi,
    /\b\d[\d,.]*\s?(?:GB|TB|RAM|KM|CC|VIN|MAH|MP|INCH|IN)\b/gi,
    /\b[A-Z0-9]{6,}\b/g,
  ];

  let text = input;
  const tokens: string[] = [];

  for (const pattern of protectedPatterns) {
    text = text.replace(pattern, (match) => {
      const token = `__KEEP_${tokens.length}__`;
      tokens.push(match);
      return token;
    });
  }

  return { text, tokens };
}

function restoreProtectedTokens(input: string, tokens: string[]) {
  let text = input;
  tokens.forEach((value, index) => {
    text = text.replace(new RegExp(`__KEEP_${index}__`, "g"), value);
  });
  return text;
}

function getTerm(entry: GlossaryEntry, locale: ListingLanguageCode) {
  if (locale === "fa-AF") return entry.fa;
  if (locale === "ps-AF") return entry.ps;
  return entry.en;
}

function replaceGlossaryTerms(
  input: string,
  sourceLocale: ListingLanguageCode,
  targetLocale: ListingLanguageCode
) {
  if (sourceLocale === targetLocale) {
    return input;
  }

  let text = input;

  for (const entry of AFGHAN_MARKETPLACE_GLOSSARY) {
    const sourceTerms = [getTerm(entry, sourceLocale), ...(entry.aliases ?? [])]
      .map((term) => term.trim())
      .filter(Boolean);

    const targetTerm = getTerm(entry, targetLocale);
    for (const sourceTerm of sourceTerms) {
      const isLatin = /^[\x00-\x7F]+$/.test(sourceTerm);
      const pattern = isLatin
        ? new RegExp(`\\b${escapeRegExp(sourceTerm)}\\b`, "gi")
        : new RegExp(escapeRegExp(sourceTerm), "g");
      text = text.replace(pattern, targetTerm);
    }
  }

  return text;
}

async function translateWithOpenAI(
  sourceLocale: ListingLanguageCode,
  targetLocale: ListingLanguageCode,
  title: string,
  description: string
): Promise<{ title: string; description: string } | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return null;
  }

  const system = [
    "You are translating Afghanistan marketplace listing text.",
    "Return JSON only: {\"title\": string, \"description\": string}.",
    "Preserve brand names, model names, VIN/plate values, phone numbers, numeric specs, and all numbers.",
    "Use natural marketplace phrasing in target language.",
    "Never add explanations.",
  ].join(" ");

  const glossary = AFGHAN_MARKETPLACE_GLOSSARY
    .map((entry) => `${entry.fa} | ${entry.ps} | ${entry.en}`)
    .join("\n");

  const user = [
    `Source locale: ${sourceLocale}`,
    `Target locale: ${targetLocale}`,
    "Glossary:",
    glossary,
    "Input JSON:",
    JSON.stringify({ title, description }),
  ].join("\n");

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        temperature: 0.1,
        max_output_tokens: 450,
        input: [
          { role: "system", content: [{ type: "input_text", text: system }] },
          { role: "user", content: [{ type: "input_text", text: user }] },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as { output_text?: string };
    const output = String(payload.output_text ?? "").trim();
    if (!output) {
      return null;
    }

    const parsed = JSON.parse(output) as { title?: string; description?: string };
    if (!parsed.title || !parsed.description) {
      return null;
    }

    return {
      title: normalizeWhitespace(parsed.title),
      description: normalizeWhitespace(parsed.description),
    };
  } catch {
    return null;
  }
}

export function appLocaleToListingLanguage(locale: AppLocale): ListingLanguageCode {
  return APP_TO_LISTING_LOCALE[locale] ?? "en";
}

export function listingLanguageLabel(code: ListingLanguageCode | null | undefined): string {
  if (!code) {
    return "Unknown";
  }
  return LANGUAGE_LABELS[code] ?? code;
}

export function detectOriginalListingLanguage(title: string, description: string) {
  const locale = detectLocaleFromTitleDescription(title, description);
  return {
    original_language: listingLanguageLabel(locale),
    original_locale: locale,
  };
}

export function normalizeTranslationKeywords(
  sourceTitle: string,
  sourceDescription: string,
  sourceLocale: ListingLanguageCode
): string {
  const text = normalizeSearchText(`${sourceTitle} ${sourceDescription}`);
  const terms = new Set<string>();
  const indexedTerms = buildSearchKeywordIndex(sourceTitle, sourceDescription)
    .split(" ")
    .map((term) => term.trim())
    .filter(Boolean);

  indexedTerms.forEach((term) => terms.add(term));

  for (const entry of AFGHAN_MARKETPLACE_GLOSSARY) {
    const sourceTerm = getTerm(entry, sourceLocale).toLowerCase();
    const aliases = (entry.aliases ?? []).map((alias) => alias.toLowerCase());
    const hit = [sourceTerm, ...aliases].some((candidate) => candidate && text.includes(candidate));
    if (!hit) {
      continue;
    }

    terms.add(entry.canonical.toLowerCase());
    terms.add(entry.en.toLowerCase());
    terms.add(entry.fa.toLowerCase());
    terms.add(entry.ps.toLowerCase());
  }

  const sourceTokens = normalizeWhitespace(text)
    .split(" ")
    .map((token) => token.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter((token) => token.length >= 2)
    .slice(0, 40);

  sourceTokens.forEach((token) => terms.add(token));

  return Array.from(terms).join(" ");
}

export async function translateListingText(params: {
  sourceLocale: ListingLanguageCode;
  targetLocale: ListingLanguageCode;
  title: string;
  description: string;
}) {
  const { sourceLocale, targetLocale } = params;
  if (sourceLocale === targetLocale) {
    return {
      title: params.title,
      description: params.description,
      translation_status: "completed" as TranslationStatus,
      translated_by: "seller" as TranslationActor,
      translation_quality: "source",
    };
  }

  const protectedTitle = placeholdersForProtectedTokens(params.title);
  const protectedDescription = placeholdersForProtectedTokens(params.description);

  const aiResult = await translateWithOpenAI(
    sourceLocale,
    targetLocale,
    protectedTitle.text,
    protectedDescription.text
  );

  if (aiResult) {
    return {
      title: restoreProtectedTokens(aiResult.title, protectedTitle.tokens),
      description: restoreProtectedTokens(aiResult.description, protectedDescription.tokens),
      translation_status: "completed" as TranslationStatus,
      translated_by: "ai" as TranslationActor,
      translation_quality: "high",
    };
  }

  const glossaryTitle = replaceGlossaryTerms(protectedTitle.text, sourceLocale, targetLocale);
  const glossaryDescription = replaceGlossaryTerms(protectedDescription.text, sourceLocale, targetLocale);

  return {
    title: restoreProtectedTokens(glossaryTitle, protectedTitle.tokens),
    description: restoreProtectedTokens(glossaryDescription, protectedDescription.tokens),
    translation_status: "completed" as TranslationStatus,
    translated_by: "ai" as TranslationActor,
    translation_quality: "medium",
  };
}

export function sourceHash(title: string, description: string) {
  return `${title.trim()}::${description.trim()}`;
}

export async function queueListingTranslationJobs(
  supabase: any,
  args: {
    listingId: string;
    title: string;
    description: string;
    originalLocale: ListingLanguageCode;
  }
) {
  const { listingId, title, description, originalLocale } = args;
  const hash = sourceHash(title, description);

  const targetLocales = LISTING_LANGUAGE_CODES.filter((code) => code !== originalLocale);
  for (const languageCode of targetLocales) {
    await supabase.from("listing_translations").upsert(
      {
        listing_id: listingId,
        language_code: languageCode,
        title,
        description,
        translation_status: "pending",
        translated_by: "ai",
        translation_quality: null,
        normalized_keywords: normalizeTranslationKeywords(title, description, originalLocale),
        source_hash: hash,
        is_stale: false,
      },
      { onConflict: "listing_id,language_code" }
    );

    await supabase.from("listing_translation_jobs").insert({
      listing_id: listingId,
      language_code: languageCode,
      status: "pending",
      source_hash: hash,
    });
  }
}

export async function markListingTranslationsStale(
  supabase: any,
  listingId: string,
  sourceTitle: string,
  sourceDescription: string,
  originalLocale: ListingLanguageCode
) {
  const hash = sourceHash(sourceTitle, sourceDescription);

  await supabase
    .from("listing_translations")
    .update({
      is_stale: true,
      translation_status: "stale",
    })
    .eq("listing_id", listingId);

  await queueListingTranslationJobs(supabase, {
    listingId,
    title: sourceTitle,
    description: sourceDescription,
    originalLocale,
  });

  await supabase
    .from("listing_translation_jobs")
    .update({ status: "pending", source_hash: hash })
    .eq("listing_id", listingId)
    .in("language_code", LISTING_LANGUAGE_CODES.filter((code) => code !== originalLocale));
}

export async function processPendingListingTranslationJobs(
  supabase: any,
  options?: { listingId?: string; limit?: number }
) {
  const limit = Math.max(1, Math.min(20, options?.limit ?? 5));

  let query = supabase
    .from("listing_translation_jobs")
    .select("id, listing_id, language_code, source_hash, attempts")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(limit);

  if (options?.listingId) {
    query = query.eq("listing_id", options.listingId);
  }

  const { data: jobs } = await query;
  if (!jobs || jobs.length === 0) {
    return;
  }

  for (const job of jobs as Array<{ id: string; listing_id: string; language_code: ListingLanguageCode; source_hash: string | null; attempts?: number }>) {
    try {
      const { data: listing } = await supabase
        .from("listings")
        .select("id, title, description, original_title, original_description, original_locale")
        .eq("id", job.listing_id)
        .maybeSingle();

      if (!listing) {
        await supabase.from("listing_translation_jobs").update({ status: "failed" }).eq("id", job.id);
        continue;
      }

      const sourceTitle = String(listing.original_title ?? listing.title ?? "");
      const sourceDescription = String(listing.original_description ?? listing.description ?? "");
      const sourceLocale = (listing.original_locale as ListingLanguageCode | null) ?? detectLocaleFromTitleDescription(sourceTitle, sourceDescription);

      const translated = await translateListingText({
        sourceLocale,
        targetLocale: job.language_code,
        title: sourceTitle,
        description: sourceDescription,
      });

      await supabase.from("listing_translations").upsert(
        {
          listing_id: listing.id,
          language_code: job.language_code,
          title: translated.title,
          description: translated.description,
          translation_status: translated.translation_status,
          translated_by: translated.translated_by,
          translation_quality: translated.translation_quality,
          normalized_keywords: normalizeTranslationKeywords(sourceTitle, sourceDescription, sourceLocale),
          source_hash: sourceHash(sourceTitle, sourceDescription),
          is_stale: false,
        },
        { onConflict: "listing_id,language_code" }
      );

      await supabase.from("listing_translation_jobs").update({
        status: "completed",
        processed_at: new Date().toISOString(),
      }).eq("id", job.id);
    } catch {
      await supabase.from("listing_translation_jobs").update({
        status: "failed",
        attempts: Number(job.attempts ?? 0) + 1,
      }).eq("id", job.id);
    }
  }
}

export async function getCompletedListingTranslations(
  supabase: any,
  listingIds: string[],
  languageCode: ListingLanguageCode
): Promise<Record<string, ListingTranslationRecord>> {
  if (listingIds.length === 0) {
    return {};
  }

  const { data } = await supabase
    .from("listing_translations")
    .select("*")
    .in("listing_id", listingIds)
    .eq("language_code", languageCode)
    .eq("translation_status", "completed")
    .order("is_stale", { ascending: true })
    .order("updated_at", { ascending: false });

  const map: Record<string, ListingTranslationRecord> = {};
  for (const row of (data ?? []) as ListingTranslationRecord[]) {
    if (!map[row.listing_id]) {
      map[row.listing_id] = row;
    }
  }

  return map;
}

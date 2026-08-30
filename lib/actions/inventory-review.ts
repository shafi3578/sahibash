"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireSuperAdministrator } from "@/lib/auth";
import { assertSafeExternalUrl, normalizeAfghanistanPhone } from "@/lib/inventory/normalization";
import { normalizeListingSchemaConfig, type ConfiguredListingField } from "@/lib/listing-schema-config";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  normalizeVehicleDamageParts,
  shouldShowVehicleDamageDiagram,
} from "@/lib/vehicles/damage-report";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PUBLIC_PHONE_PATTERN = /(?:\+?93|0)?7[0-9]{8}/;

export type CandidateReviewState = {
  status: "idle" | "success" | "error";
  code: "idle" | "saved" | "ready" | "invalid" | "missing_media" | "failed";
  errors?: Array<{ field: string; code: string }>;
};

type CandidateRecord = {
  id: string;
  status: string;
  source_id: string | null;
  candidate_listing_id: string | null;
  normalized_payload: Record<string, unknown> | null;
};

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  return String(value ?? "").replace(/\r\n?/g, "\n").trim().slice(0, maxLength);
}

function addError(
  errors: Array<{ field: string; code: string }>,
  field: string,
  code: string,
) {
  if (!errors.some((error) => error.field === field && error.code === code)) {
    errors.push({ field, code });
  }
}

function detailValue(formData: FormData, field: ConfiguredListingField) {
  const values = formData.getAll(`detail__${field.key}`).map((value) => String(value).trim());
  const raw = values.at(-1) ?? "";
  if (field.type === "boolean") return raw === "true";
  if (!raw) return undefined;
  if (field.type === "number") {
    const numeric = Number(raw);
    return Number.isFinite(numeric) ? numeric : undefined;
  }
  return raw.slice(0, 500);
}

export async function saveReviewedIngestCandidate(
  candidateId: string,
  _previousState: CandidateReviewState,
  formData: FormData,
): Promise<CandidateReviewState> {
  void _previousState;
  const actor = await requireSuperAdministrator();
  if (!UUID_PATTERN.test(candidateId)) return { status: "error", code: "failed" };

  const intent = formData.get("intent") === "ready" ? "ready" : "save";
  const categoryNodeId = Number(formData.get("category_node_id"));
  const provinceId = Number(formData.get("province_id"));
  const districtId = Number(formData.get("district_id"));
  const originalLanguage = ["en", "fa", "ps"].includes(String(formData.get("original_language")))
    ? String(formData.get("original_language"))
    : "fa";
  const priceMode = ["contact", "fixed", "negotiable"].includes(String(formData.get("price_mode")))
    ? String(formData.get("price_mode"))
    : "contact";
  const priceInput = cleanText(formData.get("price_afn"), 32).replace(/[,،\s]/g, "");
  const parsedPrice = Number(priceInput);
  const normalizedPrice = priceMode === "contact" ? 0 : parsedPrice;
  const normalizedPhone = normalizeAfghanistanPhone(formData.get("contact_phone"));
  const translations = {
    en: {
      title: cleanText(formData.get("title_en"), 120),
      description: cleanText(formData.get("description_en"), 5000),
    },
    fa: {
      title: cleanText(formData.get("title_fa"), 120),
      description: cleanText(formData.get("description_fa"), 5000),
    },
    ps: {
      title: cleanText(formData.get("title_ps"), 120),
      description: cleanText(formData.get("description_ps"), 5000),
    },
  };
  const errors: Array<{ field: string; code: string }> = [];

  if (!Number.isInteger(categoryNodeId) || categoryNodeId <= 0) addError(errors, "category_node_id", "required");
  if (!Number.isInteger(provinceId) || provinceId <= 0) addError(errors, "province_id", "required");
  if (!Number.isInteger(districtId) || districtId <= 0) addError(errors, "district_id", "required");
  if (!normalizedPhone.normalized) addError(errors, "contact_phone", "invalid");
  if (priceMode !== "contact" && (!Number.isFinite(normalizedPrice) || normalizedPrice <= 0)) {
    addError(errors, "price_afn", "invalid");
  }

  for (const [language, translation] of Object.entries(translations)) {
    if (translation.title.length < 5) addError(errors, `title_${language}`, "too_short");
    if (translation.description.length < 20) addError(errors, `description_${language}`, "too_short");
    if (PUBLIC_PHONE_PATTERN.test(`${translation.title} ${translation.description}`.replace(/\s+/g, ""))) {
      addError(errors, `description_${language}`, "contains_phone");
    }
  }

  const supabase = createSupabaseAdmin();
  const { data: candidateData, error: candidateError } = await supabase
    .from("listing_ingest_candidates")
    .select("id,status,source_id,candidate_listing_id,normalized_payload")
    .eq("id", candidateId)
    .maybeSingle();
  const candidate = candidateData as CandidateRecord | null;
  if (candidateError || !candidate || candidate.candidate_listing_id || candidate.status === "published") {
    return { status: "error", code: "failed" };
  }

  const { data: nodeData } = await supabase
    .from("category_nodes")
    .select("id,category_id,path,is_active,is_leaf")
    .eq("id", categoryNodeId)
    .eq("is_active", true)
    .eq("is_leaf", true)
    .maybeSingle();
  if (!nodeData) {
    addError(errors, "category_node_id", "invalid");
    return { status: "error", code: "invalid", errors };
  }

  const { data: categoryData } = await supabase
    .from("categories")
    .select("id")
    .eq("id", nodeData.category_id)
    .eq("is_active", true)
    .eq("is_coming_soon", false)
    .maybeSingle();
  if (!categoryData) {
    addError(errors, "category_node_id", "unavailable");
    return { status: "error", code: "invalid", errors };
  }

  const { data: schemaData } = await supabase
    .from("listing_schema_versions")
    .select("config")
    .eq("category_node_id", categoryNodeId)
    .eq("status", "published")
    .maybeSingle();

  let fields: ConfiguredListingField[] = [];
  try {
    fields = normalizeListingSchemaConfig(schemaData?.config).fields
      .filter((field) => field.active && field.posting);
  } catch {
    addError(errors, "category_node_id", "schema_unavailable");
  }

  const details: Record<string, string | number | boolean> = {};
  for (const field of fields) {
    const value = detailValue(formData, field);
    if (field.required && (value === undefined || value === "")) {
      addError(errors, `detail__${field.key}`, "required");
      continue;
    }
    if (value === undefined || value === "") continue;
    if (field.type === "number" && typeof value !== "number") {
      addError(errors, `detail__${field.key}`, "invalid");
      continue;
    }
    if (field.type === "select" && !field.options.some((option) => option.value === value)) {
      addError(errors, `detail__${field.key}`, "invalid");
      continue;
    }
    if (field.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
      addError(errors, `detail__${field.key}`, "invalid");
      continue;
    }
    details[field.key] = value;
  }

  const [rootSlug, branchKey] = String(nodeData.path).split("/");
  const expectsVehicleDamage = shouldShowVehicleDamageDiagram(rootSlug, branchKey);
  let damageParts = normalizeVehicleDamageParts([]);
  if (expectsVehicleDamage) {
    try {
      damageParts = normalizeVehicleDamageParts(JSON.parse(cleanText(formData.get("damage_parts_json"), 5000)));
    } catch {
      damageParts = [];
    }
    if (damageParts.length !== 13) addError(errors, "damage_parts_json", "invalid");
  }

  const [{ data: province }, { data: district }, { count: photoCount }] = await Promise.all([
    supabase.from("provinces").select("id,name").eq("id", provinceId).eq("is_active", true).maybeSingle(),
    supabase.from("districts").select("id,name,province_id").eq("id", districtId).eq("is_active", true).maybeSingle(),
    supabase.from("listing_ingest_candidate_media").select("id", { count: "exact", head: true }).eq("candidate_id", candidateId),
  ]);
  if (!province) addError(errors, "province_id", "invalid");
  if (!district || Number(district.province_id) !== provinceId) addError(errors, "district_id", "invalid");
  if (!photoCount) addError(errors, "photos", "required");

  const oldPayload = candidate.normalized_payload ?? {};
  const oldSourceUrl = oldPayload.source_url ?? oldPayload.sourceUrl;
  const safeSourceUrl = assertSafeExternalUrl(oldSourceUrl);
  const original = translations[originalLanguage as keyof typeof translations];
  const vehicle = {
    brand: String(details.make ?? details.brand ?? details.vehicle_brand ?? "").trim(),
    model: String(details.model ?? details.vehicle_model ?? "").trim(),
    year: String(details.year ?? details.vehicle_year ?? "").trim(),
    body_condition_note: cleanText(formData.get("body_condition_note"), 500),
  };
  const normalizedPayload = {
    source_platform: "telegram",
    ...(safeSourceUrl.ok ? { source_url: safeSourceUrl.url } : {}),
    ...(typeof oldPayload.media_group_id === "string" ? { media_group_id: oldPayload.media_group_id } : {}),
    photo_count: photoCount ?? 0,
    title: original.title,
    description: original.description,
    original_language: originalLanguage,
    translations,
    category_path: String(nodeData.path),
    province_id: String(provinceId),
    district_id: String(districtId),
    price_mode: priceMode,
    details,
    vehicle,
    ...(expectsVehicleDamage ? {
      vehicle_damage: {
        all_original: damageParts.every((part) => part.condition === "original"),
        parts: damageParts,
      },
    } : {}),
    review_notes: {
      reviewed_at: new Date().toISOString(),
      note: cleanText(formData.get("review_note"), 1000),
    },
  };

  const markPublishable = intent === "ready" && errors.length === 0;
  const { data: nextStatus, error: saveError } = await supabase.rpc(
    "save_reviewed_ingest_candidate",
    {
      p_candidate_id: candidateId,
      p_actor_id: actor.id,
      p_category_node_id: categoryNodeId,
      p_normalized_payload: normalizedPayload,
      p_normalized_phone: normalizedPhone.normalized,
      p_contact_hash: normalizedPhone.normalized
        ? createHash("sha256").update(normalizedPhone.normalized).digest("hex")
        : null,
      p_normalized_location: province && district ? `${province.name} / ${district.name}` : "",
      p_normalized_price_afn: Number.isFinite(normalizedPrice) ? normalizedPrice : null,
      p_validation_errors: errors,
      p_mark_publishable: markPublishable,
    },
  );
  if (saveError || (nextStatus !== "needs_review" && nextStatus !== "publishable")) {
    return { status: "error", code: "failed" };
  }

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/candidates/${candidateId}`);
  if (markPublishable) return { status: "success", code: "ready" };
  return {
    status: errors.length > 0 ? "error" : "success",
    code: errors.some((error) => error.field === "photos") ? "missing_media" : errors.length > 0 ? "invalid" : "saved",
    errors,
  };
}

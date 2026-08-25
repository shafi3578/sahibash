import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildShadowModerationSuggestion,
  type ShadowModerationInput,
} from "@/lib/ai/moderation-core";

export { buildShadowModerationSuggestion };

type RiskSignalType =
  | "duplicate_content"
  | "repeated_phone"
  | "implausible_price"
  | "prohibited_term"
  | "external_contact_spam"
  | "rapid_posting"
  | "user_reports";

type ShadowModerationSuggestion = ReturnType<typeof buildShadowModerationSuggestion>;

function riskSignalsForSuggestion(suggestion: ShadowModerationSuggestion): RiskSignalType[] {
  const signals = new Set<RiskSignalType>();

  if (suggestion.prohibited_content_signals.length > 0) {
    signals.add("prohibited_term");
  }
  if (suggestion.phone_in_description) {
    signals.add("external_contact_spam");
    signals.add("repeated_phone");
  }
  if (suggestion.suspicious_price) {
    signals.add("implausible_price");
  }
  if (suggestion.spam_signals.length > 0) {
    signals.add("external_contact_spam");
  }
  if (suggestion.duplicate_signals.length > 0) {
    signals.add("duplicate_content");
  }

  return Array.from(signals);
}

function riskScoreFor(signalType: RiskSignalType, suggestion: ShadowModerationSuggestion) {
  const base = Math.round(suggestion.confidence * 100);
  if (signalType === "prohibited_term") return Math.max(base, 92);
  if (signalType === "implausible_price") return Math.max(base, 72);
  if (signalType === "external_contact_spam" || signalType === "repeated_phone") return Math.max(base, 68);
  return Math.max(1, Math.min(100, base));
}

function compactEvidence(suggestion: ShadowModerationSuggestion, extra: Record<string, unknown> = {}) {
  return {
    source: "ai_shadow_moderation",
    decision_suggestion: suggestion.decision_suggestion,
    confidence: suggestion.confidence,
    quality_score: suggestion.quality_score,
    category_confidence: suggestion.category_confidence,
    reason_codes: suggestion.reason_codes.slice(0, 20),
    prohibited_content_signals: suggestion.prohibited_content_signals.slice(0, 10),
    spam_signals: suggestion.spam_signals.slice(0, 10),
    duplicate_signals: suggestion.duplicate_signals.slice(0, 10),
    phone_in_description: suggestion.phone_in_description,
    suspicious_price: suggestion.suspicious_price,
    ...extra,
  };
}

export async function recordShadowModerationReview(input: ShadowModerationInput) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const supabase = createSupabaseAdmin();
    const suggestion = buildShadowModerationSuggestion(input);
    const { data: reviewRow } = await supabase.from("ai_moderation_reviews").insert({
      listing_id: input.listingId,
      ...suggestion,
    }).select("id").maybeSingle();

    const reviewId = reviewRow?.id ?? null;
    const evidence = compactEvidence(suggestion, { ai_moderation_review_id: reviewId });
    const riskSignals = riskSignalsForSuggestion(suggestion);

    await Promise.all([
      riskSignals.length > 0
        ? supabase.from("listing_risk_signals").upsert(
            riskSignals.map((signalType) => ({
              listing_id: input.listingId,
              signal_type: signalType,
              score: riskScoreFor(signalType, suggestion),
              evidence,
              status: "open",
            })),
            { onConflict: "listing_id,signal_type" }
          )
        : Promise.resolve({ error: null }),
      supabase.from("listing_quality_signals").insert({
        listing_id: input.listingId,
        signal_type: "ai_shadow_quality",
        score: suggestion.quality_score,
        confidence: suggestion.confidence,
        source: "ai_shadow_moderation",
        evidence,
      }),
      suggestion.decision_suggestion !== "approve" || suggestion.reason_codes.length > 0
        ? supabase.from("moderation_workflow_entries").insert({
            entity_type: "listing",
            entity_id: 0,
            entity_uuid: input.listingId,
            status: "pending",
            source: "ai_shadow_moderation",
            summary: suggestion.seller_safe_explanation,
            metadata: evidence,
          })
        : Promise.resolve({ error: null }),
    ]);
  } catch {
    // Shadow moderation must never block the seller posting path.
  }
}

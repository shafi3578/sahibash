import "server-only";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildShadowModerationSuggestion,
  type ShadowModerationInput,
} from "@/lib/ai/moderation-core";

export { buildShadowModerationSuggestion };

export async function recordShadowModerationReview(input: ShadowModerationInput) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    const supabase = createSupabaseAdmin();
    const suggestion = buildShadowModerationSuggestion(input);
    await supabase.from("ai_moderation_reviews").insert({
      listing_id: input.listingId,
      ...suggestion,
    });
  } catch {
    // Shadow moderation must never block the seller posting path.
  }
}

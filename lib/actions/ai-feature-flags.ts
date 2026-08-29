"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { recordAuditEvent } from "@/lib/audit";
import { isAiFeatureFlagKey } from "@/lib/ai/feature-flags";
import { verifyGatewayAiSearch } from "@/lib/ai/search-gateway";
import { requirePermission } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function updateAiFeatureFlagAction(formData: FormData) {
  const actor = await requirePermission("ai.configure");
  const key = String(formData.get("key") ?? "");
  const enabled = String(formData.get("enabled") ?? "false") === "true";
  if (!isAiFeatureFlagKey(key)) redirect("/administrator/promotions?ai=invalid-flag");

  if (key === "ai_search_enabled" && enabled) {
    const verification = await verifyGatewayAiSearch();
    if (verification.status !== "success" || !verification.intent) {
      redirect(`/administrator/promotions?ai=gateway-${verification.status}`);
    }
  }

  const supabase = await createSupabaseServerClient();
  const { data: previous, error: readError } = await supabase
    .from("feature_flags")
    .select("enabled")
    .eq("key", key)
    .single();
  if (readError || !previous) redirect("/administrator/promotions?ai=read-failed");

  const { error } = await supabase
    .from("feature_flags")
    .update({ enabled, rollout_percent: enabled ? 100 : 0, updated_by: actor.id })
    .eq("key", key);
  if (error) redirect("/administrator/promotions?ai=update-failed");

  const audit = await recordAuditEvent({
    adminUserId: actor.id,
    action: "ai_feature_flag.updated",
    entityType: "feature_flag",
    entityId: key,
    safeChanges: { before: previous.enabled === true, after: enabled },
  });
  if (!audit.ok) {
    await supabase
      .from("feature_flags")
      .update({ enabled: previous.enabled === true, rollout_percent: previous.enabled === true ? 100 : 0, updated_by: actor.id })
      .eq("key", key);
    redirect("/administrator/promotions?ai=audit-failed");
  }

  revalidatePath("/search");
  revalidatePath("/post-ad/create");
  revalidatePath("/administrator/promotions");
  redirect("/administrator/promotions?ai=saved");
}

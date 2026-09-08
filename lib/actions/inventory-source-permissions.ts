"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminPath } from "@/lib/admin/routing";
import { requirePermission } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PERMISSION_BASES = new Set([
  "source_owner_permission",
  "group_admin_permission",
  "content_license",
  "operator_attestation",
]);

function textField(formData: FormData, key: string, maxLength: number) {
  return String(formData.get(key) ?? "").trim().slice(0, maxLength);
}

function safeEvidenceUrl(value: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function registerListingSourcePermissionAction(formData: FormData) {
  const actor = await requirePermission("listings.moderate");
  const sourceId = textField(formData, "sourceId", 40);
  const scopeIdentifier = textField(formData, "scopeIdentifier", 240);
  const permissionBasis = textField(formData, "permissionBasis", 80).toLowerCase();
  const attestationText = textField(formData, "attestationText", 2000);
  const evidenceInput = textField(formData, "evidenceUrl", 1000);
  const evidenceUrl = safeEvidenceUrl(evidenceInput);
  const validUntilInput = textField(formData, "validUntil", 80);
  const decision = textField(formData, "decision", 20);
  const verify = decision === "verify";

  if (!UUID_PATTERN.test(sourceId)
      || scopeIdentifier.length < 2
      || attestationText.length < 30
      || !PERMISSION_BASES.has(permissionBasis)
      || (evidenceInput && !evidenceUrl)) {
    redirect(adminPath(UUID_PATTERN.test(sourceId)
      ? `/admin/inventory/sources/${sourceId}?result=invalid`
      : "/admin/inventory?result=invalid"));
  }

  const validUntil = validUntilInput ? new Date(`${validUntilInput}T23:59:59.999Z`) : null;
  if (validUntil && (Number.isNaN(validUntil.getTime()) || validUntil.getTime() <= Date.now())) {
    redirect(adminPath(`/admin/inventory/sources/${sourceId}?result=invalid`));
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.rpc("register_listing_source_permission_service", {
    p_source_id: sourceId,
    p_actor_id: actor.id,
    p_scope_identifier: scopeIdentifier,
    p_permission_basis: permissionBasis,
    p_attestation_text: attestationText,
    p_evidence_url: evidenceUrl,
    p_valid_until: validUntil?.toISOString() ?? null,
    p_verify: verify,
  });
  if (error) {
    redirect(adminPath(`/admin/inventory/sources/${sourceId}?result=failed`));
  }

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/sources/${sourceId}`);
  redirect(adminPath(`/admin/inventory/sources/${sourceId}?result=${verify ? "verified" : "recorded"}`));
}

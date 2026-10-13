"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, requirePermission } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SUPPORT_STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);

export async function updateSupportRequestStatusAction(formData: FormData) {
  const actor = await requirePermission("audit_logs.view");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  if (!UUID_PATTERN.test(id) || !SUPPORT_STATUSES.has(status)) return;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("support_requests")
    .update({ status })
    .eq("id", id)
    .select("id,status")
    .maybeSingle();
  if (error || !data) return;

  const user = await getCurrentUser();
  if (user) {
    await recordAuditEvent({
      adminUserId: actor.id,
      action: "SUPPORT_REQUEST_STATUS_UPDATED",
      entityType: "support_request",
      entityId: id,
      safeChanges: { status },
    });
  }
  revalidatePath("/admin/support");
}

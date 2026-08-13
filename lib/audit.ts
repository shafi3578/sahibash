import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function recordAuditEvent(params: {
  adminUserId: string;
  action: string;
  entityType: string;
  entityId?: string;
  safeChanges?: Record<string, unknown>;
  ipAddress?: string;
}) {
  const { adminUserId, action, entityType, entityId, safeChanges, ipAddress } = params;
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("audit_logs").insert({
    admin_user_id: adminUserId,
    action,
    entity_type: entityType,
    entity_id: entityId ?? null,
    safe_changes: safeChanges ?? null,
    ip_address: ipAddress ?? null,
  });

  if (error) {
    throw new Error(`Audit event could not be recorded: ${error.message}`);
  }
}

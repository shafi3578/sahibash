export type ModerationEntryRecord = {
  id?: number;
  entity_type?: string | null;
  entity_id?: number | null;
  status?: string | null;
  summary?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type ModerationEntryDraft = {
  entity_type: string;
  entity_id: number;
  status: string;
  summary: string;
};

export function normalizeModerationEntry(input: Record<string, unknown>): ModerationEntryDraft {
  const entityType = typeof input.entity_type === "string" ? input.entity_type.trim().toLowerCase() : "listing";
  const entityId = Number(input.entity_id ?? 0);
  const status = typeof input.status === "string" ? input.status.trim().toLowerCase() : "pending";
  const summary = typeof input.summary === "string" ? input.summary.trim() : "";

  return {
    entity_type: entityType || "listing",
    entity_id: Number.isFinite(entityId) ? entityId : 0,
    status: status || "pending",
    summary: summary || "Needs review",
  };
}

export function resolveModerationEntries(input: Array<Record<string, unknown>> = []): ModerationEntryDraft[] {
  return input
    .map((item) => normalizeModerationEntry({
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      status: item.status,
      summary: item.summary,
    }))
    .filter((item) => item.status !== "rejected")
    .sort((left, right) => {
      if (left.entity_id === right.entity_id) {
        return left.status.localeCompare(right.status);
      }
      return left.entity_id - right.entity_id;
    });
}

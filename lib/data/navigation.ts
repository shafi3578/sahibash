export type NavigationItemRecord = {
  id?: number;
  label?: string | null;
  path?: string | null;
  parent_id?: number | null;
  sort_order?: number | null;
  is_enabled?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type NavigationItemDraft = {
  id?: number;
  label: string;
  path: string;
  parent_id: number | null;
  sort_order: number;
  is_enabled: boolean;
};

export function normalizeNavigationItem(input: Record<string, unknown>): NavigationItemDraft {
  const label = typeof input.label === "string" ? input.label.trim() : "";
  const path = typeof input.path === "string" ? input.path.trim() : "";
  const parentIdValue = Number(input.parent_id ?? 0);
  const parentId = Number.isFinite(parentIdValue) && parentIdValue > 0 ? parentIdValue : null;
  const sortOrder = Number(input.sort_order ?? 0);
  const isEnabled = input.is_enabled === true || input.is_enabled === "true" || input.is_enabled === 1 || input.is_enabled === "1";

  return {
    label: label || "Untitled link",
    path: path || "/",
    parent_id: parentId,
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    is_enabled: isEnabled,
  };
}

export function resolveNavigationItems(input: Array<Record<string, unknown>> = []): NavigationItemDraft[] {
  return input
    .map((item) => normalizeNavigationItem({
      label: item.label,
      path: item.path,
      parent_id: item.parent_id,
      sort_order: item.sort_order,
      is_enabled: item.is_enabled,
    }))
    .filter((item) => item.is_enabled)
    .sort((left, right) => left.sort_order - right.sort_order);
}

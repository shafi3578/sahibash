import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ACTIVE_HOME_CATEGORY_SLUGS, RELATED_CATEGORIES } from "@/lib/categories/categoryTree";
import { getCategoryCounts, getCategoryListingCount } from "@/lib/categories/getCategoryCounts";
import type { CategoryNode } from "@/types/database";

export type CategoryNodeWithCount = CategoryNode & {
  count: number;
  subtitle: string | null;
  icon: string | null;
  is_leaf: boolean;
  has_children: boolean;
};

function castNode(row: Record<string, unknown>): CategoryNode {
  return {
    id: Number(row.id),
    category_id: Number(row.category_id),
    parent_id: row.parent_id === null ? null : Number(row.parent_id),
    name: String(row.name),
    slug: String(row.slug),
    level: Number(row.level),
    path: String(row.path),
    display_order: Number(row.display_order ?? 0),
    is_active: Boolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    description: row.description ? String(row.description) : null,
    icon: row.icon ? String(row.icon) : null,
    sort_order: Number(row.sort_order ?? row.display_order ?? 0),
    is_leaf: Boolean(row.is_leaf),
  } as CategoryNode;
}

function sortNodes(a: CategoryNode, b: CategoryNode) {
  const aOrder = (a as CategoryNode & { sort_order?: number }).sort_order ?? a.display_order;
  const bOrder = (b as CategoryNode & { sort_order?: number }).sort_order ?? b.display_order;
  return aOrder - bOrder;
}

export const getHomeCategoryNodes = cache(async (): Promise<CategoryNodeWithCount[]> => {
  const supabase = await createSupabaseServerClient();
  const counts = await getCategoryCounts(null);

  const { data, error } = await supabase
    .from("category_nodes")
    .select("*")
    .is("parent_id", null)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  const allNodes = (data as Record<string, unknown>[])
    .map(castNode)
    .sort(sortNodes)
    .map((node) => ({
      ...node,
      count: counts.get(node.id) ?? 0,
      subtitle: node.description ?? null,
      icon: ((node as CategoryNode & { icon?: string | null }).icon ?? null),
      is_leaf: ((node as CategoryNode & { is_leaf?: boolean }).is_leaf ?? false),
      has_children: false,
    }));

  const preferred = allNodes.filter((node) => ACTIVE_HOME_CATEGORY_SLUGS.includes(node.slug as (typeof ACTIVE_HOME_CATEGORY_SLUGS)[number]));
  return preferred.length > 0 ? preferred : allNodes;
});

export const getCategoryNodeBySlugOrId = cache(async ({
  slug,
  nodeId,
}: {
  slug: string;
  nodeId?: number | null;
}): Promise<CategoryNode | null> => {
  const supabase = await createSupabaseServerClient();

  if (nodeId) {
    const { data, error } = await supabase
      .from("category_nodes")
      .select("*")
      .eq("id", nodeId)
      .eq("is_active", true)
      .maybeSingle();

    if (!error && data) return castNode(data as Record<string, unknown>);
  }

  const { data, error } = await supabase
    .from("category_nodes")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .order("level", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return castNode(data as Record<string, unknown>);
});

export const getCategoryChildrenWithCounts = cache(async (parentNodeId: number): Promise<CategoryNodeWithCount[]> => {
  const supabase = await createSupabaseServerClient();
  const counts = await getCategoryCounts(parentNodeId);

  const { data, error } = await supabase
    .from("category_nodes")
    .select("*")
    .eq("parent_id", parentNodeId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error || !data) return [];

  const childNodes = (data as Record<string, unknown>[])
    .map(castNode)
    .sort(sortNodes);

  const childIds = childNodes.map((node) => node.id);
  const { data: grandchildren } = childIds.length
    ? await supabase
        .from("category_nodes")
        .select("parent_id")
        .in("parent_id", childIds)
        .eq("is_active", true)
    : { data: [] as Array<{ parent_id: number | null }> };

  const parentsWithChildren = new Set(
    ((grandchildren as Array<{ parent_id: number | null }> | null) ?? [])
      .map((row) => row.parent_id)
      .filter((id): id is number => typeof id === "number")
  );

  return childNodes
    .map((node) => ({
      ...node,
      count: counts.get(node.id) ?? 0,
      subtitle: node.description ?? null,
      icon: ((node as CategoryNode & { icon?: string | null }).icon ?? null),
      is_leaf: ((node as CategoryNode & { is_leaf?: boolean }).is_leaf ?? false),
      has_children: parentsWithChildren.has(node.id),
    }));
});

export const getCategoryBreadcrumb = cache(async (node: CategoryNode): Promise<CategoryNode[]> => {
  const supabase = await createSupabaseServerClient();
  const parts = node.path.split("/");

  const { data, error } = await supabase
    .from("category_nodes")
    .select("*")
    .eq("is_active", true)
    .in("slug", parts)
    .order("level", { ascending: true });

  if (error || !data) return [node];

  const byPath = new Map<string, CategoryNode>();
  for (const row of data as Record<string, unknown>[]) {
    const parsed = castNode(row);
    byPath.set(parsed.path, parsed);
  }

  const chain: CategoryNode[] = [];
  let currentPath = "";
  for (const part of parts) {
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    const entry = byPath.get(currentPath);
    if (entry) chain.push(entry);
  }

  return chain.length > 0 ? chain : [node];
});

export const getRelatedCategories = cache(async (node: CategoryNode): Promise<CategoryNodeWithCount[]> => {
  const supabase = await createSupabaseServerClient();
  const root = node.path.split("/")[0] ?? node.slug;
  const relatedPaths = RELATED_CATEGORIES[root] ?? [];
  if (relatedPaths.length === 0) return [];

  const result: CategoryNodeWithCount[] = [];
  for (const path of relatedPaths) {
    const { data, error } = await supabase
      .from("category_nodes")
      .select("*")
      .eq("path", path)
      .eq("is_active", true)
      .maybeSingle();

    if (error || !data) continue;

    const parsed = castNode(data as Record<string, unknown>);
    const count = await getCategoryListingCount(parsed.id);

    result.push({
      ...parsed,
      count,
      subtitle: parsed.description ?? null,
      icon: ((parsed as CategoryNode & { icon?: string | null }).icon ?? null),
      is_leaf: ((parsed as CategoryNode & { is_leaf?: boolean }).is_leaf ?? false),
      has_children: false,
    });
  }

  return result;
});

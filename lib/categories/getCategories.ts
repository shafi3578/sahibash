import { cache } from "react";
import { unstable_cache } from "next/cache";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache/public-cache";
import { withDataTiming } from "@/lib/observability/performance";
import { createSupabasePublicServerClient } from "@/lib/supabase/public";
import {
  ACTIVE_HOME_CATEGORY_SLUGS,
  COMING_SOON_HOME_CATEGORY_SLUGS,
  LAUNCH_ACTIVE_CATEGORY_SLUGS,
  RELATED_CATEGORIES,
} from "@/lib/categories/categoryTree";
import { isDeprecatedCategoryPath } from "@/lib/categories/deprecatedPaths";
import { getCategoryCounts } from "@/lib/categories/getCategoryCounts";
import type { CategoryNode } from "@/types/database";
import { reportDataError } from "@/lib/observability/data-errors";

export type CategoryNodeWithCount = CategoryNode & {
  count: number;
  subtitle: string | null;
  icon: string | null;
  is_leaf: boolean;
  has_children: boolean;
  is_coming_soon?: boolean;
  launch_date?: string | null;
};

type RootCategoryState = {
  id: number;
  slug: string;
  name: string;
  is_active: boolean;
  is_coming_soon: boolean;
  launch_date: string | null;
  display_order: number;
};

const CATEGORY_NODE_PUBLIC_SELECT = "id, category_id, parent_id, name, slug, level, path, display_order, sort_order, is_active, created_at, updated_at, description, icon, is_leaf";

function toRootState(row: Record<string, unknown>): RootCategoryState {
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    is_active: Boolean(row.is_active),
    is_coming_soon: Boolean(row.is_coming_soon),
    launch_date: row.launch_date ? String(row.launch_date) : null,
    display_order: Number(row.display_order ?? 0),
  };
}

const getRootCategoryStates = unstable_cache(
  async (): Promise<RootCategoryState[]> => {
    const supabase = createSupabasePublicServerClient();
    const lifecycle = await withDataTiming(
      "root_category_states",
      async () => supabase
        .from("categories")
        .select("id, slug, name, is_active, is_coming_soon, launch_date, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      { cache: "shared" }
    );

    if (!lifecycle.error && lifecycle.data) {
      return (lifecycle.data as Record<string, unknown>[]).map(toRootState);
    }

    const fallback = await supabase
      .from("categories")
      .select("id, slug, name, is_active, display_order")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (fallback.error || !fallback.data) {
      return [];
    }

    return (fallback.data as Record<string, unknown>[]).map((row) => ({
      id: Number(row.id),
      slug: String(row.slug),
      name: String(row.name),
      is_active: Boolean(row.is_active),
      is_coming_soon: !LAUNCH_ACTIVE_CATEGORY_SLUGS.includes(String(row.slug) as (typeof LAUNCH_ACTIVE_CATEGORY_SLUGS)[number]),
      launch_date: null,
      display_order: Number(row.display_order ?? 0),
    }));
  },
  ["sahibash-root-category-states"],
  {
    revalidate: 3600,
    tags: [PUBLIC_CACHE_TAGS.categoryTaxonomy],
  }
);

const getActiveCategoryNodes = unstable_cache(
  async (): Promise<CategoryNode[]> => {
    const supabase = createSupabasePublicServerClient();
    const { data, error } = await withDataTiming(
      "active_category_nodes",
      async () => supabase
        .from("category_nodes")
        .select(CATEGORY_NODE_PUBLIC_SELECT)
        .eq("is_active", true)
        .order("level", { ascending: true })
        .order("sort_order", { ascending: true }),
      { cache: "shared" }
    );

    if (error || !data) {
      if (error) reportDataError("category-nodes.cached-select", error);
      return [];
    }

    return (data as Record<string, unknown>[])
      .map(castNode)
      .filter((node) => !isDeprecatedCategoryPath(node.path))
      .sort(sortNodes);
  },
  ["sahibash-active-category-nodes"],
  {
    revalidate: 3600,
    tags: [PUBLIC_CACHE_TAGS.categoryTaxonomy],
  }
);

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
  const [counts, categoryStates, activeNodes] = await Promise.all([
    getCategoryCounts(null),
    getRootCategoryStates(),
    getActiveCategoryNodes(),
  ]);
  const categoryStateById = new Map(categoryStates.map((item) => [item.id, item]));

  const allNodes = activeNodes
    .filter((node) => node.parent_id === null)
    .sort(sortNodes)
    .map((node) => {
      const state = categoryStateById.get(node.category_id);

      return {
        ...node,
        count: counts.get(node.id) ?? 0,
        subtitle: node.description ?? null,
        icon: ((node as CategoryNode & { icon?: string | null }).icon ?? null),
        is_leaf: ((node as CategoryNode & { is_leaf?: boolean }).is_leaf ?? false),
        has_children: false,
        is_coming_soon: state?.is_coming_soon ?? false,
        launch_date: state?.launch_date ?? null,
      };
    });

  const preferred = allNodes.filter((node) =>
    ACTIVE_HOME_CATEGORY_SLUGS.includes(node.slug as (typeof ACTIVE_HOME_CATEGORY_SLUGS)[number])
      || COMING_SOON_HOME_CATEGORY_SLUGS.includes(node.slug as (typeof COMING_SOON_HOME_CATEGORY_SLUGS)[number])
  );

  if (preferred.length === 0) {
    return allNodes;
  }

  return preferred.sort((a, b) => {
    const aState = categoryStateById.get(a.category_id);
    const bState = categoryStateById.get(b.category_id);
    const aOrder = aState?.display_order ?? a.display_order;
    const bOrder = bState?.display_order ?? b.display_order;
    return aOrder - bOrder;
  });
});

export const getRootCategoryLaunchState = cache(async (slug: string): Promise<{
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  isComingSoon: boolean;
  launchDate: string | null;
  rootNode: CategoryNode | null;
} | null> => {
  const [categoryStates, activeNodes] = await Promise.all([
    getRootCategoryStates(),
    getActiveCategoryNodes(),
  ]);
  const categoryRow = categoryStates.find((category) => category.slug === slug) ?? null;

  if (!categoryRow?.is_active) {
    return null;
  }

  const rootNode = activeNodes.find((node) => node.category_id === categoryRow.id && node.parent_id === null) ?? null;

  return {
    categoryId: categoryRow.id,
    categorySlug: categoryRow.slug,
    categoryName: categoryRow.name,
    isComingSoon: categoryRow.is_coming_soon,
    launchDate: categoryRow.launch_date,
    rootNode,
  };
});

export const getCategoryNodeBySlugOrId = cache(async ({
  slug,
  nodeId,
}: {
  slug: string;
  nodeId?: number | null;
}): Promise<CategoryNode | null> => {
  const activeNodes = await getActiveCategoryNodes();

  if (nodeId) {
    const parsed = activeNodes.find((node) => node.id === nodeId) ?? null;
    if (parsed) {
      return parsed;
    }
  }

  return activeNodes
    .filter((node) => node.slug === slug)
    .sort((left, right) => left.level - right.level || sortNodes(left, right))[0] ?? null;
});

export const getCategoryChildrenWithCounts = cache(async (parentNodeId: number): Promise<CategoryNodeWithCount[]> => {
  const [counts, activeNodes] = await Promise.all([
    getCategoryCounts(null),
    getActiveCategoryNodes(),
  ]);
  const childNodes = activeNodes.filter((node) => node.parent_id === parentNodeId).sort(sortNodes);
  const parentsWithChildren = new Set(activeNodes.map((node) => node.parent_id).filter((id): id is number => typeof id === "number"));

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
  const activeNodes = await getActiveCategoryNodes();
  const parts = node.path.split("/");

  const byPath = new Map<string, CategoryNode>();
  for (const parsed of activeNodes.filter((entry) => parts.includes(entry.slug))) {
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
  const root = node.path.split("/")[0] ?? node.slug;
  const relatedPaths = RELATED_CATEGORIES[root] ?? [];
  if (relatedPaths.length === 0) return [];

  const [activeNodes, counts] = await Promise.all([
    getActiveCategoryNodes(),
    getCategoryCounts(null),
  ]);
  const result: CategoryNodeWithCount[] = [];
  for (const path of relatedPaths) {
    const parsed = activeNodes.find((entry) => entry.path === path);
    if (!parsed) continue;

    result.push({
      ...parsed,
      count: counts.get(parsed.id) ?? 0,
      subtitle: parsed.description ?? null,
      icon: ((parsed as CategoryNode & { icon?: string | null }).icon ?? null),
      is_leaf: ((parsed as CategoryNode & { is_leaf?: boolean }).is_leaf ?? false),
      has_children: false,
    });
  }

  return result;
});

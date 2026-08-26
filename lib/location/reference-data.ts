import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache/public-cache";
import { withDataTiming } from "@/lib/observability/performance";
import { createSupabasePublicServerClient } from "@/lib/supabase/public";

export type PublicProvinceReference = {
  id: number;
  slug: string;
  name: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  aliases: string[];
  sort_order: number;
  is_active: boolean;
};

export type PublicDistrictReference = PublicProvinceReference & {
  province_id: number;
};

export type PublicAreaReference = {
  id: number;
  province_id: number;
  district_id: number | null;
  slug: string | null;
  name: string;
  name_en: string;
  name_fa: string;
  name_ps: string;
  aliases: string[];
  sort_order: number;
  is_active: boolean;
  is_popular: boolean;
};

function normalizeAliases(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean);
}

const loadPublicProvinces = unstable_cache(
  async (): Promise<PublicProvinceReference[]> => {
    const supabase = createSupabasePublicServerClient();
    const { data, error } = await withDataTiming(
      "location.provinces",
      async () => supabase
        .from("provinces")
        .select("id, slug, name, name_en, name_fa, name_ps, aliases, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name_en", { ascending: true }),
      { table: "provinces" }
    );

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: Number(row.id),
      slug: String(row.slug ?? ""),
      name: String(row.name ?? row.name_en ?? ""),
      name_en: String(row.name_en ?? row.name ?? ""),
      name_fa: String(row.name_fa ?? row.name_en ?? row.name ?? ""),
      name_ps: String(row.name_ps ?? row.name_en ?? row.name ?? ""),
      aliases: normalizeAliases(row.aliases),
      sort_order: Number(row.sort_order ?? 0),
      is_active: Boolean(row.is_active),
    }));
  },
  ["public-location-provinces"],
  { revalidate: 86_400, tags: [PUBLIC_CACHE_TAGS.locationReference] }
);

const loadPublicDistricts = unstable_cache(
  async (provinceId: number): Promise<PublicDistrictReference[]> => {
    const supabase = createSupabasePublicServerClient();
    const { data, error } = await withDataTiming(
      "location.districts",
      async () => supabase
        .from("districts")
        .select("id, province_id, slug, name, name_en, name_fa, name_ps, aliases, sort_order, is_active")
        .eq("province_id", provinceId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name_en", { ascending: true }),
      { table: "districts", province_id: provinceId }
    );

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: Number(row.id),
      province_id: Number(row.province_id),
      slug: String(row.slug ?? ""),
      name: String(row.name ?? row.name_en ?? ""),
      name_en: String(row.name_en ?? row.name ?? ""),
      name_fa: String(row.name_fa ?? row.name_en ?? row.name ?? ""),
      name_ps: String(row.name_ps ?? row.name_en ?? row.name ?? ""),
      aliases: normalizeAliases(row.aliases),
      sort_order: Number(row.sort_order ?? 0),
      is_active: Boolean(row.is_active),
    }));
  },
  ["public-location-districts"],
  { revalidate: 86_400, tags: [PUBLIC_CACHE_TAGS.locationReference] }
);

const loadPublicAreas = unstable_cache(
  async (provinceId: number, districtId: number | null, popularOnly: boolean): Promise<PublicAreaReference[]> => {
    const supabase = createSupabasePublicServerClient();
    let query = supabase
      .from("areas")
      .select("id, province_id, district_id, slug, name, name_en, name_fa, name_ps, aliases, sort_order, is_active, is_popular")
      .eq("province_id", provinceId)
      .eq("is_active", true);

    if (districtId) {
      query = query.eq("district_id", districtId);
    }

    if (popularOnly) {
      query = query.eq("is_popular", true);
    }

    const { data, error } = await withDataTiming(
      "location.areas",
      async () => query
        .order("is_popular", { ascending: false })
        .order("sort_order", { ascending: true })
        .order("name_en", { ascending: true }),
      { table: "areas", province_id: provinceId, district_id: districtId, popular_only: popularOnly }
    );

    if (error) {
      throw new Error(error.message);
    }

    return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: Number(row.id),
      province_id: Number(row.province_id),
      district_id: row.district_id === null || row.district_id === undefined ? null : Number(row.district_id),
      slug: row.slug === null || row.slug === undefined ? null : String(row.slug),
      name: String(row.name ?? row.name_en ?? ""),
      name_en: String(row.name_en ?? row.name ?? ""),
      name_fa: String(row.name_fa ?? row.name_en ?? row.name ?? ""),
      name_ps: String(row.name_ps ?? row.name_en ?? row.name ?? ""),
      aliases: normalizeAliases(row.aliases),
      sort_order: Number(row.sort_order ?? 0),
      is_active: Boolean(row.is_active),
      is_popular: Boolean(row.is_popular),
    }));
  },
  ["public-location-areas"],
  { revalidate: 86_400, tags: [PUBLIC_CACHE_TAGS.locationReference] }
);

export const getPublicProvinces = cache(loadPublicProvinces);
export const getPublicDistricts = cache(loadPublicDistricts);
export const getPublicAreas = cache(loadPublicAreas);

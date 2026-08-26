import { cache } from "react";
import { unstable_cache } from "next/cache";
import { PUBLIC_CACHE_TAGS } from "@/lib/cache/public-cache";
import { createSupabasePublicServerClient } from "@/lib/supabase/public";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeListingSchemaConfig, type ListingSchemaVersion } from "@/lib/listing-schema-config";

const getCachedPublishedListingSchema = unstable_cache(async (categoryNodeId: number): Promise<ListingSchemaVersion | null> => {
  const supabase = createSupabasePublicServerClient();
  const { data, error } = await supabase.from("listing_schema_versions").select("*")
    .eq("category_node_id", categoryNodeId).eq("status", "published").maybeSingle();
  if (error || !data) return null;
  return { ...data, config: normalizeListingSchemaConfig(data.config) } as ListingSchemaVersion;
}, ["sahibash-published-listing-schema"], {
  revalidate: 3600,
  tags: [PUBLIC_CACHE_TAGS.listingSchema],
});

export const getPublishedListingSchema = cache(async (categoryNodeId: number): Promise<ListingSchemaVersion | null> =>
  getCachedPublishedListingSchema(categoryNodeId)
);

export async function getListingSchemaHistory(categoryNodeId: number): Promise<ListingSchemaVersion[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("listing_schema_versions").select("*")
    .eq("category_node_id", categoryNodeId).order("version", { ascending: false }).limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, config: normalizeListingSchemaConfig(row.config) })) as ListingSchemaVersion[];
}

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeListingSchemaConfig, type ListingSchemaVersion } from "@/lib/listing-schema-config";

export const getPublishedListingSchema = cache(async (categoryNodeId: number): Promise<ListingSchemaVersion | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("listing_schema_versions").select("*")
    .eq("category_node_id", categoryNodeId).eq("status", "published").maybeSingle();
  if (error || !data) return null;
  return { ...data, config: normalizeListingSchemaConfig(data.config) } as ListingSchemaVersion;
});

export async function getListingSchemaHistory(categoryNodeId: number): Promise<ListingSchemaVersion[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("listing_schema_versions").select("*")
    .eq("category_node_id", categoryNodeId).order("version", { ascending: false }).limit(20);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, config: normalizeListingSchemaConfig(row.config) })) as ListingSchemaVersion[];
}

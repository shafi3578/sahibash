"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdministrator } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeListingSchemaConfig } from "@/lib/listing-schema-config";

export async function publishListingSchemaAction(formData: FormData) {
  await requireSuperAdministrator();
  const categoryNodeId = Number(formData.get("category_node_id"));
  const expectedVersion = Number(formData.get("expected_version") ?? 0);
  if (!Number.isInteger(categoryNodeId) || categoryNodeId <= 0) throw new Error("Invalid category node.");

  let raw: unknown;
  try { raw = JSON.parse(String(formData.get("config") ?? "")); }
  catch { throw new Error("The schema configuration is not valid JSON."); }
  const config = normalizeListingSchemaConfig(raw);
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("publish_listing_schema", {
    target_category_node_id: categoryNodeId,
    expected_version: expectedVersion,
    schema_config: config,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/listing-schema");
  revalidatePath("/post-ad");
  revalidatePath("/search");
  revalidatePath("/listings");
  redirect(`/admin/listing-schema?node=${categoryNodeId}&saved=1`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdministrator } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeListingSchemaConfig } from "@/lib/listing-schema-config";
import { recordAuditEvent } from "@/lib/audit";
import { revalidatePublicTaxonomyCache } from "@/lib/cache/public-cache";

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
  revalidatePublicTaxonomyCache();
  revalidatePath("/admin/listing-schema");
  revalidatePath("/post-ad");
  revalidatePath("/search");
  revalidatePath("/listings");
  redirect(`/admin/listing-schema?node=${categoryNodeId}&saved=1`);
}

export async function updateSchemaCategoryStatusAction(formData: FormData) {
  const user = await requireSuperAdministrator();
  const categoryNodeId = Number(formData.get("category_node_id"));
  const isActive = formData.get("is_active") === "true";

  if (!Number.isInteger(categoryNodeId) || categoryNodeId <= 0) {
    throw new Error("Invalid category node.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: current, error: readError } = await supabase
    .from("category_nodes")
    .select("id, category_id, parent_id, name, path, is_active")
    .eq("id", categoryNodeId)
    .single();

  if (readError || !current) {
    throw new Error(readError?.message ?? "Category not found.");
  }

  if (current.is_active !== isActive) {
    const { error: updateError } = await supabase
      .from("category_nodes")
      .update({ is_active: isActive })
      .eq("id", categoryNodeId);

    if (updateError) throw new Error(updateError.message);

    if (current.parent_id === null) {
      const { error: rootUpdateError } = await supabase
        .from("categories")
        .update({ is_active: isActive })
        .eq("id", current.category_id);

      if (rootUpdateError) {
        await supabase.from("category_nodes").update({ is_active: current.is_active }).eq("id", categoryNodeId);
        throw new Error(rootUpdateError.message);
      }
    }

    await recordAuditEvent({
      adminUserId: user.id,
      action: "CATEGORY_UPDATED",
      entityType: "category_node",
      entityId: String(categoryNodeId),
      safeChanges: {
        name: current.name,
        path: current.path,
        is_active: { from: current.is_active, to: isActive },
        source: "listing_schema_builder",
      },
    });
  }

  revalidatePublicTaxonomyCache();
  revalidatePath("/admin/listing-schema");
  revalidatePath("/admin/categories");
  revalidatePath("/post-ad");
  revalidatePath("/categories");
  redirect(`/admin/listing-schema?node=${categoryNodeId}&status_updated=1`);
}

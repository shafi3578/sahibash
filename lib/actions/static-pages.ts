"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeStaticPageDraft } from "@/lib/data/static-pages";
import { adminPath } from "@/lib/admin/routing";

function text(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveAdminRedirect() {
  return adminPath("/admin/pages");
}

export async function saveStaticPageAction(formData: FormData) {
  const user = await requirePermission("pages.update");
  const supabase = await createSupabaseServerClient();
  const draft = normalizeStaticPageDraft({
    id: text(formData.get("id")),
    page_key: formData.get("page_key"),
    slug_en: formData.get("slug_en"),
    slug_fa: formData.get("slug_fa"),
    slug_ps: formData.get("slug_ps"),
    title_en: formData.get("title_en"),
    title_fa: formData.get("title_fa"),
    title_ps: formData.get("title_ps"),
    body_en: formData.get("body_en"),
    body_fa: formData.get("body_fa"),
    body_ps: formData.get("body_ps"),
    seo_title_en: formData.get("seo_title_en"),
    seo_title_fa: formData.get("seo_title_fa"),
    seo_title_ps: formData.get("seo_title_ps"),
    seo_description_en: formData.get("seo_description_en"),
    seo_description_fa: formData.get("seo_description_fa"),
    seo_description_ps: formData.get("seo_description_ps"),
  });

  if (!draft.page_key || !draft.slug_en || !draft.slug_fa || !draft.slug_ps) {
    throw new Error("Page key and all locale slugs are required.");
  }

  const { data, error } = await supabase
    .from("static_pages")
    .upsert(
      {
        ...(text(formData.get("id")) ? { id: Number(text(formData.get("id"))) } : {}),
        page_key: draft.page_key,
        slug_en: draft.slug_en,
        slug_fa: draft.slug_fa,
        slug_ps: draft.slug_ps,
        title_en: draft.title.en,
        title_fa: draft.title.fa,
        title_ps: draft.title.ps,
        body_en: draft.body.en,
        body_fa: draft.body.fa,
        body_ps: draft.body.ps,
        seo_title_en: draft.seo_title.en || null,
        seo_title_fa: draft.seo_title.fa || null,
        seo_title_ps: draft.seo_title.ps || null,
        seo_description_en: draft.seo_description.en || null,
        seo_description_fa: draft.seo_description.fa || null,
        seo_description_ps: draft.seo_description.ps || null,
      },
      { onConflict: "page_key" }
    )
    .select("id, page_key")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to save static page.");
  }

  await recordAuditEvent({
    adminUserId: user.id,
    action: "SETTING_CHANGED",
    entityType: "static_page",
    entityId: String(data.id),
    safeChanges: { page_key: draft.page_key, title_en: draft.title.en, draft: true },
  });

  revalidatePath("/admin/pages");
  redirect(resolveAdminRedirect() + `?page=${encodeURIComponent(draft.page_key)}`);
}

export async function publishStaticPageAction(formData: FormData) {
  const user = await requirePermission("pages.publish");
  const pageId = Number(text(formData.get("page_id")));
  const changeSummary = text(formData.get("change_summary"));
  if (!Number.isInteger(pageId) || pageId <= 0) {
    throw new Error("Invalid page id.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("publish_static_page", {
    page_row_id: pageId,
    change_summary: changeSummary,
    editor_id: user.id,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to publish static page.");
  }

  await recordAuditEvent({
    adminUserId: user.id,
    action: "PAGE_PUBLISHED",
    entityType: "static_page",
    entityId: String(pageId),
    safeChanges: { page_id: pageId, change_summary: changeSummary || null },
  });

  revalidatePath("/admin/pages");
  revalidatePath("/");
  redirect(resolveAdminRedirect() + `?page=${encodeURIComponent(String(data.page_key))}`);
}

export async function restoreStaticPageVersionAction(formData: FormData) {
  const user = await requirePermission("configuration.rollback");
  const versionId = Number(text(formData.get("version_id")));
  const changeSummary = text(formData.get("change_summary"));
  if (!Number.isInteger(versionId) || versionId <= 0) {
    throw new Error("Invalid page version id.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("restore_static_page_version", {
    version_row_id: versionId,
    change_summary: changeSummary,
    editor_id: user.id,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Unable to restore static page version.");
  }

  await recordAuditEvent({
    adminUserId: user.id,
    action: "CONFIGURATION_ROLLED_BACK",
    entityType: "static_page_versions",
    entityId: String(versionId),
    safeChanges: { version_id: versionId, change_summary: changeSummary || null },
  });

  revalidatePath("/admin/pages");
  revalidatePath("/");
  redirect(resolveAdminRedirect() + `?page=${encodeURIComponent(String(data.page_key))}`);
}

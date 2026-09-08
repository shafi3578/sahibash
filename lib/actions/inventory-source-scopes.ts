"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { adminPath } from "@/lib/admin/routing";
import { requireSuperAdministrator } from "@/lib/auth";
import { detectTelegramSourceScope } from "@/lib/inventory/source-scope";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MIXED_TELEGRAM_SOURCE_SLUG = "telegram-forwarded";
const MAX_CANDIDATES_PER_RUN = 500;
const UPDATE_CHUNK_SIZE = 100;

type CandidateRow = {
  id: string;
  job_id: string;
  candidate_listing_id: string | null;
  source_item_id: string | null;
  normalized_payload: Record<string, unknown> | null;
};

function chunks<T>(values: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

export async function separateDetectedTelegramSourceScopesAction(formData: FormData) {
  const actor = await requireSuperAdministrator();
  const sourceId = String(formData.get("sourceId") ?? "").trim();
  if (!UUID_PATTERN.test(sourceId)) redirect(adminPath("/admin/inventory?result=invalid"));

  const supabase = createSupabaseAdmin();
  const { data: mixedSource, error: sourceError } = await supabase
    .from("listing_sources")
    .select("id,slug,source_type,platform")
    .eq("id", sourceId)
    .maybeSingle();
  if (sourceError || !mixedSource || mixedSource.slug !== MIXED_TELEGRAM_SOURCE_SLUG
      || mixedSource.source_type !== "external_indexed" || mixedSource.platform !== "telegram") {
    redirect(adminPath(`/admin/inventory/sources/${sourceId}?result=invalid`));
  }

  const { data, error: candidatesError } = await supabase
    .from("listing_ingest_candidates")
    .select("id,job_id,candidate_listing_id,source_item_id,normalized_payload")
    .eq("source_id", sourceId)
    .order("created_at", { ascending: true })
    .limit(MAX_CANDIDATES_PER_RUN);
  if (candidatesError) redirect(adminPath(`/admin/inventory/sources/${sourceId}?result=failed`));

  const candidates = (data ?? []) as CandidateRow[];
  const groups = new Map<string, { scope: NonNullable<ReturnType<typeof detectTelegramSourceScope>>; candidates: CandidateRow[] }>();
  const jobOccurrences = new Map<string, number>();
  for (const candidate of candidates) {
    jobOccurrences.set(candidate.job_id, (jobOccurrences.get(candidate.job_id) ?? 0) + 1);
    const scope = detectTelegramSourceScope(candidate);
    if (!scope) continue;
    const group = groups.get(scope.slug);
    if (group) group.candidates.push(candidate);
    else groups.set(scope.slug, { scope, candidates: [candidate] });
  }
  if (groups.size === 0) redirect(adminPath(`/admin/inventory/sources/${sourceId}?result=nothing`));

  let moved = 0;
  let created = 0;
  let failed = false;
  for (const { scope, candidates: scopedCandidates } of groups.values()) {
    const { data: existingSource, error: existingError } = await supabase
      .from("listing_sources")
      .select("id")
      .eq("slug", scope.slug)
      .maybeSingle();
    if (existingError) {
      failed = true;
      break;
    }

    let scopedSourceId = existingSource?.id as string | undefined;
    if (!scopedSourceId) {
      const { error: insertError } = await supabase.from("listing_sources").upsert({
        source_type: "external_indexed",
        name: scope.displayName,
        slug: scope.slug,
        platform: "telegram",
        permission_basis: "permission_pending",
        ingest_method: "webhook",
        status: "active",
        kill_switch_enabled: false,
        config: {
          discovered_from_source_id: sourceId,
          source_scope: scope.scopeIdentifier,
          source_url: scope.sourceUrl,
          rights_verified: false,
        },
        created_by: actor.id,
      }, { onConflict: "slug", ignoreDuplicates: true });
      if (insertError) {
        failed = true;
        break;
      }
      const { data: insertedSource, error: insertedSourceError } = await supabase
        .from("listing_sources")
        .select("id")
        .eq("slug", scope.slug)
        .single();
      if (insertedSourceError || !insertedSource) {
        failed = true;
        break;
      }
      scopedSourceId = insertedSource.id as string;
      created += 1;
    }

    const candidateIds = scopedCandidates.map((candidate) => candidate.id);
    const listingIds = scopedCandidates
      .map((candidate) => candidate.candidate_listing_id)
      .filter((id): id is string => Boolean(id));
    const singleScopeJobIds = scopedCandidates
      .map((candidate) => candidate.job_id)
      .filter((jobId) => jobOccurrences.get(jobId) === 1);

    const { error: startAuditError } = await supabase.from("audit_logs").insert({
      admin_user_id: actor.id,
      action: "LISTING_SOURCE_SCOPE_DISCOVERY_STARTED",
      entity_type: "listing_source",
      entity_id: scopedSourceId,
      safe_changes: {
        mixed_source_id: sourceId,
        scope_identifier: scope.scopeIdentifier,
        source_slug: scope.slug,
        candidate_count: candidateIds.length,
        listing_count: listingIds.length,
        rights_verified: false,
        publication_changed: false,
        content_changed: false,
      },
    });
    if (startAuditError) {
      failed = true;
      break;
    }

    for (const jobChunk of chunks([...new Set(singleScopeJobIds)], UPDATE_CHUNK_SIZE)) {
      const { error: jobError } = await supabase
        .from("listing_ingest_jobs")
        .update({ source_id: scopedSourceId })
        .eq("source_id", sourceId)
        .in("id", jobChunk);
      if (jobError) {
        failed = true;
        break;
      }
    }
    if (failed) break;

    for (const candidateChunk of chunks(candidateIds, UPDATE_CHUNK_SIZE)) {
      const { error: observationError } = await supabase
        .from("listing_source_observations")
        .update({ source_id: scopedSourceId, source_account_id: scope.username })
        .eq("source_id", sourceId)
        .in("ingest_candidate_id", candidateChunk);
      if (observationError) {
        failed = true;
        break;
      }
    }
    if (failed) break;

    for (const listingChunk of chunks(listingIds, UPDATE_CHUNK_SIZE)) {
      const { error: listingObservationError } = await supabase
        .from("listing_source_observations")
        .update({ source_id: scopedSourceId, source_account_id: scope.username })
        .eq("source_id", sourceId)
        .in("listing_id", listingChunk);
      if (listingObservationError) {
        failed = true;
        break;
      }
    }
    if (failed) break;

    // Candidate reassignment is deliberately last. If an earlier metadata
    // update fails, the candidates remain discoverable on an idempotent retry.
    for (const candidateChunk of chunks(candidateIds, UPDATE_CHUNK_SIZE)) {
      const { error: updateError } = await supabase
        .from("listing_ingest_candidates")
        .update({ source_id: scopedSourceId })
        .eq("source_id", sourceId)
        .in("id", candidateChunk);
      if (updateError) {
        failed = true;
        break;
      }
    }
    if (failed) break;

    const { error: auditError } = await supabase.from("audit_logs").insert({
      admin_user_id: actor.id,
      action: "LISTING_SOURCE_SCOPE_DISCOVERY_COMPLETED",
      entity_type: "listing_source",
      entity_id: scopedSourceId,
      safe_changes: {
        mixed_source_id: sourceId,
        scope_identifier: scope.scopeIdentifier,
        source_slug: scope.slug,
        candidate_count: candidateIds.length,
        listing_count: listingIds.length,
        rights_verified: false,
        publication_changed: false,
        content_changed: false,
      },
    });
    if (auditError) {
      failed = true;
      break;
    }
    moved += candidateIds.length;
  }

  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/sources/${sourceId}`);
  redirect(adminPath(`/admin/inventory/sources/${sourceId}?result=${failed ? "failed" : "separated"}&moved=${moved}&created=${created}`));
}

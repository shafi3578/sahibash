"use server";

import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/admin";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PRIVATE_INGEST_BUCKET = "listing-ingest-media";
const PUBLIC_LISTING_BUCKET = "listing-images";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type CandidateRow = {
  id: string;
  status: string;
  candidate_listing_id: string | null;
};

type CandidateMediaRow = {
  id: string;
  storage_bucket: string;
  storage_path: string;
  mime_type: string;
  byte_size: number;
  sort_order: number;
};

type PublishedImage = {
  storage_path: string;
  public_url: string;
  sort_order: number;
};

export type CandidatePublicationState = {
  status: "idle" | "success" | "error";
  code: "idle" | "published" | "not_ready" | "media" | "storage" | "publication" | "failed";
  listingId?: string;
};

async function removeUploadedImages(
  supabase: ReturnType<typeof createSupabaseAdmin>,
  paths: string[],
) {
  if (paths.length > 0) {
    try {
      await supabase.storage.from(PUBLIC_LISTING_BUCKET).remove(paths);
    } catch {
      // The database transaction remains authoritative; cleanup is best-effort.
    }
  }
}

function revalidatePublishedListing(candidateId: string, listingId: string) {
  revalidatePath("/admin/inventory");
  revalidatePath(`/admin/inventory/candidates/${candidateId}`);
  revalidatePath("/listings");
  revalidatePath(`/listings/${listingId}`);
  for (const locale of ["en", "fa", "ps"]) {
    revalidatePath(`/${locale}`);
    revalidatePath(`/${locale}/listings`);
    revalidatePath(`/${locale}/listings/${listingId}`);
  }
}

export async function publishReviewedIngestCandidate(
  candidateId: string,
  _previousState: CandidatePublicationState,
): Promise<CandidatePublicationState> {
  void _previousState;
  const actor = await requirePermission("listings.moderate");
  if (!UUID_PATTERN.test(candidateId)) return { status: "error", code: "failed" };

  const supabase = createSupabaseAdmin();
  const { data: candidateData, error: candidateError } = await supabase
    .from("listing_ingest_candidates")
    .select("id,status,candidate_listing_id")
    .eq("id", candidateId)
    .maybeSingle();
  const candidate = candidateData as CandidateRow | null;
  if (candidateError || !candidate) return { status: "error", code: "failed" };

  if (candidate.candidate_listing_id && UUID_PATTERN.test(candidate.candidate_listing_id)) {
    revalidatePublishedListing(candidateId, candidate.candidate_listing_id);
    return { status: "success", code: "published", listingId: candidate.candidate_listing_id };
  }
  if (candidate.status !== "publishable") return { status: "error", code: "not_ready" };

  const { data: mediaData, error: mediaError } = await supabase
    .from("listing_ingest_candidate_media")
    .select("id,storage_bucket,storage_path,mime_type,byte_size,sort_order")
    .eq("candidate_id", candidateId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  const media = (mediaData ?? []) as CandidateMediaRow[];
  if (mediaError || media.length < 1 || media.length > 15) {
    return { status: "error", code: "media" };
  }

  const listingId = crypto.randomUUID();
  const uploadedPaths: string[] = [];
  const publishedImages: PublishedImage[] = [];

  try {
    for (const [index, item] of media.entries()) {
      const extension = IMAGE_EXTENSIONS[item.mime_type];
      const hasSafeSource = item.storage_bucket === PRIVATE_INGEST_BUCKET
        && item.storage_path.startsWith(`${candidateId}/`)
        && UUID_PATTERN.test(item.id)
        && Number.isFinite(item.byte_size)
        && item.byte_size > 0
        && item.byte_size <= MAX_IMAGE_BYTES;
      if (!extension || !hasSafeSource) {
        await removeUploadedImages(supabase, uploadedPaths);
        return { status: "error", code: "media" };
      }

      const { data: sourceBlob, error: downloadError } = await supabase.storage
        .from(PRIVATE_INGEST_BUCKET)
        .download(item.storage_path);
      if (downloadError || !sourceBlob || sourceBlob.size < 1 || sourceBlob.size > MAX_IMAGE_BYTES) {
        await removeUploadedImages(supabase, uploadedPaths);
        return { status: "error", code: "storage" };
      }

      const destinationPath = `${listingId}/${String(index + 1).padStart(2, "0")}-${item.id}.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from(PUBLIC_LISTING_BUCKET)
        .upload(destinationPath, await sourceBlob.arrayBuffer(), {
          cacheControl: "31536000",
          contentType: item.mime_type,
          upsert: false,
        });
      if (uploadError) {
        await removeUploadedImages(supabase, uploadedPaths);
        return { status: "error", code: "storage" };
      }

      uploadedPaths.push(destinationPath);
      const { data: publicData } = supabase.storage.from(PUBLIC_LISTING_BUCKET).getPublicUrl(destinationPath);
      publishedImages.push({
        storage_path: destinationPath,
        public_url: publicData.publicUrl,
        sort_order: index,
      });
    }

    const { data: publishedIdData, error: publicationError } = await supabase.rpc(
      "publish_reviewed_ingest_candidate",
      {
        p_candidate_id: candidateId,
        p_actor_id: actor.id,
        p_listing_id: listingId,
        p_images: publishedImages,
      },
    );
    const publishedId = typeof publishedIdData === "string" ? publishedIdData : null;
    if (publicationError || !publishedId || !UUID_PATTERN.test(publishedId)) {
      await removeUploadedImages(supabase, uploadedPaths);
      return { status: "error", code: "publication" };
    }
    if (publishedId !== listingId) {
      await removeUploadedImages(supabase, uploadedPaths);
    }

    revalidatePublishedListing(candidateId, publishedId);
    return { status: "success", code: "published", listingId: publishedId };
  } catch {
    await removeUploadedImages(supabase, uploadedPaths);
    return { status: "error", code: "failed" };
  }
}

export type QuickPublishImage = {
  id: string;
  file: File;
  isPrimary: boolean;
};

type QuickPublishActionResult = {
  ok: boolean;
  message: string;
  listingId?: string;
};

export type QuickPublishAttemptResult =
  | { ok: true; listingId: string; draftId: string }
  | { ok: false; message: string };

export async function runQuickPostPublishAttempt(input: {
  images: QuickPublishImage[];
  persistLocalImages: (images: QuickPublishImage[]) => Promise<void>;
  checkpointDraft: () => Promise<{ persisted: boolean; draftId?: string | null }>;
  buildFormData: (draftId: string) => FormData;
  createOrReuseListing: (formData: FormData) => Promise<QuickPublishActionResult>;
  uploadImage: (
    listingId: string,
    file: File,
    isPrimary: boolean,
    stagedImageId: string,
  ) => Promise<{ ok: boolean; message: string }>;
  finalizeRecovery: (draftId: string, listingId: string) => Promise<void>;
  persistenceErrorMessage: string;
}) : Promise<QuickPublishAttemptResult> {
  try {
    // A publish attempt must not outrun the local byte copy needed to retry a
    // partial batch after a refresh or transient server/storage failure.
    await input.persistLocalImages(input.images);
  } catch {
    return { ok: false, message: input.persistenceErrorMessage };
  }

  const checkpoint = await input.checkpointDraft();
  if (!checkpoint.persisted || !checkpoint.draftId) {
    return { ok: false, message: input.persistenceErrorMessage };
  }

  const created = await input.createOrReuseListing(input.buildFormData(checkpoint.draftId));
  if (!created.ok || !created.listingId) {
    return { ok: false, message: created.message };
  }

  for (const image of input.images) {
    const upload = await input.uploadImage(created.listingId, image.file, image.isPrimary, image.id);
    if (!upload.ok) {
      return { ok: false, message: upload.message };
    }
  }

  await input.finalizeRecovery(checkpoint.draftId, created.listingId);
  return { ok: true, listingId: created.listingId, draftId: checkpoint.draftId };
}

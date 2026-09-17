import { createHash } from "node:crypto";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidListingImageRetryKey(value: unknown): value is string {
  // Includes the existing timestamp-random fallback used by staged image IDs.
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
}

export async function hashListingImageBytes(image: Blob): Promise<string> {
  return createHash("sha256").update(new Uint8Array(await image.arrayBuffer())).digest("hex");
}

export async function buildListingImageRetryIdentity(
  userId: string,
  listingId: string,
  stagedImageId: string,
  image: Blob,
  extension: string,
) {
  if (typeof userId !== "string" || typeof listingId !== "string"
    || !UUID_PATTERN.test(userId) || !UUID_PATTERN.test(listingId)
    || !isValidListingImageRetryKey(stagedImageId)
    || !["jpg", "png", "webp", "heic"].includes(extension)) return null;

  // UUIDv8: server-derived, namespaced and bound to this owner/listing/staged slot.
  // Content is deliberately excluded from the ID so reusing a slot with different
  // bytes conflicts instead of silently creating an additional listing image.
  const hex = createHash("sha256")
    .update(JSON.stringify(["sahibash:listing-image-retry:v1", userId.toLowerCase(), listingId.toLowerCase(), stagedImageId]))
    .digest("hex");
  const imageId = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-${((parseInt(hex[16], 16) & 3) | 8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
  const contentHash = await hashListingImageBytes(image);
  return {
    imageId,
    contentHash,
    storagePath: `${userId.toLowerCase()}/${listingId.toLowerCase()}/${imageId}-${contentHash}.${extension}`,
  };
}

export function isListingImageStorageCollision(error: { status?: number; statusCode?: string; message: string }): boolean {
  if (error.status !== 400 && error.status !== 409) return false;
  if (["ResourceAlreadyExists", "KeyAlreadyExists", "Duplicate", "already_exists"].includes(error.statusCode ?? "")) return true;
  // Older Storage releases expose a numeric statusCode instead of a named code.
  return ["400", "409"].includes(error.statusCode ?? "")
    && ["the resource already exists", "asset already exists"].includes(error.message.trim().toLowerCase());
}

export function isListingImageStorageMissing(error: { status?: number; statusCode?: string; message: string }): boolean {
  if (error.status !== 404) return false;
  return [undefined, "404", "NoSuchKey", "ObjectNotFound", "not_found"].includes(error.statusCode)
    || ["object not found", "the resource was not found", "not found"].includes(error.message.trim().toLowerCase());
}

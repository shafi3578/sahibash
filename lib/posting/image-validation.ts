export const MAX_LISTING_IMAGE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_LISTING_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type ListingImageValidation =
  | { ok: true; extension: "jpg" | "png" | "webp" | "heic" }
  | { ok: false; message: string };

export async function validateListingImage(image: Blob): Promise<ListingImageValidation> {
  if (image.size <= 0 || image.size > MAX_LISTING_IMAGE_BYTES) {
    return { ok: false, message: "Each image must be smaller than 10 MB." };
  }

  const header = new Uint8Array(await image.slice(0, 16).arrayBuffer());
  const ascii = String.fromCharCode(...header);
  const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
  const isWebp = ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WEBP";
  const isHeic = ascii.slice(4, 8) === "ftyp" && /heic|heix|hevc|hevx|mif1/.test(ascii.slice(8, 16));

  if (isJpeg && image.type === "image/jpeg") return { ok: true, extension: "jpg" };
  if (isPng && image.type === "image/png") return { ok: true, extension: "png" };
  if (isWebp && image.type === "image/webp") return { ok: true, extension: "webp" };
  if (isHeic && (image.type === "image/heic" || image.type === "image/heif")) return { ok: true, extension: "heic" };

  return { ok: false, message: "Only valid JPG, PNG, WebP, or HEIC images are accepted." };
}

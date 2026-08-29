import { createHash } from "node:crypto";

export const TELEGRAM_MEDIA_BUCKET = "listing-ingest-media";
export const MAX_TELEGRAM_PHOTO_BYTES = 10 * 1024 * 1024;

type TelegramPhotoRecord = Record<string, unknown>;

export type TelegramPhoto = {
  fileId: string;
  fileUniqueId: string | null;
  width: number | null;
  height: number | null;
  fileSize: number | null;
};

export type DownloadedTelegramPhoto = {
  bytes: Uint8Array;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  extension: "jpg" | "png" | "webp";
};

function positiveInteger(value: unknown) {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : null;
}

export function selectLargestTelegramPhoto(value: unknown): TelegramPhoto | null {
  if (!Array.isArray(value)) return null;

  const photos = value
    .filter((entry): entry is TelegramPhotoRecord => Boolean(entry) && typeof entry === "object")
    .map((entry) => {
      const fileId = typeof entry.file_id === "string" ? entry.file_id.trim() : "";
      if (!fileId) return null;
      return {
        fileId,
        fileUniqueId:
          typeof entry.file_unique_id === "string" && entry.file_unique_id.trim()
            ? entry.file_unique_id.trim()
            : null,
        width: positiveInteger(entry.width),
        height: positiveInteger(entry.height),
        fileSize: positiveInteger(entry.file_size),
      } satisfies TelegramPhoto;
    })
    .filter((photo): photo is TelegramPhoto => photo !== null);

  return photos.sort((left, right) => {
    const leftScore = left.fileSize ?? (left.width ?? 0) * (left.height ?? 0);
    const rightScore = right.fileSize ?? (right.width ?? 0) * (right.height ?? 0);
    return rightScore - leftScore;
  })[0] ?? null;
}

export function getTelegramTransferKey(message: Record<string, unknown>, updateId: string) {
  const sourceItemId =
    typeof message.message_id === "number" && Number.isSafeInteger(message.message_id)
      ? String(message.message_id)
      : updateId;
  const mediaGroupId =
    typeof message.media_group_id === "string" && message.media_group_id.trim()
      ? message.media_group_id.trim()
      : null;

  return {
    sourceItemId,
    mediaGroupId,
    idempotencyKey: mediaGroupId
      ? `telegram:media-group:${mediaGroupId}`
      : `telegram:message:${sourceItemId}`,
  };
}

export function telegramPhotoFingerprint(photo: TelegramPhoto) {
  return createHash("sha256")
    .update(photo.fileUniqueId ?? photo.fileId)
    .digest("hex")
    .slice(0, 24);
}

export function candidateMediaStoragePath(
  candidateId: string,
  sourceItemId: string,
  fingerprint: string,
  extension: DownloadedTelegramPhoto["extension"],
) {
  const safeItemId = sourceItemId.replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48) || "item";
  return `${candidateId}/${safeItemId}-${fingerprint}.${extension}`;
}

function identifyImage(bytes: Uint8Array): Omit<DownloadedTelegramPhoto, "bytes"> | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return { contentType: "image/png", extension: "png" };
  }
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}

function safeTelegramFilePath(value: unknown) {
  if (typeof value !== "string" || value.length > 240) return null;
  if (!/^photos\/[a-zA-Z0-9_.\/-]+$/.test(value) || value.includes("..")) return null;
  return value.split("/").map(encodeURIComponent).join("/");
}

export async function downloadTelegramPhoto(
  token: string,
  fileId: string,
): Promise<DownloadedTelegramPhoto> {
  const metadataResponse = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
    { cache: "no-store", signal: AbortSignal.timeout(10_000) },
  );
  if (!metadataResponse.ok) throw new Error("Telegram photo metadata request failed");

  const metadata = (await metadataResponse.json()) as {
    ok?: boolean;
    result?: { file_path?: unknown; file_size?: unknown };
  };
  const filePath = safeTelegramFilePath(metadata.result?.file_path);
  const reportedSize = positiveInteger(metadata.result?.file_size);
  if (!metadata.ok || !filePath || (reportedSize && reportedSize > MAX_TELEGRAM_PHOTO_BYTES)) {
    throw new Error("Telegram returned invalid photo metadata");
  }

  const fileResponse = await fetch(
    `https://api.telegram.org/file/bot${token}/${filePath}`,
    { cache: "no-store", signal: AbortSignal.timeout(15_000) },
  );
  if (!fileResponse.ok) throw new Error("Telegram photo download failed");
  const contentLength = Number(fileResponse.headers.get("content-length") ?? "0");
  if (contentLength > MAX_TELEGRAM_PHOTO_BYTES) throw new Error("Telegram photo exceeds the size limit");

  const bytes = new Uint8Array(await fileResponse.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_TELEGRAM_PHOTO_BYTES) {
    throw new Error("Telegram photo has an invalid size");
  }
  const image = identifyImage(bytes);
  if (!image) throw new Error("Telegram media is not a supported image");

  return { bytes, ...image };
}

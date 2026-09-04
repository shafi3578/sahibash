import { createHash } from "node:crypto";
import { MAX_TELEGRAM_PHOTO_BYTES, type DownloadedTelegramPhoto } from "./telegram-media";

const MAX_PUBLIC_POST_HTML_BYTES = 1_000_000;
const MAX_PUBLIC_POST_PHOTOS = 12;
const MAX_PUBLIC_POST_AGE_MS = 31 * 24 * 60 * 60 * 1_000;
const MAX_PUBLIC_POST_FUTURE_MS = 24 * 60 * 60 * 1_000;

export type TelegramPublicPostReference = {
  username: string;
  postId: number;
};

export type TelegramPublicPost = TelegramPublicPostReference & {
  sourceUrl: string;
  text: string;
  publishedAt: string;
  photoUrls: string[];
};

function decodeHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(x?[0-9a-f]+);/gi, (_match, code: string) => {
      const radix = code.toLowerCase().startsWith("x") ? 16 : 10;
      const digits = radix === 16 ? code.slice(1) : code;
      const point = Number.parseInt(digits, radix);
      return Number.isSafeInteger(point) && point >= 0 && point <= 0x10ffff
        ? String.fromCodePoint(point)
        : "";
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function validPublicPhotoUrl(value: string) {
  try {
    const url = new URL(decodeHtml(value));
    if (url.protocol !== "https:") return null;
    if (!/^cdn\d*\.telesco\.pe$/i.test(url.hostname)) return null;
    if (!url.pathname.startsWith("/file/") || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function parseTelegramPublicPostUrl(value: string): TelegramPublicPostReference | null {
  const firstUrl = value.match(/https?:\/\/[^\s<>]+/i)?.[0] ?? value.trim();
  try {
    const url = new URL(firstUrl.replace(/[),.;]+$/, ""));
    if (url.protocol !== "https:" || !["t.me", "www.t.me"].includes(url.hostname.toLowerCase())) {
      return null;
    }
    const match = url.pathname.match(/^\/([a-zA-Z][a-zA-Z0-9_]{4,31})\/(\d+)\/?$/);
    if (!match) return null;
    const postId = Number.parseInt(match[2], 10);
    if (!Number.isSafeInteger(postId) || postId <= 0) return null;
    return { username: match[1], postId };
  } catch {
    return null;
  }
}

export function parseTelegramPublicPostHtml(
  html: string,
  requested: TelegramPublicPostReference,
  now = Date.now(),
): TelegramPublicPost | null {
  const dataPost = html.match(/data-post="([a-zA-Z][a-zA-Z0-9_]{4,31})\/(\d+)"/i);
  if (!dataPost || dataPost[1].toLowerCase() !== requested.username.toLowerCase()) return null;

  const textMatch = html.match(/<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/i)
    ?? html.match(/<div class="tgme_widget_message_text js-message_text"[^>]*>([\s\S]*?)<\/div>/i);
  const text = textMatch ? decodeHtml(textMatch[1]) : "";
  const publishedAtMatch = html.match(/<time datetime="([^"]+)"/i);
  const publishedAtMs = Date.parse(publishedAtMatch?.[1] ?? "");
  if (!text || !Number.isFinite(publishedAtMs)) return null;
  if (publishedAtMs < now - MAX_PUBLIC_POST_AGE_MS || publishedAtMs > now + MAX_PUBLIC_POST_FUTURE_MS) {
    return null;
  }

  const photoMatches = [...html.matchAll(/background-image:url\(['"]([^'"]+)['"]\)/gi)];
  const photoUrls = [...new Set(photoMatches.map((match) => validPublicPhotoUrl(match[1])).filter((url): url is string => Boolean(url)))]
    .slice(0, MAX_PUBLIC_POST_PHOTOS);
  if (photoUrls.length === 0) return null;

  const albumIds = [...html.matchAll(/href="https:\/\/t\.me\/([a-zA-Z][a-zA-Z0-9_]{4,31})\/(\d+)\?single"/gi)]
    .filter((match) => match[1].toLowerCase() === requested.username.toLowerCase())
    .map((match) => Number.parseInt(match[2], 10))
    .filter((id) => Number.isSafeInteger(id) && id > 0);
  const postId = albumIds.length > 0 ? Math.min(...albumIds) : Number.parseInt(dataPost[2], 10);

  return {
    username: requested.username,
    postId,
    sourceUrl: `https://t.me/${requested.username}/${postId}`,
    text,
    publishedAt: new Date(publishedAtMs).toISOString(),
    photoUrls,
  };
}

export async function fetchTelegramPublicPost(
  reference: TelegramPublicPostReference,
): Promise<TelegramPublicPost> {
  const embedUrl = `https://t.me/${reference.username}/${reference.postId}?embed=1&mode=tme`;
  const response = await fetch(embedUrl, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(12_000),
  });
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (!response.ok || contentLength > MAX_PUBLIC_POST_HTML_BYTES) {
    throw new Error("Telegram public post is unavailable");
  }
  const html = await response.text();
  if (Buffer.byteLength(html, "utf8") > MAX_PUBLIC_POST_HTML_BYTES) {
    throw new Error("Telegram public post response is too large");
  }
  const post = parseTelegramPublicPostHtml(html, reference);
  if (!post) throw new Error("Telegram public post is incomplete, stale, or invalid");
  return post;
}

function identifyPublicImage(bytes: Uint8Array): Omit<DownloadedTelegramPhoto, "bytes"> | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { contentType: "image/png", extension: "png" };
  }
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}

export async function downloadTelegramPublicPhoto(urlValue: string): Promise<DownloadedTelegramPhoto> {
  const url = validPublicPhotoUrl(urlValue);
  if (!url) throw new Error("Telegram public photo URL is invalid");
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  const contentLength = Number(response.headers.get("content-length") ?? "0");
  if (!response.ok || contentLength > MAX_TELEGRAM_PHOTO_BYTES) {
    throw new Error("Telegram public photo is unavailable");
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.length === 0 || bytes.length > MAX_TELEGRAM_PHOTO_BYTES) {
    throw new Error("Telegram public photo has an invalid size");
  }
  const image = identifyPublicImage(bytes);
  if (!image) throw new Error("Telegram public photo has an unsupported format");
  return { bytes, ...image };
}

export function telegramPublicPhotoFingerprint(url: string) {
  return createHash("sha256").update(url).digest("hex").slice(0, 24);
}

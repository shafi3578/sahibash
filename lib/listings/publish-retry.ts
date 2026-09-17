import { createHash } from "node:crypto";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidQuickPublishRequestId(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/.test(value);
}

export function buildQuickPublishListingId(userId: string, publishRequestId: string) {
  if (!UUID_PATTERN.test(userId) || !isValidQuickPublishRequestId(publishRequestId)) return null;

  const hex = createHash("sha256")
    .update(JSON.stringify(["sahibash:quick-publish:v1", userId.toLowerCase(), publishRequestId]))
    .digest("hex");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-8${hex.slice(13, 16)}-${((parseInt(hex[16], 16) & 3) | 8).toString(16)}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

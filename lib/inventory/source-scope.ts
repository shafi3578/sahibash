export type TelegramSourceScope = {
  username: string;
  slug: string;
  scopeIdentifier: string;
  displayName: string;
  sourceUrl: string;
};

export type TelegramSourceCandidate = {
  source_item_id?: unknown;
  normalized_payload?: unknown;
};

export type TelegramSourceScopeSummary = TelegramSourceScope & {
  candidateCount: number;
};

const TELEGRAM_USERNAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{4,31}$/;
const TELEGRAM_SOURCE_ITEM_PATTERN = /^([A-Za-z][A-Za-z0-9_]{4,31}):[1-9][0-9]*$/;

function asRecord(value: unknown): Record<string, unknown> | null {
  return Boolean(value) && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeTelegramUsername(value: unknown) {
  if (typeof value !== "string") return null;
  const username = value.trim().replace(/^@/, "");
  return TELEGRAM_USERNAME_PATTERN.test(username) ? username : null;
}

function usernameFromPublicUrl(value: unknown) {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || !["t.me", "www.t.me", "telegram.me", "www.telegram.me"].includes(url.hostname.toLowerCase())) {
      return null;
    }
    const [username, postId] = url.pathname.split("/").filter(Boolean);
    if (!username || !/^[1-9][0-9]*$/.test(postId ?? "")) return null;
    return normalizeTelegramUsername(username);
  } catch {
    return null;
  }
}

function buildTelegramSourceScope(username: string): TelegramSourceScope {
  return {
    username,
    slug: `telegram-${username.toLowerCase()}`,
    scopeIdentifier: `@${username}`,
    displayName: `@${username}`,
    sourceUrl: `https://t.me/${username}`,
  };
}

export function detectTelegramSourceScope(candidate: TelegramSourceCandidate) {
  const payload = asRecord(candidate.normalized_payload);
  const publicPostUsername = normalizeTelegramUsername(payload?.public_post_username);
  const sourceUrlUsername = usernameFromPublicUrl(payload?.source_url ?? payload?.sourceUrl);
  const sourceItemMatch = typeof candidate.source_item_id === "string"
    ? candidate.source_item_id.trim().match(TELEGRAM_SOURCE_ITEM_PATTERN)
    : null;
  const sourceItemUsername = normalizeTelegramUsername(sourceItemMatch?.[1]);
  const username = publicPostUsername ?? sourceUrlUsername ?? sourceItemUsername;
  return username ? buildTelegramSourceScope(username) : null;
}

export function summarizeTelegramSourceScopes(candidates: TelegramSourceCandidate[]) {
  const summaries = new Map<string, TelegramSourceScopeSummary>();
  for (const candidate of candidates) {
    const scope = detectTelegramSourceScope(candidate);
    if (!scope) continue;
    const existing = summaries.get(scope.slug);
    summaries.set(scope.slug, existing
      ? { ...existing, candidateCount: existing.candidateCount + 1 }
      : { ...scope, candidateCount: 1 });
  }
  return [...summaries.values()].sort((left, right) =>
    right.candidateCount - left.candidateCount || left.slug.localeCompare(right.slug));
}

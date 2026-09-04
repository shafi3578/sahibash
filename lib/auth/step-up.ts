export type StepUpUserLike = {
  last_sign_in_at?: string | null;
};

export type AuthenticationMethodLike =
  | string
  | {
      method?: string;
      timestamp?: number;
    };

export function getLastPrimaryAuthenticationTimestamp(user: StepUpUserLike | null | undefined) {
  if (!user) return null;

  if (typeof user.last_sign_in_at !== "string" || user.last_sign_in_at.trim().length === 0) {
    return null;
  }

  const timestamp = Date.parse(user.last_sign_in_at);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function getMostRecentAuthenticationTimestamp(
  user: StepUpUserLike | null | undefined,
  authenticationMethods: AuthenticationMethodLike[] = [],
) {
  const timestamps = authenticationMethods.flatMap((entry) => {
    if (
      typeof entry !== "object"
      || entry === null
      || entry.method !== "totp"
      || !Number.isFinite(entry.timestamp)
      || (entry.timestamp ?? 0) <= 0
    ) {
      return [];
    }

    return [(entry.timestamp as number) * 1000];
  });
  const primaryTimestamp = getLastPrimaryAuthenticationTimestamp(user);
  if (primaryTimestamp !== null) timestamps.push(primaryTimestamp);

  return timestamps.length > 0 ? Math.max(...timestamps) : null;
}

export function requiresStepUpAuth(
  user: StepUpUserLike | null | undefined,
  windowMs = 15 * 60 * 1000,
  authenticationMethods: AuthenticationMethodLike[] = [],
) {
  const lastAuthenticatedAt = getMostRecentAuthenticationTimestamp(user, authenticationMethods);
  if (lastAuthenticatedAt === null) return true;

  return Date.now() - lastAuthenticatedAt > windowMs;
}

export type StepUpUserLike = {
  last_sign_in_at?: string | null;
};

export function getLastPrimaryAuthenticationTimestamp(user: StepUpUserLike | null | undefined) {
  if (!user) return null;

  if (typeof user.last_sign_in_at !== "string" || user.last_sign_in_at.trim().length === 0) {
    return null;
  }

  const timestamp = Date.parse(user.last_sign_in_at);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function requiresStepUpAuth(user: StepUpUserLike | null | undefined, windowMs = 15 * 60 * 1000) {
  const lastAuthenticatedAt = getLastPrimaryAuthenticationTimestamp(user);
  if (lastAuthenticatedAt === null) return true;

  return Date.now() - lastAuthenticatedAt > windowMs;
}

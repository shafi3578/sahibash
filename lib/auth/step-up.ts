export type StepUpUserLike = {
  last_sign_in_at?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

export function getMostRecentAuthenticationTimestamp(user: StepUpUserLike | null | undefined) {
  if (!user) return null;

  const candidates = [
    user.user_metadata?.step_up_at,
    user.user_metadata?.last_reauthenticated_at,
    user.last_sign_in_at,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  if (candidates.length === 0) return null;

  return candidates.reduce((latest, candidate) => {
    const candidateTime = Date.parse(candidate);
    if (Number.isNaN(candidateTime)) return latest;
    if (latest === null || candidateTime > latest) return candidateTime;
    return latest;
  }, null as number | null);
}

export function requiresStepUpAuth(user: StepUpUserLike | null | undefined, windowMs = 15 * 60 * 1000) {
  const lastAuthenticatedAt = getMostRecentAuthenticationTimestamp(user);
  if (lastAuthenticatedAt === null) return true;

  return Date.now() - lastAuthenticatedAt > windowMs;
}

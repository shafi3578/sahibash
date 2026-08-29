export type SuggestedDetailValue = string | boolean;
export type SuggestedDetails = Record<string, SuggestedDetailValue>;

function isEmptySuggestedValue(value: SuggestedDetailValue | undefined) {
  return value === undefined || (typeof value === "string" && value.trim() === "");
}

export function sanitizeSuggestedDetails(value: unknown): SuggestedDetails {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, SuggestedDetailValue] => {
        const [, detailValue] = entry;
        return typeof detailValue === "boolean"
          || (typeof detailValue === "string" && detailValue.trim().length > 0);
      })
      .map(([key, detailValue]) => [key, typeof detailValue === "string" ? detailValue.trim() : detailValue]),
  );
}

export function reconcileSuggestedDetails({
  current,
  previousManaged,
  nextSuggested,
  userEditedKeys = new Set<string>(),
}: {
  current: SuggestedDetails;
  previousManaged: SuggestedDetails;
  nextSuggested: SuggestedDetails;
  userEditedKeys?: ReadonlySet<string>;
}) {
  const next = { ...current };
  const managed: SuggestedDetails = {};
  const normalizedSuggestions = sanitizeSuggestedDetails(nextSuggested);

  for (const [key, previousValue] of Object.entries(previousManaged)) {
    if (userEditedKeys.has(key) || key in normalizedSuggestions) continue;
    if (next[key] === previousValue) delete next[key];
  }

  for (const [key, suggestedValue] of Object.entries(normalizedSuggestions)) {
    if (userEditedKeys.has(key)) continue;
    const currentValue = next[key];
    const previousValue = previousManaged[key];
    const mayReplace = isEmptySuggestedValue(currentValue)
      || (previousValue !== undefined && currentValue === previousValue);

    if (!mayReplace) continue;
    next[key] = suggestedValue;
    managed[key] = suggestedValue;
  }

  return { details: next, managed };
}

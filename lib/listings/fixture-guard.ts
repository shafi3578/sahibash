export type FixtureGuardEnvironment = { [key: string]: string | undefined };

export type FixtureListingText = {
  title?: unknown;
  description?: unknown;
  original_title?: unknown;
  original_description?: unknown;
};

const OBVIOUS_FIXTURE_MARKERS = [
  "e2e",
  "fixpass",
  "fixture",
  "seed listing",
  "seed data",
  "smoke test",
  "vehicle smoke test",
  "admin test",
  "test house",
  "test vehicle",
] as const;

function normalizeFixtureText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isProductionRuntime(env: FixtureGuardEnvironment = process.env) {
  return env.VERCEL_ENV === "production" || env.SAHIBASH_ENV === "production";
}

export function containsPublicFixtureMarker(listing: FixtureListingText) {
  const searchableText = [
    listing.title,
    listing.description,
    listing.original_title,
    listing.original_description,
  ]
    .map(normalizeFixtureText)
    .filter(Boolean)
    .join(" ");

  if (!searchableText) return false;

  return OBVIOUS_FIXTURE_MARKERS.some((marker) => {
    const normalizedMarker = normalizeFixtureText(marker);
    const escapedMarker = normalizedMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    return new RegExp(`(?:^|\\b)${escapedMarker}(?:\\b|$)`, "i").test(searchableText);
  });
}

export function shouldBlockPublicFixtureListing(
  listing: FixtureListingText,
  env: FixtureGuardEnvironment = process.env,
) {
  return isProductionRuntime(env) && containsPublicFixtureMarker(listing);
}

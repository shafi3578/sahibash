const DEPRECATED_CATEGORY_PATHS = new Set([
  "vehicles/rickshaws",
  "vehicles/trucks",
  "vehicles/vehicle-parts",
  "vehicles/spare-parts",
  "vehicles/vans",
  "vehicles/auto-parts",
  "vehicles/tires-wheels",
  "real-estate/residential",
  "real-estate/commercial",
  "real-estate/property-projects",
  "clothing-personal-items/bags-accessories",
  "clothing-personal-items/jewelry-watches",
  "clothing-personal-items/other-clothing-personal-items",
]);

export function isDeprecatedCategoryPath(path: string | null | undefined) {
  const normalized = String(path ?? "").trim().toLowerCase();
  if (!normalized) return false;

  if (DEPRECATED_CATEGORY_PATHS.has(normalized)) {
    return true;
  }

  for (const item of DEPRECATED_CATEGORY_PATHS) {
    if (normalized.startsWith(`${item}/`)) {
      return true;
    }
  }

  return false;
}

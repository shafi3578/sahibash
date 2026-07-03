import { LocaleType, Province, District, Area } from './types';

/**
 * Get display name for location entity based on user locale
 */
export function getLocalizedName(
  entity: { name_en: string; name_fa: string; name_ps: string },
  locale: LocaleType = 'en'
): string {
  const names: Record<LocaleType, string> = {
    en: entity.name_en,
    fa: entity.name_fa,
    ps: entity.name_ps,
  };
  return names[locale] || entity.name_en;
}

/**
 * Format location display string
 * Shows: Province > District (> Area if provided)
 */
export function formatLocationDisplay(
  province: Province | null,
  district: District | null,
  area: Area | { name_en: string; name_fa: string; name_ps: string } | null,
  areaCustom: string | null,
  locale: LocaleType = 'en'
): string {
  const parts = [];

  if (province) {
    parts.push(getLocalizedName(province, locale));
  }

  if (district) {
    parts.push(getLocalizedName(district, locale));
  }

  if (areaCustom) {
    parts.push(areaCustom);
  } else if (area) {
    parts.push(getLocalizedName(area, locale));
  }

  return parts.join(' > ');
}

/**
 * Validate location selection
 * Returns validation errors if any
 */
export function validateLocation(
  provinceId: string | null | undefined,
  districtId: string | null | undefined,
  areaId?: string | null,
  areaCustom?: string | null
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!provinceId) {
    errors.province = 'Province is required';
  }

  if (!districtId) {
    errors.district = 'District is required';
  }

  // Area is optional, but if custom area is provided, validate it's not empty
  if (areaCustom && !areaCustom.trim()) {
    errors.area_custom = 'Please enter a valid area name or select from list';
  }

  return errors;
}

/**
 * Search provinces by keyword
 */
export function searchProvinces(
  provinces: Province[],
  query: string,
  locale: LocaleType = 'en'
): Province[] {
  if (!query.trim()) return provinces;

  const lower = query.toLowerCase();
  return provinces.filter((p) => {
    const name = getLocalizedName(p, locale).toLowerCase();
    const allNames = [p.name_en, p.name_fa, p.name_ps, ...(p.aliases || [])].map((n) =>
      n.toLowerCase()
    );
    return allNames.some((n) => n.includes(lower));
  });
}

/**
 * Search districts by keyword
 */
export function searchDistricts(
  districts: District[],
  query: string,
  locale: LocaleType = 'en'
): District[] {
  if (!query.trim()) return districts;

  const lower = query.toLowerCase();
  return districts.filter((d) => {
    const name = getLocalizedName(d, locale).toLowerCase();
    const allNames = [d.name_en, d.name_fa, d.name_ps, ...(d.aliases || [])].map((n) =>
      n.toLowerCase()
    );
    return allNames.some((n) => n.includes(lower));
  });
}

/**
 * Search areas by keyword
 */
export function searchAreas(
  areas: Area[],
  query: string,
  locale: LocaleType = 'en'
): Area[] {
  if (!query.trim()) return areas;

  const lower = query.toLowerCase();
  return areas.filter((a) => {
    const name = getLocalizedName(a, locale).toLowerCase();
    const allNames = [a.name_en, a.name_fa, a.name_ps, ...(a.aliases || [])].map((n) =>
      n.toLowerCase()
    );
    return allNames.some((n) => n.includes(lower));
  });
}

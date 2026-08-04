export type SiteSettingsRecord = {
  id?: number;
  site_name?: string | null;
  site_tagline?: string | null;
  contact_email?: string | null;
  contact_phone?: string | null;
  default_locale?: string | null;
  home_hero_title?: string | null;
  home_hero_subtitle?: string | null;
  home_primary_cta_label?: string | null;
  home_primary_cta_path?: string | null;
  home_secondary_cta_label?: string | null;
  home_secondary_cta_path?: string | null;
  navigation_links?: NavigationLinkRecord[];
  step_up_window_minutes?: number | null;
  updated_at?: string | null;
};

export type NavigationLinkRecord = {
  label: string;
  path: string;
};

export type SiteSettingsVersionRecord = SiteSettingsRecord & {
  id: number;
  version_number: number;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
  published_at: string | null;
};

export const DEFAULT_SITE_SETTINGS = {
  site_name: "Sahibash",
  site_tagline: "Marketplace for Afghanistan",
  contact_email: "hello@afghan.com",
  contact_phone: "+93700000000",
  default_locale: "fa",
  home_hero_title: "Discover trusted listings across Afghanistan",
  home_hero_subtitle: "Buy, sell, and browse with local-first controls and multilingual search.",
  home_primary_cta_label: "Browse listings",
  home_primary_cta_path: "/listings",
  home_secondary_cta_label: "Post an ad",
  home_secondary_cta_path: "/post-ad/create?posting=sell",
  navigation_links: [
    { label: "Listings", path: "/listings" },
    { label: "Categories", path: "/categories" },
  ],
  step_up_window_minutes: 15,
} as const;

function normalizeNavigationLinks(input: unknown): NavigationLinkRecord[] | undefined {
  if (Array.isArray(input)) {
    const normalized = input
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }

        const record = item as Record<string, unknown>;
        const labelValue = record.label;
        const pathValue = record.path;
        const label = typeof labelValue === "string" ? labelValue.trim() : "";
        const path = typeof pathValue === "string" ? pathValue.trim() : "";

        return label && path ? { label, path } : null;
      })
      .filter((item): item is NavigationLinkRecord => Boolean(item));

    return normalized.length > 0 ? normalized : undefined;
  }

  if (typeof input !== "string") {
    return undefined;
  }

  const normalized = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawLabel, ...rest] = line.split("|");
      const label = rawLabel?.trim() ?? "";
      const path = rest.join("|").trim();
      return label && path ? { label, path } : null;
    })
    .filter((item): item is NavigationLinkRecord => Boolean(item));

  return normalized.length > 0 ? normalized : undefined;
}

export function normalizeSiteSettings(input: Record<string, unknown>): Partial<SiteSettingsRecord> {
  const next: Partial<SiteSettingsRecord> = {};

  const siteName = typeof input.site_name === "string" ? input.site_name.trim() : "";
  const contactEmail = typeof input.contact_email === "string" ? input.contact_email.trim() : "";
  const defaultLocale = typeof input.default_locale === "string" ? input.default_locale.trim() : "";
  const siteTagline = typeof input.site_tagline === "string" ? input.site_tagline.trim() : "";
  const contactPhone = typeof input.contact_phone === "string" ? input.contact_phone.trim() : "";
  const homeHeroTitle = typeof input.home_hero_title === "string" ? input.home_hero_title.trim() : "";
  const homeHeroSubtitle = typeof input.home_hero_subtitle === "string" ? input.home_hero_subtitle.trim() : "";
  const homePrimaryCtaLabel = typeof input.home_primary_cta_label === "string" ? input.home_primary_cta_label.trim() : "";
  const homePrimaryCtaPath = typeof input.home_primary_cta_path === "string" ? input.home_primary_cta_path.trim() : "";
  const homeSecondaryCtaLabel = typeof input.home_secondary_cta_label === "string" ? input.home_secondary_cta_label.trim() : "";
  const homeSecondaryCtaPath = typeof input.home_secondary_cta_path === "string" ? input.home_secondary_cta_path.trim() : "";
  const navigationLinks = normalizeNavigationLinks(input.navigation_links);
  const stepUpWindowMinutes = Number(input.step_up_window_minutes ?? 0);

  if (siteName) next.site_name = siteName;
  if (siteTagline) next.site_tagline = siteTagline;
  if (contactEmail) next.contact_email = contactEmail;
  if (contactPhone) next.contact_phone = contactPhone;
  if (defaultLocale) next.default_locale = defaultLocale;
  if (homeHeroTitle) next.home_hero_title = homeHeroTitle;
  if (homeHeroSubtitle) next.home_hero_subtitle = homeHeroSubtitle;
  if (homePrimaryCtaLabel) next.home_primary_cta_label = homePrimaryCtaLabel;
  if (homePrimaryCtaPath) next.home_primary_cta_path = homePrimaryCtaPath;
  if (homeSecondaryCtaLabel) next.home_secondary_cta_label = homeSecondaryCtaLabel;
  if (homeSecondaryCtaPath) next.home_secondary_cta_path = homeSecondaryCtaPath;
  if (navigationLinks) next.navigation_links = navigationLinks;
  if (Number.isFinite(stepUpWindowMinutes) && stepUpWindowMinutes > 0) {
    next.step_up_window_minutes = stepUpWindowMinutes;
  }

  return next;
}

export function resolvePublicSiteSettings(input?: Partial<SiteSettingsRecord>): SiteSettingsRecord {
  const base = { ...DEFAULT_SITE_SETTINGS };
  const normalized = normalizeSiteSettings(input ?? {});

  return {
    ...base,
    ...normalized,
    site_name: normalized.site_name ?? base.site_name,
    site_tagline: normalized.site_tagline ?? base.site_tagline,
    contact_email: normalized.contact_email ?? base.contact_email,
    contact_phone: normalized.contact_phone ?? base.contact_phone,
    default_locale: normalized.default_locale ?? base.default_locale,
    home_hero_title: normalized.home_hero_title ?? base.home_hero_title,
    home_hero_subtitle: normalized.home_hero_subtitle ?? base.home_hero_subtitle,
    home_primary_cta_label: normalized.home_primary_cta_label ?? base.home_primary_cta_label,
    home_primary_cta_path: normalized.home_primary_cta_path ?? base.home_primary_cta_path,
    home_secondary_cta_label: normalized.home_secondary_cta_label ?? base.home_secondary_cta_label,
    home_secondary_cta_path: normalized.home_secondary_cta_path ?? base.home_secondary_cta_path,
    navigation_links: normalized.navigation_links ?? [...base.navigation_links],
    step_up_window_minutes: normalized.step_up_window_minutes ?? base.step_up_window_minutes,
  };
}

export function resolveSiteSettingsVersionSnapshot(input?: Partial<SiteSettingsRecord>): SiteSettingsRecord {
  return resolvePublicSiteSettings(input ?? {});
}

import "server-only";

import { revalidatePath, updateTag } from "next/cache";

export const PUBLIC_CACHE_TAGS = {
  categoryCounts: "category-counts",
  categoryTaxonomy: "category-taxonomy",
  listingSchema: "listing-schema",
  locationReference: "location-reference",
  navigation: "public-navigation",
  siteSettings: "site-settings",
  homepageSections: "homepage-sections",
  publicListingFeed: "public-listing-feed",
  searchReference: "search-reference",
} as const;

const PUBLIC_LOCALES = ["", "/en", "/fa", "/ps"] as const;

export function revalidatePublicMarketplaceCache(listingId?: string) {
  updateTag(PUBLIC_CACHE_TAGS.publicListingFeed);
  updateTag(PUBLIC_CACHE_TAGS.categoryCounts);

  for (const localePrefix of PUBLIC_LOCALES) {
    revalidatePath(localePrefix || "/");
    revalidatePath(`${localePrefix}/listings`);
    revalidatePath(`${localePrefix}/featured`);
    revalidatePath(`${localePrefix}/search`);
    revalidatePath(`${localePrefix}/categories`);
    if (listingId) {
      revalidatePath(`${localePrefix}/listings/${listingId}`);
    }
  }
}

export function revalidatePublicTaxonomyCache() {
  updateTag(PUBLIC_CACHE_TAGS.categoryTaxonomy);
  updateTag(PUBLIC_CACHE_TAGS.categoryCounts);
  updateTag(PUBLIC_CACHE_TAGS.listingSchema);

  for (const localePrefix of PUBLIC_LOCALES) {
    revalidatePath(localePrefix || "/");
    revalidatePath(`${localePrefix}/categories`);
    revalidatePath(`${localePrefix}/search`);
    revalidatePath(`${localePrefix}/post-ad`);
    revalidatePath(`${localePrefix}/post-ad/create`);
  }
}

export function revalidatePublicChromeCache() {
  updateTag(PUBLIC_CACHE_TAGS.navigation);
  updateTag(PUBLIC_CACHE_TAGS.siteSettings);
  updateTag(PUBLIC_CACHE_TAGS.homepageSections);

  for (const localePrefix of PUBLIC_LOCALES) {
    revalidatePath(localePrefix || "/");
  }
}

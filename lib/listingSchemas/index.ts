import { vehicleSchemas } from "./vehicles";
import { realEstateSchemas } from "./realEstate";
import { mobilesElectronicsSchemas } from "./mobilesElectronics";
import { usedItemsSchemas } from "./usedItems";
import type { ListingSchemaDefinition } from "./shared";
import { buildListingSchemaView } from "./shared";
import type { AppLocale } from "@/lib/i18n/translations";
import type { ListingWithRelations } from "@/types/database";

export const ACTIVE_LISTING_SCHEMAS: ListingSchemaDefinition[] = [
  ...vehicleSchemas,
  ...realEstateSchemas,
  ...mobilesElectronicsSchemas,
  ...usedItemsSchemas,
];

export function getListingSchemaForListing(listing: ListingWithRelations): ListingSchemaDefinition | null {
  return ACTIVE_LISTING_SCHEMAS.find((schema) => schema.match(listing)) ?? null;
}

export function buildActiveListingSchemaView(listing: ListingWithRelations, locale: AppLocale) {
  return buildListingSchemaView(listing, locale, ACTIVE_LISTING_SCHEMAS);
}

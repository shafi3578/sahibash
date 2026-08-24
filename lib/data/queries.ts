import "server-only";

import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { getCurrentUser } from "@/lib/auth";
import { reportDataError } from "@/lib/observability/data-errors";
import type {
  ListingWithRelations,
  ListingWithImages,
  Category,
  CategoryNode,
  CategoryField,
  Subcategory,
  Message,
  Offer,
  ListingVehicleFeature,
} from "@/types/database";
import {
  ACTIVE_HOME_CATEGORY_SLUGS,
  LAUNCH_ACTIVE_CATEGORY_SLUGS,
} from "@/lib/categories/categoryTree";
import {
  appLocaleToListingLanguage,
  getCompletedListingTranslations,
  listingLanguageLabel,
  type ListingLanguageCode,
} from "@/lib/listings/translation-service";
import type { AppLocale } from "@/lib/i18n/translations";
import { buildSearchKeywordIndex, normalizeSearchText } from "@/lib/search/multilingual";
import { resolveSearchRewriteContext } from "@/lib/search/rewrite";
import type { SearchRewriteClient } from "@/lib/search/rewrite";
import { understandSearchQuery } from "@/lib/search/query-understanding";
import { getSimpleCategoryConfig, getSimpleCategoryKind } from "@/lib/posting/simple-category-details";
import {
  sanitizePublicListingBoundaries,
  sanitizePublicListingBoundary,
} from "@/lib/listings/public-boundary";

type ListingFilters = {
  locale?: AppLocale;
  categoryId?: number;
  categorySlug?: string;
  categoryNodeId?: number;
  categoryScope?: "subtree" | "exact";
  sort?: "newest" | "price_low" | "price_high" | "nearest" | "relevant";
  province?: string;
  district?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: string;
  rentalType?: string;
  suitableForStudents?: boolean;
  genderSuitable?: string;
  distanceToUniversityMax?: number;
  photosOnly?: boolean;
  minMonthlyRent?: number;
  maxMonthlyRent?: number;
  minGerawyAmount?: number;
  maxGerawyAmount?: number;
  minRooms?: number;
  furnished?: boolean;
  ownerType?: string;
  dormitoryGender?: string;
  maxDormitoryPrice?: number;
  paymentPeriod?: string;
  roomType?: string;
  numberOfBedsMin?: number;
  internet?: boolean;
  water?: boolean;
  electricity?: boolean;
  mealsIncluded?: boolean;
  security?: boolean;
  minLandSize?: number;
  maxLandSize?: number;
  vehicleType?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  yearMin?: number;
  yearMax?: number;
  kmMin?: number;
  kmMax?: number;
  fuelType?: string;
  transmission?: string;
  bodyType?: string;
  engineCapacity?: string;
  color?: string;
  sellerType?: string;
  warranty?: string;
  exchange?: boolean;
  plateStatus?: string;
  customsStatus?: string;
  importedFrom?: string;
  condition?: string;
  accidentStatus?: string;
  oldVehicle?: boolean;
  importedVehicle?: boolean;
  rebuiltVehicle?: boolean;
  customVehicle?: boolean;
  documentsAvailable?: boolean;
  engineSwapped?: boolean;
  olderThan1980?: boolean;
  honda70?: boolean;
  engineCc?: string;
  rickshawType?: string;
  passengerCapacity?: string;
  cargoCapacity?: string;
  phoneModel?: string;
  storage?: string;
  ram?: string;
  batteryHealthMin?: number;
  originalRefurbished?: string;
  bathroomsMin?: number;
  parking?: boolean;
  listingType?: "for_sale" | "wanted";
  postedWithin?: "24h" | "7d" | "30d";
  limit?: number;
  offset?: number;
};

function attachPreferredTranslation(
  rows: ListingWithRelations[],
  translationsByListingId: Record<string, { title: string; description: string }>,
  requestedLanguage: ListingLanguageCode
) {
  return rows.map((listing) => {
    const translated = translationsByListingId[listing.id];
    const originalLocale = (listing.original_locale as ListingLanguageCode | null) ?? "en";
    if (translated) {
      return {
        ...listing,
        translated_title: translated.title,
        translated_description: translated.description,
        display_language: requestedLanguage,
        translation_note: `Translated from ${listingLanguageLabel(originalLocale)}`,
      };
    }

    return {
      ...listing,
      translated_title: listing.title,
      translated_description: listing.description,
      display_language: originalLocale,
      translation_note: `Original language: ${listingLanguageLabel(originalLocale)}`,
    };
  });
}

const PUBLIC_TEST_TEXT_PATTERNS = [
  "%test listing%",
  "%demo listing%",
  "%dummy listing%",
  "%this is a test%",
  "%for testing%",
  "%sample ad%",
];

const PUBLIC_LISTING_SELECT = `
  id,
  category_id,
  subcategory_id,
  category_node_id,
  vehicle_variant_id,
  product_model_id,
  vehicle_type,
  vehicle_subtype,
  vehicle_brand,
  vehicle_model,
  vehicle_year,
  vehicle_is_manual,
  vehicle_is_classic,
  vehicle_is_custom,
  vehicle_manual_specs,
  suitable_for_students,
  student_housing_type,
  gender_allowed,
  payment_period,
  distance_to_university,
  title,
  description,
  original_title,
  original_description,
  original_language,
  original_locale,
  price,
  currency,
  city,
  country_id,
  province_id,
  district_id,
  area_id,
  province,
  district,
  neighborhood,
  address_optional,
  is_location_confirmed,
  location_visibility,
  video_url,
  contact_name,
  delivery_preference,
  meeting_preference,
  negotiable,
  minimum_offer,
  status,
  featured,
  urgent,
  views_count,
  favorites_count,
  messages_count,
  listing_score,
  created_at,
  updated_at,
  expires_at,
  published_at,
  last_bumped_at,
  archived_at,
  source_type,
  ownership_status,
  publication_status,
  freshness_status,
  provenance_status,
  source_platform,
  source_url,
  source_last_seen_at,
  source_posted_at,
  provenance_confidence,
  allow_contact_display,
  noindex_external,
  removed_public_at,
  category:category_id(*),
  category_node:category_node_id(*),
  listing_images(id, listing_id, image_url:public_url, public_url, storage_path, is_primary, sort_order, created_at),
  listing_attributes(*)
`;

const LISTING_DETAIL_PRIVATE_SELECT = `
  *,
  category:category_id(*),
  category_node:category_node_id(*),
  listing_attributes(*),
  listing_images(id, listing_id, image_url:public_url, public_url, storage_path, is_primary, sort_order, created_at),
  provinces!province_id(id, name, slug),
  districts!district_id(id, name, slug),
  areas!area_id(id, name, slug)
`;

const LISTING_DETAIL_PUBLIC_FALLBACK_SELECT = `
  ${PUBLIC_LISTING_SELECT},
  provinces!province_id(id, name, slug),
  districts!district_id(id, name, slug),
  areas!area_id(id, name, slug)
`;

async function getCurrentUserCanModerateListings(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  userId: string | undefined
) {
  if (!userId) return false;
  const { data, error } = await supabase.rpc("is_admin", { uid: userId });
  return !error && data === true;
}

function applyPublicListingQualityFilters<T>(query: T): T {
  let next = query as T & {
    not: (column: string, operator: string, value: string) => T;
  };

  for (const pattern of PUBLIC_TEST_TEXT_PATTERNS) {
    next = next.not("title", "ilike", pattern) as typeof next;
    next = next.not("description", "ilike", pattern) as typeof next;
  }

  return next as T;
}

function buildSearchOrClause(searchTerms: string[], includeIds?: string[]) {
  const toLooseLatinPattern = (term: string): string | null => {
    const base = term.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (base.length < 4) {
      return null;
    }
    const skeleton = base.replace(/[aeiou]/g, "");
    if (skeleton.length < 4) {
      return null;
    }
    return skeleton.split("").join("%");
  };

  const termClauses: string[] = [];
  for (const term of searchTerms) {
    const trimmed = term.trim();
    if (!trimmed) {
      continue;
    }
    termClauses.push(`title.ilike.%${trimmed}%`);
    termClauses.push(`description.ilike.%${trimmed}%`);
    termClauses.push(`vehicle_brand.ilike.%${trimmed}%`);
    termClauses.push(`vehicle_model.ilike.%${trimmed}%`);

    const loosePattern = toLooseLatinPattern(trimmed);
    if (loosePattern) {
      termClauses.push(`title.ilike.%${loosePattern}%`);
      termClauses.push(`description.ilike.%${loosePattern}%`);
      termClauses.push(`vehicle_brand.ilike.%${loosePattern}%`);
      termClauses.push(`vehicle_model.ilike.%${loosePattern}%`);
    }
  }

  if (includeIds && includeIds.length > 0) {
    termClauses.push(`id.in.(${includeIds.join(",")})`);
  }

  return termClauses.join(",");
}

export type SearchIntent = {
  categorySlug: string;
  categoryNodeId: number | null;
  confidence: "high" | "medium" | "low";
  brand?: string;
  model?: string;
  rentalType?: string;
  matchedRule: string;
};

export type FilterDefinition = {
  id: number;
  category_node_id: number | null;
  filter_key: string;
  filter_label: string;
  filter_type: "select" | "multi_select" | "range" | "boolean" | "text" | "date" | "location" | "distance";
  options: unknown;
  source_table: string | null;
  source_column: string | null;
  sort_order: number;
  is_active: boolean;
};

export async function getApprovedListings(
  filters?: ListingFilters
): Promise<ListingWithRelations[]> {
    try {
      const supabase = await createSupabaseServerClient();

      const lifecycleCategoryIds = await (async () => {
        const lifecycle = await supabase
          .from("categories")
          .select("id")
          .eq("is_active", true)
          .eq("is_coming_soon", false);

        if (!lifecycle.error && lifecycle.data) {
          return (lifecycle.data as Array<{ id: number }>).map((row) => row.id);
        }

        const fallback = await supabase
          .from("categories")
          .select("id")
          .in("slug", [...LAUNCH_ACTIVE_CATEGORY_SLUGS]);

        if (fallback.error || !fallback.data) {
          return [] as number[];
        }

        return (fallback.data as Array<{ id: number }>).map((row) => row.id);
      })();

      if (lifecycleCategoryIds.length === 0) {
        return [];
      }

      const intersectIds = (base: string[] | null, next: string[]): string[] => {
        if (base === null) {
          return [...new Set(next)];
        }
        const lookup = new Set(next);
        return base.filter((id) => lookup.has(id));
      };

      let attributeScopedListingIds: string[] | null = null;
      let translatedSearchListingIds: string[] = [];
      const rewriteContext = await resolveSearchRewriteContext({
        supabase: supabase as unknown as SearchRewriteClient,
        queryText: filters?.search?.trim() ?? "",
        categoryScope: null,
      });
      const searchVariants = rewriteContext.variants.slice(0, 20);
      const understoodSearch = understandSearchQuery(filters?.search ?? "");
      const hasPriceBoundaryFilter = typeof filters?.minPrice === "number" || typeof filters?.maxPrice === "number";
      const hasPriceSort = filters?.sort === "price_low" || filters?.sort === "price_high";
      const shouldExcludeContactPriceSentinel = hasPriceBoundaryFilter || hasPriceSort;

      if (searchVariants.length > 0) {
        const translationSearchClause = searchVariants
          .flatMap((term) => [
            `title.ilike.%${term}%`,
            `description.ilike.%${term}%`,
            `normalized_keywords.ilike.%${term}%`,
          ])
          .join(",");

        const { data: translationRows } = await supabase
          .from("listing_translations")
          .select("listing_id")
          .eq("translation_status", "completed")
          .or(translationSearchClause)
          .limit(5000);

        translatedSearchListingIds = Array.from(
          new Set(
            (translationRows ?? [])
              .map((row) => String((row as { listing_id?: string }).listing_id ?? ""))
              .filter((id) => id.length > 0)
          )
        );
      }

      const applyAttributeTextFilter = async (attributeKey: string, value?: string) => {
        if (!value) {
          return;
        }
        let q = supabase
          .from("listing_attributes")
          .select("listing_id")
          .eq("attribute_key", attributeKey)
          .ilike("attribute_value_text", `%${value}%`)
          .limit(5000);

        if (attributeScopedListingIds && attributeScopedListingIds.length > 0) {
          q = q.in("listing_id", attributeScopedListingIds);
        }

        const { data, error } = await q;
        if (error) {
          return;
        }

        const ids = (data ?? [])
          .map((row) => String((row as { listing_id?: string }).listing_id ?? ""))
          .filter((id) => id.length > 0);

        attributeScopedListingIds = intersectIds(attributeScopedListingIds, ids);
      };

      const applyAttributeNumberFilter = async (
        attributeKey: string,
        min?: number,
        max?: number
      ) => {
        const hasMin = typeof min === "number";
        const hasMax = typeof max === "number";
        if (!hasMin && !hasMax) {
          return;
        }

        let q = supabase
          .from("listing_attributes")
          .select("listing_id")
          .eq("attribute_key", attributeKey)
          .limit(5000);

        if (hasMin) {
          q = q.gte("attribute_value_number", min as number);
        }
        if (hasMax) {
          q = q.lte("attribute_value_number", max as number);
        }

        if (attributeScopedListingIds && attributeScopedListingIds.length > 0) {
          q = q.in("listing_id", attributeScopedListingIds);
        }

        const { data, error } = await q;
        if (error) {
          return;
        }

        const ids = (data ?? [])
          .map((row) => String((row as { listing_id?: string }).listing_id ?? ""))
          .filter((id) => id.length > 0);

        attributeScopedListingIds = intersectIds(attributeScopedListingIds, ids);
      };

      const applyAttributeBooleanFilter = async (attributeKey: string, value?: boolean) => {
        if (typeof value !== "boolean") {
          return;
        }
        let q = supabase
          .from("listing_attributes")
          .select("listing_id")
          .eq("attribute_key", attributeKey)
          .eq("attribute_value_boolean", value)
          .limit(5000);

        if (attributeScopedListingIds && attributeScopedListingIds.length > 0) {
          q = q.in("listing_id", attributeScopedListingIds);
        }

        const { data, error } = await q;
        if (error) {
          return;
        }

        const ids = (data ?? [])
          .map((row) => String((row as { listing_id?: string }).listing_id ?? ""))
          .filter((id) => id.length > 0);

        attributeScopedListingIds = intersectIds(attributeScopedListingIds, ids);
      };

      const applyWantedOnlyFilter = async (listingType?: "for_sale" | "wanted") => {
        if (listingType !== "wanted") {
          return;
        }

        let q = supabase
          .from("listing_attributes")
          .select("listing_id")
          .in("attribute_key", ["listing_type", "listing_purpose", "rental_type"])
          .ilike("attribute_value_text", "%wanted%")
          .limit(5000);

        if (attributeScopedListingIds && attributeScopedListingIds.length > 0) {
          q = q.in("listing_id", attributeScopedListingIds);
        }

        const { data, error } = await q;
        if (error) {
          return;
        }

        const ids = (data ?? [])
          .map((row) => String((row as { listing_id?: string }).listing_id ?? ""))
          .filter((id) => id.length > 0);

        attributeScopedListingIds = intersectIds(attributeScopedListingIds, ids);
      };

      if (filters?.categoryNodeId) {
        const { data: scopedRoot } = await supabase
          .from("category_nodes")
          .select("path")
          .eq("id", filters.categoryNodeId)
          .maybeSingle();

        const scopedPath = typeof scopedRoot?.path === "string" ? scopedRoot.path : "";
        const isRealEstateScope = scopedPath.startsWith("real-estate");
        const isStudentHousingScope =
          scopedPath === "real-estate/room-house-for-students"
          || scopedPath.startsWith("real-estate/room-house-for-students/")
          || scopedPath === "real-estate/dormitory"
          || scopedPath.startsWith("real-estate/dormitory/");
        const hasStudentAttributeFilters = Boolean(
          filters.paymentPeriod ||
          filters.roomType ||
          typeof filters.numberOfBedsMin === "number" ||
          typeof filters.internet === "boolean" ||
          typeof filters.water === "boolean" ||
          typeof filters.electricity === "boolean" ||
          typeof filters.mealsIncluded === "boolean" ||
          typeof filters.security === "boolean"
        );

        if (isStudentHousingScope && !hasStudentAttributeFilters) {
          const { data: listingIds, error: listingIdsError } = await supabase.rpc("search_student_housing_listing_ids", {
            collection_node_id: filters.categoryNodeId,
            category_scope: filters.categoryScope === "exact" ? "exact" : "subtree",
            province_filter: filters.province ?? null,
            district_filter: filters.district ?? null,
            price_min_filter: filters.minPrice ?? null,
            price_max_filter: filters.maxPrice ?? null,
            property_type_filter: filters.propertyType ?? null,
            rooms_min_filter: filters.minRooms ?? null,
            furnished_filter: typeof filters.furnished === "boolean" ? filters.furnished : null,
            owner_type_filter: filters.ownerType ?? null,
            gender_allowed_filter: filters.genderSuitable ?? filters.dormitoryGender ?? null,
            distance_to_university_max_filter: filters.distanceToUniversityMax ?? null,
            photos_only_filter: typeof filters.photosOnly === "boolean" ? filters.photosOnly : null,
          });

          if (!listingIdsError) {
            const ids = Array.isArray(listingIds)
              ? listingIds
                  .map((row) => String((row as { listing_id?: string }).listing_id ?? ""))
                  .filter((id) => id.length > 0)
              : [];

            if (ids.length === 0) {
              return [];
            }

            let studentQuery = supabase
              .from("listings")
              .select(PUBLIC_LISTING_SELECT as string)
              .eq("status", "approved")
              .in("category_id", lifecycleCategoryIds)
              .in("id", ids)
              .limit(120);

            studentQuery = applyPublicListingQualityFilters(studentQuery);

            if (shouldExcludeContactPriceSentinel) {
              studentQuery = studentQuery.gt("price", 0);
            }

            if (searchVariants.length > 0) {
              studentQuery = studentQuery.or(buildSearchOrClause(searchVariants, translatedSearchListingIds));
            }

            if (filters.sort === "price_low") {
              studentQuery = studentQuery.order("price", { ascending: true }).order("created_at", { ascending: false });
            } else if (filters.sort === "price_high") {
              studentQuery = studentQuery.order("price", { ascending: false }).order("created_at", { ascending: false });
            } else {
              studentQuery = studentQuery.order("created_at", { ascending: false });
            }

            const { data, error } = await studentQuery;
            if (error || !data) {
              return [];
            }

            return sanitizePublicListingBoundaries(data as unknown as ListingWithRelations[]).slice(0, 40);
          }
        }

        if (isRealEstateScope) {
          const hasAdvancedRealEstateFilters = Boolean(
            filters.province ||
            filters.district ||
            filters.propertyType ||
            filters.rentalType ||
            typeof filters.suitableForStudents === "boolean" ||
            filters.genderSuitable ||
            typeof filters.distanceToUniversityMax === "number" ||
            typeof filters.photosOnly === "boolean" ||
            typeof filters.minMonthlyRent === "number" ||
            typeof filters.maxMonthlyRent === "number" ||
            typeof filters.minGerawyAmount === "number" ||
            typeof filters.maxGerawyAmount === "number" ||
            typeof filters.minRooms === "number" ||
            typeof filters.furnished === "boolean" ||
            filters.ownerType ||
            filters.dormitoryGender ||
            typeof filters.maxDormitoryPrice === "number" ||
            typeof filters.minLandSize === "number" ||
            typeof filters.maxLandSize === "number"
          );

          if (hasAdvancedRealEstateFilters && !hasStudentAttributeFilters) {
            const { data: listingIds, error: listingIdsError } = await supabase.rpc("search_real_estate_listing_ids", {
              root_category_node_id: filters.categoryNodeId,
              category_scope: filters.categoryScope === "exact" ? "exact" : "subtree",
              province_filter: filters.province ?? null,
              district_filter: filters.district ?? null,
              property_type_filter: filters.propertyType ?? null,
              rental_type_filter: filters.rentalType ?? null,
              price_min_filter: filters.minPrice ?? null,
              price_max_filter: filters.maxPrice ?? null,
              monthly_rent_min_filter: filters.minMonthlyRent ?? null,
              monthly_rent_max_filter: filters.maxMonthlyRent ?? null,
              gerawy_min_filter: filters.minGerawyAmount ?? null,
              gerawy_max_filter: filters.maxGerawyAmount ?? null,
              rooms_min_filter: filters.minRooms ?? null,
              furnished_filter: typeof filters.furnished === "boolean" ? filters.furnished : null,
              owner_type_filter: filters.ownerType ?? null,
              dormitory_gender_filter: filters.dormitoryGender ?? null,
              dormitory_price_max_filter: filters.maxDormitoryPrice ?? null,
              land_size_min_filter: filters.minLandSize ?? null,
              land_size_max_filter: filters.maxLandSize ?? null,
            });

            if (listingIdsError) {
              // RPC may not exist yet in environments where the latest migration is pending.
              // Fall through to generic listing query so search remains usable.
            } else {
              const ids = Array.isArray(listingIds)
                ? listingIds
                    .map((row) => String((row as { listing_id?: string }).listing_id ?? ""))
                    .filter((id) => id.length > 0)
                : [];

              if (ids.length === 0) {
                return [];
              }

              let realEstateQuery = supabase
                .from("listings")
                .select(PUBLIC_LISTING_SELECT as string)
                .eq("status", "approved")
                .in("category_id", lifecycleCategoryIds)
                .in("id", ids)
                .order("created_at", { ascending: false })
                .limit(40);

              realEstateQuery = applyPublicListingQualityFilters(realEstateQuery);

              if (shouldExcludeContactPriceSentinel) {
                realEstateQuery = realEstateQuery.gt("price", 0);
              }

              const { data, error } = await realEstateQuery;

              if (error || !data) {
                return [];
              }

              return sanitizePublicListingBoundaries(data as unknown as ListingWithRelations[]);
            }
          }
        }
      }

      await applyAttributeTextFilter("locked__fuel_type", filters?.fuelType);
      await applyAttributeTextFilter("locked__gear", filters?.transmission);
      await applyAttributeTextFilter("body_type", filters?.bodyType);
      await applyAttributeTextFilter("engine_capacity", filters?.engineCapacity);
      await applyAttributeTextFilter("color", filters?.color);
      await applyAttributeTextFilter("seller_type", filters?.sellerType);
      await applyAttributeTextFilter("warranty", filters?.warranty);
      await applyAttributeBooleanFilter("exchange_available", filters?.exchange);
      await applyAttributeTextFilter("plate_status", filters?.plateStatus);
      await applyAttributeTextFilter("customs_status", filters?.customsStatus);
      await applyAttributeTextFilter("imported_from", filters?.importedFrom);
      await applyAttributeTextFilter("condition", filters?.condition);
      await applyAttributeTextFilter("accident_status", filters?.accidentStatus);
      await applyAttributeBooleanFilter("rebuilt_vehicle", filters?.rebuiltVehicle);
      await applyAttributeBooleanFilter("documents_available", filters?.documentsAvailable);
      await applyAttributeBooleanFilter("engine_swapped", filters?.engineSwapped);
      await applyAttributeNumberFilter("mileage", filters?.kmMin, filters?.kmMax);

      await applyAttributeNumberFilter("bathrooms", filters?.bathroomsMin, undefined);
      await applyAttributeBooleanFilter("parking", filters?.parking);
      await applyAttributeTextFilter("payment_period", filters?.paymentPeriod);
      await applyAttributeTextFilter("room_type", filters?.roomType);
      await applyAttributeNumberFilter("number_of_beds", filters?.numberOfBedsMin, undefined);
      await applyAttributeBooleanFilter("internet", filters?.internet);
      await applyAttributeBooleanFilter("water", filters?.water);
      await applyAttributeBooleanFilter("electricity", filters?.electricity);
      await applyAttributeBooleanFilter("meals_included", filters?.mealsIncluded);
      await applyAttributeBooleanFilter("security", filters?.security);
      await applyAttributeNumberFilter("area_sqm", filters?.minLandSize, filters?.maxLandSize);

      await applyAttributeTextFilter("model", filters?.phoneModel);
      await applyAttributeTextFilter("storage", filters?.storage);
      if (!filters?.storage && understoodSearch.storageGb) {
        await applyAttributeTextFilter("storage", String(understoodSearch.storageGb));
      }
      await applyAttributeTextFilter("ram", filters?.ram);
      await applyAttributeNumberFilter("battery_health", filters?.batteryHealthMin, undefined);
      await applyAttributeTextFilter("original_refurbished", filters?.originalRefurbished);
      await applyWantedOnlyFilter(filters?.listingType);

      const requestedLimit = Math.min(Math.max(filters?.limit ?? 40, 1), 120);
      const requestedOffset = Math.max(filters?.offset ?? 0, 0);
      const queryLimit = Math.min(requestedLimit + requestedOffset, 120);

      let query = supabase
        .from("listings")
        .select(PUBLIC_LISTING_SELECT as string)
        .eq("status", "approved")
        .in("category_id", lifecycleCategoryIds)
        .limit(queryLimit);

      query = applyPublicListingQualityFilters(query);

      if (shouldExcludeContactPriceSentinel) {
        query = query.gt("price", 0);
      }

      if (filters?.province) {
        query = query.eq("province", filters.province);
      } else if (understoodSearch.location?.province) {
        const inferredProvince = understoodSearch.location.province.replace(/[(),%]/g, " ").trim();
        if (inferredProvince) {
          query = query.or(`province.ilike.%${inferredProvince}%,city.ilike.%${inferredProvince}%`);
        }
      }

      if (filters?.district) {
        query = query.ilike("district", `%${filters.district}%`);
      }

      if (typeof filters?.suitableForStudents === "boolean") {
        query = query.eq("suitable_for_students", filters.suitableForStudents);
      }

      if (filters?.genderSuitable) {
        query = query.eq("gender_allowed", filters.genderSuitable.toLowerCase());
      }

      if (typeof filters?.distanceToUniversityMax === "number") {
        query = query.lte("distance_to_university", filters.distanceToUniversityMax);
      }

      if (searchVariants.length > 0) {
        query = query.or(buildSearchOrClause(searchVariants, translatedSearchListingIds));
      }

      if (typeof filters?.minPrice === "number") {
        query = query.gte("price", filters.minPrice);
      }

      if (typeof filters?.maxPrice === "number") {
        query = query.lte("price", filters.maxPrice);
      }

      if (filters?.postedWithin) {
        const now = Date.now();
        const millis = filters.postedWithin === "24h"
          ? 24 * 60 * 60 * 1000
          : filters.postedWithin === "7d"
            ? 7 * 24 * 60 * 60 * 1000
            : 30 * 24 * 60 * 60 * 1000;
        query = query.gte("created_at", new Date(now - millis).toISOString());
      }

      if (filters?.vehicleType) {
        query = query.eq("vehicle_type", filters.vehicleType);
      }

      if (filters?.vehicleBrand) {
        query = query.ilike("vehicle_brand", `%${filters.vehicleBrand}%`);
      }

      if (filters?.vehicleModel) {
        query = query.ilike("vehicle_model", `%${filters.vehicleModel}%`);
      }

      if (typeof filters?.yearMin === "number") {
        query = query.gte("vehicle_year", filters.yearMin);
      }

      if (typeof filters?.yearMax === "number") {
        query = query.lte("vehicle_year", filters.yearMax);
      }

      if (typeof filters?.yearMin !== "number" && typeof filters?.yearMax !== "number" && understoodSearch.year) {
        query = query.eq("vehicle_year", understoodSearch.year);
      }

      if (typeof filters?.oldVehicle === "boolean") {
        query = query.eq("vehicle_is_classic", filters.oldVehicle);
      }

      if (typeof filters?.olderThan1980 === "boolean" && filters.olderThan1980) {
        query = query.lt("vehicle_year", 1980);
      }

      if (typeof filters?.importedVehicle === "boolean") {
        query = query.contains("vehicle_manual_specs", { imported: filters.importedVehicle });
      }

      if (typeof filters?.customVehicle === "boolean") {
        query = query.eq("vehicle_is_custom", filters.customVehicle);
      }

      if (typeof filters?.honda70 === "boolean" && filters.honda70) {
        query = query.ilike("vehicle_subtype", "%honda-70%");
      }

      if (filters?.rickshawType) {
        query = query.eq("vehicle_subtype", filters.rickshawType);
      }

      if (filters?.engineCc) {
        query = query.filter("vehicle_manual_specs->>engine_cc", "ilike", `%${filters.engineCc}%`);
      }

      if (filters?.passengerCapacity) {
        query = query.filter("vehicle_manual_specs->>passenger_capacity", "ilike", `%${filters.passengerCapacity}%`);
      }

      if (filters?.cargoCapacity) {
        query = query.filter("vehicle_manual_specs->>cargo_capacity", "ilike", `%${filters.cargoCapacity}%`);
      }

      if (filters?.categoryId) {
        query = query.eq("category_id", filters.categoryId);
      }

      if (filters?.categoryNodeId) {
        if (filters.categoryScope === "exact") {
          query = query.eq("category_node_id", filters.categoryNodeId);
        } else {
          const { data: ids } = await supabase.rpc("get_category_descendant_ids", {
            root_node_id: filters.categoryNodeId,
          });

          const nodeIds = Array.isArray(ids)
            ? ids.map((row) => Number((row as { node_id?: number }).node_id)).filter((id) => Number.isFinite(id))
            : [];

          if (nodeIds.length > 0) {
            query = query.in("category_node_id", nodeIds);
          } else {
            query = query.eq("category_node_id", filters.categoryNodeId);
          }
        }
      }

      const ids = attributeScopedListingIds;
      if (ids) {
        if ((ids as string[]).length === 0) {
          return [];
        }
        query = query.in("id", ids as string[]);
      }

      if (filters?.sort === "price_low") {
        query = query.order("price", { ascending: true }).order("created_at", { ascending: false });
      } else if (filters?.sort === "price_high") {
        query = query.order("price", { ascending: false }).order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (error || !data) {
        if (error) reportDataError("approved-listings.select", error);
        return [];
      }

      const rows = sanitizePublicListingBoundaries(data as unknown as ListingWithRelations[]);
      const requestedLanguage = appLocaleToListingLanguage(filters?.locale ?? "en");
      const translationsByListingId = await getCompletedListingTranslations(
        supabase,
        rows.map((row) => row.id),
        requestedLanguage
      );
      const translatedRows = attachPreferredTranslation(rows, translationsByListingId, requestedLanguage);

      if (filters?.sort === "relevant" && filters.search?.trim()) {
        const terms = Array.from(new Set(searchVariants.flatMap((variant) => variant.split(/\s+/))))
          .filter((term) => term.length > 1)
          .slice(0, 40);
        const nowMs = Date.now();

        const scored = translatedRows.map((listing) => {
          const title = normalizeSearchText(String(listing.translated_title ?? listing.title ?? ""));
          const description = normalizeSearchText(String(listing.translated_description ?? listing.description ?? ""));
          const indexed = buildSearchKeywordIndex(title, description);

          let titleHits = 0;
          let descHits = 0;
          let indexHits = 0;
          for (const term of terms) {
            if (title.includes(term)) {
              titleHits += 1;
            }
            if (description.includes(term)) {
              descHits += 1;
            }
            if (indexed.includes(term)) {
              indexHits += 1;
            }
          }

          const textScore = terms.length > 0
            ? (titleHits * 2 + descHits + indexHits * 1.5) / (terms.length * 4.5)
            : 0;

          const createdAtMs = listing.created_at ? new Date(listing.created_at).getTime() : nowMs;
          const ageDays = Math.max(0, (nowMs - createdAtMs) / (1000 * 60 * 60 * 24));
          const recencyScore = Math.exp(-ageDays / 30);

          const finalScore = textScore * 0.8 + recencyScore * 0.2;
          return { listing, finalScore };
        });

        scored.sort((a, b) => b.finalScore - a.finalScore);
        return scored.map((item) => item.listing).slice(requestedOffset, requestedOffset + requestedLimit);
      }

      return translatedRows.slice(requestedOffset, requestedOffset + requestedLimit);
    } catch (error) {
      reportDataError("approved-listings.unexpected", error);
      return [];
    }
}

export async function getListingById(
  id: string,
  locale: AppLocale = "en"
): Promise<ListingWithRelations | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const currentUser = await getCurrentUser();
    const canModerateListings = await getCurrentUserCanModerateListings(supabase, currentUser?.id);
    const trustedSupabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdmin() : null;
    const listingReadClient = trustedSupabase ?? supabase;

    const { data, error } = await listingReadClient
      .from("listings")
      .select((trustedSupabase ? LISTING_DETAIL_PRIVATE_SELECT : LISTING_DETAIL_PUBLIC_FALLBACK_SELECT) as string)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    const listing = data as unknown as ListingWithRelations;
    const isOwner = Boolean(currentUser?.id && listing.user_id === currentUser.id);
    const canReadPrivateListing = isOwner || canModerateListings;

    if (listing.status !== "approved" && !canReadPrivateListing) {
      return null;
    }

    const requestedLanguage = appLocaleToListingLanguage(locale);
    const translationsByListingId = await getCompletedListingTranslations(
      supabase,
      [listing.id],
      requestedLanguage
    );
    const translated = translationsByListingId[listing.id];
    const originalLocale = (listing.original_locale as ListingLanguageCode | null) ?? "en";

    listing.translated_title = translated?.title ?? listing.title;
    listing.translated_description = translated?.description ?? listing.description;
    listing.display_language = translated ? requestedLanguage : originalLocale;
    listing.translation_note = translated
      ? `Translated from ${listingLanguageLabel(originalLocale)}`
      : `Original language: ${listingLanguageLabel(originalLocale)}`;
    if (listing.user_id) {
      const { data: profile } = await listingReadClient
        .from("profiles")
        .select("*")
        .eq("id", listing.user_id)
        .maybeSingle();

      if (profile) {
        listing.profile = profile;
      }
    }

    try {
      if (listing.vehicle_variant_id) {
        let vehicleVariant = null;
        try {
          const result = await supabase
            .from("vehicle_variants")
            .select(
              `
              id,
              generation_id,
              name,
              slug,
              fuel_type,
              transmission,
              body_type,
              engine_power,
              engine_capacity,
              wheel_drive,
              doors,
              seats,
              engine_size,
              drive_type,
              display_order,
              is_active,
              created_at,
              updated_at,
              generation:vehicle_generations(
                id,
                model_id,
                name,
                slug,
                year_start,
                year_end,
                display_order,
                is_active,
                created_at,
                updated_at,
                model:vehicle_models(
                  id,
                  brand_id,
                  series_id,
                  name,
                  slug,
                  body_type,
                  doors,
                  seats,
                  display_order,
                  is_active,
                  created_at,
                  updated_at,
                  series:vehicle_series(
                    id,
                    brand_id,
                    name,
                    slug,
                    display_order,
                    is_active,
                    created_at,
                    updated_at
                  ),
                  brand:vehicle_brands(
                    id,
                    category_node_id,
                    name,
                    slug,
                    display_order,
                    is_active,
                    created_at,
                    updated_at
                  )
                )
              )
            `
            )
            .eq("id", listing.vehicle_variant_id)
            .maybeSingle();

          if (!result.error) {
            vehicleVariant = result.data;
          }
        } catch {
          // fall through to legacy fetch
        }

        if (!vehicleVariant) {
          const { data: legacyVariant } = await supabase
            .from("vehicle_variants")
            .select(
              `
              id,
              generation_id,
              name,
              slug,
              fuel_type,
              transmission,
              engine_size,
              drive_type,
              display_order,
              is_active,
              created_at,
              updated_at,
              generation:vehicle_generations(
                id,
                model_id,
                name,
                slug,
                year_start,
                year_end,
                display_order,
                is_active,
                created_at,
                updated_at,
                model:vehicle_models(
                  id,
                  brand_id,
                  name,
                  slug,
                  body_type,
                  doors,
                  seats,
                  display_order,
                  is_active,
                  created_at,
                  updated_at,
                  brand:vehicle_brands(
                    id,
                    category_node_id,
                    name,
                    slug,
                    display_order,
                    is_active,
                    created_at,
                    updated_at
                  )
                )
              )
            `
            )
            .eq("id", listing.vehicle_variant_id)
            .maybeSingle();

          vehicleVariant = legacyVariant
            ? {
                ...legacyVariant,
                body_type: legacyVariant.generation?.[0]?.model?.[0]?.body_type ?? null,
                engine_power: null,
                engine_capacity: legacyVariant.engine_size ?? null,
                wheel_drive: legacyVariant.drive_type ?? null,
                doors: legacyVariant.generation?.[0]?.model?.[0]?.doors ?? null,
                seats: legacyVariant.generation?.[0]?.model?.[0]?.seats ?? null,
              }
            : null;
        }

        listing.vehicle_variant = vehicleVariant ?? null;
      } else {
        listing.vehicle_variant = null;
      }
    } catch {
      listing.vehicle_variant = null;
    }

    try {
      const { data: vehicleFeatures } = await supabase
        .from("listing_vehicle_features")
        .select(
          `
          id,
          listing_id,
          feature_id,
          created_at,
          vehicle_feature:vehicle_features(
            id,
            group_id,
            name,
            slug,
            sort_order,
            is_active,
            created_at,
            group:vehicle_feature_groups(
              id,
              name,
              slug,
              sort_order,
              created_at
            )
          )
        `
        )
        .eq("listing_id", listing.id);

      listing.vehicle_features = (vehicleFeatures as unknown as ListingVehicleFeature[]) ?? [];
    } catch {
      listing.vehicle_features = [];
    }

    // Fetch vehicle damage (fails silently if table not yet created)
    try {
      const { data: damage } = await supabase
        .from("vehicle_damage_reports")
        .select("*, vehicle_damage_parts(*)")
        .eq("listing_id", listing.id)
        .maybeSingle();
      listing.vehicle_damage = damage ?? null;
    } catch {
      listing.vehicle_damage = null;
    }

    return canReadPrivateListing ? listing : sanitizePublicListingBoundary(listing);
  } catch {
    return null;
  }
}

export async function getSimilarListings(listing: ListingWithRelations, locale: AppLocale = "en", limit = 4): Promise<ListingWithRelations[]> {
  const candidates = await getApprovedListings({locale,categoryId:Number(listing.category_id),province:listing.province ?? undefined,sort:"newest"});
  const basePrice=Number(listing.price)||0;
  return candidates.filter(item=>item.id!==listing.id).map(item=>{
    const price=Number(item.price)||0; const priceDistance=basePrice>0?Math.abs(price-basePrice)/basePrice:1;
    const locationScore=item.district&&item.district===listing.district?2:item.province===listing.province?1:0;
    return {item,score:locationScore+Math.max(0,1-priceDistance)};
  }).sort((a,b)=>b.score-a.score).slice(0,limit).map(x=>x.item);
}

export async function getCategoryNodeByPath(path: string): Promise<CategoryNode | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("category_nodes")
      .select("*")
      .eq("path", path)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as CategoryNode;
  } catch {
    return null;
  }
}

export async function getFilterDefinitionsForNode(
  categoryNodeId?: number | null,
  locale: AppLocale = "en"
): Promise<FilterDefinition[]> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: globalDefs } = await supabase
      .from("filter_definitions")
      .select("*")
      .is("category_node_id", null)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (!categoryNodeId) {
      return (globalDefs ?? []) as FilterDefinition[];
    }

    const nodePath = await getCategoryPath(categoryNodeId);
    const scopedIds = nodePath.map((node) => node.id).filter((id) => Number.isFinite(id));

    if (scopedIds.length === 0) {
      return (globalDefs ?? []) as FilterDefinition[];
    }

    const { data: scopedDefs } = await supabase
      .from("filter_definitions")
      .select("*")
      .in("category_node_id", scopedIds)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const merged = [
      ...((globalDefs ?? []) as FilterDefinition[]),
      ...((scopedDefs ?? []) as FilterDefinition[]),
    ];

    const leafNode = await getCategoryNodeById(categoryNodeId);
    const simpleKind = getSimpleCategoryKind(leafNode?.path ?? "", leafNode?.path?.split("/")[0]);
    const simpleConfig = getSimpleCategoryConfig(simpleKind);
    const generatedSimpleDefs: FilterDefinition[] = simpleConfig
      ? simpleConfig.fields
          .filter((field) => field.type !== "textarea")
          .map((field, index) => {
            const filterType = field.type === "number"
              ? "range"
              : field.type === "multiselect"
                ? "multi_select"
                : field.type === "select"
                  ? "select"
                  : "text";

            return {
              id: -(index + 1),
              category_node_id: categoryNodeId,
              filter_key: field.key,
              filter_label: field.label.en,
              filter_type: filterType,
              options: (field.options ?? []).map((option) => option.value),
              source_table: null,
              source_column: null,
              sort_order: index + 1,
              is_active: true,
            } satisfies FilterDefinition;
          })
      : [];

    const byKey = new Map<string, FilterDefinition>();
    for (const def of merged) {
      byKey.set(def.filter_key, def);
    }

    for (const def of generatedSimpleDefs) {
      if (!byKey.has(def.filter_key)) {
        byKey.set(def.filter_key, def);
      }
    }

    const { data: schemaRow } = await supabase.from("listing_schema_versions").select("config")
      .eq("category_node_id", categoryNodeId).eq("status", "published").maybeSingle();
    const configuredFields = ((schemaRow?.config as { fields?: Array<Record<string, unknown>> } | null)?.fields ?? []);
    if (configuredFields.length > 0) {
      const configuredKeys = new Set(configuredFields.map((field) => String(field.key ?? "")));
      for (const key of configuredKeys) byKey.delete(key);
      configuredFields.filter((field) => field.active !== false && field.filter === true).forEach((field, index) => {
        const fieldLabels = field.labels as Record<string, unknown> | undefined;
        const options = Array.isArray(field.options) ? field.options as Array<{ value?: unknown }> : [];
        const fieldType = String(field.type ?? "text");
        const key = String(field.key ?? "");
        if (!key) return;
        byKey.set(key, {
          id: -(10000 + index), category_node_id: categoryNodeId, filter_key: key,
          filter_label: String(fieldLabels?.[locale] ?? fieldLabels?.en ?? key),
          filter_type: fieldType === "number" ? "range" : fieldType === "boolean" ? "boolean" : fieldType === "select" ? "select" : "text",
          options: options.map((option) => String(option.value ?? "")).filter(Boolean), source_table: null, source_column: null,
          sort_order: Number(field.order ?? index), is_active: true,
        });
      });
    }

    return Array.from(byKey.values()).sort((a, b) => a.sort_order - b.sort_order);
  } catch {
    return [];
  }
}

export async function getUserListings(userId: string): Promise<ListingWithRelations[]> {
  try {
    const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdmin() : await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        category_node:category_node_id(*),
        listing_images(id, listing_id, image_url:public_url, public_url, storage_path, is_primary, sort_order),
        listing_attributes(*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) {
      if (error) reportDataError("categories.select", error);
      return [];
    }

    return data as ListingWithRelations[];
  } catch (error) {
    reportDataError("categories.unexpected", error);
    return [];
  }
}

export const getCategories = cache(async (): Promise<Category[]> => {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .in("slug", [...ACTIVE_HOME_CATEGORY_SLUGS])
      .order("display_order", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as Category[];
  } catch {
    return [];
  }
});

export const getPostingRootCategories = cache(async (): Promise<Category[]> => {
  try {
    const supabase = await createSupabaseServerClient();

    const lifecycle = await supabase
      .from("categories")
      .select("*")
      .in("slug", [...ACTIVE_HOME_CATEGORY_SLUGS])
      .order("display_order", { ascending: true });

    if (!lifecycle.error && lifecycle.data) {
      return lifecycle.data as Category[];
    }

    const fallback = await supabase
      .from("categories")
      .select("*")
      .in("slug", [...ACTIVE_HOME_CATEGORY_SLUGS])
      .order("display_order", { ascending: true });

    if (fallback.error || !fallback.data) {
      return [];
    }

    return (fallback.data as Category[]).map((category) => ({
      ...category,
      is_coming_soon: !LAUNCH_ACTIVE_CATEGORY_SLUGS.includes(category.slug as (typeof LAUNCH_ACTIVE_CATEGORY_SLUGS)[number]),
      launch_date: null,
    }));
  } catch {
    return [];
  }
});

export const getSubcategoriesByCategory = cache(
  async (categoryId: number): Promise<Subcategory[]> => {
    try {
      const supabase = await createSupabaseServerClient();

      const { data, error } = await supabase
        .from("category_nodes")
        .select("*")
        .eq("category_id", categoryId)
        .is("parent_id", null)
        .order("display_order", { ascending: true });

      if (error || !data) {
        return [];
      }

      return data as Subcategory[];
    } catch {
      return [];
    }
  }
);

export async function getCategoryNodeById(categoryNodeId: number): Promise<CategoryNode | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("category_nodes")
      .select("*")
      .eq("id", categoryNodeId)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data as CategoryNode;
  } catch {
    return null;
  }
}

export async function getCategoryChildren(categoryNodeId: number): Promise<CategoryNode[]> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("category_nodes")
      .select("*")
      .eq("parent_id", categoryNodeId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as CategoryNode[];
  } catch {
    return [];
  }
}

export async function getCategoryPath(categoryNodeId: number): Promise<CategoryNode[]> {
  try {
    const supabase = await createSupabaseServerClient();

    const { data, error } = await supabase
      .from("category_nodes")
      .select("id, category_id, parent_id, name, slug, level, path, display_order, is_active, created_at, updated_at")
      .eq("category_id", (await getCategoryNodeById(categoryNodeId))?.category_id ?? 0)
      .order("level", { ascending: true })
      .order("display_order", { ascending: true });

    if (error || !data) {
      return [];
    }

    const target = data.find((node) => node.id === categoryNodeId);
    if (!target) {
      return [];
    }

    const segments = target.path.split("/");
    return data.filter((node) => segments.includes(node.slug) || node.id === categoryNodeId) as CategoryNode[];
  } catch {
    return [];
  }
}

// Alias for backward compatibility
export const getMyListings = getUserListings;

export async function getMyFavoriteListings(userId: string): Promise<ListingWithImages[]> {
  const supabase = await createSupabaseServerClient();

  const { data: favorites } = await supabase
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId);

  const ids = favorites?.map((favorite) => favorite.listing_id) ?? [];
  if (!ids.length) {
    return [];
  }

  const { data: listings } = await supabase
    .from("listings")
    .select(PUBLIC_LISTING_SELECT as string)
    .eq("status", "approved")
    .in("id", ids)
    .order("created_at", { ascending: false });

  return sanitizePublicListingBoundaries((listings as unknown as ListingWithImages[]) ?? []) as ListingWithImages[];
}

export async function getListingWithOwnerStats(listingId: string, userId: string) {
  const supabase = process.env.SUPABASE_SERVICE_ROLE_KEY ? createSupabaseAdmin() : await createSupabaseServerClient();

  // Get listing with relations
  const { data: listing, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      category:category_id(*),
      category_node:category_node_id(*),
      listing_images(id, listing_id, image_url:public_url, public_url, storage_path, is_primary, sort_order),
      listing_attributes(*),
      listing_notes(note, updated_at)
    `
    )
    .eq("id", listingId)
    .single();

  if (error || !listing) {
    return null;
  }

  // Verify ownership
  if (listing.user_id !== userId) {
    return null;
  }

  // Get view count
  const { count: viewsCount } = await supabase
    .from("listing_views")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);

  // Get favorites count
  const { count: favoritesCount } = await supabase
    .from("favorites")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);

  // Get messages count
  const { count: messagesCount } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .eq("listing_id", listingId);

  // Get recent price history
  const { data: priceHistory } = await supabase
    .from("listing_price_history")
    .select("old_price, new_price, currency, changed_at, reason")
    .eq("listing_id", listingId)
    .order("changed_at", { ascending: false })
    .limit(10);

  return {
    listing,
    stats: {
      viewsCount: viewsCount ?? 0,
      favoritesCount: favoritesCount ?? 0,
      messagesCount: messagesCount ?? 0,
    },
    priceHistory: priceHistory ?? [],
  };
}

export async function getCategoryFieldsWithOptions(categoryNodeId: number): Promise<CategoryField[]> {
  const supabase = await createSupabaseServerClient();

  const orderedBySort = await supabase
    .from("category_fields")
    .select("*")
    .eq("category_node_id", categoryNodeId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("display_order", { ascending: true });

  if (!orderedBySort.error && orderedBySort.data) {
    return orderedBySort.data as CategoryField[];
  }

  const { data, error } = await supabase
    .from("category_fields")
    .select("*")
    .eq("category_node_id", categoryNodeId)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error || !data) {
    return [];
  }

  return data as CategoryField[];
}

export async function getMyMessageThreads(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(`sender_user_id.eq.${userId},recipient_user_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(200);

  return (data as Message[]) ?? [];
}

export async function getMyOffers(userId: string) {
  const supabase = await createSupabaseServerClient();

  const { data: incoming } = await supabase
    .from("offers")
    .select("*")
    .eq("seller_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: outgoing } = await supabase
    .from("offers")
    .select("*")
    .eq("buyer_user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200);

  return {
    incoming: (incoming as Offer[]) ?? [],
    outgoing: (outgoing as Offer[]) ?? [],
  };
}

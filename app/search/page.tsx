import { CITIES } from "@/lib/constants/marketplace";
import {
  getApprovedListings,
  getCategories,
  getCategoryChildren,
  getCategoryPath,
  getCategoryNodeById,
  getCategoryNodeByPath,
  getFilterDefinitionsForNode,
  type FilterDefinition,
} from "@/lib/data/queries";
import { detectSearchIntent } from "@/lib/search/intent";
import { ListingCard } from "@/components/listing-card";

type RawSearchParams = Promise<Record<string, string | string[] | undefined>>;

function pickFirst(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

function toNumber(value?: string): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toBoolean(value?: string): boolean | undefined {
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return undefined;
}

function toOptionList(def: FilterDefinition): string[] {
  if (Array.isArray(def.options)) {
    return def.options.map((v) => String(v));
  }
  if (typeof def.options === "string") {
    try {
      const parsed = JSON.parse(def.options) as unknown;
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v));
      }
    } catch {
      return [];
    }
  }
  return [];
}

function buildUrlWithParams(params: URLSearchParams): string {
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

function buildParamsFromRecord(params: Record<string, string | undefined>): URLSearchParams {
  const next = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v) {
      next.set(k, v);
    }
  }
  return next;
}

function renderDynamicFilterInput(
  def: FilterDefinition,
  selected: string,
  options: string[]
) {
  if (def.filter_type === "boolean") {
    return (
      <select
        key={def.id}
        name={def.filter_key}
        defaultValue={selected}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="">{def.filter_label}: Any</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }

  if (def.filter_type === "select" && options.length > 0) {
    return (
      <select
        key={def.id}
        name={def.filter_key}
        defaultValue={selected}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="">{def.filter_label}: Any</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  const inputType = def.filter_type === "range" ? "number" : "text";
  return (
    <input
      key={def.id}
      name={def.filter_key}
      defaultValue={selected}
      type={inputType}
      placeholder={def.filter_label}
      className="rounded-xl border border-[var(--line)] px-3 py-2"
    />
  );
}

function FilterFields({
  params,
  categories,
  filterDefinitions,
}: {
  params: Record<string, string | undefined>;
  categories: Array<{ id: number; name: string }>;
  filterDefinitions: FilterDefinition[];
}) {
  return (
    <>
      <input
        name="q"
        defaultValue={params.q ?? ""}
        placeholder="Search listings"
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      />

      <select
        name="city"
        defaultValue={params.city ?? ""}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="">All cities</option>
        {CITIES.map((city) => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>

      <select
        name="categoryId"
        defaultValue={params.categoryId ?? ""}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        name="sort"
        defaultValue={params.sort ?? "newest"}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="newest">Newest</option>
        <option value="relevant">Relevant</option>
        <option value="price_low">Price: low to high</option>
        <option value="price_high">Price: high to low</option>
      </select>

      {filterDefinitions.map((def) => {
        const selected = params[def.filter_key] ?? "";
        const options = toOptionList(def);
        return renderDynamicFilterInput(def, selected, options);
      })}
    </>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const raw = await searchParams;
  const params = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, pickFirst(value)])
  ) as Record<string, string | undefined>;

  const categories = await getCategories();
  const intent = detectSearchIntent(params.q);

  const explicitCategoryNodeId = toNumber(params.categoryNodeId);
  const intentNode = intent ? await getCategoryNodeByPath(intent.categoryPath) : null;
  const effectiveCategoryNodeId = explicitCategoryNodeId ?? intentNode?.id ?? undefined;

  const [filterDefinitions, effectiveNode, children, parentPath] = await Promise.all([
    getFilterDefinitionsForNode(effectiveCategoryNodeId),
    effectiveCategoryNodeId ? getCategoryNodeById(effectiveCategoryNodeId) : Promise.resolve(null),
    effectiveCategoryNodeId ? getCategoryChildren(effectiveCategoryNodeId) : Promise.resolve([]),
    effectiveCategoryNodeId ? getCategoryPath(effectiveCategoryNodeId) : Promise.resolve([]),
  ]);

  const siblings = effectiveNode?.parent_id
    ? await getCategoryChildren(effectiveNode.parent_id)
    : [];

  const autoVehicleBrand = params.vehicleBrand ?? params.vehicle_brand ?? intent?.brand;
  const autoVehicleModel = params.vehicleModel ?? params.vehicle_model ?? intent?.model;
  const autoRentalType = params.rentalType ?? params.rental_type ?? intent?.rentalType;

  const listings = await getApprovedListings({
    search: params.q,
    city: params.city,
    province: params.province,
    district: params.district,
    categoryId: toNumber(params.categoryId),
    categoryNodeId: effectiveCategoryNodeId,
    categoryScope: params.scope === "exact" ? "exact" : "subtree",
    sort:
      params.sort === "price_low" ||
      params.sort === "price_high" ||
      params.sort === "nearest" ||
      params.sort === "relevant"
        ? params.sort
        : "newest",

    minPrice: toNumber(params.minPrice ?? params.min_price),
    maxPrice: toNumber(params.maxPrice ?? params.max_price),

    propertyType: params.propertyType ?? params.property_type,
    rentalType: autoRentalType,
    minMonthlyRent: toNumber(params.minMonthlyRent ?? params.min_monthly_rent),
    maxMonthlyRent: toNumber(params.maxMonthlyRent ?? params.max_monthly_rent),
    minGerawyAmount: toNumber(params.minGerawyAmount ?? params.min_gerawy_amount),
    maxGerawyAmount: toNumber(params.maxGerawyAmount ?? params.max_gerawy_amount),
    minRooms: toNumber(params.minRooms ?? params.rooms_min),
    furnished: toBoolean(params.furnished),
    ownerType: params.ownerType ?? params.owner_agent,
    dormitoryGender: params.dormitoryGender ?? params.dormitory_gender,
    maxDormitoryPrice: toNumber(params.maxDormitoryPrice ?? params.max_dormitory_price),
    minLandSize: toNumber(params.minLandSize ?? params.min_land_size),
    maxLandSize: toNumber(params.maxLandSize ?? params.max_land_size),

    vehicleType: params.vehicleType ?? params.vehicle_type,
    vehicleBrand: autoVehicleBrand,
    vehicleModel: autoVehicleModel,
    yearMin: toNumber(params.yearMin ?? params.year_min),
    yearMax: toNumber(params.yearMax ?? params.year_max),
    kmMin: toNumber(params.kmMin ?? params.km_min),
    kmMax: toNumber(params.kmMax ?? params.km_max),
    fuelType: params.fuelType ?? params.fuel_type,
    transmission: params.transmission,
    color: params.color,
    sellerType: params.sellerType ?? params.seller_type,
    warranty: params.warranty,
    exchange: toBoolean(params.exchange),
    plateStatus: params.plateStatus ?? params.plate_status,
    condition: params.condition,
    accidentStatus: params.accidentStatus ?? params.accident_status,
    oldVehicle: toBoolean(params.oldVehicle ?? params.old_vehicle),
    importedVehicle: toBoolean(params.importedVehicle ?? params.imported_vehicle),
    honda70: toBoolean(params.honda70 ?? params.honda_70),
    engineCc: params.engineCc ?? params.engine_cc,
    rickshawType: params.rickshawType ?? params.rickshaw_type,
    passengerCapacity: params.passengerCapacity ?? params.passenger_capacity,
    cargoCapacity: params.cargoCapacity ?? params.cargo_capacity,

    phoneModel: params.phoneModel ?? params.phone_model,
    storage: params.storage,
    ram: params.ram,
    batteryHealthMin: toNumber(params.batteryHealthMin ?? params.battery_health_min),
  });

  const activeEntries = Object.entries(params).filter(
    ([key, value]) =>
      Boolean(value) &&
      !["scope", "mobileFilters"].includes(key)
  );

  const activeFilterCount = activeEntries.length;
  const mobileFiltersOpen = params.mobileFilters === "1";
  const openMobileFilterParams = buildParamsFromRecord(params);
  openMobileFilterParams.set("mobileFilters", "1");
  const closeMobileFilterParams = buildParamsFromRecord(params);
  closeMobileFilterParams.delete("mobileFilters");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-8">
      <h1 className="font-display text-3xl font-bold">Smart Search</h1>
      <p className="mt-2 text-sm text-[var(--ink-2)]">
        Dynamic filters adjust to your category and keywords.
      </p>

      {intent ? (
        <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--ink-2)]">
          Intent detected: <strong>{intent.matchedRule}</strong> ({intent.confidence})
          {intent.brand ? `, brand: ${intent.brand}` : ""}
          {intent.model ? `, model: ${intent.model}` : ""}
        </p>
      ) : null}

      {parentPath.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {parentPath.map((node) => {
            const next = buildParamsFromRecord(params);
            next.set("categoryNodeId", String(node.id));
            next.set("scope", "subtree");
            return (
              <a
                key={`path-${node.id}`}
                href={buildUrlWithParams(next)}
                className="rounded-full border border-[var(--line)] bg-[var(--wash)] px-3 py-1 text-xs"
              >
                {node.name}
              </a>
            );
          })}
        </div>
      ) : null}

      {siblings.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {siblings
            .filter((node) => node.id !== effectiveNode?.id)
            .map((node) => {
              const next = buildParamsFromRecord(params);
              next.set("categoryNodeId", String(node.id));
              next.set("scope", "subtree");
              return (
                <a
                  key={`sibling-${node.id}`}
                  href={buildUrlWithParams(next)}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-xs hover:border-[var(--ink-1)]"
                >
                  Related: {node.name}
                </a>
              );
            })}
        </div>
      ) : null}

      {children.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {children.map((child) => {
            const next = buildParamsFromRecord(params);
            next.set("categoryNodeId", String(child.id));
            next.set("scope", "subtree");
            return (
              <a
                key={child.id}
                href={buildUrlWithParams(next)}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-sm hover:border-[var(--ink-1)]"
              >
                Subcategory: {child.name}
              </a>
            );
          })}
        </div>
      ) : null}

      <div className="mt-5 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden rounded-2xl border border-[var(--line)] bg-white p-4 lg:block">
          <form className="grid gap-3">
            <FilterFields params={params} categories={categories} filterDefinitions={filterDefinitions} />

            <button
              type="submit"
              className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white"
            >
              Apply Filters
            </button>

            <a
              href="/search"
              className="rounded-xl border border-[var(--line)] px-4 py-2 text-center text-sm font-semibold"
            >
              Clear All
            </a>

            {effectiveCategoryNodeId ? (
              <input type="hidden" name="categoryNodeId" value={String(effectiveCategoryNodeId)} />
            ) : null}
            <input type="hidden" name="scope" value={params.scope === "exact" ? "exact" : "subtree"} />
          </form>
        </aside>

        <section>
          <div className="mb-3 flex flex-wrap gap-2">
            {activeEntries.map(([key, value]) => {
              const next = new URLSearchParams();
              for (const [k, v] of Object.entries(params)) {
                if (v && k !== key) {
                  next.set(k, v);
                }
              }
              return (
                <a
                  key={key}
                  href={buildUrlWithParams(next)}
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs"
                >
                  {key}: {value} ×
                </a>
              );
            })}
          </div>

          {effectiveNode ? (
            <p className="mb-4 text-sm text-[var(--ink-2)]">
              Showing: {effectiveNode.name} ({params.scope === "exact" ? "exact" : "subtree"})
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>

          {listings.length === 0 ? (
            <p className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--ink-2)]">
              No listings matched these filters. Try removing one or two chips.
            </p>
          ) : null}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 lg:hidden">
        <a
          href={buildUrlWithParams(openMobileFilterParams)}
          className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl bg-[var(--ink-1)] px-4 py-3 text-sm font-semibold text-white shadow-lg"
        >
          Filters
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{activeFilterCount}</span>
        </a>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <a href={buildUrlWithParams(closeMobileFilterParams)} className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-hidden rounded-t-3xl border border-[var(--line)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <h2 className="text-sm font-semibold">Filter Listings</h2>
              <a href={buildUrlWithParams(closeMobileFilterParams)} className="text-sm text-[var(--ink-2)]">
                Close
              </a>
            </div>
            <form className="grid max-h-[80vh] gap-3 overflow-y-auto p-4 pb-24">
              <FilterFields params={params} categories={categories} filterDefinitions={filterDefinitions} />
              {effectiveCategoryNodeId ? (
                <input type="hidden" name="categoryNodeId" value={String(effectiveCategoryNodeId)} />
              ) : null}
              <input type="hidden" name="scope" value={params.scope === "exact" ? "exact" : "subtree"} />
              <div className="sticky bottom-0 -mx-4 mt-2 flex gap-2 border-t border-[var(--line)] bg-white/95 px-4 py-3 backdrop-blur">
                <a
                  href="/search"
                  className="flex-1 rounded-xl border border-[var(--line)] px-4 py-3 text-center text-sm font-semibold"
                >
                  Reset
                </a>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[var(--ink-1)] px-4 py-3 text-sm font-semibold text-white"
                >
                  Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

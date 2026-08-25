import { AFGHAN_PROVINCES, getProvinceLabel } from "@/lib/constants/marketplace";
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
import { parseSahibashAiSearch } from "@/lib/ai/search-parser";
import { detectSearchIntent } from "@/lib/search/intent";
import { resolveSearchRewriteContext } from "@/lib/search/rewrite";
import type { SearchRewriteClient } from "@/lib/search/rewrite";
import { logAiSearchParseTelemetry, logSearchTelemetry } from "@/lib/search/telemetry";
import { ListingCard } from "@/components/listing-card";
import { getDictionary } from "@/lib/i18n/server";
import { localizeCategoryName } from "@/lib/i18n/category-labels";
import { localizePath } from "@/lib/i18n/routing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { saveSearchAction } from "@/lib/actions/saved-searches";
import { createWantedRequestAction } from "@/lib/actions/liquidity";
import { wantedCopy } from "@/lib/liquidity/wanted";

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

function buildUrlWithParams(params: URLSearchParams, locale: Awaited<ReturnType<typeof getDictionary>>["locale"]): string {
  const query = params.toString();
  return localizePath(query ? `/search?${query}` : "/search", locale);
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

function SearchHiddenFields({
  params,
  exclude,
}: {
  params: Record<string, string | undefined>;
  exclude: readonly string[];
}) {
  const excluded = new Set(exclude);

  return (
    <>
      {Object.entries(params).map(([key, value]) => {
        if (!value || excluded.has(key)) return null;
        return <input key={key} type="hidden" name={key} value={value} />;
      })}
    </>
  );
}

function renderDynamicFilterInput(
  def: FilterDefinition,
  selected: string,
  options: string[],
  t: Awaited<ReturnType<typeof getDictionary>>["t"]
) {
  if (def.filter_type === "boolean") {
    return (
      <select
        key={def.id}
        name={def.filter_key}
        aria-label={def.filter_label}
        defaultValue={selected}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="">{def.filter_label}: {t.search.any}</option>
        <option value="true">{t.search.yes}</option>
        <option value="false">{t.search.no}</option>
      </select>
    );
  }

  if (def.filter_type === "select" && options.length > 0) {
    return (
      <select
        key={def.id}
        name={def.filter_key}
        aria-label={def.filter_label}
        defaultValue={selected}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="">{def.filter_label}: {t.search.any}</option>
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
      aria-label={def.filter_label}
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
  t,
  locale,
}: {
  params: Record<string, string | undefined>;
  categories: Array<{ id: number; name: string; slug: string }>;
  filterDefinitions: FilterDefinition[];
  t: Awaited<ReturnType<typeof getDictionary>>["t"];
  locale: Awaited<ReturnType<typeof getDictionary>>["locale"];
}) {
  return (
    <>
      <input
        name="q"
        aria-label={t.search.searchListings}
        defaultValue={params.q ?? ""}
        placeholder={t.search.searchListings}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      />

      <select
        name="province"
        aria-label={t.home.allAfghanistan}
        defaultValue={params.province ?? ""}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="">{t.home.allAfghanistan}</option>
        {AFGHAN_PROVINCES.map((province) => (
          <option key={province} value={province}>
            {getProvinceLabel(province, locale)}
          </option>
        ))}
      </select>

      <input
        name="district"
        aria-label={t.search.district}
        defaultValue={params.district ?? ""}
        placeholder={t.search.district}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      />

      <select
        name="categoryId"
        aria-label={t.search.allCategories}
        defaultValue={params.categoryId ?? ""}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="">{t.search.allCategories}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {localizeCategoryName({ locale, fallbackName: c.name, slug: c.slug })}
          </option>
        ))}
      </select>

      <select
        name="sort"
        aria-label={t.search.newest}
        defaultValue={params.sort ?? "newest"}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="newest">{t.search.newest}</option>
        <option value="relevant">{t.search.relevant}</option>
        <option value="price_low">{t.search.priceLowHigh}</option>
        <option value="price_high">{t.search.priceHighLow}</option>
      </select>

      <select
        name="postedWithin"
        aria-label={t.search.postedWithin}
        defaultValue={params.postedWithin ?? ""}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="">{t.search.postedWithin}: {t.search.anyTime}</option>
        <option value="24h">{t.search.last24Hours}</option>
        <option value="7d">{t.search.last7Days}</option>
        <option value="30d">{t.search.last30Days}</option>
      </select>

      <select
        name="listingType"
        aria-label={t.search.allAdTypes}
        defaultValue={params.listingType ?? ""}
        className="rounded-xl border border-[var(--line)] px-3 py-2"
      >
        <option value="">{t.search.allAdTypes}</option>
        <option value="for_sale">{t.search.forSale}</option>
        <option value="wanted">{t.search.wanted}</option>
      </select>

      {filterDefinitions.map((def) => {
        const selected = params[def.filter_key] ?? "";
        const options = toOptionList(def);
        return renderDynamicFilterInput(def, selected, options, t);
      })}
    </>
  );
}

function FindItForMePanel({
  params,
  locale,
  categoryPath,
  categoryNodeId,
}: {
  params: Record<string, string | undefined>;
  locale: Awaited<ReturnType<typeof getDictionary>>["locale"];
  categoryPath?: string | null;
  categoryNodeId?: number;
}) {
  const copy = wantedCopy(locale);
  const defaultTitle =
    params.q ||
    (locale === "fa" ? "درخواست من" : locale === "ps" ? "زما غوښتنه" : "My request");

  return (
    <form action={createWantedRequestAction} className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="params" value={buildParamsFromRecord(params).toString()} />
      {categoryNodeId ? <input type="hidden" name="categoryNodeId" value={String(categoryNodeId)} /> : null}
      {categoryPath ? <input type="hidden" name="categoryPath" value={categoryPath} /> : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-emerald-950">{copy.title}</h2>
          <p className="mt-1 max-w-2xl text-sm text-emerald-900">{copy.intro}</p>
        </div>
        <button className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white">
          {copy.button}
        </button>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
        <label className="grid gap-1 text-sm font-semibold text-emerald-950">
          {copy.name}
          <input
            name="title"
            required
            maxLength={120}
            defaultValue={defaultTitle}
            className="min-h-11 rounded-xl border border-emerald-200 bg-white px-3 text-sm text-[var(--ink-1)]"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-emerald-950">
          {copy.urgency}
          <select name="urgency" defaultValue="flexible" className="min-h-11 rounded-xl border border-emerald-200 bg-white px-3 text-sm text-[var(--ink-1)]">
            <option value="flexible">{copy.flexible}</option>
            <option value="soon">{copy.soon}</option>
            <option value="urgent">{copy.urgent}</option>
          </select>
        </label>
      </div>
      <fieldset className="mt-4 flex flex-wrap gap-3 text-sm text-emerald-950">
        <legend className="mb-2 font-semibold">{copy.channels}</legend>
        <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
          <input type="checkbox" name="channels" value="in_app" defaultChecked /> {copy.inApp}
        </label>
        <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
          <input type="checkbox" name="channels" value="email" /> {copy.email}
        </label>
        <label className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2">
          <input type="checkbox" name="channels" value="whatsapp" /> {copy.whatsapp}
        </label>
      </fieldset>
    </form>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: RawSearchParams;
}) {
  const { t, locale } = await getDictionary();
  const raw = await searchParams;
  const rawParams = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, pickFirst(value)])
  ) as Record<string, string | undefined>;
  const aiParsed = parseSahibashAiSearch(rawParams.aiQuery ?? "", locale);
  const params = aiParsed
    ? {
        ...rawParams,
        ...aiParsed.params,
      }
    : rawParams;

  const categories = await getCategories();
  const intent = detectSearchIntent(params.q);

  const explicitCategoryNodeId = toNumber(params.categoryNodeId);
  const aiIntentNode = aiParsed?.categoryPath ? await getCategoryNodeByPath(aiParsed.categoryPath) : null;
  const intentNode = intent ? await getCategoryNodeByPath(intent.categoryPath) : null;
  const effectiveCategoryNodeId = explicitCategoryNodeId ?? aiIntentNode?.id ?? intentNode?.id ?? undefined;

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
  const listingType = params.listingType ?? params.listing_type;

  const listings = await getApprovedListings({
    locale,
    search: params.q,
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
    suitableForStudents: toBoolean(params.suitableForStudents ?? params.suitable_for_students),
    genderSuitable: params.genderSuitable ?? params.gender_allowed ?? params.dormitoryGender ?? params.dormitory_gender,
    distanceToUniversityMax: toNumber(params.distanceToUniversityMax ?? params.distance_to_university_max),
    photosOnly: toBoolean(params.photosOnly ?? params.photos_only),
    minMonthlyRent: toNumber(params.minMonthlyRent ?? params.min_monthly_rent),
    maxMonthlyRent: toNumber(params.maxMonthlyRent ?? params.max_monthly_rent),
    minGerawyAmount: toNumber(params.minGerawyAmount ?? params.min_gerawy_amount),
    maxGerawyAmount: toNumber(params.maxGerawyAmount ?? params.max_gerawy_amount),
    minRooms: toNumber(params.minRooms ?? params.rooms_min),
    furnished: toBoolean(params.furnished),
    ownerType: params.ownerType ?? params.owner_agent,
    dormitoryGender: params.dormitoryGender ?? params.dormitory_gender,
    maxDormitoryPrice: toNumber(params.maxDormitoryPrice ?? params.max_dormitory_price),
    paymentPeriod: params.paymentPeriod ?? params.payment_period,
    roomType: params.roomType ?? params.room_type,
    numberOfBedsMin: toNumber(params.numberOfBedsMin ?? params.number_of_beds_min ?? params.number_of_beds ?? params.beds_min),
    internet: toBoolean(params.internet),
    water: toBoolean(params.water),
    electricity: toBoolean(params.electricity),
    mealsIncluded: toBoolean(params.mealsIncluded ?? params.meals_included),
    security: toBoolean(params.security),
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
    bodyType: params.bodyType ?? params.body_type,
    engineCapacity: params.engineCapacity ?? params.engine_capacity,
    color: params.color,
    sellerType: params.sellerType ?? params.seller_type,
    warranty: params.warranty,
    exchange: toBoolean(params.exchange),
    plateStatus: params.plateStatus ?? params.plate_status,
    customsStatus: params.customsStatus ?? params.customs_status,
    importedFrom: params.importedFrom ?? params.imported_from,
    condition: params.condition,
    accidentStatus: params.accidentStatus ?? params.accident_status,
    oldVehicle: toBoolean(params.oldVehicle ?? params.old_vehicle),
    importedVehicle: toBoolean(params.importedVehicle ?? params.imported_vehicle),
    rebuiltVehicle: toBoolean(params.rebuiltVehicle ?? params.rebuilt_vehicle),
    customVehicle: toBoolean(params.customVehicle ?? params.custom_vehicle),
    documentsAvailable: toBoolean(params.documentsAvailable ?? params.documents_available),
    engineSwapped: toBoolean(params.engineSwapped ?? params.engine_swapped),
    olderThan1980: toBoolean(params.olderThan1980 ?? params.older_than_1980),
    honda70: toBoolean(params.honda70 ?? params.honda_70),
    engineCc: params.engineCc ?? params.engine_cc,
    rickshawType: params.rickshawType ?? params.rickshaw_type,
    passengerCapacity: params.passengerCapacity ?? params.passenger_capacity,
    cargoCapacity: params.cargoCapacity ?? params.cargo_capacity,

    phoneModel: params.phoneModel ?? params.phone_model,
    storage: params.storage,
    ram: params.ram,
    batteryHealthMin: toNumber(params.batteryHealthMin ?? params.battery_health_min),
    originalRefurbished: params.originalRefurbished ?? params.original_refurbished,
    bathroomsMin: toNumber(params.bathroomsMin ?? params.bathrooms_min),
    parking: toBoolean(params.parking),
    listingType: listingType === "wanted" ? "wanted" : listingType === "for_sale" ? "for_sale" : undefined,
    postedWithin:
      params.postedWithin === "24h" || params.postedWithin === "7d" || params.postedWithin === "30d"
        ? params.postedWithin
        : undefined,
  });

  const hasSearchSignal = Boolean(
    params.q ||
    params.province ||
    params.district ||
    params.categoryId ||
    params.categoryNodeId
  );

  const rewriteContext = hasSearchSignal
    ? await (async () => {
        try {
          const supabase = await createSupabaseServerClient();
          return resolveSearchRewriteContext({
            supabase: supabase as unknown as SearchRewriteClient,
            queryText: params.q,
            categoryScope: effectiveNode?.path ?? null,
          });
        } catch {
          return {
            normalizedQuery: String(params.q ?? "").trim().toLowerCase(),
            variants: [],
            rewrittenTerms: [],
          };
        }
      })()
    : { normalizedQuery: "", variants: [], rewrittenTerms: [] };

  const telemetryId = hasSearchSignal
    ? await logSearchTelemetry({
        queryText: params.q ?? "",
        normalizedQuery: rewriteContext.normalizedQuery,
        selectedLanguage: locale,
        resultCount: listings.length,
        categoryFilter: effectiveNode?.path ?? params.categoryId ?? null,
        provinceFilter: params.province ?? null,
        districtFilter: params.district ?? null,
        rewrittenTerms: rewriteContext.rewrittenTerms,
      })
    : "";

  if (aiParsed) {
    await logAiSearchParseTelemetry({
      rawQuery: aiParsed.rawQuery,
      normalizedQuery: aiParsed.normalizedQuery,
      selectedLanguage: locale,
      interpretedFilters: aiParsed.params,
      chips: aiParsed.chips.map((chip) => ({
        key: chip.key,
        label: chip.label,
        value: chip.value,
        removeKeys: chip.removeKeys,
      })),
      resultCount: listings.length,
      parserSource: aiParsed.parserSource,
      confidence: aiParsed.confidence,
    });
  }

  const activeEntries = Object.entries(params).filter(
    ([key, value]) =>
      Boolean(value) &&
      !["scope", "mobileFilters", "aiQuery"].includes(key)
  );

  const activeFilterCount = activeEntries.length;
  const mobileFiltersOpen = params.mobileFilters === "1";
  const openMobileFilterParams = buildParamsFromRecord(params);
  openMobileFilterParams.set("mobileFilters", "1");
  const closeMobileFilterParams = buildParamsFromRecord(params);
  closeMobileFilterParams.delete("mobileFilters");
  const aiCopy = locale === "fa"
    ? {
        title: "با هوش صاحبش پیدا کن",
        subtitle: "مثلاً: «کرولا در کابل زیر ۴۰۰۰۰۰» — صاحبش آن را به فیلترهای دقیق تبدیل می‌کند.",
        placeholder: "مثلاً کرولا در کابل زیر 400000",
        button: "جستجوی هوشمند",
        interpreted: "برداشت صاحبش",
        confidence: "اعتماد",
      }
    : locale === "ps"
      ? {
          title: "له صاحبش AI سره یې پیدا کړئ",
          subtitle: "لکه: «Corolla په کابل کې تر 400000 کم» — صاحبش یې دقیقو فلټرونو ته اړوي.",
          placeholder: "لکه Corolla in Kabul under 400000",
          button: "هوښیار لټون",
          interpreted: "د صاحبش برداشت",
          confidence: "باور",
        }
      : {
          title: "Find It With Sahibash AI",
          subtitle: "Example: “a Corolla in Kabul under 400000” — Sahibash turns it into exact filters.",
          placeholder: "a Corolla in Kabul under 400000",
          button: "AI search",
          interpreted: "Sahibash understood",
          confidence: "Confidence",
        };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 pb-28 sm:px-6 lg:px-8 lg:pb-8">
      <h1 className="font-display text-3xl font-bold">{t.search.title}</h1>
      <p className="mt-2 text-sm text-[var(--ink-2)]">
        {t.search.subtitle}
      </p>

      <section className="mt-4 rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-sky-50 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-black text-indigo-950">{aiCopy.title}</p>
            <p className="mt-1 text-sm text-indigo-900">{aiCopy.subtitle}</p>
          </div>
          <form action={localizePath("/search", locale)} className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] lg:max-w-2xl">
            <label className="sr-only" htmlFor="ai-search-query">{aiCopy.title}</label>
            <input
              id="ai-search-query"
              name="aiQuery"
              defaultValue={rawParams.aiQuery ?? ""}
              placeholder={aiCopy.placeholder}
              maxLength={240}
              className="min-h-12 rounded-2xl border border-indigo-100 bg-white px-4 text-base shadow-sm"
            />
            <button className="min-h-12 rounded-2xl bg-indigo-700 px-5 text-sm font-black text-white shadow-sm hover:bg-indigo-800">
              {aiCopy.button}
            </button>
          </form>
        </div>
        {aiParsed ? (
          <div className="mt-3 rounded-2xl border border-indigo-100 bg-white p-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-slate-950">{aiCopy.interpreted}</span>
              <span>{aiCopy.confidence}: {Math.round(aiParsed.confidence * 100)}%</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {aiParsed.chips.map((chip) => {
                const next = buildParamsFromRecord(params);
                next.delete("aiQuery");
                for (const key of chip.removeKeys) next.delete(key);
                return (
                  <a
                    key={`${chip.key}-${chip.value}`}
                    href={buildUrlWithParams(next, locale)}
                    className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-950"
                  >
                    {chip.label}: {chip.value} ×
                  </a>
                );
              })}
            </div>
          </div>
        ) : null}
      </section>

      <form action={localizePath("/search", locale)} className="mt-4 rounded-2xl border border-[var(--line)] bg-white p-2 shadow-sm lg:hidden">
        <label className="sr-only" htmlFor="mobile-search-query">{t.search.searchListings}</label>
        <div className="flex gap-2">
          <input
            id="mobile-search-query"
            name="q"
            defaultValue={params.q ?? ""}
            placeholder={t.search.searchListings}
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] px-3 text-base"
          />
          <button className="min-h-12 rounded-xl bg-[var(--ink-1)] px-4 text-sm font-bold text-white">
            {t.home.searchButton}
          </button>
        </div>
        <SearchHiddenFields params={params} exclude={["q", "mobileFilters"]} />
      </form>

      {hasSearchSignal ? (
        <form action={saveSearchAction} className="mt-4 flex max-w-xl gap-2 rounded-xl border border-[var(--line)] bg-white p-2">
          <input type="hidden" name="params" value={buildParamsFromRecord(params).toString()} />
          <input name="name" required maxLength={80} defaultValue={params.q || (locale === "fa" ? "جستجوی من" : locale === "ps" ? "زما لټون" : "My search")} aria-label="Saved search name" className="min-h-11 min-w-0 flex-1 rounded-lg border border-[var(--line)] px-3 text-sm" />
          <button className="min-h-11 rounded-lg bg-[var(--ink-1)] px-4 text-sm font-semibold text-white">{locale === "fa" ? "ذخیره جستجو" : locale === "ps" ? "لټون خوندي کړئ" : "Save search"}</button>
        </form>
      ) : null}

      {intent ? (
        <p className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--wash)] px-3 py-2 text-sm text-[var(--ink-2)]">
          {t.search.intentDetected}: <strong>{intent.matchedRule}</strong> ({intent.confidence})
          {intent.brand ? `, ${t.search.brand}: ${intent.brand}` : ""}
          {intent.model ? `, ${t.search.model}: ${intent.model}` : ""}
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
                href={buildUrlWithParams(next, locale)}
                className="rounded-full border border-[var(--line)] bg-[var(--wash)] px-3 py-1 text-xs"
              >
                {localizeCategoryName({ locale, fallbackName: node.name, slug: node.slug, path: node.path })}
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
                  href={buildUrlWithParams(next, locale)}
                  className="rounded-full border border-[var(--line)] px-3 py-1 text-xs hover:border-[var(--ink-1)]"
                >
                    {t.search.related}: {localizeCategoryName({ locale, fallbackName: node.name, slug: node.slug, path: node.path })}
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
                href={buildUrlWithParams(next, locale)}
                className="rounded-full border border-[var(--line)] px-3 py-1 text-sm hover:border-[var(--ink-1)]"
              >
                {t.search.subcategory}: {localizeCategoryName({ locale, fallbackName: child.name, slug: child.slug, path: child.path })}
              </a>
            );
          })}
        </div>
      ) : null}

      <div className="mt-5 grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="hidden rounded-2xl border border-[var(--line)] bg-white p-4 lg:block">
          <form className="grid gap-3">
            <FilterFields params={params} categories={categories} filterDefinitions={filterDefinitions} t={t} locale={locale} />

            <button
              type="submit"
              className="rounded-xl bg-[var(--ink-1)] px-4 py-2 text-sm font-semibold text-white"
            >
              {t.search.applyFilters}
            </button>

            <a
              href={localizePath("/search", locale)}
              className="rounded-xl border border-[var(--line)] px-4 py-2 text-center text-sm font-semibold"
            >
              {t.search.clearAll}
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
                  href={buildUrlWithParams(next, locale)}
                  className="rounded-full border border-[var(--line)] bg-white px-3 py-1 text-xs"
                >
                  {key}: {value} ×
                </a>
              );
            })}
          </div>

          {effectiveNode ? (
            <p className="mb-4 text-sm text-[var(--ink-2)]">
              {t.search.showing}: {localizeCategoryName({ locale, fallbackName: effectiveNode.name, slug: effectiveNode.slug, path: effectiveNode.path })} ({params.scope === "exact" ? "exact" : "subtree"})
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                href={telemetryId ? localizePath(`/listings/${listing.id}?st=${telemetryId}`, locale) : undefined}
              />
            ))}
          </div>

          {hasSearchSignal && listings.length <= 2 ? (
            <FindItForMePanel
              params={params}
              locale={locale}
              categoryPath={effectiveNode?.path}
              categoryNodeId={effectiveCategoryNodeId}
            />
          ) : null}

          {listings.length === 0 ? (
            <p className="mt-6 rounded-xl border border-[var(--line)] bg-white p-4 text-sm text-[var(--ink-2)]">
              {t.search.noResults}
            </p>
          ) : null}
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-4 lg:hidden">
        <a
          href={buildUrlWithParams(openMobileFilterParams, locale)}
          className="mx-auto flex w-full max-w-7xl items-center justify-between rounded-2xl bg-[var(--ink-1)] px-4 py-3 text-sm font-semibold text-white shadow-lg"
        >
          {t.search.filters}
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">{activeFilterCount}</span>
        </a>
      </div>

      {mobileFiltersOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <a href={buildUrlWithParams(closeMobileFilterParams, locale)} className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-hidden rounded-t-3xl border border-[var(--line)] bg-white">
            <div className="flex items-center justify-between border-b border-[var(--line)] px-4 py-3">
              <h2 className="text-sm font-semibold">{t.search.filters}</h2>
              <a href={buildUrlWithParams(closeMobileFilterParams, locale)} className="text-sm text-[var(--ink-2)]">
                {t.search.close}
              </a>
            </div>
            <form className="grid max-h-[80vh] gap-3 overflow-y-auto p-4 pb-24">
                  <FilterFields params={params} categories={categories} filterDefinitions={filterDefinitions} t={t} locale={locale} />
              {effectiveCategoryNodeId ? (
                <input type="hidden" name="categoryNodeId" value={String(effectiveCategoryNodeId)} />
              ) : null}
              <input type="hidden" name="scope" value={params.scope === "exact" ? "exact" : "subtree"} />
              <div className="sticky bottom-0 -mx-4 mt-2 flex gap-2 border-t border-[var(--line)] bg-white/95 px-4 py-3 backdrop-blur">
                <a
                  href={localizePath("/search", locale)}
                  className="flex-1 rounded-xl border border-[var(--line)] px-4 py-3 text-center text-sm font-semibold"
                >
                  {t.search.reset}
                </a>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[var(--ink-1)] px-4 py-3 text-sm font-semibold text-white"
                >
                  {t.search.apply}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </main>
  );
}

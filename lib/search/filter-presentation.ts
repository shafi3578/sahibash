type FilterLike = {
  filter_key: string;
  sort_order: number;
};

const FILTER_GROUPS: Record<string, string> = {
  minPrice: "min_price",
  min_price: "min_price",
  maxPrice: "max_price",
  max_price: "max_price",
  propertyType: "property_type",
  property_type: "property_type",
  rentalType: "rental_type",
  rental_type: "rental_type",
  suitableForStudents: "suitable_for_students",
  suitable_for_students: "suitable_for_students",
  genderSuitable: "gender_suitable",
  gender_allowed: "gender_suitable",
  dormitoryGender: "gender_suitable",
  dormitory_gender: "gender_suitable",
  distanceToUniversityMax: "distance_to_university_max",
  distance_to_university_max: "distance_to_university_max",
  photosOnly: "photos_only",
  photos_only: "photos_only",
  minMonthlyRent: "min_monthly_rent",
  min_monthly_rent: "min_monthly_rent",
  maxMonthlyRent: "max_monthly_rent",
  max_monthly_rent: "max_monthly_rent",
  minGerawyAmount: "min_gerawy_amount",
  min_gerawy_amount: "min_gerawy_amount",
  maxGerawyAmount: "max_gerawy_amount",
  max_gerawy_amount: "max_gerawy_amount",
  minRooms: "rooms_min",
  rooms_min: "rooms_min",
  furnished: "furnished",
  ownerType: "owner_type",
  owner_agent: "owner_type",
  maxDormitoryPrice: "max_dormitory_price",
  max_dormitory_price: "max_dormitory_price",
  paymentPeriod: "payment_period",
  payment_period: "payment_period",
  roomType: "room_type",
  room_type: "room_type",
  numberOfBedsMin: "number_of_beds_min",
  number_of_beds_min: "number_of_beds_min",
  number_of_beds: "number_of_beds_min",
  beds_min: "number_of_beds_min",
  internet: "internet",
  water: "water",
  electricity: "electricity",
  mealsIncluded: "meals_included",
  meals_included: "meals_included",
  security: "security",
  minLandSize: "min_land_size",
  min_land_size: "min_land_size",
  maxLandSize: "max_land_size",
  max_land_size: "max_land_size",
  bathroomsMin: "bathrooms_min",
  bathrooms_min: "bathrooms_min",
  parking: "parking",
  vehicleType: "vehicle_type",
  vehicle_type: "vehicle_type",
  vehicleBrand: "vehicle_brand",
  vehicle_brand: "vehicle_brand",
  vehicleModel: "vehicle_model",
  vehicle_model: "vehicle_model",
  yearMin: "year_min",
  year_min: "year_min",
  yearMax: "year_max",
  year_max: "year_max",
  kmMin: "km_min",
  km_min: "km_min",
  kmMax: "km_max",
  km_max: "km_max",
  fuelType: "fuel_type",
  fuel_type: "fuel_type",
  transmission: "transmission",
  bodyType: "body_type",
  body_type: "body_type",
  engineCapacity: "engine_capacity",
  engine_capacity: "engine_capacity",
  color: "color",
  sellerType: "seller_type",
  seller_type: "seller_type",
  warranty: "warranty",
  exchange: "exchange",
  plateStatus: "plate_status",
  plate_status: "plate_status",
  customsStatus: "customs_status",
  customs_status: "customs_status",
  importedFrom: "imported_from",
  imported_from: "imported_from",
  condition: "condition",
  accidentStatus: "accident_status",
  accident_status: "accident_status",
  oldVehicle: "old_vehicle",
  old_vehicle: "old_vehicle",
  importedVehicle: "imported_vehicle",
  imported_vehicle: "imported_vehicle",
  rebuiltVehicle: "rebuilt_vehicle",
  rebuilt_vehicle: "rebuilt_vehicle",
  customVehicle: "custom_vehicle",
  custom_vehicle: "custom_vehicle",
  documentsAvailable: "documents_available",
  documents_available: "documents_available",
  engineSwapped: "engine_swapped",
  engine_swapped: "engine_swapped",
  olderThan1980: "older_than_1980",
  older_than_1980: "older_than_1980",
  honda70: "honda_70",
  honda_70: "honda_70",
  engineCc: "engine_cc",
  engine_cc: "engine_cc",
  rickshawType: "rickshaw_type",
  rickshaw_type: "rickshaw_type",
  passengerCapacity: "passenger_capacity",
  passenger_capacity: "passenger_capacity",
  cargoCapacity: "cargo_capacity",
  cargo_capacity: "cargo_capacity",
  phoneModel: "phone_model",
  phone_model: "phone_model",
  storage: "storage",
  ram: "ram",
  batteryHealthMin: "battery_health_min",
  battery_health_min: "battery_health_min",
  originalRefurbished: "original_refurbished",
  original_refurbished: "original_refurbished",
};

const PRIMARY_FILTER_ORDER = [
  "min_price",
  "max_price",
  "vehicle_brand",
  "vehicle_model",
  "year_min",
  "year_max",
  "condition",
  "fuel_type",
  "property_type",
  "rental_type",
  "rooms_min",
  "furnished",
  "min_land_size",
  "max_land_size",
  "phone_model",
  "storage",
  "ram",
  "km_min",
  "km_max",
] as const;

const PRIMARY_LIMIT = 8;

function getFilterGroup(filterKey: string) {
  return FILTER_GROUPS[filterKey];
}

export function getFilterSelectedValue(
  filterKey: string,
  params: Record<string, string | undefined>,
) {
  if (params[filterKey]) return params[filterKey] ?? "";

  const group = getFilterGroup(filterKey);
  if (!group) return "";

  for (const [candidateKey, candidateGroup] of Object.entries(FILTER_GROUPS)) {
    if (candidateGroup === group && params[candidateKey]) return params[candidateKey] ?? "";
  }

  return "";
}

export function organizeFilterDefinitions<T extends FilterLike>(
  definitions: T[],
  params: Record<string, string | undefined>,
) {
  const byGroup = new Map<string, T>();
  for (const definition of definitions) {
    const group = getFilterGroup(definition.filter_key);
    if (!group) continue;

    const existing = byGroup.get(group);
    if (existing && getFilterSelectedValue(existing.filter_key, params)) continue;
    if (existing && !params[definition.filter_key]) continue;
    byGroup.set(group, definition);
  }

  const priority = new Map<string, number>(PRIMARY_FILTER_ORDER.map((group, index) => [group, index]));
  const supported = Array.from(byGroup.entries()).sort(([groupA, a], [groupB, b]) => {
    const priorityA = priority.get(groupA) ?? Number.MAX_SAFE_INTEGER;
    const priorityB = priority.get(groupB) ?? Number.MAX_SAFE_INTEGER;
    if (priorityA !== priorityB) return priorityA - priorityB;
    return a.sort_order - b.sort_order;
  });
  const primaryGroups = new Set(supported.slice(0, PRIMARY_LIMIT).map(([group]) => group));
  const primary: T[] = [];
  const advanced: T[] = [];

  for (const [group, definition] of supported) {
    if (primaryGroups.has(group)) primary.push(definition);
    else advanced.push(definition);
  }

  return {
    primary,
    advanced,
    advancedHasSelection: advanced.some((definition) => Boolean(getFilterSelectedValue(definition.filter_key, params))),
  };
}

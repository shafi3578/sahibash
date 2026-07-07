export type VehicleBranchKey =
  | "cars"
  | "motorcycles"
  | "rickshaw"
  | "bicycles"
  | "pickup"
  | "vansMinibuses"
  | "heavyTrucks"
  | "agricultural"
  | "parts"
  | "damaged"
  | "otherVehicles";

export type VehicleOption = {
  slug: string;
  name: string;
  aliases?: string[];
};

export type VehicleVariantCatalog = VehicleOption;

export type VehicleModelCatalog = VehicleOption & {
  variants?: VehicleVariantCatalog[];
};

export type VehicleBrandCatalog = VehicleOption & {
  models?: VehicleModelCatalog[];
};

export type VehicleMode = "required" | "optional" | "none";

export type VehicleBranchDefinition = {
  key: VehicleBranchKey;
  label: string;
  vehicleTypeValue: string;
  pathMatchers: string[];
  subtypeLabel?: string;
  subtypeMode: VehicleMode;
  subtypeOptions?: VehicleOption[];
  brandMode: VehicleMode;
  modelMode: VehicleMode;
  variantMode: VehicleMode;
  supportsOtherBrand?: boolean;
  supportsOtherModel?: boolean;
};

export const OTHER_BRAND_OPTION: VehicleOption = {
  slug: "other-brand",
  name: "Other Brand",
  aliases: ["other brand", "unknown brand"],
};

export const OTHER_MODEL_OPTION: VehicleOption = {
  slug: "other-model",
  name: "Other Model",
  aliases: ["other model", "unknown model"],
};

export const VEHICLE_BRANCH_DEFINITIONS: VehicleBranchDefinition[] = [
  {
    key: "cars",
    label: "Cars",
    vehicleTypeValue: "Cars",
    pathMatchers: ["vehicles/cars"],
    subtypeMode: "none",
    brandMode: "required",
    modelMode: "required",
    variantMode: "optional",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
  {
    key: "motorcycles",
    label: "Motorcycles",
    vehicleTypeValue: "Motorcycles",
    pathMatchers: ["vehicles/motorcycles"],
    subtypeMode: "none",
    brandMode: "required",
    modelMode: "required",
    variantMode: "optional",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
  {
    key: "rickshaw",
    label: "Rickshaw / Three-wheel",
    vehicleTypeValue: "Rickshaw / Three-wheel",
    pathMatchers: ["vehicles/rickshaws-three-wheelers", "vehicles/rickshaws"],
    subtypeLabel: "Rickshaw Type",
    subtypeMode: "required",
    subtypeOptions: [
      { slug: "passenger-rickshaw", name: "Passenger Rickshaw", aliases: ["passenger rickshaw", "rickshaw"] },
      { slug: "cargo-rickshaw", name: "Cargo Rickshaw", aliases: ["cargo rickshaw"] },
      { slug: "motorcycle-rickshaw", name: "Motorcycle Rickshaw", aliases: ["motorcycle rickshaw"] },
      { slug: "electric-rickshaw", name: "Electric Rickshaw", aliases: ["electric rickshaw"] },
      { slug: "zaranj", name: "Zaranj", aliases: ["zaranj", "zarang", "زرنج", "زرانج"] },
      { slug: "other-three-wheel", name: "Other Three-wheel", aliases: ["other three wheel"] },
    ],
    brandMode: "optional",
    modelMode: "optional",
    variantMode: "none",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
  {
    key: "bicycles",
    label: "Bicycles",
    vehicleTypeValue: "Bicycles",
    pathMatchers: ["vehicles/bicycles"],
    subtypeLabel: "Bicycle Type",
    subtypeMode: "required",
    subtypeOptions: [
      { slug: "mountain-bike", name: "Mountain Bike", aliases: ["mountain bike"] },
      { slug: "road-bike", name: "Road Bike", aliases: ["road bike"] },
      { slug: "city-bike", name: "City Bike", aliases: ["city bike"] },
      { slug: "kids-bicycle", name: "Kids Bicycle", aliases: ["kids bicycle"] },
      { slug: "electric-bicycle", name: "Electric Bicycle", aliases: ["electric bicycle", "e-bike"] },
      { slug: "cargo-bicycle", name: "Cargo Bicycle", aliases: ["cargo bicycle"] },
      { slug: "sports-bicycle", name: "Sports Bicycle", aliases: ["sports bicycle"] },
      { slug: "other-bicycle", name: "Other Bicycle", aliases: ["other bicycle"] },
    ],
    brandMode: "optional",
    modelMode: "optional",
    variantMode: "none",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
  {
    key: "pickup",
    label: "Pickup",
    vehicleTypeValue: "Pickup",
    pathMatchers: ["vehicles/pickup-trucks"],
    subtypeMode: "none",
    brandMode: "required",
    modelMode: "required",
    variantMode: "optional",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
  {
    key: "vansMinibuses",
    label: "Van / Minibus",
    vehicleTypeValue: "Van / Minibus",
    pathMatchers: ["vehicles/vans-minibuses", "vehicles/vans"],
    subtypeMode: "none",
    brandMode: "required",
    modelMode: "required",
    variantMode: "optional",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
  {
    key: "heavyTrucks",
    label: "Trucks / Heavy Vehicles",
    vehicleTypeValue: "Trucks / Heavy Vehicles",
    pathMatchers: ["vehicles/trucks-heavy-vehicles", "vehicles/trucks"],
    subtypeLabel: "Heavy Vehicle Body Type",
    subtypeMode: "optional",
    subtypeOptions: [
      { slug: "dump-truck", name: "Dump Truck" },
      { slug: "cargo-truck", name: "Cargo Truck" },
      { slug: "container-truck", name: "Container Truck" },
      { slug: "tanker", name: "Tanker" },
      { slug: "crane-truck", name: "Crane Truck" },
      { slug: "mixer-truck", name: "Mixer Truck" },
      { slug: "tow-truck", name: "Tow Truck" },
      { slug: "trailer", name: "Trailer" },
      { slug: "bus", name: "Bus" },
      { slug: "other-heavy-vehicle", name: "Other Heavy Vehicle" },
    ],
    brandMode: "required",
    modelMode: "required",
    variantMode: "optional",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
  {
    key: "agricultural",
    label: "Agricultural Vehicles",
    vehicleTypeValue: "Agricultural Vehicles",
    pathMatchers: ["vehicles/agricultural-vehicles"],
    subtypeLabel: "Agricultural Vehicle Type",
    subtypeMode: "required",
    subtypeOptions: [
      { slug: "tractor", name: "Tractor" },
      { slug: "small-tractor", name: "Small Tractor" },
      { slug: "combine-harvester", name: "Combine Harvester" },
      { slug: "cultivator", name: "Cultivator" },
      { slug: "tiller", name: "Tiller" },
      { slug: "water-tanker", name: "Water Tanker" },
      { slug: "farm-trailer", name: "Farm Trailer" },
      { slug: "other-agricultural-vehicle", name: "Other Agricultural Vehicle" },
    ],
    brandMode: "required",
    modelMode: "optional",
    variantMode: "none",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
  {
    key: "parts",
    label: "Vehicle Parts & Accessories",
    vehicleTypeValue: "Vehicle Parts & Accessories",
    pathMatchers: ["vehicles/vehicle-parts-accessories", "vehicles/vehicle-parts", "vehicles/spare-parts", "vehicles/auto-parts", "vehicles/tires-wheels"],
    subtypeLabel: "Part Type",
    subtypeMode: "required",
    subtypeOptions: [
      { slug: "car-parts", name: "Car Parts" },
      { slug: "motorcycle-parts", name: "Motorcycle Parts" },
      { slug: "truck-parts", name: "Truck Parts" },
      { slug: "tires-wheels", name: "Tires & Wheels" },
      { slug: "engine-parts", name: "Engine Parts" },
      { slug: "gearbox-transmission", name: "Gearbox / Transmission" },
      { slug: "battery", name: "Battery" },
      { slug: "lights", name: "Lights" },
      { slug: "mirrors", name: "Mirrors" },
      { slug: "doors", name: "Doors" },
      { slug: "bumpers", name: "Bumpers" },
      { slug: "seats", name: "Seats" },
      { slug: "audio-screen", name: "Audio / Screen" },
      { slug: "gps-camera", name: "GPS / Camera" },
      { slug: "oil-fluids", name: "Oil / Fluids" },
      { slug: "tools", name: "Tools" },
      { slug: "helmets", name: "Helmets" },
      { slug: "motorcycle-accessories", name: "Motorcycle Accessories" },
      { slug: "other-parts", name: "Other Parts" },
    ],
    brandMode: "optional",
    modelMode: "optional",
    variantMode: "none",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
  {
    key: "damaged",
    label: "Damaged / For Parts",
    vehicleTypeValue: "Damaged / For Parts",
    pathMatchers: ["vehicles/damaged-vehicles-for-parts"],
    subtypeLabel: "Damage Type",
    subtypeMode: "required",
    subtypeOptions: [
      { slug: "damaged-car", name: "Damaged Car" },
      { slug: "damaged-motorcycle", name: "Damaged Motorcycle" },
      { slug: "damaged-truck", name: "Damaged Truck" },
      { slug: "burned-vehicle", name: "Burned Vehicle" },
      { slug: "accident-vehicle", name: "Accident Vehicle" },
      { slug: "engine-problem", name: "Engine Problem" },
      { slug: "no-documents", name: "No Documents" },
      { slug: "for-parts-only", name: "For Parts Only" },
      { slug: "other-damaged-vehicle", name: "Other Damaged Vehicle" },
    ],
    brandMode: "optional",
    modelMode: "optional",
    variantMode: "none",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
  {
    key: "otherVehicles",
    label: "Other Vehicles",
    vehicleTypeValue: "Other Vehicles",
    pathMatchers: ["vehicles/other-vehicles"],
    subtypeMode: "none",
    brandMode: "required",
    modelMode: "required",
    variantMode: "none",
    supportsOtherBrand: true,
    supportsOtherModel: true,
  },
];

export const VEHICLE_LOCKED_SPEC_LABELS: Record<string, string> = {
  make: "Brand",
  model: "Model",
  variant: "Variant / Generation",
  body_category: "Body Category",
  vehicle_type: "Vehicle Type",
  vehicle_subtype: "Vehicle Subtype",
};

export type VehicleModel3D = {
  id: string;
  label: string;
  src: string;
  matchNote: string;
};

export const VEHICLE_MODELS_3D: readonly VehicleModel3D[] = [
  { id: "corolla-fielder-2005", label: "Toyota Corolla Fielder 2005", src: "/models/vehicles/toyota-corolla-fielder-2005.glb", matchNote: "Corolla Fielder" },
  { id: "4runner-2015", label: "Toyota 4Runner 2015", src: "/models/vehicles/toyota-4runner-2015.glb", matchNote: "4Runner" },
  { id: "land-cruiser-300-2022", label: "Toyota Land Cruiser 300 2022", src: "/models/vehicles/toyota-land-cruiser-300-2022.glb", matchNote: "Land Cruiser 300" },
  { id: "auris-wagon", label: "Toyota Auris Wagon", src: "/models/vehicles/toyota-auris-wagon.glb", matchNote: "Auris Wagon" },
  { id: "corolla-1995", label: "Toyota Corolla 1995", src: "/models/vehicles/toyota-corolla-1995.glb", matchNote: "Corolla (classic)" },
  { id: "corolla-2020", label: "Toyota Corolla 2020", src: "/models/vehicles/toyota-corolla-2020.glb", matchNote: "Corolla (modern)" },
] as const;

function normalized(value: string | number | null | undefined) {
  return String(value ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function selectVehicleModel3D(input: {
  make?: string | null;
  model?: string | null;
  year?: string | number | null;
  title?: string | null;
}): VehicleModel3D | null {
  const make = normalized(input.make);
  const model = normalized(input.model);
  const title = normalized(input.title);
  const combined = `${make} ${model} ${title}`.trim();
  const year = Number.parseInt(String(input.year ?? ""), 10);

  if (!combined) return null;
  if (combined.includes("fielder")) return VEHICLE_MODELS_3D[0];
  if (combined.includes("4runner") || combined.includes("4 runner")) return VEHICLE_MODELS_3D[1];
  if (combined.includes("land cruiser") || combined.includes("lc300") || model === "300") return VEHICLE_MODELS_3D[2];
  if (combined.includes("auris")) return VEHICLE_MODELS_3D[3];
  if (combined.includes("corolla") || combined.includes("corola")) {
    return Number.isFinite(year) && year >= 1950 && year < 2010 ? VEHICLE_MODELS_3D[4] : VEHICLE_MODELS_3D[5];
  }
  return null;
}

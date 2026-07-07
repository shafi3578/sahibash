import type { VehicleBrandCatalog } from "./vehicleFields";

export const VAN_MINIBUS_BRANDS: VehicleBrandCatalog[] = [
  {
    slug: "toyota",
    name: "Toyota",
    models: [
      { slug: "hiace", name: "HiAce" },
      { slug: "voxy", name: "Voxy" },
      { slug: "noah", name: "Noah" },
      { slug: "sienna", name: "Sienna" },
    ],
  },
  {
    slug: "nissan",
    name: "Nissan",
    models: [
      { slug: "serena", name: "Serena" },
      { slug: "caravan", name: "Caravan" },
    ],
  },
  {
    slug: "hyundai",
    name: "Hyundai",
    models: [
      { slug: "starex", name: "Starex" },
      { slug: "h100", name: "H100" },
    ],
  },
  {
    slug: "mercedes-benz",
    name: "Mercedes-Benz",
    models: [
      { slug: "sprinter", name: "Sprinter" },
      { slug: "vito", name: "Vito" },
    ],
  },
  {
    slug: "mazda",
    name: "Mazda",
    models: [{ slug: "bongo", name: "Bongo" }],
  },
];

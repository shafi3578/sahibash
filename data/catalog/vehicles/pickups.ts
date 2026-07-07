import type { VehicleBrandCatalog } from "./vehicleFields";

export const PICKUP_BRANDS: VehicleBrandCatalog[] = [
  {
    slug: "toyota",
    name: "Toyota",
    models: [
      { slug: "hilux", name: "Hilux", aliases: ["hilux", "helix", "هایلکس"] },
      { slug: "pickup", name: "Pickup" },
      { slug: "land-cruiser-pickup", name: "Land Cruiser Pickup" },
    ],
  },
  {
    slug: "nissan",
    name: "Nissan",
    models: [
      { slug: "navara", name: "Navara" },
      { slug: "datsun-pickup", name: "Datsun Pickup" },
      { slug: "nissan-pickup", name: "Nissan Pickup" },
    ],
  },
  {
    slug: "ford",
    name: "Ford",
    models: [
      { slug: "ranger", name: "Ranger" },
      { slug: "f-150", name: "F-150" },
    ],
  },
  {
    slug: "mitsubishi",
    name: "Mitsubishi",
    models: [{ slug: "l200", name: "L200" }],
  },
  {
    slug: "mazda",
    name: "Mazda",
    models: [
      { slug: "b-series", name: "B-Series" },
      { slug: "bt-50", name: "BT-50" },
    ],
  },
];

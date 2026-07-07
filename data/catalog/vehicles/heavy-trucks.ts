import type { VehicleBrandCatalog } from "./vehicleFields";

export const HEAVY_TRUCK_BRANDS: VehicleBrandCatalog[] = [
  {
    slug: "mazda",
    name: "Mazda",
    models: [{ slug: "titan", name: "Titan", aliases: ["mazda titan", "titan truck"] }],
  },
  {
    slug: "isuzu",
    name: "Isuzu",
    models: [
      { slug: "elf", name: "Elf" },
      { slug: "forward", name: "Forward" },
      { slug: "giga", name: "Giga" },
    ],
  },
  {
    slug: "hino",
    name: "Hino",
    models: [
      { slug: "dutro", name: "Dutro" },
      { slug: "ranger", name: "Ranger" },
      { slug: "profia", name: "Profia" },
    ],
  },
  {
    slug: "mitsubishi-fuso",
    name: "Mitsubishi Fuso",
    models: [
      { slug: "canter", name: "Canter" },
      { slug: "fighter", name: "Fighter" },
      { slug: "super-great", name: "Super Great" },
    ],
  },
  {
    slug: "mercedes-benz",
    name: "Mercedes-Benz",
    models: [
      { slug: "actros", name: "Actros" },
      { slug: "atego", name: "Atego" },
    ],
  },
  {
    slug: "volvo",
    name: "Volvo",
    models: [
      { slug: "fh", name: "FH" },
      { slug: "fm", name: "FM" },
    ],
  },
  {
    slug: "man",
    name: "MAN",
    models: [{ slug: "other-man-truck", name: "Other MAN Truck" }],
  },
];

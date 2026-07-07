import type { VehicleBrandCatalog } from "./vehicleFields";

export const MOTORCYCLE_BRANDS: VehicleBrandCatalog[] = [
  {
    slug: "honda",
    name: "Honda",
    aliases: ["honda", "هوندا"],
    models: [
      { slug: "cg125", name: "CG125", aliases: ["honda cg125", "cg125", "cg 125", "honda 125", "هوندا ۱۲۵", "هوندا سي جي"] },
      { slug: "cd70", name: "CD70", aliases: ["honda cd70", "honda 70", "cd70", "cd 70"] },
      { slug: "cb125", name: "CB125" },
      { slug: "cb150", name: "CB150" },
      { slug: "pridor", name: "Pridor" },
    ],
  },
  {
    slug: "yamaha",
    name: "Yamaha",
    aliases: ["yamaha", "یاماها"],
    models: [
      { slug: "ybr-125", name: "YBR 125", aliases: ["ybr", "ybr125", "yamaha ybr", "یاماها وای بی آر", "یاماها ۱۲۵"] },
      { slug: "ybr-125g", name: "YBR 125G" },
      { slug: "yamaha-125", name: "Yamaha 125" },
      { slug: "fazer", name: "Fazer" },
    ],
  },
  {
    slug: "bajaj",
    name: "Bajaj",
    models: [
      { slug: "pulsar", name: "Pulsar" },
      { slug: "boxer", name: "Boxer" },
      { slug: "discover", name: "Discover" },
      { slug: "avenger", name: "Avenger" },
    ],
  },
  {
    slug: "suzuki",
    name: "Suzuki",
    models: [
      { slug: "gs-150", name: "GS 150" },
      { slug: "gd-110", name: "GD 110" },
    ],
  },
  {
    slug: "bera",
    name: "Bera",
    models: [
      { slug: "bera-cg125", name: "CG125" },
      { slug: "bera-cg150", name: "CG150" },
    ],
  },
  {
    slug: "royal-enfield",
    name: "Royal Enfield",
    models: [
      { slug: "classic-350", name: "Classic 350" },
      { slug: "bullet", name: "Bullet" },
      { slug: "himalayan", name: "Himalayan" },
    ],
  },
  {
    slug: "harley-davidson",
    name: "Harley-Davidson",
    models: [{ slug: "other-harley-davidson", name: "Other Harley-Davidson" }],
  },
  {
    slug: "ducati",
    name: "Ducati",
    models: [{ slug: "other-ducati", name: "Other Ducati" }],
  },
  {
    slug: "chinese-motorcycle",
    name: "Chinese Motorcycle",
    models: [
      { slug: "cg125-type", name: "CG125 Type" },
      { slug: "cg150-type", name: "CG150 Type" },
      { slug: "electric-motorcycle", name: "Electric Motorcycle" },
      { slug: "scooter", name: "Scooter" },
      { slug: "other-chinese-motorcycle", name: "Other Chinese Motorcycle" },
    ],
  },
  {
    slug: "electric-motorcycle",
    name: "Electric Motorcycle",
    models: [
      { slug: "electric-scooter", name: "Electric Scooter" },
      { slug: "electric-bike", name: "Electric Bike" },
      { slug: "electric-cargo-motorcycle", name: "Electric Cargo Motorcycle" },
      { slug: "other-electric-motorcycle", name: "Other Electric Motorcycle" },
    ],
  },
];

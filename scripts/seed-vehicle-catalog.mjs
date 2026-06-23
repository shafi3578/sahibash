import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function readEnvValue(text, key) {
  const line = text.split(/\r?\n/).find((l) => l.trim().startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : "";
}

// ─── catalog definition ─────────────────────────────────────────────────────

const CATALOG = [
  {
    brand: "Toyota", slug: "toyota",
    models: [
      {
        name: "Corolla", slug: "corolla", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2019-2022", slug: "2019-2022", year_start: 2019, year_end: 2022,
            variants: [
              { name: "1.6 Petrol Manual",  slug: "1-6-petrol-manual",  fuel_type: "Petrol",  transmission: "Manual",    engine_size: "1.6L", drive_type: "FWD" },
              { name: "1.6 Petrol Auto",    slug: "1-6-petrol-auto",    fuel_type: "Petrol",  transmission: "Automatic", engine_size: "1.6L", drive_type: "FWD" },
              { name: "1.8 Hybrid",         slug: "1-8-hybrid",         fuel_type: "Hybrid",  transmission: "CVT",       engine_size: "1.8L", drive_type: "FWD" },
            ],
          },
          {
            name: "2014-2018", slug: "2014-2018", year_start: 2014, year_end: 2018,
            variants: [
              { name: "1.6 Petrol Manual",  slug: "1-6-petrol-manual",  fuel_type: "Petrol",  transmission: "Manual",    engine_size: "1.6L", drive_type: "FWD" },
              { name: "1.6 Petrol Auto",    slug: "1-6-petrol-auto",    fuel_type: "Petrol",  transmission: "Automatic", engine_size: "1.6L", drive_type: "FWD" },
            ],
          },
        ],
      },
      {
        name: "Camry", slug: "camry", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2018-2023", slug: "2018-2023", year_start: 2018, year_end: 2023,
            variants: [
              { name: "2.5 Petrol",  slug: "2-5-petrol",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.5L", drive_type: "FWD" },
              { name: "2.5 Hybrid",  slug: "2-5-hybrid",  fuel_type: "Hybrid",  transmission: "CVT",       engine_size: "2.5L", drive_type: "FWD" },
            ],
          },
        ],
      },
      {
        name: "Land Cruiser", slug: "land-cruiser", body_type: "SUV", doors: 4, seats: 7,
        generations: [
          {
            name: "2016-2021", slug: "2016-2021", year_start: 2016, year_end: 2021,
            variants: [
              { name: "4.0 V6 Petrol",    slug: "4-0-v6-petrol",    fuel_type: "Petrol",  transmission: "Automatic", engine_size: "4.0L", drive_type: "4WD" },
              { name: "4.5 V8 Diesel",    slug: "4-5-v8-diesel",    fuel_type: "Diesel",  transmission: "Automatic", engine_size: "4.5L", drive_type: "4WD" },
            ],
          },
        ],
      },
      {
        name: "Prado", slug: "prado", body_type: "SUV", doors: 4, seats: 7,
        generations: [
          {
            name: "2018-2023", slug: "2018-2023", year_start: 2018, year_end: 2023,
            variants: [
              { name: "2.7 Petrol Auto",  slug: "2-7-petrol-auto",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.7L", drive_type: "4WD" },
              { name: "3.0 Diesel Auto",  slug: "3-0-diesel-auto",  fuel_type: "Diesel",  transmission: "Automatic", engine_size: "3.0L", drive_type: "4WD" },
            ],
          },
        ],
      },
      {
        name: "Yaris", slug: "yaris", body_type: "Hatchback", doors: 4, seats: 5,
        generations: [
          {
            name: "2019-2023", slug: "2019-2023", year_start: 2019, year_end: 2023,
            variants: [
              { name: "1.5 Petrol Manual",  slug: "1-5-petrol-manual",  fuel_type: "Petrol",  transmission: "Manual",    engine_size: "1.5L", drive_type: "FWD" },
              { name: "1.5 Petrol Auto",    slug: "1-5-petrol-auto",    fuel_type: "Petrol",  transmission: "Automatic", engine_size: "1.5L", drive_type: "FWD" },
            ],
          },
        ],
      },
      {
        name: "Hilux", slug: "hilux", body_type: "Pickup", doors: 4, seats: 5,
        generations: [
          {
            name: "2016-2023", slug: "2016-2023", year_start: 2016, year_end: 2023,
            variants: [
              { name: "2.4 Diesel Manual",  slug: "2-4-diesel-manual",  fuel_type: "Diesel",  transmission: "Manual",    engine_size: "2.4L", drive_type: "4WD" },
              { name: "2.8 Diesel Auto",    slug: "2-8-diesel-auto",    fuel_type: "Diesel",  transmission: "Automatic", engine_size: "2.8L", drive_type: "4WD" },
            ],
          },
        ],
      },
      {
        name: "RAV4", slug: "rav4", body_type: "SUV", doors: 4, seats: 5,
        generations: [
          {
            name: "2019-2023", slug: "2019-2023", year_start: 2019, year_end: 2023,
            variants: [
              { name: "2.0 Petrol",   slug: "2-0-petrol",   fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "AWD" },
              { name: "2.5 Hybrid",   slug: "2-5-hybrid",   fuel_type: "Hybrid",  transmission: "CVT",       engine_size: "2.5L", drive_type: "AWD" },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Honda", slug: "honda",
    models: [
      {
        name: "Civic", slug: "civic", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2022-2025", slug: "2022-2025", year_start: 2022, year_end: 2025,
            variants: [
              { name: "1.5 Turbo",   slug: "1-5-turbo",   fuel_type: "Petrol",  transmission: "CVT",       engine_size: "1.5L", drive_type: "FWD" },
              { name: "2.0 Petrol",  slug: "2-0-petrol",  fuel_type: "Petrol",  transmission: "CVT",       engine_size: "2.0L", drive_type: "FWD" },
            ],
          },
          {
            name: "2017-2021", slug: "2017-2021", year_start: 2017, year_end: 2021,
            variants: [
              { name: "1.5 Turbo",   slug: "1-5-turbo",   fuel_type: "Petrol",  transmission: "CVT",       engine_size: "1.5L", drive_type: "FWD" },
              { name: "2.0 Petrol",  slug: "2-0-petrol",  fuel_type: "Petrol",  transmission: "CVT",       engine_size: "2.0L", drive_type: "FWD" },
            ],
          },
        ],
      },
      {
        name: "Accord", slug: "accord", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2018-2022", slug: "2018-2022", year_start: 2018, year_end: 2022,
            variants: [
              { name: "1.5 Turbo",   slug: "1-5-turbo",   fuel_type: "Petrol",  transmission: "CVT",       engine_size: "1.5L", drive_type: "FWD" },
              { name: "2.0 Turbo",   slug: "2-0-turbo",   fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "FWD" },
            ],
          },
        ],
      },
      {
        name: "CR-V", slug: "cr-v", body_type: "SUV", doors: 4, seats: 5,
        generations: [
          {
            name: "2017-2022", slug: "2017-2022", year_start: 2017, year_end: 2022,
            variants: [
              { name: "1.5 Turbo",   slug: "1-5-turbo",   fuel_type: "Petrol",  transmission: "CVT",       engine_size: "1.5L", drive_type: "AWD" },
              { name: "2.0 Hybrid",  slug: "2-0-hybrid",  fuel_type: "Hybrid",  transmission: "Automatic", engine_size: "2.0L", drive_type: "AWD" },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Hyundai", slug: "hyundai",
    models: [
      {
        name: "Elantra", slug: "elantra", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2021-2025", slug: "2021-2025", year_start: 2021, year_end: 2025,
            variants: [
              { name: "1.6 Petrol",  slug: "1-6-petrol",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "1.6L", drive_type: "FWD" },
              { name: "2.0 Petrol",  slug: "2-0-petrol",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "FWD" },
            ],
          },
        ],
      },
      {
        name: "Sonata", slug: "sonata", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2020-2024", slug: "2020-2024", year_start: 2020, year_end: 2024,
            variants: [
              { name: "2.5 Petrol",  slug: "2-5-petrol",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.5L", drive_type: "FWD" },
            ],
          },
        ],
      },
      {
        name: "Tucson", slug: "tucson", body_type: "SUV", doors: 4, seats: 5,
        generations: [
          {
            name: "2021-2025", slug: "2021-2025", year_start: 2021, year_end: 2025,
            variants: [
              { name: "2.0 Petrol",  slug: "2-0-petrol",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "AWD" },
              { name: "1.6 Turbo Hybrid", slug: "1-6-turbo-hybrid", fuel_type: "Hybrid", transmission: "Automatic", engine_size: "1.6L", drive_type: "AWD" },
            ],
          },
        ],
      },
      {
        name: "Santa Fe", slug: "santa-fe", body_type: "SUV", doors: 4, seats: 7,
        generations: [
          {
            name: "2019-2023", slug: "2019-2023", year_start: 2019, year_end: 2023,
            variants: [
              { name: "2.5 Petrol",  slug: "2-5-petrol",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.5L", drive_type: "AWD" },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Kia", slug: "kia",
    models: [
      {
        name: "Sportage", slug: "sportage", body_type: "SUV", doors: 4, seats: 5,
        generations: [
          {
            name: "2022-2025", slug: "2022-2025", year_start: 2022, year_end: 2025,
            variants: [
              { name: "2.0 Petrol",  slug: "2-0-petrol",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "AWD" },
              { name: "1.6 Turbo",   slug: "1-6-turbo",   fuel_type: "Petrol",  transmission: "Automatic", engine_size: "1.6L", drive_type: "AWD" },
            ],
          },
        ],
      },
      {
        name: "Sorento", slug: "sorento", body_type: "SUV", doors: 4, seats: 7,
        generations: [
          {
            name: "2021-2024", slug: "2021-2024", year_start: 2021, year_end: 2024,
            variants: [
              { name: "2.5 Petrol",  slug: "2-5-petrol",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.5L", drive_type: "AWD" },
              { name: "2.2 Diesel",  slug: "2-2-diesel",  fuel_type: "Diesel",  transmission: "Automatic", engine_size: "2.2L", drive_type: "AWD" },
            ],
          },
        ],
      },
      {
        name: "Cerato / K3", slug: "cerato", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2019-2023", slug: "2019-2023", year_start: 2019, year_end: 2023,
            variants: [
              { name: "1.6 Petrol",  slug: "1-6-petrol",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "1.6L", drive_type: "FWD" },
              { name: "2.0 Petrol",  slug: "2-0-petrol",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "FWD" },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Mercedes-Benz", slug: "mercedes-benz",
    models: [
      {
        name: "C-Class", slug: "c-class", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2015-2021", slug: "2015-2021", year_start: 2015, year_end: 2021,
            variants: [
              { name: "C180",  slug: "c180",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "1.6L", drive_type: "RWD" },
              { name: "C200",  slug: "c200",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "RWD" },
              { name: "C300",  slug: "c300",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "4MATIC" },
            ],
          },
        ],
      },
      {
        name: "E-Class", slug: "e-class", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2017-2022", slug: "2017-2022", year_start: 2017, year_end: 2022,
            variants: [
              { name: "E200",  slug: "e200",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "RWD" },
              { name: "E300",  slug: "e300",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "4MATIC" },
            ],
          },
        ],
      },
      {
        name: "GLC", slug: "glc", body_type: "SUV", doors: 4, seats: 5,
        generations: [
          {
            name: "2016-2022", slug: "2016-2022", year_start: 2016, year_end: 2022,
            variants: [
              { name: "GLC 200", slug: "glc-200", fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "4MATIC" },
              { name: "GLC 300", slug: "glc-300", fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "4MATIC" },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "BMW", slug: "bmw",
    models: [
      {
        name: "3 Series", slug: "3-series", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2019-2024", slug: "2019-2024", year_start: 2019, year_end: 2024,
            variants: [
              { name: "320i", slug: "320i", fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "RWD" },
              { name: "330i", slug: "330i", fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "xDrive" },
            ],
          },
        ],
      },
      {
        name: "5 Series", slug: "5-series", body_type: "Sedan", doors: 4, seats: 5,
        generations: [
          {
            name: "2017-2023", slug: "2017-2023", year_start: 2017, year_end: 2023,
            variants: [
              { name: "520i", slug: "520i", fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "RWD" },
              { name: "530i", slug: "530i", fuel_type: "Petrol",  transmission: "Automatic", engine_size: "2.0L", drive_type: "xDrive" },
            ],
          },
        ],
      },
      {
        name: "X5", slug: "x5", body_type: "SUV", doors: 4, seats: 7,
        generations: [
          {
            name: "2019-2024", slug: "2019-2024", year_start: 2019, year_end: 2024,
            variants: [
              { name: "xDrive40i", slug: "xdrive40i", fuel_type: "Petrol", transmission: "Automatic", engine_size: "3.0L", drive_type: "xDrive" },
              { name: "xDrive30d", slug: "xdrive30d", fuel_type: "Diesel", transmission: "Automatic", engine_size: "3.0L", drive_type: "xDrive" },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Nissan", slug: "nissan",
    models: [
      {
        name: "X-Trail / Rogue", slug: "x-trail", body_type: "SUV", doors: 4, seats: 5,
        generations: [
          {
            name: "2014-2020", slug: "2014-2020", year_start: 2014, year_end: 2020,
            variants: [
              { name: "2.0 Petrol", slug: "2-0-petrol", fuel_type: "Petrol", transmission: "CVT", engine_size: "2.0L", drive_type: "AWD" },
              { name: "2.5 Petrol", slug: "2-5-petrol", fuel_type: "Petrol", transmission: "CVT", engine_size: "2.5L", drive_type: "AWD" },
            ],
          },
        ],
      },
      {
        name: "Patrol", slug: "patrol", body_type: "SUV", doors: 4, seats: 7,
        generations: [
          {
            name: "2010-2023", slug: "2010-2023", year_start: 2010, year_end: 2023,
            variants: [
              { name: "4.0 V6 Petrol", slug: "4-0-v6-petrol", fuel_type: "Petrol", transmission: "Automatic", engine_size: "4.0L", drive_type: "4WD" },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Mitsubishi", slug: "mitsubishi",
    models: [
      {
        name: "Pajero", slug: "pajero", body_type: "SUV", doors: 4, seats: 7,
        generations: [
          {
            name: "2007-2022", slug: "2007-2022", year_start: 2007, year_end: 2022,
            variants: [
              { name: "3.2 Diesel",    slug: "3-2-diesel",    fuel_type: "Diesel",  transmission: "Automatic", engine_size: "3.2L", drive_type: "4WD" },
              { name: "3.8 V6 Petrol", slug: "3-8-v6-petrol", fuel_type: "Petrol",  transmission: "Automatic", engine_size: "3.8L", drive_type: "4WD" },
            ],
          },
        ],
      },
      {
        name: "L200 / Triton", slug: "l200", body_type: "Pickup", doors: 4, seats: 5,
        generations: [
          {
            name: "2019-2024", slug: "2019-2024", year_start: 2019, year_end: 2024,
            variants: [
              { name: "2.4 Diesel",   slug: "2-4-diesel",   fuel_type: "Diesel",  transmission: "Automatic", engine_size: "2.4L", drive_type: "4WD" },
            ],
          },
        ],
      },
    ],
  },
  {
    brand: "Suzuki", slug: "suzuki",
    models: [
      {
        name: "Vitara", slug: "vitara", body_type: "SUV", doors: 4, seats: 5,
        generations: [
          {
            name: "2015-2022", slug: "2015-2022", year_start: 2015, year_end: 2022,
            variants: [
              { name: "1.4 Turbo",  slug: "1-4-turbo",  fuel_type: "Petrol",  transmission: "Automatic", engine_size: "1.4L", drive_type: "AWD" },
              { name: "1.6 Petrol", slug: "1-6-petrol", fuel_type: "Petrol",  transmission: "Automatic", engine_size: "1.6L", drive_type: "FWD" },
            ],
          },
        ],
      },
      {
        name: "Swift", slug: "swift", body_type: "Hatchback", doors: 4, seats: 5,
        generations: [
          {
            name: "2017-2023", slug: "2017-2023", year_start: 2017, year_end: 2023,
            variants: [
              { name: "1.2 Petrol", slug: "1-2-petrol", fuel_type: "Petrol", transmission: "Manual", engine_size: "1.2L", drive_type: "FWD" },
              { name: "1.2 Hybrid", slug: "1-2-hybrid", fuel_type: "Hybrid", transmission: "Automatic", engine_size: "1.2L", drive_type: "FWD" },
            ],
          },
        ],
      },
    ],
  },
];

function buildSpecs(variant, model) {
  return [
    { key: "brand",         label: "Brand",         value: "",                              sort: 1  },
    { key: "model",         label: "Model",         value: model.name,                      sort: 2  },
    { key: "body_type",     label: "Body Type",     value: model.body_type ?? "",           sort: 3  },
    { key: "fuel_type",     label: "Fuel Type",     value: variant.fuel_type ?? "",         sort: 4  },
    { key: "transmission",  label: "Transmission",  value: variant.transmission ?? "",      sort: 5  },
    { key: "engine_size",   label: "Engine Size",   value: variant.engine_size ?? "",       sort: 6  },
    { key: "drive_type",    label: "Drive Type",    value: variant.drive_type ?? "",        sort: 7  },
    { key: "doors",         label: "Doors",         value: String(model.doors ?? 4),        sort: 8  },
    { key: "seats",         label: "Seats",         value: String(model.seats ?? 5),        sort: 9  },
  ].filter((row) => row.value);
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const envText = fs.readFileSync(envPath, "utf8");
  const url = readEnvValue(envText, "NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnvValue(envText, "SUPABASE_SERVICE_ROLE_KEY");
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  // fetch brand category nodes
  const { data: catNodes } = await sb
    .from("category_nodes")
    .select("id,path")
    .like("path", "vehicles/cars/%")
    .not("path", "like", "vehicles/cars/%/%");
  const pathToNodeId = new Map((catNodes ?? []).map((n) => [n.path.split("/").pop(), n.id]));

  let brandsInserted = 0, modelsInserted = 0, gensInserted = 0, variantsInserted = 0, specsInserted = 0;

  for (const [bIdx, brandDef] of CATALOG.entries()) {
    const catNodeId = pathToNodeId.get(brandDef.slug) ?? null;

    const { data: brandRow, error: brandErr } = await sb
      .from("vehicle_brands")
      .upsert({ name: brandDef.brand, slug: brandDef.slug, category_node_id: catNodeId, display_order: bIdx, is_active: true },
               { onConflict: "slug" })
      .select("id").single();
    if (brandErr) throw brandErr;
    brandsInserted++;

    for (const [mIdx, modelDef] of brandDef.models.entries()) {
      const { data: modelRow, error: modelErr } = await sb
        .from("vehicle_models")
        .upsert({ brand_id: brandRow.id, name: modelDef.name, slug: modelDef.slug,
                  body_type: modelDef.body_type, doors: modelDef.doors, seats: modelDef.seats,
                  display_order: mIdx, is_active: true },
                 { onConflict: "brand_id,slug" })
        .select("id").single();
      if (modelErr) throw modelErr;
      modelsInserted++;

      for (const [gIdx, genDef] of modelDef.generations.entries()) {
        const { data: genRow, error: genErr } = await sb
          .from("vehicle_generations")
          .upsert({ model_id: modelRow.id, name: genDef.name, slug: genDef.slug,
                    year_start: genDef.year_start, year_end: genDef.year_end,
                    display_order: gIdx, is_active: true },
                   { onConflict: "model_id,slug" })
          .select("id").single();
        if (genErr) throw genErr;
        gensInserted++;

        for (const [vIdx, variantDef] of genDef.variants.entries()) {
          const { data: varRow, error: varErr } = await sb
            .from("vehicle_variants")
            .upsert({ generation_id: genRow.id, name: variantDef.name, slug: variantDef.slug,
                      fuel_type: variantDef.fuel_type, transmission: variantDef.transmission,
                      engine_size: variantDef.engine_size, drive_type: variantDef.drive_type,
                      display_order: vIdx, is_active: true },
                     { onConflict: "generation_id,slug" })
            .select("id").single();
          if (varErr) throw varErr;
          variantsInserted++;

          const specDefs = buildSpecs(variantDef, modelDef);
          specDefs[0].value = brandDef.brand; // fill brand

          for (const spec of specDefs) {
            const { error: specErr } = await sb
              .from("vehicle_specifications")
              .upsert({ variant_id: varRow.id, spec_key: spec.key, spec_label: spec.label,
                        spec_value: spec.value, is_locked: true, sort_order: spec.sort },
                       { onConflict: "variant_id,spec_key" });
            if (specErr) throw specErr;
            specsInserted++;
          }
        }
      }
    }
  }

  console.log(`Seeded vehicle catalog: ${brandsInserted} brands, ${modelsInserted} models, ${gensInserted} gens, ${variantsInserted} variants, ${specsInserted} specs.`);
}

main().catch((err) => { console.error(err); process.exit(1); });

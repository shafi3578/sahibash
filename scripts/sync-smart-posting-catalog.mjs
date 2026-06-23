import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function readEnvValue(fileContent, key) {
  const line = fileContent
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));
  return line ? line.slice(key.length + 1).trim() : "";
}

function optionJson(values) {
  return values;
}

const PHONE_FIELDS = [
  ["storage", "Storage", "select", true, optionJson(["128GB", "256GB", "512GB", "1TB"]), null, 10, "property_details"],
  ["ram", "RAM", "select", false, optionJson(["4GB", "6GB", "8GB", "12GB"]), null, 20, "property_details"],
  ["condition", "Condition", "select", true, optionJson(["New", "Like New", "Used", "Damaged/For Parts"]), null, 30, "category_specific"],
  ["warranty", "Warranty", "select", false, optionJson(["Yes", "No"]), null, 40, "category_specific"],
  ["battery_health", "Battery Health", "text", false, null, null, 50, "category_specific"],
  ["color", "Color", "text", false, null, null, 60, "category_specific"],
  ["box_available", "Box Available", "boolean", false, null, null, 70, "category_specific"],
  ["charger_available", "Charger Available", "boolean", false, null, null, 80, "category_specific"],
  ["exchange_possible", "Exchange Possible", "boolean", false, null, null, 90, "category_specific"],
];

const VEHICLE_FIELDS = [
  ["year", "Year", "number", true, null, null, 10, "property_details"],
  ["mileage", "Mileage", "number", true, null, "km", 20, "property_details"],
  ["fuel_type", "Fuel Type", "select", false, optionJson(["Petrol", "Diesel", "Hybrid", "Electric", "CNG"]), null, 30, "property_details"],
  ["transmission", "Transmission", "select", false, optionJson(["Automatic", "Manual"]), null, 40, "property_details"],
  ["engine_size", "Engine Size", "text", false, null, null, 50, "property_details"],
  ["color", "Color", "text", false, null, null, 60, "category_specific"],
  ["condition", "Condition", "select", true, optionJson(["New", "Like New", "Used", "Damaged"]), null, 70, "category_specific"],
  ["accident_status", "Accident Status", "select", false, optionJson(["No Accident", "Minor Accident", "Major Accident"]), null, 80, "category_specific"],
  ["customs_status", "Customs/Clearance Status", "select", false, optionJson(["Cleared", "Not Cleared"]), null, 90, "category_specific"],
  ["registration_status", "Plate/Registration Status", "select", false, optionJson(["Registered", "Not Registered"]), null, 100, "category_specific"],
  ["warranty", "Warranty", "select", false, optionJson(["Yes", "No"]), null, 110, "category_specific"],
  ["exchange_possible", "Exchange Possible", "boolean", false, null, null, 120, "category_specific"],
];

const ELECTRONICS_FIELDS = [
  ["condition", "Condition", "select", true, optionJson(["New", "Like New", "Used", "Damaged/For Parts"]), null, 10, "category_specific"],
  ["warranty", "Warranty", "select", false, optionJson(["Yes", "No"]), null, 20, "category_specific"],
  ["storage", "Storage", "select", false, optionJson(["128GB", "256GB", "512GB", "1TB"]), null, 30, "property_details"],
  ["ram", "RAM", "select", false, optionJson(["8GB", "16GB", "32GB"]), null, 40, "property_details"],
  ["battery_health", "Battery Health", "text", false, null, null, 50, "property_details"],
  ["color", "Color", "text", false, null, null, 60, "category_specific"],
  ["accessories_included", "Accessories Included", "text", false, null, null, 70, "category_specific"],
  ["box_available", "Box Available", "boolean", false, null, null, 80, "category_specific"],
  ["exchange_possible", "Exchange Possible", "boolean", false, null, null, 90, "category_specific"],
];

const FIXED_SPEC_MODELS = [
  {
    path: "phones-electronics/mobile-phones/apple/iphone-13-pro-max",
    brand: "Apple",
    model: "iPhone 13 Pro Max",
    aliases: ["iphone 13 pro max", "apple iphone 13 pro max"],
    specs: {
      brand: "Apple",
      model: "iPhone 13 Pro Max",
      series: "iPhone",
      operating_system: "iOS",
      screen_size: "6.7 inches",
      device_type: "Smartphone",
      sim_type: "Nano-SIM and eSIM",
      release_year: "2021",
      network_type: "5G",
      charging_port: "Lightning",
      biometric: "Face ID",
      storage_options: ["128GB", "256GB", "512GB", "1TB"],
    },
  },
  {
    path: "phones-electronics/mobile-phones/samsung/galaxy-s23",
    brand: "Samsung",
    model: "Galaxy S23 Ultra",
    aliases: ["galaxy s23 ultra", "s23 ultra", "samsung galaxy s23 ultra"],
    specs: {
      brand: "Samsung",
      model: "Galaxy S23 Ultra",
      series: "Galaxy S Series",
      operating_system: "Android",
      screen_size: "6.8 inches",
      device_type: "Smartphone",
      network_type: "5G",
      release_year: "2023",
      charging_port: "USB-C",
      biometric: "Fingerprint + Face Unlock",
      storage_options: ["256GB", "512GB", "1TB"],
      ram_options: ["8GB", "12GB"],
    },
  },
  {
    path: "vehicles/cars/toyota",
    brand: "Toyota",
    model: "Toyota Corolla",
    aliases: ["toyota corolla", "corolla"],
    specs: {
      brand: "Toyota",
      model: "Toyota Corolla",
      series: "Corolla",
      vehicle_type: "Car",
      body_type: "Sedan",
      fuel_type: "Petrol",
      transmission: "Automatic",
      engine_size: "1.8L",
    },
  },
  {
    path: "phones-electronics/laptops/apple",
    brand: "Apple",
    model: "MacBook Pro",
    aliases: ["macbook pro", "apple macbook pro"],
    specs: {
      brand: "Apple",
      model: "MacBook Pro",
      series: "MacBook",
      device_type: "Laptop",
      operating_system: "macOS",
      screen_size: "14 inches",
      processor: "Apple M3",
      release_year: "2023",
      storage_options: ["512GB", "1TB"],
      ram_options: ["8GB", "16GB", "18GB"],
    },
  },
];

function buildFieldRows(nodeIds, defs) {
  return nodeIds.flatMap((nodeId) =>
    defs.map(([fieldKey, fieldLabel, fieldType, isRequired, optionsJson, unit, displayOrder, groupKey]) => ({
      category_node_id: nodeId,
      field_key: fieldKey,
      field_label: fieldLabel,
      field_type: fieldType,
      is_required: isRequired,
      options_json: optionsJson,
      unit,
      display_order: displayOrder,
      group_key: groupKey,
      is_active: true,
    }))
  );
}

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  const envText = fs.readFileSync(envPath, "utf8");
  const url = readEnvValue(envText, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readEnvValue(envText, "SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: nodes, error: nodesError } = await supabase
    .from("category_nodes")
    .select("id, path, parent_id, is_active")
    .eq("is_active", true)
    .or("path.like.phones-electronics%,path.like.vehicles%");

  if (nodesError) throw nodesError;

  const pathToId = new Map((nodes ?? []).map((node) => [node.path, node.id]));
  const parentIds = new Set((nodes ?? []).map((node) => node.parent_id).filter(Boolean));

  const phoneModelNodeIds = (nodes ?? [])
    .filter((node) => node.path.startsWith("phones-electronics/mobile-phones/") && !parentIds.has(node.id))
    .map((node) => node.id);

  const vehicleNodeIds = (nodes ?? [])
    .filter((node) => node.path.startsWith("vehicles/") && !parentIds.has(node.id) && !node.path.includes("auto-parts") && !node.path.includes("tires-wheels"))
    .map((node) => node.id);

  const electronicsNodeIds = (nodes ?? [])
    .filter((node) => (node.path.startsWith("phones-electronics/laptops/") || node.path.startsWith("phones-electronics/tablets") || node.path.startsWith("phones-electronics/cameras") || node.path.startsWith("phones-electronics/tvs")) && !parentIds.has(node.id))
    .map((node) => node.id);

  const fieldRows = [
    ...buildFieldRows(phoneModelNodeIds, PHONE_FIELDS),
    ...buildFieldRows(vehicleNodeIds, VEHICLE_FIELDS),
    ...buildFieldRows(electronicsNodeIds, ELECTRONICS_FIELDS),
  ];

  const deactivateIds = [...new Set([...phoneModelNodeIds, ...vehicleNodeIds, ...electronicsNodeIds])];
  if (deactivateIds.length > 0) {
    const { error: deactivateError } = await supabase
      .from("category_fields")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .in("category_node_id", deactivateIds);
    if (deactivateError) throw deactivateError;
  }

  if (fieldRows.length > 0) {
    const { error: fieldsError } = await supabase
      .from("category_fields")
      .upsert(fieldRows, { onConflict: "category_node_id,field_key" });
    if (fieldsError) throw fieldsError;
  }

  const specRows = FIXED_SPEC_MODELS.map((entry) => {
    const categoryNodeId = pathToId.get(entry.path);
    if (!categoryNodeId) throw new Error(`Missing category node for path: ${entry.path}`);
    return {
      category_node_id: categoryNodeId,
      brand: entry.brand,
      model: entry.model,
      aliases: entry.aliases,
      specs: entry.specs,
      is_active: true,
    };
  });

  for (const row of specRows) {
    const { error: deleteError } = await supabase
      .from("product_specs")
      .delete()
      .eq("brand", row.brand)
      .eq("model", row.model)
      .neq("category_node_id", row.category_node_id);

    if (deleteError) throw deleteError;
  }

  const { error: specsError } = await supabase
    .from("product_specs")
    .upsert(specRows, { onConflict: "category_node_id,brand,model" });
  if (specsError) throw specsError;

  console.log(`Synced smart posting catalog. Phone nodes: ${phoneModelNodeIds.length}, vehicle nodes: ${vehicleNodeIds.length}, electronics nodes: ${electronicsNodeIds.length}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

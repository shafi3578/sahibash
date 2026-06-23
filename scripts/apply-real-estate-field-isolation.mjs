import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function readEnvValue(fileContent, key) {
  const line = fileContent
    .split(/\r?\n/)
    .find((entry) => entry.trim().startsWith(`${key}=`));
  if (!line) return "";
  return line.slice(key.length + 1).trim();
}

function profileForPath(nodePath) {
  if (nodePath.startsWith("real-estate/land/for-sale/")) return "land_sale";
  if (nodePath.startsWith("real-estate/land/for-lease/")) return "land_lease";
  if (nodePath.startsWith("real-estate/student-accommodation-dormitories/")) return "dormitory";
  if (nodePath.startsWith("real-estate/residential/for-sale/")) return "res_sale";
  if (nodePath.startsWith("real-estate/residential/for-rent/")) return "res_rent";
  if (nodePath.startsWith("real-estate/residential/gerawy-rahn/")) return "res_gerawy";
  if (nodePath.startsWith("real-estate/residential/gerawy-monthly-rent/")) return "res_gerawy";
  if (nodePath.startsWith("real-estate/commercial/for-sale/")) return "com_sale";
  if (nodePath.startsWith("real-estate/commercial/for-rent/")) return "com_rent";
  if (nodePath.startsWith("real-estate/commercial/gerawy-rahn/")) return "com_rent";
  if (nodePath.startsWith("real-estate/commercial/gerawy-monthly-rent/")) return "com_rent";
  return null;
}

const defs = {
  land_sale: [
    ["land_size", "Land Size", "number", true, null, "m2"],
    ["land_type", "Land Type", "select", true, ["Residential Land", "Commercial Land", "Agricultural Land", "Garden", "Farm"], null],
    ["document_type", "Document Type", "text", true, null, null],
    ["road_access", "Road Access", "boolean", false, null, null],
    ["water_access", "Water Access", "boolean", false, null, null],
    ["electricity_access", "Electricity Access", "boolean", false, null, null],
    ["owner_type", "Owner / Agent", "select", true, ["owner", "agent"], null],
  ],
  land_lease: [
    ["lease_price", "Lease Price", "number", true, null, null],
    ["lease_duration", "Lease Duration", "text", true, null, null],
    ["land_size", "Land Size", "number", true, null, "m2"],
    ["land_type", "Land Type", "select", true, ["Agricultural Land", "Garden", "Farm"], null],
    ["document_type", "Document Type", "text", true, null, null],
    ["road_access", "Road Access", "boolean", false, null, null],
    ["water_access", "Water Access", "boolean", false, null, null],
    ["electricity_access", "Electricity Access", "boolean", false, null, null],
    ["owner_type", "Owner / Agent", "select", true, ["owner", "agent"], null],
  ],
  dormitory: [
    ["dormitory_type", "Dormitory Type", "select", true, ["Male Dormitory", "Female Dormitory", "Private Dormitory", "University Dormitory", "Shared Apartment", "Shared Room", "Family Room"], null],
    ["gender", "Gender", "select", true, ["male", "female", "mixed"], null],
    ["price_per_month", "Price per Month", "number", true, null, null],
    ["deposit_amount", "Deposit", "number", false, null, null],
    ["beds_available", "Beds Available", "number", false, null, null],
    ["room_capacity", "Room Capacity", "number", false, null, null],
    ["meals_included", "Meals Included", "boolean", false, null, null],
    ["internet_included", "Internet Included", "boolean", false, null, null],
    ["electricity_included", "Electricity Included", "boolean", false, null, null],
    ["water_included", "Water Included", "boolean", false, null, null],
    ["heating_cooling", "Heating / Cooling", "text", false, null, null],
    ["bathroom_type", "Bathroom Type", "text", false, null, null],
    ["distance_from_university", "Distance from University", "number", false, null, "km"],
    ["nearby_university", "Nearby University or Area", "text", false, null, null],
    ["rules", "Rules", "text", false, null, null],
    ["owner_type", "Owner / Manager", "select", true, ["owner", "manager"], null],
    ["available_from", "Available From", "date", false, null, null],
  ],
  res_sale: [
    ["property_size", "Property Size", "number", true, null, "m2"],
    ["rooms", "Rooms", "number", true, null, null],
    ["bathrooms", "Bathrooms", "number", false, null, null],
    ["floor", "Floor", "number", false, null, null],
    ["total_floors", "Total Floors", "number", false, null, null],
    ["building_age", "Building Age", "text", false, null, null],
    ["furnished", "Furnished", "boolean", false, null, null],
    ["electricity", "Electricity", "boolean", false, null, null],
    ["water", "Water", "boolean", false, null, null],
    ["internet", "Internet", "boolean", false, null, null],
    ["parking", "Parking", "boolean", false, null, null],
    ["owner_type", "Owner / Agent", "select", true, ["owner", "agent"], null],
  ],
  res_rent: [
    ["monthly_rent_amount", "Monthly Rent Amount", "number", true, null, null],
    ["deposit_amount", "Deposit Amount", "number", false, null, null],
    ["contract_duration", "Contract Duration", "text", false, null, null],
    ["property_size", "Property Size", "number", true, null, "m2"],
    ["rooms", "Rooms", "number", true, null, null],
    ["bathrooms", "Bathrooms", "number", false, null, null],
    ["floor", "Floor", "number", false, null, null],
    ["total_floors", "Total Floors", "number", false, null, null],
    ["furnished", "Furnished", "boolean", false, null, null],
    ["electricity", "Electricity", "boolean", false, null, null],
    ["water", "Water", "boolean", false, null, null],
    ["internet", "Internet", "boolean", false, null, null],
    ["parking", "Parking", "boolean", false, null, null],
    ["owner_type", "Owner / Agent", "select", true, ["owner", "agent"], null],
    ["available_from", "Available From", "date", false, null, null],
  ],
  res_gerawy: [
    ["gerawy_rahn_amount", "Gerawy / Rahn Amount", "number", true, null, null],
    ["monthly_rent_amount", "Monthly Rent Amount", "number", false, null, null],
    ["contract_duration", "Contract Duration", "text", false, null, null],
    ["refund_condition_note", "Refund Condition Note", "text", false, null, null],
    ["property_size", "Property Size", "number", true, null, "m2"],
    ["rooms", "Rooms", "number", true, null, null],
    ["bathrooms", "Bathrooms", "number", false, null, null],
    ["floor", "Floor", "number", false, null, null],
    ["total_floors", "Total Floors", "number", false, null, null],
    ["furnished", "Furnished", "boolean", false, null, null],
    ["electricity", "Electricity", "boolean", false, null, null],
    ["water", "Water", "boolean", false, null, null],
    ["internet", "Internet", "boolean", false, null, null],
    ["parking", "Parking", "boolean", false, null, null],
    ["owner_type", "Owner / Agent", "select", true, ["owner", "agent"], null],
    ["available_from", "Available From", "date", false, null, null],
  ],
  com_sale: [
    ["commercial_type", "Commercial Type", "text", true, null, null],
    ["property_size", "Property Size", "number", true, null, "m2"],
    ["floor", "Floor", "number", false, null, null],
    ["total_floors", "Total Floors", "number", false, null, null],
    ["electricity", "Electricity", "boolean", false, null, null],
    ["water", "Water", "boolean", false, null, null],
    ["internet", "Internet", "boolean", false, null, null],
    ["parking", "Parking", "boolean", false, null, null],
    ["owner_type", "Owner / Agent", "select", true, ["owner", "agent"], null],
  ],
  com_rent: [
    ["monthly_rent_amount", "Monthly Rent Amount", "number", true, null, null],
    ["deposit_amount", "Deposit", "number", false, null, null],
    ["contract_duration", "Contract Duration", "text", false, null, null],
    ["commercial_type", "Commercial Type", "text", true, null, null],
    ["property_size", "Property Size", "number", true, null, "m2"],
    ["floor", "Floor", "number", false, null, null],
    ["total_floors", "Total Floors", "number", false, null, null],
    ["electricity", "Electricity", "boolean", false, null, null],
    ["water", "Water", "boolean", false, null, null],
    ["internet", "Internet", "boolean", false, null, null],
    ["parking", "Parking", "boolean", false, null, null],
    ["owner_type", "Owner / Agent", "select", true, ["owner", "agent"], null],
    ["available_from", "Available From", "date", false, null, null],
  ],
};

async function main() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error(".env.local not found");
  }

  const envText = fs.readFileSync(envPath, "utf8");
  const url = readEnvValue(envText, "NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readEnvValue(envText, "SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: nodes, error: nodeErr } = await supabase
    .from("category_nodes")
    .select("id,parent_id,path,is_active")
    .eq("is_active", true)
    .like("path", "real-estate/%");

  if (nodeErr) throw nodeErr;

  const byParent = new Map();
  for (const node of nodes ?? []) {
    if (!byParent.has(node.parent_id)) byParent.set(node.parent_id, []);
    byParent.get(node.parent_id).push(node.id);
  }

  const leaves = (nodes ?? []).filter((n) => !byParent.has(n.id));
  const mappedLeaves = leaves
    .map((leaf) => ({ ...leaf, profile: profileForPath(leaf.path) }))
    .filter((leaf) => Boolean(leaf.profile));

  if (mappedLeaves.length === 0) {
    throw new Error("No target leaf nodes found under real-estate");
  }

  const leafIds = mappedLeaves.map((x) => x.id);

  const { error: deactivateError } = await supabase
    .from("category_fields")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .in("category_node_id", leafIds);

  if (deactivateError) throw deactivateError;

  const rows = [];
  for (const leaf of mappedLeaves) {
    const profileDefs = defs[leaf.profile] ?? [];
    profileDefs.forEach(([fieldKey, fieldLabel, fieldType, isRequired, optionsJson, unit], index) => {
      rows.push({
        category_node_id: leaf.id,
        field_key: fieldKey,
        field_label: fieldLabel,
        field_type: fieldType,
        is_required: isRequired,
        options_json: optionsJson,
        unit,
        display_order: (index + 1) * 10,
        is_active: true,
      });
    });
  }

  const { error: upsertError } = await supabase
    .from("category_fields")
    .upsert(rows, { onConflict: "category_node_id,field_key" });

  if (upsertError) throw upsertError;

  console.log(`Applied isolated field sets to ${mappedLeaves.length} real-estate leaf categories.`);
}

main().catch((error) => {
  console.error("Failed to apply field isolation:", error.message || error);
  process.exit(1);
});

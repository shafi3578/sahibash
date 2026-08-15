"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ALLOWED_KEYS = new Set(["q","province","district","categoryId","categoryNodeId","scope","sort","minPrice","maxPrice","propertyType","rentalType","vehicleType","vehicleBrand","vehicleModel","yearMin","yearMax","kmMin","kmMax","fuelType","transmission","condition","phoneModel","storage","ram","listingType","postedWithin","photosOnly"]);

export async function saveSearchAction(formData: FormData) {
  const user = await requireUser();
  const raw = String(formData.get("params") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const parsed = new URLSearchParams(raw);
  const filters: Record<string,string> = {};
  for (const [key,value] of parsed) if (ALLOWED_KEYS.has(key) && value.length <= 200) filters[key]=value;
  if (!name || Object.keys(filters).length === 0) return;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("saved_searches").insert({user_id:user.id,name,query_text:filters.q ?? null,filters,notifications_enabled:true});
  if (error) throw new Error("Unable to save this search.");
  revalidatePath("/dashboard/favorite-searches");
  redirect("/dashboard/favorite-searches");
}

export async function deleteSavedSearchAction(id: string) {
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createSupabaseServerClient();
  await supabase.from("saved_searches").delete().eq("id",id).eq("user_id",user.id);
  revalidatePath("/dashboard/favorite-searches");
}

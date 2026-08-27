import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/rate-limit";
import { matchAfghanistanLocationRows, type LocationRow } from "@/lib/location/reverse-match";

type NominatimAddress = Record<string, string | undefined>;

function validCoordinate(value: string | null, min: number, max: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const latitude = validCoordinate(url.searchParams.get("latitude"), 29, 39.5);
  const longitude = validCoordinate(url.searchParams.get("longitude"), 60, 75.5);
  const locale = url.searchParams.get("locale") === "fa" || url.searchParams.get("locale") === "ps"
    ? url.searchParams.get("locale") as "fa" | "ps"
    : "en";
  if (latitude === null || longitude === null) {
    return NextResponse.json({ ok: false, message: "Invalid Afghanistan coordinates" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });
  const rateLimit = await consumeRateLimit({
    scope: "location.reverse",
    userId: user.id,
    maxRequests: 12,
    windowSeconds: 10 * 60,
  });
  if (!rateLimit.allowed) return NextResponse.json({ ok: false }, { status: 429 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=12&addressdetails=1&lat=${encodeURIComponent(String(latitude))}&lon=${encodeURIComponent(String(longitude))}`,
      {
        headers: { "Accept-Language": `${locale},en;q=0.8`, "User-Agent": "Sahibash/1.0 location resolver" },
        cache: "no-store",
        signal: controller.signal,
      },
    );
    if (!response.ok) return NextResponse.json({ ok: false }, { status: 502 });
    const payload = await response.json() as { address?: NominatimAddress };
    const address = payload.address ?? {};
    if (String(address.country_code ?? "").toLowerCase() !== "af") {
      return NextResponse.json({ ok: false, message: "Location is outside Afghanistan" }, { status: 422 });
    }

    const [{ data: provinces }, { data: districts }] = await Promise.all([
      supabase.from("provinces").select("id,name,name_en,name_fa,name_ps,aliases").eq("is_active", true),
      supabase.from("districts").select("id,province_id,name,name_en,name_fa,name_ps,aliases").eq("is_active", true),
    ]);
    const matched = matchAfghanistanLocationRows({
      provinces: (provinces ?? []) as LocationRow[],
      districts: (districts ?? []) as LocationRow[],
      provinceNames: [address.state, address.province, address.region].filter((value): value is string => Boolean(value)),
      districtNames: [address.state_district, address.county, address.district, address.city_district, address.city, address.town, address.municipality].filter((value): value is string => Boolean(value)),
    });
    if (!matched.province || !matched.district) {
      return NextResponse.json({ ok: false, message: "No confident internal location match" }, { status: 422 });
    }

    const localizedName = (row: LocationRow) => String(row[`name_${locale}` as keyof LocationRow] ?? row.name_en ?? row.name ?? "");
    return NextResponse.json({
      ok: true,
      province: { id: matched.province.id, name: localizedName(matched.province) },
      district: { id: matched.district.id, provinceId: matched.province.id, name: localizedName(matched.district) },
    });
  } catch {
    return NextResponse.json({ ok: false }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}

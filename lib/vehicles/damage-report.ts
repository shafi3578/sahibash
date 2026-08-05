import type { AppLocale } from "@/lib/i18n/translations";

type LocalizedLabel = Record<AppLocale, string>;

export const VEHICLE_DAMAGE_PARTS = [
  { key: "hood", labels: { en: "Hood", fa: "کاپوت", ps: "بونټ" } },
  { key: "roof", labels: { en: "Roof", fa: "سقف", ps: "چت" } },
  { key: "trunk", labels: { en: "Trunk", fa: "صندوق عقب", ps: "شا ډاله" } },
  { key: "front_bumper", labels: { en: "Front bumper", fa: "بمپر جلو", ps: "مخ بمپر" } },
  { key: "rear_bumper", labels: { en: "Rear bumper", fa: "بمپر عقب", ps: "شا بمپر" } },
  { key: "front_left_fender", labels: { en: "Front-left fender", fa: "گلگیر چپ جلو", ps: "مخ چپ مډګارډ" } },
  { key: "front_right_fender", labels: { en: "Front-right fender", fa: "گلگیر راست جلو", ps: "مخ ښی مډګارډ" } },
  { key: "rear_left_fender", labels: { en: "Rear-left fender", fa: "گلگیر چپ عقب", ps: "شا چپ مډګارډ" } },
  { key: "rear_right_fender", labels: { en: "Rear-right fender", fa: "گلگیر راست عقب", ps: "شا ښی مډګارډ" } },
  { key: "front_left_door", labels: { en: "Front-left door", fa: "دروازه چپ جلو", ps: "مخ چپ دروازه" } },
  { key: "front_right_door", labels: { en: "Front-right door", fa: "دروازه راست جلو", ps: "مخ ښی دروازه" } },
  { key: "rear_left_door", labels: { en: "Rear-left door", fa: "دروازه چپ عقب", ps: "شا چپ دروازه" } },
  { key: "rear_right_door", labels: { en: "Rear-right door", fa: "دروازه راست عقب", ps: "شا ښی دروازه" } },
] as const satisfies ReadonlyArray<{ key: string; labels: LocalizedLabel }>;

export const VEHICLE_DAMAGE_CONDITIONS = [
  { value: "original", labels: { en: "Original", fa: "اصلی", ps: "اصلي" }, color: "#64748b", className: "bg-slate-500" },
  { value: "local_painted", labels: { en: "Locally painted", fa: "رنگ موضعی", ps: "ځایي رنګ" }, color: "#f59e0b", className: "bg-amber-500" },
  { value: "painted", labels: { en: "Painted", fa: "رنگ‌شده", ps: "رنګ شوی" }, color: "#2563eb", className: "bg-blue-600" },
  { value: "changed", labels: { en: "Replaced", fa: "تعویض‌شده", ps: "بدل شوی" }, color: "#dc2626", className: "bg-red-600" },
  { value: "damaged", labels: { en: "Damaged", fa: "آسیب‌دیده", ps: "زیانمن" }, color: "#7c3aed", className: "bg-violet-600" },
] as const satisfies ReadonlyArray<{ value: string; labels: LocalizedLabel; color: string; className: string }>;

export type VehicleDamageCondition = (typeof VEHICLE_DAMAGE_CONDITIONS)[number]["value"];
export type DamagePart = { key: string; label: string; condition: VehicleDamageCondition };

const partByKey = new Map<string, (typeof VEHICLE_DAMAGE_PARTS)[number]>(
  VEHICLE_DAMAGE_PARTS.map((part) => [part.key, part])
);
const validConditions = new Set<string>(VEHICLE_DAMAGE_CONDITIONS.map((condition) => condition.value));

export function defaultVehicleDamageParts(): DamagePart[] {
  return VEHICLE_DAMAGE_PARTS.map((part) => ({ key: part.key, label: part.labels.en, condition: "original" }));
}

export function normalizeVehicleDamageParts(input: unknown): DamagePart[] {
  if (!Array.isArray(input)) return [];
  const result: DamagePart[] = [];
  const seen = new Set<string>();

  for (const value of input) {
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    const key = String(row.key ?? "");
    const condition = String(row.condition ?? "");
    const part = partByKey.get(key);
    if (!part || seen.has(key) || !validConditions.has(condition)) continue;
    seen.add(key);
    result.push({ key, label: part.labels.en, condition: condition as VehicleDamageCondition });
  }
  return result;
}

export function damagePartLabel(key: string, locale: AppLocale) {
  return partByKey.get(key)?.labels[locale] ?? key.replace(/_/g, " ");
}

export function damageCondition(value: string) {
  return VEHICLE_DAMAGE_CONDITIONS.find((condition) => condition.value === value) ?? VEHICLE_DAMAGE_CONDITIONS[0];
}

export function shouldShowVehicleDamageDiagram(
  rootSlug: string | null | undefined,
  branchKey: string | null | undefined
) {
  return rootSlug === "vehicles" && Boolean(branchKey) && branchKey !== "parts" && branchKey !== "bicycles";
}

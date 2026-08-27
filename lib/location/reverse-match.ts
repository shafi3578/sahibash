type LocationRow = {
  id: number;
  province_id?: number;
  name?: string | null;
  name_en?: string | null;
  name_fa?: string | null;
  name_ps?: string | null;
  aliases?: unknown;
};

function normalizeLocationName(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .toLocaleLowerCase("en")
    .replace(/[\u064b-\u065f]/g, "")
    .replace(/\b(province|wilayat|velayat|district|county|city|municipality)\b/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function rowNames(row: LocationRow) {
  const aliases = Array.isArray(row.aliases) ? row.aliases : [];
  return [row.name, row.name_en, row.name_fa, row.name_ps, ...aliases]
    .map(normalizeLocationName)
    .filter(Boolean);
}

function matchScore(row: LocationRow, candidates: string[]) {
  const names = rowNames(row);
  let best = 0;
  for (const candidate of candidates.map(normalizeLocationName).filter(Boolean)) {
    for (const name of names) {
      if (candidate === name) best = Math.max(best, 100 + name.length);
      else if (candidate.includes(name) || name.includes(candidate)) best = Math.max(best, 60 + Math.min(candidate.length, name.length));
    }
  }
  return best;
}

export function matchAfghanistanLocationRows({
  provinces,
  districts,
  provinceNames,
  districtNames,
}: {
  provinces: LocationRow[];
  districts: LocationRow[];
  provinceNames: string[];
  districtNames: string[];
}) {
  const province = provinces
    .map((row) => ({ row, score: matchScore(row, provinceNames) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.row.id - b.row.id)[0]?.row ?? null;
  if (!province) return { province: null, district: null };

  const district = districts
    .filter((row) => row.province_id === province.id)
    .map((row) => ({ row, score: matchScore(row, districtNames) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.row.id - b.row.id)[0]?.row ?? null;

  return { province, district };
}

export type { LocationRow };

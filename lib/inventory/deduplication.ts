import { normalizeInventoryText, normalizePriceToAfn } from "@/lib/inventory/normalization";

export type DuplicateCandidate = {
  sourceType?: string | null;
  sourceItemId?: string | null;
  phone?: string | null;
  title?: string | null;
  categoryNodeId?: number | string | null;
  province?: string | null;
  district?: string | null;
  price?: number | string | null;
  sourcePostedAt?: string | null;
};

function tokenSet(text: string) {
  return new Set(normalizeInventoryText(text).split(" ").filter((token) => token.length > 1));
}

function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 && b.size === 0) return 0;
  const union = new Set([...a, ...b]);
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  return intersection / union.size;
}

export function scoreDuplicateCandidate(a: DuplicateCandidate, b: DuplicateCandidate) {
  if (a.sourceType && b.sourceType && a.sourceType === b.sourceType && a.sourceItemId && a.sourceItemId === b.sourceItemId) {
    return { score: 1, confidence: "exact" as const, reasons: ["same_source_item"] };
  }

  const reasons: string[] = [];
  let score = 0;

  if (a.phone && b.phone && a.phone === b.phone) {
    score += 0.28;
    reasons.push("same_phone");
  }

  if (String(a.categoryNodeId ?? "") && String(a.categoryNodeId ?? "") === String(b.categoryNodeId ?? "")) {
    score += 0.14;
    reasons.push("same_category");
  }

  const titleScore = jaccard(tokenSet(a.title ?? ""), tokenSet(b.title ?? ""));
  score += titleScore * 0.26;
  if (titleScore >= 0.55) reasons.push("similar_title");

  const priceA = normalizePriceToAfn(a.price).amountOriginal;
  const priceB = normalizePriceToAfn(b.price).amountOriginal;
  if (priceA !== null && priceB !== null && Math.max(priceA, priceB) > 0) {
    const distance = Math.abs(priceA - priceB) / Math.max(priceA, priceB);
    if (distance <= 0.08) {
      score += 0.16;
      reasons.push("close_price");
    }
  }

  if (a.province && b.province && normalizeInventoryText(a.province) === normalizeInventoryText(b.province)) {
    score += 0.08;
    reasons.push("same_province");
  }

  if (a.district && b.district && normalizeInventoryText(a.district) === normalizeInventoryText(b.district)) {
    score += 0.08;
    reasons.push("same_district");
  }

  const bounded = Math.min(1, score);
  const confidence = bounded >= 0.78 ? "high_review" : bounded >= 0.5 ? "medium_possible" : "low";
  return { score: bounded, confidence, reasons };
}

export type MarketCellStatus =
  | "cold"
  | "supply_constrained"
  | "demand_constrained"
  | "balanced"
  | "liquid"
  | "saturated_noisy";

export type BootstrapRetirementStage =
  | "none"
  | "ranking_demotion"
  | "quota_reduction"
  | "pause_new_ingestion"
  | "expiry_only"
  | "archive_noindex"
  | "rollback_restore";

export type MarketCellSignals = {
  demandScore: number;
  freshSupplyScore: number;
  searchSuccessRate: number;
  contactRate: number;
  staleRate: number;
  nativeShare: number;
};

export type RetirementPolicy = {
  minTotalSupply: number;
  minNativeOrClaimedShare: number;
  minSearchSuccessRate: number;
  minContactRate: number;
  maxStaleRate: number;
  minFreshNativeWeekly: number;
  rollbackEnabled: boolean;
  rollbackSearchSuccessRate: number;
  rollbackMinTotalSupply: number;
};

export type RetirementSimulationInput = {
  currentStage: BootstrapRetirementStage;
  nativeOrClaimedShare: number;
  searchSuccessRate: number;
  contactRate: number;
  staleRate: number;
  freshNativeWeekly: number;
  totalSupply: number;
  externalUnclaimedSupply: number;
  policy: RetirementPolicy;
};

export type PriceEstimate = {
  status: "ready" | "insufficient_data";
  sampleCount: number;
  confidence: number;
  p25?: number;
  median?: number;
  p75?: number;
  methodology: "asking_price_cohort_trimmed";
};

const STAGE_ORDER: BootstrapRetirementStage[] = [
  "none",
  "ranking_demotion",
  "quota_reduction",
  "pause_new_ingestion",
  "expiry_only",
  "archive_noindex",
];

const clamp01 = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));

export function classifyMarketCell(signals: MarketCellSignals): MarketCellStatus {
  const demand = Math.max(0, signals.demandScore);
  const supply = Math.max(0, signals.freshSupplyScore);
  const success = clamp01(signals.searchSuccessRate);
  const contact = clamp01(signals.contactRate);
  const stale = clamp01(signals.staleRate);
  const native = clamp01(signals.nativeShare);

  if (demand < 1 && supply < 1) return "cold";
  if (stale >= 0.55 || (demand >= 6 && supply < 3)) return "supply_constrained";
  if (supply >= 8 && contact < 0.04 && success >= 0.75) return "demand_constrained";
  if (supply >= 18 && contact < 0.03) return "saturated_noisy";
  if (success >= 0.78 && contact >= 0.08 && native >= 0.55) return "liquid";
  return "balanced";
}

export function getNextBootstrapRetirementStage(input: RetirementSimulationInput): BootstrapRetirementStage {
  const { policy } = input;

  if (
    policy.rollbackEnabled &&
    input.currentStage !== "none" &&
    (input.searchSuccessRate < policy.rollbackSearchSuccessRate || input.totalSupply < policy.rollbackMinTotalSupply)
  ) {
    return "rollback_restore";
  }

  const thresholdsPassed =
    input.totalSupply >= policy.minTotalSupply &&
    input.nativeOrClaimedShare >= policy.minNativeOrClaimedShare &&
    input.searchSuccessRate >= policy.minSearchSuccessRate &&
    input.contactRate >= policy.minContactRate &&
    input.staleRate <= policy.maxStaleRate &&
    input.freshNativeWeekly >= policy.minFreshNativeWeekly;

  if (!thresholdsPassed) return "none";

  const currentIndex = STAGE_ORDER.indexOf(input.currentStage);
  if (currentIndex < 0 || currentIndex >= STAGE_ORDER.length - 1) return input.currentStage;
  return STAGE_ORDER[currentIndex + 1];
}

export function simulateExternalRetirement(input: RetirementSimulationInput) {
  const retainedSupply = Math.max(0, input.totalSupply - Math.max(0, input.externalUnclaimedSupply));
  const retentionRate = input.totalSupply > 0 ? retainedSupply / input.totalSupply : 0;
  const simulatedZeroResultRisk = input.totalSupply > 0
    ? Math.min(1, Math.max(0, 1 - retentionRate) * (1 - clamp01(input.searchSuccessRate)))
    : 1;

  return {
    nextStage: getNextBootstrapRetirementStage(input),
    retainedSupply,
    retentionRate,
    simulatedZeroResultRisk,
  };
}

export function estimatePriceRange(prices: number[], minimumSamples = 8): PriceEstimate {
  const clean = prices
    .filter((price) => Number.isFinite(price) && price > 0)
    .sort((a, b) => a - b);

  if (clean.length < minimumSamples) {
    return {
      status: "insufficient_data",
      sampleCount: clean.length,
      confidence: 0,
      methodology: "asking_price_cohort_trimmed",
    };
  }

  const lower = Math.max(0, Math.floor(clean.length * 0.1));
  const upper = Math.max(lower + 1, Math.ceil(clean.length * 0.9));
  const trimmed = clean.slice(lower, upper);
  const pick = (percentile: number) => {
    const index = Math.min(trimmed.length - 1, Math.max(0, Math.round((trimmed.length - 1) * percentile)));
    return trimmed[index];
  };

  return {
    status: "ready",
    sampleCount: clean.length,
    confidence: Math.min(1, clean.length / 30),
    p25: pick(0.25),
    median: pick(0.5),
    p75: pick(0.75),
    methodology: "asking_price_cohort_trimmed",
  };
}

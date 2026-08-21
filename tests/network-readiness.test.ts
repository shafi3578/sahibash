import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyMarketCell,
  estimatePriceRange,
  getNextBootstrapRetirementStage,
  simulateExternalRetirement,
  type RetirementPolicy,
} from "../lib/network-readiness/market-cells";

const migration = readFileSync(
  join(process.cwd(), "supabase", "migrations", "20260821211630_step3_network_intelligence_foundation.sql"),
  "utf8"
);

const policy: RetirementPolicy = {
  minTotalSupply: 12,
  minNativeOrClaimedShare: 0.65,
  minSearchSuccessRate: 0.7,
  minContactRate: 0.08,
  maxStaleRate: 0.25,
  minFreshNativeWeekly: 3,
  rollbackEnabled: true,
  rollbackSearchSuccessRate: 0.45,
  rollbackMinTotalSupply: 5,
};

test("Step 3 migration creates privacy-safe network intelligence foundation", () => {
  for (const objectName of [
    "market_cell_retirement_policies",
    "market_cell_rollup_runs",
    "price_intelligence_snapshots",
    "admin_market_cell_liquidity",
    "admin_next_best_markets",
    "admin_external_retirement_simulation",
    "admin_price_intelligence_cohorts",
    "admin_listing_trust_quality",
    "admin_source_health",
  ]) {
    assert.match(migration, new RegExp(objectName, "i"));
  }

  assert.match(migration, /with \(security_invoker = true\)/i);
  assert.match(migration, /where\s+[\s\S]*searches_30d >= 3/i);
  assert.match(migration, /bootstrap_retirement_enforcement/i);
  assert.doesNotMatch(migration, /\bdelete\s+from\s+public\.listings\b/i);
});

test("market cell classifier identifies supply constraints and liquid cells", () => {
  assert.equal(
    classifyMarketCell({
      demandScore: 10,
      freshSupplyScore: 1,
      searchSuccessRate: 0.35,
      contactRate: 0.11,
      staleRate: 0.2,
      nativeShare: 0.2,
    }),
    "supply_constrained"
  );

  assert.equal(
    classifyMarketCell({
      demandScore: 7,
      freshSupplyScore: 12,
      searchSuccessRate: 0.84,
      contactRate: 0.12,
      staleRate: 0.1,
      nativeShare: 0.78,
    }),
    "liquid"
  );
});

test("bootstrap retirement advances gradually and rolls back on collapse", () => {
  assert.equal(
    getNextBootstrapRetirementStage({
      currentStage: "none",
      nativeOrClaimedShare: 0.8,
      searchSuccessRate: 0.82,
      contactRate: 0.12,
      staleRate: 0.08,
      freshNativeWeekly: 5,
      totalSupply: 40,
      externalUnclaimedSupply: 10,
      policy,
    }),
    "ranking_demotion"
  );

  assert.equal(
    getNextBootstrapRetirementStage({
      currentStage: "quota_reduction",
      nativeOrClaimedShare: 0.8,
      searchSuccessRate: 0.3,
      contactRate: 0.12,
      staleRate: 0.08,
      freshNativeWeekly: 5,
      totalSupply: 40,
      externalUnclaimedSupply: 10,
      policy,
    }),
    "rollback_restore"
  );
});

test("retirement simulation exposes result-retention risk before enforcement", () => {
  const simulation = simulateExternalRetirement({
    currentStage: "ranking_demotion",
    nativeOrClaimedShare: 0.75,
    searchSuccessRate: 0.8,
    contactRate: 0.1,
    staleRate: 0.1,
    freshNativeWeekly: 6,
    totalSupply: 20,
    externalUnclaimedSupply: 5,
    policy,
  });

  assert.equal(simulation.nextStage, "quota_reduction");
  assert.equal(simulation.retainedSupply, 15);
  assert.ok(simulation.retentionRate > 0.7);
  assert.ok(simulation.simulatedZeroResultRisk < 0.1);
});

test("price intelligence refuses sparse cohorts and trims outliers", () => {
  assert.equal(estimatePriceRange([100, 120, 130]).status, "insufficient_data");

  const estimate = estimatePriceRange([1, 100, 110, 120, 130, 140, 150, 160, 170, 10000]);
  assert.equal(estimate.status, "ready");
  assert.equal(estimate.sampleCount, 10);
  assert.ok((estimate.median ?? 0) < 1000);
  assert.ok(estimate.confidence > 0);
});

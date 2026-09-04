import test from "node:test";
import assert from "node:assert/strict";

import {
  getLastPrimaryAuthenticationTimestamp,
  getMostRecentAuthenticationTimestamp,
  requiresStepUpAuth,
  type StepUpUserLike,
} from "../lib/auth/step-up";

test("getLastPrimaryAuthenticationTimestamp ignores user-editable metadata", () => {
  const user = {
    last_sign_in_at: "2024-01-01T00:00:00.000Z",
    user_metadata: {
      step_up_at: "2024-01-02T00:00:00.000Z",
    },
  } as unknown as StepUpUserLike;

  assert.equal(getLastPrimaryAuthenticationTimestamp(user), new Date("2024-01-01T00:00:00.000Z").getTime());
});

test("requiresStepUpAuth uses the configured window", () => {
  const user = {
    last_sign_in_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  };

  assert.equal(requiresStepUpAuth(user, 15 * 60 * 1000), true);
  assert.equal(requiresStepUpAuth(user, 30 * 60 * 1000), false);
});

test("recent signed TOTP authentication satisfies the step-up freshness window", () => {
  const user = {
    last_sign_in_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  };
  const totpTimestamp = Math.floor((Date.now() - 2 * 60 * 1000) / 1000);

  assert.equal(
    getMostRecentAuthenticationTimestamp(user, [{ method: "totp", timestamp: totpTimestamp }]),
    totpTimestamp * 1000,
  );
  assert.equal(
    requiresStepUpAuth(user, 15 * 60 * 1000, [{ method: "totp", timestamp: totpTimestamp }]),
    false,
  );
});

test("stale or timestamp-free authentication methods cannot bypass step-up", () => {
  const user = {
    last_sign_in_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  };
  const staleTotpTimestamp = Math.floor((Date.now() - 30 * 60 * 1000) / 1000);

  assert.equal(
    requiresStepUpAuth(user, 15 * 60 * 1000, [{ method: "totp", timestamp: staleTotpTimestamp }]),
    true,
  );
  assert.equal(requiresStepUpAuth(user, 15 * 60 * 1000, ["totp"]), true);
  assert.equal(
    requiresStepUpAuth(user, 15 * 60 * 1000, [{ method: "totp", timestamp: Number.NaN }]),
    true,
  );
  assert.equal(
    requiresStepUpAuth(user, 15 * 60 * 1000, [{ method: "token_refresh", timestamp: Date.now() / 1000 }]),
    true,
  );
});

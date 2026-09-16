import assert from "node:assert/strict";
import test from "node:test";

import nextConfig, { securityHeaders } from "../next.config";

test("all application routes receive the required browser security headers", async () => {
  const configured = await nextConfig.headers?.();
  assert.equal(configured?.[0]?.source, "/:path*");

  const values = new Map(securityHeaders.map((header) => [header.key, header.value]));
  for (const name of [
    "Content-Security-Policy",
    "Referrer-Policy",
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Permissions-Policy",
    "Strict-Transport-Security",
  ]) {
    assert.ok(values.has(name), `${name} must be configured`);
  }

  assert.equal(values.get("X-Content-Type-Options"), "nosniff");
  assert.equal(values.get("X-Frame-Options"), "DENY");
  assert.match(values.get("Content-Security-Policy") ?? "", /frame-ancestors 'none'/);
  assert.match(values.get("Content-Security-Policy") ?? "", /object-src 'none'/);
  assert.match(values.get("Content-Security-Policy") ?? "", /https:\/\/\*\.supabase\.co/);
  assert.equal(nextConfig.poweredByHeader, false);
});

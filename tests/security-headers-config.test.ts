import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
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

test("CSP permits the reverse-geocoding origin used by both client posting forms", async () => {
  const configured = await nextConfig.headers?.();
  const csp = configured?.[0]?.headers.find((header) => header.key === "Content-Security-Policy")?.value;
  assert.ok(csp);
  const connectSources = csp.split(";")
    .map((directive) => directive.trim().split(/\s+/))
    .find(([name]) => name === "connect-src")?.slice(1) ?? [];

  for (const relativePath of [
    "app/post-ad/post-ad-form.tsx",
    "app/post-ad/electronics/post-ad-electronics-form.tsx",
  ]) {
    const source = readFileSync(join(process.cwd(), relativePath), "utf8");
    const reverseUrl = source.match(/https:\/\/[^/`\s]+\/reverse\?/u)?.[0];
    assert.ok(reverseUrl, `${relativePath} must expose its reverse-geocoding endpoint`);
    const origin = new URL(reverseUrl).origin;
    assert.ok(connectSources.includes(origin), `${origin} must be permitted for ${relativePath}`);
  }

  assert.ok(!connectSources.includes("*"), "do not permit arbitrary connections");
  assert.ok(!connectSources.includes("https:"), "allow the provider origin, not every HTTPS endpoint");
});

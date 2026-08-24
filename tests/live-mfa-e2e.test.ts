import test from "node:test";
import assert from "node:assert/strict";
import { createHmac, randomBytes } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import {
  canUseAdminPermissionWithAssurance,
  type AuthenticatorAssuranceLevel,
} from "../lib/auth/mfa-authorization";

function readLocalEnv() {
  const candidates = [".env.local", ".env"];
  const parsed: Record<string, string> = {};

  for (const candidate of candidates) {
    if (!existsSync(candidate)) continue;
    const content = readFileSync(candidate, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (!match) continue;
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, "");
      if (!parsed[key]) parsed[key] = value;
    }
  }

  return parsed;
}

function base32Decode(secret: string) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const normalized = secret.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = "";
  const bytes: number[] = [];

  for (const char of normalized) {
    const value = alphabet.indexOf(char);
    if (value < 0) throw new Error("Invalid TOTP secret.");
    bits += value.toString(2).padStart(5, "0");
    while (bits.length >= 8) {
      bytes.push(Number.parseInt(bits.slice(0, 8), 2));
      bits = bits.slice(8);
    }
  }

  return Buffer.from(bytes);
}

function generateTotp(secret: string, unixSeconds = Math.floor(Date.now() / 1000)) {
  const key = base32Decode(secret);
  const counter = Math.floor(unixSeconds / 30);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const digest = createHmac("sha1", key).update(counterBuffer).digest();
  const offset = digest[digest.length - 1] & 0x0f;
  const binary = ((digest[offset] & 0x7f) << 24)
    | ((digest[offset + 1] & 0xff) << 16)
    | ((digest[offset + 2] & 0xff) << 8)
    | (digest[offset + 3] & 0xff);
  return String(binary % 1_000_000).padStart(6, "0");
}

test("live Supabase MFA: AAL1 super admin can view only; AAL2 can mutate", {
  skip: process.env.RUN_LIVE_SUPABASE_MFA_E2E !== "1"
    ? "Set RUN_LIVE_SUPABASE_MFA_E2E=1 to run the live Supabase Auth MFA flow."
    : false,
}, async () => {
  const env = { ...readLocalEnv(), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
  assert.ok(url, "NEXT_PUBLIC_SUPABASE_URL is required");
  assert.ok(anonKey, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required");
  assert.ok(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY is required");

  const admin = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const email = `sahibash-mfa-e2e-${Date.now()}-${randomBytes(3).toString("hex")}@example.invalid`;
  const password = `${randomBytes(18).toString("base64url")}Aa1!`;
  let userId: string | null = null;

  try {
    const { data: createdUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: "Sahibash MFA E2E",
        phone: "+93700000000",
        preferred_language: "fa",
      },
    });
    assert.ifError(createError);
    userId = createdUser.user?.id ?? null;
    assert.ok(userId, "temporary user id returned");

    const { data: superRole, error: roleError } = await admin
      .from("admin_roles")
      .select("id")
      .eq("name", "super_administrator")
      .single();
    assert.ifError(roleError);
    assert.ok(superRole?.id, "super administrator role exists");

    const { error: profileError } = await admin
      .from("profiles")
      .upsert({
        id: userId,
        full_name: "Sahibash MFA E2E",
        phone: "+93700000000",
        role: "admin",
        preferred_language: "fa",
      }, { onConflict: "id" });
    assert.ifError(profileError);

    const { error: assignError } = await admin
      .from("admin_user_roles")
      .insert({ user_id: userId, role_id: superRole.id });
    assert.ifError(assignError);

    const userClient = createClient(url, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { error: signInError } = await userClient.auth.signInWithPassword({ email, password });
    assert.ifError(signInError);

    const [{ data: readAllowed }, { data: mutateAllowed }, aalBefore] = await Promise.all([
      userClient.rpc("has_admin_permission", { uid: userId, permission_key: "roles.view" }),
      userClient.rpc("has_admin_permission", { uid: userId, permission_key: "roles.manage" }),
      userClient.auth.mfa.getAuthenticatorAssuranceLevel(),
    ]);
    assert.equal(readAllowed, true, "temporary super admin has read permission by RBAC");
    assert.equal(mutateAllowed, true, "temporary super admin has mutation permission by RBAC");
    assert.equal(aalBefore.error, null);
    assert.equal(aalBefore.data?.currentLevel, "aal1");
    assert.equal(canUseAdminPermissionWithAssurance({
      permission: "roles.view",
      hasPermission: readAllowed === true,
      currentLevel: aalBefore.data?.currentLevel as AuthenticatorAssuranceLevel,
    }), true);
    assert.equal(canUseAdminPermissionWithAssurance({
      permission: "roles.manage",
      hasPermission: mutateAllowed === true,
      currentLevel: aalBefore.data?.currentLevel as AuthenticatorAssuranceLevel,
    }), false);

    const { data: enrollment, error: enrollError } = await userClient.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Sahibash MFA E2E",
    });
    assert.ifError(enrollError);
    assert.equal(enrollment?.type, "totp");
    assert.ok(enrollment?.id);
    assert.ok(enrollment?.totp?.secret);

    const { data: challenge, error: challengeError } = await userClient.auth.mfa.challenge({
      factorId: enrollment.id,
    });
    assert.ifError(challengeError);
    assert.ok(challenge?.id);

    const { error: verifyError } = await userClient.auth.mfa.verify({
      factorId: enrollment.id,
      challengeId: challenge.id,
      code: generateTotp(enrollment.totp.secret),
    });
    assert.ifError(verifyError);

    const { data: aalAfter, error: aalAfterError } = await userClient.auth.mfa.getAuthenticatorAssuranceLevel();
    assert.ifError(aalAfterError);
    assert.equal(aalAfter?.currentLevel, "aal2");
    assert.equal(canUseAdminPermissionWithAssurance({
      permission: "roles.manage",
      hasPermission: mutateAllowed === true,
      currentLevel: aalAfter?.currentLevel as AuthenticatorAssuranceLevel,
    }), true);

    const { data: verifiedFactors, error: factorsError } = await userClient.auth.mfa.listFactors();
    assert.ifError(factorsError);
    const verifiedTotpFactors = (verifiedFactors?.all ?? [])
      .filter((factor) => factor.factor_type === "totp" && factor.status === "verified");
    assert.equal(verifiedTotpFactors.length, 1);
  } finally {
    if (userId) {
      await admin.from("admin_user_roles").delete().eq("user_id", userId);
      await admin.from("profiles").delete().eq("id", userId);
      await admin.auth.admin.deleteUser(userId);
    }
  }
});

import { isProductionRuntime, type FixtureGuardEnvironment } from "../listings/fixture-guard";

// Public production identity documented in docs/PRODUCTION_IDENTITY_AUDIT.md.
const PRODUCTION_PROJECT_REF = "sbtzkniuquewrtctsdpy";

export function assertNonProductionSupabaseFixtureTarget(
  url: string,
  env: FixtureGuardEnvironment = process.env,
) {
  if (isProductionRuntime(env) || env.NODE_ENV === "production") {
    throw new Error("Synthetic Auth fixtures are forbidden in production.");
  }

  const target = new URL(url);
  const projectRef = target.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/)?.[1];
  if (projectRef === PRODUCTION_PROJECT_REF) {
    throw new Error("Synthetic Auth fixtures are forbidden on the production Supabase project.");
  }
  if (!["http:", "https:"].includes(target.protocol) || target.username || target.password
    || target.pathname !== "/" || target.search || target.hash) {
    throw new Error("Synthetic Auth fixtures require a canonical Supabase project URL.");
  }
  if (["localhost", "127.0.0.1", "[::1]"].includes(target.hostname)) return;

  // Remote execution requires explicit operator confirmation of a disposable project.
  if (target.protocol !== "https:" || target.port || !projectRef
    || env.SAHIBASH_ENV !== "test" || env.SAHIBASH_TEST_SUPABASE_PROJECT_REF !== projectRef) {
    throw new Error("Remote Auth fixtures require SAHIBASH_ENV=test and a matching SAHIBASH_TEST_SUPABASE_PROJECT_REF.");
  }
}

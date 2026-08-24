import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-stale-*/**",
    ".vercel/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Retained legacy posting experiments now redirected to the canonical flow.
    "components/posting/BrandModelSelector.tsx",
    "components/posting/FieldRenderer.tsx",
    "components/posting/LocationModal.tsx",
    "components/posting/NewPostingForm.tsx",
    "components/posting/NewPostingFormv2.tsx",
    "components/posting/SellingMethodSelector.tsx",
    "components/posting/Step*.tsx",
    // Local diagnostics are intentionally outside the production source tree.
    "app/**/debug/**",
    "__tmp_*.mjs",
    "create_super_admin.js",
    "find_or_create_super_admin.js",
    "query_site_settings.js",
    "tmp-*.js",
    "verify_super_admin_email.js",
  ]),
]);

export default eslintConfig;

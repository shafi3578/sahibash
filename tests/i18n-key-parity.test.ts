import assert from "node:assert/strict";
import test from "node:test";
import { SUPPORTED_LOCALES, TRANSLATIONS, type AppLocale } from "@/lib/i18n/translations";
import { UI_TRANSLATIONS } from "@/lib/i18n/ui";
import { localizePath } from "@/lib/i18n/routing";
import { localizeActionMessage, localizeAuthError, USER_COPY } from "@/lib/i18n/user-copy";
import { USER_EVENT_TEMPLATES } from "@/lib/i18n/system-templates";
import { buildLocalizedMetadata } from "@/lib/i18n/metadata";
import { localizeCategoryName } from "@/lib/i18n/category-labels";

type JsonMap = Record<string, unknown>;

function isRecord(value: unknown): value is JsonMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectLeafPaths(input: unknown, prefix = ""): string[] {
  if (!isRecord(input)) return [];
  const paths: string[] = [];
  for (const key of Object.keys(input)) {
    const next = prefix ? `${prefix}.${key}` : key;
    const value = (input as JsonMap)[key];
    if (isRecord(value)) {
      paths.push(...collectLeafPaths(value, next));
      continue;
    }
    paths.push(next);
  }
  return paths;
}

function getValueAtPath(input: JsonMap, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (!isRecord(acc)) return undefined;
    return acc[part];
  }, input);
}

function assertParityForTree(name: string, tree: Record<AppLocale, JsonMap>) {
  const baseLocale: AppLocale = "en";
  const basePaths = collectLeafPaths(tree[baseLocale]);
  const baseSet = new Set(basePaths);

  for (const locale of SUPPORTED_LOCALES) {
    const localePaths = collectLeafPaths(tree[locale]);
    const localeSet = new Set(localePaths);

    const missing = [...baseSet].filter((path) => !localeSet.has(path));
    const extra = [...localeSet].filter((path) => !baseSet.has(path));

    assert.deepEqual(
      missing,
      [],
      `${name} is missing keys in ${locale}: ${missing.join(", ")}`
    );
    assert.deepEqual(
      extra,
      [],
      `${name} has extra keys in ${locale}: ${extra.join(", ")}`
    );

    for (const path of basePaths) {
      const value = getValueAtPath(tree[locale], path);
      assert.equal(
        typeof value,
        "string",
        `${name} has non-string value at ${locale}.${path}`
      );
      assert.notEqual(
        String(value).trim(),
        "",
        `${name} has empty translation at ${locale}.${path}`
      );
    }
  }
}

test("core translation tree keys are complete across locales", () => {
  assertParityForTree(
    "TRANSLATIONS",
    TRANSLATIONS as unknown as Record<AppLocale, JsonMap>
  );
});

test("UI translation tree keys are complete across locales", () => {
  assertParityForTree(
    "UI_TRANSLATIONS",
    UI_TRANSLATIONS as unknown as Record<AppLocale, JsonMap>
  );
});

test("Dari and Pashto translations do not silently reuse English copy", () => {
  const allowedTechnicalPlaceholders = new Set([
    "resetPassword.emailPlaceholder",
    "waitlist.emailPlaceholder",
  ]);

  for (const [name, tree] of [
    ["TRANSLATIONS", TRANSLATIONS],
    ["UI_TRANSLATIONS", UI_TRANSLATIONS],
  ] as const) {
    const englishPaths = collectLeafPaths(tree.en);
    for (const locale of ["fa", "ps"] as const) {
      const copied = englishPaths.filter((path) =>
        !allowedTechnicalPlaceholders.has(path)
        && getValueAtPath(tree.en, path) === getValueAtPath(tree[locale], path)
      );
      assert.deepEqual(copied, [], `${name} contains English fallback copy in ${locale}: ${copied.join(", ")}`);
    }
  }
});

test("generic launch category leaves do not fall back to English", () => {
  const leaves = [
    ["furnished-apartment", "Furnished Apartment"],
    ["washing-machine", "Washing Machine"],
    ["bicycle-parts", "Bicycle Parts"],
    ["motorcycle-parts", "Motorcycle Parts"],
    ["other-toyota-model", "Other Toyota Model"],
  ] as const;

  for (const [slug, fallbackName] of leaves) {
    for (const locale of ["fa", "ps"] as const) {
      assert.notEqual(localizeCategoryName({ locale, slug, fallbackName }), fallbackName);
    }
  }
  assert.equal(localizeCategoryName({ locale: "fa", slug: "toyota", fallbackName: "Toyota" }), "Toyota");
});

test("English dictionary contains English copy", () => {
  const nonAsciiCore = collectLeafPaths(TRANSLATIONS.en).filter((path) =>
    /[^\x00-\x7F]/.test(String(getValueAtPath(TRANSLATIONS.en, path)))
  );
  assert.deepEqual(nonAsciiCore, []);
});

test("localized route helper replaces an existing locale and preserves queries", () => {
  assert.equal(localizePath("/fa/search?q=toyota", "ps"), "/ps/search?q=toyota");
  assert.equal(localizePath("/listings/123", "en"), "/en/listings/123");
  assert.equal(localizePath("/ps", "fa"), "/fa");
});

test("normal-user errors never expose provider English in Dari or Pashto", () => {
  assert.equal(localizeAuthError("Invalid login credentials", "fa"), USER_COPY.fa.errors.invalidCredentials);
  assert.equal(localizeAuthError("Email not confirmed", "ps"), USER_COPY.ps.errors.emailNotConfirmed);
  assert.equal(localizeActionMessage("Must select a category", "fa"), "انتخاب دسته‌بندی الزامی است.");
  assert.equal(localizeActionMessage("Please add a location before publishing your ad.", "ps"), "د اعلان له خپرولو مخکې ځای ورزیات کړئ.");
});

test("normal-user email and notification events have complete locale templates", () => {
  assertParityForTree("USER_EVENT_TEMPLATES", USER_EVENT_TEMPLATES as unknown as Record<AppLocale, JsonMap>);
  for (const locale of ["fa", "ps"] as const) {
    for (const event of Object.keys(USER_EVENT_TEMPLATES.en) as Array<keyof typeof USER_EVENT_TEMPLATES.en>) {
      assert.notEqual(USER_EVENT_TEMPLATES[locale][event].subject, USER_EVENT_TEMPLATES.en[event].subject);
      assert.notEqual(USER_EVENT_TEMPLATES[locale][event].body, USER_EVENT_TEMPLATES.en[event].body);
    }
  }
});

test("localized metadata preserves route and exposes canonical language alternates", () => {
  const metadata = buildLocalizedMetadata("ps", ["search"]);
  assert.equal(metadata.alternates?.canonical, "/ps/search");
  assert.deepEqual(metadata.alternates?.languages, {
    en: "/en/search",
    "fa-AF": "/fa/search",
    "ps-AF": "/ps/search",
    "x-default": "/en/search",
  });
});

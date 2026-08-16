import type { AppLocale } from "@/lib/i18n/translations";
import type { Metadata } from "next";
import { localizePath } from "@/lib/i18n/routing";
import { USER_COPY, type UserInfoPage } from "@/lib/i18n/user-copy";

export const SITE_METADATA: Record<AppLocale, { titleSuffix: string; description: string }> = {
  en: {
    titleSuffix: "Buy and Sell in Afghanistan",
    description: "Afghanistan's trusted marketplace for vehicles, real estate, electronics, services, jobs, and second-hand items.",
  },
  fa: {
    titleSuffix: "خرید و فروش در افغانستان",
    description: "بازار آنلاین قابل اعتماد افغانستان برای وسایط، املاک، الکترونیک، خدمات، وظایف و اجناس دست دوم.",
  },
  ps: {
    titleSuffix: "په افغانستان کې پېر او پلور",
    description: "د موټرو، املاکو، الکترونیک، خدمتونو، دندو او دوهم لاس توکو لپاره د افغانستان باوري آنلاین بازار.",
  },
};

const ROUTE_TITLES: Record<AppLocale, Record<string, string>> = {
  en: { search: "Search listings", categories: "Browse categories", "post-ad": "Post an ad", login: "Sign in", register: "Create account", dashboard: "My account", listings: "Listings" },
  fa: { search: "جستجوی اعلان‌ها", categories: "مرور دسته‌بندی‌ها", "post-ad": "ثبت اعلان", login: "ورود", register: "ساخت حساب", dashboard: "حساب من", listings: "اعلان‌ها" },
  ps: { search: "اعلانونه ولټوئ", categories: "کټګورۍ وګورئ", "post-ad": "اعلان ثبت کړئ", login: "ننوتل", register: "حساب جوړول", dashboard: "زما حساب", listings: "اعلانونه" },
};

export function buildLocalizedMetadata(locale: AppLocale, slug: string[] = []): Metadata {
  const path = slug.length ? `/${slug.join("/")}` : "/";
  const section = slug[0] ?? "";
  const info = (["privacy", "terms", "safety", "contact"] as UserInfoPage[]).includes(section as UserInfoPage)
    ? USER_COPY[locale].info[section as UserInfoPage]
    : null;
  const title = info?.title ?? ROUTE_TITLES[locale][section] ?? SITE_METADATA[locale].titleSuffix;
  const description = info?.intro ?? SITE_METADATA[locale].description;
  const canonical = localizePath(path, locale);
  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: localizePath(path, "en"),
        "fa-AF": localizePath(path, "fa"),
        "ps-AF": localizePath(path, "ps"),
        "x-default": localizePath(path, "en"),
      },
    },
    openGraph: { title, description, type: "website", locale: locale === "en" ? "en_US" : locale === "fa" ? "fa_AF" : "ps_AF" },
  };
}

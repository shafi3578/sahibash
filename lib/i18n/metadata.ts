import type { AppLocale } from "@/lib/i18n/translations";

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

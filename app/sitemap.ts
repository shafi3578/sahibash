import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://justujo.com";
  return ["en", "fa", "ps"].flatMap((locale) =>
    ["", "/search", "/categories"].map((path) => ({
      url: `${base}/${locale}${path}`,
      lastModified: new Date(),
      changeFrequency: path ? ("daily" as const) : ("hourly" as const),
      priority: path ? 0.8 : 1,
    })),
  );
}

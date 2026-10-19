import type {MetadataRoute} from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/administrator/", "/dashboard/", "/api/"] },
    sitemap: "https://justujo.com/sitemap.xml",
  };
}

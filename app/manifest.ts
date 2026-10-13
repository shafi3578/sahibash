import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Justujo Afghanistan Marketplace", short_name: "Justujo", description: "Buy and sell across Afghanistan in English, Dari and Pashto.", start_url: "/", display: "standalone", background_color: "#f6f7fb", theme_color: "#15162e", orientation: "portrait-primary", icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }] };
}

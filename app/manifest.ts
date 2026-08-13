import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return { name: "Sahibash Afghanistan Marketplace", short_name: "Sahibash", description: "Buy and sell across Afghanistan in English, Dari and Pashto.", start_url: "/", display: "standalone", background_color: "#fff9ec", theme_color: "#ffc92f", orientation: "portrait-primary", icons: [{ src: "/favicon.ico", sizes: "any", type: "image/x-icon" }] };
}

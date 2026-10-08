import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// Crawl everything but the API routes, and here's the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}

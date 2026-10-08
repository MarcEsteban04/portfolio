import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";
import { siteUrl } from "@/lib/site";

// Every page, for search engines: the overview first, then the case studies
// and the other pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...projects.map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${siteUrl}/uses`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${siteUrl}/contributions`, lastModified: now, changeFrequency: "daily", priority: 0.5 },
    { url: `${siteUrl}/desk`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}

import { MetadataRoute } from "next";
import { competitorSlugs } from "@/data/competitors";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://mina-rich-editor.vercel.app"; // Update with your actual domain

  const comparisons: MetadataRoute.Sitemap = competitorSlugs.map((slug) => ({
    url: `${baseUrl}/compare/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...comparisons,
  ];
}


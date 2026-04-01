import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://inflyio.com",         lastModified: new Date(), changeFrequency: "weekly",  priority: 1   },
    { url: "https://inflyio.com/auth",    lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://inflyio.com/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];
}
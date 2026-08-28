import type { MetadataRoute } from "next";
import { publicNavItems } from "@/data/official/navigation";
import { services } from "@/data/official/services";
import { SITE_URL } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = [
    ...publicNavItems.map((item) => item.href),
    "/privacidade",
    ...services.map((service) => `/servicos/${service.slug}`),
  ];

  return publicRoutes.map((path) => ({
    url: new URL(path, SITE_URL).toString(),
    changeFrequency: "monthly" as const,
    priority: path === "/" ? 1 : 0.6,
  }));
}

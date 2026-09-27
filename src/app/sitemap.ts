import type { MetadataRoute } from "next";
import { guideSlugs } from "@/content/guide-navigation";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/explorar",
    "/galeria",
    "/guia",
    "/ciencia",
    "/privacidade",
    "/guia/comparar",
    "/guia/como-fotografar",
    "/guia/fontes",
    ...Object.values(guideSlugs).map((slug) => `/guia/${slug}`),
  ].map((path) => ({
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://mapadosipes.com.br"}${path}`,
  }));
}

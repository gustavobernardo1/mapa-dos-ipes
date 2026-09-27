import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mapa dos Ipês — Goiânia",
    short_name: "Mapa dos Ipês",
    description: "Fotografe e ajude a mapear a florada de Goiânia.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f9f5",
    theme_color: "#214b3c",
    lang: "pt-BR",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

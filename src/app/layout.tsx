import type { Metadata, Viewport } from "next";
import { Navigation } from "@/components/navigation";
import "./globals.css";
export const metadata: Metadata = {
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://mapadosipes.com.br",
  ),
  title: { default: "Mapa dos Ipês — Goiânia", template: "%s | Mapa dos Ipês" },
  description:
    "Descubra, fotografe e ajude a mapear a florada dos ipês de Goiânia.",
  openGraph: {
    title: "Mapa dos Ipês — Goiânia",
    description:
      "Descubra, fotografe e ajude a mapear a florada dos ipês de Goiânia.",
    locale: "pt_BR",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  appleWebApp: {
    capable: true,
    title: "Mapa dos Ipês",
    statusBarStyle: "default",
  },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#214b3c",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <Navigation />
        {children}
      </body>
    </html>
  );
}

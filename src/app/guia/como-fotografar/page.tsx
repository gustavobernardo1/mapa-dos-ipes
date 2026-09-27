import type { Metadata } from "next";
import Link from "next/link";
import { GuidePhotography } from "@/components/guide-photography";
export const metadata: Metadata = { title: "Como fotografar uma árvore" };
export default function Page() {
  return (
    <main id="conteudo">
      <nav className="fg-breadcrumb" aria-label="Caminho">
        <Link href="/guia">Guia</Link>
        <span aria-hidden="true">/</span>
        <span>Como fotografar</span>
      </nav>
      <GuidePhotography />
    </main>
  );
}

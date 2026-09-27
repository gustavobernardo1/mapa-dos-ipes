import type { Metadata } from "next";
import Link from "next/link";
import { GuideComparator } from "@/components/guide-comparator";
export const metadata: Metadata = { title: "Comparar espécies" };
export default function Page() {
  return (
    <main id="conteudo">
      <nav className="fg-breadcrumb" aria-label="Caminho">
        <Link href="/guia">Guia</Link>
        <span aria-hidden="true">/</span>
        <span>Comparar espécies</span>
      </nav>
      <GuideComparator />
    </main>
  );
}

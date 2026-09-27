import type { Metadata } from "next";
import Link from "next/link";
import { Leaf, ArrowRight } from "lucide-react";
import { guide } from "@/content/guide";
import { treePhoto } from "@/content/guide-navigation";
import { GuidePhoto } from "@/components/guide-photo";
import { GuideCard } from "@/components/guide-card";
import { GuidePhotography } from "@/components/guide-photography";
export const metadata: Metadata = {
  title: "Guia de identificação",
  description:
    "Reconheça os ipês pelas pistas visuais e aprofunde a identificação quando quiser.",
};
export default function Page() {
  return (
    <main id="conteudo">
      <header className="fg-hero">
        <div>
          <span className="eyebrow">
            <Leaf size={16} aria-hidden="true" /> UM GUIA PARA OLHAR MAIS DE
            PERTO
          </span>
          <h1>Como reconhecer um ipê?</h1>
          <p>
            A cor sozinha não identifica a espécie. Observe a árvore inteira, as
            flores, as folhas e a casca.
          </p>
          <div className="fg-hero-actions">
            <a className="btn btn-primary" href="#especies">
              Explorar espécies <ArrowRight size={17} aria-hidden="true" />
            </a>
            <Link className="fg-text-link" href="/guia/como-fotografar">
              Como fotografar
            </Link>
          </div>
        </div>
        <div className="fg-hero-photo">
          <GuidePhoto
            photo={treePhoto("rosa")}
            label="Referência de copa — ipê-rosa"
            eager
          />
        </div>
      </header>
      <section id="especies" aria-labelledby="especies-titulo">
        <div className="fg-section-heading">
          <span className="eyebrow">COMECE PELO QUE VOCÊ VÊ</span>
          <h2 id="especies-titulo">Conheça os ipês</h2>
        </div>
        <div className="fg-grid">
          {guide
            .filter((p) => p.category === "ipe")
            .map((p) => (
              <GuideCard key={p.id} profile={p} />
            ))}
        </div>
      </section>
      <section aria-labelledby="semelhantes-titulo">
        <div className="fg-section-heading">
          <h2 id="semelhantes-titulo">Pode confundir com</h2>
          <p>Compare as pistas antes de escolher um nome.</p>
        </div>
        <div className="fg-grid fg-grid-similar">
          {guide
            .filter((p) => p.category === "similar")
            .map((p) => (
              <GuideCard key={p.id} profile={p} small />
            ))}
        </div>
        <Link
          href="/guia/comparar"
          className="btn btn-primary fg-section-action"
        >
          Comparar espécies <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>
      <GuidePhotography summary />
    </main>
  );
}

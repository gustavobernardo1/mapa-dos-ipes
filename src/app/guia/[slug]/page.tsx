import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  guide,
  guideImages,
  guideSources,
  photoParts,
  factLabels,
  whiteComparison,
  type FactKey,
} from "@/content/guide";
import {
  guideSlugs,
  treePhoto,
  quickKeys,
  similarProfiles,
} from "@/content/guide-navigation";
import { GuidePhoto } from "@/components/guide-photo";
import { GuideFact, SourceLinks } from "@/components/guide-fact";
import { GuideCard } from "@/components/guide-card";
export const dynamicParams = false;
export function generateStaticParams() {
  return guide.map((p) => ({ slug: guideSlugs[p.id] }));
}
const profile = (slug: string) => guide.find((p) => guideSlugs[p.id] === slug);
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const p = profile((await params).slug);
  return {
    title: p ? `${p.name} — guia de identificação` : "Espécie não encontrada",
  };
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = profile((await params).slug);
  if (!p) notFound();
  const sources = [
    ...new Set([
      ...p.taxonomySources,
      ...p.note.sources,
      ...p.clue.sources,
      ...Object.values(p.facts).flatMap((f) => f.sources),
    ]),
  ];
  const similar = similarProfiles(p.id);
  return (
    <main id="conteudo">
      <nav className="fg-breadcrumb" aria-label="Caminho">
        <Link href="/guia">Guia</Link>
        <span aria-hidden="true">/</span>
        <span>{p.name}</span>
      </nav>
      <header className="fg-hero fg-species-hero">
        <div>
          <span className="eyebrow">UM OLHAR MAIS ATENTO</span>
          <h1>{p.name}</h1>
          <p className="fg-taxon">
            <i>{p.taxon}</i>
          </p>
          <p>{p.clue.text}</p>
          <Link href="/guia/comparar" className="fg-text-link">
            Comparar espécies
          </Link>
        </div>
        <GuidePhoto
          photo={treePhoto(p.id)}
          label={`Árvore / copa — ${p.name}`}
          eager
        />
      </header>
      <section aria-labelledby="galeria-titulo">
        <div className="fg-section-heading">
          <h2 id="galeria-titulo">Veja cada parte</h2>
          <p>
            As referências de copa disponíveis nem sempre mostram a árvore
            inteira. Fotos ausentes continuam sinalizadas.
          </p>
        </div>
        <div
          className="fg-gallery"
          role="region"
          aria-label="Galeria de partes da árvore"
          tabIndex={0}
        >
          {Object.entries(photoParts).map(([part, label]) => (
            <GuidePhoto
              key={part}
              photo={guideImages.find(
                (i) => i.profile === p.id && i.part === part,
              )}
              label={label}
              compact
            />
          ))}
        </div>
      </section>
      <section aria-labelledby="rapido-titulo">
        <div className="fg-section-heading">
          <h2 id="rapido-titulo">Reconheça rapidamente</h2>
        </div>
        <div className="fg-quick-grid">
          {quickKeys.map((key) => (
            <article key={key}>
              <h3>{factLabels[key]}</h3>
              <GuideFact value={p.facts[key]} showSources={false} />
            </article>
          ))}
        </div>
        <p className="fg-caption-note">
          Pistas para o táxon de referência; não são uma identificação
          definitiva. Referências em “Fontes”, abaixo.
        </p>
      </section>
      <section aria-labelledby="confusao-titulo">
        <div className="fg-section-heading">
          <h2 id="confusao-titulo">Pode confundir com</h2>
          <p>{p.confusion}</p>
        </div>
        {similar.length > 0 && (
          <div className="fg-grid fg-grid-similar">
            {similar.map((other) => (
              <GuideCard key={other.id} profile={other} small />
            ))}
          </div>
        )}
        {p.id === "branco" && (
          <div className="fg-grid fg-grid-similar">
            <article className="fg-card fg-card-small">
              <GuidePhoto label="Árvore / copa — Tabebuia elliptica" compact />
              <div className="fg-card-content">
                <h3>
                  <i>Tabebuia elliptica</i>
                </h3>
                <p>{whiteComparison[1].b.text}</p>
                <Link className="fg-card-link" href="/guia/comparar">
                  Comparar espécies
                </Link>
              </div>
            </article>
          </div>
        )}
      </section>
      <section className="fg-season" aria-labelledby="floracao-titulo">
        <h2 id="floracao-titulo">Quando costuma florescer</h2>
        <GuideFact value={p.facts.season} />
        <GuideFact value={p.facts.duration} />
      </section>
      <details className="fg-disclosure">
        <summary>Identificação detalhada</summary>
        <div className="fg-profile-details">
          <h3>Identificação e nomes</h3>
          <p>
            <strong>Família:</strong> {p.family}
          </p>
          <p>
            <strong>Nome científico:</strong> <i>{p.taxon}</i>
          </p>
          <p>
            <strong>Sinônimos relevantes:</strong>{" "}
            {p.synonyms.length
              ? p.synonyms.join("; ")
              : "Nenhum listado nesta versão; levantamento nomenclatural complementar pendente."}
          </p>
          <SourceLinks ids={p.taxonomySources} />
          <GuideFact value={p.note} />
          <dl>
            {(Object.keys(factLabels) as FactKey[]).map((key) => (
              <div key={key}>
                <dt>{factLabels[key]}</dt>
                <dd>
                  <GuideFact value={p.facts[key]} />
                </dd>
              </div>
            ))}
          </dl>
          <h3>O que fotografar</h3>
          <p>
            {p.photoTip} Se possível, inclua árvore inteira, flor, folha, casca,
            fruto e base do tronco. São sugestões de documentação, não
            requisitos para cadastrar.
          </p>
          <Link href="/guia/como-fotografar" className="fg-text-link">
            Ver dicas para fotografar
          </Link>
        </div>
      </details>
      <details className="fg-disclosure">
        <summary>Fontes</summary>
        <div className="fg-source-list">
          <p>
            Informações para este táxon, com limites regionais. Identificação
            declarada pela fonte das fotos; revisão botânica das imagens
            pendente. Estas fotos não são observações das árvores do mapa.
          </p>
          <ul>
            {sources.map((id) => (
              <li key={id}>
                <a href={guideSources[id].url} target="_blank" rel="noreferrer">
                  {guideSources[id].title}
                </a>
                <small>{guideSources[id].scope}</small>
              </li>
            ))}
          </ul>
          <Link href="/guia/fontes" className="fg-text-link">
            Fontes e metodologia do guia
          </Link>
        </div>
      </details>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { guide, guideImages, guideSources } from "@/content/guide";
export const metadata: Metadata = { title: "Fontes e metodologia do guia" };
export default function Page() {
  return (
    <main id="conteudo">
      <nav className="fg-breadcrumb" aria-label="Caminho">
        <Link href="/guia">Guia</Link>
        <span aria-hidden="true">/</span>
        <span>Fontes e metodologia</span>
      </nav>
      <header className="fg-section-heading">
        <span className="eyebrow">UM GUIA BASEADO EM EVIDÊNCIAS</span>
        <h1>Fontes e metodologia</h1>
        <p>
          Taxonomia: Flora e Funga do Brasil / JBRJ, incluindo sua lista oficial
          no GBIF. Características: Embrapa, tratamentos científicos e fontes
          institucionais. Consulta em 27/09/2026.
        </p>
      </header>
      <section id="revisao" className="fg-method-section">
        <h2>Guia em revisão botânica.</h2>
        <p>
          Conteúdo editorial provisório — revisão botânica necessária. Guia
          educativo baseado em fontes, sem identificação automática. Nomes
          populares podem abranger mais de uma espécie. Informações ainda não
          verificadas estão sinalizadas nas fichas.
        </p>
        <p>
          Todas as sete fichas são parciais. Calendário de Goiânia, duração da
          florada e identificação das fotografias precisam de revisão humana. As
          fontes verificadas e as lacunas permanecem acessíveis.
        </p>
      </section>
      <section className="fg-method-section">
        <h2>Como organizamos as informações</h2>
        <p>
          Reconhecimento visual → pistas rápidas → comparação → informação
          botânica completa → fontes e metodologia. Cada fato mantém suas
          referências; os detalhes aparecem quando você decide aprofundar.
        </p>
        <p>
          Fichas de nomes populares descrevem táxons de referência explícitos.
          Rosa e roxo se sobrepõem; a ficha amarela não descreve automaticamente
          todos os ipês-amarelos. Períodos e alturas de outras regiões não viram
          estimativas para Goiânia.
        </p>
      </section>
      <section className="fg-source-list">
        <h2>Fontes botânicas</h2>
        <ul>
          {Object.entries(guideSources).map(([id, s]) => (
            <li key={id}>
              <a href={s.url} target="_blank" rel="noreferrer">
                {s.title}
              </a>
              <small>{s.scope}</small>
            </li>
          ))}
        </ul>
      </section>
      <section className="fg-method-section">
        <h2>Fotografias e licenças</h2>
        <p>
          Fotos de referência, independentes das árvores municipais. Autoria e
          licença são verificadas por arquivo; não adotamos fotografias de
          licença duvidosa. Derivados redimensionados em WebP, com enquadramento
          de apresentação variável. Os dois arquivos de H. Zell mantêm CC BY-SA
          3.0.
        </p>
        <details className="fg-disclosure">
          <summary>Ver créditos das {guideImages.length} fotografias</summary>
          <ul className="fg-image-credits">
            {guideImages.map((i) => (
              <li key={i.id}>
                <strong>
                  {guide.find((p) => p.id === i.profile)?.name} · {i.part}
                </strong>
                <span>
                  Foto:{" "}
                  <a href={i.sourceUrl} target="_blank" rel="noreferrer">
                    {i.author}
                  </a>{" "}
                  —{" "}
                  <a href={i.licenseUrl} target="_blank" rel="noreferrer">
                    {i.license}
                  </a>
                </span>
                <small>{i.changes}</small>
              </li>
            ))}
          </ul>
        </details>
      </section>
      <aside className="fg-provenance">
        <h2>Um nome no cadastro é uma pista histórica.</h2>
        <p>
          Descrição municipal não é confirmação taxonômica. Cor cadastrada não é
          floração observada. Existência cadastral não é existência atual. As
          correspondências de nomes do guia não alteram a origem dos registros.
        </p>
        <p>
          Observar → consultar o guia → fotografar características → registrar →
          moderação → dados mais confiáveis.
        </p>
      </aside>
    </main>
  );
}

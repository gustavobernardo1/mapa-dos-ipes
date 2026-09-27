"use client";
import { useState } from "react";
import Link from "next/link";
import {
  guide,
  guideImages,
  factLabels,
  whiteComparison,
  type FactKey,
} from "@/content/guide";
import { quickKeys } from "@/content/guide-navigation";
import { GuideFact } from "./guide-fact";
import { GuidePhoto } from "./guide-photo";
const keys: FactKey[] = [
  "foliage",
  "flower",
  "arrangement",
  "leaves",
  "bark",
  "size",
  "canopy",
  "fruit",
  "season",
];
const presets = [
  ["amarelo", "sibipiruna"],
  ["amarelo", "chuva-de-ouro"],
  ["amarelo", "ipe-de-jardim"],
  ["rosa", "roxo"],
];
const parts = [
  ["arvore", "Árvore / copa"],
  ["flor", "Flor"],
  ["folha", "Folha"],
  ["fruto", "Fruto"],
];
export function GuideComparator() {
  const [aId, setA] = useState("amarelo"),
    [bId, setB] = useState("sibipiruna");
  const [white, setWhite] = useState(false);
  const a = guide.find((p) => p.id === aId)!,
    b = guide.find((p) => p.id === bId)!;
  const same = aId === bId;
  const overlapping =
    [aId, bId].includes("rosa") && [aId, bId].includes("roxo");
  const aName = white ? "Ipê-branco" : a.name,
    bName = white ? "Tabebuia elliptica" : b.name;
  const quick = white
    ? whiteComparison.slice(1)
    : quickKeys.map((key) => ({
        label: factLabels[key],
        a: a.facts[key],
        b: b.facts[key],
      }));
  return (
    <section
      className="fg-comparator"
      id="comparar"
      aria-labelledby="comparar-titulo"
    >
      <header className="fg-section-heading">
        <span className="eyebrow">OLHE LADO A LADO</span>
        <h1 id="comparar-titulo">Comparar espécies</h1>
        <p>
          Comece pelas imagens, compare as pistas e aprofunde quando quiser.
        </p>
      </header>
      <div className="fg-presets">
        {presets.map(([x, y]) => (
          <button
            key={y}
            type="button"
            aria-pressed={!white && aId === x && bId === y}
            onClick={() => {
              setA(x);
              setB(y);
              setWhite(false);
            }}
          >
            {guide.find((p) => p.id === x)!.name} ×{" "}
            {guide.find((p) => p.id === y)!.name}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={white}
          onClick={() => setWhite(true)}
        >
          Ipê-branco × T. elliptica
        </button>
      </div>
      {!white && (
        <div className="fg-selects">
          <div>
            <label htmlFor="guide-species-a">Primeira espécie</label>
            <select
              id="guide-species-a"
              value={aId}
              onChange={(e) => setA(e.target.value)}
            >
              {guide.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="guide-species-b">Segunda espécie</label>
            <select
              id="guide-species-b"
              value={bId}
              onChange={(e) => setB(e.target.value)}
            >
              {guide.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
      <p aria-live="polite" className="fg-comparison-message">
        {same && !white
          ? "Você selecionou o mesmo grupo. Escolha outro para comparar."
          : overlapping && !white
            ? "Rosa e roxo são nomes sobrepostos. Comparamos dois exemplos taxonômicos; a cor e o número de folíolos isolados não confirmam a espécie."
            : white
              ? "Comparação morfológica de T. roseoalba com T. elliptica, segundo a flora de Pernambuco. Não afirma ocorrência de T. elliptica em Goiânia."
              : "As fichas descrevem táxons de referência, sem identificar automaticamente sua árvore."}
      </p>
      {(!same || white) && (
        <div key={`${aId}-${bId}-${white}`}>
          <section
            className="fg-visual-comparison"
            aria-labelledby="visual-titulo"
          >
            <h2 id="visual-titulo">
              {aName} × {bName}
            </h2>
            <p className="fg-caption-note">
              Fotos de referência. Algumas mostram apenas a copa; árvore inteira
              e órgãos ausentes continuam pendentes.
            </p>
            {parts.map(([part, label]) => (
              <section
                className="fg-visual-row"
                key={part}
                aria-label={`Comparar ${label.toLowerCase()}`}
              >
                <h3>{label}</h3>
                <div className="fg-compare-photos">
                  <GuidePhoto
                    photo={guideImages.find(
                      (i) =>
                        i.profile === (white ? "branco" : a.id) &&
                        i.part === part,
                    )}
                    label={`${aName} · ${label}`}
                    compact
                  />
                  <GuidePhoto
                    photo={
                      white
                        ? undefined
                        : guideImages.find(
                            (i) => i.profile === b.id && i.part === part,
                          )
                    }
                    label={`${bName} · ${label}`}
                    compact
                  />
                </div>
              </section>
            ))}
          </section>
          <section
            className="fg-quick-comparison"
            aria-labelledby="diferencas-titulo"
          >
            <h2 id="diferencas-titulo">Diferenças rápidas</h2>
            {overlapping && !white && (
              <p className="fg-caption-note">
                Pistas comparáveis, não diferenças exclusivas: ambos podem ter
                cinco folíolos e flores rosadas.
              </p>
            )}
            {quick.map((row) => (
              <article key={row.label}>
                <h3>{row.label}</h3>
                <div className="fg-quick-pair">
                  <div>
                    <strong>{aName}</strong>
                    <GuideFact value={row.a} showSources={false} />
                  </div>
                  <div>
                    <strong>{bName}</strong>
                    <GuideFact value={row.b} showSources={false} />
                  </div>
                </div>
              </article>
            ))}
            <Link href="/guia/fontes" className="fg-text-link">
              Fontes e metodologia
            </Link>
          </section>
          <details className="fg-disclosure fg-full-comparison">
            <summary>Ver comparação botânica completa</summary>
            <div
              className="fg-comparison-table"
              role="region"
              aria-label="Características lado a lado"
              tabIndex={0}
            >
              <table>
                <caption>
                  {aName} × {bName}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Característica</th>
                    <th scope="col">
                      {aName}
                      <small>{white ? "Tabebuia roseoalba" : a.taxon}</small>
                    </th>
                    <th scope="col">
                      {bName}
                      <small>{white ? "Tabebuia elliptica" : b.taxon}</small>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(white
                    ? whiteComparison
                    : keys.map((key) => ({
                        label: factLabels[key],
                        a: a.facts[key],
                        b: b.facts[key],
                      }))
                  ).map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td data-species={aName}>
                        <GuideFact value={row.a} />
                      </td>
                      <td data-species={bName}>
                        <GuideFact value={row.b} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      )}
    </section>
  );
}

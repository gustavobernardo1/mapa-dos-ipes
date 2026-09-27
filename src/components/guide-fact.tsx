import { guideSources, type Fact, type SourceId } from "@/content/guide";
const sourceLabels: Record<SourceId, string> = {
  flora: "JBRJ / Flora e Funga",
  municipal: "Dicionário municipal",
  cenostigma: "JBRJ: Cenostigma",
  cassia: "JBRJ: Cassia",
  rosa: "Embrapa: ipê-rosa",
  roxo: "Embrapa: ipê-roxo",
  pernambuco: "Flora de Pernambuco",
  cnc: "CNCFlora / JBRJ",
  uenf: "UENF: sibipiruna",
  uenfCassia: "UENF: chuva-de-ouro",
  agroCassia: "World Agroforestry: Cassia",
  agroTecoma: "World Agroforestry: Tecoma",
  nomesTropicais: "Embrapa: nomes populares",
};
export function SourceLinks({ ids }: { ids: SourceId[] }) {
  return (
    <span className="fg-references">
      {ids.map((id) => (
        <a
          key={id}
          href={guideSources[id].url}
          title={`${guideSources[id].title}: ${guideSources[id].scope}`}
          aria-label={`Fonte: ${guideSources[id].title}`}
          target="_blank"
          rel="noreferrer"
        >
          {sourceLabels[id]}
        </a>
      ))}
    </span>
  );
}
export function GuideFact({
  value,
  showSources = true,
}: {
  value: Fact;
  showSources?: boolean;
}) {
  return (
    <div className={value.pending ? "fg-fact fg-pending" : "fg-fact"}>
      <p>{value.text}</p>
      {value.pending ? (
        <small>Revisão pendente</small>
      ) : showSources ? (
        <SourceLinks ids={value.sources} />
      ) : null}
    </div>
  );
}

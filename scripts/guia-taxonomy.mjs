import { mkdir, writeFile } from "node:fs/promises";
await mkdir("research/guia", { recursive: true });
const names = [
  "Handroanthus serratifolius",
  "Handroanthus impetiginosus",
  "Handroanthus heptaphyllus",
  "Tabebuia roseoalba",
  "Tabebuia rosea",
  "Cenostigma pluviosum",
  "Cenostigma pluviosum var. peltophoroides",
  "Cassia fistula",
  "Cassia ferruginea",
  "Tecoma stans",
  "Tabebuia vellosoi",
  "Tabebuia chrysotricha",
  "Tabebuia aurea",
];
const datasetKey = "aacd816d-662c-49d2-ad1a-97e66e2a2908";
const records = [];
for (const name of names) {
  const url = new URL("https://api.gbif.org/v1/species/search");
  url.search = new URLSearchParams({ q: name, datasetKey, limit: "20" });
  const result = await (await fetch(url)).json();
  const exact = result.results.filter(
    (r) => r.canonicalName === name.replace(" var. ", " "),
  );
  if (!exact.length) throw new Error(`Táxon ausente na lista oficial: ${name}`);
  const accepted = exact.find((r) => r.taxonomicStatus === "ACCEPTED");
  const synonymsUrl = accepted
    ? `https://api.gbif.org/v1/species/${accepted.key}/synonyms?limit=100`
    : undefined;
  const synonyms = synonymsUrl
    ? (await (await fetch(synonymsUrl)).json()).results
    : [];
  records.push({ name, url: url.href, records: exact, synonymsUrl, synonyms });
  console.log(
    name,
    exact.map((r) => ({
      name: r.scientificName,
      status: r.taxonomicStatus,
      accepted: r.accepted,
      key: r.key,
      references: r.references,
    })),
  );
}
await writeFile(
  "research/guia/taxonomia-flora-gbif.json",
  JSON.stringify(
    { retrievedAt: new Date().toISOString(), datasetKey, records },
    null,
    2,
  ),
);

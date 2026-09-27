import { mkdir, writeFile } from "node:fs/promises";
const taxa = [
  "Handroanthus serratifolius",
  "Handroanthus impetiginosus",
  "Handroanthus heptaphyllus",
  "Tabebuia roseoalba",
  "Caesalpinia peltophoroides",
  "Cassia fistula",
  "Tecoma stans",
];
await mkdir("research/guia", { recursive: true });
for (const taxon of taxa) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    generator: "search",
    gsrsearch: `${taxon} filetype:bitmap`,
    gsrnamespace: "6",
    gsrlimit: "15",
    prop: "imageinfo",
    iiprop: "url|extmetadata|size",
  });
  const result = await (await fetch(url)).json();
  await writeFile(
    `research/guia/${taxon.replaceAll(" ", "-")}.json`,
    JSON.stringify(
      { retrievedAt: new Date().toISOString(), api: url.href, result },
      null,
      2,
    ),
  );
  console.log(
    taxon,
    Object.values(result.query?.pages ?? {}).map((p) => ({
      title: p.title,
      license: p.imageinfo?.[0]?.extmetadata?.LicenseShortName?.value,
      description: p.imageinfo?.[0]?.extmetadata?.ImageDescription?.value
        ?.replace(/<[^>]*>/g, "")
        .slice(0, 180),
    })),
  );
}

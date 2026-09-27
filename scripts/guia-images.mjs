import { mkdir, writeFile, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import sharp from "sharp";
const selections = [
  [
    "amarelo",
    "flor",
    "Handroanthus serratifolius",
    "Starr 080716-9311 Tabebuia serratifolia.jpg",
  ],
  [
    "amarelo",
    "folha",
    "Handroanthus serratifolius",
    "Handroanthus serratifolius leaves.jpg",
  ],
  [
    "amarelo",
    "fruto",
    "Handroanthus serratifolius",
    "Handroanthus serratifolius fruits.jpg",
  ],
  ["rosa", "arvore", "Handroanthus impetiginosus", "Tabebuia impetiginosa.jpg"],
  [
    "rosa",
    "flor",
    "Handroanthus impetiginosus",
    "Starr 070221-4697 Tabebuia impetiginosa.jpg",
  ],
  [
    "roxo",
    "flor",
    "Handroanthus heptaphyllus",
    "Handroanthus heptaphyllus flowers.jpg",
  ],
  [
    "roxo",
    "arvore",
    "Handroanthus heptaphyllus",
    "Handroanthus heptaphyllus.jpg",
  ],
  [
    "branco",
    "arvore",
    "Tabebuia roseoalba",
    "Tabebuia roseo-alba 1 João de Deus Medeiros.jpg",
  ],
  ["branco", "flor", "Tabebuia roseoalba", "Tabebuia roseo-alba 003.jpg"],
  ["branco", "fruto", "Tabebuia roseoalba", "Tabebuia roseo-alba 004.jpg"],
  [
    "sibipiruna",
    "flor",
    "Cenostigma pluviosum var. peltophoroides",
    "Caesalpinia pluviosa var. peltophoroides.jpg",
  ],
  [
    "sibipiruna",
    "arvore",
    "Cenostigma pluviosum var. peltophoroides",
    "Sibipiruna (Caesalpinia peltophoroides) Ceret Sao Paulo Brazil.jpg",
  ],
  ["chuva-de-ouro", "flor", "Cassia fistula", "Cassia fistula flower twig.jpg"],
  [
    "chuva-de-ouro",
    "fruto",
    "Cassia fistula",
    "Starr 020630-0007 Cassia fistula.jpg",
  ],
  [
    "ipe-de-jardim",
    "flor",
    "Tecoma stans",
    "Yellow trumpetbush (Tecoma stans) Buton Island 1.jpg",
  ],
  [
    "ipe-de-jardim",
    "fruto",
    "Tecoma stans",
    "Yellow trumpetbush (Tecoma stans) Buton Island 3.jpg",
  ],
];
const offline = process.argv.includes("--offline");
const evidencePath = "research/guia/imagens-selecionadas.json";
await mkdir("public/guia", { recursive: true });
await mkdir("data/guia", { recursive: true });
let evidence;
if (offline) evidence = JSON.parse(await readFile(evidencePath, "utf8"));
else {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    titles: selections.map((s) => `File:${s[3]}`).join("|"),
    prop: "imageinfo",
    iiprop: "url|extmetadata|size",
    iiurlwidth: "1280",
  });
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Commons: ${response.status}`);
  evidence = {
    retrievedAt: new Date().toISOString(),
    api: url.href,
    result: await response.json(),
  };
  await writeFile(evidencePath, JSON.stringify(evidence, null, 2));
}
const clean = (s) =>
  (s ?? "")
    .replace(/<[^>]*>/g, "")
    .replaceAll("&amp;", "&")
    .trim();
const images = [];
for (const [profile, part, taxon, title] of selections) {
  const page = Object.values(evidence.result.query.pages).find(
    (p) => p.title === `File:${title}`,
  );
  const info = page?.imageinfo?.[0];
  if (!info) throw new Error(`Imagem ausente: ${title}`);
  const m = info.extmetadata,
    license = clean(m.LicenseShortName?.value);
  const author = clean(m.Artist?.value),
    licenseUrl = clean(m.LicenseUrl?.value).replace(
      /^http:\/\/creativecommons\.org\//,
      "https://creativecommons.org/",
    );
  if (
    !/^(CC BY( 2\.0| 3\.0| 4\.0)|CC BY-SA 3\.0|CC0)$/.test(license) ||
    !author ||
    !licenseUrl.startsWith("https://creativecommons.org/")
  )
    throw new Error(`Licença não aprovada: ${title}: ${license}`);
  const src = `/guia/${profile}-${part}.webp`;
  let bytes;
  try {
    bytes = await readFile(`public${src}`);
  } catch {
    /* Primeiro download. */
  }
  if (!bytes && offline) throw new Error(`Arquivo local ausente: ${src}`);
  if (!bytes) {
    let r;
    for (let attempt = 0; attempt < 4; attempt++) {
      const download = new URL(
        attempt === 0 ? (info.thumburl ?? info.url) : info.url,
      );
      download.search = "";
      r = await fetch(download, {
        headers: {
          "User-Agent":
            "MapaDosIpes/0.1 (educational botanical guide; source attribution retained)",
        },
      });
      if (r.ok) break;
      await new Promise((resolve) => setTimeout(resolve, 1500 * (attempt + 1)));
    }
    if (!r.ok) throw new Error(`Download ${title}: ${r.status}`);
    bytes = await sharp(Buffer.from(await r.arrayBuffer()))
      .rotate()
      .resize({
        width: 1280,
        height: 1280,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
    await writeFile(`public${src}`, bytes);
  }
  const size = await sharp(bytes).metadata();
  images.push({
    id: `${profile}-${part}`,
    profile,
    part,
    taxon,
    src,
    width: size.width,
    height: size.height,
    author,
    license,
    licenseUrl,
    sourceUrl: info.descriptionurl,
    originalUrl: info.url,
    description: clean(m.ImageDescription?.value),
    verifiedAt: evidence.retrievedAt.slice(0, 10),
    status: license === "CC0" ? "APROVADA" : "REQUER_ATRIBUICAO",
    changes:
      "Redimensionada e convertida para WebP; enquadramento de exibição pode variar.",
    sha256: createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
  });
  console.log(
    `${profile}/${part}: ${author} — ${license} (${bytes.length} bytes)`,
  );
}
await writeFile(
  "src/content/guide-images.json",
  JSON.stringify(images, null, 2) + "\n",
);
const columns = [
  "especie",
  "tipo_imagem",
  "autor",
  "fonte",
  "url_origem",
  "licenca",
  "url_licenca",
  "status_uso",
  "atribuicao",
  "observacoes",
  "data_verificacao",
];
const rows = images.map((i) => [
  i.taxon,
  i.part,
  i.author,
  "Wikimedia Commons",
  i.sourceUrl,
  i.license,
  i.licenseUrl,
  i.status,
  `Foto: ${i.author} — ${i.license}`,
  `${i.src}; ${i.changes} Identificação declarada pelo repositório, revisão botânica da foto pendente; não representa observação de Goiânia.`,
  i.verifiedAt,
]);
rows.push([
  "Cassia fistula",
  "flor",
  "Deborah Barroso",
  "UENF",
  "https://uenf.br/projetos/arvoresdauenf/especie-2/chuva-de-ouro/",
  "Não verificada",
  "",
  "REQUER_AUTORIZACAO",
  "",
  "Fonte potencial; não publicada no app.",
  evidence.retrievedAt.slice(0, 10),
]);
rows.push([
  "Handroanthus impetiginosus",
  "casca",
  "Waldemar H. Zelazowski",
  "Embrapa",
  "https://www.alice.cnptia.embrapa.br/alice/bitstream/doc/1140085/1/Especies-Arboreas-Brasileiras-vol-1-Ipe-Rosa.pdf",
  "Não verificada para a fotografia",
  "",
  "LICENCA_INDEFINIDA",
  "",
  "Foto da página 559; não publicada. Licença do documento não comprova direitos da foto.",
  evidence.retrievedAt.slice(0, 10),
]);
const csv = (row) =>
  row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",");
await writeFile(
  "data/guia/imagens_referencia.csv",
  [columns, ...rows].map(csv).join("\n") + "\n",
);

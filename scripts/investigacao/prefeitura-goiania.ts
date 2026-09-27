/* eslint-disable @typescript-eslint/no-explicit-any */
/** Investigação pública somente leitura. Não lê .env nem acessa Supabase. Node >=22.12. */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
import assert from "node:assert/strict";

type Json = Record<string, any>;
type Species = {
  codigo: number;
  nome: string;
  cientifico: string;
  autor: string;
  variedade: string;
};
const HOST = "https://portalmapa.goiania.go.gov.br";
const SERVICE = `${HOST}/servicogyn/rest/services/MapaServer/Mapa_MeioAmbiente/MapServer`;
const LIMIT = `${HOST}/servicogyn/rest/services/MapaServer/Mapa_Limites/MapServer/1`;
const DICTIONARY = `${HOST}/helpsiggo/HelpSIGGO/ARV%20CDESPECIE.htm`;
const ENTITY = `${HOST}/helpsiggo/HelpSIGGO/Arv.htm`;
const ROOT = resolve(import.meta.dirname, "../..");
const DATA = join(ROOT, "data/prefeitura");
const DOCS = join(ROOT, "docs/prefeitura-goiania");
const replay = process.argv.includes("--replay");
const SHA = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
const empty = (v: unknown) =>
  v === null || v === undefined || (typeof v === "string" && !v.trim());
const pct = (n: number, total: number) =>
  total ? Number(((100 * n) / total).toFixed(3)) : null;
const md = (s: unknown) =>
  String(s ?? "—")
    .replace(/\|/g, "\\|")
    .replace(/[\r\n]+/g, " ");
const fmt = (n: number) => n.toLocaleString("pt-BR");
function entities(s: string): string {
  return s.replace(
    /&(#x[0-9a-f]+|#\d+|nbsp|amp|lt|gt|quot|apos);/gi,
    (_, name: string) => {
      if (name[0] === "#")
        return String.fromCodePoint(
          name[1].toLowerCase() === "x"
            ? parseInt(name.slice(2), 16)
            : parseInt(name.slice(1), 10),
        );
      return (
        {
          nbsp: " ",
          amp: "&",
          lt: "<",
          gt: ">",
          quot: '"',
          apos: "'",
        } as Record<string, string>
      )[name.toLowerCase()];
    },
  );
}
function parseDictionary(html: string): Species[] {
  const result: Species[] = [];
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [
      ...row[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi),
    ].map((m) =>
      entities(m[1].replace(/<[^>]*>/g, " "))
        .replace(/\s+/g, " ")
        .trim(),
    );
    if (cells.length >= 5 && /^\d+$/.test(cells[0])) {
      result.push({
        codigo: Number(cells[0]),
        nome: cells[1],
        cientifico: cells[2],
        autor: cells[3],
        variedade: cells[4],
      });
    }
  }
  assert(
    result.length > 10,
    "Dicionário inesperado: interromper, não inventar correspondências.",
  );
  assert.equal(
    new Set(result.map((s) => s.codigo)).size,
    result.length,
    "Códigos repetidos no dicionário.",
  );
  return result;
}
function inside(point: number[], rings: number[][][]): boolean {
  const [x, y] = point;
  let result = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      const cross = (x - xi) * (yj - yi) - (y - yi) * (xj - xi);
      if (
        Math.abs(cross) < 1e-12 &&
        x >= Math.min(xi, xj) &&
        x <= Math.max(xi, xj) &&
        y >= Math.min(yi, yj) &&
        y <= Math.max(yi, yj)
      )
        return true;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        result = !result;
    }
  }
  return result;
}
function distance(a: number[], b: number[]): number {
  const rad = Math.PI / 180;
  const h =
    Math.sin(((b[1] - a[1]) * rad) / 2) ** 2 +
    Math.cos(a[1] * rad) *
      Math.cos(b[1] * rad) *
      Math.sin(((b[0] - a[0]) * rad) / 2) ** 2;
  return (
    6371008.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
  );
}
function segmentIntersectsBox(
  a: number[],
  b: number[],
  box: number[],
): boolean {
  let start = 0,
    end = 1;
  for (let axis = 0; axis < 2; axis++) {
    const delta = b[axis] - a[axis],
      lo = box[axis],
      hi = box[axis + 2];
    if (delta === 0) {
      if (a[axis] < lo || a[axis] > hi) return false;
      continue;
    }
    const first = (lo - a[axis]) / delta,
      last = (hi - a[axis]) / delta;
    start = Math.max(start, Math.min(first, last));
    end = Math.min(end, Math.max(first, last));
    if (start > end) return false;
  }
  return true;
}
function boxInside(box: number[], rings: number[][][]): boolean {
  if (
    ![
      [box[0], box[1]],
      [box[2], box[1]],
      [box[2], box[3]],
      [box[0], box[3]],
    ].every((p) => inside(p, rings))
  )
    return false;
  return !rings.some((ring) =>
    ring.some((point, i) =>
      segmentIntersectsBox(point, ring[(i + 1) % ring.length], box),
    ),
  );
}
function selfTest() {
  assert.equal(entities("Ip&#234; &amp; A&nbsp;B"), "Ipê & A B");
  const html = Array.from(
    { length: 12 },
    (_, i) =>
      `<tr><td>${i}</td><td>Ip&#234;</td><td><b>Tabebuia</b> rosea</td><td>A</td><td>&nbsp;</td></tr>`,
  ).join("");
  assert.equal(parseDictionary(html)[3].cientifico, "Tabebuia rosea");
  const outer = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ],
    hole = [
      [2, 2],
      [4, 2],
      [4, 4],
      [2, 4],
      [2, 2],
    ];
  assert(inside([1, 1], [outer, hole]));
  assert(!inside([3, 3], [outer, hole]));
  assert(!inside([11, 1], [outer]));
  assert(inside([0, 5], [outer]));
  assert.equal(distance([-49, -16], [-49, -16]), 0);
  assert(Math.abs(distance([0, 0], [0, 1]) - 111195) < 2);
  assert(boxInside([5, 5, 6, 6], [outer, hole]));
  assert(!boxInside([1, 1, 5, 5], [outer, hole]));
  assert(segmentIntersectsBox([-1, 0.5], [2, 0.5], [0, 0, 1, 1]));
  assert(!segmentIntersectsBox([-1, 2], [2, 2], [0, 0, 1, 1]));
  console.log(
    "Autotestes: decodificação, dicionário, polígono com buraco/borda e distância passaram.",
  );
}

let manifest: Json;
let lastFetch = 0;
async function request(
  tag: string,
  url: string,
  parameters?: Json,
): Promise<Buffer> {
  assert.equal(new URL(url).hostname, "portalmapa.goiania.go.gov.br");
  assert(
    /\/query$|\?f=json$|\.htm$/.test(url),
    "Somente metadata, query ArcGIS ou ajuda pública.",
  );
  const file = `evidencias/reproduzivel/${tag}.raw`;
  if (replay) {
    const entry = manifest.requests.find((r: Json) => r.tag === tag);
    assert(
      entry &&
        entry.url === url &&
        JSON.stringify(entry.parameters) === JSON.stringify(parameters ?? null),
      `Consulta ${tag} diverge do snapshot.`,
    );
    const bytes = await readFile(join(DATA, entry.file));
    assert.equal(SHA(bytes), entry.sha256, `Snapshot ${tag} alterado.`);
    return bytes;
  }
  const encoded = parameters
    ? new URLSearchParams(
        Object.entries(parameters).map(([k, v]) => [k, String(v)]),
      )
    : undefined;
  for (let attempt = 1; attempt <= 3; attempt++) {
    await pause(Math.max(0, 400 - (Date.now() - lastFetch)));
    lastFetch = Date.now();
    try {
      const response = await fetch(url, {
        method: parameters ? "POST" : "GET",
        body: encoded,
        signal: AbortSignal.timeout(45000),
        headers: { "User-Agent": "MapaDosIpes-InvestigacaoPublica/1.0" },
      });
      if (!response.ok) {
        if (response.status === 429 || response.status >= 500)
          throw new Error(`HTTP temporário ${response.status}`);
        throw new Error(`HTTP definitivo ${response.status}`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      await writeFile(join(DATA, file), bytes);
      manifest.requests.push({
        tag,
        url,
        parameters: parameters ?? null,
        file,
        sha256: SHA(bytes),
        queriedAt: new Date().toISOString(),
        httpStatus: response.status,
        contentType: response.headers.get("content-type"),
        attempt,
      });
      await save("consultas.json", manifest);
      return bytes;
    } catch (error) {
      if (String(error).includes("definitivo") || attempt === 3) throw error;
      await pause(1000 * 2 ** (attempt - 1));
    }
  }
  throw new Error("Tentativas esgotadas.");
}
async function json(
  tag: string,
  url: string,
  parameters?: Json,
): Promise<Json> {
  const data = JSON.parse(
    (await request(tag, url, parameters))
      .toString("utf8")
      .replace(/^\uFEFF/, ""),
  );
  if (data.error)
    throw new Error(`${tag}: ArcGIS ${JSON.stringify(data.error)}`);
  return data;
}
async function save(file: string, data: unknown) {
  await writeFile(
    join(DATA, file),
    JSON.stringify(data, null, 2) + "\n",
    "utf8",
  );
}
async function document(file: string, text: string) {
  await writeFile(join(DOCS, file), text, "utf8");
}
async function count(tag: string, where = "1=1", layer = 3, extra: Json = {}) {
  const r = await json(tag, `${SERVICE}/${layer}/query`, {
    f: "json",
    where,
    returnCountOnly: "true",
    ...extra,
  });
  assert(Number.isInteger(r.count), `Contagem inválida: ${tag}`);
  return r.count as number;
}
async function pages(
  tag: string,
  parameters: Json,
  layer = 3,
): Promise<Json[]> {
  const rows: Json[] = [];
  const signatures = new Set<string>();
  for (let offset = 0; offset < 100000; offset += 1000) {
    const r = await json(`${tag}_${offset}`, `${SERVICE}/${layer}/query`, {
      f: "json",
      where: "1=1",
      returnGeometry: "false",
      ...parameters,
      resultOffset: offset,
      resultRecordCount: 1000,
    });
    assert(Array.isArray(r.features), `Resposta inesperada: ${tag}`);
    const batch = r.features.map((f: Json) => f.attributes);
    if (!batch.length) {
      assert(!r.exceededTransferLimit, "Página vazia marcada como incompleta.");
      return rows;
    }
    const signature = JSON.stringify(batch);
    assert(
      !signatures.has(signature),
      "Servidor repetiu página: abortar em vez de duplicar.",
    );
    signatures.add(signature);
    rows.push(...batch);
    if (!r.exceededTransferLimit && batch.length < 1000) return rows;
  }
  throw new Error("Limite de segurança de paginação atingido.");
}
const nStat = [
  {
    statisticType: "count",
    onStatisticField: "OBJECTID",
    outStatisticFieldName: "n",
  },
];
const grouped = (tag: string, fields: string, where = "1=1", layer = 3) =>
  pages(
    tag,
    {
      where,
      groupByFieldsForStatistics: fields,
      outStatistics: JSON.stringify(nStat),
      orderByFields: fields,
    },
    layer,
  );

async function main() {
  await mkdir(join(DATA, "evidencias/reproduzivel"), { recursive: true });
  await mkdir(join(DATA, "metadata"), { recursive: true });
  await mkdir(DOCS, { recursive: true });
  manifest = replay
    ? JSON.parse(await readFile(join(DATA, "consultas.json"), "utf8"))
    : {
        startedAt: new Date().toISOString(),
        source: SERVICE,
        method:
          "consultas sequenciais somente leitura; intervalo mínimo 400ms; até 3 tentativas HTTP; amostra estratificada limitada a 50",
        requests: [],
      };
  console.log(
    `${replay ? "Reprocessando snapshot" : "Consultando Prefeitura"}; sem .env, banco ou autenticação.`,
  );
  const service = await json("metadata_servico", `${SERVICE}?f=json`);
  const layer = await json("metadata_arvore", `${SERVICE}/3?f=json`);
  const planting = await json("metadata_plantio", `${SERVICE}/4?f=json`);
  assert(
    layer.geometryType === "esriGeometryPoint" &&
      layer.maxRecordCount >= 1000 &&
      layer.advancedQueryCapabilities?.supportsPagination,
    "Metadados mudaram: revisar método.",
  );
  for (const field of [
    "OBJECTID",
    "nm",
    "cdespecie",
    "cdbairro",
    "x_coord",
    "y_coord",
  ])
    assert(
      layer.fields.some((f: Json) => f.name === field),
      `Campo ausente: ${field}`,
    );
  await save("metadata/servico.json", service);
  await save("metadata/3.json", layer);
  await save("metadata/4.json", planting);
  // Descoberta completa SEM filtro por ipê, antes de escolher códigos.
  const names = await pages("distintos_nm", {
    outFields: "nm",
    returnDistinctValues: "true",
    orderByFields: "nm",
  });
  const codes = await pages("distintos_cdespecie", {
    outFields: "cdespecie",
    returnDistinctValues: "true",
    orderByFields: "cdespecie",
  });
  const otherCodeDistribution = await grouped(
    "distribuicao_cdtparvore",
    "cdtparvore",
  );
  const groups = await grouped("grupos_nome_codigo", "nm,cdespecie");
  const total = await count("total_arvores");
  assert.equal(
    groups.reduce((sum, r) => sum + r.n, 0),
    total,
    "Grupos não cobrem o total; investigar paginação/alteração concorrente.",
  );
  const dictBytes = await request("dicionario_especies", DICTIONARY);
  const declaration =
    dictBytes.toString("ascii").match(/charset\s*=\s*["']?([\w-]+)/i)?.[1] ??
    "windows-1252";
  const dictionary = parseDictionary(
    new TextDecoder(declaration).decode(dictBytes),
  );
  await request("entidade_arvores", ENTITY);
  const byCode = new Map(dictionary.map((s) => [s.codigo, s]));
  const frequency = new Map<number, number>();
  for (const group of groups)
    frequency.set(
      group.cdespecie,
      (frequency.get(group.cdespecie) ?? 0) + group.n,
    );
  const observed = dictionary.filter((s) => frequency.has(s.codigo));
  const hits = observed.filter((s) =>
    ["IPE", "TABEBUIA", "HANDROANTHUS"].some((term) =>
      norm(`${s.nome} ${s.cientifico}`).includes(term),
    ),
  );
  // Gênero literalmente escrito no dicionário público; sem sinonimização botânica inferida.
  const candidates = observed
    .filter((s) => /\b(?:Tabebuia|Handroanthus)\b/i.test(s.cientifico))
    .sort((a, b) => a.codigo - b.codigo);
  assert(
    candidates.length > 0,
    "Nenhum candidato verificável; não inventar seleção.",
  );
  const where = `cdespecie IN (${candidates.map((s) => s.codigo).join(",")})`;
  const possible = await count("total_candidatos", where);
  assert.equal(
    possible,
    candidates.reduce((sum, s) => sum + (frequency.get(s.codigo) ?? 0), 0),
  );
  const bairros = await grouped("candidatos_bairro", "cdbairro", where);
  assert.equal(
    bairros.reduce((sum, r) => sum + r.n, 0),
    possible,
  );
  const unclassified = groups
    .filter((r) => r.cdespecie === null || r.cdespecie === 0)
    .reduce((sum, r) => sum + r.n, 0);
  const unknown = groups.filter(
    (r) =>
      r.cdespecie !== null && r.cdespecie !== 0 && !byCode.has(r.cdespecie),
  );
  const unknownCount = unknown.reduce((sum, r) => sum + r.n, 0);
  const resolved = total - unclassified - unknownCount;
  const nmFilled = groups
    .filter((r) => !empty(r.nm))
    .reduce((sum, r) => sum + r.n, 0);
  const unexpectedNames = groups.filter(
    (r) => !empty(r.nm) && r.nm !== String(r.cdespecie),
  );
  await save("especies_distintas.json", {
    consultado_em: manifest.startedAt,
    fonte: SERVICE + "/3",
    nm: names.map((r) => r.nm),
    cdespecie: codes.map((r) => r.cdespecie),
    cdtparvore_distribuicao: otherCodeDistribution,
    cdtparvore_nota:
      "Campo numérico adicional inspecionado antes do filtro; ajuda oficial não fornece descrição ou vínculo com dicionário de espécies. Não usado para classificação.",
    grupos: groups,
    fonte_dicionario: DICTIONARY,
    charset_original: declaration,
    dicionario: dictionary,
    destaques_lexicais: hits,
    codigos_sem_descricao: unknown,
    divergencias_nm_codigo: unexpectedNames,
  });
  console.log(
    `Descoberta: ${total} árvores, ${names.length} valores nm, ${codes.length} códigos, ${possible} candidatos.`,
  );

  // Métricas globais calculadas no servidor, sem obter os 90 mil pontos.
  const nullGeometry = await count("geometria_nula", "shape IS NULL");
  const xyFilled = await count(
    "xy_preenchidos",
    "x_coord IS NOT NULL AND y_coord IS NOT NULL",
  );
  const xyZero = await count("xy_zero", "x_coord=0 OR y_coord=0");
  const boundaryMetadata = await json("metadata_limite", `${LIMIT}?f=json`);
  const boundary = await json("limite_goiania", `${LIMIT}/query`, {
    f: "json",
    where: "UPPER(nm_mun) LIKE 'GOI%NIA'",
    outFields: "*",
    returnGeometry: "true",
    outSR: 4326,
    resultRecordCount: 10,
  });
  assert.equal(boundary.features.length, 1, "Limite de Goiânia ambíguo.");
  assert.equal(norm(boundary.features[0].attributes.nm_mun), "GOIANIA");
  assert(
    boundary.features[0].geometry.rings?.length &&
      !boundary.exceededTransferLimit,
  );
  const rings = boundary.features[0].geometry.rings as number[][][];
  // O polígono de 4129 vértices excedeu limites de requisição (HTTP 500).
  // Prova sem simplificar o limite: envelope da camada inteiramente dentro do polígono original.
  const extentResponse = await json(
    "extent_arvores_wgs84",
    `${SERVICE}/3/query`,
    { f: "json", where: "1=1", returnExtentOnly: "true", outSR: 4326 },
  );
  const extent = extentResponse.extent;
  assert.equal(extent.spatialReference.wkid, 4326);
  const box = [
    extent.xmin - 1e-10,
    extent.ymin - 1e-10,
    extent.xmax + 1e-10,
    extent.ymax + 1e-10,
  ];
  const extentIsInside = boxInside(box, rings);
  const envelopeParams = {
    geometry: box.join(","),
    geometryType: "esriGeometryEnvelope",
    inSR: 4326,
    spatialRel: "esriSpatialRelIntersects",
  };
  const validCoordinateCount = await count(
    "coordenadas_envelope_wgs84",
    "1=1",
    3,
    envelopeParams,
  );
  assert(
    box.every(Number.isFinite) &&
      box[0] >= -180 &&
      box[2] <= 180 &&
      box[1] >= -90 &&
      box[3] <= 90,
  );
  let spatialParams = envelopeParams;
  if (!extentIsInside) {
    const generalized = await json(
      "limite_goiania_generalizado",
      `${LIMIT}/query`,
      {
        f: "json",
        where: "UPPER(nm_mun) LIKE 'GOI%NIA'",
        outFields: "nm_mun",
        returnGeometry: "true",
        outSR: 4326,
        maxAllowableOffset: "0.0001",
        geometryPrecision: 6,
      },
    );
    assert(
      generalized.features.length === 1 &&
        generalized.features[0].geometry.rings[0].length > 100 &&
        !generalized.exceededTransferLimit,
      "Generalização inesperada; não confiar em polígono degenerado.",
    );
    spatialParams = {
      geometry: JSON.stringify({
        rings: generalized.features[0].geometry.rings,
        spatialReference: { wkid: 4326 },
      }),
      geometryType: "esriGeometryPolygon",
      inSR: 4326,
      spatialRel: "esriSpatialRelIntersects",
    };
    await save("limite_goiania_generalizado.geojson", {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            nome: "Goiânia",
            maxAllowableOffset_graus: 0.0001,
            geometryPrecision: 6,
          },
          geometry: {
            type: "Polygon",
            coordinates: generalized.features[0].geometry.rings,
          },
        },
      ],
    });
  }
  const insideCount = await count(
    "arvores_dentro_municipio",
    "1=1",
    3,
    spatialParams,
  );
  const candidatesInside = await count(
    "candidatos_dentro_municipio",
    where,
    3,
    spatialParams,
  );
  await save("metadata/limites_1.json", boundaryMetadata);
  await save("limite_goiania.geojson", {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: boundary.features[0].attributes,
        geometry: { type: "Polygon", coordinates: rings },
      },
    ],
  });
  const inspectFields = [
    "inporte",
    "incondarv",
    "indiamcopa",
    "incap",
    "inidade",
    "poda",
    "porte",
    "idade",
    "cap",
    "dpc",
    "cdbairro",
    "dtlevanta",
    "dtplantio",
    "dtcadastro",
    "dtatualiza",
    "created_date",
    "last_edited_date",
    "observacao",
    "inobs",
    "instatus",
    "cdtparvore",
    "x_coord",
    "y_coord",
  ];
  const stats = await pages("completude_global", {
    outStatistics: JSON.stringify(
      inspectFields.flatMap((name) => [
        {
          statisticType: "count",
          onStatisticField: name,
          outStatisticFieldName: `n_${name}`,
        },
        ...([
          "x_coord",
          "y_coord",
          "dtplantio",
          "dtcadastro",
          "dtatualiza",
          "created_date",
          "last_edited_date",
        ].includes(name)
          ? ["min", "max"].map((type) => ({
              statisticType: type,
              onStatisticField: name,
              outStatisticFieldName: `${type}_${name}`,
            }))
          : []),
      ]),
    ),
  });
  assert.equal(stats.length, 1);
  const fieldCompleteness: Json[] = [];
  for (const name of inspectFields) {
    const type = layer.fields.find((f: Json) => f.name === name).type;
    const blank =
      type === "esriFieldTypeString"
        ? await count(
            `vazio_${name}`,
            `${name} IS NOT NULL AND (${name}='' OR ${name}=' ')`,
          )
        : 0;
    fieldCompleteness.push({
      campo: name,
      tipo: type,
      nao_nulos: stats[0][`n_${name}`],
      brancos: blank,
      nao_vazios: stats[0][`n_${name}`] - blank,
      porcentagem_nao_vazios: pct(stats[0][`n_${name}`] - blank, total),
      min: stats[0][`min_${name}`],
      max: stats[0][`max_${name}`],
      min_iso:
        type === "esriFieldTypeDate" &&
        typeof stats[0][`min_${name}`] === "number"
          ? new Date(stats[0][`min_${name}`]).toISOString()
          : undefined,
      max_iso:
        type === "esriFieldTypeDate" &&
        typeof stats[0][`max_${name}`] === "number"
          ? new Date(stats[0][`max_${name}`]).toISOString()
          : undefined,
    });
  }
  const enumerations: Json = { cdtparvore: otherCodeDistribution };
  for (const field of [
    "inporte",
    "incondarv",
    "inidade",
    "porte",
    "idade",
    "instatus",
  ])
    enumerations[field] = await grouped(`distribuicao_${field}`, field);
  // Apenas 50 feições: distribuição determinística por código (primeiros OBJECTID).
  const sample: Json[] = [];
  assert(
    candidates.length <= 50,
    "Mais de 50 categorias: definir outra amostragem.",
  );
  for (let i = 0; i < candidates.length; i++) {
    const size =
      Math.floor(50 / candidates.length) + (i < 50 % candidates.length ? 1 : 0);
    const r = await json(
      `amostra_${candidates[i].codigo}`,
      `${SERVICE}/3/query`,
      {
        f: "geojson",
        where: `cdespecie=${candidates[i].codigo}`,
        outFields: "*",
        returnGeometry: "true",
        outSR: 4326,
        orderByFields: "OBJECTID",
        resultRecordCount: size,
      },
    );
    assert(r.type === "FeatureCollection" && Array.isArray(r.features));
    assert(r.features.length <= size, "Servidor ignorou limite da amostra.");
    sample.push(...r.features);
  }
  assert(sample.length >= 20 && sample.length <= 50);
  assert.equal(
    new Set(sample.map((f) => f.properties.OBJECTID)).size,
    sample.length,
  );
  await save("ipes_amostra.geojson", {
    type: "FeatureCollection",
    features: sample,
  });
  const valid = sample.filter(
    (f) =>
      f.geometry?.type === "Point" &&
      f.geometry.coordinates.length >= 2 &&
      f.geometry.coordinates.slice(0, 2).every(Number.isFinite) &&
      Math.abs(f.geometry.coordinates[0]) <= 180 &&
      Math.abs(f.geometry.coordinates[1]) <= 90,
  );
  const outside = valid.filter((f) => !inside(f.geometry.coordinates, rings));
  const pairs: Json[] = [];
  for (let i = 0; i < valid.length; i++)
    for (let j = i + 1; j < valid.length; j++) {
      const meters = distance(
        valid[i].geometry.coordinates,
        valid[j].geometry.coordinates,
      );
      if (meters <= 5)
        pairs.push({
          objectids: [
            valid[i].properties.OBJECTID,
            valid[j].properties.OBJECTID,
          ],
          distancia_m: meters,
          coordenadas_identicas:
            JSON.stringify(valid[i].geometry.coordinates) ===
            JSON.stringify(valid[j].geometry.coordinates),
        });
    }
  const now = new Date(manifest.startedAt).getTime();
  const dateFields = layer.fields
    .filter((f: Json) => f.type === "esriFieldTypeDate")
    .map((f: Json) => f.name);
  const strangeDates: Json[] = [];
  for (const feature of sample)
    for (const field of dateFields) {
      const value = feature.properties[field];
      if (
        !empty(value) &&
        (typeof value !== "number" ||
          !Number.isFinite(value) ||
          value < Date.UTC(1900, 0, 1) ||
          value > now + 86400000)
      )
        strangeDates.push({
          objectid: feature.properties.OBJECTID,
          campo: field,
          valor: value,
        });
    }
  const sampleEmpty = layer.fields
    .filter((f: Json) => f.type !== "esriFieldTypeGeometry")
    .map((f: Json) => ({
      campo: f.name,
      vazios: sample.filter((s) => empty(s.properties[f.name])).length,
    }));
  const plantingTotal = await count("total_plantio", "1=1", 4);
  const plantingStatus = await grouped("plantio_status", "instatus", "1=1", 4);
  const plantingSpecies = await grouped(
    "plantio_especies",
    "cdespecie",
    "1=1",
    4,
  );
  const plantingDates = await pages(
    "plantio_datas",
    {
      outStatistics: JSON.stringify(
        ["dtplantio", "dtcadastro", "dtatualiza"].flatMap((name) =>
          ["count", "min", "max"].map((type) => ({
            statisticType: type,
            onStatisticField: name,
            outStatisticFieldName: `${type}_${name}`,
          })),
        ),
      ),
    },
    4,
  );
  const plantingExample = await json("plantio_exemplo", `${SERVICE}/4/query`, {
    f: "json",
    where: "1=1",
    outFields:
      "OBJECTID,id,cdespecie,instatus,cdtparvore,dtplantio,dtcadastro,dtatualiza",
    returnGeometry: "false",
    orderByFields: "OBJECTID",
    resultRecordCount: 5,
  });
  const comparisonIds = plantingExample.features
    .map((f: Json) => f.attributes.OBJECTID)
    .join(",");
  const sameIds = await json(
    "arvore_comparacao_plantio",
    `${SERVICE}/3/query`,
    {
      f: "json",
      where: `OBJECTID IN (${comparisonIds})`,
      outFields:
        "OBJECTID,id,cdespecie,instatus,cdtparvore,dtplantio,dtcadastro,dtatualiza",
      returnGeometry: "false",
      resultRecordCount: 5,
    },
  );
  const lexicalExcluded = hits.filter(
    (s) => !candidates.some((c) => c.codigo === s.codigo),
  );
  const categories = candidates.map((s) => ({
    ...s,
    quantidade: frequency.get(s.codigo),
    nm_observados: groups
      .filter((g) => g.cdespecie === s.codigo)
      .map((g) => ({ valor: g.nm, quantidade: g.n })),
    cor_literal: /AMARELO/.test(norm(s.nome))
      ? "AMARELO"
      : /BRANCO/.test(norm(s.nome))
        ? "BRANCO"
        : /ROXO/.test(norm(s.nome))
          ? "ROXO"
          : /ROSA/.test(norm(s.nome))
            ? "ROSA"
            : "NAO_INFORMADA",
  }));
  const colorCounts: Json = {};
  for (const c of categories)
    colorCounts[c.cor_literal] =
      (colorCounts[c.cor_literal] ?? 0) + c.quantidade!;
  const synonymGroups: Json[] = [];
  for (const s of candidates) {
    const match = synonymGroups.find(
      (g) => g.cientifico_normalizado === norm(s.cientifico),
    );
    if (match) match.codigos.push(s.codigo);
    else
      synonymGroups.push({
        cientifico_normalizado: norm(s.cientifico),
        codigos: [s.codigo],
      });
  }
  const quality = {
    total_arvores: total,
    possiveis_ipes: possible,
    geometrias_nulas: nullGeometry,
    xy_nao_nulos: xyFilled,
    xy_zero: xyZero,
    dentro_limite_oficial: insideCount,
    fora_limite_nao_nulos: total - nullGeometry - insideCount,
    porcentagem_coordenadas_dentro_limite: pct(insideCount, total),
    candidatos_dentro_limite: candidatesInside,
    coordenadas_numericamente_validas_no_envelope: validCoordinateCount,
    porcentagem_coordenadas_numericamente_validas: pct(
      validCoordinateCount,
      total,
    ),
    verificacao_municipal_aproximada: !extentIsInside,
    metodo_espacial: extentIsInside
      ? "Envelope WGS84 da camada integralmente dentro do polígono municipal original; count espacial no envelope."
      : "Count espacial no polígono municipal generalizado pelo serviço com maxAllowableOffset=0.0001 grau (~11m) e geometryPrecision=6. Verificação municipal global aproximada; amostra verificada com polígono original. Validade numérica WGS84 contada separadamente no envelope da camada.",
    envelope_wgs84: extent,
    nm_nao_vazio: nmFilled,
    porcentagem_nm_nao_vazio: pct(nmFilled, total),
    nomes_humanos_no_campo_nm: 0,
    observacao_nm:
      "Campo é cópia de código; preenchimento não equivale a nome de espécie.",
    especie_resolvida_dicionario: resolved,
    porcentagem_especie_resolvida: pct(resolved, total),
    sem_classificacao: unclassified,
    porcentagem_sem_classificacao: pct(unclassified, total),
    codigo_nao_zero_sem_descricao: unknownCount,
    porcentagem_sem_descricao: pct(unknownCount, total),
    completude: fieldCompleteness,
    distribuicoes: enumerations,
    amostra: {
      metodo:
        "Estratificada por código; primeiros OBJECTID de cada código; até 50; não aleatória, não representativa estatisticamente.",
      tamanho: sample.length,
      coordenadas_validas: valid.length,
      porcentagem_validas: pct(valid.length, sample.length),
      fora_municipio: outside.map((s) => s.properties.OBJECTID),
      pares_ate_5m: pairs,
      pares_identicos: pairs.filter((p) => p.coordenadas_identicas).length,
      datas_suspeitas: strangeDates,
      campos_vazios: sampleEmpty,
    },
    plantio: {
      total: plantingTotal,
      status: plantingStatus,
      especies: plantingSpecies,
      datas: plantingDates,
      exemplos: plantingExample.features.map((f: Json) => f.attributes),
      arvores_com_mesmos_objectids: sameIds.features.map(
        (f: Json) => f.attributes,
      ),
      nota: "OBJECTID é local à camada. Coincidência de números não comprova árvore compartilhada; amostras de IDs não estimam sobreposição global.",
    },
  };
  await save("qualidade.json", quality);
  await save("ipes_resumo.json", {
    consultado_em: manifest.startedAt,
    fonte: SERVICE + "/3",
    fonte_dicionario: DICTIONARY,
    regra:
      "Código observado cuja descrição científica no dicionário municipal contém o gênero literal Tabebuia ou Handroanthus. Cadastro público candidato, sem confirmação botânica ou sinonimização.",
    where,
    total_arvores: total,
    total_possiveis_ipes: possible,
    por_codigo: categories,
    por_cor_literal: colorCounts,
    por_bairro_codigo: bairros,
    excluidos_lexicais: lexicalExcluded.map((s) => ({
      ...s,
      quantidade: frequency.get(s.codigo),
      motivo:
        "Não pertence literalmente a Tabebuia/Handroanthus no dicionário; correspondência textual não basta.",
    })),
    duplicidades_nome_cientifico_literal: synonymGroups.filter(
      (g) => g.codigos.length > 1,
    ),
    qualidade: quality,
  });
  const header = `Consulta iniciada: **${manifest.startedAt}**. Fonte: [serviço municipal](${SERVICE}), [Árvore](${SERVICE}/3), [dicionário oficial](${DICTIONARY}) e [documentação da entidade](${ENTITY}). Respostas originais, horários, parâmetros e SHA-256: [consultas.json](../../data/prefeitura/consultas.json). Apenas fontes públicas da Prefeitura; nenhuma escrita em banco.\n\n`;
  await document(
    "ESTRUTURA_BASE.md",
    `# Estrutura da base pública de arborização\n\n${header}` +
      `Camada **${layer.name}**, ${layer.geometryType}, **${layer.fields.length} campos**, ObjectID **${layer.objectIdField ?? layer.fields.find((f: Json) => f.type === "esriFieldTypeOID").name}**, displayField **${layer.displayField}**. Referência original **EPSG:${layer.extent.spatialReference.wkid}**; geometrias da amostra solicitadas em **EPSG:4326** (longitude, latitude). maxRecordCount **${layer.maxRecordCount}**; paginação **${layer.advancedQueryCapabilities.supportsPagination}**; estatísticas **${layer.supportsStatistics}**; distinct **${layer.advancedQueryCapabilities.supportsDistinct}**.\n\n` +
      `**Espécie:** cdespecie (Double) é o código. nm (String, 80) é “Cópia do atributo CDESPECIE” na ajuda oficial; os valores reais são códigos numéricos textuais e o sentinela Number Null. Não existe campo de nome científico na camada. Domínios: ${layer.fields.filter((f: Json) => f.domain).length}; relationships: ${JSON.stringify(layer.relationships)}; tabelas no serviço: ${JSON.stringify(service.tables)}. A relação com nomes vem do HTML público legado, não de join/domínio REST.\n\n` +
      `Extent declarado em EPSG:31982: ${JSON.stringify(layer.extent)}. O inventário cobre apenas parte do município; não se pode concluir cobertura integral. x_coord/y_coord são atributos separados da geometria; não convertê-los diretamente em longitude/latitude. dtlevanta é texto de 8 caracteres; os demais campos Date são timestamps ArcGIS, sem inferir data de vistoria ou fuso quando não documentados.\n\n` +
      `## Todos os campos\n\n| Campo | Alias | Tipo | Tamanho | Domínio/coded values |\n|---|---|---|---:|---|\n` +
      layer.fields
        .map(
          (f: Json) =>
            `| ${md(f.name)} | ${md(f.alias)} | ${md(f.type)} | ${md(f.length)} | ${f.domain ? md(JSON.stringify(f.domain)) : "Nenhum (null)"} |`,
        )
        .join("\n") +
      "\n",
  );
  const speciesTable = dictionary
    .map(
      (s) =>
        `| ${s.codigo} | ${md(s.nome)} | ${md(s.cientifico)} | ${frequency.has(s.codigo) ? fmt(frequency.get(s.codigo)!) : "Não observado"} | ${hits.some((h) => h.codigo === s.codigo) ? "Sim" : ""} |`,
    )
    .join("\n");
  await document(
    "ESPECIES_ENCONTRADAS.md",
    `# Espécies e nomenclatura encontradas\n\n${header}` +
      `A descoberta ocorreu **antes do filtro**: ${names.length} valores distintos ordenados de nm e ${codes.length} de cdespecie. Todos estão em [especies_distintas.json](../../data/prefeitura/especies_distintas.json), com os ${groups.length} grupos e suas frequências. O dicionário possui ${dictionary.length} códigos; ${observed.length} estão presentes na camada. Acentos foram decodificados conforme charset ${declaration}, preservando os bytes originais. O HTML legado não informa versão/data de validade; nenhum nome foi modernizado para Handroanthus por inferência.\n\n` +
      `Busca ampla, sem distinção de caixa/acentos: IPE, IPÊ, TABEBUIA, HANDROANTHUS, em nome popular e científico do dicionário. Uma ocorrência lexical pode ser enganosa (por exemplo Piper, efetivamente encontrado); não constitui classificação. Na camada nm não há nomes de ipês. “Number Null” ocorre em ${fmt(unexpectedNames.filter((r) => r.nm === "Number Null").reduce((sum, r) => sum + r.n, 0))} registros e acompanha código 0. Outras divergências de representação entre nm e o código: ${JSON.stringify(unexpectedNames.filter((r) => r.nm !== "Number Null"))}; preservadas sem criar nova espécie. CDTPARVORE também foi inspecionado antes da seleção: ${otherCodeDistribution.length} valores. A ajuda oficial fornece apenas o tipo N(3), sem descrição ou dicionário; não reutilizar a tabela de CDESPECIE nesse campo por coincidência de números.\n\n` +
      `## Regra e candidatos\n\nSelecionar somente códigos efetivamente observados cuja coluna NMCIENTIFICO do dicionário contém literalmente Tabebuia ou Handroanthus. SQL: \`${where}\`. Total: **${fmt(possible)}**. Não assumir equivalência taxonômica atual. A cor é derivada somente de palavras explícitas no nome popular; caraíba permanece NAO_INFORMADA.\n\n` +
      `| Código | Nome municipal | Científico municipal | Quantidade | Cor literal |\n|---:|---|---|---:|---|\n` +
      categories
        .map(
          (s) =>
            `| ${s.codigo} | ${md(s.nome)} | ${md(s.cientifico)} | ${fmt(s.quantidade!)} | ${s.cor_literal} |`,
        )
        .join("\n") +
      `\n\n## Correspondências lexicais excluídas\n\n` +
      lexicalExcluded
        .map(
          (s) =>
            `- ${s.codigo}: **${s.nome}**, ${s.cientifico}, ${fmt(frequency.get(s.codigo)!)} registros. Não pertence aos gêneros selecionados no dicionário.`,
        )
        .join("\n") +
      `\n\nGrafias distintas são preservadas (hífens, maiúsculas e nomes compostos). Não foram fundidos códigos de espécies diferentes. Códigos com o mesmo nome científico literal: ${JSON.stringify(synonymGroups.filter((g) => g.codigos.length > 1))}; essa comparação não resolve sinonímia taxonômica. Código 0/nulo: ${fmt(unclassified)} (${pct(unclassified, total)}%). Códigos não zero sem descrição: ${fmt(unknownCount)} (${pct(unknownCount, total)}%); lista completa no JSON. Não inferir nomes desses códigos.\n\n` +
      `## Dicionário completo, inclusive espécies sem ocorrências\n\n| Código | Nome popular original | Científico original | Registros na camada | Destaque lexical |\n|---:|---|---|---:|---|\n${speciesTable}\n\n## Valores distintos originais\n\n**nm**, em ordem do servidor: ${names.map((r) => "`" + r.nm + "`").join(", ")}.\n\n**cdespecie**, em ordem numérica: ${codes.map((r) => "`" + r.cdespecie + "`").join(", ")}.\n`,
  );
  const report =
    `# Investigação da arborização pública de Goiânia\n\n${header}` +
    `## Respostas objetivas\n\n` +
    `1. **Há árvores individuais?** Sim: a camada Árvore tem feições pontuais com OBJECTID e id, compatíveis com cadastros individuais. Isso não comprova que cada ponto corresponda a uma árvore ainda existente.\n` +
    `2. **Quantas?** ${fmt(total)} registros, por returnCountOnly. O extent espacial é parcial; não é o total de árvores da cidade.\n` +
    `3. **É possível identificar ipês?** Sim, como candidatos cadastrais, cruzando cdespecie com o dicionário municipal. nm contém códigos, não nomes.\n` +
    `4. **Quantos possíveis ipês?** ${fmt(possible)}, sem incluir Tecoma stans/ipê-de-jardim. Contagem verificada tanto por query específica quanto pela soma dos grupos.\n` +
    `5. **Como são nomeados?**\n\n| Código | Nome municipal | Científico municipal | Registros |\n|---:|---|---|---:|\n` +
    categories
      .map(
        (s) =>
          `| ${s.codigo} | ${md(s.nome)} | ${md(s.cientifico)} | ${fmt(s.quantidade!)} |`,
      )
      .join("\n") +
    `\n\n6. **Cores distinguíveis?** Somente as explícitas nos nomes: ${Object.entries(
      colorCounts,
    )
      .map(([c, n]) => `${c}: ${fmt(n as number)}`)
      .join(
        "; ",
      )}. A classificação é textual, não observação de floração nem validação taxonômica.\n` +
    `7. **Atributos úteis?** Porte (inporte/porte), idade (inidade/idade), condição (incondarv), diâmetro da copa (indiamcopa/dpc), CAP (incap/cap), poda, interferências, observações, bairro (cdbairro), levantamento/cadastro/atualização/plantio. Duas famílias de campos antigas/novas não devem ser fundidas automaticamente; códigos, unidades e datas precisam de validação. Bairro é código sem domínio REST; não inventar nomes.\n` +
    `8. **Coordenadas?** Global: ${fmt(nullGeometry)} geometrias nulas; ${fmt(xyFilled)} registros com ambos os atributos x/y não nulos; ${fmt(xyZero)} com x ou y zero; ${fmt(validCoordinateCount)} (${pct(validCoordinateCount, total)}%) geometrias dentro do envelope WGS84 numericamente válido da camada. Contenção municipal ${extentIsInside ? "exata por envelope interno" : "**aproximada**, no polígono oficial generalizado a 0.0001 grau (~11m), precisão 6 casas"}: ${fmt(insideCount)} dentro/intersectando (${pct(insideCount, total)}%), ${fmt(total - nullGeometry - insideCount)} não nulos fora. Nos candidatos: ${fmt(candidatesInside)}/${fmt(possible)} dentro pelo mesmo método. Amostra: ${valid.length}/${sample.length} pontos WGS84 numericamente válidos (${pct(valid.length, sample.length)}%), ${outside.length} fora do polígono municipal **original**. Estar dentro do município não mede precisão de posicionamento, deslocamento de projeção ou existência atual.\n` +
    `9. **Limitações?** Dicionário HTML legado sem versão/data; ${fmt(unknownCount)} registros com códigos não zero sem descrição; ${fmt(unclassified)} sem classificação; ausência de domínio REST e de nomes científicos na camada; cobertura territorial parcial; campos paralelos/valores sentinela; ausência de confirmação recente em campo e de licença explícita no metadata (copyrightText: ${JSON.stringify(service.copyrightText)}). A amostra é dirigida por código/OBJECTID, não aleatória. Não se auditou a duplicidade de toda a base.\n` +
    `10. **Adequada para inicializar o Mapa dos Ipês?** Sim como catálogo municipal de candidatos para revisão e planejamento, condicionado à confirmação do vínculo/atualidade do dicionário e das condições de reutilização. Não é adequada para apresentar automaticamente árvores como confirmadas pela comunidade. Não importar ainda.\n` +
    `11. **Estratégia segura?** Criar primeiro um lote de homologação/quarentena, guardar snapshot e chaves de origem, comparar geometria com árvores existentes usando proximidade como alerta, revisar casos sem descrição, preservar atributos brutos e só publicar em categoria explícita de cadastro público. Não fabricar fotografias, observações, floração ou aprovação comunitária. A data técnica de edição não equivale à vistoria.\n` +
    `12. **O que não é verdade científica sem campo?** Identidade botânica individual, sinonímia atual, cor/floração efetiva, condição/saúde, medidas/unidades, idade, existência atual, autoria de vistoria e precisão dos pontos. O nome do dicionário é uma descrição cadastral.\n\n` +
    `## Completude global\n\nNome nm preenchido: ${fmt(nmFilled)} (${pct(nmFilled, total)}%), mas são códigos textuais. Nome descritivo recuperável pelo dicionário, excluindo código 0/nulo: ${fmt(resolved)} (${pct(resolved, total)}%). Sem classificação (0/nulo): ${fmt(unclassified)} (${pct(unclassified, total)}%). Código não zero sem descrição é uma categoria separada: ${fmt(unknownCount)} (${pct(unknownCount, total)}%). Estes denominadores são os ${fmt(total)} registros da camada Árvore.\n\n` +
    `| Campo | Não nulos | Brancos | Não vazios | % do total | Mínimo | Máximo |\n|---|---:|---:|---:|---:|---|---|\n` +
    fieldCompleteness
      .map(
        (f) =>
          `| ${f.campo} | ${fmt(f.nao_nulos)} | ${fmt(f.brancos)} | ${fmt(f.nao_vazios)} | ${f.porcentagem_nao_vazios} | ${md(f.min_iso ?? f.min)} | ${md(f.max_iso ?? f.max)} |`,
      )
      .join("\n") +
    `\n\nBranco = comparação SQL com '' ou ' ' no servidor; outros sentinelas e strings de múltiplos espaços não reconhecidas pela comparação não são somados a branco. TRIM não é aceito por este serviço. Valores como '-', 'Number Null', 0 e códigos de categoria não são automaticamente informação válida. Datas numéricas são milissegundos ArcGIS; extremos e distribuições brutas estão em [qualidade.json](../../data/prefeitura/qualidade.json). dtlevanta não foi convertido sem regra confirmada. As contagens por bairro constam em [ipes_resumo.json](../../data/prefeitura/ipes_resumo.json); bairros continuam códigos.\n\n` +
    `## Amostra e suspeitas\n\n[GeoJSON de ${sample.length} candidatos](../../data/prefeitura/ipes_amostra.geojson), solicitado com f=geojson, outSR=4326, returnGeometry=true, outFields=*. Atributos originais preservados; nenhuma classificação adicional inserida nas propriedades. ${pairs.filter((p) => p.coordenadas_identicas).length} pares com coordenadas idênticas e ${pairs.length} pares a até 5m **na amostra**. Proximidade não comprova duplicação; não se extrapolam essas contagens para todos os candidatos. Detalhes de IDs/distâncias, vazios por campo e ${strangeDates.length} datas fora da faixa 1900–consulta+1dia estão no JSON de qualidade. Ausência de suspeitas na amostra não comprova qualidade global.\n\n**Alerta global de datas:** dtcadastro vai de ${fieldCompleteness.find((f) => f.campo === "dtcadastro")?.min_iso} a ${fieldCompleteness.find((f) => f.campo === "dtcadastro")?.max_iso}, com ${fmt(stats[0].n_dtcadastro)} valores. O extremo mais antigo merece revisão, e a faixa de cadastro é histórica; não presumir que os pontos representam árvores presentes hoje. dtatualiza e dtplantio estão integralmente nulos na Árvore. A data técnica de edição isolada não atualiza a vistoria de toda a base. Estes alertas globais são distintos do teste de datas da amostra.\n\n` +
    `## Plantio, separado\n\n[Camada 4](${SERVICE}/4): ${planting.name}, ${planting.geometryType}, ${planting.fields.length} campos, ${fmt(plantingTotal)} registros. Código de espécie 0 em ${fmt(plantingSpecies.filter((r) => r.cdespecie === 0).reduce((sum, r) => sum + r.n, 0))} registros; nenhum dos oito códigos de candidatos aparece nas estatísticas dessa camada. dtplantio está integralmente nulo. Distribuição de instatus: ${JSON.stringify(plantingStatus)}. Distribuição na Árvore: ${JSON.stringify(enumerations.instatus)}. Nomes da camada/valores de status não comprovam plantio executado nem árvore adulta/existente. Foram examinados metadata, estatísticas, datas e 5 registros sem geometria. Os mesmos números de OBJECTID foram consultados na Árvore apenas para comparação; OBJECTID é local a cada camada e pode coincidir sem representar a mesma entidade. Não houve união nem soma ao total de candidatos. Não foi estimada sobreposição global. Veja respostas e comparação em qualidade.json.\n\n` +
    `## Proposta de proveniência — sem alteração de schema\n\n\`fonte=PREFEITURA_GOIANIA\`; \`fonte_dataset=MAPA_MEIO_AMBIENTE\`; \`fonte_layer=ARVORE\`; \`fonte_layer_id=3\`; \`fonte_object_id=OBJECTID\`; \`fonte_id_secundario=id\`; \`fonte_data_consulta=timestamp UTC\`; \`fonte_url\`; \`fonte_snapshot_sha256\`; \`fonte_codigo_especie=cdespecie\`; \`fonte_descricao_original\`; \`fonte_dicionario_url/sha256\`; \`fonte_atributos_originais\`; \`status_validacao=CADASTRO_PUBLICO\`. A chave técnica composta inclui fonte+dataset+camada+OBJECTID; verificar estabilidade dos IDs entre versões antes de usar upsert. Guarda separada para geometria original EPSG:31982 e transformada EPSG:4326; versão do lote e decisões de revisão rastreáveis. Código e descrição cadastral separados de identificação botânica validada. Este status expressa origem cadastral, sem equivaler a aprovação comunitária.\n\n` +
    `## Reproduzir e auditar\n\nVer [instruções do script](../../scripts/investigacao/README.md). São consultas sequenciais com intervalo mínimo de 400ms, páginas de no máximo 1000, timeout 45s, até 3 tentativas em falhas de transporte/HTTP 429/5xx e interrupção explícita em erro ArcGIS/metadata inesperado. O snapshot inclui todos os parâmetros e bytes, com SHA-256. Não é transação: alterações durante as consultas podem gerar diferenças; verificações de soma detectam parte desse risco. Nenhuma descarga integral de feições foi feita. Só ${sample.length} geometrias de árvores, limites municipais e 5 atributos de Plantio nesta execução. A exploração prévia também preservou uma pequena prova de GeoJSON. Arquivos iniciais de exploração foram mantidos em evidencias/.\n\nO envio do polígono municipal completo (4129 vértices) retornou HTTP 500, inclusive após retry. O envelope da camada não está integralmente contido no limite original; isso **não significa** que as árvores estejam fora, pois os cantos do envelope podem não ter árvores. A contagem municipal usa então uma generalização **feita pelo serviço oficial** (0.0001 grau, aproximadamente 11m; precisão 6 casas), preservada separadamente. Essa contagem global é aproximada e não resolve pontos eventualmente situados na faixa de tolerância da fronteira. A amostra usa o polígono original, sem generalização. A execução inicial interrompida foi registrada em evidencias/execucao_poligono_erro500.json. Um teste exploratório anterior de generalização sem precisão explícita retornou polígono degenerado, rejeitado; o script exige precisão explícita e mais de 100 vértices.\n`;
  await document("RELATORIO_INVESTIGACAO.md", report);
  if (!replay) {
    manifest.completedAt = new Date().toISOString();
    manifest.result = {
      total,
      possible,
      sample: sample.length,
      requests: manifest.requests.length,
    };
    await save("consultas.json", manifest);
  }
  console.log(
    JSON.stringify(
      {
        total_arvores: total,
        possiveis_ipes: possible,
        codigos: candidates.map((s) => s.codigo),
        amostra: sample.length,
        dentro_municipio: insideCount,
        sem_classificacao: unclassified,
        codigos_sem_descricao: unknownCount,
        consultas: manifest.requests.length,
        replay,
      },
      null,
      2,
    ),
  );
}

if (process.argv.includes("--self-test")) selfTest();
else
  main().catch(async (error) => {
    console.error(
      "Investigação interrompida; não há resultado completo:",
      String(error),
    );
    if (!replay && manifest) {
      manifest.failedAt = new Date().toISOString();
      manifest.error = String(error);
      await save("consultas.json", manifest);
    }
    process.exitCode = 1;
  });

import { createHash } from "node:crypto";
export const SOURCE = {
  fonte: "PREFEITURA_GOIANIA",
  dataset: "MAPA_MEIO_AMBIENTE",
  layer: "ARVORE",
  layer_id: 3,
};
export const CODES = [16, 36, 118, 119, 166, 175, 176, 306];
export const EXPECTED = {
  16: 708,
  36: 174,
  118: 150,
  119: 462,
  166: 45,
  175: 335,
  176: 39,
  306: 1,
};
export const sha = (value) =>
  createHash("sha256")
    .update(typeof value === "string" ? value : JSON.stringify(value))
    .digest("hex");
export function sourceId(objectid) {
  const bytes = createHash("sha256")
    .update(`${SOURCE.fonte}/${SOURCE.dataset}/${SOURCE.layer}/${objectid}`)
    .digest()
    .subarray(0, 16);
  bytes[6] = (bytes[6] & 15) | 80;
  bytes[8] = (bytes[8] & 63) | 128;
  const h = bytes.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
export function meters(a, b) {
  const r = Math.PI / 180;
  const h =
    Math.sin(((b.latitude - a.latitude) * r) / 2) ** 2 +
    Math.cos(a.latitude * r) *
      Math.cos(b.latitude * r) *
      Math.sin(((b.longitude - a.longitude) * r) / 2) ** 2;
  return (
    6371008.8 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(Math.max(0, 1 - h)))
  );
}
export function pointInside([x, y], rings) {
  let result = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i],
        [xj, yj] = ring[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
        result = !result;
    }
  return result;
}
/** @param {Record<string, number>} expected */
export function assemble(
  original,
  projected,
  categories,
  queriedAt,
  expected = EXPECTED,
) {
  const positions = new Map(
    projected.map((f) => [f.attributes.OBJECTID, f.geometry]),
  );
  if (positions.size !== projected.length)
    throw new Error("OBJECTID WGS84 duplicado.");
  const ids = new Set();
  const counts = {};
  const rows = original
    .map((f) => {
      const a = f.attributes,
        id = a.OBJECTID,
        code = a.cdespecie,
        category = categories.find((c) => c.codigo === code),
        wgs = positions.get(id);
      if (
        !Number.isSafeInteger(id) ||
        ids.has(id) ||
        !CODES.includes(code) ||
        !category
      )
        throw new Error("Identificador duplicado ou espécie não autorizada.");
      ids.add(id);
      counts[code] = (counts[code] || 0) + 1;
      if (
        !f.geometry ||
        !wgs ||
        ![f.geometry.x, f.geometry.y, wgs.x, wgs.y].every(Number.isFinite) ||
        Math.abs(wgs.x) > 180 ||
        Math.abs(wgs.y) > 90
      )
        throw new Error("Coordenadas inválidas.");
      const color = {
        AMARELO: "AMARELO",
        ROXO: "ROSA_ROXO",
        ROSA: "ROSA_ROXO",
        BRANCO: "BRANCO",
        NAO_INFORMADA: "NAO_SEI",
      }[category.cor_literal];
      if (!color) throw new Error("Cor cadastral desconhecida.");
      const payload = {
        codigo_especie: code,
        descricao: category.nome,
        nome_cientifico: category.cientifico,
        cor_cadastral: color,
        geometria_original: {
          ...f.geometry,
          spatialReference: { wkid: 31982 },
        },
        atributos_brutos: a,
        latitude: wgs.y,
        longitude: wgs.x,
      };
      return {
        ...SOURCE,
        objectid: id,
        id: sourceId(id),
        codigo_publico: `GYN-MUN-${id}`,
        ...payload,
        hash_payload: sha(payload),
        fonte_data_consulta: queriedAt,
      };
    })
    .sort((a, b) => a.objectid - b.objectid);
  if (
    positions.size !== rows.length ||
    JSON.stringify(
      Object.fromEntries(Object.entries(counts).sort(([a], [b]) => +a - +b)),
    ) !== JSON.stringify(expected)
  )
    throw new Error(
      "Contagens divergem do lote aprovado. Interromper e investigar.",
    );
  return rows;
}
export function verifyRows(rows, categories) {
  const rebuilt = assemble(
    rows.map((r) => ({
      attributes: r.atributos_brutos,
      geometry: { x: r.geometria_original.x, y: r.geometria_original.y },
    })),
    rows.map((r) => ({
      attributes: { OBJECTID: r.objectid },
      geometry: { x: r.longitude, y: r.latitude },
    })),
    categories,
    rows[0]?.fonte_data_consulta,
  );
  if (rebuilt.length !== 1914) throw new Error("Lote incompleto.");
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i],
      safe = rebuilt[i];
    if (
      r.id !== safe.id ||
      r.codigo_publico !== safe.codigo_publico ||
      r.objectid !== safe.objectid ||
      r.hash_payload !== safe.hash_payload ||
      r.geometria_original.spatialReference.wkid !== 31982 ||
      r.fonte !== SOURCE.fonte ||
      r.dataset !== SOURCE.dataset ||
      r.layer !== SOURCE.layer ||
      r.layer_id !== 3
    )
      throw new Error("Snapshot inconsistente ou alterado.");
    for (const field of [
      "codigo_especie",
      "descricao",
      "nome_cientifico",
      "cor_cadastral",
      "latitude",
      "longitude",
      "geometria_original",
      "atributos_brutos",
    ])
      if (sha(r[field]) !== sha(safe[field]))
        throw new Error("Atributos do snapshot divergem da origem aprovada.");
  }
}
export function planRows(rows, existing, origins = [], rings) {
  const byOrigin = new Map(origins.map((r) => [+r.objectid, r]));
  const conflicts = [],
    proximity = [],
    internal = [];
  let inserts = 0,
    updates = 0,
    unchanged = 0;
  for (const row of rows) {
    const origin = byOrigin.get(row.objectid);
    if (origin) {
      if (origin.hash_payload === row.hash_payload) unchanged++;
      else updates++;
    } else inserts++;
    for (const tree of existing) {
      if (tree.id === origin?.arvore_id) continue;
      if (tree.id === row.id || tree.codigo_publico === row.codigo_publico)
        conflicts.push({
          tipo: "COLISAO_CHAVE",
          OBJECTID: row.objectid,
          arvore_id: tree.id,
        });
      const d = meters(row, tree);
      if (d <= 10)
        proximity.push({
          OBJECTID: row.objectid,
          arvore_id: tree.id,
          distancia_m: +d.toFixed(3),
        });
    }
    if (rings && !pointInside([row.longitude, row.latitude], rings))
      conflicts.push({ tipo: "FORA_LIMITE_MUNICIPAL", OBJECTID: row.objectid });
  }
  for (let i = 0; i < rows.length; i++)
    for (let j = i + 1; j < rows.length; j++) {
      // Recorte barato antes de calcular distância; 10m é alerta, nunca fusão automática.
      if (
        Math.abs(rows[i].latitude - rows[j].latitude) > 0.0001 ||
        Math.abs(rows[i].longitude - rows[j].longitude) > 0.00011
      )
        continue;
      const d = meters(rows[i], rows[j]);
      if (d <= 10)
        internal.push({
          OBJECTIDs: [rows[i].objectid, rows[j].objectid],
          distancia_m: +d.toFixed(3),
          coordenadas_identicas:
            rows[i].latitude === rows[j].latitude &&
            rows[i].longitude === rows[j].longitude,
        });
    }
  return {
    esperados: rows.length,
    inserts,
    updates,
    sem_alteracao: unchanged,
    conflitos_bloqueantes: conflicts,
    proximidade_com_existentes: proximity,
    pares_municipais_ate_10m: internal,
    observacoes_criadas: 0,
    fotos_criadas: 0,
    floridas_por_importacao: 0,
    status_validacao: "CADASTRO_PUBLICO",
    confirmadas_por_importacao: 0,
  };
}

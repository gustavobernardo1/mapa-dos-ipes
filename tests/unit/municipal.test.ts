import { beforeAll, afterAll, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import {
  mutateLocal,
  readLocal,
  localSubmit,
  localModerate,
  publicTrees,
  localStats,
} from "../../src/lib/server/local";
import {
  municipalUnverified,
  type Tree,
  submissionSchema,
} from "../../src/lib/domain";
import {
  assemble,
  planRows,
  sourceId,
  SOURCE,
} from "../../scripts/importacao/prefeitura-core.mjs";
let directory: string;
const id = randomUUID(),
  now = new Date().toISOString();
const municipal: Tree = {
  id,
  codigo_publico: "GYN-MUN-1371",
  nome_popular: "Ipê-roxo",
  especie_id: null,
  latitude: -16.712,
  longitude: -49.259,
  cor_principal: "ROSA_ROXO",
  bairro: "",
  status: "PENDENTE",
  confianca: "D",
  criado_em: now,
  atualizado_em: now,
  observacoes: [],
  origem_municipal: true,
  status_validacao: "CADASTRO_PUBLICO",
  status_verificacao_comunitaria: "NAO_VERIFICADA",
  cor_cadastral: "ROSA_ROXO",
  proveniencia_municipal: {
    ...SOURCE,
    OBJECTID: 1371,
    codigo_especie: 16,
    descricao: "Ipê-roxo",
    nome_cientifico: "Tabebuia impetiginosa",
    data_consulta: now,
  },
};
beforeAll(async () => {
  directory = await mkdtemp(path.join(process.cwd(), ".test-data-municipal-"));
  process.env.LOCAL_DATA_DIR = directory;
  process.env.DATA_BACKEND = "local";
  await mutateLocal((db) => db.trees.push(municipal));
});
afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});
function submit(offset = 0, treeId = id) {
  const oid = randomUUID(),
    fid = randomUUID();
  const s = submissionSchema.parse({
    latitude: municipal.latitude + offset,
    longitude: municipal.longitude,
    data_observacao: "2023-09-01",
    origem: "FOTO_HISTORICA",
    cor_observada: "AMARELO",
    status_floracao: "INTENSA",
    identificacao_usuario: "PROVAVEL",
    consentimento: true,
    arvore_id: treeId,
  });
  const p = {
    id: fid,
    observacao_id: oid,
    key: fid,
    thumbnail_key: fid + "-thumb",
    hash_arquivo: fid,
    largura: 100,
    altura: 100,
    criado_em: now,
  };
  return {
    s,
    p,
    m: {
      foto_id: fid,
      data_exif: null,
      latitude_exif: null,
      longitude_exif: null,
    },
  };
}
it("publishes municipal candidates without inventing observations, confirmation or bloom", async () => {
  const db = await readLocal();
  expect(publicTrees(db)).toHaveLength(1);
  expect(municipalUnverified(publicTrees(db)[0])).toBe(true);
  expect(localStats(db)).toMatchObject({
    arvores: 1,
    observacoes: 0,
    fotos: 0,
    floridas: 0,
  });
});
it("enforces 10m and preserves cadastral color/provenance after photographic approval", async () => {
  const far = submit(0.00012);
  await expect(
    mutateLocal((db) => localSubmit(db, far.s, far.p, far.m)),
  ).rejects.toThrow("longe");
  const near = submit(0.00007);
  await mutateLocal((db) => localSubmit(db, near.s, near.p, near.m));
  expect(publicTrees(await readLocal())[0].observacoes).toHaveLength(0);
  await mutateLocal((db) =>
    localModerate(db, near.p.observacao_id, {
      status: "APROVADO",
      cor: "AMARELO",
      confianca: "B",
      especie_id: null,
      criar_nova: false,
    }),
  );
  const t = publicTrees(await readLocal())[0];
  expect(t.status_validacao).toBe("CADASTRO_PUBLICO");
  expect(t.proveniencia_municipal).toEqual(municipal.proveniencia_municipal);
  expect(t.cor_cadastral).toBe("ROSA_ROXO");
  expect(t.cor_principal).toBe("AMARELO");
  expect(t.status_verificacao_comunitaria).toBe("VERIFICADA_FOTOGRAFICAMENTE");
  expect(localStats(await readLocal()).floridas).toBe(0);
});
it("does not clone municipal origin when moderation creates a different tree", async () => {
  const input = submit();
  await mutateLocal((db) => localSubmit(db, input.s, input.p, input.m));
  await mutateLocal((db) =>
    localModerate(db, input.p.observacao_id, {
      status: "APROVADO",
      cor: "AMARELO",
      confianca: "D",
      especie_id: null,
      criar_nova: true,
    }),
  );
  const db = await readLocal(),
    other = db.trees.find((t) => t.id !== id)!;
  expect(other.origem_municipal).toBe(false);
  expect(other.proveniencia_municipal).toBeNull();
  expect(db.trees.find((t) => t.id === id)?.proveniencia_municipal).toEqual(
    municipal.proveniencia_municipal,
  );
});
it("builds a deterministic, idempotent plan and rejects Plantio/unauthorized species", () => {
  const original = [
      {
        attributes: { OBJECTID: 1371, cdespecie: 16 },
        geometry: { x: 681000, y: 8150000 },
      },
    ],
    projected = [
      { attributes: { OBJECTID: 1371 }, geometry: { x: -49.259, y: -16.712 } },
    ];
  const categories = [
    {
      codigo: 16,
      nome: "Ipê-roxo",
      cientifico: "Tabebuia impetiginosa",
      cor_literal: "ROXO",
    },
  ];
  const rows = assemble(original, projected, categories, now, { 16: 1 });
  expect(rows[0].id).toBe(sourceId(1371));
  expect(planRows(rows, [])).toMatchObject({
    inserts: 1,
    updates: 0,
    observacoes_criadas: 0,
    fotos_criadas: 0,
    confirmadas_por_importacao: 0,
  });
  expect(
    planRows(
      rows,
      [],
      [
        {
          objectid: 1371,
          arvore_id: rows[0].id,
          hash_payload: rows[0].hash_payload,
        },
      ],
    ),
  ).toMatchObject({ inserts: 0, updates: 0, sem_alteracao: 1 });
  expect(
    planRows(
      rows,
      [],
      [{ objectid: 1371, arvore_id: rows[0].id, hash_payload: "old" }],
    ),
  ).toMatchObject({ inserts: 0, updates: 1 });
  expect(() =>
    assemble(
      [{ ...original[0], attributes: { OBJECTID: 1371, cdespecie: 3 } }],
      projected,
      categories,
      now,
      { 3: 1 },
    ),
  ).toThrow("não autorizada");
  expect(() =>
    assemble([...original, ...original], projected, categories, now, { 16: 2 }),
  ).toThrow("duplicado");
  expect(
    planRows(rows, [
      { id: rows[0].id, codigo_publico: "existing", latitude: 0, longitude: 0 },
    ]).conflitos_bloqueantes,
  ).toHaveLength(1);
});

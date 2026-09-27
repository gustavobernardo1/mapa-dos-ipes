import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { localDirectory, HttpError } from "./config";
import {
  distanceMeters,
  latest,
  recentBloom,
  type Tree,
  type Observation,
  type Photo,
  type Metadata,
  type Submission,
  type Moderation,
  type Stats,
} from "../domain";
type Database = {
  trees: Tree[];
  observations: Observation[];
  photos: Photo[];
  metadata: Metadata[];
};
const empty = (): Database => ({
  trees: [],
  observations: [],
  photos: [],
  metadata: [],
});
const globals = globalThis as typeof globalThis & {
  localDbQueue?: Promise<unknown>;
};
export async function readLocal(): Promise<Database> {
  try {
    return JSON.parse(
      await fs.readFile(path.join(localDirectory(), "database.json"), "utf8"),
    );
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return empty();
    throw e;
  }
}
// Atomic replacement and a shared queue protect writes within the single development server.
export function mutateLocal<T>(fn: (db: Database) => T): Promise<T> {
  const op = (globals.localDbQueue || Promise.resolve())
    .catch(() => {})
    .then(async () => {
      const db = await readLocal(),
        value = fn(db);
      await fs.mkdir(localDirectory(), { recursive: true });
      const temp = path.join(localDirectory(), `${randomUUID()}.tmp`);
      await fs.writeFile(temp, JSON.stringify(db));
      try {
        for (let attempt = 0; ; attempt++) {
          try {
            await fs.rename(temp, path.join(localDirectory(), "database.json"));
            break;
          } catch (e) {
            if (
              attempt >= 6 ||
              !["EPERM", "EBUSY", "EACCES"].includes(
                (e as NodeJS.ErrnoException).code || "",
              )
            )
              throw e;
            // Windows may briefly lock the destination while another request reads it.
            await delay(15 * 2 ** attempt);
          }
        }
      } catch (e) {
        await fs.unlink(temp).catch(() => {});
        throw e;
      }
      return value;
    });
  globals.localDbQueue = op;
  return op;
}
export function hydrate(db: Database, t: Tree, admin = false): Tree {
  const obs = db.observations
    .filter(
      (o) =>
        o.arvore_id === t.id && (admin || o.status_moderacao === "APROVADO"),
    )
    .map((o) => ({
      ...o,
      fotos: db.photos.filter((p) => p.observacao_id === o.id),
      ...(admin
        ? {
            metadata: db.metadata.filter((m) =>
              db.photos.some(
                (p) => p.id === m.foto_id && p.observacao_id === o.id,
              ),
            ),
          }
        : {}),
    }));
  return {
    ...t,
    observacoes: obs.sort((a, b) =>
      b.data_observacao.localeCompare(a.data_observacao),
    ),
  };
}
export function publicTrees(db: Database): Tree[] {
  return db.trees
    .filter(
      (t) =>
        (t.origem_municipal &&
          t.status_validacao === "CADASTRO_PUBLICO" &&
          t.status !== "REJEITADO") ||
        (t.status === "APROVADO" &&
          db.observations.some(
            (o) => o.arvore_id === t.id && o.status_moderacao === "APROVADO",
          )),
    )
    .map((t) => hydrate(db, t));
}
export function localStats(db: Database): Stats {
  const trees = publicTrees(db),
    observations = trees.flatMap((t) => t.observacoes);
  return {
    arvores: trees.length,
    observacoes: observations.length,
    fotos: observations.flatMap((o) => o.fotos).length,
    floridas: trees.filter((t) => {
      const o = latest(t);
      return o && recentBloom(o);
    }).length,
    amarelas: trees.filter((t) => t.cor_principal === "AMARELO").length,
    rosas_roxas: trees.filter((t) => t.cor_principal === "ROSA_ROXO").length,
    brancas: trees.filter((t) => t.cor_principal === "BRANCO").length,
  };
}
export function localSubmit(
  db: Database,
  s: Submission,
  p: Photo,
  m: Metadata,
) {
  const now = new Date().toISOString();
  let t = s.arvore_id
    ? publicTrees(db).find((t) => t.id === s.arvore_id)
    : undefined;
  if (s.arvore_id && !t) throw new HttpError(400, "Árvore não disponível.");
  if (
    t &&
    distanceMeters(s.latitude, s.longitude, t.latitude, t.longitude) >
      (t.origem_municipal ? 10 : 100)
  )
    throw new HttpError(
      400,
      "O ponto informado fica longe da árvore selecionada. Confira a localização.",
    );
  if (!t) {
    t = {
      id: randomUUID(),
      codigo_publico: `GYN-${String(db.trees.length + 1).padStart(5, "0")}`,
      especie_id: null,
      nome_popular: "Ipê provável",
      latitude: s.latitude,
      longitude: s.longitude,
      cor_principal: s.cor_observada,
      bairro: s.bairro,
      status: "PENDENTE",
      confianca: "D",
      criado_em: now,
      atualizado_em: now,
      observacoes: [],
      origem_municipal: false,
      status_validacao: "REGISTRO_COMUNITARIO",
      status_verificacao_comunitaria: "NAO_VERIFICADA",
      verificado_comunidade_em: null,
      descricao_municipal: null,
      cor_cadastral: null,
      proveniencia_municipal: null,
    };
    db.trees.push(t);
  }
  const { consentimento: _consent, arvore_id: _tree, ...declared } = s;
  void _consent;
  void _tree;
  const o: Observation = {
    ...declared,
    id: p.observacao_id,
    arvore_id: t.id,
    campanha_id: "IPES_GOIANIA_2026",
    confianca_dados: "D",
    status_moderacao: "PENDENTE",
    criado_em: now,
    fotos: [],
  };
  if (db.photos.some((existing) => existing.hash_arquivo === p.hash_arquivo))
    throw new HttpError(409, "Esta fotografia já foi enviada.");
  db.observations.push(o);
  db.photos.push(p);
  db.metadata.push(m);
  return { id: o.id, status: "PENDENTE" };
}
export function localModerate(db: Database, id: string, m: Moderation) {
  const o = db.observations.find((o) => o.id === id);
  if (!o) throw new HttpError(404, "Registro não encontrado.");
  if (o.status_moderacao !== "PENDENTE")
    throw new HttpError(409, "Este registro já foi moderado.");
  if (m.especie_id)
    throw new HttpError(400, "Espécie não disponível no modo local.");
  if (m.criar_nova) {
    const original = db.trees.find((t) => t.id === o.arvore_id)!;
    const created: Tree = {
      ...original,
      id: randomUUID(),
      codigo_publico: `GYN-${String(db.trees.length + 1).padStart(5, "0")}`,
      latitude: o.latitude,
      longitude: o.longitude,
      bairro: o.bairro,
      status: "PENDENTE",
      criado_em: new Date().toISOString(),
      observacoes: [],
      origem_municipal: false,
      status_validacao: "REGISTRO_COMUNITARIO",
      status_verificacao_comunitaria: "NAO_VERIFICADA",
      verificado_comunidade_em: null,
      descricao_municipal: null,
      cor_cadastral: null,
      proveniencia_municipal: null,
    };
    db.trees.push(created);
    o.arvore_id = created.id;
  } else if (m.arvore_id) {
    if (!publicTrees(db).some((t) => t.id === m.arvore_id))
      throw new HttpError(400, "Árvore não encontrada.");
    o.arvore_id = m.arvore_id;
  }
  const t = db.trees.find((t) => t.id === o.arvore_id)!;
  if (
    t.origem_municipal &&
    distanceMeters(o.latitude, o.longitude, t.latitude, t.longitude) > 10
  )
    throw new HttpError(
      400,
      "A confirmação deve estar a até 10 m do cadastro municipal.",
    );
  if (
    m.status === "APROVADO" &&
    !db.photos.some((p) => p.observacao_id === o.id)
  )
    throw new HttpError(400, "A aprovação exige uma fotografia.");
  o.status_moderacao = m.status;
  o.confianca_dados = m.confianca;
  o.cor_observada = m.cor;
  if (m.status === "APROVADO") {
    t.status = "APROVADO";
    t.cor_principal = m.cor;
    t.confianca = m.confianca;
    t.especie_id = m.especie_id;
    t.atualizado_em = new Date().toISOString();
    if (t.origem_municipal) {
      t.status_verificacao_comunitaria = "VERIFICADA_FOTOGRAFICAMENTE";
      t.verificado_comunidade_em ||= t.atualizado_em;
    }
  }
  return { id, status: o.status_moderacao };
}

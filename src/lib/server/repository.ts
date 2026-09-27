import { backend } from "./config";
import { rpc } from "./supabase";
import {
  hydrate,
  publicTrees,
  readLocal,
  localStats,
  localSubmit,
  localModerate,
  mutateLocal,
} from "./local";
import {
  distanceMeters,
  type Tree,
  type Stats,
  type Submission,
  type Photo,
  type Metadata,
  type Moderation,
  type Observation,
  type Species,
} from "../domain";
export type TreeQuery = {
  west?: number;
  south?: number;
  east?: number;
  north?: number;
  lat?: number;
  lng?: number;
  radius?: number;
  search?: string;
  color?: string;
  blooming?: boolean;
  species?: string;
  confidence?: string;
  since?: string;
  offset?: number;
  limit?: number;
  sort?: string;
};
export async function trees(q: TreeQuery = {}): Promise<Tree[]> {
  if (backend() === "supabase") return rpc("arvores_consulta", { filtros: q });
  const db = await readLocal();
  let ts = publicTrees(db);
  if (q.west !== undefined)
    ts = ts.filter(
      (t) =>
        t.longitude >= q.west! &&
        t.longitude <= q.east! &&
        t.latitude >= q.south! &&
        t.latitude <= q.north!,
    );
  if (q.lat !== undefined && q.lng !== undefined)
    ts = ts
      .map((t) => ({
        ...t,
        distancia: distanceMeters(q.lat!, q.lng!, t.latitude, t.longitude),
      }))
      .filter((t) => t.distancia! <= (q.radius || 10))
      .sort((a, b) => a.distancia! - b.distancia!);
  if (q.color) ts = ts.filter((t) => t.cor_principal === q.color);
  if (q.search)
    ts = ts.filter((t) =>
      `${t.bairro} ${t.codigo_publico} ${t.nome_popular}`
        .toLocaleLowerCase("pt-BR")
        .includes(q.search!.toLocaleLowerCase("pt-BR")),
    );
  if (q.species) ts = ts.filter((t) => t.especie_id === q.species);
  if (q.confidence) ts = ts.filter((t) => t.confianca === q.confidence);
  if (q.since)
    ts = ts.filter((t) =>
      t.observacoes.some((o) => o.data_observacao >= q.since!),
    );
  if (q.blooming) {
    const { latest, recentBloom } = await import("../domain");
    ts = ts.filter((t) => {
      const o = latest(t);
      return o && recentBloom(o);
    });
  }
  if (q.sort === "observations")
    ts.sort((a, b) => b.observacoes.length - a.observacoes.length);
  else if (q.lat === undefined)
    ts.sort(
      (a, b) =>
        b.atualizado_em.localeCompare(a.atualizado_em) ||
        a.id.localeCompare(b.id),
    );
  return ts.slice(
    q.offset || 0,
    (q.offset || 0) + Math.min(q.limit || 100, 500),
  );
}
export async function tree(id: string): Promise<Tree | null> {
  if (backend() === "supabase") return rpc("arvore_ficha", { alvo: id });
  return publicTrees(await readLocal()).find((t) => t.id === id) || null;
}
export async function stats(): Promise<Stats> {
  return backend() === "supabase"
    ? rpc("estatisticas")
    : localStats(await readLocal());
}
export async function species(): Promise<Species[]> {
  return backend() === "supabase" ? rpc("especies_publicas") : [];
}
export async function submit(s: Submission, p: Photo, m: Metadata) {
  return backend() === "supabase"
    ? rpc("enviar_registro", { dados: s, foto: p, metadados: m }, true)
    : mutateLocal((db) => localSubmit(db, s, p, m));
}
export async function pending(): Promise<(Observation & { arvore: Tree })[]> {
  if (backend() === "supabase") return rpc("moderacao_pendentes", {}, true);
  const db = await readLocal();
  return db.observations
    .filter((o) => o.status_moderacao === "PENDENTE")
    .slice(0, 50)
    .map((o) => ({
      ...hydrate(
        db,
        db.trees.find((t) => t.id === o.arvore_id)!,
        true,
      ).observacoes.find((v) => v.id === o.id)!,
      arvore: hydrate(
        db,
        db.trees.find((t) => t.id === o.arvore_id)!,
        true,
      ),
    }));
}
export async function moderate(id: string, m: Moderation, adminId: string) {
  return backend() === "supabase"
    ? rpc(
        "moderar_registro",
        { alvo: id, decisao: m, moderador: adminId },
        true,
      )
    : mutateLocal((db) => localModerate(db, id, m));
}
export async function authorizedPhoto(
  key: string,
  admin: boolean,
): Promise<boolean> {
  if (backend() === "supabase")
    return rpc("foto_autorizada", { chave: key, administrador: admin }, true);
  const db = await readLocal();
  return db.photos.some(
    (p) =>
      (p.key === key || p.thumbnail_key === key) &&
      db.observations.some(
        (o) =>
          o.id === p.observacao_id &&
          (admin ||
            (o.status_moderacao === "APROVADO" &&
              db.trees.some(
                (t) => t.id === o.arvore_id && t.status === "APROVADO",
              ))),
      ),
  );
}
export type GalleryItem = Photo & {
  observacao: Observation;
  arvore: Omit<Tree, "observacoes">;
};
export async function gallery(
  q: TreeQuery & { historical?: boolean; week?: boolean },
): Promise<GalleryItem[]> {
  if (backend() === "supabase") return rpc("galeria_consulta", { filtros: q });
  let result = publicTrees(await readLocal()).flatMap((t) =>
    t.observacoes.flatMap((o) =>
      o.fotos.map((p) => ({ ...p, observacao: o, arvore: t })),
    ),
  );
  if (q.color)
    result = result.filter((p) => p.observacao.cor_observada === q.color);
  if (q.search)
    result = result.filter((p) =>
      p.arvore.bairro.toLowerCase().includes(q.search!.toLowerCase()),
    );
  if (q.historical)
    result = result.filter((p) => p.observacao.origem === "FOTO_HISTORICA");
  if (q.week)
    result = result.filter(
      (p) =>
        p.observacao.data_observacao >=
        new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    );
  result.sort((a, b) =>
    b.observacao.data_observacao.localeCompare(a.observacao.data_observacao),
  );
  return result.slice(
    q.offset || 0,
    (q.offset || 0) + Math.min(q.limit || 24, 100),
  );
}

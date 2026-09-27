import { api, mapTrees } from "./client";
import { latest, recentBloom, type Tree, type Stats } from "./domain";

export type MapFilters = {
  color?: string;
  search?: string;
  species?: string;
  confidence?: string;
  since?: string;
  blooming?: boolean;
};
export type MapBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

// Current transport strategy: one complete public snapshot per page session.
// Keep retrieval separate from filtering/rendering so a future tile transport
// can replace this boundary without coupling network requests to map movement.
let dataset: Promise<Tree[]> | undefined;
let stats: Promise<Stats> | undefined;
export function loadMapStats(): Promise<Stats> {
  stats ??= api<Stats>("/api/stats").catch((error) => {
    stats = undefined;
    throw error;
  });
  return stats;
}
export function loadMapDataset(): Promise<Tree[]> {
  if (!dataset) {
    performance.mark("ipes:dataset:start");
    dataset = mapTrees(
      new URLSearchParams(),
      new AbortController().signal,
      loadMapStats().then((value) => value.arvores),
    )
      .then((trees) => {
        performance.mark("ipes:dataset:ready");
        performance.measure(
          "ipes:dataset:load",
          "ipes:dataset:start",
          "ipes:dataset:ready",
        );
        return trees;
      })
      .catch((error) => {
        dataset = undefined;
        throw error;
      });
  }
  return dataset;
}

export function filterMapTrees(
  trees: Tree[],
  filters: MapFilters,
  now = new Date(),
): Tree[] {
  if (!Object.values(filters).some(Boolean)) return trees;
  const search = filters.search?.toLocaleLowerCase("pt-BR");
  return trees.filter((tree) => {
    if (filters.color && tree.cor_principal !== filters.color) return false;
    if (filters.species && tree.especie_id !== filters.species) return false;
    if (filters.confidence && tree.confianca !== filters.confidence)
      return false;
    if (
      search &&
      ![
        tree.bairro,
        tree.codigo_publico,
        tree.nome_popular,
        tree.descricao_municipal || "",
      ].some((value) => value.toLocaleLowerCase("pt-BR").includes(search))
    )
      return false;
    if (
      filters.since &&
      !tree.observacoes.some(
        (observation) =>
          observation.status_moderacao === "APROVADO" &&
          observation.data_observacao >= filters.since!,
      )
    )
      return false;
    if (filters.blooming) {
      const observation = latest(tree);
      if (!observation || !recentBloom(observation, now)) return false;
    }
    return true;
  });
}

export function treesInBounds(trees: Tree[], bounds?: MapBounds): Tree[] {
  if (!bounds) return trees;
  return trees.filter(
    (tree) =>
      tree.longitude >= bounds.west &&
      tree.longitude <= bounds.east &&
      tree.latitude >= bounds.south &&
      tree.latitude <= bounds.north,
  );
}

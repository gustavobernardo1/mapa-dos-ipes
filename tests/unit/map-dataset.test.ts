import { it, expect, vi, afterEach } from "vitest";
import { filterMapTrees, treesInBounds } from "../../src/lib/map-dataset";
import type { Tree, Observation } from "../../src/lib/domain";
afterEach(() => vi.unstubAllGlobals());

it("shares one initial dataset across consumers and does not refetch a loaded snapshot", async () => {
  vi.resetModules();
  const fetch = vi.fn(async (url: string) => {
    if (url === "/api/stats") return Response.json({ arvores: 1914 });
    const query = new URL(url, "http://localhost").searchParams;
    expect(query.has("west")).toBe(false);
    expect(query.has("color")).toBe(false);
    const offset = Number(query.get("offset"));
    return Response.json(
      Array.from({ length: Math.min(500, 1914 - offset) }, (_, i) => ({
        id: String(offset + i),
      })),
    );
  });
  vi.stubGlobal("fetch", fetch);
  const { loadMapDataset } = await import("../../src/lib/map-dataset");
  const [first, second] = await Promise.all([
    loadMapDataset(),
    loadMapDataset(),
  ]);
  expect(first).toHaveLength(1914);
  expect(second).toBe(first);
  expect(await loadMapDataset()).toBe(first);
  expect(fetch).toHaveBeenCalledTimes(5); // one shared stats request + four pages
});

it("applies existing filters locally without interpreting cadastral color as current bloom", () => {
  const tree = {
    id: "municipal",
    codigo_publico: "GYN-MUN-16",
    bairro: "Centro",
    nome_popular: "Ipê-roxo",
    descricao_municipal: "Ipê-roxo",
    cor_principal: "ROSA_ROXO",
    especie_id: "species",
    confianca: "D",
    latitude: -16.686,
    longitude: -49.264,
    observacoes: [],
  } as unknown as Tree;
  const historical = {
    ...tree,
    id: "historical",
    observacoes: [
      {
        status_moderacao: "APROVADO",
        data_observacao: "2023-09-01",
        criado_em: "2023-09-01T00:00:00Z",
        status_floracao: "INTENSA",
      } as Observation,
    ],
  };
  const current = {
    ...tree,
    id: "current",
    cor_principal: "BRANCO" as const,
    observacoes: [
      {
        status_moderacao: "APROVADO",
        data_observacao: "2026-09-25",
        criado_em: "2026-09-25T00:00:00Z",
        status_floracao: "INTENSA",
      } as Observation,
    ],
  };
  const rows = [tree, historical, current];
  expect(filterMapTrees(rows, {})).toBe(rows);
  expect(
    filterMapTrees(rows, {
      color: "ROSA_ROXO",
      species: "species",
      confidence: "D",
      search: "ROXO",
    }),
  ).toEqual([tree, historical]);
  expect(filterMapTrees(rows, { since: "2026-01-01" })).toEqual([current]);
  expect(
    filterMapTrees(rows, { blooming: true }, new Date("2026-09-26T12:00:00Z")),
  ).toEqual([current]);
  expect(
    treesInBounds(rows, {
      west: -49.27,
      east: -49.26,
      south: -16.69,
      north: -16.68,
    }),
  ).toEqual(rows);
  expect(
    treesInBounds(rows, {
      west: -49.2,
      east: -49.1,
      south: -16.69,
      north: -16.68,
    }),
  ).toEqual([]);
});

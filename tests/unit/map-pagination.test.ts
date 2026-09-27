import { it, expect, vi, afterEach } from "vitest";
import { mapTrees } from "../../src/lib/client";
afterEach(() => vi.unstubAllGlobals());
it("loads all 1914 candidates through viewport pagination, preserving filters", async () => {
  const fetch = vi.fn(async (url: string) => {
    const q = new URL(url, "http://localhost").searchParams;
    expect(q.get("color")).toBe("AMARELO");
    expect(q.get("limit")).toBe("500");
    const offset = Number(q.get("offset"));
    return Response.json(
      Array.from({ length: Math.min(500, 1914 - offset) }, (_, i) => ({
        id: String(offset + i),
      })),
    );
  });
  vi.stubGlobal("fetch", fetch);
  const trees = await mapTrees(
    new URLSearchParams({ color: "AMARELO" }),
    new AbortController().signal,
  );
  expect(trees).toHaveLength(1914);
  expect(new Set(trees.map((t) => t.id)).size).toBe(1914);
  expect(fetch).toHaveBeenCalledTimes(4);
});
it("finishes the snapshot when a stale public count underestimates the number of rows", async () => {
  const fetch = vi.fn(async (url: string) => {
    const offset = Number(
      new URL(url, "http://localhost").searchParams.get("offset"),
    );
    return Response.json(
      Array.from({ length: Math.min(500, 1914 - offset) }, (_, index) => ({
        id: String(offset + index),
      })),
    );
  });
  vi.stubGlobal("fetch", fetch);
  const trees = await mapTrees(
    new URLSearchParams(),
    new AbortController().signal,
    Promise.resolve(1000),
  );
  expect(trees).toHaveLength(1914);
  expect(fetch).toHaveBeenCalledTimes(4);
});

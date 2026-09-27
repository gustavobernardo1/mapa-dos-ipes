import type { Tree } from "./domain";
export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Não foi possível concluir.");
  return data as T;
}
export async function mapTrees(
  query: URLSearchParams,
  signal: AbortSignal,
  totalRows?: Promise<number>,
): Promise<Tree[]> {
  const plannedTotal = totalRows?.catch(() => Number.NaN);
  const rows = new Map<string, Tree>();
  for (let offset = 0; offset < 5000; offset += 500) {
    const pageQuery = new URLSearchParams(query);
    pageQuery.set("limit", "500");
    pageQuery.set("offset", String(offset));
    const page = await api<Tree[]>(`/api/trees?${pageQuery}`, { signal });
    for (const tree of page) rows.set(tree.id, tree);
    if (page.length < 500) break;
    if (offset === 0 && plannedTotal) {
      const total = await plannedTotal;
      if (
        total !== undefined &&
        Number.isInteger(total) &&
        total >= page.length
      ) {
        const offsets = Array.from(
          { length: Math.max(0, Math.ceil(Math.min(total, 5000) / 500) - 1) },
          (_, index) => (index + 1) * 500,
        );
        const pages = await Promise.all(
          offsets.map((offset) => {
            const nextQuery = new URLSearchParams(query);
            nextQuery.set("limit", "500");
            nextQuery.set("offset", String(offset));
            return api<Tree[]>(`/api/trees?${nextQuery}`, { signal });
          }),
        );
        for (const nextPage of pages)
          for (const tree of nextPage) rows.set(tree.id, tree);
        // If the public count was stale or exact-multiple, probe the next page.
        const lastPage = pages.at(-1) || page;
        if (lastPage.length < 500 || (offsets.at(-1) || 0) >= 4500) break;
        offset = offsets.at(-1) || 0;
      }
    }
  }
  return [...rows.values()];
}

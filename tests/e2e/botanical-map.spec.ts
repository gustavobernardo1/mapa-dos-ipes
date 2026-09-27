import { test, expect } from "@playwright/test";
import sharp from "sharp";
import type { Tree } from "../../src/lib/domain";

test("botanical clusters keep counts, filters, expansion and point selection with 1914 trees", async ({
  page,
}, testInfo) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  // Browser-only fixtures: never create or edit application/database records.
  const colors = ["AMARELO", "ROSA_ROXO", "BRANCO"] as const;
  const trees: Tree[] = Array.from({ length: 1914 }, (_, i) => ({
    id: `20000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    codigo_publico: `VISUAL-TEST-${i}`,
    nome_popular: "Ipê de teste visual",
    especie_id: null,
    latitude: -16.686 + (i < 1800 ? 0 : ((i % 10) - 5) * 0.008),
    longitude:
      -49.264 + (i < 1800 ? 0 : (Math.floor((i - 1800) / 10) - 5) * 0.008),
    cor_principal: colors[i % 3],
    descricao_municipal: i % 2 ? "Ipê-roxo" : "Ipê-rosa",
    bairro: "Fixture visual",
    status: "PENDENTE",
    confianca: "D",
    criado_em: "2026-09-26T00:00:00Z",
    atualizado_em: "2026-09-26T00:00:00Z",
    observacoes: [],
    origem_municipal: true,
    status_validacao: "CADASTRO_PUBLICO",
    status_verificacao_comunitaria: "NAO_VERIFICADA",
  }));
  await page.route("**/api/trees?**", async (route) => {
    const query = new URL(route.request().url()).searchParams;
    const filtered = trees.filter(
      (tree) =>
        !query.get("color") || tree.cor_principal === query.get("color"),
    );
    const offset = Number(query.get("offset") || 0);
    await route.fulfill({
      json: filtered.slice(offset, offset + Number(query.get("limit") || 500)),
    });
  });
  await page.route("**/api/stats", (route) =>
    route.fulfill({
      json: {
        arvores: 1914,
        observacoes: 0,
        fotos: 0,
        floridas: 0,
        amarelas: 638,
        rosas_roxas: 638,
        brancas: 638,
      },
    }),
  );
  const tile = await sharp({
    create: { width: 256, height: 256, channels: 3, background: "#e8eddf" },
  })
    .png()
    .toBuffer();
  await page.route("https://tile.openstreetmap.org/**", (route) =>
    route.fulfill({ body: tile, contentType: "image/png" }),
  );
  await page.goto("/");
  await page.waitForFunction(
    () => performance.getEntriesByName("ipes:markers:visible").length > 0,
  );
  await expect(page.locator(".botanical-cluster")).toHaveCount(0);
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  const cluster = page
    .locator('.botanical-cluster[data-size="grande"]')
    .first();
  await expect(cluster).toBeVisible();
  await expect(cluster).toHaveAttribute("data-palette", "multicolorido");
  await expect(cluster.locator("svg path").first()).toBeAttached();
  const count = Number(
    (await cluster.locator(".botanical-cluster-count").innerText()).replaceAll(
      ".",
      "",
    ),
  );
  expect(count).toBeGreaterThanOrEqual(1800);
  expect(
    await cluster.evaluate(
      (button) => getComputedStyle(button).backgroundColor,
    ),
  ).toBe("rgba(0, 0, 0, 0)");
  await page.screenshot({
    path: `docs/validacao/mapa-botanico-${testInfo.project.name}.png`,
    fullPage: true,
  });
  for (const [label, palette] of [
    ["Amarelos", "amarelo"],
    ["Rosas / Roxos", "rosa_roxo"],
    ["Brancos", "branco"],
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(cluster).toHaveAttribute("data-palette", palette);
    await expect(cluster.locator(".botanical-cluster-count")).toHaveText(
      /^6\d\d$/,
    );
  }
  await page.getByRole("button", { name: "Todos", exact: true }).click();
  await expect(cluster).toHaveAttribute("data-palette", "multicolorido");
  await expect(cluster.locator(".botanical-cluster-count")).toHaveText(
    /^1\.8\d\d$/,
  );
  await cluster.focus();
  await page.keyboard.press("Enter");
  // Expanding from the distant zoom already reaches individual trees.
  // A removed cluster has no text to await: assert its removal directly.
  await expect(page.locator(".botanical-cluster")).toHaveCount(0);
  // At expansion zoom the coincident fixture trees are represented by GPU icons.
  const box = await page.locator(".map-canvas").boundingBox();
  await page
    .locator(".map-canvas")
    .click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await expect(
    page.getByRole("dialog", { name: "Árvore selecionada" }),
  ).toBeVisible();
  await expect(page.locator(".tree-sheet > a.btn-primary")).toBeVisible();
  await page.getByRole("button", { name: "Fechar ficha" }).click();
  await page.screenshot({
    path: `docs/validacao/mapa-botanico-detalhe-${testInfo.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(failures).toEqual([]);
});

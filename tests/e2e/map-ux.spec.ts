import { test, expect } from "@playwright/test";
import sharp from "sharp";
import type { Tree } from "../../src/lib/domain";

test("full-screen workspace keeps one dataset through pan, zoom and filters; install dismissal persists", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile";
  // Keep consecutive camera controls deterministic; MapLibre respects this preference.
  await page.emulateMedia({ reducedMotion: "reduce" });
  if (mobile) await page.setViewportSize({ width: 390, height: 844 });
  const rows: Tree[] = Array.from({ length: 1914 }, (_, i) => ({
    id: `30000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    codigo_publico: `UX-${i}`,
    nome_popular: "Ipê de teste UX",
    especie_id: null,
    latitude: -16.686 + ((i % 30) - 15) * 0.0003,
    longitude: -49.264 + (Math.floor(i / 30) - 32) * 0.0003,
    cor_principal: (["AMARELO", "ROSA_ROXO", "BRANCO"] as const)[i % 3],
    descricao_municipal: i % 2 ? "Ipê-roxo" : "Ipê-rosa",
    bairro: "Fixture UX",
    status: "PENDENTE",
    confianca: "D",
    criado_em: "2026-09-26T00:00:00Z",
    atualizado_em: "2026-09-26T00:00:00Z",
    observacoes: [],
    origem_municipal: true,
    status_validacao: "CADASTRO_PUBLICO",
    status_verificacao_comunitaria:
      i % 4 === 0 ? "VERIFICADA_FOTOGRAFICAMENTE" : "NAO_VERIFICADA",
  }));
  let requests = 0;
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await page.route("**/api/trees?**", async (route) => {
    requests++;
    const query = new URL(route.request().url()).searchParams;
    expect(query.has("west")).toBe(false);
    expect(query.has("color")).toBe(false);
    const offset = Number(query.get("offset"));
    await route.fulfill({ json: rows.slice(offset, offset + 500) });
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
    create: { width: 256, height: 256, channels: 3, background: "#f1f2ed" },
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
  expect(requests).toBe(4);
  const box = await page.locator(".map-workspace").boundingBox();
  const viewport = page.viewportSize()!;
  const header = await page.locator(".header").boundingBox();
  expect(Math.round(box!.width)).toBe(viewport.width);
  expect(Math.round(box!.x)).toBe(0);
  if (!mobile) {
    expect(Math.round(box!.height)).toBe(
      viewport.height - Math.round(header!.height),
    );
    expect(
      await page
        .locator(".map-workspace")
        .evaluate((element) => getComputedStyle(element).borderRadius),
    ).toBe("0px");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollHeight <= innerHeight,
      ),
    ).toBe(true);
    const toolbar = await page.locator(".map-toolbar").boundingBox();
    const panel = await page.locator(".map-bottom").boundingBox();
    expect(
      Math.abs(toolbar!.x + toolbar!.width / 2 - viewport.width / 2),
    ).toBeLessThan(2);
    expect(
      Math.abs(panel!.x + panel!.width / 2 - viewport.width / 2),
    ).toBeLessThan(2);
    expect(panel!.y).toBeGreaterThan(viewport.height * 0.65);
  }
  const updates = await page.evaluate(
    () => performance.getEntriesByName("ipes:source:set-data").length,
  );
  await page.mouse.move(box!.width * 0.55, box!.y + box!.height * 0.45);
  await page.mouse.down();
  await page.mouse.move(box!.width * 0.45, box!.y + box!.height * 0.5, {
    steps: 12,
  });
  await page.mouse.up();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  // At neighborhood scale even the deliberately dense fixture becomes individual trees.
  await expect(page.locator(".botanical-cluster")).toHaveCount(0);
  await expect(page.locator(".map-legend")).not.toBeVisible();
  await page.locator(".map-legend-control summary").click();
  await expect(page.locator(".map-legend")).toBeVisible();
  await expect(page.locator(".map-legend small")).toContainText(
    "não a florada atual",
  );
  await page.locator(".map-legend-control summary").click();
  if (mobile)
    await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  else
    await page
      .getByRole("button", { name: "Mostrar Goiânia", exact: true })
      .click();
  await expect(page.locator(".map-status")).not.toContainText("Buscando");
  expect(
    await page.evaluate(
      () => performance.getEntriesByName("ipes:source:set-data").length,
    ),
  ).toBe(updates);
  await page.getByRole("button", { name: "Zoom out", exact: true }).click();
  await expect(page.locator(".botanical-cluster").first()).toBeVisible();
  for (const [name, palette] of [
    ["Amarelos", "amarelo"],
    ["Rosas / Roxos", "rosa_roxo"],
    ["Brancos", "branco"],
    ["Todos", "multicolorido"],
  ]) {
    await page.getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".botanical-cluster").first()).toHaveAttribute(
      "data-palette",
      palette,
    );
  }
  await page
    .getByRole("button", { name: "Floridos agora", exact: true })
    .click();
  await expect(page.locator(".botanical-cluster")).toHaveCount(0);
  await page.getByRole("button", { name: "Todos", exact: true }).click();
  await expect(page.locator(".botanical-cluster").first()).toBeVisible();
  expect(requests).toBe(4);
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  await expect(page.locator(".botanical-cluster")).toHaveCount(0);
  await page.screenshot({
    path: `docs/validacao/ux-mapa-${mobile ? "390" : viewport.width}.png`,
  });
  // Simulate the browser event; no actual app installation or external writes.
  const offer = async () =>
    page.evaluate(() => {
      const event = new Event("beforeinstallprompt", { cancelable: true });
      Object.assign(event, {
        prompt: async () => {},
        userChoice: Promise.resolve({ outcome: "dismissed" }),
      });
      window.dispatchEvent(event);
    });
  await offer();
  await page.getByLabel("Menu", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Instalar", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".install-btn")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Não sugerir instalação novamente" })
    .click();
  await page.reload();
  await offer();
  await page.getByLabel("Menu", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Instalar", exact: true }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(() => localStorage.getItem("ipes:install-choice")),
  ).toBe("dismissed");
  expect(failures).toEqual([]);
});

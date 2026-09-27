import { test, expect, type Page } from "@playwright/test";
import sharp from "sharp";
const password = "test-only-password-2026";
const errors: string[] = [];
test.beforeEach(async ({ page }) => {
  errors.length = 0;
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  // Deterministic no-network basemap; live tiles are checked separately in the visual review.
  await page.route("https://tile.openstreetmap.org/**", async (route) => {
    const data = await sharp({
      create: { width: 256, height: 256, channels: 3, background: "#e8eddf" },
    })
      .png()
      .toBuffer();
    await route.fulfill({ body: data, contentType: "image/png" });
  });
});
test.afterEach(() => expect(errors).toEqual([]));
async function image(historical = false) {
  return sharp({
    create: {
      width: 900,
      height: 600,
      channels: 3,
      background: historical
        ? "#ab62a2"
        : `#${Math.floor(Math.random() * 0xffffff)
            .toString(16)
            .padStart(6, "0")}`,
    },
  })
    .withExif({
      IFD0: { Artist: "PRIVATE TEST", ImageDescription: String(Math.random()) },
      IFD2: {
        DateTimeOriginal: historical
          ? "2023:09:01 12:00:00"
          : "2026:09:20 12:00:00",
      },
    })
    .jpeg()
    .toBuffer();
}
async function upload(page: Page, historical = false, attach?: string) {
  await page.goto(
    `/registrar${attach ? `?arvore=${attach}` : historical ? "?origem=historica" : ""}`,
  );
  await page
    .getByLabel(historical ? "Enviar foto antiga" : "Fotografar agora", {
      exact: true,
    })
    .setInputFiles({
      name: historical ? "historica.jpg" : "atual.jpg",
      mimeType: "image/jpeg",
      buffer: await image(historical),
    });
  await expect(
    page.getByText("Encontramos data original no EXIF."),
  ).toBeVisible();
  if (!historical)
    await page
      .getByLabel("Quando a fotografia foi feita?")
      .fill(new Date().toISOString().slice(0, 10));
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Latitude", { exact: true }).fill("-16.686");
  await page.getByLabel("Longitude", { exact: true }).fill("-49.264");
  await page.getByLabel("Bairro ou região (opcional)").fill("Setor Central");
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByLabel("Cor das flores").selectOption("AMARELO");
  await page.getByLabel("Estado da floração").selectOption("INTENSA");
  if (
    !attach &&
    (await page.getByText("É outra árvore — criar novo cadastro").isVisible())
  )
    await page.getByText("É outra árvore — criar novo cadastro").click();
  await page
    .getByLabel("Seu nome público (opcional)")
    .fill("Colaborador de teste");
  await page.getByRole("checkbox").check();
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/submit") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Enviar para moderação" }).click();
  const r = await response;
  expect(r.status()).toBe(201);
  const data = await r.json();
  await expect(
    page.getByRole("heading", {
      name: "Obrigada por registrar esse instante.",
    }),
  ).toBeVisible();
  return data.id as string;
}
async function signIn(page: Page) {
  await page.goto("/admin");
  await expect(page.getByText("Verificando acesso…")).toHaveCount(0);
  if (
    await page.getByRole("button", { name: "Entrar", exact: true }).isVisible()
  ) {
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
  }
  await expect(
    page.getByRole("button", { name: "Sair", exact: true }),
  ).toBeVisible();
}
test("register → private pending → moderation → map, gallery, history; historical EXIF joins same tree", async ({
  page,
  request,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Ipês em Goiânia" }),
  ).toBeVisible();
  const before = await (await request.get("/api/stats")).json();
  const id = await upload(page);
  expect((await (await request.get("/api/stats")).json()).arvores).toBe(
    before.arvores,
  );
  const unauthorized = await request.get("/api/admin");
  expect(unauthorized.status()).toBe(401);
  await signIn(page);
  const pending = await (await page.request.get("/api/admin")).json();
  const o = pending.find((v: { id: string }) => v.id === id);
  expect(o.status_moderacao).toBe("PENDENTE");
  expect(o.metadata[0].data_exif).toContain("2026-09-20");
  const anonymousMedia = await request.get(`/api/media/${o.fotos[0].key}`);
  expect(anonymousMedia.status()).toBe(404);
  const card = page
    .locator(".review-card")
    .filter({ has: page.getByText(o.arvore.codigo_publico, { exact: false }) });
  await card.getByLabel("Confiança dos dados").selectOption("C");
  await card.getByRole("button", { name: "Aprovar", exact: true }).click();
  await expect(card).toHaveCount(0);
  const publicTree = await (
    await request.get(`/api/trees/${o.arvore_id}`)
  ).json();
  expect(publicTree.observacoes).toHaveLength(1);
  expect(publicTree.observacoes[0].metadata).toBeUndefined();
  await page.goto(`/arvore/${o.arvore_id}`);
  await expect(
    page.getByRole("heading", { name: "Histórico da floração" }),
  ).toBeVisible();
  const historicalId = await upload(page, true, o.arvore_id);
  await signIn(page);
  const historical = await (await page.request.get("/api/admin")).json();
  const old = historical.find((v: { id: string }) => v.id === historicalId);
  expect(old.data_observacao).toBe("2023-09-01");
  const oldCard = page.locator(".review-card").filter({
    has: page.getByText(old.arvore.codigo_publico, { exact: false }),
  });
  await oldCard.getByLabel("Confiança dos dados").selectOption("B");
  await oldCard.getByRole("button", { name: "Aprovar", exact: true }).click();
  await expect(oldCard).toHaveCount(0);
  const after = await (await request.get("/api/stats")).json();
  expect(after.arvores).toBe(before.arvores + 1);
  expect(after.observacoes).toBe(before.observacoes + 2);
  await page.goto(`/arvore/${o.arvore_id}`);
  await expect(page.locator(".timeline article")).toHaveCount(2);
  await expect(
    page.getByText("1 de set. de 2023 · Foto histórica"),
  ).toBeVisible();
  await page.goto("/galeria");
  await page.getByRole("button", { name: "Históricos", exact: true }).click();
  await expect(page.locator(".gallery-card").first()).toBeVisible();
  await page.goto("/");
  await page.getByRole("button", { name: "Ver em lista" }).click();
  await expect(page.locator(".map-list .tree-card").first()).toBeVisible();
  await page.getByRole("button", { name: "Ver mapa", exact: true }).click();
  if (before.arvores > 0) {
    await page.getByRole("button", { name: "Zoom out", exact: true }).click();
    await expect(page.locator(".cluster-label").first()).toBeVisible();
    await page.locator(".cluster-label").first().click();
    await expect(page.locator(".cluster-label")).toHaveCount(0);
  }
  const box = await page.locator(".map-canvas").boundingBox();
  await page
    .locator(".map-canvas")
    .click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await expect(
    page.getByRole("dialog", { name: "Árvore selecionada" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar ficha" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("mapa.png"),
    fullPage: true,
  });
});
test("security rejects foreign origin and unprivileged moderation, validates missing consent", async ({
  request,
  page,
}) => {
  const response = await request.post("/api/login", {
    headers: { Origin: "https://foreign.invalid" },
    data: { email: "", password },
  });
  expect(response.status()).toBe(403);
  const moderate = await request.post(
    "/api/admin/00000000-0000-4000-8000-000000000000",
    {
      headers: { Origin: "http://127.0.0.1:3100" },
      data: { status: "APROVADO" },
    },
  );
  expect(moderate.status()).toBe(401);
  await page.goto("/registrar");
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator('p[role="alert"]')).toHaveText(
    "Adicione uma fotografia para continuar.",
  );
});
test("rejected photographs remain private and do not change public statistics", async ({
  page,
  request,
}) => {
  const before = await (await request.get("/api/stats")).json();
  const id = await upload(page);
  await signIn(page);
  const records = await (await page.request.get("/api/admin")).json();
  const o = records.find((v: { id: string }) => v.id === id);
  const card = page
    .locator(".review-card")
    .filter({ has: page.getByText(o.arvore.codigo_publico, { exact: false }) });
  await card.getByRole("button", { name: "Rejeitar", exact: true }).click();
  await expect(card).toHaveCount(0);
  expect(await (await request.get("/api/stats")).json()).toEqual(before);
  expect((await request.get(`/api/media/${o.fotos[0].key}`)).status()).toBe(
    404,
  );
  expect(
    await (await request.get(`/api/trees/${o.arvore_id}`)).json(),
  ).toBeNull();
});
test("GPS denial, manual map point, validation, guide, privacy and install assets", async ({
  page,
  request,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "geolocation", {
      value: {
        getCurrentPosition: (
          _success: unknown,
          error: (e: { code: number }) => void,
        ) => error({ code: 1 }),
      },
      configurable: true,
    });
  });
  await page.goto("/registrar");
  await page.getByLabel("Fotografar agora", { exact: true }).setInputFiles({
    name: "gps.jpg",
    mimeType: "image/jpeg",
    buffer: await image(),
  });
  await expect(page.getByRole("button", { name: "Continuar" })).toBeEnabled();
  await page.getByRole("button", { name: "Continuar" }).click();
  await page.getByRole("button", { name: "Usar GPS do celular" }).click();
  await expect(
    page.getByText("Acesso ao GPS negado ou indisponível."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.locator('p[role="alert"]')).toContainText(
    "Escolha um ponto",
  );
  await page.locator(".map-canvas").click({ position: { x: 150, y: 180 } });
  await expect(page.getByLabel("Latitude", { exact: true })).not.toHaveValue(
    "",
  );
  await page.goto("/guia");
  await expect(
    page.getByText("Guia em revisão botânica.", { exact: false }),
  ).toBeVisible();
  await page.goto("/privacidade");
  await expect(
    page.getByRole("heading", { name: "Privacidade", exact: true }),
  ).toBeVisible();
  for (const url of [
    "/manifest.webmanifest",
    "/icon-192.png",
    "/icon-512.png",
    "/og.png",
    "/offline.html",
  ])
    expect((await request.get(url)).ok()).toBe(true);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

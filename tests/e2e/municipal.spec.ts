import { test, expect } from "@playwright/test";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import type { Tree } from "../../src/lib/domain";
test("municipal candidate → real upload fixture → approval preserves origin and cadastral color", async ({
  page,
  request,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile",
    objectid = mobile ? 990001 : 990002;
  const id = mobile
      ? "10000000-0000-4000-8000-000000000003"
      : "10000000-0000-4000-8000-000000000004",
    code = `GYN-MUN-TESTE-${testInfo.project.name}`;
  const failures: string[] = [];
  page.on("pageerror", (e) => failures.push(e.message));
  const root = path.resolve(process.cwd(), ".test-data/e2e");
  expect(root).toBe(path.join(process.cwd(), ".test-data", "e2e"));
  await mkdir(root, { recursive: true });
  const file = path.join(root, "database.json");
  let db;
  try {
    db = JSON.parse(await readFile(file, "utf8"));
  } catch {
    db = { trees: [], observations: [], photos: [], metadata: [] };
  }
  const tree: Tree = {
    id,
    codigo_publico: code,
    nome_popular: "Ipê-roxo municipal de teste",
    especie_id: null,
    latitude: -16.712,
    longitude: -49.259,
    cor_principal: "ROSA_ROXO",
    bairro: "",
    status: "PENDENTE",
    confianca: "D",
    criado_em: new Date().toISOString(),
    atualizado_em: new Date().toISOString(),
    observacoes: [],
    origem_municipal: true,
    status_validacao: "CADASTRO_PUBLICO",
    status_verificacao_comunitaria: "NAO_VERIFICADA",
    cor_cadastral: "ROSA_ROXO",
    descricao_municipal: "Ipê-roxo",
    proveniencia_municipal: {
      fonte: "PREFEITURA_GOIANIA",
      dataset: "MAPA_MEIO_AMBIENTE",
      layer: "ARVORE",
      layer_id: 3,
      OBJECTID: objectid,
      codigo_especie: 16,
      descricao: "Ipê-roxo",
      nome_cientifico: "Tabebuia impetiginosa",
      data_consulta: "2026-09-26T00:00:00Z",
    },
  };
  db.trees.push(tree);
  await writeFile(file, JSON.stringify(db));
  await page.route("https://tile.openstreetmap.org/**", async (route) =>
    route.fulfill({
      contentType: "image/png",
      body: await sharp({
        create: { width: 256, height: 256, channels: 3, background: "#e8eddf" },
      })
        .png()
        .toBuffer(),
    }),
  );
  const candidate = await (await request.get(`/api/trees/${id}`)).json();
  expect(candidate.status).toBe("PENDENTE");
  expect(candidate.observacoes).toEqual([]);
  expect(
    await (await request.get(`/api/trees?search=${code}&blooming=true`)).json(),
  ).toEqual([]);
  await page.goto(`/arvore/${id}`);
  await expect(
    page.getByText("Cadastro municipal — existência atual não verificada", {
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({
    path: `docs/validacao/cadastro-municipal-${testInfo.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Confirmar esta árvore", exact: true })
    .click();
  await page.getByLabel("Fotografar agora", { exact: true }).setInputFiles({
    name: "municipal-test.jpg",
    mimeType: "image/jpeg",
    buffer: await sharp({
      create: {
        width: 900,
        height: 600,
        channels: 3,
        background: mobile ? "#b095cf" : "#84b477",
      },
    })
      .jpeg()
      .toBuffer(),
  });
  await expect(
    page.getByText("Sem data ou GPS no EXIF.", { exact: false }),
  ).toBeVisible();
  await page.getByLabel("Quando a fotografia foi feita?").fill("2023-09-01");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page
    .getByLabel("Latitude", { exact: true })
    .fill(String(tree.latitude + 0.00012));
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Enviar para moderação" }).click();
  await expect(page.locator('.error-box[role="alert"]')).toContainText(
    "até 10 m",
  );
  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page
    .getByLabel("Latitude", { exact: true })
    .fill(String(tree.latitude + 0.00005));
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Cor das flores").selectOption("AMARELO");
  await page.getByLabel("Estado da floração").selectOption("INTENSA");
  const response = page.waitForResponse(
    (r) => r.url().endsWith("/api/submit") && r.request().method() === "POST",
  );
  await page.getByRole("button", { name: "Enviar para moderação" }).click();
  expect((await response).status()).toBe(201);
  expect(
    (await (await request.get(`/api/trees/${id}`)).json()).observacoes,
  ).toEqual([]);
  await page.goto("/admin");
  await expect(page.getByText("Verificando acesso…")).toHaveCount(0);
  if (
    await page.getByRole("button", { name: "Entrar", exact: true }).isVisible()
  ) {
    await page
      .getByLabel("Senha", { exact: true })
      .fill("test-only-password-2026");
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
  }
  const review = page.locator(".review-card").filter({ hasText: code });
  await expect(review).toBeVisible();
  await expect(review.getByLabel("Associar à árvore")).toContainText(
    `Manter em ${code}`,
  );
  await review.getByLabel("Confiança dos dados").selectOption("B");
  await review.getByRole("button", { name: "Aprovar", exact: true }).click();
  await expect(review).toHaveCount(0);
  const confirmed = await (await request.get(`/api/trees/${id}`)).json();
  expect(confirmed.status_validacao).toBe("CADASTRO_PUBLICO");
  expect(confirmed.status_verificacao_comunitaria).toBe(
    "VERIFICADA_FOTOGRAFICAMENTE",
  );
  expect(confirmed.proveniencia_municipal).toEqual(tree.proveniencia_municipal);
  expect(confirmed.cor_cadastral).toBe("ROSA_ROXO");
  expect(confirmed.cor_principal).toBe("AMARELO");
  expect(confirmed.observacoes).toHaveLength(1);
  expect(
    await (await request.get(`/api/trees?search=${code}&blooming=true`)).json(),
  ).toEqual([]);
  await page.goto(`/arvore/${id}`);
  await expect(
    page.getByText(
      "Cadastro municipal — possui verificação fotográfica comunitária",
      { exact: true },
    ),
  ).toBeVisible();
  expect(failures).toEqual([]);
});

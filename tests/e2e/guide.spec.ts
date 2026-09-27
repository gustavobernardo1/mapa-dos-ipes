import { expect, test, type Page } from "@playwright/test";

async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
test.beforeEach(async ({ page }, info) => {
  if (info.project.name === "mobile")
    await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/guia");
});

test("entrada leve, sete cards com rotas e atribuições preservadas", async ({
  page,
}, info) => {
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Como reconhecer um ipê?",
  );
  await expect(page.locator(".fg-card")).toHaveCount(7);
  await expect(
    page.locator("main details, main table, main select"),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Explorar espécies" }),
  ).toHaveAttribute("href", "#especies");
  await expect(
    page.getByRole("link", { name: "Como fotografar", exact: true }),
  ).toHaveAttribute("href", "/guia/como-fotografar");
  await expect(page.locator("#ficha-amarelo .fg-photo-fallback")).toContainText(
    "Foto de referência pendente",
  );
  const cover = page.locator("#ficha-branco > figure");
  await expect(
    cover.getByRole("link", { name: "João de Deus Medeiros", exact: true }),
  ).toHaveAttribute("href", /^https:\/\/commons.wikimedia.org\/wiki\//);
  await expect(
    cover.getByRole("link", { name: "CC BY 2.0", exact: true }),
  ).toHaveAttribute("href", "https://creativecommons.org/licenses/by/2.0");
  for (const image of await page.locator(".fg-card > figure img").all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (el: HTMLImageElement) => el.complete && el.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  await noOverflow(page);
  await page.evaluate(() => scrollTo(0, 0));
  const width =
    info.project.name === "mobile"
      ? "390"
      : info.project.name === "desktop-wide"
        ? "1920"
        : "1440";
  await page.screenshot({
    path: `docs/validacao/guia-refatorado-${width}.png`,
    fullPage: true,
    scale: "css",
  });
  await page
    .getByRole("link", { name: "Conhecer ipê-amarelo", exact: true })
    .focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/guia\/ipe-amarelo$/);
});

test("sete fichas, galeria ordenada e aprofundamento por teclado", async ({
  page,
}, info) => {
  for (const slug of [
    "ipe-amarelo",
    "ipe-rosa",
    "ipe-roxo",
    "ipe-branco",
    "sibipiruna",
    "chuva-de-ouro",
    "ipe-de-jardim",
  ]) {
    await page.goto(`/guia/${slug}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.locator(".fg-gallery > figure")).toHaveCount(5);
    await expect(page.locator(".fg-gallery figcaption > strong")).toHaveText([
      "Árvore / copa",
      "Flor",
      "Folha",
      "Casca",
      "Fruto",
    ]);
    await expect(page.locator(".fg-quick-grid > article")).toHaveCount(3);
    await expect(page.locator("details[open]")).toHaveCount(0);
    await noOverflow(page);
  }
  await page.goto("/guia/ipe-amarelo");
  await expect(page.locator(".fg-gallery figure").nth(3)).toContainText(
    "Foto de referência pendente",
  );
  if (info.project.name === "mobile") {
    expect(
      await page
        .locator(".fg-gallery")
        .evaluate((el) => el.scrollWidth > el.clientWidth),
    ).toBe(true);
  }
  await page.getByText("Identificação detalhada", { exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByText("Sinônimos relevantes:", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".fg-profile-details dl > div")).toHaveCount(11);
  await page.getByText("Fontes", { exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.locator(".fg-source-list a").first()).toHaveAttribute(
    "href",
    /^https:\/\//,
  );
  await noOverflow(page);
  const response = await page.request.get("/guia/especie-inexistente");
  expect(response.status()).toBe(404);
});

test("comparação visual antes da tabela, seleções e aviso rosa/roxo", async ({
  page,
}, info) => {
  await page
    .getByRole("link", { name: "Comparar espécies", exact: true })
    .click();
  await expect(page).toHaveURL(/\/guia\/comparar$/);
  await expect(page.locator(".fg-visual-row")).toHaveCount(4);
  await expect(page.locator(".fg-quick-comparison article")).toHaveCount(3);
  await expect(page.locator("table")).not.toBeVisible();
  const disclosure = page.getByText("Ver comparação botânica completa", {
    exact: true,
  });
  for (const label of [
    "Ipê-amarelo × Sibipiruna",
    "Ipê-amarelo × Chuva-de-ouro",
    "Ipê-amarelo × Ipê-de-jardim",
    "Ipê-rosa × Ipê-roxo",
  ]) {
    await page.getByRole("button", { name: label, exact: true }).click();
    await expect(page.locator("table")).not.toBeVisible();
    await disclosure.click();
    await expect(page.locator("caption")).toHaveText(label);
    await expect(page.locator("table")).toBeVisible();
    if (info.project.name === "mobile") {
      expect(
        await page
          .locator("caption")
          .evaluate(
            (el) => el.clientWidth >= (el.parentElement?.clientWidth ?? 0) - 2,
          ),
      ).toBe(true);
    }
    await noOverflow(page);
  }
  await expect(page.locator(".fg-comparison-message")).toContainText(
    "nomes sobrepostos",
  );
  await page
    .getByLabel("Primeira espécie", { exact: true })
    .selectOption("branco");
  await page
    .getByLabel("Segunda espécie", { exact: true })
    .selectOption("ipe-de-jardim");
  await expect(page.locator("table")).not.toBeVisible();
  await expect(page.locator(".fg-visual-comparison > h2")).toHaveText(
    "Ipê-branco × Ipê-de-jardim",
  );
  await page
    .getByLabel("Segunda espécie", { exact: true })
    .selectOption("branco");
  await expect(page.locator(".fg-comparison-message")).toContainText(
    "mesmo grupo",
  );
  await expect(page.locator("table")).toHaveCount(0);
  await page
    .getByRole("button", { name: "Ipê-branco × T. elliptica", exact: true })
    .click();
  await expect(
    page.locator(".fg-visual-row .fg-photo-fallback").first(),
  ).toContainText("Foto de referência pendente");
  await disclosure.click();
  await expect(page.locator("caption")).toHaveText(
    "Ipê-branco × Tabebuia elliptica",
  );
  await noOverflow(page);
  await page.evaluate(() => scrollTo(0, 0));
  await page.screenshot({
    path: `docs/validacao/guia-comparar-${info.project.name}.png`,
    fullPage: true,
    scale: "css",
  });
});

test("fotografia, fontes públicas e falha de foto sem perder créditos", async ({
  page,
}) => {
  await page.route("**/_next/image?*", (route) => route.abort());
  await page.reload();
  await expect(page.locator(".fg-hero-photo .fg-photo-fallback")).toContainText(
    "Fotografia indisponível",
  );
  await expect(page.locator(".fg-hero-photo figcaption")).toContainText(
    "João Medeiros",
  );
  await page
    .getByRole("link", { name: "Como fotografar", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Como fotografar",
  );
  await expect(page.locator(".fg-photography li")).toHaveCount(5);
  await expect(page.locator(".fg-photography")).toContainText(
    "Não precisa fotografar tudo para cadastrar",
  );
  await expect(
    page.getByRole("link", { name: "Registrar uma árvore", exact: true }),
  ).toHaveAttribute("href", "/registrar");
  await page.goto("/guia/fontes");
  await expect(page.locator(".fg-image-credits")).not.toBeVisible();
  await page
    .getByText("Ver créditos das 16 fotografias", { exact: true })
    .click();
  await expect(page.locator(".fg-image-credits li")).toHaveCount(16);
  await expect(page.locator(".fg-image-credits")).toContainText("CC BY-SA");
  await noOverflow(page);
});

import assert from "node:assert/strict";
import { chromium } from "@playwright/test";
const base = process.env.REVIEW_URL || "http://127.0.0.1:3200";
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}/guia`);
  assert((await page.title()).includes("Como reconhecer"));
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  const manifest = await (
    await context.request.get(`${base}/manifest.webmanifest`)
  ).json();
  assert.equal(manifest.name, "Mapa dos Ipês — Goiânia");
  assert.equal(manifest.icons.length, 2);
  const sw = await context.request.get(`${base}/sw.js`);
  assert(sw.headers()["cache-control"].includes("no-store"));
  await context.setOffline(true);
  await page.goto(`${base}/ciencia`);
  assert.equal(await page.locator("h1").textContent(), "Um pequeno intervalo.");
  await context.setOffline(false);
  assert.deepEqual(errors, []);
  console.log(
    "Build servido: SEO, manifest, service worker e navegação offline verificados. Sem erros de execução.",
  );
  await context.close();
} finally {
  await browser.close();
}

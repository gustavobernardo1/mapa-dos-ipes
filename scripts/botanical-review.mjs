import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

// Read-only visual review of an already running app, with its real basemap/data.
const base = process.env.REVIEW_URL || "http://127.0.0.1:3000";
await mkdir("docs/validacao", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [name, viewport] of [
    ["mobile", { width: 390, height: 844 }],
    ["desktop", { width: 1440, height: 1000 }],
  ]) {
    const page = await browser.newPage({ viewport });
    let pageErrors = 0;
    page.on("pageerror", () => pageErrors++);
    await page.goto(base);
    await page.waitForFunction(
      () => performance.getEntriesByName("ipes:markers:visible").length > 0,
      {},
      { timeout: 60000 },
    );
    await page.waitForFunction(
      () =>
        /\d+ árvores nesta área/.test(
          document.querySelector(".map-status")?.textContent || "",
        ),
      { timeout: 60000 },
    );
    await page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});
    await page.screenshot({
      path: `docs/validacao/mapa-botanico-real-${name}.png`,
      fullPage: true,
    });
    console.log(
      JSON.stringify({
        viewport: name,
        pageErrors,
        visibleClusters: await page.locator(".botanical-cluster").count(),
        status: await page.locator(".map-status").textContent(),
        overflow: await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        notice: await page.locator(".map-notice").count(),
      }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}

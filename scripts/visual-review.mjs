import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const base = process.env.REVIEW_URL || "http://127.0.0.1:3000";
await mkdir("docs/validacao", { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  for (const [name, viewport] of [
    ["mobile", { width: 390, height: 844 }],
    ["desktop", { width: 1440, height: 1000 }],
  ]) {
    const page = await browser.newPage({ viewport });
    const errors = [];
    page.on("pageerror", () => errors.push("page error; details suppressed"));
    page.on("console", (msg) => {
      if (msg.type() === "error")
        errors.push("console error; details suppressed");
    });
    await page.goto(base);
    await page.locator(".map-canvas canvas").waitFor();
    await page.waitForFunction(() =>
      document.querySelector(".map-status")?.textContent?.includes("primeiro"),
    );
    await page
      .waitForLoadState("networkidle", { timeout: 20000 })
      .catch(() => {});
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    );
    await page.screenshot({
      path: `docs/validacao/home-${name}.png`,
      fullPage: true,
    });
    console.log(
      JSON.stringify({ viewport: name, overflow, consoleErrors: errors }),
    );
    await page.close();
  }
} finally {
  await browser.close();
}

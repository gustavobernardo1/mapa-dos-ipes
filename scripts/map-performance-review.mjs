import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";

const production = process.argv.includes("--production");
const refinement = process.argv.includes("--refinement");
const hierarchy = process.argv.includes("--hierarchy");
const capturePrefix = hierarchy
  ? "hierarquia-mapa"
  : refinement
    ? "refinamento-mapa"
    : "ux-mapa";
const base = production
  ? "http://127.0.0.1:3200"
  : process.env.REVIEW_URL || "http://127.0.0.1:3000";
let server;
let browser;
const results = [];
await mkdir("docs/validacao", { recursive: true });
try {
  if (production) {
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3200",
      ],
      { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
    );
    // Provider details and environment values must never reach the report.
    server.stdout.resume();
    server.stderr.resume();
    let ready = false;
    for (let attempt = 0; attempt < 200; attempt++) {
      if (server.exitCode !== null)
        throw new Error("Servidor de revisão não iniciou.");
      try {
        ready = (await fetch(base, { signal: AbortSignal.timeout(500) })).ok;
      } catch {}
      if (ready) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    if (!ready) throw new Error("Servidor de revisão indisponível.");
  }
  browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const [name, viewport] of [
    ["1440", { width: 1440, height: 1000 }],
    ["1920", { width: 1920, height: 1080 }],
    ["390", { width: 390, height: 844 }],
  ]) {
    const page = await browser.newPage({ viewport });
    const responses = [];
    let calls = 0,
      pageErrors = 0;
    page.on("pageerror", () => pageErrors++);
    page.on("request", (request) => {
      if (new URL(request.url()).pathname === "/api/trees") calls++;
    });
    page.on("response", (response) => {
      const url = new URL(response.url());
      if (url.pathname !== "/api/trees") return;
      responses.push(
        (async () => {
          const body = await response.body();
          return {
            offset: Number(url.searchParams.get("offset") || 0),
            bytes: body.byteLength,
            rows: JSON.parse(body.toString()).length,
            duration: response.request().timing().responseEnd,
            status: response.status(),
          };
        })(),
      );
    });
    await page.goto(base);
    await page.waitForFunction(
      () =>
        performance.getEntriesByName("ipes:dataset:ready").length &&
        performance.getEntriesByName("ipes:markers:visible").length,
      {},
      { timeout: 60000 },
    );
    await page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});
    const pages = (await Promise.all(responses)).sort(
      (a, b) => a.offset - b.offset,
    );
    const marks = await page.evaluate(() => ({
      datasetMs: performance.getEntriesByName("ipes:dataset:load")[0].duration,
      firstMarkersMs: performance.getEntriesByName("ipes:markers:visible")[0]
        .startTime,
      datasetStartMs:
        performance.getEntriesByName("ipes:dataset:start")[0].startTime,
      setDataCalls: performance.getEntriesByName("ipes:source:set-data").length,
      transferBytes: performance
        .getEntriesByType("resource")
        .filter((entry) => new URL(entry.name).pathname === "/api/trees")
        .reduce((sum, entry) => sum + entry.transferSize, 0),
      encodedBytes: performance
        .getEntriesByType("resource")
        .filter((entry) => new URL(entry.name).pathname === "/api/trees")
        .reduce((sum, entry) => sum + entry.encodedBodySize, 0),
    }));
    const bounds = await page.locator(".map-workspace").boundingBox();
    await page.screenshot({
      path: `docs/validacao/${capturePrefix}-real-${name}.png`,
    });
    const clusterCounts = {
      city: await page.locator(".botanical-cluster").count(),
    };
    const initialCalls = calls;
    await page.evaluate(() => {
      window.__uxFrameTimes = [];
      window.__uxRecording = true;
      let previous = performance.now();
      const frame = (time) => {
        window.__uxFrameTimes.push(time - previous);
        previous = time;
        if (window.__uxRecording) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
    await page.mouse.move(bounds.width * 0.7, bounds.y + bounds.height * 0.5);
    await page.mouse.down();
    await page.mouse.move(
      bounds.width * 0.55,
      bounds.y + bounds.height * 0.55,
      { steps: 30 },
    );
    await page.mouse.up();
    const frameTimes = await page.evaluate(() => {
      window.__uxRecording = false;
      return window.__uxFrameTimes
        .slice(1)
        .filter((time) => time > 0)
        .sort((a, b) => a - b);
    });
    await page.getByRole("button", { name: "Zoom in", exact: true }).click();
    await page.waitForTimeout(600);
    clusterCounts.neighborhood = await page
      .locator(".botanical-cluster")
      .count();
    if (clusterCounts.neighborhood)
      throw new Error("Agrupamentos permaneceram na escala de bairro.");
    if (refinement || hierarchy)
      await page.screenshot({
        path: `docs/validacao/${capturePrefix}-bairro-${name}.png`,
      });
    if (viewport.width < 768)
      await page.getByRole("button", { name: "Zoom out", exact: true }).click();
    else
      await page
        .getByRole("button", { name: "Mostrar Goiânia", exact: true })
        .click();
    const navigationSetDataCalls = await page.evaluate(
      () => performance.getEntriesByName("ipes:source:set-data").length,
    );
    const navigationRequests = calls - initialCalls;
    await page.waitForTimeout(600);
    await page.getByRole("button", { name: "Zoom out", exact: true }).click();
    await page.waitForTimeout(600);
    clusterCounts.distant = await page.locator(".botanical-cluster").count();
    if (refinement || hierarchy) {
      await page.screenshot({
        path: `docs/validacao/${capturePrefix}-distante-${name}.png`,
      });
    }
    const paletteChecks = {};
    for (const [label, palette] of [
      ["Amarelos", "amarelo"],
      ["Rosas / Roxos", "rosa_roxo"],
      ["Brancos", "branco"],
      ["Todos", "multicolorido"],
    ]) {
      await page.getByRole("button", { name: label, exact: true }).click();
      await page
        .locator(`.botanical-cluster[data-palette="${palette}"]`)
        .first()
        .waitFor();
      paletteChecks[palette] = true;
      if (palette === "branco")
        await page.screenshot({
          path: `docs/validacao/${capturePrefix}-brancos-${name}.png`,
        });
    }
    const result = {
      viewport,
      mode: production ? "production" : "development",
      rows: pages.reduce((sum, page) => sum + page.rows, 0),
      initialRequests: pages.length,
      firstQueryMs: Math.round(pages[0].duration),
      datasetLoadMs: Math.round(marks.datasetMs),
      payloadDecodedBytes: pages.reduce((sum, page) => sum + page.bytes, 0),
      payloadEncodedBytes: marks.encodedBytes,
      payloadTransferBytes: marks.transferBytes,
      firstMarkersFromNavigationMs: Math.round(marks.firstMarkersMs),
      firstMarkersFromDatasetStartMs: Math.round(
        marks.firstMarkersMs - marks.datasetStartMs,
      ),
      initialSetDataCalls: marks.setDataCalls,
      navigationSetDataCalls: navigationSetDataCalls - marks.setDataCalls,
      navigationRequests,
      filterRequests: calls - initialCalls - navigationRequests,
      panFrameMedianMs: frameTimes.length
        ? Number(frameTimes[Math.floor(frameTimes.length * 0.5)].toFixed(1))
        : null,
      panFrameP95Ms: frameTimes.length
        ? Number(
            frameTimes[
              Math.min(
                frameTimes.length - 1,
                Math.floor(frameTimes.length * 0.95),
              )
            ].toFixed(1),
          )
        : null,
      panFrames: frameTimes.length,
      mapBounds: bounds,
      clusterCounts,
      paletteChecks,
      pageErrors,
      mapNotices: await page.locator(".map-notice").count(),
      overflow: await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      status: await page.locator(".map-status").textContent(),
    };
    if (
      result.navigationRequests ||
      result.navigationSetDataCalls ||
      result.filterRequests ||
      result.pageErrors ||
      result.mapNotices ||
      result.overflow
    )
      throw new Error(
        "A revisão encontrou regressão de navegação, layout ou carregamento.",
      );
    results.push(result);
    console.log(JSON.stringify(result));
    await page.close();
  }
  await writeFile(
    hierarchy
      ? "docs/validacao/metricas-hierarquia-mapa.json"
      : refinement
        ? "docs/validacao/metricas-refinamento-mapa.json"
        : "docs/validacao/metricas-mapa.json",
    JSON.stringify(
      {
        measuredAt: new Date().toISOString(),
        environment:
          "Windows, Chrome headless; rede real para Supabase e MapTiler",
        results,
      },
      null,
      2,
    ) + "\n",
  );
} finally {
  await browser?.close();
  server?.kill();
}

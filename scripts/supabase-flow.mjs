import { createClient } from "@supabase/supabase-js";
import { chromium, expect, request } from "@playwright/test";
import { spawn, execFileSync } from "node:child_process";
import { randomBytes, randomUUID } from "node:crypto";
import sharp from "sharp";
import { loadLocalEnv, missing, safeFailure } from "./env.mjs";
import { databaseClient } from "./database-client.mjs";

loadLocalEnv();
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "DATABASE_URL",
  "SESSION_SECRET",
];
const absent = missing(required);
if (absent.length) {
  console.log(
    `Real flow blocked: missing ${absent.join(", ")}. Fill .env.local; never paste values into chat.`,
  );
  process.exitCode = 2;
} else {
  const base = "http://127.0.0.1:3300";
  const privileged = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const publicClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const userIds = [],
    observationIds = [],
    objects = [];
  let server, browser, anonymous, db;
  try {
    // Fixed private bucket is established by the versioned migration.
    const { data: bucket, error: bucketError } =
      await privileged.storage.getBucket("fotos");
    if (bucketError || !bucket || bucket.public)
      throw new Error("Private bucket missing.");
    const email = `infra-${randomUUID()}@example.com`,
      password = randomBytes(32).toString("base64url");
    const { data: account, error: accountError } =
      await privileged.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: "admin" },
      });
    if (accountError || !account.user)
      throw new Error("Test Auth account creation failed.");
    userIds.push(account.user.id);
    server = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "dev",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3300",
      ],
      {
        env: {
          ...process.env,
          DATA_BACKEND: "supabase",
          NEXT_PUBLIC_SITE_URL: base,
        },
        stdio: "ignore",
        windowsHide: true,
      },
    );
    anonymous = await request.newContext({ baseURL: base });
    let ready = false;
    for (let i = 0; i < 90; i++) {
      if (server.exitCode !== null)
        throw new Error(
          "Test server did not start; stop other development servers.",
        );
      try {
        if ((await anonymous.get("/api/stats", { timeout: 1000 })).ok()) {
          ready = true;
          break;
        }
      } catch {
        /* Wait for startup. */
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    if (!ready) throw new Error("Real data API did not become ready.");
    browser = await chromium.launch({ channel: "chrome", headless: true });
    const page = await browser.newPage({
      viewport: { width: 390, height: 844 },
    });
    const mapAssets = process.env.NEXT_PUBLIC_MAPTILER_KEY
      ? Promise.all([
          page.waitForResponse(
            (r) => {
              const url = new URL(r.url());
              return (
                url.hostname === "api.maptiler.com" &&
                url.pathname.endsWith("/style.json") &&
                r.status() === 200
              );
            },
            { timeout: 30000 },
          ),
          page.waitForResponse(
            (r) => {
              const url = new URL(r.url());
              return (
                url.hostname === "api.maptiler.com" &&
                /\.(pbf|png|webp|jpg)$/.test(url.pathname) &&
                r.status() === 200
              );
            },
            { timeout: 30000 },
          ),
        ])
      : Promise.resolve();
    // Attach a rejection handler immediately while navigation is still pending.
    void mapAssets.catch(() => {});
    await page.goto(base);
    await expect(
      page.getByRole("heading", { name: "Ipês em Goiânia" }),
    ).toBeVisible();
    // Browser basemap is live; no network mocks, screenshots or traces with credentials.
    await expect(page.locator(".map-canvas canvas")).toBeVisible();
    await mapAssets;
    if (process.env.NEXT_PUBLIC_MAPTILER_KEY)
      console.log(
        "Live MapTiler browser style and tiles validated; key suppressed.",
      );
    if (process.env.NEXT_PUBLIC_MAPTILER_KEY) {
      const styleResponse = await fetch(
        `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(process.env.NEXT_PUBLIC_MAPTILER_KEY)}`,
        { headers: { Origin: base, Referer: `${base}/` } },
      );
      if (!styleResponse.ok) throw new Error("MapTiler style unavailable.");
    }
    await page.goto(`${base}/admin`);
    await page.getByLabel("E-mail", { exact: true }).fill(email);
    await page.getByLabel("Senha", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Entrar", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Sair", exact: true }),
    ).toBeVisible();
    const baseline = await (await anonymous.get("/api/stats")).json();
    let treeId;
    for (const historical of [false, true]) {
      const input = await sharp({
        create: {
          width: 1900,
          height: 1200,
          channels: 3,
          background: historical ? "#be719f" : "#e7ae24",
        },
      })
        .withExif({
          IFD0: { ImageDescription: randomUUID() },
          IFD2: { DateTimeOriginal: "2023:09:01 12:00:00" },
        })
        .jpeg()
        .toBuffer();
      await page.goto(
        `${base}/registrar${historical ? `?arvore=${treeId}` : ""}`,
      );

      await page
        .getByLabel(historical ? "Enviar foto antiga" : "Fotografar agora", {
          exact: true,
        })
        .setInputFiles({
          name: "infra.jpg",
          mimeType: "image/jpeg",
          buffer: input,
        });
      await expect(
        page.getByText("Encontramos data original no EXIF."),
      ).toBeVisible();
      await page
        .getByLabel("Quando a fotografia foi feita?")
        .fill(
          historical ? "2023-09-02" : new Date().toISOString().slice(0, 10),
        );
      await page.getByRole("button", { name: "Continuar" }).click();
      await page.getByLabel("Latitude", { exact: true }).fill("-16.686");
      await page.getByLabel("Longitude", { exact: true }).fill("-49.264");
      await page.getByRole("button", { name: "Continuar" }).click();
      await page.getByLabel("Cor das flores").selectOption("AMARELO");
      await page.getByLabel("Estado da floração").selectOption("INTENSA");
      if (
        !historical &&
        (await page
          .getByText("É outra árvore — criar novo cadastro")
          .isVisible())
      )
        await page.getByText("É outra árvore — criar novo cadastro").click();
      await page.getByRole("checkbox").check();
      const responsePromise = page.waitForResponse(
        (r) =>
          r.url().endsWith("/api/submit") && r.request().method() === "POST",
      );
      await page.getByRole("button", { name: "Enviar para moderação" }).click();
      const response = await responsePromise;
      if (response.status() !== 201) throw new Error("Real submission failed.");
      const { id } = await response.json();
      observationIds.push(id);
      objects.push(
        `observacoes/${id}/web.webp`,
        `observacoes/${id}/thumb.webp`,
      );
      const pending = await (
        await page.request.get(`${base}/api/admin`)
      ).json();
      const record = pending.find((o) => o.id === id);
      if (!record || record.status_moderacao !== "PENDENTE")
        throw new Error("Pending record missing.");
      if (!historical) treeId = record.arvore_id;
      if (historical && record.data_observacao !== "2023-09-02")
        throw new Error("EXIF correction was not retained.");
      if (
        (await anonymous.get(`/api/media/${record.fotos[0].key}`)).status() !==
        404
      )
        throw new Error("Pending media leaked.");
      const direct = await publicClient.storage
        .from("fotos")
        .download(record.fotos[0].key);
      if (!direct.error) throw new Error("Private Storage download leaked.");
      const listed = await publicClient.storage
        .from("fotos")
        .list(`observacoes/${id}`);
      if (!listed.error && listed.data?.length)
        throw new Error("Private Storage listing leaked.");
      const upload = await publicClient.storage
        .from("fotos")
        .upload(record.fotos[0].key, input, { upsert: true });
      if (!upload.error) throw new Error("Public Storage write allowed.");
      await page.goto(`${base}/admin`);
      const card = page.locator(".review-card").filter({
        has: page.getByText(record.arvore.codigo_publico, { exact: false }),
      });
      await card.getByLabel("Confiança dos dados").selectOption("B");
      await card.getByRole("button", { name: "Aprovar", exact: true }).click();
      await expect(card).toHaveCount(0);
      const media = await anonymous.get(`/api/media/${record.fotos[0].key}`);
      if (!media.ok() || (await sharp(await media.body()).metadata()).exif)
        throw new Error("Approved optimized image invalid.");
    }
    const after = await (await anonymous.get("/api/stats")).json();
    if (
      after.arvores !== baseline.arvores + 1 ||
      after.observacoes !== baseline.observacoes + 2
    )
      throw new Error("Real statistics failed.");
    await page.goto(`${base}/arvore/${treeId}`);
    await expect(page.locator(".timeline article")).toHaveCount(2);
    await page.goto(`${base}/galeria`);
    await expect(
      page.locator(`a[href="/arvore/${treeId}"]`).first(),
    ).toBeVisible();
    const nearby = await (
      await anonymous.get("/api/nearby?lat=-16.686&lng=-49.264")
    ).json();
    if (!nearby.some((tree) => tree.id === treeId))
      throw new Error("Map/nearby query failed.");
    console.log(
      "Real browser flow passed: Auth, Supabase Storage, pending isolation, approval, gallery, history and historical EXIF correction.",
    );
  } catch (error) {
    safeFailure("Real Supabase browser flow failed", error);
  } finally {
    await browser?.close().catch(() => {});
    await anonymous?.dispose().catch(() => {});
    if (server?.pid && server.exitCode === null) {
      if (process.platform === "win32") {
        try {
          execFileSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], {
            stdio: "ignore",
            windowsHide: true,
          });
        } catch {
          server.kill();
        }
      } else server.kill();
    }
    // Delete only IDs generated by this run; never reset the database or buckets.
    try {
      if (objects.length) {
        const { error } = await privileged.storage
          .from("fotos")
          .remove(objects);
        if (error) throw new Error("Test object cleanup failed.");
      }
      if (observationIds.length) {
        db = await databaseClient();
        await db.connect();
        await db.query("begin");
        const { rows: trees } = await db.query(
          "select distinct arvore_id from public.observacoes where id=any($1::uuid[])",
          [observationIds],
        );
        await db.query(
          "delete from privado.moderacoes where observacao_id=any($1::uuid[])",
          [observationIds],
        );
        await db.query(
          "delete from public.fotos where observacao_id=any($1::uuid[])",
          [observationIds],
        );
        await db.query(
          "delete from public.observacoes where id=any($1::uuid[])",
          [observationIds],
        );
        await db.query(
          "delete from public.arvores a where a.id=any($1::uuid[]) and not exists(select 1 from public.observacoes o where o.arvore_id=a.id)",
          [trees.map((t) => t.arvore_id)],
        );
        await db.query("commit");
      }
      for (const id of userIds) {
        const { error } = await privileged.auth.admin.deleteUser(id);
        if (error) throw new Error("Test Auth cleanup failed.");
      }
      console.log("Temporary flow fixtures cleaned up.");
    } catch (error) {
      safeFailure(
        "Fixture cleanup failed; reconcile only temporary infra test records",
        error,
      );
    } finally {
      await db?.end().catch(() => {});
    }
  }
}

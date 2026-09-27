import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import * as repo from "@/lib/server/repository";
import { admin, requireAdmin, login, logout } from "@/lib/server/auth";
import { HttpError, backend } from "@/lib/server/config";
import { checkOrigin, rateLimit } from "@/lib/server/security";
import { preparePhoto, readPhoto, removePhoto } from "@/lib/server/photos";
import { submissionSchema, moderationSchema } from "@/lib/domain";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };
const querySchema = z
  .object({
    west: z.coerce.number().min(-180).max(180).optional(),
    east: z.coerce.number().min(-180).max(180).optional(),
    south: z.coerce.number().min(-90).max(90).optional(),
    north: z.coerce.number().min(-90).max(90).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radius: z.coerce.number().min(1).max(5000).optional(),
    offset: z.coerce.number().int().min(0).max(100000).optional(),
    limit: z.coerce.number().int().min(1).max(500).optional(),
    search: z.string().max(100).optional(),
    color: z
      .enum(["AMARELO", "ROSA_ROXO", "BRANCO", "NAO_SEI", "OUTRO"])
      .optional(),
    blooming: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    historical: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    week: z
      .enum(["true", "false"])
      .transform((v) => v === "true")
      .optional(),
    species: z.uuid().optional(),
    confidence: z.enum(["A", "B", "C", "D"]).optional(),
    since: z.iso.date().optional(),
    sort: z.enum(["recent", "observations"]).optional(),
  })
  .refine(
    (q) =>
      [q.west, q.south, q.east, q.north].every((v) => v === undefined) ||
      [q.west, q.south, q.east, q.north].every((v) => v !== undefined),
    "Informe os quatro limites do mapa.",
  )
  .refine(
    (q) => (q.lat === undefined) === (q.lng === undefined),
    "Informe latitude e longitude.",
  );
function fail(e: unknown) {
  if (e instanceof z.ZodError)
    return NextResponse.json(
      { error: e.issues.map((i) => i.message).join(" ") },
      { status: 400 },
    );
  if (e instanceof HttpError)
    return NextResponse.json({ error: e.message }, { status: e.status });
  // Provider errors may contain credentials or connection URLs. Never log them.
  console.error("API operation failed; provider details suppressed.");
  return NextResponse.json(
    {
      error: "Serviço indisponível. Confira a configuração ou tente novamente.",
    },
    { status: 503 },
  );
}
export async function GET(req: NextRequest, context: Context) {
  try {
    const path = (await context.params).path;
    const q = querySchema.parse(Object.fromEntries(req.nextUrl.searchParams));
    let result: unknown;
    if (path[0] === "trees")
      result = path[1]
        ? await repo.tree(z.uuid().parse(path[1]))
        : await repo.trees(q);
    else if (path[0] === "nearby") {
      if (q.lat === undefined || q.lng === undefined)
        throw new HttpError(400, "Informe o ponto.");
      result = await repo.trees({
        ...q,
        radius: 10,
        limit: 20,
      });
    } else if (path[0] === "stats") result = await repo.stats();
    else if (path[0] === "gallery") result = await repo.gallery(q);
    else if (path[0] === "species") result = await repo.species();
    else if (path[0] === "status")
      result = { backend: backend(), authenticated: !!(await admin()) };
    else if (path[0] === "admin") {
      await requireAdmin();
      result = await repo.pending();
    } else if (path[0] === "media" && path[1]) {
      const key = path.slice(1).join("/");
      const a = !!(await admin());
      if (!(await repo.authorizedPhoto(key, a)))
        throw new HttpError(404, "Foto não encontrada.");
      const data = await readPhoto(key);
      return new NextResponse(new Uint8Array(data), {
        headers: {
          "Content-Type": "image/webp",
          "Cache-Control": a ? "private, no-store" : "public, max-age=300",
          Vary: "Cookie",
        },
      });
    } else throw new HttpError(404, "Não encontrado.");
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (e) {
    return fail(e);
  }
}
export async function POST(req: NextRequest, context: Context) {
  try {
    checkOrigin(req);
    const path = (await context.params).path;
    if (path[0] === "login") {
      await rateLimit(req, "login");
      const input = z
        .object({
          email: z.string().max(254),
          password: z.string().min(1).max(200),
        })
        .parse(await req.json());
      await login(input.email, input.password);
      return NextResponse.json({ ok: true });
    }
    if (path[0] === "logout") {
      await logout();
      return NextResponse.json({ ok: true });
    }
    if (path[0] === "admin" && path[1]) {
      const a = await requireAdmin();
      const m = moderationSchema.parse(await req.json());
      return NextResponse.json(
        await repo.moderate(z.uuid().parse(path[1]), m, a.id),
      );
    }
    if (path[0] === "submit") {
      await rateLimit(req, "submission", 20);
      const maxBody = 4 * 1024 * 1024 + 128 * 1024;
      if (Number(req.headers.get("content-length") || 0) > maxBody)
        throw new HttpError(413, "Envio muito grande. Limite: 4 MB por foto.");
      const reader = req.body?.getReader();
      if (!reader) throw new HttpError(400, "Envio vazio.");
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > maxBody) {
          await reader.cancel();
          throw new HttpError(
            413,
            "Envio muito grande. Limite: 4 MB por foto.",
          );
        }
        chunks.push(value);
      }
      const bytes = Buffer.concat(chunks);
      const form = await new Request(req.url, {
        method: "POST",
        headers: { "content-type": req.headers.get("content-type") || "" },
        body: bytes,
      }).formData();
      const s = submissionSchema.parse(JSON.parse(String(form.get("data"))));
      const file = form.get("photo");
      if (!(file instanceof File))
        throw new HttpError(400, "Adicione uma fotografia.");
      const { photo, metadata } = await preparePhoto(file);
      try {
        const result = await repo.submit(s, photo, metadata);
        return NextResponse.json(result, { status: 201 });
      } catch (e) {
        await removePhoto([photo.key, photo.thumbnail_key]);
        throw e;
      }
    }
    throw new HttpError(404, "Não encontrado.");
  } catch (e) {
    return fail(e);
  }
}

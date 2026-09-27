import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { backend, HttpError } from "./config";
import { rpc } from "./supabase";
export function checkOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expected = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;
  if (!origin || origin !== new URL(expected).origin)
    throw new HttpError(403, "Origem da requisição não permitida.");
}
const g = globalThis as typeof globalThis & {
  rateBuckets?: Map<string, { count: number; until: number }>;
};
export async function rateLimit(
  req: NextRequest,
  kind: "login" | "submission",
  max = 10,
) {
  const ip = (
    req.headers.get("x-forwarded-for")?.split(",")[0] || "local"
  ).trim();
  const secret = process.env.SESSION_SECRET;
  if (backend() === "supabase" && (!secret || secret.length < 32))
    throw new HttpError(
      503,
      "Configure SESSION_SECRET (mínimo 32 caracteres).",
    );
  const key = createHmac("sha256", secret || "local-dev-only")
    .update(`${kind}:${ip}`)
    .digest("hex");
  if (backend() === "supabase") {
    if (
      !(await rpc<boolean>("limitar_envios", { chave: key, maximo: max }, true))
    )
      throw new HttpError(429, "Muitas tentativas. Aguarde uma hora.");
    return;
  }
  const buckets = (g.rateBuckets ||= new Map());
  for (const [key, v] of buckets) if (v.until < Date.now()) buckets.delete(key);
  const value = buckets.get(key) || { count: 0, until: Date.now() + 3600000 };
  value.count++;
  buckets.set(key, value);
  if (value.count > max)
    throw new HttpError(429, "Muitas tentativas. Aguarde uma hora.");
}

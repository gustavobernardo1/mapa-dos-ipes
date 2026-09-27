import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";
import { backend, HttpError } from "./config";
import { supabase } from "./supabase";
const cookieName = "ipes-admin";
function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32)
    throw new HttpError(
      503,
      "Configure SESSION_SECRET com pelo menos 32 caracteres.",
    );
  return s;
}
function equal(a: string, b: string) {
  const x = Buffer.from(a),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export async function admin(): Promise<{ id: string } | null> {
  const c = (await cookies()).get(cookieName)?.value;
  if (!c) return null;
  if (backend() === "local") {
    const [payload, signature] = c.split(".");
    if (!payload || !signature) return null;
    if (
      !equal(
        signature,
        createHmac("sha256", secret()).update(payload).digest("hex"),
      )
    )
      return null;
    try {
      const data = JSON.parse(Buffer.from(payload, "base64url").toString());
      return data.exp > Date.now() ? { id: "local-admin" } : null;
    } catch {
      return null;
    }
  }
  const { data, error } = await supabase().auth.getUser(c);
  return !error && data.user?.app_metadata?.role === "admin"
    ? { id: data.user.id }
    : null;
}
export async function requireAdmin() {
  const a = await admin();
  if (!a) throw new HttpError(401, "Entre como administrador.");
  return a;
}
export async function login(email: string, password: string) {
  let token: string;
  if (backend() === "local") {
    const configured = process.env.LOCAL_ADMIN_PASSWORD;
    if (!configured || configured.length < 12)
      throw new HttpError(
        503,
        "Configure LOCAL_ADMIN_PASSWORD (mínimo 12 caracteres) para testar a moderação local.",
      );
    if (!equal(password, configured))
      throw new HttpError(401, "Credenciais inválidas.");
    const payload = Buffer.from(
      JSON.stringify({ exp: Date.now() + 3600000 }),
    ).toString("base64url");
    token = `${payload}.${createHmac("sha256", secret()).update(payload).digest("hex")}`;
  } else {
    const { data, error } = await supabase().auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user || data.user.app_metadata.role !== "admin")
      throw new HttpError(
        401,
        "Credenciais inválidas ou sem acesso de administrador.",
      );
    token = data.session!.access_token;
  }
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 3600,
  });
}
export async function logout() {
  (await cookies()).delete(cookieName);
}

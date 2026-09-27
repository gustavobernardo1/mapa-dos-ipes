import { createClient } from "@supabase/supabase-js";
import { HttpError, backend } from "./config";
export function supabase(privileged = false, token?: string) {
  if (backend() !== "supabase")
    throw new HttpError(503, "Supabase não selecionado.");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    privileged
      ? process.env.SUPABASE_SECRET_KEY!
      : process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : undefined,
    },
  );
}
export async function rpc<T>(
  name: string,
  args: Record<string, unknown> = {},
  privileged = false,
): Promise<T> {
  const { data, error } = await supabase(privileged).rpc(name, args);
  if (error) {
    if (error.code === "23505")
      throw new HttpError(409, "Esta fotografia já foi enviada.");
    if (["23503", "23514", "22P02"].includes(error.code))
      throw new HttpError(400, "Dados inválidos ou registro não disponível.");
    if (error.code === "P0001")
      throw new HttpError(
        409,
        "Registro indisponível para esta ação. Atualize e confira os dados.",
      );
    console.error("Database RPC failed:", name, "provider details suppressed.");
    throw new Error(
      "Não foi possível acessar o banco. Confira as migrations e a configuração.",
    );
  }
  return data as T;
}

export function backend(): "local" | "supabase" {
  const selected = process.env.DATA_BACKEND || "supabase";
  if (selected === "supabase") {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      !process.env.SUPABASE_SECRET_KEY
    )
      throw new HttpError(
        503,
        "Configure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY e SUPABASE_SECRET_KEY no ambiente.",
      );
    return "supabase";
  }
  if (selected !== "local")
    throw new HttpError(503, "DATA_BACKEND deve ser supabase ou local.");
  if (process.env.NODE_ENV === "production")
    throw new HttpError(
      503,
      "Configure DATA_BACKEND=supabase para publicar. O armazenamento local é apenas de desenvolvimento.",
    );
  return "local";
}
export const localDirectory = () => process.env.LOCAL_DATA_DIR || ".local-data";
export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

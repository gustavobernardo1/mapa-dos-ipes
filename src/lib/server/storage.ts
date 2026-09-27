import { promises as fs } from "node:fs";
import path from "node:path";
import { backend, HttpError, localDirectory } from "./config";
import { supabase } from "./supabase";

export interface PhotoStorage {
  put(key: string, data: Buffer): Promise<void>;
  read(key: string): Promise<Buffer>;
  remove(keys: string[]): Promise<void>;
}

export function validatePhotoKey(key: string) {
  const uuid = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
  // Old local keys remain readable; all new uploads use observation paths.
  if (
    !new RegExp(
      `^(?:observacoes/${uuid}/(?:web|thumb)|${uuid}(?:-thumb)?)\\.webp$`,
    ).test(key)
  )
    throw new HttpError(404, "Foto não encontrada.");
}

function localPath(key: string) {
  validatePhotoKey(key);
  return path.join(localDirectory(), "photos", key);
}
const local: PhotoStorage = {
  async put(key, data) {
    const target = localPath(key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data, { flag: "wx" });
  },
  async read(key) {
    return fs.readFile(localPath(key));
  },
  async remove(keys) {
    for (const key of keys) {
      try {
        await fs.unlink(localPath(key));
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
  },
};

function bucket() {
  const name = process.env.SUPABASE_STORAGE_BUCKET || "fotos";
  if (name !== "fotos")
    throw new HttpError(
      503,
      "SUPABASE_STORAGE_BUCKET deve ser fotos, conforme a migration de segurança.",
    );
  return supabase(true).storage.from(name);
}
const remote: PhotoStorage = {
  async put(key, data) {
    validatePhotoKey(key);
    const { error } = await bucket().upload(key, data, {
      contentType: "image/webp",
      upsert: false,
    });
    if (error)
      throw new HttpError(
        503,
        "Upload indisponível. Confira o bucket privado e as migrations.",
      );
  },
  async read(key) {
    validatePhotoKey(key);
    const { data, error } = await bucket().download(key);
    if (error || !data) throw new HttpError(404, "Foto não encontrada.");
    return Buffer.from(await data.arrayBuffer());
  },
  async remove(keys) {
    keys.forEach(validatePhotoKey);
    const { error } = await bucket().remove(keys);
    if (error) throw new Error("Storage cleanup failed.");
  },
};

export function photoStorage(): PhotoStorage {
  return backend() === "supabase" ? remote : local;
}

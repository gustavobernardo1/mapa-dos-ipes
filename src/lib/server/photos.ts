import sharp, { type Metadata as SharpMetadata } from "sharp";
import exifr from "exifr";
import { createHash, randomUUID } from "node:crypto";
import { HttpError } from "./config";
import { photoStorage } from "./storage";
import type { Photo, Metadata } from "../domain";
const MAX = 4 * 1024 * 1024;
const allowed: Record<string, string> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};
const extensions: Record<string, RegExp> = {
  "image/jpeg": /\.jpe?g$/i,
  "image/png": /\.png$/i,
  "image/webp": /\.webp$/i,
};
export async function removePhoto(keys: string[]) {
  try {
    await photoStorage().remove(keys);
  } catch {
    console.error(
      "Photo cleanup failed; reconcile orphan objects. Provider details suppressed.",
    );
  }
}
export async function readPhoto(key: string) {
  return photoStorage().read(key);
}
export async function preparePhoto(
  file: File,
): Promise<{ photo: Photo; metadata: Metadata }> {
  if (
    !allowed[file.type] ||
    !extensions[file.type]?.test(file.name) ||
    !file.size ||
    file.size > MAX
  )
    throw new HttpError(400, "Envie JPEG, PNG ou WebP de até 4 MB.");
  const input = Buffer.from(await file.arrayBuffer());
  let meta: SharpMetadata;
  try {
    meta = await sharp(input, {
      limitInputPixels: 40_000_000,
      animated: false,
    }).metadata();
  } catch {
    throw new HttpError(
      400,
      "A fotografia está inválida ou excede 40 megapixels.",
    );
  }
  if (meta.format !== allowed[file.type] || (meta.pages || 1) > 1)
    throw new HttpError(
      400,
      "Formato de imagem inválido. Imagens animadas não são aceitas.",
    );
  const id = randomUUID(),
    observacao_id = randomUUID(),
    key = `observacoes/${observacao_id}/web.webp`,
    thumbnail_key = `observacoes/${observacao_id}/thumb.webp`;
  let exif: Record<string, unknown> | null = null;
  try {
    exif = await exifr.parse(input, {
      pick: [
        "DateTimeOriginal",
        "GPSLatitude",
        "GPSLongitude",
        "GPSLatitudeRef",
        "GPSLongitudeRef",
      ],
    });
  } catch {
    /* Metadata is optional and untrusted. */
  }
  const d = exif?.DateTimeOriginal;
  const metadata: Metadata = {
    foto_id: id,
    data_exif:
      d instanceof Date && Number.isFinite(d.getTime())
        ? d.toISOString()
        : null,
    latitude_exif:
      typeof exif?.latitude === "number" && Math.abs(exif.latitude) <= 90
        ? exif.latitude
        : null,
    longitude_exif:
      typeof exif?.longitude === "number" && Math.abs(exif.longitude) <= 180
        ? exif.longitude
        : null,
  };
  // Default sharp output strips EXIF, including GPS; the original never leaves memory.
  const web = await sharp(input, { limitInputPixels: 40_000_000 })
    .rotate()
    .resize({
      width: 1800,
      height: 1800,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88 })
    .toBuffer({ resolveWithObject: true });
  const thumb = await sharp(web.data)
    .resize({
      width: 480,
      height: 480,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 82 })
    .toBuffer();
  try {
    await photoStorage().put(key, web.data);
    await photoStorage().put(thumbnail_key, thumb);
  } catch (e) {
    await removePhoto([key, thumbnail_key]);
    throw e;
  }
  return {
    photo: {
      id,
      observacao_id,
      key,
      thumbnail_key,
      hash_arquivo: createHash("sha256").update(input).digest("hex"),
      largura: web.info.width,
      altura: web.info.height,
      criado_em: new Date().toISOString(),
    },
    metadata,
  };
}

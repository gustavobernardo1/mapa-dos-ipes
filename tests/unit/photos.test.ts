import { afterAll, beforeAll, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { preparePhoto, readPhoto } from "../../src/lib/server/photos";
let directory: string;
beforeAll(async () => {
  directory = await mkdtemp(path.join(process.cwd(), ".test-data-photo-"));
  process.env.LOCAL_DATA_DIR = directory;
  process.env.DATA_BACKEND = "local";
});
afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});
it("validates actual content, optimizes, hashes, and strips private EXIF", async () => {
  const data = await sharp({
    create: { width: 2200, height: 1300, channels: 3, background: "#e3ad22" },
  })
    .withExif({
      IFD0: { Artist: "PRIVATE NAME" },
      IFD2: { DateTimeOriginal: "2023:09:01 12:00:00" },
      IFD3: {
        GPSLatitudeRef: "S",
        GPSLatitude: "16/1 41/1 96/10",
        GPSLongitudeRef: "W",
        GPSLongitude: "49/1 15/1 504/10",
      },
    })
    .jpeg()
    .toBuffer();
  const result = await preparePhoto(
    new File([new Uint8Array(data)], "original.jpg", { type: "image/jpeg" }),
  );
  expect(result.photo.largura).toBe(1800);
  expect(result.photo.hash_arquivo).toHaveLength(64);
  expect(result.photo.key).toBe(
    `observacoes/${result.photo.observacao_id}/web.webp`,
  );
  expect(result.metadata.data_exif).toContain("2023-09-01");
  expect(result.metadata.latitude_exif).toBeCloseTo(-16.686, 5);
  expect(result.metadata.longitude_exif).toBeCloseTo(-49.264, 5);
  const web = await sharp(await readPhoto(result.photo.key)).metadata();
  expect(web.exif).toBeUndefined();
  expect(web.format).toBe("webp");
  const thumb = await sharp(
    await readPhoto(result.photo.thumbnail_key),
  ).metadata();
  expect(thumb.width).toBeLessThanOrEqual(480);
  await expect(
    preparePhoto(
      new File([new Uint8Array(data)], "spoof.exe", { type: "image/jpeg" }),
    ),
  ).rejects.toThrow("4 MB");
  await expect(readPhoto("../private.webp")).rejects.toThrow("não encontrada");
  await expect(
    preparePhoto(
      new File([new Uint8Array(data)], "spoof.png", { type: "image/png" }),
    ),
  ).rejects.toThrow("Formato");
  await expect(
    preparePhoto(new File(["broken"], "broken.jpg", { type: "image/jpeg" })),
  ).rejects.toThrow("inválida");
  await expect(
    preparePhoto(
      new File([new Uint8Array(4 * 1024 * 1024 + 1)], "large.jpg", {
        type: "image/jpeg",
      }),
    ),
  ).rejects.toThrow("4 MB");
});

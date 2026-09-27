import { afterAll, beforeAll, describe, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import * as repo from "../../src/lib/server/repository";
import { mutateLocal, readLocal } from "../../src/lib/server/local";
import {
  submissionSchema,
  type Photo,
  type Metadata,
} from "../../src/lib/domain";
let directory: string;
const s = submissionSchema.parse({
  latitude: -16.68,
  longitude: -49.26,
  data_observacao: "2023-09-01",
  origem: "FOTO_HISTORICA",
  cor_observada: "AMARELO",
  status_floracao: "INTENSA",
  identificacao_usuario: "PROVAVEL",
  consentimento: true,
});
function photo() {
  const id = randomUUID();
  return {
    id,
    observacao_id: randomUUID(),
    key: `${id}.webp`,
    thumbnail_key: `${id}-thumb.webp`,
    hash_arquivo: id,
    largura: 100,
    altura: 100,
    criado_em: new Date().toISOString(),
  } satisfies Photo;
}
beforeAll(async () => {
  directory = await mkdtemp(path.join(process.cwd(), ".test-data-unit-"));
  process.env.LOCAL_DATA_DIR = directory;
  process.env.DATA_BACKEND = "local";
});
afterAll(async () => {
  await rm(directory, { recursive: true, force: true });
});
describe("local persistence, publication and moderation", () => {
  it("serializes concurrent writes while public requests read the same file", async () => {
    await mutateLocal(() => {});
    await Promise.all(
      Array.from({ length: 30 }, (_, i) =>
        i % 2 ? mutateLocal(() => {}) : readLocal(),
      ),
    );
    expect((await readLocal()).trees).toEqual([]);
  });
  it("starts empty, hides pending photos, publishes only after moderation, then joins history", async () => {
    expect((await repo.stats()).arvores).toBe(0);
    const p = photo(),
      m: Metadata = {
        foto_id: p.id,
        data_exif: "2023-09-01T12:00:00Z",
        latitude_exif: -16.68,
        longitude_exif: -49.26,
      };
    await repo.submit(s, p, m);
    expect(await repo.trees()).toHaveLength(0);
    expect(await repo.gallery({})).toHaveLength(0);
    expect(await repo.authorizedPhoto(p.key, false)).toBe(false);
    expect(await repo.authorizedPhoto(p.key, true)).toBe(true);
    const pending = await repo.pending();
    expect(pending[0].metadata?.[0].data_exif).toBe(m.data_exif);
    await repo.moderate(
      p.observacao_id,
      {
        status: "APROVADO",
        cor: "AMARELO",
        confianca: "B",
        especie_id: null,
        criar_nova: false,
      },
      "local",
    );
    const trees = await repo.trees();
    expect(trees).toHaveLength(1);
    expect(trees[0].observacoes[0].metadata).toBeUndefined();
    expect(await repo.stats()).toMatchObject({
      arvores: 1,
      observacoes: 1,
      fotos: 1,
      floridas: 0,
    });
    const second = photo();
    await repo.submit({ ...s, arvore_id: trees[0].id }, second, {
      ...m,
      foto_id: second.id,
    });
    await repo.moderate(
      second.observacao_id,
      {
        status: "APROVADO",
        cor: "AMARELO",
        confianca: "C",
        especie_id: null,
        criar_nova: false,
      },
      "local",
    );
    expect((await repo.tree(trees[0].id))?.observacoes).toHaveLength(2);
    expect((await repo.stats()).arvores).toBe(1);
    expect(
      await repo.trees({ lat: s.latitude, lng: s.longitude, radius: 10 }),
    ).toHaveLength(1);
    await expect(
      repo.moderate(
        second.observacao_id,
        {
          status: "REJEITADO",
          cor: "AMARELO",
          confianca: "D",
          especie_id: null,
          criar_nova: false,
        },
        "local",
      ),
    ).rejects.toThrow("já foi moderado");
  });
  it("rejects duplicate content and a distant association", async () => {
    const t = (await repo.trees())[0];
    const p = photo();
    await expect(
      repo.submit({ ...s, latitude: 0, arvore_id: t.id }, p, {
        foto_id: p.id,
        data_exif: null,
        latitude_exif: null,
        longitude_exif: null,
      }),
    ).rejects.toThrow("longe");
    const existing = (await repo.gallery({}))[0];
    await expect(
      repo.submit(
        s,
        { ...p, hash_arquivo: existing.hash_arquivo },
        {
          foto_id: p.id,
          data_exif: null,
          latitude_exif: null,
          longitude_exif: null,
        },
      ),
    ).rejects.toThrow("já foi enviada");
  });
});

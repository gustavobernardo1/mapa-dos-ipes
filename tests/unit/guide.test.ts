import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import {
  guide,
  guideImages,
  guideSources,
  whiteComparison,
  factLabels,
} from "../../src/content/guide";
describe("conteúdo e direitos do guia", () => {
  it("impede fatos sem referência e deixa lacunas explícitas", () => {
    expect(guide).toHaveLength(7);
    expect(new Set(guide.map((p) => p.id)).size).toBe(7);
    const facts = [
      ...guide.flatMap((p) => [p.note, p.clue, ...Object.values(p.facts)]),
      ...whiteComparison.flatMap((r) => [r.a, r.b]),
    ];
    for (const value of facts) {
      expect(value.text.trim().length).toBeGreaterThan(0);
      if (!value.pending) expect(value.sources.length).toBeGreaterThan(0);
      for (const id of value.sources)
        expect(guideSources[id].url).toMatch(/^https:\/\//);
    }
    for (const p of guide)
      expect(Object.keys(p.facts).sort()).toEqual(
        Object.keys(factLabels).sort(),
      );
  });
  it("não usa cor para distinguir rosa e roxo, nem transfere calendários regionais", () => {
    expect(guide.find((p) => p.id === "rosa")!.note.text).toContain(
      "Tabebuia rosea",
    );
    expect(guide.find((p) => p.id === "roxo")!.note.text).toContain(
      "não separa",
    );
    expect(
      guide.find((p) => p.id === "chuva-de-ouro")!.facts.season.text,
    ).toContain("Índia");
    expect(guide.every((p) => p.facts.duration.pending)).toBe(true);
  });
  it("publica somente fotos licenciadas, atribuíveis e auditáveis", () => {
    const csv = readFileSync("data/guia/imagens_referencia.csv", "utf8");
    const evidence = JSON.parse(
      readFileSync("research/guia/imagens-selecionadas.json", "utf8"),
    );
    const pages = Object.values(evidence.result.query.pages) as {
      imageinfo: {
        descriptionurl: string;
        extmetadata: { LicenseShortName: { value: string } };
      }[];
    }[];
    expect(guideImages.length).toBeGreaterThanOrEqual(7);
    for (const i of guideImages) {
      expect(["CC0", "CC BY 2.0", "CC BY 3.0", "CC BY-SA 3.0"]).toContain(
        i.license,
      );
      expect(["APROVADA", "REQUER_ATRIBUICAO"]).toContain(i.status);
      expect(i.author.length).toBeGreaterThan(0);
      expect(i.licenseUrl).toMatch(/^https:\/\/creativecommons.org\//);
      expect(existsSync(`public${i.src}`)).toBe(true);
      expect(
        createHash("sha256")
          .update(readFileSync(`public${i.src}`))
          .digest("hex"),
      ).toBe(i.sha256);
      expect(
        pages.find((p) => p.imageinfo[0].descriptionurl === i.sourceUrl)!
          .imageinfo[0].extmetadata.LicenseShortName.value,
      ).toBe(i.license);
      expect(csv).toContain(i.sourceUrl);
    }
    expect(csv).toContain("REQUER_AUTORIZACAO");
    expect(csv).toContain("LICENCA_INDEFINIDA");
    for (const p of guide)
      expect(guideImages.some((i) => i.profile === p.id)).toBe(true);
  });
});

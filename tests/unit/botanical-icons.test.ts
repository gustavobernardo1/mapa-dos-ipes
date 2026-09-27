import { describe, it, expect } from "vitest";
import {
  clusterPalette,
  clusterSize,
  treePalette,
} from "../../src/lib/botanical-icons";

describe("botanical map classification", () => {
  it("keeps the combined pink/purple classification when the source does not distinguish them", () => {
    expect(treePalette({ cor_principal: "ROSA_ROXO" })).toBe("rosa_roxo");
    expect(
      treePalette({
        cor_principal: "ROSA_ROXO",
        descricao_municipal: "Ipê rosa / roxo",
      }),
    ).toBe("rosa_roxo");
    expect(
      treePalette({
        cor_principal: "ROSA_ROXO",
        descricao_municipal: "IPÊ ROXO",
      }),
    ).toBe("roxo");
    expect(
      treePalette({
        cor_principal: "ROSA_ROXO",
        descricao_municipal: "IPÊ ROSA",
      }),
    ).toBe("rosa");
    expect(
      treePalette({ cor_principal: "NAO_SEI", descricao_municipal: "Caraíba" }),
    ).toBe("verde");
  });
  it("reflects color filters and increases the illustrated canopy at density thresholds", () => {
    expect(clusterPalette()).toBe("multicolorido");
    expect(clusterPalette("AMARELO")).toBe("amarelo");
    expect(clusterPalette("ROSA_ROXO")).toBe("rosa_roxo");
    expect(clusterPalette("BRANCO")).toBe("branco");
    expect([2, 19, 20, 99, 100, 1914].map(clusterSize)).toEqual([
      "pequeno",
      "pequeno",
      "medio",
      "medio",
      "grande",
      "grande",
    ]);
  });
});

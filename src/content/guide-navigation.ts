import { guide, guideImages, type GuideProfile, type FactKey } from "./guide";
export const guideSlugs: Record<string, string> = {
  amarelo: "ipe-amarelo",
  rosa: "ipe-rosa",
  roxo: "ipe-roxo",
  branco: "ipe-branco",
  sibipiruna: "sibipiruna",
  "chuva-de-ouro": "chuva-de-ouro",
  "ipe-de-jardim": "ipe-de-jardim",
};
export const profileHref = (id: string) => `/guia/${guideSlugs[id]}`;
export const treePhoto = (id: string) =>
  guideImages.find((i) => i.profile === id && i.part === "arvore");
export const cardClue = (p: GuideProfile) =>
  p.facts[
    p.id === "chuva-de-ouro"
      ? "arrangement"
      : p.id === "roxo"
        ? "flower"
        : "leaves"
  ];
export const quickKeys: FactKey[] = ["flower", "leaves", "fruit"];
export const similarProfiles = (id: string) => {
  const ids =
    id === "amarelo"
      ? ["sibipiruna", "chuva-de-ouro", "ipe-de-jardim"]
      : id === "rosa"
        ? ["roxo"]
        : id === "roxo"
          ? ["rosa"]
          : id === "branco"
            ? []
            : ["amarelo"];
  return ids.map((x) => guide.find((p) => p.id === x)!);
};

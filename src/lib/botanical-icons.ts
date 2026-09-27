import type { Color, Tree } from "./domain";

export const botanicalPalettes = {
  amarelo: ["#efb619", "#ffe49a", "#936213"],
  rosa: ["#df6098", "#ffc6df", "#803454"],
  roxo: ["#9954c5", "#dfbcf4", "#59316f"],
  rosa_roxo: ["#bd65b1", "#f0c5e6", "#714078"],
  branco: ["#fff9e9", "#fffdf5", "#244e3a"],
  verde: ["#789471", "#bed0a6", "#45664e"],
  multicolorido: ["#789471", "#c8d8b6", "#45664e"],
} as const;
export type BotanicalPalette = keyof typeof botanicalPalettes;

export function clusterPalette(color?: Color): BotanicalPalette {
  return color === "AMARELO"
    ? "amarelo"
    : color === "ROSA_ROXO"
      ? "rosa_roxo"
      : color === "BRANCO"
        ? "branco"
        : "multicolorido";
}

export function treePalette(
  tree: Pick<Tree, "cor_principal" | "descricao_municipal">,
): BotanicalPalette {
  if (tree.cor_principal !== "ROSA_ROXO") {
    return tree.cor_principal === "AMARELO"
      ? "amarelo"
      : tree.cor_principal === "BRANCO"
        ? "branco"
        : "verde";
  }
  const description =
    tree.descricao_municipal
      ?.normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase() || "";
  const purple = /\broxo\b/.test(description);
  const pink = /\brosa\b/.test(description);
  if (purple && !pink) return "roxo";
  if (pink && !purple) return "rosa";
  return "rosa_roxo";
}

export function clusterSize(count: number) {
  return count < 20 ? "pequeno" : count < 100 ? "medio" : "grande";
}

// Self-contained vector art: no fonts, embedded bitmaps, external filters or scripts.
// The same artwork is used in DOM clusters and in the MapLibre image atlas.
export function botanicalSvg(
  palette: BotanicalPalette,
  cluster = false,
  municipal = false,
): string {
  const [base, light, edge] = botanicalPalettes[palette];
  if (cluster) {
    // Three staggered crowns form a small grove, leaving quiet space for the count.
    const colors =
      palette === "multicolorido"
        ? ["#e6bb4e", "#94ad83", "#d99abb"]
        : [light, base, light];
    const crowns = [
      [27, 38, 21],
      [66, 37, 22],
      [47, 26, 23],
    ];
    return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><ellipse cx="48" cy="81" rx="31" ry="3" fill="#244e3a" opacity=".1"/><path d="M27 73V47m39 26V46M47 78V37" fill="none" stroke="#fffaf0" stroke-width="7" stroke-linecap="round"/><path d="M27 73V47m39 26V46M47 78V37" fill="none" stroke="#80694b" stroke-width="3" stroke-linecap="round"/>${crowns.map(([x, y, r], i) => `<path d="M${x - r} ${y + 5}C${x - r - 5} ${y - 8} ${x - r + 7} ${y - r} ${x - 5} ${y - r + 4}C${x + 7} ${y - r - 8} ${x + r + 2} ${y - r + 5} ${x + r - 3} ${y - 3}C${x + r + 9} ${y + 10} ${x + r - 4} ${y + r} ${x + 4} ${y + r - 3}C${x - 7} ${y + r + 6} ${x - r - 10} ${y + r - 3} ${x - r} ${y + 5}Z" fill="${colors[i]}" stroke="#fffaf0" stroke-width="4"/><path d="M${x - r} ${y + 5}C${x - r - 5} ${y - 8} ${x - r + 7} ${y - r} ${x - 5} ${y - r + 4}C${x + 7} ${y - r - 8} ${x + r + 2} ${y - r + 5} ${x + r - 3} ${y - 3}C${x + r + 9} ${y + 10} ${x + r - 4} ${y + r} ${x + 4} ${y + r - 3}C${x - 7} ${y + r + 6} ${x - r - 10} ${y + r - 3} ${x - r} ${y + 5}Z" fill="none" stroke="${edge}" stroke-width="1.5" stroke-opacity=".8"/>`).join("")}</svg>`;
  }
  const petals = [
    [25, 32],
    [34, 20],
    [49, 16],
    [65, 22],
    [75, 35],
    [67, 49],
    [25, 49],
    [38, 55],
    [56, 55],
  ];
  const flowers = petals
    .map(([x, y], i) => {
      const fill =
        palette === "multicolorido"
          ? ["#e9c459", "#e8a9c4", "#c4a7d9", "#f8f3df"][i % 4]
          : i % 2
            ? light
            : base;
      return `<path d="M${x},${y - 4}c3,-3 6,0 4,3c4,0 4,5 0,5c1,4 -4,5 -5,1c-4,1 -5,-4 -1,-5c-3,-2 -1,-5 2,-4Z" fill="${fill}" stroke="${edge}" stroke-opacity=".2" stroke-width=".7"/>`;
    })
    .join("");
  const art = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><ellipse cx="49" cy="87" rx="18" ry="3" fill="#214b3c" opacity=".12"/><path d="M49 85V49m0 20L33 53m16 8L63 46" fill="none" stroke="#fffaf0" stroke-width="8" stroke-linecap="round"/><path d="M49 85V49m0 20L33 53m16 8L63 46" fill="none" stroke="#80694b" stroke-width="4" stroke-linecap="round"/><path d="M16 46C8 38 15 23 27 23C26 12 39 7 47 13C55 4 70 12 69 22C84 21 90 35 81 45C89 57 75 67 64 62C59 73 44 73 38 64C24 72 10 60 16 46Z" fill="${base}" stroke="#fffaf0" stroke-width="4"/><path d="M16 46C8 38 15 23 27 23C26 12 39 7 47 13C55 4 70 12 69 22C84 21 90 35 81 45C89 57 75 67 64 62C59 73 44 73 38 64C24 72 10 60 16 46Z" fill="none" stroke="${municipal ? "#647568" : edge}" stroke-width="1.4" ${municipal ? 'stroke-dasharray="3 2"' : ""}/><path d="M21 30C20 20 36 16 41 24C47 13 65 19 64 29C76 27 83 37 77 43C65 35 62 43 53 35C41 43 31 29 21 38Z" fill="${light}" opacity=".4"/>${flowers}<path d="M42 78C31 78 31 68 34 69C40 68 44 73 42 78Zm13 0C64 77 66 67 62 69C56 69 52 74 55 78Z" fill="#6e895c" stroke="#fffaf0" stroke-width="1"/>${cluster ? '<path d="M32 40Q48 29 65 40Q70 45 65 50Q49 60 33 50Q27 45 32 40Z" fill="#fffaf0" fill-opacity=".95" stroke="#214b3c" stroke-opacity=".13"/>' : ""}</svg>`;
  // Full-opacity canopy; a tiny hollow seal denotes municipal provenance,
  // and a filled seal with check denotes community verification.
  const seal = cluster
    ? ""
    : municipal
      ? '<circle cx="76" cy="64" r="7" fill="#fffaf0" stroke="#244e3a" stroke-width="1.8"/><path d="M73 67Q71 61 79 61Q79 67 73 67Zm0 0 4-4" fill="none" stroke="#244e3a" stroke-width="1.2"/>'
      : '<circle cx="76" cy="64" r="7" fill="#244e3a" stroke="#fffaf0" stroke-width="1.5"/><path d="m73 64 2 2 4-4" fill="none" stroke="#fffaf0" stroke-width="1.5" stroke-linecap="round"/>';
  return art
    .replace('stroke="#647568"', 'stroke="' + edge + '"')
    .replace(
      'stroke-width="1.4"',
      'stroke-width="' + (palette === "branco" ? 2.8 : 1.8) + '"',
    )
    .replace('stroke-dasharray="3 2"', "")
    .replace("</svg>", seal + "</svg>");
}

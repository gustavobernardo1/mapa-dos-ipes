import { readFile, writeFile, mkdir } from "node:fs/promises";
import ts from "typescript";

const source = await readFile("src/lib/botanical-icons.ts", "utf8");
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { botanicalPalettes, botanicalSvg } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const palettes = ["amarelo", "rosa", "roxo", "branco"];
const backgrounds = [
  ["Fundo", "#f3efe3"],
  ["Parques", "#c8ddb8"],
  ["Água", "#9ecfdf"],
];
const luminance = (color) => {
  const values = color
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
};
const contrast = (a, b) => {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return Number(((values[0] + 0.05) / (values[1] + 0.05)).toFixed(2));
};
const blend = (foreground, background, opacity) => {
  const channels = [1, 3, 5].map((index) =>
    Math.round(
      parseInt(foreground.slice(index, index + 2), 16) * opacity +
        parseInt(background.slice(index, index + 2), 16) * (1 - opacity),
    )
      .toString(16)
      .padStart(2, "0"),
  );
  return `#${channels.join("")}`;
};
const checks = backgrounds.map(([background, color]) => ({
  background,
  color,
  outlineContrast: Object.fromEntries(
    palettes.map((palette) => [
      palette,
      contrast(botanicalPalettes[palette][2], color),
    ]),
  ),
  municipalOutlineContrast: Object.fromEntries(
    palettes.map((palette) => [
      palette,
      contrast(blend(botanicalPalettes[palette][2], color, 0.65), color),
    ]),
  ),
}));
const art = backgrounds
  .map(
    ([name, color], row) =>
      `<rect x="0" y="${50 + row * 100}" width="660" height="100" fill="${color}"/><text x="16" y="${105 + row * 100}" fill="#244e3a" font-family="Arial" font-size="13">${name}</text>${palettes.map((palette, column) => `<g transform="translate(${130 + column * 130} ${66 + row * 100})">${botanicalSvg(palette, false, true).replace('width="96" height="96"', 'width="32" height="32" opacity="0.65"')}${botanicalSvg(palette, false, false).replace('width="96" height="96"', 'x="42" width="32" height="32"')}<text y="58" fill="#244e3a" font-family="Arial" font-size="11">${checks[row].municipalOutlineContrast[palette]} / ${checks[row].outlineContrast[palette]}:1</text><text y="73" fill="#244e3a" font-family="Arial" font-size="10">municipal / confirmado</text></g>`).join("")}`,
  )
  .join("");
await mkdir("docs/validacao", { recursive: true });
await writeFile(
  "docs/validacao/contraste-marcadores.svg",
  `<svg xmlns="http://www.w3.org/2000/svg" width="660" height="350" viewBox="0 0 660 350"><rect width="660" height="350" fill="#fffdfa"/><text x="16" y="30" font-family="Arial" font-size="15" fill="#244e3a">Municipal (opacidade 0,65) / confirmação (1) — ambos 32px</text>${art}</svg>`,
);
await writeFile(
  "docs/validacao/contraste-marcadores.json",
  JSON.stringify(
    {
      note: "Contorno contra cores planas do mapa: confirmação em opacidade 1; municipal composto em 0,65. Não certifica a acessibilidade do mapa inteiro.",
      checks,
    },
    null,
    2,
  ) + "\n",
);
console.log(JSON.stringify(checks));

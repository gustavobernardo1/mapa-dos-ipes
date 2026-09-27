import { readFile, mkdir, writeFile } from "node:fs/promises";
import ts from "typescript";

// Keep downloadable SVG assets identical to the artwork used by the map.
const source = await readFile(
  new URL("../src/lib/botanical-icons.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { botanicalPalettes, botanicalSvg } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`
);
const directory = new URL("../public/map-icons/", import.meta.url);
await mkdir(directory, { recursive: true });
for (const palette of Object.keys(botanicalPalettes)) {
  for (const municipal of [false, true]) {
    await writeFile(
      new URL(
        `arvore-${palette}${municipal ? "-municipal" : ""}.svg`,
        directory,
      ),
      botanicalSvg(palette, false, municipal),
    );
  }
  await writeFile(
    new URL(`cluster-${palette}.svg`, directory),
    botanicalSvg(palette, true),
  );
}
for (const size of ["pequeno", "medio", "grande"]) {
  const dimension = { pequeno: 48, medio: 60, grande: 72 }[size];
  await writeFile(
    new URL(`cluster-${size}.svg`, directory),
    botanicalSvg("multicolorido", true).replace(
      'width="96" height="96"',
      `width="${dimension}" height="${dimension}"`,
    ),
  );
}
console.log("Ícones botânicos gerados em public/map-icons.");

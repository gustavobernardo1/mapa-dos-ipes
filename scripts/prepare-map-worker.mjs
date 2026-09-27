import { mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const directory = path.dirname(
  fileURLToPath(import.meta.resolve("maplibre-gl")),
);
await mkdir("public/vendor/maplibre", { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"])
  await copyFile(
    path.join(directory, file),
    path.join("public/vendor/maplibre", file),
  );
console.log("Worker MapLibre e módulo compartilhado preparados.");

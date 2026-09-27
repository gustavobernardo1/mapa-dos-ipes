import { rm, mkdir } from "node:fs/promises";
import path from "node:path";
export default async function setup() {
  const root = path.resolve(process.cwd()),
    target = path.resolve(root, ".test-data", "e2e");
  if (
    !target.startsWith(root + path.sep) ||
    path.relative(root, target) !== path.join(".test-data", "e2e")
  )
    throw new Error("Diretório de teste inseguro.");
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
}

import { readFile } from "node:fs/promises";
const filename = process.argv[2];
if (!filename) {
  console.error("Uso: node scripts/importacao/validar.mjs arquivo.csv");
  process.exit(1);
}
const text = await readFile(filename, "utf8");
// Explicitly small interchange format; quoted delimiters require an approved importer.
const lines = text
    .trim()
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/),
  header = lines.shift().split(",");
const required = [
  "id_origem",
  "latitude",
  "longitude",
  "nome_popular",
  "data_levantamento",
];
if (required.some((k) => !header.includes(k))) {
  console.error(`Cabeçalhos obrigatórios: ${required.join(",")}`);
  process.exit(1);
}
const failures = [],
  ids = new Set();
lines.forEach((line, i) => {
  if (line.includes('"')) {
    failures.push(`Linha ${i + 2}: CSV com aspas requer parser dedicado.`);
    return;
  }
  const fields = line.split(","),
    row = Object.fromEntries(header.map((k, j) => [k, fields[j] || ""]));
  if (fields.length !== header.length)
    failures.push(`Linha ${i + 2}: quantidade de campos inválida.`);
  const lat = Number(row.latitude),
    lng = Number(row.longitude);
  if (
    !row.latitude ||
    !row.longitude ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    Math.abs(lat) > 90 ||
    Math.abs(lng) > 180
  )
    failures.push(`Linha ${i + 2}: coordenadas inválidas.`);
  if (!row.id_origem || ids.has(row.id_origem))
    failures.push(`Linha ${i + 2}: identificador ausente ou duplicado.`);
  ids.add(row.id_origem);
  const d = new Date(row.data_levantamento);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(row.data_levantamento) ||
    !Number.isFinite(d.getTime()) ||
    d.toISOString().slice(0, 10) !== row.data_levantamento
  )
    failures.push(`Linha ${i + 2}: data inválida.`);
});
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`${lines.length} linhas válidas. Nenhum dado foi importado.`);

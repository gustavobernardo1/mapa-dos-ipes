import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const flower = `<g transform="translate(256 230)"><g fill="#e7bd42"><ellipse rx="40" ry="81" cy="-55"/><ellipse rx="40" ry="81" cy="-55" transform="rotate(72)"/><ellipse rx="40" ry="81" cy="-55" transform="rotate(144)"/><ellipse rx="40" ry="81" cy="-55" transform="rotate(216)"/><ellipse rx="40" ry="81" cy="-55" transform="rotate(288)"/></g><circle r="27" fill="#866926"/></g><path d="M257 300Q264 370 238 416" stroke="#e9edd9" fill="none" stroke-width="12"/><path d="M259 362Q300 313 355 335Q323 389 259 362" fill="#9cb486"/>`;
await mkdir("public", { recursive: true });
for (const size of [192, 512]) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="#214b3c"/>${flower}</svg>`;
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`);
}
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><rect width="1200" height="630" fill="#f8f9f5"/><circle cx="980" cy="300" r="225" fill="#e8eedf"/><g transform="translate(743 53) scale(.9)"><rect width="512" height="512" rx="100" fill="#214b3c"/>${flower}</g><text x="70" y="170" fill="#718268" font-family="Arial" font-size="18" letter-spacing="5">GOIÂNIA · CIÊNCIA CIDADÃ</text><text x="66" y="272" fill="#214b3c" font-family="Georgia" font-size="78">Mapa dos Ipês</text><text x="70" y="345" fill="#667562" font-family="Arial" font-size="25">Descubra, fotografe e ajude a mapear</text><text x="70" y="385" fill="#667562" font-family="Arial" font-size="25">a florada dos ipês de Goiânia.</text><rect x="70" y="455" width="240" height="52" rx="26" fill="#e9eedf"/><text x="98" y="488" fill="#214b3c" font-family="Arial" font-size="18">Cada registro conta.</text></svg>`;
await sharp(Buffer.from(og)).png().toFile("public/og.png");
const png = await readFile("public/icon-192.png");
const header = Buffer.alloc(22);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(1, 4);
header[6] = 192;
header[7] = 192;
header.writeUInt16LE(1, 10);
header.writeUInt16LE(32, 12);
header.writeUInt32LE(png.length, 14);
header.writeUInt32LE(22, 18);
await writeFile("public/favicon.ico", Buffer.concat([header, png]));
console.log("Ícones provisórios, favicon e OpenGraph gerados.");

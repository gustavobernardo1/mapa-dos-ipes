import sharp from "sharp";
import { readFile } from "node:fs/promises";
const items = JSON.parse(
  await readFile("src/content/guide-images.json", "utf8"),
);
const layers = [];
for (let i = 0; i < items.length; i++) {
  const left = (i % 4) * 280,
    top = Math.floor(i / 4) * 230;
  layers.push({
    input: await sharp(`public${items[i].src}`)
      .resize(280, 195, { fit: "contain", background: "#ffffff" })
      .extend({ bottom: 35, background: "#ffffff" })
      .png()
      .toBuffer(),
    left,
    top,
  });
  layers.push({
    input: Buffer.from(
      `<svg width="280" height="35"><text x="8" y="23" font-size="14">${items[i].id}</text></svg>`,
    ),
    left,
    top: top + 195,
  });
}
await sharp({
  create: {
    width: 1120,
    height: Math.ceil(items.length / 4) * 230,
    channels: 4,
    background: "#ffffff",
  },
})
  .composite(layers)
  .png()
  .toFile("research/guia/contato-imagens.png");

/**
 * process-avatars.mjs: one-shot processing of the generated avatar set.
 * Reads the raw Gemini PNGs from avatar-candidates/ (gitignored), resizes to
 * 512px squares, and writes optimized webp files to public/assets/avatar/.
 * The neutral frame is also written as PNG for the OG image (satori/next-og
 * does not support webp). Run: node scripts/process-avatars.mjs
 */
import { createRequire } from "node:module";
import { mkdir } from "node:fs/promises";

const require = createRequire(import.meta.url);
const sharp = require("../node_modules/.pnpm/sharp@0.34.5/node_modules/sharp");

const SRC = new URL("../avatar-candidates/", import.meta.url).pathname;
const OUT = new URL("../public/assets/avatar/", import.meta.url).pathname;

const MAP = {
  "Gemini_Generated_Image_cio0j9cio0j9cio0.png": "neutral",
  "Gemini_Generated_Image_wadmc4wadmc4wadm.png": "thinking",
  "Gemini_Generated_Image_aqvwqfaqvwqfaqvw.png": "talking",
  "Gemini_Generated_Image_n8tvi8n8tvi8n8tv.png": "listening",
  "Gemini_Generated_Image_9b6e2k9b6e2k9b6e.png": "dozing",
  "Gemini_Generated_Image_7drmnx7drmnx7drm.png": "oops",
};

await mkdir(OUT, { recursive: true });

for (const [file, name] of Object.entries(MAP)) {
  const src = SRC + file;
  await sharp(src)
    .resize(512, 512, { fit: "cover" })
    .webp({ quality: 82 })
    .toFile(`${OUT}${name}.webp`);
  const { size } = await import("node:fs").then((fs) =>
    fs.promises.stat(`${OUT}${name}.webp`)
  );
  console.log(`${name}.webp  ${(size / 1024).toFixed(0)}KB`);
}

// PNG copy of neutral for the OG card renderer.
await sharp(SRC + "Gemini_Generated_Image_cio0j9cio0j9cio0.png")
  .resize(512, 512, { fit: "cover" })
  .png({ compressionLevel: 9 })
  .toFile(`${OUT}neutral-og.png`);
console.log("neutral-og.png written");

/**
 * T071 (US6): generate public/og-en.png and public/og-ar.png (1200×630) from
 * the brand mark SVG + app name + tagline ONLY — no app imagery or screenshots.
 *
 * Usage: node scripts/generate-og.mjs   (then commit the two PNG outputs)
 */
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const W = 1200;
const H = 630;

const mark = readFileSync(join(root, "public", "taif-mark.svg"), "utf8");

const scenes = [
  {
    out: "og-en.png",
    name: "TAIF",
    // Verbatim tagline from src/content/en.ts hero.
    tagline: "Free, local-first media tools",
    font: "Manrope, DejaVu Sans, sans-serif",
  },
  {
    out: "og-ar.png",
    name: "TAIF · طَيْف",
    // Verbatim tagline from src/content/ar.ts hero.
    tagline: "أدوات وسائط حرة تعمل على جهازك",
    font: "Noto Sans Arabic, DejaVu Sans, sans-serif",
  },
];

/** Escape text for XML. */
const esc = (s) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

for (const scene of scenes) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="spectrum" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="hsl(256 80% 68%)"/>
      <stop offset="50%" stop-color="hsl(219 90% 62%)"/>
      <stop offset="100%" stop-color="hsl(187 80% 32%)"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="hsl(221 38% 14%)"/>
  <rect width="${W}" height="${H}" fill="url(#spectrum)" opacity="0.18"/>
  <image href="data:image/svg+xml;base64,${Buffer.from(mark).toString("base64")}" x="${W / 2 - 90}" y="80" width="180" height="180"/>
  <text x="${W / 2}" y="440" text-anchor="middle" font-family="${esc(scene.font)}" font-size="96" font-weight="800" fill="hsl(220 38% 97%)">${esc(scene.name)}</text>
  <text x="${W / 2}" y="530" text-anchor="middle" font-family="${esc(scene.font)}" font-size="40" fill="hsl(219 18% 71%)">${esc(scene.tagline)}</text>
</svg>`;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 9 })
    .toFile(join(root, "public", scene.out));
  console.log(`wrote public/${scene.out} (${W}×${H})`);
}

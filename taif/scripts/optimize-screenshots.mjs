#!/usr/bin/env node
/**
 * Generate optimized WebP versions of the genuine showcase captures.
 *
 * The PNG files in public/screenshots/ remain the untouched source captures;
 * this script writes a sibling .webp at the SAME intrinsic dimensions (no
 * resizing) and the manifest (src/content/screenshots.ts) points at it.
 *
 * Idempotent: an up-to-date .webp (mtime >= source PNG) is skipped unless
 * `--force` is passed. Run with `npm run optimize:images`.
 */
import { readFile, rename, stat, unlink } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = join(root, "src/content/screenshots.ts");
const publicDir = join(root, "public");
const force = process.argv.includes("--force");

const manifest = await readFile(manifestPath, "utf8");
const files = [...manifest.matchAll(/file:\s*["'](\/screenshots\/[^"']+\.png)["']/g)].map(
  (match) => match[1],
);
const uniqueFiles = [...new Set(files)];

if (uniqueFiles.length === 0) {
  console.error("[optimize:images] No PNG files found in src/content/screenshots.ts");
  process.exit(1);
}

let converted = 0;
let skipped = 0;
let sourceBytes = 0;
let outputBytes = 0;

for (const file of uniqueFiles) {
  const sourcePath = join(publicDir, file);
  const outputPath = sourcePath.replace(/\.png$/i, ".webp");

  let sourceStat;
  try {
    sourceStat = await stat(sourcePath);
  } catch {
    console.error(`[optimize:images] Missing source capture: ${file}`);
    process.exit(1);
  }

  if (!force) {
    try {
      const outputStat = await stat(outputPath);
      if (outputStat.mtimeMs >= sourceStat.mtimeMs) {
        const meta = await sharp(outputPath).metadata();
        sourceBytes += sourceStat.size;
        outputBytes += outputStat.size;
        skipped += 1;
        console.log(
          `[optimize:images] up to date ${file.replace(/\.png$/, ".webp")} (${meta.width}×${meta.height})`,
        );
        continue;
      }
    } catch {
      // No existing output: convert below.
    }
  }

  const tempPath = `${outputPath}.tmp`;
  const info = await sharp(sourcePath)
    .webp({ quality: 82, effort: 6 })
    .toFile(tempPath);
  await rename(tempPath, outputPath);

  sourceBytes += sourceStat.size;
  outputBytes += (await stat(outputPath)).size;
  converted += 1;
  console.log(
    `[optimize:images] ${file.replace(/\.png$/, ".webp")} ${info.width}×${info.height} ` +
      `${(sourceStat.size / 1024).toFixed(0)} KB → ${(info.size / 1024).toFixed(0)} KB`,
  );
}

// Best-effort cleanup if a temp file was left behind by an interrupted run.
await Promise.all(
  uniqueFiles.map(async (file) => {
    const temp = join(publicDir, file.replace(/\.png$/i, ".webp.tmp"));
    try {
      await unlink(temp);
    } catch {
      // Nothing to clean up.
    }
  }),
);

const pct = sourceBytes > 0 ? ((1 - outputBytes / sourceBytes) * 100).toFixed(1) : "0";
console.log(
  `[optimize:images] done: ${converted} converted, ${skipped} skipped; ` +
    `${(sourceBytes / 1024).toFixed(0)} KB PNG → ${(outputBytes / 1024).toFixed(0)} KB WebP ` +
    `(${pct}% smaller)`,
);

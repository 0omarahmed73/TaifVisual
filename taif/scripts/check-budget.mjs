/**
 * T099: fail when dist/ exceeds the performance budget documented in README.md.
 * Sizes are raw (uncompressed) bytes of build output; LCP/CLS targets are
 * measured manually with Lighthouse (see specs/001-taif-website/checklists/launch.md).
 *
 * run: npm run verify:budget   (after npm run build)
 */
import { readdir, readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, extname } from "node:path";

const dist = join(fileURLToPath(new URL("..", import.meta.url)), "dist");
const KB = 1024;
const budget = { html: 100 * KB, js: 260 * KB, css: 60 * KB, image: 60 * KB };

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const sizes = { js: 0, css: 0 };
const failures = [];
const referenced = new Set();
for await (const file of walk(dist)) {
  const ext = extname(file);
  const size = (await stat(file)).size;
  if (ext === ".js") sizes.js += size;
  if (ext === ".css") sizes.css += size;
  if (ext === ".html") {
    if (size > budget.html) failures.push(`${file}: ${size} B > html budget ${budget.html}`);
    for (const m of (await readFile(file, "utf8")).matchAll(/(?:src|href|content)="(\/[^"]+\.(?:webp|png|avif|jpe?g))"/g)) referenced.add(m[1]);
  }
}
for (const key of ["js", "css"]) {
  if (sizes[key] > budget[key]) failures.push(`total ${key}: ${sizes[key]} B > budget ${budget[key]}`);
}
for (const ref of referenced) {
  const size = (await stat(join(dist, ref))).size;
  if (size > budget.image) failures.push(`${ref}: ${size} B > image budget ${budget.image}`);
}
console.log(`budget: js ${sizes.js} B, css ${sizes.css} B, ${referenced.size} referenced image(s) checked`);
if (failures.length) {
  console.error("Budget exceeded:\n" + failures.join("\n"));
  process.exit(1);
}
console.log("budget: OK");

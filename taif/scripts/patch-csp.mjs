/**
 * T074: keep vercel.json's CSP in sync with the actual build output.
 *
 * Astro always emits exactly two small inline scripts that cannot be moved to
 * external files (the runtime loader bootstrap and the astro-island custom
 * element definition). Rather than loosening `script-src` to 'unsafe-inline',
 * this postbuild step computes their sha256 hashes and appends only those
 * hashes to the `script-src` directive in vercel.json. Hashes are
 * content-derived and deterministic — they only change when the build output
 * (or the Astro version) changes, which is exactly when re-pinning is honest.
 *
 * run: node scripts/patch-csp.mjs   (wired as the `postbuild` npm script)
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));

function inlineScriptHashes(html) {
  const hashes = [];
  const re = /<script([^\n]*?)>([\s\S]*?)<\/script>/g;
  let match;
  while ((match = re.exec(html))) {
    const attrs = match[1];
    const body = match[2];
    if (/src=/.test(attrs)) continue; // external script: governed by 'self'
    // type/ld+json is data, not executed code: CSP does not block it.
    if (/type=("application\/ld\+json"|'application\/ld\+json')/.test(attrs)) continue;
    if (!body.trim()) continue;
    hashes.push(`'sha256-${createHash("sha256").update(body).digest("base64")}'`);
  }
  return hashes;
}

async function* htmlFiles(dir) {
  const { readdir } = await import("node:fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(full);
    else if (entry.name.endsWith(".html")) yield full;
  }
}

const hashes = new Set();
for await (const file of htmlFiles(join(root, "dist"))) {
  for (const hash of inlineScriptHashes(await readFile(file, "utf8"))) hashes.add(hash);
}

const sorted = [...hashes].sort();
const vercelPath = join(root, "vercel.json");
const config = JSON.parse(await readFile(vercelPath, "utf8"));
const cspHeader = config.headers[0].headers.find((h) => h.key === "Content-Security-Policy");
if (!cspHeader) throw new Error("Content-Security-Policy header missing from vercel.json");

let value = cspHeader.value;
if (sorted.length > 0) {
  // Replace the whole hash list (not only the hash-less form): Astro inlines
  // small self-contained scripts, so a new page script legitimately adds a hash
  // and the postbuild step must re-pin the full set every time.
  value = value.replace(
    /script-src 'self'(?: 'sha256-[^']+')*;/,
    `script-src 'self' ${sorted.join(" ")};`,
  );
} else {
  value = value.replace(
    /script-src 'self'(?: 'sha256-[^']+')+;/,
    "script-src 'self';",
  );
}
if (value !== cspHeader.value) {
  cspHeader.value = value;
  await writeFile(vercelPath, `${JSON.stringify(config, null, 2)}\n`);
  console.log(`patch-csp: script-src updated with ${sorted.length} build hash(es)`);
} else {
  console.log("patch-csp: vercel.json CSP already matches the build output");
}

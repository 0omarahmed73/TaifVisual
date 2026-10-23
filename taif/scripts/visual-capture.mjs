/**
 * Phase 9 (T072-style manual render evidence): real Chromium full-page
 * screenshots of / and /ar at 375/768/1280 in light and dark mode.
 * run: node scripts/visual-capture.mjs  (after npm run build)
 * output: specs/001-taif-website/checklists/visual/
 */
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const root = fileURLToPath(new URL("..", import.meta.url));
const out = join(root, "specs/001-taif-website/checklists/visual");
await mkdir(out, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};
const server = createServer(async (req, res) => {
  let u = decodeURIComponent(req.url.split("?")[0]);
  if (u.endsWith("/")) u += "index.html";
  try {
    const body = await readFile(join(root, "dist", u.replace(/^\/+/, "")));
    res.setHeader("Content-Type", MIME[extnameFile(u)] ?? "application/octet-stream");
    res.end(body);
  } catch {
    res.statusCode = 404;
    res.end("nf");
  }
  function extnameFile(path) {
    const index = path.lastIndexOf(".");
    return index >= 0 ? path.slice(index) : "";
  }
});
await new Promise((resolve) => server.listen(4546, resolve));

const browser = await chromium.launch();
for (const locale of ["en", "ar"]) {
  for (const width of [375, 768, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 812 } });
    await page.goto(locale === "ar" ? "http://localhost:4546/ar/" : "http://localhost:4546/", { waitUntil: "networkidle" });
    await page.screenshot({ path: join(out, `${locale}-${width}-light.png`), fullPage: true });
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    });
    await page.waitForTimeout(200);
    await page.screenshot({ path: join(out, `${locale}-${width}-dark.png`), fullPage: true });
    console.log(`captured ${locale}-${width} light+dark`);
    await page.close();
  }
}

// RTL sanity: dir attribute of the Arabic page must be rtl.
const page = await browser.newPage();
await page.goto("http://localhost:4546/ar/", { waitUntil: "networkidle" });
const dir = await page.locator("html").getAttribute("dir");
console.log(`/ar <html dir> = ${dir}`);
await browser.close();
await new Promise((resolve) => server.close(resolve));
process.exit(dir === "rtl" ? 0 : 1);

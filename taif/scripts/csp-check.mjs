/**
 * T074 verification:exercise serve `dist/` with the exact security headers
 * from vercel.json and drive real Chromium against it via Playwright,
 * asserting that scripts, CSS, images, fonts and a (mocked) api.github.com
 * fetch all load with ZERO CSP console errors.
 *
 * run: node scripts/csp-check.mjs   (from taif/, after npm run build)
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const root = join(fileURLToPath(new URL("..", import.meta.url)), "dist");

// Pull the CSP + security headers straight from vercel.json so this check
// can never drift from the deployed configuration.
const config = JSON.parse(await readFile(new URL("../vercel.json", import.meta.url), "utf8"));
const headersFor = config.headers[0].headers.reduce((acc, h) => {
  acc[h.key] = h.value;
  return acc;
}, {});
console.log("Headers from vercel.json:", headersFor);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".webmanifest": "application/manifest+json",
  ".xml": "application/xml",
  ".txt": "text/plain",
};

const server = createServer(async (req, res) => {
  for (const [key, value] of Object.entries(headersFor)) res.setHeader(key, value);
  const url = new URL(req.url, "http://localhost:4545");
  let path = decodeURIComponent(url.pathname);
  if (path.endsWith("/")) path += "index.html";
  let file = join(root, path.replace(/^\/+/, ""));
  try {
    const body = await readFile(file);
    res.setHeader("Content-Type", MIME[extname(file)] ?? "application/octet-stream");
    res.setHeader("Content-Length", String(body.length)); // Vercel behaves the same (no chunked encoding)
    res.end(body);
  } catch {
    const body = await readFile(join(root, "404.html"));
    res.statusCode = 404;
    res.setHeader("Content-Type", MIME[".html"]);
    res.end(body);
  }
});
await new Promise((resolve) => server.listen(4545, resolve));

const browser = await chromium.launch();
const page = await browser.newPage();

const cspViolations = [];
const failedRequests = [];
page.on("console", (msg) => {
  if (msg.type() === "error" && /Content Security Policy/i.test(msg.text())) {
    cspViolations.push(msg.text());
  }
});
page.on("console", (msg) => {
  if (msg.type() === "error" && /net::ERR|Failed/i.test(msg.text())) failedRequests.push(msg.text());
});
page.on("response", (response) => {
  if (/screenshot/.test(response.url()) || response.status() >= 400) {
    console.log(`[resp] ${response.status()} ${response.url()} ct=${response.headers()["content-type"]}`);
  }
});

await page.goto("http://localhost:4545/", { waitUntil: "networkidle" });
await page.route("https://api.github.com/**", (route) =>
  route.fulfill({ contentType: "application/json", body: "[]" }),
);
const decoded = await page.evaluate(() => {
  window.scrollTo(0, document.body.scrollHeight / 2);
  window.scrollTo(0, document.body.scrollHeight);
  return "scrolled";
});
console.log("Scroll:", decoded);
let imagesComplete = true;
try {
  await page.waitForFunction(
    () =>
      [...document.querySelectorAll("img")].filter((img) => img.complete).length ===
      document.querySelectorAll("img").length,
    { timeout: 10000 },
  );
} catch {
  imagesComplete = false;
  console.error("images did not all reach `complete` within 10s");
}
await page.waitForTimeout(500);
const results = await page.evaluate(async () => {
  // connect-src must allow api.github.com (empty release list = honest no-release state)
  const api = await fetch("https://api.github.com/repos/0omarahmed73/TaifVisual/releases");
  const stylesheet = getComputedStyle(document.body).backgroundColor;
  const logo = document.querySelector<HTMLImageElement>("header img");
  const screenshot = document.querySelector<HTMLImageElement>("figure img");
  const font = document.fonts.check("700 16px Manrope");
  const script = document.querySelector("script[src]");
  const viaFetch = script !== null
    ? (await fetch(script.getAttribute("src"))).ok
    : false;
  return {
    apiStatus: api.status,
    stylesheet,
    logoLoaded: logo ? `${logo.naturalWidth}x${logo.naturalHeight}` : "none",
    screenshotLoaded: screenshot ? `${screenshot.naturalWidth}x${screenshot.naturalHeight}` : "none",
    fontLoaded: font,
    scriptFetched: viaFetch,
  };
});

console.log("Page checks:", results);
console.log("CSP console violations:", cspViolations.length, cspViolations);
console.log("Resource console errors (network-level):", failedRequests.length, failedRequests);

const anyImage = await page.evaluate(() => {
  const imgs = [...document.querySelectorAll("img")];
  const loaded = imgs.filter((img) => img.complete && img.naturalWidth > 0).length;
  return `${loaded}/${imgs.length} img elements loaded`;
});
console.log("Image loading:", anyImage);

const responseHeaders = await page.goto("http://localhost:4545/", { waitUntil: "commit" }).then((r) => r.headers());
console.log(
  "Served response headers:",
  JSON.stringify(
    Object.fromEntries(
      Object.keys(headersFor).map((key) => [key, responseHeaders[key.toLowerCase()]]),
    ),
    null,
    1,
  ),
);

let imagesLoadedAll = false;
const anyImageMatch = anyImage.match(/^(\d+)\/(\d+) img elements loaded$/);
if (anyImageMatch) {
  imagesLoadedAll = Number(anyImageMatch[1]) === Number(anyImageMatch[2]);
} 
let ok =
  cspViolations.length === 0 &&
  imagesComplete &&
  results.apiStatus === 200 &&
  results.fontLoaded &&
  results.scriptFetched &&
  results.stylesheet !== "rgba(0, 0, 0, 0)" &&
  imagesLoadedAll;
if (!imagesLoadedAll && anyImageMatch) {
  console.error(`too few images loaded (${anyImage})`);
}
for (const key of Object.keys(headersFor)) {
  const served = responseHeaders[key.toLowerCase()];
  if (served !== headersFor[key]) {
    ok = false;
    console.error(`Header mismatch for ${key}: expected "${headersFor[key]}", got "${served}"`);
  }
}
console.log(`ok factors: csp=${cspViolations.length === 0} imagesComplete=${imagesComplete} imagesAll=${imagesLoadedAll} api=${results.apiStatus === 200} font=${results.fontLoaded} script=${results.scriptFetched} css=${results.stylesheet}`);
console.log(ok ? "PASS: site works verbatim under the vercel.json CSP/headers" : "FAIL");

await browser.close();
await new Promise((resolve) => server.close(resolve));
process.exit(ok ? 0 : 1);

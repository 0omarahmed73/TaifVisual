/**
 * T098: e2e-only fixture routes (/showcase-test*, /ar/showcase-test*) and
 * public/e2e/ must not ship in a production build. They are removed from
 * dist/ unless TAIF_E2E=1 (set by playwright.config.ts for the test server).
 *
 * run: node scripts/prune-fixtures.mjs   (wired into the `postbuild` script)
 */
import { rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

if (process.env.TAIF_E2E === "1") {
  console.log("prune-fixtures: TAIF_E2E=1, keeping e2e fixtures");
} else {
  const dist = join(fileURLToPath(new URL("..", import.meta.url)), "dist");
  const targets = ["showcase-test", "showcase-test-empty", "ar/showcase-test", "ar/showcase-test-empty", "e2e"];
  await Promise.all(targets.map((t) => rm(join(dist, t), { recursive: true, force: true })));
  console.log("prune-fixtures: removed e2e fixture routes and assets from dist/");
}

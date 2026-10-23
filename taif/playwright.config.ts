import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  // Cap parallelism: this suite mixes deliberate 5s network waits with heavy
  // page loads, and an uncapped worker pool can starve a test past its 30s
  // budget when a shared dev server is also serving the preview.
  workers: 4,
  // Generous per-test budget: the download-center specs intentionally wait on
  // network mocks/timeouts, and CPU contention must not turn that into a flake.
  timeout: 60_000,
  webServer: {
    command: "npm run build && npm run preview",
    port: 4321,
    reuseExistingServer: true,
    env: {
      SITE_URL: process.env.SITE_URL ?? "",
      // Keep the /showcase-test* fixture routes in the test build only (T098).
      TAIF_E2E: "1",
    },
  },
  projects: [
    { name: "chromium-375", use: { ...devices["Desktop Chrome"], viewport: { width: 375, height: 812 } } },
    { name: "chromium-768", use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 } } },
    { name: "chromium-1280", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
    {
      name: "chromium-1280-reduced-motion",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        contextOptions: { reducedMotion: "reduce" },
      },
    },
  ],
});

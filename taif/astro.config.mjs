import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";

const siteUrl = process.env.SITE_URL;

export default defineConfig({
  site: siteUrl || undefined,
  output: "static",
  trailingSlash: "ignore",
  // T076: keep the CSP information accurate; Astro emits one tiny inline
  // <style> (island display boilerplate) which the CSP below accounts for.
  build: { inlineStylesheets: "never" },
  vite: {
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "zod",
        "lucide-react",
      ],
    },
  },
  integrations: [
    react(),
    // Sitemap needs an absolute origin; omitted when SITE_URL is unset
    // (no guessed domain — see contracts/locale-routing.md).
    ...(siteUrl
      ? [
          sitemap({
            // T092: emit <xhtml:link> alternates for both locale URLs.
            i18n: { defaultLocale: "en", locales: { en: "en", ar: "ar" } },
            // T094: the e2e fixture routes are never part of the public site.
            filter: (page) => !page.includes("showcase-test"),
            // T093: clean URLs without trailing slashes, matching canonical,
            // hreflang and every in-site link.
            serialize(item) {
              const url = new URL(item.url);
              if (url.pathname.length > 1) {
                url.pathname = url.pathname.replace(/\/+$/, "");
              }
              item.url = url.href;
              item.links = item.links?.map((link) => {
                const alternate = new URL(link.url);
                if (alternate.pathname.length > 1) {
                  alternate.pathname = alternate.pathname.replace(/\/+$/, "");
                }
                return { ...link, url: alternate.href };
              });
              return item;
            },
          }),
        ]
      : []),
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ar"],
    routing: { prefixDefaultLocale: false },
  },
});

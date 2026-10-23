/**
 * T070 (US6): robots.txt generated at build time. Sitemap line is emitted
 * only when SITE_URL is set at build (never a guessed domain).
 */
import type { APIRoute } from "astro";

export const GET: APIRoute = (): Response => {
  const siteUrl = process.env["SITE_URL"]?.replace(/\/+$/, "");
  const lines = ["User-agent: *", "Allow: /", ""];
  if (siteUrl) {
    lines.push(`Sitemap: ${siteUrl}/sitemap-index.xml`, "");
  }
  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};

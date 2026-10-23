/**
 * Hand-verified site configuration (data-model.md, SiteConfig).
 * Do not add values that have not been verified against the app source.
 */
import type { Locale } from "@/content/types";

export const siteConfig = {
  repo: {
    owner: "0omarahmed73",
    name: "TaifVisual",
  },
  license: "GPL-3.0",
  locales: {
    all: ["en", "ar"] as Locale[],
    default: "en" as Locale,
  },
  developer: {
    name: "Omar A. Saeed",
    role: "Full Stack Developer",
    links: {
      website: "https://www.omarasaeed.dev/",
      github: "https://github.com/0omarahmed73",
      linkedin: "https://linkedin.com/in/0omarahmed73",
    },
  },
  assetRules: [
    { ext: ".msi", platform: "windows", packageType: "installer" },
    { ext: ".deb", platform: "linux", packageType: "deb" },
    { ext: ".apk", platform: "android", packageType: "apk" },
  ] as const,
  archTokens: ["arm64-v8a", "x86_64", "amd64", "x64"] as const,
  cache: {
    freshMinutes: 10,
    staleMaxDays: 7,
    requestTimeoutMs: 8000,
  },
} as const;

/** https://github.com/0omarahmed73/TaifVisual */
export const repoUrl = `https://github.com/${siteConfig.repo.owner}/${siteConfig.repo.name}`;

/** https://github.com/0omarahmed73/TaifVisual/releases */
export const releasesUrl = `${repoUrl}/releases`;

/** Absolute, validated download prefix for release assets (research.md §8). */
export const releasesDownloadPrefix = `${repoUrl}/releases/download/`;

export const releasesApiUrl = `https://api.github.com/repos/${siteConfig.repo.owner}/${siteConfig.repo.name}/releases`;

/** License blob URL in the app repository. */
export const licenseUrl = `${repoUrl}/blob/main/LICENSE`;

export type SiteConfig = typeof siteConfig;

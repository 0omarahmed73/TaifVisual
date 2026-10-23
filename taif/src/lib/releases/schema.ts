/**
 * Zod validation of the GitHub Releases response (contracts/github-releases.md,
 * data-model.md Release/ReleaseAsset). Untrusted data: extra fields ignored,
 * drafts/pre-releases excluded, invalid assets dropped, notes length-bounded.
 */
import { z } from "zod";
import { siteConfig, releasesDownloadPrefix } from "@/config/site";

export const maxNotesLength = 4000;

/** A GitHub asset that maps to one of the site's asset rules. */
export interface MappableAsset {
  fileName: string;
  sizeBytes: number;
  downloadUrl: string;
}

/** Validated release (data-model.md, Release). */
export interface Release {
  tag: string;
  name: string | null;
  publishedAt: string;
  url: string;
  /** Untrusted text; length-bounded to maxNotesLength; rendered as text only. */
  notes: string;
  assets: MappableAsset[];
}

const releaseUrlPrefix = `https://github.com/${siteConfig.repo.owner}/${siteConfig.repo.name}/releases/tag/`;

const releasePageUrl = z
  .string()
  .startsWith(releaseUrlPrefix)
  .refine((url) => new URL(url).host === "github.com");

const isoDate = z
  .string()
  .min(1)
  .refine((value) => {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed);
  });

const assetSchema = z.object({
  name: z.string().min(1),
  size: z.number().int().positive(),
  state: z.literal("uploaded"),
  browser_download_url: z.string().startsWith(releasesDownloadPrefix),
});

const releaseSchema = z.object({
  tag_name: z.string().min(1),
  name: z.string().nullish(),
  draft: z.boolean().default(false),
  prerelease: z.boolean().default(false),
  published_at: isoDate,
  html_url: releasePageUrl,
  body: z.string().nullish(),
  assets: z
    .array(z.unknown())
    .transform((items) =>
      items.flatMap((item) => {
        const parsed = assetSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      }),
    )
    .default([]),
});

/** True when the file name matches one of SiteConfig.assetRules extensions. */
function isMappable(fileName: string): boolean {
  const lower = fileName.toLowerCase();
  return siteConfig.assetRules.some((rule) => lower.endsWith(rule.ext));
}

/**
 * Validate a parsed GitHub Releases payload. Invalid releases and assets are
 * silently dropped; drafts and pre-releases never reach the output.
 */
export function parseReleases(raw: unknown): Release[] {
  if (!Array.isArray(raw)) return [];
  const releases: Release[] = [];
  for (const item of raw) {
    const parsed = releaseSchema.safeParse(item);
    if (!parsed.success) continue;
    const data = parsed.data;
    if (data.draft || data.prerelease) continue;
    releases.push({
      tag: data.tag_name,
      name: data.name ?? null,
      publishedAt: data.published_at,
      url: data.html_url,
      notes: (data.body ?? "").slice(0, maxNotesLength),
      assets: data.assets
        .filter((asset) => isMappable(asset.name))
        .map((asset) => ({
          fileName: asset.name,
          sizeBytes: asset.size,
          downloadUrl: asset.browser_download_url,
        })),
    });
  }
  return releases;
}

/** Newest release by published_at (only non-draft, non-prerelease releases arrive here). */
export function selectLatest(releases: Release[]): Release | null {
  if (releases.length === 0) return null;
  return releases.reduce((newest, current) =>
    Date.parse(current.publishedAt) > Date.parse(newest.publishedAt) ? current : newest,
  );
}

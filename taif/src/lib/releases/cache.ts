/**
 * Releases cache in localStorage under `taif.releases.v1`
 * (data-model.md CachedRelease). Uses safe storage wrappers; corrupt or
 * expired entries are discarded (re-validated on read).
 */
import { z } from "zod";
import { siteConfig, releasesDownloadPrefix } from "@/config/site";
import { getItem, setItem } from "@/lib/storage";
import type { Release } from "@/lib/releases/schema";

export const releasesCacheKey = "taif.releases.v1";

export interface CachedRelease {
  fetchedAt: number;
  release: Release;
}

/** Cache age boundary helpers (SiteConfig.cache: fresh 10 min, stale max 7 days). */
export function isCacheFresh(now: number, fetchedAt: number): boolean {
  const agesMs = now - fetchedAt;
  return agesMs >= 0 && agesMs < siteConfig.cache.freshMinutes * 60 * 1000;
}

export function isCacheStaleUsable(now: number, fetchedAt: number): boolean {
  const ageMs = now - fetchedAt;
  return ageMs >= 0 && ageMs <= siteConfig.cache.staleMaxDays * 24 * 60 * 60 * 1000;
}

const cachedReleaseSchema = z.object({
  tag: z.string().min(1),
  name: z.string().nullish(),
  publishedAt: z.string().min(1),
  notes: z.string(),
  url: z
    .string()
    .startsWith(`https://github.com/${siteConfig.repo.owner}/${siteConfig.repo.name}/releases/tag/`),
  assets: z.array(
    z.object({
      fileName: z.string().min(1),
      sizeBytes: z.number().int().positive(),
      downloadUrl: z.string().startsWith(releasesDownloadPrefix),
    }),
  ),
});

const cacheEntrySchema = z.object({
  fetchedAt: z.number().int().positive(),
  release: cachedReleaseSchema,
});

/**
 * Read and re-validate the cached release. Returns null when the storage has
 * no entry, the JSON is corrupt, the shape fails validation, fetchedAt is in
 * the future, or the entry is older than staleMaxDays.
 */
export function readCachedRelease(now: number): CachedRelease | null {
  let raw: string | null;
  try {
    raw = getItem(releasesCacheKey);
  } catch {
    return null;
  }
  if (!raw) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsedEntry = cacheEntrySchema.safeParse(parsed);
  if (!parsedEntry.success) return null;
  const entry = parsedEntry.data as CachedRelease; // Safe: schema above checked the shape.
  if (!isCacheStaleUsable(now, entry.fetchedAt)) return null;
  return entry;
}

/** Persist a validated release with the check time. */
export function writeCachedRelease(release: Release, now: number): void {
  const entry: CachedRelease = { fetchedAt: now, release };
  setItem(releasesCacheKey, JSON.stringify(entry));
}

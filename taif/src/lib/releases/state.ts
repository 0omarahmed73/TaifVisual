/**
 * Pure state resolution (data-model.md DownloadCenterState; FR-019, FR-020,
 * FR-020a, FR-021): latest live release, honest stale fallback within 7 days,
 * otherwise error. No side effects.
 */
import type { FetchErrorKind, FetchResult } from "@/lib/releases/fetch";
import { mapAssets, markSuggested, type Platform, type PlatformEntry } from "@/lib/releases/map";
import { selectLatest, type Release } from "@/lib/releases/schema";
import type { CachedRelease } from "@/lib/releases/cache";
import { siteConfig } from "@/config/site";

export type DownloadStatus = "loading" | "ready" | "partial" | "no-release" | "error";

export interface DownloadCenterState {
  status: DownloadStatus;
  /** Cached data inside the 7-day window is flagged stale. */
  stale: boolean;
  release?: Release;
  platforms?: PlatformEntry[];
  source?: "live" | "cache";
  fetchedAt?: number;
  errorKind?: FetchErrorKind;
  rateLimitResetAt?: number;
}

function statusFor(platforms: PlatformEntry[]): "ready" | "partial" {
  return platforms.every((platform) => platform.status === "available") ? "ready" : "partial";
}

/**
 * Combine a fetch result with the (optionally null) cache state.
 * `suggestedPlatform` highlights one asset only from platform detection.
 */
export function resolveState(
  result: FetchResult,
  now: number,
  cached: CachedRelease | null,
  suggestedPlatform: Platform | null = null,
): DownloadCenterState {
  if (result.ok) {
    const release = selectLatest(result.releases);
    if (!release) return { status: "no-release", stale: false };
    const platforms = markSuggested(mapAssets(release.assets), suggestedPlatform);
    return { status: statusFor(platforms), stale: false, release, platforms, source: "live" };
  }
  // Failure: fall back to the cache only within the 7-day window (FR-020a).
  const cachedUsable =
    cached !== null &&
    now - cached.fetchedAt >= 0 &&
    now - cached.fetchedAt <= siteConfig.cache.staleMaxDays * 24 * 60 * 60 * 1000;
  if (cachedUsable && cached) {
    const platforms = markSuggested(mapAssets(cached.release.assets), suggestedPlatform);
    return {
      status: statusFor(platforms),
      stale: true,
      release: cached.release,
      platforms,
      source: "cache",
      fetchedAt: cached.fetchedAt,
    };
  }
  return { status: "error", stale: false, errorKind: result.kind, rateLimitResetAt: result.rateLimitResetAt };
}

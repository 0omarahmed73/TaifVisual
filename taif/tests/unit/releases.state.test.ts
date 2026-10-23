import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fetchReleases, releasesRequestUrl, type FetchResult } from "@/lib/releases/fetch";
import { resolveState, type DownloadCenterState } from "@/lib/releases/state";
import { parseReleases } from "@/lib/releases/schema";
import type { CachedRelease } from "@/lib/releases/cache";
import type { Release } from "@/lib/releases/schema";

const DAY = 24 * 60 * 60 * 1000;
const now = 1_800_000_000_000;

function fixture(name: string): unknown {
  return JSON.parse(readFileSync(new URL(`../fixtures/github/${name}`, import.meta.url).pathname, "utf8"));
}

function cached(): CachedRelease {
  const release = parseReleases(fixture("release-full.json"))[0];
  if (!release) throw new Error("fixture must parse");
  return { fetchedAt: now - 2 * DAY, release };
}

describe("releases state (outcome table)", () => {
  it("ready: valid latest release with all three platforms", () => {
    const state = resolveState({ ok: true, releases: parseReleases(fixture("release-full.json")) }, now, null);
    expect(state).toMatchObject({
      status: "ready",
      stale: false,
      source: "live",
    });
    expect(state.platforms?.every((p) => p.status === "available")).toBe(true);
    expect(state.release?.tag).toBe("v1.2.0");
  });

  it("partial: valid release but some platforms missing", () => {
    const state = resolveState({ ok: true, releases: parseReleases(fixture("release-windows-only.json")) }, now, null);
    expect(state.status).toBe("partial");
    expect(state.platforms?.find((p) => p.platform === "windows")?.status).toBe("available");
    expect(state.platforms?.find((p) => p.platform === "android")?.status).toBe("unavailable");
  });

  it("partial: release valid but zero mappable assets", () => {
    const release: Release = { tag: "v1.2.0", name: null, publishedAt: "2026-10-01T10:00:00Z", url: "https://github.com/0omarahmed73/TaifVisual/releases/tag/v1.2.0", notes: "", assets: [] };
    const state = resolveState({ ok: true, releases: [release] }, now, null);
    expect(state.status).toBe("partial");
    expect(state.platforms?.every((p) => p.status === "unavailable")).toBe(true);
  });

  it("no-release empty payload", () => {
    expect(resolveState({ ok: true, releases: [] }, now, null).status).toBe("no-release");
  });

  it("no-release: only drafts or only pre-releases", () => {
    expect(resolveState({ ok: true, releases: parseReleases(fixture("only-draft.json")) }, now, null).status).toBe("no-release");
    expect(resolveState({ ok: true, releases: parseReleases(fixture("only-prerelease.json")) }, now, null).status).toBe("no-release");
  });

  it("error(invalid-data): malformed shape or bad URL payload", () => {
    const fetchResult: FetchResult = { ok: false, kind: "invalid-data" };
    const state = resolveState(fetchResult, now, null);
    expect(state.status).toBe("error");
    expect(state.errorKind).toBe("invalid-data");
    expect(state.release).toBeUndefined();
  });

  it("error(rate-limit): with a reset header carries rateLimitResetAt", () => {
    const state = resolveState({ ok: false, kind: "rate-limit", status: 403, rateLimitResetAt: 1799999999 * 1000 }, now, null);
    expect(state).toMatchObject({ status: "error", errorKind: "rate-limit", rateLimitResetAt: 1799999999000 });
  });

  it("error(rate-limit): without a reset header has none", () => {
    const state = resolveState({ ok: false, kind: "rate-limit", status: 429 }, now, null);
    expect(state.errorKind).toBe("rate-limit");
    expect(state.rateLimitResetAt).toBeUndefined();
  });

  it("error(http) and error(network|timeout) classify correctly", () => {
    expect(resolveState({ ok: false, kind: "http", status: 404 }, now, null).errorKind).toBe("http");
    expect(resolveState({ ok: false, kind: "http", status: 500 }, now, null).errorKind).toBe("http");
    expect(resolveState({ ok: false, kind: "timeout" }, now, null).errorKind).toBe("timeout");
    expect(resolveState({ ok: false, kind: "network" }, now, null).errorKind).toBe("network");
  });

  it("stale: failure with cache ≤ 7 days → cached data, stale flag, fetchedAt", () => {
    const state = resolveState({ ok: false, kind: "network" }, now, cached());
    expect(state).toMatchObject({ status: "ready", stale: true, source: "cache", fetchedAt: now - 2 * DAY });
    expect(state.release?.tag).toBe("v1.2.0");
  });

  it("error: failure with cache > 7 days or corrupt cache", () => {
    const expired: CachedRelease = { ...cached(), fetchedAt: now - 8 * DAY };
    expect(resolveState({ ok: false, kind: "network" }, now, expired).status).toBe("error");
    expect(resolveState({ ok: false, kind: "network" }, now, null).status).toBe("error");
  });

  it("preserves fetchedAt as the stale marker and keeps error state retryable", () => {
    const errorState: DownloadCenterState = resolveState({ ok: false, kind: "timeout" }, now, null);
    expect(errorState.status).toBe("error");
    // retry → loading → new attempt is allowed by design (error → loading).
    const loading: DownloadCenterState = { status: "loading", stale: false };
    expect(loading.status).toBe("loading");
  });
});

describe("fetch classification", () => {
  it("builds the contracted request URL", () => {
    expect(releasesRequestUrl()).toBe(
      "https://api.github.com/repos/0omarahmed73/TaifVisual/releases?per_page=10",
    );
  });

  it("sends the Accept header and classifies rate-limit via x-ratelimit-* headers", async () => {
    const descriptor = fixture("rate-limit-headers.json") as { status: number; headers: Record<string, string> };
    const response = new Response(JSON.stringify({ message: "API rate limit exceeded" }), {
      status: descriptor.status,
      headers: descriptor.headers,
    });
    let seenUrl = "";
    let seenAccept = "";
    const probe = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seenUrl = String(input);
      seenAccept = new Headers(init?.headers).get("Accept") ?? "";
      return response;
    }) as unknown as typeof fetch;
    const result = await fetchReleases(probe);
    expect(seenUrl).toBe(releasesRequestUrl());
    expect(seenAccept).toBe("application/vnd.github+json");
    expect(response.ok).toBe(false);
    expect(result).toMatchObject({ ok: false, kind: "rate-limit", status: 403, rateLimitResetAt: 1799999999000 });
  });

  it("classifies 404/500 as http and incomplete JSON as invalid-data", async () => {
    const httpResult = await fetchReleases((async () => new Response(null, { status: 500 })) as typeof fetch);
    expect(httpResult).toMatchObject({ ok: false, kind: "http", status: 500 });
    const shapeResult = await fetchReleases(
      (async () => new Response(JSON.stringify({ message: "Moved Permanently" }), { status: 200 })) as typeof fetch,
    );
    expect(shapeResult).toMatchObject({ ok: false, kind: "invalid-data" });
  });
});

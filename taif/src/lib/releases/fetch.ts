/**
 * GitHub Releases fetch per contracts/github-releases.md: unauthenticated GET
 * with an 8 s timeout and error classification.
 */
import { z } from "zod";
import { siteConfig, releasesApiUrl } from "@/config/site";
import { parseReleases, type Release } from "@/lib/releases/schema";

export type FetchErrorKind = "network" | "timeout" | "rate-limit" | "http" | "invalid-data";

export type FetchResult =
  | { ok: true; releases: Release[] }
  | { ok: false; kind: FetchErrorKind; status?: number; rateLimitResetAt?: number };

interface FetchLike {
  (input: string, init?: RequestInit): Promise<Response>;
}

/** Build the request URL; owner/name come from SiteConfig only. */
export function releasesRequestUrl(perPage = 10): string {
  return `${releasesApiUrl}?per_page=${perPage}`;
}

const rawArray = z.array(z.unknown());

export async function fetchReleases(
  fetchImpl: FetchLike = fetch,
  timeoutMs: number = siteConfig.cache.requestTimeoutMs,
): Promise<FetchResult> {
  const controller = new AbortController();
  const abortTimer = setTimeout(() => controller.abort(), timeoutMs);
  let response: Response;
  try {
    response = await fetchImpl(releasesRequestUrl(), {
      headers: { Accept: "application/vnd.github+json" },
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(abortTimer);
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, kind: "timeout" };
    }
    return { ok: false, kind: "network" };
  }
  clearTimeout(abortTimer);

  if (!response.ok) {
    const status = response.status;
    if ((status === 403 || status === 429) && response.headers.get("x-ratelimit-remaining") === "0") {
      const resetSeconds = response.headers.get("x-ratelimit-reset");
      const resetAt = resetSeconds ? Number.parseInt(resetSeconds, 10) : Number.NaN;
      return {
        ok: false,
        kind: "rate-limit",
        status,
        rateLimitResetAt: Number.isFinite(resetAt) ? resetAt * 1000 : undefined,
      };
    }
    return { ok: false, kind: "http", status };
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return { ok: false, kind: "invalid-data", status: response.status };
  }
  if (!rawArray.safeParse(body).success) {
    return { ok: false, kind: "invalid-data", status: response.status };
  }
  return { ok: true, releases: parseReleases(body) };
}

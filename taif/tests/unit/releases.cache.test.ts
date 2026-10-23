import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { readCachedRelease, isCacheFresh, isCacheStaleUsable, writeCachedRelease, releasesCacheKey } from "@/lib/releases/cache";
import { parseReleases } from "@/lib/releases/schema";
import type { Release } from "@/lib/releases/schema";

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;
const now = 1_800_000_000_000;

function storageStub(): { store: Map<string, string>; localStorage: Storage } {
  const store = new Map<string, string>();
  const localStorage = {
    getLength: () => store.size,
    key: () => null,
    getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
  };
  return { store, localStorage: localStorage as unknown as Storage };
}

function cachedRelease(): Release {
  const fixture = JSON.parse(
    readFileSync(new URL("../fixtures/github/release-full.json", import.meta.url), "utf8"),
  );
  const release = parseReleases(fixture)[0];
  if (!release) throw new Error("fixture must parse");
  return release;
}

function installCache(atKey: string, value: string | undefined): void {
  const stub = storageStub();
  if (value !== undefined) stub.store.set(atKey, value);
  (globalThis as { window?: unknown }).window = { localStorage: stub.localStorage } as unknown;
}

beforeEach(() => {
  installCache(releasesCacheKey, undefined);
});

afterEach(() => {
  delete (globalThis as { window?: unknown }).window;
});

describe("releases cache", () => {
  it("returns null when storage is empty, corrupt, or has the wrong shape", () => {
    installCache(releasesCacheKey, undefined);
    expect(readCachedRelease(now)).toBeNull();

    installCache(releasesCacheKey, "{not json");
    expect(readCachedRelease(now)).toBeNull();

    installCache(releasesCacheKey, JSON.stringify({ fetchedAt: now, release: "nope" }));
    expect(readCachedRelease(now)).toBeNull();
  });

  it("returns a fresh (<10 min) entry", () => {
    writeCachedRelease(cachedRelease(), now - 5 * MINUTE);
    const entry = readCachedRelease(now);
    expect(entry?.fetchedAt).toBe(now - 5 * MINUTE);
    expect(entry?.release.tag).toBe("v1.2.0");
    expect(isCacheFresh(now, now - 5 * MINUTE)).toBe(true);
    expect(isCacheFresh(now, now - 11 * MINUTE)).toBe(false);
  });

  it("accepts a stale entry within 7 days and reports stale state on failure", () => {
    writeCachedRelease(cachedRelease(), now - 6 * DAY);
    const entry = readCachedRelease(now);
    expect(entry).not.toBeNull();
    expect(isCacheStaleUsable(now, now - 6 * DAY)).toBe(true);
    expect(isCacheFresh(now, now - 6 * DAY)).toBe(false);
  });

  it("rejects an entry older than 7 days or from the future", () => {
    writeCachedRelease(cachedRelease(), now - 8 * DAY);
    expect(readCachedRelease(now)).toBeNull();

    writeCachedRelease(cachedRelease(), now + 10 * MINUTE);
    expect(readCachedRelease(now)).toBeNull();
  });

  it("re-validates the stored release on read", () => {
    const release = cachedRelease();
    const tampered = { ...release, assets: release.assets.concat({ fileName: "x.zip", sizeBytes: -5, downloadUrl: "https://evil.example.com/x.zip" }) };
    globalThis.window = { localStorage: storageStub().localStorage } as unknown as typeof globalThis.window;
    writeCachedRelease(tampered as unknown as Release, now);
    expect(readCachedRelease(now)).toBeNull();

    const badUrl = { ...release, url: "https://github.com/other/repo/releases/tag/v1" };
    globalThis.window = { localStorage: storageStub().localStorage } as unknown as typeof globalThis.window;
    writeCachedRelease(badUrl as unknown as Release, now);
    expect(readCachedRelease(now)).toBeNull();
  });
});

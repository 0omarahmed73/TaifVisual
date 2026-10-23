/**
 * Best-effort platform suggestion client-side (FR: suggest, never guess).
 * Returns null for macOS, iOS, unknown agents, and on any error.
 */
import type { Platform } from "@/lib/releases/map";

interface NavigatorUAData {
  platform?: string;
  brands?: { brand: string; version: string }[];
  mobile?: boolean;
}

interface DetectInput {
  userAgent?: string;
  userAgentData?: NavigatorUAData;
}

/** Case-insensitive arch-token check helper (map.ts owns the token list). */
export function suggestPlatform(input: DetectInput = {}): Platform | null {
  const { userAgent = "", userAgentData } = input;

  // Client Hints first where available.
  const platformHint = userAgentData?.platform?.toLowerCase();
  if (platformHint === "macos" || platformHint === "ios") return null;
  if (platformHint === "windows") return "windows";

  const ua = userAgent.toLowerCase();
  if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("macintosh")) return null;

  // Android detection is reliable from the UA string; desktop Chrome on
  // Linux reports "X11" plus "Linux".
  if (ua.includes("android")) return "android";
  if (platformHint === "linux") {
    // Client Hints on a desktop Linux browser always report "Linux"?
    return "linux";
  }
  if (ua.includes("x11") && ua.includes("linux")) return "linux";
  if (ua.includes("windows")) return "windows";
  return null;
}

/** Suggestion for the current browser, null-safe. */
export function suggestCurrentPlatform(): Platform | null {
  const nav = typeof navigator === "undefined" ? undefined : navigator;
  if (!nav) return null;
  return suggestPlatform({
    userAgent: nav.userAgent,
    userAgentData: (("userAgentData" in nav) ? (nav as Navigator & { userAgentData?: NavigatorUAData }).userAgentData : undefined) as NavigatorUAData | undefined,
  });
}

/**
 * T054 (US3): the ONLY locale-redirect logic on the site, included solely by
 * src/pages/index.astro. If the stored preference says Arabic, the visitor is
 * moved to /ar preserving the fragment. There is deliberately NO
 * Accept-Language logic (first visit always gets the requested URL).
 * External preventDefault-free module so CSP `script-src 'self'` keeps working.
 */
import { getItem } from "@/lib/storage";

const LANG_KEY = "taif.lang";

export function redirectOnce(): boolean {
  if (window.location.pathname !== "/") return false;
  if (getItem(LANG_KEY) !== "ar") return false;
  window.location.replace(`/ar${window.location.hash}`);
  return true;
}

redirectOnce();

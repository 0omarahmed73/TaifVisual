/**
 * T053 (US3): persistence of the language preference under the `taif.lang`
 * localStorage key. Uses the safe storage wrappers so a blocked localStorage
 * is a silent no-op (the URL-based switch still works, T051).
 */
import { getItem, setItem, removeItem } from "@/lib/storage";

import type { Locale } from "@/content/types";

const LANG_KEY = "taif.lang";

export function setLangPref(locale: Locale): void {
  setItem(LANG_KEY, locale);
}

export function getLangPref(): string | null {
  return getItem(LANG_KEY);
}

export function clearLangPref(): void {
  removeItem(LANG_KEY);
}

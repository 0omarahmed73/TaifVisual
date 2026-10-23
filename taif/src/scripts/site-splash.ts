/**
 * Site splash controller (owner request).
 *
 * The splash is CSS-driven; this module only removes it after the progress
 * line completes. It runs on every page load (no session skip) so the entrance
 * is predictable; an inline head script is intentionally not used.
 *
 * Never blocks content: the overlay is aria-hidden, contains no focusable
 * elements, has `pointer-events: none`, and a CSS-only auto-hide fallback.
 */
const VISIBLE_MS = 1500;
const FADE_MS = 450;

export function initSiteSplash(): void {
  const splash = document.getElementById("site-splash");
  if (!splash) return;

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduceMotion) {
    splash.remove();
    return;
  }

  window.setTimeout(() => {
    splash.classList.add("is-hidden");
    window.setTimeout(() => splash.remove(), FADE_MS);
  }, VISIBLE_MS);
}

/**
 * Header polish: marks the nav link of the section in view with
 * aria-current="true" and condenses the sticky header once the page scrolls.
 * Progressive enhancement only; nav links work without it.
 */
export function initScrollSpy(): void {
  const header = document.querySelector("header");
  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("#site-nav a[href^='#']"));

  const onScroll = (): void => {
    header?.toggleAttribute("data-scrolled", window.scrollY > 8);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const sections = links
    .map((link) => document.getElementById(link.getAttribute("href")!.slice(1)))
    .filter((el): el is HTMLElement => el !== null);
  if (sections.length === 0 || !("IntersectionObserver" in window)) return;

  const setCurrent = (id: string | null): void => {
    links.forEach((link) => {
      if (link.getAttribute("href") === `#${id}`) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  };

  // A section counts as current while it crosses a band near the top third.
  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting);
      if (visible.length > 0) setCurrent(visible[visible.length - 1].target.id);
      else if (window.scrollY < 200) setCurrent(null);
    },
    { rootMargin: "-20% 0px -65% 0px" },
  );
  sections.forEach((section) => observer.observe(section));
}

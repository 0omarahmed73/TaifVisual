/**
 * T048/T074: mobile menu behaviour, extracted from an inline <script> into a
 * bundled module so the CSP can stay `script-src 'self'` without 'unsafe-inline'.
 * Contract: button with aria-expanded/aria-controls, Escape closes the menu and
 * focus returns to the button, navigating a link closes the menu.
 */
export function initMobileMenu(): void {
  const button = document.getElementById("menu-button") as HTMLButtonElement;
  const nav = document.getElementById("site-nav")!;
  const label = document.getElementById("menu-button-label")!;

  function setOpen(open: boolean): void {
    button.setAttribute("aria-expanded", String(open));
    nav.classList.toggle("hidden", !open);
    label.textContent = open
      ? (button.dataset.closeLabel ?? "")
      : (button.dataset.openLabel ?? "");
  }

  button.addEventListener("click", () => {
    setOpen(button.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      button.focus();
    }
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setOpen(false));
  });

  // Close when clicking/tapping anywhere outside the panel or its toggle.
  // Pointerdown covers mouse, touch and pen before a click can be swallowed
  // by whatever element is underneath.
  document.addEventListener("pointerdown", (event) => {
    if (button.getAttribute("aria-expanded") !== "true") return;
    const node = event.target as Node | null;
    if (!node) return;
    if (nav.contains(node) || button.contains(node)) return;
    setOpen(false);
  });

  // Escape anywhere (not only while the panel holds focus).
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (button.getAttribute("aria-expanded") !== "true") return;
    setOpen(false);
    button.focus();
  });
}

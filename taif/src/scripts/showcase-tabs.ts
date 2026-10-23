/**
 * Showcase Desktop | Android tabs (progressive enhancement). Without JS both
 * groups stay visible and the tab bar is hidden by CSS; with JS only the active
 * group shows. Roving tabindex + arrow keys per the WAI-ARIA tabs pattern.
 */
export function initShowcaseTabs(): void {
  const root = document.getElementById("showcase");
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>("[role='tab']"));
  const panels = Array.from(root.querySelectorAll<HTMLElement>("[data-showcase-panel]"));
  if (tabs.length < 2 || panels.length < 2) return;

  const select = (name: string, focus = false): void => {
    tabs.forEach((tab) => {
      const on = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      if (on && focus) tab.focus();
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.showcasePanel !== name;
    });
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab.dataset.tab!));
    tab.addEventListener("keydown", (event) => {
      const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
      if (!keys.includes(event.key)) return;
      event.preventDefault();
      const next =
        event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (index + 1) % tabs.length;
      select(tabs[next].dataset.tab!, true);
    });
  });

  // After the lightbox closes, make sure the image's group is the visible one.
  const dialog = document.querySelector<HTMLDialogElement>("[data-showcase-lightbox]");
  dialog?.addEventListener("close", () => {
    const src = dialog.querySelector<HTMLImageElement>("[data-lightbox-image]")?.getAttribute("src");
    const trigger = src
      ? root.querySelector<HTMLElement>(`[data-lightbox-src="${CSS.escape(src)}"]`)
      : null;
    const group = trigger?.closest<HTMLElement>("[data-showcase-panel]")?.dataset.showcasePanel;
    if (group) select(group);
    trigger?.focus();
  });

  root.setAttribute("data-tabs-ready", "");
  select("desktop");
}

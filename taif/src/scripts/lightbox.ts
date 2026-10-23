/**
 * Accessible showcase lightbox (T0xx, US2).
 *
 * Progressive enhancement over a native <dialog>: clicking any
 * `[data-showcase-trigger]` opens the single dialog, focuses its close button,
 * and closing (Escape, close button, backdrop click) returns focus to the
 * trigger. ArrowLeft/ArrowRight navigate; the mapping is direction-aware so
 * RTL users get the visually expected direction.
 *
 * Loaded as an external module (see Showcase.astro) to keep `script-src 'self'`.
 */

interface LightboxParts {
  dialog: HTMLDialogElement;
  image: HTMLImageElement;
  caption: HTMLElement;
  closeButton: HTMLButtonElement;
  prevButton: HTMLButtonElement | null;
  nextButton: HTMLButtonElement | null;
}

function resolveParts(): LightboxParts | null {
  const dialog = document.getElementById("showcase-lightbox");
  if (!(dialog instanceof HTMLDialogElement)) return null;
  const image = dialog.querySelector<HTMLImageElement>("[data-lightbox-image]");
  const caption = dialog.querySelector<HTMLElement>("[data-lightbox-caption]");
  const closeButton = dialog.querySelector<HTMLButtonElement>("[data-lightbox-close]");
  if (!image || !caption || !closeButton) return null;
  return {
    dialog,
    image,
    caption,
    closeButton,
    prevButton: dialog.querySelector<HTMLButtonElement>("[data-lightbox-prev]"),
    nextButton: dialog.querySelector<HTMLButtonElement>("[data-lightbox-next]"),
  };
}

function readTrigger(trigger: HTMLButtonElement): {
  src: string;
  alt: string;
  width: string | null;
  height: string | null;
} {
  const img = trigger.querySelector("img");
  return {
    src: trigger.dataset["lightboxSrc"] ?? img?.getAttribute("src") ?? "",
    alt: trigger.dataset["lightboxAlt"] ?? img?.getAttribute("alt") ?? "",
    width: trigger.dataset["lightboxWidth"] ?? img?.getAttribute("width") ?? null,
    height: trigger.dataset["lightboxHeight"] ?? img?.getAttribute("height") ?? null,
  };
}

export function initLightbox(): void {
  const parts = resolveParts();
  if (!parts) return;

  const { dialog, image, caption, closeButton, prevButton, nextButton } = parts;
  const triggers = Array.from(
    document.querySelectorAll<HTMLButtonElement>("[data-showcase-trigger]"),
  );
  if (triggers.length === 0) return;

  const root = document.documentElement;
  let previousOverflow = "";
  let currentIndex = 0;
  let lastTrigger: HTMLButtonElement | null = null;
  let swapTimer: ReturnType<typeof setTimeout> | null = null;

  const isRtl = (): boolean => root.dir === "rtl";

  const clearSwapping = (): void => {
    image.classList.remove("is-swapping");
    if (swapTimer !== null) {
      clearTimeout(swapTimer);
      swapTimer = null;
    }
  };

  const render = (): void => {
    const trigger = triggers[currentIndex];
    if (!trigger) return;
    const next = readTrigger(trigger);
    const changed = next.src !== image.getAttribute("src");
    clearSwapping();
    if (changed && dialog.open) {
      image.classList.add("is-swapping");
      // Guarantee the fade class never sticks if load/error never fires
      // (e.g. navigating again before the image finishes loading).
      swapTimer = setTimeout(clearSwapping, 400);
    }
    image.src = next.src;
    image.alt = next.alt;
    if (next.width) image.setAttribute("width", next.width);
    if (next.height) image.setAttribute("height", next.height);
    caption.textContent = next.alt;
  };

  image.addEventListener("load", clearSwapping);
  image.addEventListener("error", clearSwapping);

  const lockScroll = (): void => {
    previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
  };

  const unlockScroll = (): void => {
    root.style.overflow = previousOverflow;
  };

  const CLOSE_MS = 200;

  const close = (): void => {
    if (!dialog.open) return;
    // Guard against double-close paths (Escape + button + cancel).
    if (dialog.dataset["closing"] === "1") return;
    dialog.dataset["closing"] = "1";
    // Fade out while the dialog is still open and in the top layer — closing
    // early drops it out of the top layer and snaps its layout off-center
    // (owner-reported glitch: image jumps sideways during the fade).
    dialog.classList.add("is-closing");
    window.setTimeout(() => {
      dialog.classList.remove("is-closing");
      delete dialog.dataset["closing"];
      dialog.close();
    }, CLOSE_MS);
  };

  const open = (trigger: HTMLButtonElement): void => {
    const index = triggers.indexOf(trigger);
    if (index < 0) return;
    currentIndex = index;
    lastTrigger = trigger;
    render();
    lockScroll();
    if (!dialog.open) {
      dialog.showModal();
    }
    closeButton.focus();
  };

  const step = (delta: number): void => {
    if (triggers.length < 2) return;
    currentIndex = (currentIndex + delta + triggers.length) % triggers.length;
    render();
  };

  triggers.forEach((trigger) => {
    trigger.addEventListener("click", () => open(trigger));
  });

  closeButton.addEventListener("click", close);

  prevButton?.addEventListener("click", () => {
    step(isRtl() ? 1 : -1);
  });

  nextButton?.addEventListener("click", () => {
    step(isRtl() ? -1 : 1);
  });

  dialog.addEventListener("click", (event) => {
    // The dialog itself is the full-viewport backdrop; its inner panel stops
    // the event naturally, so a direct target means the user clicked outside.
    if (event.target === dialog) close();
  });

  dialog.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
      return;
    }
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(isRtl() ? 1 : -1);
      return;
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(isRtl() ? -1 : 1);
    }
  });

  // Native Escape handling fires `cancel`; prevent the default and route it
  // through the same close path so focus restoration always runs.
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close();
  });

  dialog.addEventListener("close", () => {
    unlockScroll();
    // preventScroll stops the browser from jumping the page back to the
    // thumbnail while the lightbox is still fading out (owner-reported glitch).
    lastTrigger?.focus({ preventScroll: true });
  });
}

import { useEffect, useId } from "react";

/**
 * Animated launch screen. The three ribbon bands drop in one after another,
 * a soft glow breathes behind them, then the wordmark rises into place and a
 * thin spectrum line sweeps underneath. All motion is CSS (see index.css) and
 * is disabled for people who prefer reduced motion.
 */
export default function Splash({ leaving }: { leaving: boolean }) {
  const gradientId = useId();

  // Android keeps its (blank, dark) system splash until the first web frame
  // exists, so there is no white flash or icon swap before this animation.
  useEffect(() => {
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => window.TaifAndroid?.appReady()),
    );
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      role="status"
      aria-label="TAIF"
      data-leaving={leaving}
      className="splash fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-background"
    >
      <div className="splash-glow" aria-hidden />

      <svg
        viewBox="0 0 48 48"
        className="splash-mark h-28 w-28 sm:h-32 sm:w-32"
        fill="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="8" y1="8" x2="40" y2="40">
            <stop stopColor="hsl(var(--spectra-start))" />
            <stop offset=".5" stopColor="hsl(var(--spectra-mid))" />
            <stop offset="1" stopColor="hsl(var(--spectra-end))" />
          </linearGradient>
        </defs>
        <g className="splash-band" style={{ ["--i" as string]: 0 }}>
          <path d="M9 14a5 5 0 0 1 5-5h5v20a5 5 0 0 1-10 0Z" fill={`url(#${gradientId})`} />
          <path d="M14 9h5v20a5 5 0 0 1-5 5Z" fill="#fff" opacity=".18" />
        </g>
        <g className="splash-band" style={{ ["--i" as string]: 1 }}>
          <path d="M19 14a5 5 0 0 1 5-5h5v26a5 5 0 0 1-10 0Z" fill={`url(#${gradientId})`} />
          <path d="M24 9h5v26a5 5 0 0 1-5 5Z" fill="#fff" opacity=".18" />
        </g>
        <g className="splash-band" style={{ ["--i" as string]: 2 }}>
          <path d="M29 19a5 5 0 0 1 5-5h5v15a5 5 0 0 1-10 0Z" fill={`url(#${gradientId})`} />
          <path d="M34 14h5v15a5 5 0 0 1-5 5Z" fill="#fff" opacity=".18" />
        </g>
      </svg>

      <div className="splash-word mt-8 flex items-center gap-3 text-foreground">
        <span dir="ltr" className="text-[22px] font-extrabold tracking-[0.32em]">
          TAIF
        </span>
        <span aria-hidden className="h-5 w-px bg-border" />
        <span lang="ar" className="text-[20px] font-semibold text-muted-foreground">
          طَيْف
        </span>
      </div>

      <div className="splash-track mt-10" aria-hidden>
        <span />
      </div>
    </div>
  );
}

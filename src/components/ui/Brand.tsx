import { useId } from "react";
import { cn } from "@/utils/cn";

/**
 * TAIF mark — a spectrum folded into three descending bands that read as
 * waveform, frame sequence and the cadence of طَيْف.
 */
export function TaifMark({ className, mono = false }: { className?: string; mono?: boolean }) {
  const gradientId = useId();
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="TAIF"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="hsl(var(--spectra-start))" />
          <stop offset=".5" stopColor="hsl(var(--spectra-mid))" />
          <stop offset="1" stopColor="hsl(var(--spectra-end))" />
        </linearGradient>
      </defs>
      <path
        d="M9 14a5 5 0 0 1 5-5h5v20a5 5 0 0 1-10 0Zm10 0a5 5 0 0 1 5-5h5v26a5 5 0 0 1-10 0Zm10 5a5 5 0 0 1 5-5h5v15a5 5 0 0 1-10 0Z"
        fill={mono ? "currentColor" : `url(#${gradientId})`}
      />
      <path
        d="M14 9h5v20a5 5 0 0 1-5 5Zm10 0h5v26a5 5 0 0 1-5 5Zm10 5h5v15a5 5 0 0 1-5 5Z"
        fill="currentColor"
        opacity=".18"
      />
    </svg>
  );
}

/**
 * Compact brand lock-up for the header: mark + TAIF + طَيْف.
 */
export function Brand({ className }: { className?: string }) {
  return (
    <div className={cn("flex select-none items-center gap-2.5", className)}>
      <TaifMark className="h-[30px] w-[30px] text-foreground" />
      <span dir="ltr" className="text-sm font-bold leading-none tracking-[0.16em] text-foreground">
        TAIF
      </span>
      <span aria-hidden className="h-[18px] w-px bg-border" />
      <span className="text-[13px] font-medium leading-none text-muted-foreground" lang="ar">
        طَيْف
      </span>
    </div>
  );
}

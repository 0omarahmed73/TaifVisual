import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

interface SettingsRowProps {
  icon: ReactNode;
  title: string;
  description?: string;
  /** Id of the control this row labels (for the visible label). */
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}

/**
 * One line of the settings list: icon tile, title + helper text, and the
 * control pinned to the end edge (flips automatically in RTL).
 */
export function SettingsRow({
  icon,
  title,
  description,
  htmlFor,
  children,
  className,
}: SettingsRowProps) {
  return (
    <div
      className={cn(
        "flex min-h-[64px] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
        className,
      )}
    >
      <span
        aria-hidden
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--spectra-end))] [&_svg]:h-[18px] [&_svg]:w-[18px]"
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 text-start">
        <label
          htmlFor={htmlFor}
          className="truncate text-sm font-semibold leading-tight"
        >
          {title}
        </label>
        {description && (
          <span className="truncate text-xs leading-snug text-muted-foreground">
            {description}
          </span>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

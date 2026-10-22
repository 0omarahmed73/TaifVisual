import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Check, FileText, Info } from "lucide-react";

import { cn } from "@/utils/cn";

/** Small uppercase cyan label that opens every screen. */
export function Eyebrow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.14em] text-[hsl(var(--spectra-end))] [&:lang(ar)]:tracking-normal",
        className,
      )}
    >
      {children}
    </span>
  );
}

type BtnKind = "primary" | "secondary" | "quiet";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: BtnKind;
  icon?: ReactNode;
}

const btnKinds: Record<BtnKind, string> = {
  primary: "bg-primary text-primary-foreground",
  secondary: "border-border bg-secondary text-foreground",
  quiet: "bg-transparent text-muted-foreground hover:text-foreground",
};

/** Design-system button: 40px high, 8px radius, 13px bold. */
export function Btn({
  kind = "primary",
  icon,
  className,
  children,
  type = "button",
  ...props
}: BtnProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-transparent px-4 text-[13px] font-bold transition-all duration-150",
        "hover:-translate-y-px hover:brightness-110 active:translate-y-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-40",
        btnKinds[kind],
        className,
      )}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

/** Screen heading: step eyebrow, 27px title, helper text, optional trailing slot. */
export function StageHead({
  step,
  title,
  desc,
  extra,
}: {
  step: string;
  title: string;
  desc: string;
  extra?: ReactNode;
}) {
  return (
    <header className="mb-6 flex items-start justify-between gap-5">
      <div className="min-w-0 text-start">
        <Eyebrow>{step}</Eyebrow>
        <h1 className="mt-2 text-[27px] font-extrabold leading-[1.15] tracking-[-0.04em] [&:lang(ar)]:tracking-normal">
          {title}
        </h1>
        <p className="mt-1.5 max-w-[500px] text-sm leading-relaxed text-muted-foreground">
          {desc}
        </p>
      </div>
      {extra}
    </header>
  );
}

/** Compact file chip shown at the end of a screen heading. */
export function MiniFile({
  name,
  meta,
}: {
  name: string;
  meta: string;
}) {
  return (
    <aside className="flex min-w-[205px] max-w-[280px] items-center gap-2.5 rounded-[9px] border border-border bg-card px-3 py-2.5 text-[hsl(var(--spectra-end))]">
      <FileText className="h-[18px] w-[18px] shrink-0" />
      <span className="flex min-w-0 flex-col gap-0.5 text-start text-foreground">
        <b className="truncate text-xs font-semibold" dir="auto">
          {name}
        </b>
        <small className="text-[11px] text-muted-foreground">{meta}</small>
      </span>
    </aside>
  );
}

/** Blue informational callout (replaces the old pin/star alert). */
export function Notice({ children }: { children: ReactNode }) {
  return (
    <aside
      role="note"
      className="mt-4 flex gap-2.5 rounded-lg border border-[hsl(var(--spectra-mid)/0.28)] bg-[hsl(var(--spectra-mid)/0.06)] p-3 text-[hsl(var(--spectra-mid))]"
    >
      <Info className="mt-0.5 h-[18px] w-[18px] shrink-0" />
      <div className="text-start text-xs leading-relaxed text-muted-foreground">
        {children}
      </div>
    </aside>
  );
}

/** Bold field label with an optional trailing hint. */
export function FieldLabel({
  children,
  hint,
  htmlFor,
}: {
  children: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <label htmlFor={htmlFor} className="text-sm font-bold">
        {children}
      </label>
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

interface ChoiceGridProps<T extends string> {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode; hint?: ReactNode }[];
  columns?: 2 | 3 | 4;
}

/** Radio-style tile grid used for resolution, quality and format choices. */
export function ChoiceGrid<T extends string>({
  label,
  value,
  onChange,
  options,
  columns = 3,
}: ChoiceGridProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-3",
        columns === 4 && "grid-cols-4",
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex h-[52px] flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-field px-2 text-[13px] font-semibold transition-colors duration-150",
              "hover:border-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected &&
                "border-[hsl(var(--spectra-mid))] bg-[hsl(var(--spectra-mid)/0.08)]",
            )}
          >
            <span className="flex items-center gap-1.5">
              {option.label}
              {selected && <Check className="h-3.5 w-3.5 text-[hsl(var(--spectra-mid))]" />}
            </span>
            {option.hint && (
              <span className="text-[11px] font-normal text-muted-foreground">
                {option.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Rounded bordered panel used for config sections. */
export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-[18px]",
        className,
      )}
    >
      {children}
    </section>
  );
}

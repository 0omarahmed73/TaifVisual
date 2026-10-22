import { ExternalLink, Github, Globe, Info, Linkedin } from "lucide-react";
import { useTranslation } from "react-i18next";

import { openExternal } from "@/utils/openExternal";
import { cn } from "@/utils/cn";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Eyebrow } from "@/components/ui/Stage";

const links = [
  {
    key: "website",
    label: "omarasaeed.dev",
    url: "https://www.omarasaeed.dev/",
    Icon: Globe,
  },
  {
    key: "github",
    label: "github.com/0omarahmed73",
    url: "https://github.com/0omarahmed73",
    Icon: Github,
  },
  {
    key: "linkedin",
    label: "linkedin.com/in/0omarahmed73",
    url: "https://linkedin.com/in/0omarahmed73",
    Icon: Linkedin,
  },
] as const;

/** Header button + dialog with the developer's details and profile links. */
export function AboutDialog({ triggerClassName }: { triggerClassName: string }) {
  const { t, i18n } = useTranslation();

  return (
    <Dialog>
      <DialogTrigger
        aria-label={t("about.title")}
        title={t("about.title")}
        className={triggerClassName}
      >
        <Info size={16} strokeWidth={1.8} />
      </DialogTrigger>
      <DialogContent dir={i18n.dir()} className="max-w-md gap-0 p-6">
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[hsl(var(--spectra-start))] via-[hsl(var(--spectra-mid))] to-[hsl(var(--spectra-end))] text-lg font-extrabold text-[#0d1017]">
            OS
          </span>
          <Eyebrow>{t("about.title")}</Eyebrow>
          <DialogTitle className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">
            <span dir="ltr">Omar A. Saeed</span>
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm">
            {t("about.role")}
          </DialogDescription>
        </div>

        <ul className="mt-6 flex flex-col gap-2">
          {links.map(({ key, label, url, Icon }) => (
            <li key={key}>
              <button
                type="button"
                onClick={() => openExternal(url)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border border-border bg-background/40 p-3 text-start transition-colors",
                  "hover:border-muted-foreground/50 hover:bg-secondary",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--spectra-end))]">
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <b className="text-[13px] font-bold">{t(`about.${key}`)}</b>
                  <small
                    dir="ltr"
                    className="truncate text-start text-xs text-muted-foreground"
                  >
                    {label}
                  </small>
                </span>
                <ExternalLink
                  className="h-4 w-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.8}
                />
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

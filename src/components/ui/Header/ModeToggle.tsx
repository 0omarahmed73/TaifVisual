import { Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { useTheme } from "@/contexts/ThemeProvider";
import { cn } from "@/utils/cn";
import { SettingsRow } from "./SettingsRow";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();
  const { t } = useTranslation();

  const options = [
    { value: "light", label: t("header.lightMode"), icon: Sun },
    { value: "dark", label: t("header.darkMode"), icon: Moon },
    { value: "system", label: t("header.system"), icon: Monitor },
  ] as const;

  return (
    <SettingsRow
      icon={<Palette />}
      title={t("header.settings.appearance")}
      description={t("header.settings.appearanceDesc")}
    >
      <div
        role="radiogroup"
        dir="ltr"
        aria-label={t("header.settings.appearance")}
        className="flex gap-0.5 rounded-lg border border-border bg-background p-0.5"
      >
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={theme === value}
            aria-label={label}
            title={label}
            onClick={() => setTheme(value)}
            className={cn(
              "flex h-8 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              theme === value && "bg-secondary text-foreground shadow-sm",
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </SettingsRow>
  );
}

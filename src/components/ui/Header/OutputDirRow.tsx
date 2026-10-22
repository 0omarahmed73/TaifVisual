import { useEffect, useState } from "react";
import { homeDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { useTranslation } from "react-i18next";
import { FolderDown, RotateCcw } from "lucide-react";

import { SettingsRow } from "./SettingsRow";
import { isTauriRuntime } from "@/utils/tauriEnv";
import { getOutputDirPref, setOutputDirPref } from "@/utils/outputDirPref";

/**
 * Settings row for choosing where finished files are saved. Empty state
 * description points to the media-specific system folders.
 */
export function OutputDirRow() {
  const { t } = useTranslation();
  const [dir, setDir] = useState<string>(() => getOutputDirPref());
  const [home, setHome] = useState("");

  useEffect(() => {
    async function load() {
      if (!isTauriRuntime()) return;
      try {
        setHome(await homeDir());
      } catch {
        // cosmetic only
      }
    }
    load();
  }, []);

  function shorten(path: string): string {
    return home && path.startsWith(home) ? `…${path.slice(home.length)}` : path;
  }

  async function onPick() {
    const picked = await open({
      directory: true,
      multiple: false,
      title: t("header.settings.outputDir"),
    });
    if (typeof picked === "string" && picked) {
      setOutputDirPref(picked);
      setDir(picked);
    }
  }

  function onReset() {
    setOutputDirPref("");
    setDir("");
  }

  return (
    <SettingsRow
      icon={<FolderDown />}
      title={t("header.settings.outputDir")}
      description={
        dir ? shorten(dir) : t("header.settings.outputDirDesc")
      }
    >
      <div className="flex items-center gap-1.5">
        {dir && (
          <button
            aria-label={t("header.settings.resetBtn")}
            title={t("header.settings.resetBtn")}
            onClick={onReset}
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-secondary px-2.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="h-[15px] w-[15px]" strokeWidth={1.8} />
          </button>
        )}
        <button
          onClick={onPick}
          className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-secondary px-3 text-xs font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {t("header.settings.changeBtn")}
        </button>
      </div>
    </SettingsRow>
  );
}

export default OutputDirRow;

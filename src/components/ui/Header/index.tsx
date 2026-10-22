import { ask, message } from "@tauri-apps/plugin-dialog";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useOperationStore } from "@/stores/useOperationStore";
import { resetWorkspace } from "@/utils/resetWorkspace";
import { useFileStore } from "@/stores/useFileStore";

import LanguageSelect from "./LanguageSelect";
import { ModeToggle } from "./ModeToggle";
import NotficationPromptBtn from "./NotficationPromptBtn";
import OutputDirRow from "./OutputDirRow";
import { Brand } from "@/components/ui/Brand";
import { Btn } from "@/components/ui/Stage";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  Bug,
  Check,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { SettingsRow } from "./SettingsRow";

const iconBtn =
  "flex h-[33px] w-[33px] items-center justify-center rounded-lg border border-transparent text-foreground transition-colors hover:border-border hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
const iconProps = { size: 16, strokeWidth: 1.8 } as const;

function Header() {
  const [updateChecking, setUpdateChecking] = useState<boolean | null>(null);
  const [updateDownloading, setUpdateDownloading] = useState<boolean | null>(
    null,
  );
  const [isCopied, setIsCopied] = useState(false);

  const { i18n, t } = useTranslation();
  const { filePath } = useFileStore();
  const { logs, cmdProcessing } = useOperationStore();

  async function onCheckForUpdatesBtnClick() {
    setUpdateChecking(true);
    let update;
    try {
      update = await check();
    } catch (err) {
      console.error("Update check failed:", err);
      setUpdateChecking(null);
      toast.error(t("header.settings.updateFailed"));
      return;
    }
    setUpdateChecking(null);

    if (update?.available) {
      //If there is an update, prompt the user with the update dialog
      const updateAskDialog = await ask(t("updater.updaterMessage"), {
        okLabel: t("updater.okLabel"),
        cancelLabel: t("updater.cancelLabel"),
        title: `${t("updater.updaterTitle")} ${update.version}`,
      });
      //If user clicks the update button
      if (updateAskDialog) {
        setUpdateDownloading(true);
        await update.downloadAndInstall();
        await relaunch();
      }
    } else {
      await message(t("noUpdate.message"), { okLabel: t("noUpdate.okLabel") });
    }
  }

  return (
    <header
      className="fixed top-0 z-30 flex h-[61px] w-full items-center justify-between gap-3 border-b border-border bg-appbar px-[22px]"
      dir={i18n.dir()}
    >
      <div className="flex items-center">
        <Brand />
        <small className="ms-4 hidden border-s border-border ps-4 text-xs text-muted-foreground md:block">
          {t("workspace.tagline")}
        </small>
      </div>
      <div className="flex items-center gap-1">
        {filePath !== "" && (
          <button
            disabled={cmdProcessing}
            aria-label={t("workspace.reset")}
            title={t("workspace.reset")}
            onClick={resetWorkspace}
            className={iconBtn}
          >
            <RefreshCw {...iconProps} />
          </button>
        )}
        <Dialog>
          <DialogTrigger
            aria-label={t("bugModalTitle")}
            title={t("bugModalTitle")}
            className={iconBtn}
          >
            <Bug {...iconProps} />
          </DialogTrigger>
          <DialogContent className="max-w-xl gap-3 bg-card">
            <DialogTitle className="text-start text-base font-semibold">
              {t("bugModalTitle")}
            </DialogTitle>
            <DialogDescription className="text-start">
              {t("bugModalDesc")}
            </DialogDescription>
            <div
              dir="ltr"
              role="log"
              aria-live="polite"
              className="h-[240px] overflow-y-auto rounded-lg border border-border bg-field p-3.5"
            >
              {logs.length === 0 ? (
                <span className="text-xs text-muted-foreground">
                  {t("bugModalEmpty")}
                </span>
              ) : (
                <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-foreground/90">
                  {logs.join("\n")}
                </pre>
              )}
            </div>
            <div className="flex justify-end">
              <Btn
                kind="secondary"
                icon={
                  isCopied ? (
                    <Check className="h-[15px] w-[15px]" />
                  ) : (
                    <Copy className="h-[15px] w-[15px]" />
                  )
                }
                onClick={() => {
                  navigator.clipboard.writeText(logs.join("\n"));
                  setIsCopied(true);
                  setTimeout(function () {
                    setIsCopied(false);
                  }, 2000);
                }}
              >
                {t("bugModalCopyBtn")}
              </Btn>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger
            aria-label={t("settingsBtnTitle")}
            title={t("settingsBtnTitle")}
            className={iconBtn}
          >
            <Settings {...iconProps} />
          </DialogTrigger>
          <DialogContent dir={i18n.dir()} className="max-w-md gap-4 p-5">
            <div className="flex items-start justify-between gap-3 pe-8">
              <div className="flex flex-col gap-1 text-start">
                <DialogTitle className="text-lg">
                  {t("settingsBtnTitle")}
                </DialogTitle>
                <DialogDescription>
                  <span dir="ltr" className="font-semibold tracking-[0.12em]">
                    TAIF
                  </span>{" "}
                  <span lang="ar">طَيْف</span>
                </DialogDescription>
              </div>
            </div>
            <div className="overflow-hidden rounded-xl border border-border bg-background/40">
              <LanguageSelect />
              <ModeToggle />
              <OutputDirRow />
              <NotficationPromptBtn />
              <SettingsRow
                icon={<Download />}
                title={t("header.settings.updates")}
                description={t("header.settings.updatesDesc")}
              >
                <button
                  onClick={onCheckForUpdatesBtnClick}
                  disabled={updateChecking === true || updateDownloading === true}
                  className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-secondary px-3 text-xs font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {(updateChecking || updateDownloading) && (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  )}
                  {updateDownloading && t("header.updateDownloading")}
                  {updateChecking && t("header.updateLoading")}
                  {!updateChecking &&
                    !updateDownloading &&
                    t("header.settings.checkNow")}
                </button>
              </SettingsRow>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}

export default Header;

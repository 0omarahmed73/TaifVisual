import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { TaifMark } from "@/components/ui/Brand";
import { Notice } from "@/components/ui/Stage";
import { isTauriRuntime } from "@/utils/tauriEnv";

function OnBoardDialog() {
  const [appVersion, setAppVersion] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(() => {
    return localStorage.getItem("onboard");
  });
  const { t, i18n } = useTranslation();

  useEffect(() => {
    async function getAppVersion() {
      if (!isTauriRuntime()) return;
      try {
        setAppVersion(await getVersion());
      } catch {
        setAppVersion("");
      }
    }
    getAppVersion();
  }, []);

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open === false) {
          localStorage.setItem("onboard", "");
          setIsDialogOpen("");
        }
      }}
      open={isDialogOpen === "" ? false : true}
    >
      <DialogContent dir={i18n.dir()} className="max-w-md gap-3.5 bg-card">
        <DialogHeader className="flex flex-col items-center gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <TaifMark className="h-12 w-12 text-foreground" />
            <DialogTitle className="flex items-center gap-2 text-sm font-bold tracking-[0.16em]">
              <span dir="ltr">TAIF</span>
              <span aria-hidden className="h-4 w-px bg-border" />
              <span className="font-medium tracking-normal text-muted-foreground" lang="ar">
                طَيْف
              </span>
            </DialogTitle>
          </div>
          {appVersion && (
            <span dir="ltr" className="text-xs text-muted-foreground">
              v{appVersion}
            </span>
          )}
        </DialogHeader>
        <div className="rounded-lg border border-border bg-field p-3.5 text-start text-sm leading-relaxed">
          <p>{t("onboard.greetings")}</p>
          <ul className="ms-4 mt-2 list-disc space-y-1 text-muted-foreground">
            <li>{t("onboard.goals.simplicity")}</li>
            <li>{t("onboard.goals.speed")}</li>
            <li>{t("onboard.goals.privacy")}</li>
          </ul>
        </div>
        <p className="text-start text-sm leading-relaxed text-muted-foreground">
          {t("onboard.features")}
        </p>
        <Notice>{t("onboard.steps")}</Notice>
      </DialogContent>
    </Dialog>
  );
}

export default OnBoardDialog;

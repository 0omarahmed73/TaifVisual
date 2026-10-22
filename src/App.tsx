import { ask } from "@tauri-apps/plugin-dialog";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { isTauriRuntime } from "./utils/tauriEnv";

import { ThemeProvider } from "./contexts/ThemeProvider";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useOperationStore } from "./stores/useOperationStore";

import FileUpload from "./components/screens/FileUpload";
import Header from "./components/ui/Header";
import Operation from "./components/screens/Operation";
import Workspace from "./components/screens/Workspace";
import { useFileStore } from "./stores/useFileStore";
import { Toaster } from "./components/ui/Sonner";
import ErrorBoundary from "./components/ui/ErrorBoundary";

function App() {
  const { operationType } = useOperationStore();
  const filePath = useFileStore((s) => s.filePath);
  const { t, i18n } = useTranslation();

  //Remove context menu
  useEffect(() => {
    const preventContextMenu = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("contextmenu", preventContextMenu);
    return () => document.removeEventListener("contextmenu", preventContextMenu);
  }, []);

  useEffect(() => {
    async function checkForUpdates() {
      //Prevent checking for updates if user clicked on the no thanks button
      if (!isTauriRuntime() || localStorage.getItem("update")) return;

      let update;
      try {
        update = await check();
      } catch (err) {
        //Offline or updater endpoint unreachable, nothing to prompt about
        console.warn("Update check failed:", err);
        return;
      }

      if (update?.available) {
        //If there is an update, prompt the user with the update dialog
        const updateAskDialog = await ask(t("updater.updaterMessage"), {
          okLabel: t("updater.okLabel"),
          cancelLabel: t("updater.cancelLabel"),
          title: `${t("updater.updaterTitle")} ${update.version}`,
        });
        //If user clicks the update button
        if (updateAskDialog) {
          await update.downloadAndInstall();
          await relaunch();
        } else localStorage.setItem("update", "cancel");
      }
    }
    checkForUpdates();
  }, [t]);

  return (
    <ThemeProvider defaultTheme="dark" storageKey="theme">
      <Header />
      <footer
        dir={i18n.dir()}
        className="fixed inset-x-0 bottom-0 z-30 flex h-[29px] items-center justify-between border-t border-border bg-appbar px-[18px] text-[11px] text-muted-foreground"
      >
        <span>{t("workspace.footer")}</span>
        <span dir="ltr">TAIF · طَيْف</span>
      </footer>
      <Toaster dir={i18n.dir()} richColors position="top-center" />
      {/* If operationType path is asigned show tabs, or else show file uploader screen */}
      <ErrorBoundary>
        {filePath === "" && <FileUpload />}
        {filePath !== "" && !operationType && <Workspace />}
        {filePath !== "" && operationType && <Operation />}
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

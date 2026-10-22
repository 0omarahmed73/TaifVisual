import { ask } from "@tauri-apps/plugin-dialog";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { isTauriRuntime } from "./utils/tauriEnv";
import { isAndroid } from "./utils/platform";
import { resetWorkspace } from "./utils/resetWorkspace";

import { ThemeProvider } from "./contexts/ThemeProvider";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOperationStore } from "./stores/useOperationStore";

import FileUpload from "./components/screens/FileUpload";
import Header from "./components/ui/Header";
import Operation from "./components/screens/Operation";
import Workspace from "./components/screens/Workspace";
import { useFileStore } from "./stores/useFileStore";
import { Toaster } from "./components/ui/Sonner";
import ErrorBoundary from "./components/ui/ErrorBoundary";
import Splash from "./components/ui/Splash";

function App() {
  const { operationType } = useOperationStore();
  const filePath = useFileStore((s) => s.filePath);

  // Animated launch screen: shown briefly, then fades out
  const [splash, setSplash] = useState<"show" | "leaving" | "gone">("show");
  useEffect(() => {
    const leave = setTimeout(() => setSplash("leaving"), 2300);
    const gone = setTimeout(() => setSplash("gone"), 2750);
    return () => {
      clearTimeout(leave);
      clearTimeout(gone);
    };
  }, []);

  // Android Back button: step back through the app instead of closing it.
  useEffect(() => {
    if (!isAndroid()) return;
    window.__taifBack = () => {
      // 1. close an open dialog / menu
      if (document.querySelector('[role="dialog"][data-state="open"]')) {
        document.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
        );
        return true;
      }
      // 2. processing / result view
      if (document.querySelector("[data-stage-overlay]")) {
        window.dispatchEvent(new Event("taif-overlay-back"));
        return true;
      }
      // 3. step back through the flow
      const operation = useOperationStore.getState();
      if (operation.operationType) {
        operation.setOperationType(null);
        return true;
      }
      if (useFileStore.getState().filePath !== "") {
        if (operation.workspaceStep === "tools") operation.setWorkspaceStep("review");
        else resetWorkspace();
        return true;
      }
      return false; // already on the first screen: let Android exit
    };
    return () => {
      window.__taifBack = undefined;
    };
  }, []);
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
      // The updater plugin only exists on desktop builds
      if (!isTauriRuntime() || isAndroid() || localStorage.getItem("update"))
        return;

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
        <span className="truncate">{t("workspace.footer")}</span>
        <span dir="ltr" className="hidden sm:inline">TAIF · طَيْف</span>
      </footer>
      <Toaster dir={i18n.dir()} richColors position="top-center" />
      {/* If operationType path is asigned show tabs, or else show file uploader screen */}
      {splash !== "gone" && <Splash leaving={splash === "leaving"} />}
      <ErrorBoundary>
        {filePath === "" && <FileUpload />}
        {filePath !== "" && !operationType && <Workspace />}
        {filePath !== "" && operationType && <Operation />}
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

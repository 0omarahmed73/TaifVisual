import {
  isPermissionGranted,
  requestPermission,
} from "@tauri-apps/plugin-notification";
import { BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { isTauriRuntime } from "@/utils/tauriEnv";
import { Switch } from "../Switch";
import { SettingsRow } from "./SettingsRow";

function NotficationPromptBtn() {
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null,
  );
  const { t } = useTranslation();

  useEffect(() => {
    async function checkPermissionState() {
      if (!isTauriRuntime()) return;
      try {
        setPermissionGranted(await isPermissionGranted());
      } catch {
        setPermissionGranted(false);
      }
    }
    checkPermissionState();
  }, []);

  async function onRequestNotificationPermission() {
    try {
      const result = await requestPermission();
      if (result === "granted") setPermissionGranted(true);
    } catch {
      setPermissionGranted(false);
    }
  }

  return (
    <SettingsRow
      icon={<BellRing />}
      title={t("header.notificationLabel")}
      description={t("header.settings.notificationsDesc")}
      htmlFor="settings-notifications"
    >
      <Switch
        id="settings-notifications"
        dir="ltr"
        checked={permissionGranted === true}
        // Permission can only be granted here; revoking is an OS setting.
        disabled={permissionGranted === true}
        onCheckedChange={onRequestNotificationPermission}
      />
    </SettingsRow>
  );
}

export default NotficationPromptBtn;

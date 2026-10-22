import { useTranslation } from "react-i18next";

import ExecuteBtn from "@/components/ui/ExecuteBtn";
import { Notice } from "../Stage";

function RemoveMusic() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col">
      <Notice>
        <b className="block text-foreground">{t("removeMusic.noticeTitle")}</b>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          <li>{t("removeMusic.notice1")}</li>
          <li>{t("removeMusic.notice2")}</li>
          <li>{t("removeMusic.notice3")}</li>
        </ul>
      </Notice>
      <ExecuteBtn isSpleeter text={t("operations.spleeterBtn")} />
    </div>
  );
}

export default RemoveMusic;

import { appLocalDataDir, join } from "@tauri-apps/api/path";
import { BaseDirectory, writeTextFile } from "@tauri-apps/plugin-fs";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFileStore } from "@/stores/useFileStore";

import {
  arabicNums2EnglishNums,
  getNearestTimestamp,
} from "@/utils/ffmpegHelperUtils";

import AVPlayer from "../AVPlayer";
import ExecuteBtn from "@/components/ui/ExecuteBtn";
import { FieldLabel } from "@/components/ui/Stage";

function Cut() {
  const { filePath, duration } = useFileStore();
  // Start with a middle section selected; removing the whole file is never useful
  const [cutTimestamps, setCutTimestamps] = useState<[number, number]>([
    duration * 0.25,
    duration * 0.5,
  ]);
  const [txtFilePath, setTxtFilePath] = useState("");

  const { t } = useTranslation();

  //this text file basically is for the cutting timestamps
  useEffect(() => {
    async function getTxtFilePath() {
      const txtFilePath = await appLocalDataDir();
      const path = await join(txtFilePath, "inputTxtFiles");
      setTxtFilePath(path);
    }
    getTxtFilePath();
  }, []);

  return (
    <div className="flex flex-col">
      <FieldLabel>{t("workspace.cutField")}</FieldLabel>
      <AVPlayer
        cutType="cut"
        cutTimestamps={cutTimestamps}
        setCutTimestamps={setCutTimestamps}
      />
      <ExecuteBtn
        text={t("operations.cutBtn")}
        customFunction={async () => {
          const { nearestTS1, nearestTS2 } = await getNearestTimestamp(
            filePath,
            [
              arabicNums2EnglishNums(cutTimestamps[0]),
              arabicNums2EnglishNums(cutTimestamps[1]),
            ],
          );
          // ffmpeg concat syntax: escape single quotes inside quoted paths
          const concatPath = filePath.replace(/'/g, "'\\''");
          await writeTextFile(
            "inputTxtFiles/input.txt",
            `file '${concatPath}'
outpoint ${nearestTS1}
file '${concatPath}'
inpoint ${nearestTS2}`,
            {
              baseDir: BaseDirectory.AppLocalData,
            },
          );
        }}
        command={[
          "-f",
          "concat",
          "-safe",
          "0",
          "-i",
          `${txtFilePath}/input.txt`,
          "-c",
          "copy",
        ]}
      />
    </div>
  );
}

export default Cut;

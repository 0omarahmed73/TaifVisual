import { RefObject, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Gauge, Pause, Play } from "lucide-react";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import CutTimestampsInput from "./CutTimestampsInput";
import { Select, SelectItem, SelectContent, SelectTrigger } from "../Select";

interface Props {
  AVElRef: RefObject<HTMLVideoElement> | RefObject<HTMLAudioElement>;
  sliderElRef: RefObject<HTMLInputElement>;
  AVPaused: boolean;
  AVCurrDurationPer: number;
  setAVCurrDurationPer: React.Dispatch<React.SetStateAction<number>>;
  cutType: "cut" | "trim";
  cutTimestamps: [number, number];
  setCutTimestamps: React.Dispatch<React.SetStateAction<[number, number]>>;
  startTimestampElRef: RefObject<HTMLInputElement>;
  endTimestampElRef: RefObject<HTMLInputElement>;
}

const controlChip =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-foreground transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40";

function AVControls({
  AVElRef,
  sliderElRef,
  AVPaused,
  AVCurrDurationPer,
  setAVCurrDurationPer,
  cutType,
  cutTimestamps,
  setCutTimestamps,
  startTimestampElRef,
  endTimestampElRef,
}: Props) {
  const AVControlsElRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  //AV play and pause toggle
  function playPauseToggle() {
    const playback = AVPaused === true ? AVElRef.current?.play() : AVElRef.current?.pause();
    // A failed play() (unresolvable source, decode error) must be visible.
    playback?.catch((err) => {
      toast.error(`Playback failed: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  //Handle slider input sliding
  function onSliderInput(e: React.FormEvent<HTMLInputElement>) {
    const currentValue = Number(e.currentTarget.value);

    if (!AVElRef.current) return;
    if (!sliderElRef.current) return;
    // Convert percentage to seconds
    const timeInSeconds = (currentValue / 100) * AVElRef.current.duration;

    if (cutType === "cut") {
      // prevent entering the cut region
      if (
        timeInSeconds > cutTimestamps[0] &&
        timeInSeconds < cutTimestamps[1]
      ) {
        // If coming from left, snap to left boundary
        if (AVElRef.current.currentTime <= cutTimestamps[0]) {
          const startPercentage =
            (cutTimestamps[0] / AVElRef.current.duration) * 100;
          setAVCurrDurationPer(startPercentage);

          sliderElRef.current.value = String(startPercentage);

          AVElRef.current.currentTime = cutTimestamps[0];
        } else {
          // If coming from right, snap to right boundary
          const endPercentage =
            (cutTimestamps[1] / AVElRef.current.duration) * 100;
          setAVCurrDurationPer(endPercentage);

          sliderElRef.current.value = String(endPercentage);

          AVElRef.current.currentTime = cutTimestamps[1];
        }
        return;
      }
    } else {
      // Original cutting logic
      if (timeInSeconds < cutTimestamps[0]) {
        const startPercentage =
          (cutTimestamps[0] / AVElRef.current.duration) * 100;
        setAVCurrDurationPer(startPercentage);

        sliderElRef.current.value = String(startPercentage);

        AVElRef.current.currentTime = cutTimestamps[0];
        return;
      }

      if (timeInSeconds > cutTimestamps[1]) {
        const endPercentage =
          (cutTimestamps[1] / AVElRef.current.duration) * 100;
        setAVCurrDurationPer(endPercentage);

        sliderElRef.current.value = String(endPercentage);

        AVElRef.current.currentTime = cutTimestamps[1];
        return;
      }
    }

    // If within allowed region, proceed normally
    setAVCurrDurationPer(currentValue);
    if (sliderElRef.current) {
      sliderElRef.current.value = String(currentValue);
    }
    // The element reports NaN until metadata loads (e.g. an unsupported codec)
    if (Number.isFinite(timeInSeconds)) AVElRef.current.currentTime = timeInSeconds;
  }

  // Played portion of the timeline, shown as a solid spectral fill.
  const playedPercent = Math.max(0, Math.min(100, AVCurrDurationPer || 0));

  return (
    <div
      dir="ltr"
      ref={AVControlsElRef}
      className="z-[5] mb-5 flex items-center gap-1"
    >
      <div className="flex w-full flex-col items-center justify-center">
        <div className="mb-3.5 flex w-full flex-row items-center justify-between">
          <div className="flex flex-row items-center gap-1.5">
            <button
              onClick={playPauseToggle}
              aria-label={t("playBtnTitle")}
              title={t("playBtnTitle")}
              className={cn(controlChip, "active:scale-90")}
            >
              {!AVPaused ? (
                <Pause className="h-[17px] w-[17px]" fill="currentColor" />
              ) : (
                <Play
                  className="h-[17px] w-[17px] translate-x-[2px]"
                  fill="currentColor"
                />
              )}
            </button>
            <Select
              onValueChange={(value) => {
                if (AVElRef.current)
                  AVElRef.current.playbackRate = parseFloat(value);
              }}
            >
              <SelectTrigger
                aria-label={t("playbackSpeedBtnTitle")}
                title={t("playbackSpeedBtnTitle")}
                className={cn(controlChip, "w-auto")}
              >
                <Gauge className="h-[17px] w-[17px]" strokeWidth={1.8} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1×</SelectItem>
                <SelectItem value="1.25">1.25×</SelectItem>
                <SelectItem value="1.5">1.5×</SelectItem>
                <SelectItem value="1.75">1.75×</SelectItem>
                <SelectItem value="2">2×</SelectItem>
                <SelectItem value="2.5">2.5×</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <CutTimestampsInput
              cutType={cutType}
              cutTimestamps={cutTimestamps}
              setCutTimestamps={setCutTimestamps}
              startTimestampElRef={startTimestampElRef}
              endTimestampElRef={endTimestampElRef}
              AVElRef={AVElRef}
            />
          </div>
        </div>
        <div className="relative flex w-full items-center">
          {/* AV timeline: 6px spectral play line inside a 14px hit area */}
          <input
            onInput={onSliderInput}
            max="100"
            min="0"
            step="0.01"
            type="range"
            ref={sliderElRef}
            defaultValue="0"
            aria-label={t("playbackPositionTitle")}
            className="taif-timeline z-[4] cursor-pointer select-none"
            style={{
              backgroundImage: `linear-gradient(to right, hsl(var(--spectra-mid)) ${playedPercent}%, hsl(var(--secondary)) ${playedPercent}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default AVControls;

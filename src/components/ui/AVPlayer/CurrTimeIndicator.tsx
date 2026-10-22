import { RefObject } from "react";

import formatTimestamp from "@/utils/timestampFormatter";

interface CurrTimeIndicatorProps {
  AVCurrDurationPer: number;
  AVElRef: RefObject<HTMLVideoElement> | RefObject<HTMLAudioElement>;
  sliderElRef: RefObject<HTMLInputElement>;
}

export default function CurrTimeIndicator({
  AVCurrDurationPer,
  AVElRef,
  sliderElRef,
}: CurrTimeIndicatorProps) {
  return (
    <>
      {/* Playhead: slim spectral marker + directional notch above the timeline */}
      <div
        className="pointer-events-none absolute top-[56px] z-10 h-7 w-[3px] rounded-full bg-[hsl(var(--spectra-mid))]"
        style={{ left: `${sliderElRef.current?.value || 0}%` }}
      />
      <div
        className="pointer-events-none absolute top-[48px] z-10 h-0 w-0 -translate-x-[5px] border-x-[6px] border-t-[9px] border-x-transparent border-t-[hsl(var(--spectra-mid))]"
        style={{ left: `${sliderElRef.current?.value || 0}%` }}
      />
      <p
        className="pointer-events-none absolute top-[88px] rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-semibold shadow-sm"
        style={{ left: `${AVCurrDurationPer || 0}%` }}
        dir="ltr"
      >
        {formatTimestamp(AVElRef.current?.currentTime || 0)}
      </p>
    </>
  );
}

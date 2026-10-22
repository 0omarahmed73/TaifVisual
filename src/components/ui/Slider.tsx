import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/utils/cn";

interface SliderProps {
  doubleThumbs?: boolean;
  cutType?: "cut" | "trim";
}

/**
 * Range control. The double-thumb variant reads as a waveform-style
 * timeline: tick pattern, spectral range for kept regions (trim) and a
 * destructive range for the removed middle section (cut).
 */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & SliderProps
>(({ className, cutType, doubleThumbs = false, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track
      className={cn(
        "relative w-full grow overflow-hidden rounded-lg",
        doubleThumbs ? "h-6" : "h-2 rounded-full",
        doubleThumbs &&
          "bg-secondary [background-image:repeating-linear-gradient(90deg,hsl(var(--muted-foreground)/0.35)_0_2px,transparent_2px_6px)]",
      )}
    >
      <SliderPrimitive.Range
        className={cn(
          "absolute h-full rounded-sm",
          doubleThumbs
            ? cutType === "cut"
              ? "bg-destructive/80"
              : "bg-[hsl(var(--spectra-mid)/0.45)]"
            : "bg-spectra",
        )}
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className={cn(
        "block ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        doubleThumbs
          ? "h-7 w-[5px] rounded-full bg-foreground shadow-md hover:bg-[hsl(var(--spectra-mid))]"
          : "h-5 w-5 rounded-full border-2 border-primary bg-background",
      )}
    />
    {doubleThumbs && (
      <SliderPrimitive.Thumb className="block h-7 w-[5px] rounded-full bg-foreground shadow-md transition-colors hover:bg-[hsl(var(--spectra-mid))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    )}
  </SliderPrimitive.Root>
));
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };

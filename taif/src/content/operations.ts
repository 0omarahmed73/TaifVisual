/**
 * The six operations, exactly as verified against the app source (research.md §1).
 *
 * Availability evidence — src/components/screens/Workspace/index.tsx:147-159:
 *   line 147-148: isAvMedia = AUDIO || VIDEO
 *   line 153:     SPLEETER only when platformName !== null && platformName !== "macos" && isAvMedia
 *   line 156:     TRIM, CUT   only when isAvMedia
 *   line 157:     COMPRESS    only when mediaType === VIDEO
 *   line 158:     CONVERT always            (line 152: QUALITY_DOWNGRADE always)
 */
export type MediaType = "audio" | "video" | "image";

export interface Operation {
  id: "remove-music" | "trim" | "cut" | "compress" | "convert" | "quality";
  appliesTo: MediaType[];
  /** Availability restriction; null when offered everywhere. */
  availability: "not-on-macos" | null;
}

export const operations: readonly Operation[] = [
  {
    // Workspace/index.tsx:153 — offered only when platform is known, not macOS, and media is audio/video.
    id: "remove-music",
    appliesTo: ["audio", "video"],
    availability: "not-on-macos",
  },
  {
    // Workspace/index.tsx:156 — audio/video only.
    id: "trim",
    appliesTo: ["audio", "video"],
    availability: null,
  },
  {
    // Workspace/index.tsx:156 — audio/video only.
    id: "cut",
    appliesTo: ["audio", "video"],
    availability: null,
  },
  {
    // Workspace/index.tsx:157 — video only.
    id: "compress",
    appliesTo: ["video"],
    availability: null,
  },
  {
    // Workspace/index.tsx:158 — always offered.
    id: "convert",
    appliesTo: ["audio", "video", "image"],
    availability: null,
  },
  {
    // Workspace/index.tsx:152 — always offered.
    id: "quality",
    appliesTo: ["audio", "video", "image"],
    availability: null,
  },
];

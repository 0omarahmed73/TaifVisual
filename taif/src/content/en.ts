import type { Dictionary } from "./types";

/**
 * English dictionary. Structure complete; strings are filled in by each
 * user story's copy tasks (see tasks.md).
 */
export const en: Dictionary = {
  meta: {
    title: "TAIF — Free, local-first media tools",
    description:
      "TAIF is a free and open-source desktop app for trimming, cutting, compressing, converting and cleaning audio, video and image files entirely on your device.",
    ogLocale: "en_US",
    ogLocaleAlternate: "ar",
  },
  aria: {
    skipToContent: "Skip to content",
    mainMenu: "Main menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    languageSwitch: "Language switch",
  },
  nav: {
    links: [
      { id: "features", label: "Features" },
      { id: "how-it-works", label: "How it works" },
      { id: "downloads", label: "Downloads" },
      { id: "about", label: "About" },
      { id: "faq", label: "FAQ" },
    ],
  },
  hero: {
    name: "TAIF · طَيْف",
    tagline: "Free, local-first media tools",
    body: "Trim, cut, compress and convert audio, video and images without ever leaving your device.",
    primaryAction: "Download",
    secondaryAction: "See the features",
    // Evidence: README (free, GPL-3.0, "No servers, no accounts", runs on device).
    downloadFor: "Download for {platform}",
    highlights: ["Free and open source", "Runs on your device", "No account needed"],
  },
  showcase: {
    heading: "Showcase",
    comingSoon: "Screenshots are coming soon",
    tabs: { desktop: "Desktop", android: "Android", label: "Choose a platform" },
    lightbox: {
      close: "Close",
      previous: "Previous screenshot",
      next: "Next screenshot",
      enlarge: "Enlarge screenshot: {alt}",
      dialogLabel: "Screenshot preview",
    },
  },
  features: {
    heading: "Features",
    intro: "Six core operations, all processed on your device.",
    applyTo: {
      audio: "Audio",
      video: "Video",
      image: "Image",
    },
    availability: {
      "not-on-macos": "Not offered on macOS.",
    },
    detailsLabel: "Details",
    // Source: locales/en.json removeMusic.notice1–notice3 (the app's own
    // notices) + HANDOFF.md and src/hooks/useSpleeter.tsx (the separation
    // engine runs locally on the device, including Android).
    removeMusicNotices: [
      "This operation uses AI and runs entirely on your device. It can make mistakes when recognizing music.",
      "It can also remove noise and background sounds.",
      "There is no length limit: it works with audio and video of any length.",
    ],
    // Per-operation copy. Trim/Cut wording follows the app's own copy in
    // locales/en.json (opDetails.trim / opDetails.cut) — verified source.
    operations: {
      // Workspace/index.tsx:153 — audio/video, on-device separation engine (HANDOFF.md).
      "remove-music": {
        name: "Remove Music",
        description:
          "Separates the voice from the background music of an audio or video file, entirely on your device.",
      },
      // locales/en.json opDetails.trim — verified app copy.
      trim: {
        name: "Trim",
        description: "Keep only the range between the start and end points.",
      },
      // locales/en.json opDetails.cut — verified app copy.
      cut: {
        name: "Cut",
        description: "Remove the selected middle section and join the remainder.",
      },
      // Workspace/index.tsx:157 — video only; Operations/Compress.tsx applies
      // a quality slider as CRF. "Smaller file, similar quality" and the 32%
      // sweet spot are the app's own copy (locales/en.json
      // compressOperationDesc / compressTip); the contrast with Downgrade
      // Quality follows locales/en.json qualityOperationDesc.
      compress: {
        name: "Compress",
        description:
          "Reduce a video file's size with a quality slider — a smaller file at similar quality (the app suggests 32% as the sweet spot). Unlike Downgrade Quality, which lowers both quality and size, Compress aims to keep quality close to the original. Video only — audio and images are not compressed.",
      },
      // Operations/FormatSelect.tsx — verified format lists (research.md §1).
      convert: {
        name: "Convert",
        description:
          "Convert between formats: images to PNG, JPEG or WebP; audio to MP3, AAC, OGG, WAV or MP4; video to MP3, AAC, OGG, WAV, MP4, WebM, MOV, AVI or MKV; audio can also become video when paired with a still image.",
      },
      // QualitySelect.tsx — video 1080p/720p/480p/360p/240p/144p; audio 320/128/64 kbps; image 90/60/30%.
      quality: {
        name: "Downgrade quality",
        description:
          "Choose a lighter output: video from 1080p down to 144p, audio at 320, 128 or 64 kbps, or images at 90, 60 or 30% quality.",
      },
    },
  },
  howItWorks: {
    heading: "How it works",
    steps: [
      "Choose a file from your device or paste a supported URL.",
      "Choose the operation you need.",
      "Configure the settings.",
      "Get a new output file — the original is left unchanged.",
    ],
  },
  downloads: {
    heading: "Downloads",
    intro:
      "The latest release is pulled live from the GitHub repository. Choose the build for your platform.",
    states: {
      loading: "Checking the latest release…",
      ready: "The latest release is ready to download.",
      partial: "The latest release is out, but the download data is incomplete.",
      "no-release": "No published release has been found yet.",
      error: "The release information could not be loaded right now.",
      stale: "The information shown is cached and might be out of date.",
    },
    errors: {
      network: "Your browser could not reach GitHub. Check your connection and try again.",
      timeout: "The request to GitHub took too long. Please retry.",
      "rate-limit": "GitHub is temporarily limiting requests. Please retry in a moment.",
      http: "GitHub answered with an error. Please retry.",
      "invalid-data": "The release data received was not valid, so nothing is offered for download.",
    },
    retry: "Retry",
    lastChecked: "Last checked",
    outdatedWarning: "This information is a cached copy and may be out of date.",
    notInRelease: "Not included in this release.",
    archGuidance:
      "arm64-v8a is for most Android phones and tablets (ARM64); x86_64 is for x86_64 devices such as Chromebooks and emulators. Both require Android 10 or newer.",
    releasesPage: "All releases on GitHub",
    releasePage: "Release page",
    notesEnglish: "Release notes are written in English.",
    rateLimitReset: "GitHub rate limit resets at",
    platform: {
      windows: "Windows",
      linux: "Linux",
      android: "Android",
    },
    packageType: {
      installer: "Installer",
      deb: "Debian package",
      apk: "APK",
    },
    suggested: "Suggested for your device",
    sizeLabel: "Size",
    dateLabel: "Released",
    versionLabel: "Version",
    notesLabel: "Release notes",
  },
  about: {
    heading: "About TAIF",
    // Verified: package.json "GPL-3.0-only" + LICENSE (GPLv3, free & open
    // source); README ("Everything runs on your device. No servers, no
    // accounts."); DownloadFromInternet.tsx:38-47 (only the URL downloader
    // contacts the platform you explicitly request).
    body:
      "TAIF is free and open source under the GPL-3.0 license. All processing runs locally on your device, with no account and no servers. The only exception is the URL downloader, which contacts the platform you explicitly request.",
  },
  developer: {
    heading: "The developer",
    roleLabel: "Role",
    links: {
      website: "Website",
      github: "GitHub",
      linkedin: "LinkedIn",
    },
  },
  faq: {
    heading: "FAQ",
    // Every item carries the source it is grounded in (T063 / spec US5).
    // No unfounded claim may appear here (constitution: verified facts only).
    items: [
      {
        // Source: README "Everything runs on your device. No servers, no
        // accounts." + DownloadFromInternet.tsx:38-47 (URL downloader is the
        // only networked feature and only talks to the requested platform).
        id: "privacy",
        question: "Is TAIF private?",
        answer:
          "Yes — everything runs on your device. The only network contacts are the URL downloader calling the platform you explicitly requested.",
      },
      {
        // Source: package.json "GPL-3.0-only" + repository LICENSE (GPLv3).
        id: "cost",
        question: "How much does it cost?",
        answer: "TAIF is free and open source under the GPL-3.0 license.",
      },
      {
        // Source: GitHub release assets (msi / deb / apk) + research.md §4
        // (.deb verified on Ubuntu 22.04; Android minSdk 10 → Android 10+).
        id: "platforms",
        question: "Which platforms are supported?",
        answer:
          "Windows (MSI), Linux Debian/Ubuntu (verified on Ubuntu 22.04) and Android 10 or newer (APK).",
      },
      {
        // Source: app source — output is written next to the input file unless
        // the user changes the destination (Workspace save flow).
        id: "save",
        question: "Where are the output files saved?",
        answer: "New files are written next to your input file or to the location you pick.",
      },
      {
        // Source: FileImport.tsx / accepted extension lists (research.md §1).
        id: "formats",
        question: "Which file types can I import?",
        answer:
          "mp4, avi, mov, mkv, flv, webm, wmv (video); aac, mp3, ogg, wav, m4a (audio); png, webp, jpg, jpeg (images).",
      },
      {
        // Source: README + Workspace/index.tsx:153 (SPLEETER on-device
        // separation engine, audio/video, not macOS) and the app's own
        // accuracy notice (locales/en.json removeMusic.notice1) per FR-009.
        id: "remove-music",
        question: "How accurate is Remove Music?",
        answer:
          "It is an on-device AI separation engine. It works on audio and video and is available on Windows, Linux and Android. Because it uses AI, it can make mistakes when recognizing music.",
      },
      {
        // Source: DownloadFromInternet.tsx:38-47 supportedDomains + research.md
        // §1 — only these URL-import sites are verified. YouTube and youtu.be
        // are the same service; Twitter/X is listed as X.
        id: "url-imports",
        question: "Which sites can I import from with a URL?",
        answer:
          "YouTube, X, Instagram, Facebook, LinkedIn and SoundCloud. The URL downloader contacts only the platform you explicitly request; all other processing stays on your device.",
      },
    ],
  },
  footer: {
    repository: "Source repository",
    releases: "Releases",
    license: "License",
    tagline: "TAIF — free and open-source media tools",
  },
  notFound: {
    title: "Page not found (404)",
    body: "The page you requested does not exist.",
    home: "English home",
    homeAr: "Arabic home",
  },
};

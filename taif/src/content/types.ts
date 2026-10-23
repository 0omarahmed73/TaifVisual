/**
 * Single Dictionary shape covering the whole site.
 * en.ts and ar.ts must both satisfy this interface, so a missing key is a
 * compile error (data-model.md, Dictionary).
 */
export type Locale = "en" | "ar";

export interface SectionLink {
  id: string;
  label: string;
}

export interface SimpleSection {
  heading: string;
  body: string;
}

export interface OperationCopy {
  name: string;
  description: string;
}

export interface Dictionary {
  meta: {
    title: string;
    description: string;
    ogLocale: string;
    ogLocaleAlternate: string;
  };
  aria: {
    skipToContent: string;
    mainMenu: string;
    openMenu: string;
    closeMenu: string;
    languageSwitch: string;
  };
  nav: {
    links: SectionLink[];
  };
  hero: {
    name: string;
    tagline: string;
    body: string;
    primaryAction: string;
    secondaryAction: string;
    highlights: [string, string, string];
    /** Direct download label; `{platform}` is replaced with the platform name. */
    downloadFor: string;
  };
  showcase: {
    heading: string;
    comingSoon: string;
    tabs: { desktop: string; android: string; label: string };
    lightbox: {
      close: string;
      previous: string;
      next: string;
      /** Template containing `{alt}` for the trigger's accessible name. */
      enlarge: string;
      dialogLabel: string;
    };
  };
  features: {
    heading: string;
    intro: string;
    applyTo: Record<"audio" | "video" | "image", string>;
    availability: {
      "not-on-macos": string;
    };
    detailsLabel: string;
    /**
     * Verified Remove Music notices from the app (FR-009): AI-based on-device
     * separation, can make mistakes, can also reduce background noise, and has
     * no length limit.
     */
    removeMusicNotices: string[];
    /** Per-operation copy, keyed by the six operation ids from operations.ts. */
    operations: Record<
      "remove-music" | "trim" | "cut" | "compress" | "convert" | "quality",
      OperationCopy
    >;
  };
  howItWorks: {
    heading: string;
    steps: string[];
  };
  downloads: {
    heading: string;
    intro: string;
    states: {
      loading: string;
      ready: string;
      partial: string;
      "no-release": string;
      error: string;
      stale: string;
    };
    errors: {
      network: string;
      timeout: string;
      "rate-limit": string;
      http: string;
      "invalid-data": string;
    };
    retry: string;
    lastChecked: string;
    outdatedWarning: string;
    notInRelease: string;
    archGuidance: string;
    releasesPage: string;
    /** The specific release's own GitHub page (FR-024). */
    releasePage: string;
    /** Localized notice that GitHub release notes are authored in English. */
    notesEnglish: string;
    /** Label before the localized rate-limit reset timestamp. */
    rateLimitReset: string;
    platform: Record<"windows" | "linux" | "android", string>;
    packageType: Record<"installer" | "deb" | "apk", string>;
    suggested: string;
    sizeLabel: string;
    dateLabel: string;
    versionLabel: string;
    notesLabel: string;
  };
  about: {
    heading: string;
    body: string;
  };
  developer: {
    heading: string;
    roleLabel: string;
    links: {
      website: string;
      github: string;
      linkedin: string;
    };
  };
  faq: {
    heading: string;
    items: { id: string; question: string; answer: string }[];
  };
  footer: {
    repository: string;
    releases: string;
    license: string;
    tagline: string;
  };
  notFound: {
    title: string;
    body: string;
    home: string;
    homeAr: string;
  };
}

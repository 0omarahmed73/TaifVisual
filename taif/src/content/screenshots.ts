/**
 * Showcase manifest (data-model.md, Screenshot).
 *
 * THIS FILE HOLDS GENUINE CAPTURES ONLY — screenshots of the real TAIF
 * application. Mock-ups, renders or placeholder images must never be added
 * here (`capturedFrom` records the app version the capture was taken from).
 *
 * Entries below were captured by the project owner (2026-10-23) on the
 * real app (Android 738×1600 portrait, desktop 1920×1080) at version 2.0.1.
 * The `screen` union was extended beyond the original four steps to honestly
 * classify the splash and settings captures.
 */
export interface Screenshot {
  file: string; // path under /public or absolute URL
  width: number; // intrinsic pixel width
  height: number; // intrinsic pixel height
  platform: "desktop" | "android";
  screen: "import" | "tools" | "configure" | "result" | "splash" | "settings";
  alt: { en: string; ar: string };
  capturedFrom: string; // app version string supplied with the capture
}

/**
 * Test-only fixture, never part of the real manifest. The e2e suite renders
 * it through a test-only route to verify the <figure>/<img> contract
 * without shipping fake imagery on the site.
 */
export const E2E_TEST_SCREENSHOT: Screenshot = {
  file: "/e2e/screens-demo.png",
  width: 640,
  height: 400,
  platform: "desktop",
  screen: "tools",
  alt: { en: "Demo capture", ar: "لقطة تجريبية" },
  capturedFrom: "e2e-test",
};

export const screenshots: Screenshot[] = [
  {
    file: "/screenshots/splash-android.webp",
    width: 738,
    height: 1600,
    platform: "android",
    screen: "splash",
    alt: {
      en: "TAIF mobile splash screen with the brand logo and the name TAIF · طَيْف",
      ar: "شاشة البداية في تطبيق طَيْف للجوال مع الشعار والاسم TAIF · طَيْف",
    },
    capturedFrom: "2.0.1 (Android)",
  },
  {
    file: "/screenshots/home-android.webp",
    width: 738,
    height: 1600,
    platform: "android",
    screen: "import",
    alt: {
      en: "TAIF mobile home screen: choose a file from your phone or download from a URL",
      ar: "الشاشة الرئيسية في تطبيق طَيْف: اختر ملفًا من هاتفك أو نزّل من رابط",
    },
    capturedFrom: "2.0.1 (Android)",
  },
  {
    file: "/screenshots/review-audio-android.webp",
    width: 738,
    height: 1600,
    platform: "android",
    screen: "configure",
    alt: {
      en: "TAIF mobile review screen showing an imported MP3 audio file with duration and size",
      ar: "شاشة المراجعة في تطبيق طَيْف تعرض ملف صوت MP3 مستوردًا مع المدة والحجم",
    },
    capturedFrom: "2.0.1 (Android)",
  },
  {
    file: "/screenshots/operations-android.webp",
    width: 738,
    height: 1600,
    platform: "android",
    screen: "tools",
    alt: {
      en: "TAIF mobile tool list for an audio file: Downgrade Quality, Remove music, Trim, Cut and Convert",
      ar: "قائمة الأدوات في تطبيق طَيْف لملف صوتي: تخفيض الجودة، إزالة الموسيقى، القص، القطع والتحويل",
    },
    capturedFrom: "2.0.1 (Android)",
  },
  {
    file: "/screenshots/settings-ar-android.webp",
    width: 738,
    height: 1600,
    platform: "android",
    screen: "settings",
    alt: {
      en: "TAIF mobile settings dialog in Arabic (RTL): language, theme and notifications",
      ar: "نافذة إعدادات تطبيق طَيْف بالعربية (من اليمين إلى اليسار): اللغة والمظهر والإشعارات",
    },
    capturedFrom: "2.0.1 (Android)",
  },
  {
    file: "/screenshots/home-desktop.webp",
    width: 1920,
    height: 1080,
    platform: "desktop",
    screen: "import",
    alt: {
      en: "TAIF desktop home screen: drop a file here or download from a URL",
      ar: "الشاشة الرئيسية لتطبيق طَيْف على الحاسوب: أفلِت ملفًا هنا أو نزّل من رابط",
    },
    capturedFrom: "2.0.1 (Desktop)",
  },
  {
    file: "/screenshots/url-import-desktop.webp",
    width: 1920,
    height: 1080,
    platform: "desktop",
    screen: "import",
    alt: {
      en: "TAIF desktop URL-import dialog: paste a link from supported sites with format and quality options",
      ar: "نافذة الاستيراد من رابط في طَيْف على الحاسوب: الصق رابطًا من المواقع المدعومة مع خيارات الصيغة والجودة",
    },
    capturedFrom: "2.0.1 (Desktop)",
  },
  {
    file: "/screenshots/review-video-desktop.webp",
    width: 1920,
    height: 1080,
    platform: "desktop",
    screen: "configure",
    alt: {
      en: "TAIF desktop review screen showing an imported MP4 video with duration, size, format and type",
      ar: "شاشة المراجعة في طَيْف على الحاسوب تعرض فيديو MP4 مستوردًا مع المدة والحجم والصيغة والنوع",
    },
    capturedFrom: "2.0.1 (Desktop)",
  },
];

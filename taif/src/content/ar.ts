import type { Dictionary } from "./types";

/**
 * Arabic dictionary — same Dictionary type, so a missing key is a compile error.
 *
 * ⚠ ARABIC COPY OWNER REVIEW REQUIRED BEFORE LAUNCH: all Arabic strings are
 * drafted equivalents of the verified English copy and must be reviewed by a
 * native speaker / the project owner before the site goes live.
 */
export const ar: Dictionary = {
  meta: {
    title: "طَيْف — أدوات وسائط حرة تعمل على جهازك",
    description:
      "طَيْف تطبيق مكتبي حر ومفتوح المصدر لقصّ ومجيئة وضغط وتحويل ملفات الصوت والفيديو والصور بالكامل على جهازك.",
    ogLocale: "ar",
    ogLocaleAlternate: "en_US",
  },
  aria: {
    skipToContent: "تخطَّ إلى المحتوى",
    mainMenu: "القائمة الرئيسية",
    openMenu: "افتح القائمة",
    closeMenu: "أغلق القائمة",
    languageSwitch: "تبديل اللغة",
  },
  nav: {
    links: [
      { id: "features", label: "الميزات" },
      { id: "how-it-works", label: "كيف يعمل" },
      { id: "downloads", label: "التنزيلات" },
      { id: "about", label: "حول" },
      { id: "faq", label: "الأسئلة الشائعة" },
    ],
  },
  hero: {
    name: "TAIF · طَيْف",
    tagline: "أدوات وسائط حرة تعمل على جهازك",
    body: "قصّ ومجيئة وضغط وتحويل الصوت والفيديو والصور دون مغادرة جهازك إطلاقًا.",
    primaryAction: "التنزيل",
    secondaryAction: "استعرض الميزات",
    downloadFor: "تنزيل لنظام {platform}",
    highlights: ["مجاني ومفتوح المصدر", "يعمل على جهازك", "بدون حساب"],
  },
  showcase: {
    heading: "لقطات من التطبيق",
    comingSoon: "ستتوفر لقطات الشاشة قريبًا",
    tabs: { desktop: "سطح المكتب", android: "أندرويد", label: "اختر المنصة" },
    lightbox: {
      close: "أغلق",
      previous: "اللقطة السابقة",
      next: "اللقطة التالية",
      enlarge: "تكبير لقطة الشاشة: {alt}",
      dialogLabel: "معاينة لقطة الشاشة",
    },
  },
  features: {
    heading: "الميزات",
    intro: "ست عمليات أساسية، كلها تُنفَّذ على جهازك.",
    applyTo: {
      audio: "الصوت",
      video: "الفيديو",
      image: "الصور",
    },
    availability: {
      "not-on-macos": "غير متاحة على macOS.",
    },
    detailsLabel: "التفاصيل",
    // المصدر: locales/ar.json (removeMusic.notice1–notice3) وHANDOFF.md
    // وsrc/hooks/useSpleeter.tsx — المحرك يعمل محليًا على الجهاز.
    removeMusicNotices: [
      "تستخدم هذه العملية الذكاء الاصطناعي وتعمل بالكامل على جهازك. وقد تخطئ في التعرّف على الموسيقى.",
      "يمكنها كذلك إزالة الضوضاء وأصوات الخلفية.",
      "لا يوجد حدّ للطول: فهي تعمل مع الصوت والفيديو بأي مدة.",
    ],
    // صياغات عربية مكافئة للنسخة الإنجليزية الموثقة (تحتاج مراجعة قبل الإطلاق).
    operations: {
      "remove-music": {
        name: "إزالة الموسيقى",
        description:
          "يفصل الصوت البشري عن الموسيقى المصاحبة في ملف صوتي أو فيديو، بالكامل على جهازك.",
      },
      trim: {
        name: "القصّ بالاحتفاظ",
        description: "احتفظ فقط بالمقطع بين نقطتَي البداية والنهاية.",
      },
      cut: {
        name: "القطع",
        description: "أزل المقطع الأوسط المُحدَّد ثم صِل الأجزاء المتبقية.",
      },
      compress: {
        name: "الضغط",
        description:
          "قلّص حجم ملف فيديو عبر شريط جودة — ملف أصغر بجودة مشابهة (يقترح التطبيق 32% كأفضل نقطة). وعلى عكس خفض الجودة الذي يقلّل الجودة والحجم معًا، يهدف الضغط إلى إبقاء الجودة قريبة من الأصل. للفيديو فقط — لا يُضغط الصوت ولا الصور.",
      },
      convert: {
        name: "التحويل",
        description:
          "حوّل بين الصيغ: الصور إلى PNG أو JPEG أو WebP؛ والصوت إلى MP3 أو AAC أو OGG أو WAV أو MP4؛ والفيديو إلى MP3 أو AAC أو OGG أو WAV أو MP4 أو WebM أو MOV أو AVI أو MKV؛ ويمكن أن يصبح الصوت فيديو مع صورة ثابتة.",
      },
      quality: {
        name: "خفض الجودة",
        description:
          "اختر مخرجات أخف: فيديو من 1080p حتى 144p، أو صوت بـ 320 أو 128 أو 64 كيلوبت/ث، أو صور بجودة 90% أو 60% أو 30%.",
      },
    },
  },
  howItWorks: {
    heading: "كيف يعمل",
    steps: [
      "اختر ملفًا من جهازك أو الصق رابطًا مدعومًا.",
      "اختر العملية التي تريدها.",
      "اضبط الخيارات كما تشاء.",
      "احصل على ملف مخرجات جديد — يبقى الملف الأصلي كما هو.",
    ],
  },
  downloads: {
    heading: "التنزيلات",
    intro: "يُجلب الإصدار الأحدث مباشرةً من GitHub. اختر النسخة المناسبة لجهازك.",
    states: {
      loading: "نتحقق من أحدث إصدار…",
      ready: "أحدث إصدار جاهز للتنزيل.",
      partial: "أحدث إصدار صدر، لكن بيانات التنزيل غير مكتملة.",
      "no-release": "لم يُعثر على أي إصدار منشور بعد.",
      error: "تعذّر تحميل معلومات الإصدار الآن.",
      stale: "المعلومات المعروضة مخزَّنة مؤقتًا وقد تكون قديمة.",
    },
    errors: {
      network: "لم يستطع متصفحك الوصول إلى GitHub. تحقّق من اتصالك ثم أعد المحاولة.",
      timeout: "استغرقت الطلب إلى GitHub وقتًا طويلًا. يرجى إعادة المحاولة.",
      "rate-limit": "يفرض GitHub حاليًا حدًّا مؤقتًا على الطلبات. أعد المحاولة بعد قليل.",
      http: "أعادت GitHub رسالة خطأ. يرجى إعادة المحاولة.",
      "invalid-data": "بيانات الإصدار المستلمة غير صالحة، لذا لن نعرض أي ملف للتنزيل.",
    },
    retry: "أعد المحاولة",
    lastChecked: "آخر تحقق",
    outdatedWarning: "هذه المعلومات نسخة مخزَّنة مؤقتًا وقد تكون قديمة.",
    notInRelease: "غير مضمّن في هذا الإصدار.",
    archGuidance:
      "arm64-v8a لمعظم هواتف وأجهزة أندرويد اللوحية (ARM64)؛ وx86_64 لأجهزة x86_64 مثل Chromebooks والمحاكيات. يتطلب كلاهما أندرويد 10 أو أحدث.",
    releasesPage: "كل الإصدارات على GitHub",
    releasePage: "صفحة الإصدار",
    notesEnglish: "ملاحظات الإصدار مكتوبة بالإنجليزية.",
    rateLimitReset: "يُعاد ضبط حد GitHub في",
    platform: {
      windows: "ويندوز",
      linux: "لينكس",
      android: "أندرويد",
    },
    packageType: {
      installer: "ملف تثبيت",
      deb: "حزمة دبيان",
      apk: "حزمة APK",
    },
    suggested: "مقترح لجهازك",
    sizeLabel: "الحجم",
    dateLabel: "تاريخ الإصدار",
    versionLabel: "النسخة",
    notesLabel: "ملاحظات الإصدار",
  },
  about: {
    heading: "حول طَيْف",
    body:
      "طَيْف حر ومفتوح المصدر برخصة GPL-3.0. تتم كل المعالجة على جهازك محليًا، بلا حساب وبلا خوادم. الاستثناء الوحيد هو أداة تنزيل الروابط، وهي تتصل بالمنصة التي تطلبها أنت صراحةً.",
  },
  developer: {
    heading: "المطوّر",
    roleLabel: "الدور",
    links: {
      website: "الموقع",
      github: "GitHub",
      linkedin: "LinkedIn",
    },
  },
  faq: {
    heading: "الأسئلة الشائعة",
    // كل إجابة مبنية على المصدر الموثّق في النسخة الإنجليزية (T063) —
    // لا تُضاف ادعاءات غير مُتحقَّق منها.
    items: [
      {
        // المصدر: README + DownloadFromInternet.tsx:38-47.
        id: "privacy",
        question: "هل يحمي طَيْف خصوصيتي؟",
        answer:
          "نعم — كل شيء يعمل على جهازك. الاستخدام الوحيد للشبكة هو أداة تنزيل الروابط وهي تتصل بالمنصة التي طلبتها أنت صراحةً.",
      },
      {
        // المصدر: package.json "GPL-3.0-only" + ملف LICENSE في المستودع.
        id: "cost",
        question: "كم يكلّف؟",
        answer: "طَيْف حر ومفتوح المصدر برخصة GPL-3.0.",
      },
      {
        // المصدر: ملفات الإصدارات على GitHub (msi/deb/apk) + research.md §4
        // (تُثبَّت حزمة .deb على Ubuntu 22.04؛ أدنى إصدار أندرويد هو 10).
        id: "platforms",
        question: "ما الأنظمة المدعومة؟",
        answer:
          "ويندوز (MSI)، ولينكس دبيان/أوبونتو (مُتحقق منها على Ubuntu 22.04)، وأندرويد 10 أو أحدث (APK).",
      },
      {
        // المصدر: مسار الحفظ في الشيفرة — يُكتب المخرج بجوار الملف الأصلي
        // ما لم يغيّر المستخدم الوجهة.
        id: "save",
        question: "أين تُحفظ ملفات المخرجات؟",
        answer: "تُكتب الملفات الجديدة بجوار الملف الأصلي أو في الموضع الذي تختاره.",
      },
      {
        // المصدر: قوائم الامتدادات المقبولة في FileImport.tsx (research.md §1).
        id: "formats",
        question: "ما أنواع الملفات التي يمكن استيرادها؟",
        answer:
          "mp4 وavi وmov وmkv وflv وwebm وwmv (فيديو)؛ وaac وmp3 وogg وwav وm4a (صوت)؛ وpng وwebp وjpg وjpeg (صور).",
      },
      {
        // المصدر: README + Workspace/index.tsx:153 — محرك فصل يعمل على الجهاز
        // مع إشعار الدقة الوارد في التطبيق (locales/ar.json removeMusic.notice1).
        id: "remove-music",
        question: "ما مدى دقة ميزة إزالة الموسيقى؟",
        answer:
          "هي محرك فصل بالذكاء الاصطناعي يعمل على الجهاز. تعمل على الصوت والفيديو وهي متاحة على ويندوز ولينكس وأندرويد. ولأنها تستخدم الذكاء الاصطناعي فقد تخطئ في التعرّف على الموسيقى.",
      },
      {
        // المصدر: DownloadFromInternet.tsx:38-47 (supportedDomains) وresearch.md §1.
        id: "url-imports",
        question: "من أي مواقع يمكنني الاستيراد عبر رابط؟",
        answer:
          "YouTube وX وInstagram وFacebook وLinkedIn وSoundCloud. أداة تنزيل الروابط تتصل فقط بالمنصة التي تطلبها أنت صراحةً، وتبقى بقية المعالجة على جهازك.",
      },
    ],
  },
  footer: {
    repository: "مستودع الشيفرة",
    releases: "الإصدارات",
    license: "الرخصة",
    tagline: "طَيْف — أدوات وسائط حرة ومفتوحة المصدر",
  },
  notFound: {
    title: "الصفحة غير موجودة (404)",
    body: "الصفحة التي طلبتها غير موجودة.",
    home: "الصفحة الإنجليزية",
    homeAr: "الصفحة العربية",
  },
};

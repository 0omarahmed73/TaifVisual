# Feature Specification: TAIF Official Website

**Feature Branch**: `001-taif-website`

**Created**: 2026-10-23

**Status**: Draft

**Input**: User description: "Build the official website for TAIF (طَيْف), an existing desktop Audio & Video Toolkit with Linux, Windows, and Android APK builds. Bilingual (English default, full Arabic with RTL), real screenshots, a download center powered by verified GitHub Releases, honest handling of missing/failed data, a verified developer profile, six operations described accurately (Remove Music, Trim, Cut, Compress, Convert, Downgrade Quality), responsive, accessible, SEO-friendly, fast, on-brand, and independently deployable to Vercel without touching the existing application."

## Clarifications

### Session 2026-10-23

- Q: Should the website live in its own separate GitHub repository, or stay as a subfolder inside the existing `TaifVisual` app repository? → A: Subfolder in the existing `TaifVisual` repository (`taif/`), deployed with that folder as the project root, with no changes to the app, its tags, or its workflow.
- Q: If the live release lookup fails but a recent saved copy of the release data exists, should the download center show the saved copy marked as out of date, or only an error state? → A: Show the saved copy for up to 7 days with a visible "last checked" date and an outdated warning, plus retry and a Releases link; after 7 days show only the error state.
- Q: Should the Arabic version have its own web address, or should both languages share one address? → A: English at `/` (default) and Arabic at `/ar/`, each with its own canonical URL and alternate-language tags; the language switch moves between the two addresses and a saved choice sends returning visitors to their language.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Download the right build for my device (Priority: P1)

A visitor lands on the site, sees which platforms TAIF supports, and downloads the installer or APK
that matches their device, with the version, release date, file type, and file size visible before
they commit.

**Why this priority**: Getting users a working build is the site's core purpose. Without a reliable
download center the site has no value over the repository page.

**Independent Test**: Open the download section with a published release available. Confirm each
offered build maps to a real file on that release, shows correct version, date, package type, and
size, and that activating the button starts the real download.

**Acceptance Scenarios**:

1. **Given** a published release with Windows, Linux, and Android assets, **When** the visitor opens the download center, **Then** each platform shows only the assets that exist on that release, labeled with package type (e.g., installer, Debian package, APK), CPU variant where the file name states one, and file size.
2. **Given** the visitor's device is recognizable as a supported platform, **When** the download center loads, **Then** that platform's build is visually highlighted as suggested, while all other platforms remain reachable.
3. **Given** a platform has no asset on the latest release, **When** the download center renders, **Then** that platform shows an honest "not available in this release" state and no download button.
4. **Given** the latest release has release notes, **When** the visitor expands or views them, **Then** the notes appear as plain, safe text and never execute or inject markup.

---

### User Story 2 - Understand what TAIF is and does (Priority: P1)

A visitor reads the hero, product showcase, feature descriptions, and "How It Works" section and
understands that TAIF is a free, local-first audio and video toolkit, what each of its six
operations does, and how a typical job flows.

**Why this priority**: Visitors must be convinced the product fits their need before downloading.

**Independent Test**: A reviewer who has never seen TAIF reads the page top to bottom and can
correctly state what the app does, name the six operations, and describe the basic steps.

**Acceptance Scenarios**:

1. **Given** the home page, **When** it loads, **Then** the hero states the product name (TAIF · طَيْف), a one-line purpose, and a primary action leading to the download center.
2. **Given** the feature section, **When** read, **Then** it describes exactly six operations: Remove Music, Trim, Cut, Compress, Convert, and Downgrade Quality, each matching actual app behavior.
3. **Given** the Trim and Cut descriptions, **When** compared, **Then** Trim is described as keeping a chosen range (removing material from the ends) and Cut as removing a chosen middle section and joining the remainder; they are never presented as the same operation.
4. **Given** the product showcase, **When** viewed, **Then** every image is a genuine screenshot of the real application with alternative text, not a mock-up or illustration.

---

### User Story 3 - Use the site in Arabic or English (Priority: P1)

An Arabic-speaking visitor switches the site to Arabic and gets a complete, natural, right-to-left
experience that persists as they navigate and return.

**Why this priority**: Arabic is a first-class audience and part of the brand identity (طَيْف).

**Independent Test**: Switch to Arabic, scroll the entire site, reload, and revisit; verify all text
is Arabic, layout is mirrored, and the choice is remembered.

**Acceptance Scenarios**:

1. **Given** a first-time visitor opening `/`, **When** the site loads, **Then** it displays in English, left-to-right; **Given** a visitor opening `/ar/` directly, **Then** it displays in Arabic, right-to-left.
2. **Given** the language switch, **When** the visitor selects Arabic, **Then** all visible text, navigation, buttons, state messages, and metadata switch to Arabic, with right-to-left layout and mirrored directional elements.
3. **Given** Arabic was selected, **When** the visitor navigates between sections or returns later, **Then** they land on or stay at the Arabic address.
4. **Given** release notes written only in English, **When** shown on the Arabic site, **Then** they are presented unaltered and labeled as English-language content rather than silently mistranslated.

---

### User Story 4 - Know who built TAIF (Priority: P2)

A visitor reads the About TAIF section and the developer profile to learn who made the app and
follows verified links to the developer's professional presence.

**Why this priority**: Builds trust and credit, but does not block downloading.

**Independent Test**: Open the developer profile and confirm that name, role, and every link match
the verified information in the application repository and that each link opens the correct
destination.

**Acceptance Scenarios**:

1. **Given** the developer profile, **When** viewed, **Then** it shows the verified name and role and links to the verified website, GitHub profile, and LinkedIn profile only.
2. **Given** any piece of developer information that cannot be verified, **When** the profile is built, **Then** it is omitted rather than invented.

---

### User Story 5 - Get answers before installing (Priority: P2)

A visitor reads the FAQ to resolve common concerns (privacy, cost, supported platforms, how
processing works, where files are saved) and uses the footer to reach the source repository,
releases page, and license.

**Why this priority**: Reduces hesitation and support questions.

**Independent Test**: Every FAQ answer can be traced to the README, app source, or release data.

**Acceptance Scenarios**:

1. **Given** the FAQ, **When** a question is activated by mouse or keyboard, **Then** its answer expands and is readable, with state exposed to assistive technology.
2. **Given** the footer, **When** viewed, **Then** it shows only verified links (repository, releases, developer links, license) and the language switch.

---

### User Story 6 - Find and share the site (Priority: P3)

A visitor finds the site through search or a shared link and sees a correct title, description, and
preview image in the right language.

**Why this priority**: Improves reach; not required for core function.

**Independent Test**: Inspect page metadata and shared-link previews in both languages.

**Acceptance Scenarios**:

1. **Given** the site is shared or indexed, **When** metadata is read, **Then** title, description, and preview image accurately describe TAIF in the active language.
2. **Given** both language versions, **When** a crawler reads the page, **Then** the alternate-language relationship is declared.

---

### Edge Cases

- No published release exists (repository empty or only drafts): download center shows an honest "no release published yet" state with a link to the repository's Releases page, and no download buttons.
- Latest release exists but lacks assets for some platforms (e.g., Windows only): only available platforms show downloads; others show the unavailable state.
- Draft and pre-release entries: drafts are never shown; pre-releases are not offered as the default latest version.
- Release data request fails, times out, or is rate-limited: the page still renders fully; the download center shows a clear error state with retry and a direct link to the Releases page.
- While release data loads: a visible loading state with reserved space, so the layout does not jump.
- Malformed or unexpected release data (missing size, date, or name): the affected field is omitted; assets that cannot be validated are not offered.
- Release notes that contain markup, scripts, or links: shown as inert text only.
- Multiple Android APK variants (different CPU architectures): each is offered with its architecture label, plus guidance on which is appropriate for typical phones, based only on file-name facts.
- Visitor's platform cannot be detected or is unsupported (e.g., macOS, iOS): no platform is falsely suggested; all available builds are listed and unsupported platforms are stated honestly.
- Saved language preference unavailable (storage blocked): site falls back to English and still allows switching during the session.
- Very small screens and very large screens: no horizontal scrolling or broken layout.
- Visitor prefers reduced motion: decorative animation is disabled or minimized.
- Visitor uses only a keyboard or a screen reader: every interactive element is reachable, labeled, and has a visible focus indicator.

## Requirements *(mandatory)*

### Functional Requirements

**Content and navigation**

- **FR-001**: The site MUST present these sections in order: navigation header, hero, product showcase, features, How It Works, download center, About TAIF, developer profile, FAQ, and footer.
- **FR-002**: The navigation header MUST link to the main sections, include the language switch, and remain usable on small screens through a collapsible menu operable by keyboard.
- **FR-003**: The hero MUST state the product name, its purpose, and a primary action that leads to the download center.
- **FR-004**: The site MUST use the existing TAIF logo and brand colors, typography, and visual language from the application, without alteration of the logo.
- **FR-005**: The product showcase MUST use genuine screenshots of the real TAIF application, each with alternative text in both languages.
- **FR-006**: The How It Works section MUST reflect the real app flow: choose a file (or import from a supported URL), choose an operation, configure it, and receive a new output file with the original left unchanged.
- **FR-007**: The About TAIF section MUST state only verified product facts: free and open source, local-first processing, no account required, and the licence as published in the repository.

**Operations accuracy**

- **FR-008**: The features section MUST describe exactly six operations: Remove Music, Trim, Cut, Compress, Convert, and Downgrade Quality.
- **FR-009**: Remove Music MUST be described as AI-based separation of vocals from music, running on the user's device, with the app's own notices (it can make mistakes; it can also reduce background noise; no length limit).
- **FR-010**: Trim MUST be described as keeping only the range between a start and end point; Cut MUST be described as removing a selected middle section and joining the remainder. Their descriptions MUST NOT be interchangeable.
- **FR-011**: Compress MUST be described as reducing file size with similar quality; Downgrade Quality MUST be described as lowering both quality and size; the site MUST explain the difference between the two as the app does.
- **FR-012**: Convert MUST be described as changing the output format, including video-to-audio and audio-to-video using a still image, and only the media types the app actually supports.
- **FR-013**: Platform gating MUST be stated only as verified in the application: Remove Music is offered for audio and video only and not on macOS; Trim and Cut for audio and video only; Compress for video only; Downgrade Quality and Convert for audio, video, and images. Unverified gating statements MUST be omitted.
- **FR-014**: The site MUST NOT claim any supported format, feature, platform, or compatibility that is not verifiable in the application repository or release data.

**Download center**

- **FR-015**: The download center MUST obtain version, publication date, release notes, and downloadable assets from the project's published GitHub Releases at the time of viewing (or from a clearly bounded recent cache of them).
- **FR-016**: The download center MUST show, per available asset: platform, package type, CPU variant when stated by the file name, file size, and a download link pointing to the actual release asset.
- **FR-017**: The site MUST map assets to platforms using documented rules based on file type (Windows installer, Debian package, Android APK); assets not matching a rule MUST NOT be offered as platform downloads.
- **FR-018**: The site MUST NOT display a download button for any platform without a verified asset, and MUST NOT contain hard-coded download URLs or version numbers as the source of truth.
- **FR-019**: The download center MUST implement distinct loading, success, no-release, missing-platform, and failure states, each with honest wording in both languages.
- **FR-020**: On failure, the download center MUST offer retry and a direct link to the repository's Releases page.
- **FR-020a**: When the live lookup fails and previously retrieved, validated release data younger than 7 days exists, the download center MUST show that data with a visible "last checked" date and an outdated-data warning, in addition to retry and the Releases link. Saved data older than 7 days MUST NOT be shown; only the failure state appears. Saved data MUST never be shown as current.
- **FR-021**: Drafts MUST never be shown; pre-releases MUST NOT be presented as the latest stable version.
- **FR-022**: Release notes MUST be treated as untrusted text and rendered inert (no executable markup, no embedded scripts or frames).
- **FR-023**: All data received from the release source MUST be checked for expected shape; invalid items MUST be dropped rather than displayed.
- **FR-024**: The download center MUST show a link to all releases and the release's own page for users who want older versions or checksums, only when those links are valid.

**Language and localization**

- **FR-025**: The site MUST ship complete English and Arabic content, with English as default.
- **FR-026**: Arabic MUST render right-to-left with mirrored layout, and English left-to-right; the document's declared language and direction MUST match the active language.
- **FR-027**: The language switch MUST be available from every screen size and MUST preserve the visitor's position and choice.
- **FR-028**: The selected language MUST persist across navigation and return visits when the browser allows it, and degrade gracefully when it does not. English MUST be served at `/` and Arabic at `/ar/`; the switch MUST navigate between the equivalent address of the same section; a returning visitor with a saved language preference MAY be directed to that language, but first-time visitors MUST receive English at `/` and direct visits to `/ar/` MUST always show Arabic.
- **FR-029**: Brand name text MUST appear as "TAIF · طَيْف" where the dual form is used, with correct bidirectional rendering and Arabic diacritics preserved.
- **FR-030**: Numbers, versions, file names, and sizes MUST display consistently and legibly in both layouts.

**Developer profile**

- **FR-031**: The developer profile MUST present the developer's verified name (Omar A. Saeed) and role (Full Stack Developer) as published in the application's About information.
- **FR-032**: The developer profile MUST link only to these verified destinations: omarasaeed.dev, github.com/0omarahmed73, and linkedin.com/in/0omarahmed73.
- **FR-033**: The site MUST NOT include personal details (location, education, employer, photo, biography claims, contact details) unless supplied and approved by the developer.
- **FR-034**: External links MUST open in a way that does not give the destination access to the site context.

**Quality attributes**

- **FR-035**: The site MUST be fully usable at phone, tablet, and desktop widths without horizontal scrolling.
- **FR-036**: The site MUST be operable by keyboard alone, use semantic structure, provide visible focus indicators, and meet WCAG 2.1 AA colour contrast in both light and dark appearances if both are offered.
- **FR-037**: The site MUST respect the visitor's reduced-motion preference.
- **FR-038**: Images MUST be optimized, have declared dimensions to prevent layout shift, and below-the-fold images MUST load lazily.
- **FR-039**: Each language address MUST provide accurate localized title, description, and social-sharing preview, a self-referencing canonical URL, reciprocal alternate-language declarations between `/` and `/ar/` (plus a default declaration pointing to English), and structured product information limited to verified facts. Canonical and alternate URLs MUST use the production domain once it is known and MUST NOT use a guessed domain.
- **FR-040**: The site MUST contain no tracking or third-party data collection by default; if any analytics are added later, they require a documented privacy statement first.
- **FR-041**: The site MUST NOT contain secrets, and MUST function without any user account or login.

**Delivery and safety**

- **FR-042**: The website MUST live in its own self-contained subfolder (`taif/`) of the existing `TaifVisual` repository and MUST be deployable to Vercel on its own, using that folder as the deployment root, without changes to the desktop/Android application's source, build configuration, dependencies, tags, or release workflow. Website-only changes MUST NOT trigger application release builds, and application-only changes SHOULD NOT trigger website deployments.
- **FR-043**: Setup, local preview, build, and deployment instructions MUST be documented, including how release-data discovery works and how to update verified content.
- **FR-044**: All verified project facts (repository coordinates, developer links, platform rules, operation descriptions) MUST be kept in one maintainable place so a content change does not require touching presentation code.

### Key Entities *(include if feature involves data)*

- **Release**: A published version of TAIF. Attributes: version label, name, publication date, pre-release flag, release notes (untrusted text), page link, list of assets.
- **Release Asset**: A downloadable file attached to a release. Attributes: file name, size, content type, download link, derived platform, derived package type, derived CPU variant.
- **Platform**: Windows, Linux, or Android. Attributes: display name, accepted package types, availability on the current release.
- **Operation**: One of the six TAIF tools. Attributes: name, one-line summary, detailed description, applicable media types, localized text. Verified against the application.
- **Localized Content**: Every user-visible string in English and Arabic, including state messages and metadata.
- **Developer Profile**: Verified name, role, and profile links.
- **Screenshot**: A genuine capture of the real application. Attributes: image, dimensions, alternative text per language, the operation or screen shown.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time visitor can find and start the correct download for their device within 30 seconds of landing, without scrolling more than the distance to the download section.
- **SC-002**: 100% of download buttons on the site point to files that exist on a published release; 0 broken or fabricated download links are found in a full link audit.
- **SC-003**: When release data is unavailable (no release, offline, rate-limited, malformed), 100% of tested failure cases render an honest message, a working fallback link, and zero fake download buttons.
- **SC-004**: 100% of visible text, including state messages, exists in both English and Arabic, with zero untranslated placeholders and zero layout defects in right-to-left mode on phone and desktop widths.
- **SC-005**: The chosen language persists across 100% of in-site navigations and reloads in browsers that permit storage.
- **SC-006**: Every product claim (feature, platform, format, privacy statement) can be traced to a source in the application repository or release data in a claims audit with 0 unverifiable claims.
- **SC-007**: Automated accessibility checks report no critical or serious issues, and a keyboard-only walkthrough reaches and operates every interactive element in both languages.
- **SC-008**: On a mid-range phone over a typical mobile connection, the main content becomes visible in under 3 seconds and the page does not visibly shift while loading.
- **SC-009**: Release notes containing script or markup samples display as inert text in 100% of tested cases.
- **SC-010**: The site builds and deploys to Vercel from its own project, and the desktop/Android application's files are unchanged (verified by comparing the repository state before and after).
- **SC-011**: At least 90% of first-time reviewers can correctly name all six operations and state how Trim differs from Cut after reading the features section once.

## Assumptions

- The verified source repository is `0omarahmed73/TaifVisual`; its currently published release is v2.0.0 with Windows (.msi), Linux (.deb), and two Android APKs (arm64-v8a and x86_64). Site behavior must still be driven by live release data, not by these facts.
- The existing application has no committed screenshots. Genuine screenshots (desktop and Android, EN and AR if feasible) are an input that must be captured from the real app before the showcase can ship; until then the showcase section MUST NOT use placeholders posing as the app.
- The existing logo mark and brand tokens (dark-first charcoal theme with violet-to-cyan accent gradient, Manrope for English text, Noto Sans Arabic for Arabic text) in the application are the brand source of truth and are reused.
- The developer's only verified details are those in the application's About dialog: name, role, website, GitHub, and LinkedIn. No further biography is available; the profile stays concise unless the developer supplies approved text.
- The site is a single-page marketing site with in-page sections; separate legal pages are out of scope unless required for any added analytics.
- Android install guidance is limited to facts verifiable from the build (APK files for specific CPU architectures); the site does not claim store availability.
- macOS builds do not exist in the verified releases; the site states available platforms only and does not promise future builds.
- The application is licensed under GPL-3.0-only as stated in the repository; the footer references it accordingly.
- Verified from application source: Downgrade Quality offers 1080p–144p for video, 320/128/64 kbps for audio, and 90/60/30% for images; Convert offers PNG/JPEG/WebP for images, MP3/AAC/OGG/WAV/MP4 for audio, and MP3/AAC/OGG/WAV/MP4/WebM/MOV/AVI/MKV for video; Compress is a video-only level slider; URL import supports a fixed list of sites (the site names only those listed in the app).
- Also verified: Remove Music is offered on Android (reports platform `android`) and Windows/Linux, not macOS; importable file types are mp4, avi, mov, mkv, wmv, flv, webm, aac, mp3, ogg, wav, m4a, png, webp, jpg, jpeg; URL import sites are YouTube, X/Twitter, Instagram, Facebook, LinkedIn, SoundCloud.
- Verified installation facts: Windows installer is an MSI whose bundled web-view bootstrapper may need an internet connection; the Linux package targets Debian/Ubuntu and was verified on Ubuntu 22.04; Android build requires Android 10 (API 29) or newer. The site states only these.
- Release rules: the "latest" release is the newest published, non-draft, non-pre-release entry of `0omarahmed73/TaifVisual`. An asset is mapped to a platform only by its file extension (`.msi` Windows, `.deb` Linux, `.apk` Android, with CPU variant parsed from the file name when present); any asset not matching these rules, or ambiguous, is not offered as a download and is reachable only through the release page link.
- Developer profile data available in project files: name, role, website, GitHub, and LinkedIn only. No biography, email, or other contact link exists and none is invented.

## Unresolved External Configuration

These values are not available in the project and MUST be supplied before launch; they do not block unrelated work:

- **Production domain** (also needed for canonical and alternate URLs, sitemap, and sharing previews).
- **Vercel project/team and its connection to the repository** (root directory `taif/`, deployment branch, and ignore rule for non-website changes).
- **Genuine TAIF screenshots** (desktop and Android) captured from the current app; the only existing screenshots predate the rebrand and are not used.
- **Whether the developer wants any biography text or contact link published** (otherwise none is shown).
- Out of scope: in-site conversion tools, user accounts, comments, blogs, donations, auto-update logic, and any change to the desktop or Android application.

<!--
Sync Impact Report
- Version change: (unfilled template) → 1.0.0
- Modified principles: none renamed; all 5 template slots replaced and expanded to 10 principles
- Added sections: Core Principles I–X, Technical & Delivery Constraints, Development Workflow &
  Quality Gates, Governance
- Removed sections: none (template placeholders SECTION_2/SECTION_3 filled in)
- Follow-up TODOs: none. Ratification date set to the adoption date (2026-10-23).
- Templates reviewed: none modified (this command only writes the constitution).
-->

# TAIF Website Constitution

This constitution governs the official TAIF (طَيْف) website: a bilingual (English/Arabic)
marketing and download site for the existing TAIF audio and video desktop application. It governs
the website only. The desktop application and its release pipeline are out of scope except where
the website consumes their published output.

## Core Principles

### I. Brand Integrity
The website MUST preserve the existing TAIF brand identity: its logo, typography, and visual
language. New visuals MUST derive from existing brand assets. The logo MUST NOT be redrawn,
recolored, distorted, or replaced without explicit owner approval.
Rationale: the site is the public face of an existing product; brand drift undermines trust.

### II. Product Accuracy
Site content MUST NOT invent features, supported formats, download links, release versions,
developer details, or compatibility claims. Every product claim MUST be traceable to a verified
source: the application repository, its README, its code, or a published GitHub Release. Anything
that cannot be verified MUST be omitted or marked as a tracked TODO, never guessed.
Rationale: false claims about software mislead users and damage credibility.

### III. Bilingual Quality
The site MUST ship complete English and Arabic experiences, with no untranslated or placeholder
strings in either language. Arabic MUST render right-to-left with correct layout mirroring, and
English left-to-right. Translations MUST read naturally, not as literal machine output. Both
languages MUST use accessible, legible typography with proper Arabic font support. Language
switching MUST be consistent on every page, MUST set the document `lang` and `dir` attributes,
and MUST preserve the user's current page.
Rationale: Arabic is a first-class audience, not a secondary locale.

### IV. Download Reliability
Verified GitHub Releases are the single source of truth for published builds, versions, and
downloadable assets. The site MUST NOT display a download link that has not been confirmed to
exist on a published release. It MUST NOT hardcode fabricated URLs or versions. When release data
is unavailable, the site MUST degrade gracefully to a link to the Releases page with a clear
message, never a broken or guessed link.
Rationale: a broken or fake download is the most damaging failure for a download site.

### V. Security First
All external data, including GitHub API responses, MUST be validated against an expected shape
before use. GitHub release notes are untrusted text and MUST be rendered as escaped plain text or
through a strict sanitizer, never as raw HTML. Secrets, tokens, and credentials MUST NOT appear
in source, client bundles, logs, or the repository. The site MUST NOT request unnecessary
permissions, and each new dependency MUST be justified by a concrete need.
Rationale: the site ingests third-party content and must not become an attack surface.

### VI. Accessibility and Performance
The site MUST use semantic HTML, full keyboard navigation with visible focus states, and
sufficient color contrast (WCAG 2.1 AA as the target). Layouts MUST be responsive from phone to
desktop. Images and other assets MUST be optimized. Animations MUST honor
`prefers-reduced-motion`. Interactive controls MUST have accessible names in both languages.
Rationale: the site must be usable by everyone on any device and connection.

### VII. Maintainability
The codebase MUST use reusable components, typed data models where the stack supports them,
centralized configuration (repository coordinates, site metadata, links), and clear naming.
Translations MUST be centralized, not scattered inline. Setup, build, and deploy instructions
MUST be documented and kept current.
Rationale: a small site stays cheap to change only if its structure stays predictable.

### VIII. Deployment Safety
The website MUST be deployable to Vercel independently of the desktop application. It MUST NOT
modify, break, or couple itself to the Tauri application's source, build, or release pipeline.
Website tooling and configuration MUST be self-contained and MUST NOT alter the app's build
inputs.
Rationale: shipping a website must never risk the application's releases.

### IX. Evidence-Based Verification
Tests, builds, deployments, and functionality MUST NOT be claimed as verified unless they were
actually run or checked, and the evidence (command and result) MUST be reported. Anything not
checked MUST be stated as unverified.
Rationale: honest status reporting is required for trust in the work.

### X. Scope Discipline
Work MUST be limited to what the website needs. Unnecessary features, speculative abstractions,
overengineering, and unrelated architectural changes are prohibited. Added complexity MUST be
justified against a stated requirement.
Rationale: a lean site is faster, safer, and easier to maintain.

## Technical & Delivery Constraints

- Release data MUST be fetched from the project's GitHub repository, with caching and graceful
  failure handling so API rate limits or outages do not break the page.
- Repository coordinates, supported languages, and asset-name patterns MUST live in one
  configuration location.
- Only assets present on a published release MAY be offered as downloads, labeled with their
  actual platform and file name.
- The site MUST work without client-side secrets and MUST ship with appropriate security headers
  where the hosting platform allows.
- Privacy claims on the site MUST match the application's documented behavior.

## Development Workflow & Quality Gates

- Each change MUST be checked against this constitution before it is considered done.
- Before completion, the work MUST pass, at minimum, a production build, a lint/type check where
  configured, and manual verification of both languages (LTR and RTL) at mobile and desktop widths.
- Download links MUST be re-verified against live Releases data before release.
- Accessibility checks (keyboard traversal, contrast, reduced-motion) MUST be performed for any
  UI change.
- Pull requests MUST state what was verified and what was not (Principle IX).

## Governance

This constitution supersedes other practices for the TAIF website. Amendments MUST be made by
editing this file, documenting the rationale, and updating the version and dates. Versioning
follows semantic versioning: MAJOR for backward-incompatible principle removals or redefinitions,
MINOR for new principles or materially expanded guidance, PATCH for clarifications and wording
fixes. Compliance MUST be reviewed on every pull request and at each release; violations MUST be
fixed or explicitly justified in writing. The project README and the application repository serve
as runtime guidance for verified product facts.

**Version**: 1.0.0 | **Ratified**: 2026-10-23 | **Last Amended**: 2026-10-23

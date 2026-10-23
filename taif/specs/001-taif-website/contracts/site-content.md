# Contract: Site content module

Single source of verified facts and copy. Presentation code reads only these modules.

- `config/site.ts` — repository, developer, license, asset rules, cache policy (see data-model `SiteConfig`).
- `content/operations.ts` — exactly six `Operation` entries; ids and availability fixed by research §1. Descriptions must keep Trim ("keep the range") and Cut ("remove the middle and join") distinct.
- `content/{en,ar}.ts` — implement `Dictionary`; sections: nav, hero, showcase, features, how-it-works, downloads (all states), about, developer, faq, footer, meta, aria, 404.
- `content/screenshots.ts` — genuine captures only; empty array is valid.

Rules:
1. Each claim carries a comment pointing to its evidence (source file/README/release data).
2. Forbidden content: unverified formats, platforms (e.g., macOS, iOS, store availability), versions, ratings, user counts, personal details beyond name/role/links.
3. Tests: key parity en/ar (type + runtime), no empty strings, six operations present, developer links equal `SiteConfig`, no `http://` links, every external link has `rel="noopener noreferrer"`.

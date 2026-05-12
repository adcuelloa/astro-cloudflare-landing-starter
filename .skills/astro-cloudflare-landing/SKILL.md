---
name: astro-cloudflare-landing
description: Use when creating, adapting, or simplifying a Cloudflare Pages static-first landing page from astro-cloudflare-starter. Covers bilingual i18n, SEO, Cloudflare CDN Image Transformations with Astro Image, optional Pages Functions, analytics consent, and repo validation.
metadata:
  short-description: Build Pages-first Astro landings
---

# Astro Landing Page Skill

Use this skill to turn this repository into a focused landing page without
breaking its conventions.

## Read first

- `CLAUDE.md` for mandatory repo rules.
- `docs/LANDING_PAGE_PLAYBOOK.md` for the landing workflow.
- `docs/CLOUDFLARE_SETUP.md` if deployment, analytics, CDN, R2, headers, or
  custom domains are touched.
- `docs/IMAGE_ASSETS.md` when adding or changing images.

## Workflow

1. Identify the landing goal, audience, offer, CTA destination, locales, visual
   assets, and analytics needs.
2. Keep the first screen as the actual landing experience, not a generic
   marketing intro.
3. Use Astro components and i18n JSON. Do not hardcode user-facing strings in
   components.
4. Keep the site static unless the requested feature truly needs a Pages
   Function endpoint or advanced Workers runtime.
5. Host image masters remotely on the configured `PUBLIC_CDN_URL` R2/CDN custom
   domain and render with Astro `<Image />` so the image service emits
   `PUBLIC_CDN_URL + "/cdn-cgi/image/..."` URLs.
6. Update SEO metadata and `alternateLinks()` for every route changed.
7. Track CTAs with `data-zaraz-cta` only through the existing Zaraz wrapper.
8. Update Cloudflare docs when setup assumptions change.
9. Run validation before finishing.

## Common file map

- Home route: `src/pages/index.astro`, `src/pages/es/index.astro`
- Home copy: `src/i18n/locales/{en,es}/home.json`
- SEO copy: `src/i18n/locales/{en,es}/seo.json`
- Shared brand/nav copy: `src/i18n/locales/{en,es}/common.json`
- Components: `src/components/home/*.astro`
- SEO defaults: `src/lib/seo.ts`
- Routes and alternates: `src/i18n/slugs.ts`
- Design tokens: `src/styles/global.css`
- Cloudflare headers/redirects: `public/_headers`, `public/_redirects`
- Deploy docs: `docs/CLOUDFLARE_SETUP.md`

## Landing structure

Prefer compact, skimmable sections:

1. Hero with offer, CTA, and one strong visual.
2. Proof band.
3. Audience/problem.
4. Benefits.
5. Process or how it works.
6. Testimonials or outcomes.
7. FAQ.
8. Final CTA.

Only add sections that the content can support. Avoid decorative filler.

## Validation

Run, in order when practical:

```bash
pnpm fmt
pnpm type-check
pnpm lint
pnpm seo:audit
pnpm build
```

If pnpm fails due to sandbox store access, rerun the same command with the
required permission instead of skipping validation.

# Landing page playbook

Use this playbook to turn the template into a focused landing page without
fighting the architecture. The goal is a fast, mostly static, bilingual,
Cloudflare Pages static site that an agent or developer can ship
repeatedly.

## Recommended approach

Start from the existing home page and reduce the project around the landing
goal. Do not build a marketing shell on top of the template; make the landing
page the primary experience.

Good landing page structure:

1. Hero with the offer, primary CTA, supporting CTA, and one strong visual.
2. Social proof or credibility band.
3. Problem / audience section.
4. Offer or product/service details.
5. Benefits and differentiators.
6. Process, timeline, or how it works.
7. Testimonials, outcomes, or case study snippets.
8. FAQ.
9. Final CTA.

Keep it static unless there is a real dynamic requirement. A contact CTA can
link to email, WhatsApp, Calendly, Tally, Typeform, or another service before
adding Pages Functions.

## Inputs to collect

Before editing, collect:

| Input               | Example                                                         |
| ------------------- | --------------------------------------------------------------- |
| Brand/product name  | `Acme Studio`                                                   |
| Locale requirements | English only or English/Spanish                                 |
| Primary audience    | `Founders launching a service business`                         |
| Offer               | `A conversion-focused website in 7 days`                        |
| Primary CTA         | `Book a call`                                                   |
| CTA destination     | `/contact`, `mailto:`, WhatsApp, Calendly, form URL             |
| Proof               | logos, numbers, testimonials, portfolio links                   |
| Visual direction    | real product screenshots, editorial photos, abstract acceptable |
| Asset host          | `https://cdn.example.com/...`                                   |
| Analytics           | none, Web Analytics, Zaraz, GA4 via Zaraz                       |
| Legal pages         | keep default, customize, or remove from navigation              |

If an agent is missing any of these, it should choose conservative placeholders
and keep the content easy to replace.

## Files usually touched

| Area           | Files                                                           |
| -------------- | --------------------------------------------------------------- |
| Home page      | `src/pages/index.astro`, `src/pages/es/index.astro`             |
| Home sections  | `src/components/home/*.astro`                                   |
| Translations   | `src/i18n/locales/{en,es}/home.json`, `common.json`, `seo.json` |
| Route metadata | `src/i18n/slugs.ts` if adding/removing routes                   |
| SEO defaults   | `src/lib/seo.ts`                                                |
| Visual system  | `src/styles/global.css`                                         |
| Images         | CDN/R2 masters, Cloudflare image service, `public/_headers` CSP |
| Navigation     | `src/components/Header.astro`, `src/components/Footer.astro`    |
| Cloudflare     | `public/_headers`, `public/_redirects`, `.env.example`          |
| Documentation  | `README.md`, `docs/CLOUDFLARE_SETUP.md` if setup changes        |

## Landing page implementation rules

Follow the repo rules in `CLAUDE.md`:

- Every user-facing string goes through i18n JSON and `useTranslations()`.
- Use Astro components by default; avoid React.
- Use Tailwind utilities and theme tokens, no arbitrary values.
- Use Astro `<Image />` for visual assets.
- Keep one LCP image with `priority`.
- Use `data-*` hooks for animation, not visual class selectors.
- Use `astro:page-load` and `astro:before-swap` for lifecycle scripts.
- Track CTAs with `data-zaraz-cta="<stable-label>"` when analytics are enabled.

## How to create a landing from this template

1. **Rename the project placeholders**

   Update `package.json`, `astro.config.mjs`, `.env.example`, `src/lib/seo.ts`,
   and brand keys in `common.json`.

2. **Define the landing content model**

   Add or rewrite `home.json` keys for each section. Use nested keys like:

   ```json
   {
     "hero": {
       "eyebrow": "...",
       "title": "...",
       "description": "...",
       "primaryCta": "...",
       "secondaryCta": "..."
     },
     "proof": {
       "title": "..."
     }
   }
   ```

3. **Build sections as small Astro components**

   Keep sections focused. A landing with `HeroSection`, `ProofSection`,
   `BenefitsSection`, `ProcessSection`, `TestimonialsSection`, `FaqSection`,
   and `FinalCtaSection` is easier to maintain than one huge page file.

4. **Wire SEO and alternates**

   Use `getPageSeo(lang, "home")` and
   `alternateLinks("home", Astro.site!)`. Ensure title and description exist
   in both locale files.

5. **Add visuals**

   Use real screenshots/photos when inspection matters. Host prepared image
   masters on the `PUBLIC_CDN_URL` R2/CDN custom domain. Add that host to CSP.
   Use `<Image />` with explicit dimensions and `widths`/`sizes`; the configured
   image service will emit `PUBLIC_CDN_URL + "/cdn-cgi/image/..."` URLs for
   Cloudflare edge transformations.

6. **Simplify navigation**

   Landing pages usually need fewer nav items. Keep locale switching if the
   site is bilingual. Use CTA labels from translations.

7. **Review Cloudflare setup**

   Follow `docs/CLOUDFLARE_SETUP.md`: Pages deploy, env vars, custom domain,
   R2/CDN image host, optional Pages Functions, headers, redirects, analytics,
   and consent.

8. **Validate**

   Run:

   ```bash
   pnpm fmt
   pnpm type-check
   pnpm lint
   pnpm seo:audit
   pnpm build
   ```

## Optional reductions

For a pure one-page landing, consider removing:

| Remove                | Files/areas                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| Blog                  | `src/pages/blog/`, `src/pages/es/blog/`, `src/content/blog/`, blog nav keys |
| Legal nav links       | Header/Footer links only; keep legal pages if the business needs them       |
| Cookie banner + Zaraz | `src/lib/integrations/`, related `Layout.astro` scripts and CSS             |
| Spanish locale        | `src/pages/es/`, `src/i18n/locales/es/`, locale config and routes           |
| GSAP scroll animation | `src/lib/animations/`, imports, `data-reveal` hooks                         |

Do not remove bilingual support, legal pages, or consent tooling blindly if the
landing will run paid traffic or collect user data.

## Agent workflow

When asking an AI agent to create a landing, use this prompt shape:

```text
Use the local astro-cloudflare-landing skill.
Create a bilingual landing for [brand] targeting [audience].
Offer: [offer].
Primary CTA: [label] -> [destination].
Visual assets are hosted at [cdn URLs] / use placeholders if missing.
Keep Cloudflare Pages static-first and update docs if setup changes.
Run fmt, type-check, lint, seo:audit, and build.
```

The local skill is at `.skills/astro-cloudflare-landing/SKILL.md` and is
exposed to Claude-compatible tools through `.claude/skills`.

## Launch checklist

1. Brand placeholders replaced.
2. Production domain in `astro.config.mjs`.
3. CDN image domain in `public/_headers`.
4. One LCP image has `priority`; other images lazy-load.
5. SEO title/description fit each locale.
6. Canonical and `hreflang` links render.
7. CTA destinations work.
8. Consent copy matches actual tracking tools.
9. Zaraz tools are assigned to purposes if used.
10. Web Analytics or Zaraz pageviews are not duplicated.
11. `pnpm build` succeeds.
12. Cloudflare Pages preview URL or custom domain has no CSP, image, or asset errors.

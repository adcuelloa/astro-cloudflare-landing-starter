# astro-cloudflare-starter

Cloudflare Pages static-first Astro 6 starter for bilingual landing pages that should be
easy for a developer or AI agent to extend. It packages the patterns from the
MasterSteps site into a reusable base: typed i18n, content collections, SEO
helpers, Cloudflare image delivery, consent-gated Zaraz analytics, GSAP
animation entry points, and agent-ready project instructions.

This repo is intentionally **Cloudflare free-first**. The default architecture
targets Cloudflare Pages static hosting and only reaches for Pages Functions or
Workers when a project has a real runtime need.

## Quick Start

```bash
corepack enable
pnpm install
pnpm dev          # http://localhost:4321
pnpm build        # build to ./dist
pnpm preview      # preview the built site locally
pnpm type-check   # astro check
pnpm seo:audit    # validate collection frontmatter
pnpm fmt          # prettier
pnpm lint         # oxlint
```

Before deploying a real site, replace these placeholders:

| File                                    | Replace                                                    |
| --------------------------------------- | ---------------------------------------------------------- |
| `.env.example`                          | `PUBLIC_SITE_URL` and `PUBLIC_CDN_URL`                     |
| `astro.config.mjs`                      | Cloudflare image service settings if needed                |
| `src/lib/seo.ts`                        | `SITE_CONFIG` brand, email, author, and schema defaults    |
| `public/_headers`                       | CSP allowlists for real scripts, fonts, frames, and CDN    |
| `src/i18n/locales/{en,es}/common.json`  | `brand.name`, `brand.domain`, `brand.email`, `brand.phone` |
| `src/lib/integrations/cookieConsent.ts` | Cookie name and consent copy                               |
| `package.json`                          | `name` and `description`                                   |
| `.node-version`                         | Node version used locally and by Cloudflare Pages          |

## Developer And Agent DX

This template includes files that make the repo easier to continue from an IDE
or an AI coding agent:

| Path                                | Purpose                                                                 |
| ----------------------------------- | ----------------------------------------------------------------------- |
| `.vscode/extensions.json`           | Recommended VS Code extensions for Astro, Tailwind, oxlint, i18n, etc.  |
| `.vscode/settings.json`             | Format-on-save, Prettier, oxlint, Tailwind CSS, i18n Ally, search rules |
| `.vscode/launch.json`               | One-click Astro dev server launch                                       |
| `CLAUDE.md` / `AGENTS.md`           | Agent-facing coding rules and project conventions                       |
| `skills-lock.json`                  | Provenance and hash for the local starter skill                         |
| `.skills/astro-cloudflare-landing/` | Local starter skill for landing-page work                               |
| `.claude/skills -> ../.skills`      | Claude-compatible symlink to local skills                               |
| `docs/CLOUDFLARE_SETUP.md`          | Full Cloudflare setup guide for Pages, Functions, R2, images, and Zaraz |
| `docs/LANDING_PAGE_PLAYBOOK.md`     | Step-by-step guide to ship a landing page from this template            |

Recommended skills for agents working in this repo:

- `astro` for Astro component, routing, and content collection work.
- `tailwind-css-patterns` for Tailwind 4 and token-based styling.
- `typescript-advanced-types` for strict TypeScript changes.
- `cloudflare`, `cloudflare-deploy`, `wrangler`, and
  `workers-best-practices` for Cloudflare Pages, Pages Functions, and deployment work.
- `seo`, `web-perf`, and `accessibility` for production-quality review.
- `gsap-*` skills when changing page animations or ScrollTrigger behavior.
- `frontend-design` when creating or refining UI surfaces.
- `astro-cloudflare-landing` for turning this template into a focused landing page.

Note: this workspace exposes `.agents` as a read-only mount, so the bundled
local skill is stored in `.skills/` and exposed to Claude through
`.claude/skills`. For environments where `.agents` is writable, the preferred
agent-native layout is `.agents/skills/astro-cloudflare-landing` with
`.claude/skills -> ../.agents/skills`.

## Cloudflare Free-First Notes

Last checked against Cloudflare docs on **May 12, 2026**.

| Service                      | Free-first guidance                                                                                                                                                                                                                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare Pages             | Default target for this template. Static asset requests are free/unlimited when Functions are not invoked. Free limits include 500 builds/month, 1 concurrent build, 100 custom domains/project, 20,000 files/site, and 25 MiB max asset file size. |
| Pages Functions              | Optional for small endpoints such as forms or webhooks. Functions count against Workers-style quotas, so keep the landing static by default.                                                                                                        |
| R2                           | Use for image masters or downloadable files when the repo should not store binaries. Standard storage free tier includes 10 GB-month/month, 1M Class A ops/month, 10M Class B ops/month, and free internet egress.                                  |
| D1                           | Optional for lightweight dynamic features. Workers Free includes 5M rows read/day, 100k rows written/day, and 5 GB total storage; D1 has no data transfer/egress charge.                                                                            |
| Zaraz                        | This template's analytics wrappers assume Cloudflare Zaraz. Every account gets 1,000,000 free Zaraz Events/month; without paid usage billing, Zaraz is disabled until the next billing cycle after the free allocation is exceeded.                 |
| Cloudflare Images transforms | Default image delivery uses `PUBLIC_CDN_URL + "/cdn-cgi/image"` through a custom Astro image service. Images Free includes 5,000 unique transformations/month; keep width/quality/format recipes small and cache them.                              |

Sources:
[Pages limits](https://developers.cloudflare.com/pages/platform/limits/),
[Pages Functions pricing](https://developers.cloudflare.com/pages/functions/pricing/),
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[R2 pricing](https://developers.cloudflare.com/r2/pricing/),
[D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/),
[Zaraz pricing](https://developers.cloudflare.com/zaraz/pricing-info/), and
[Cloudflare Images pricing](https://developers.cloudflare.com/images/pricing/).

For the full setup workflow, see
[`docs/CLOUDFLARE_SETUP.md`](docs/CLOUDFLARE_SETUP.md). For landing-page
production, see
[`docs/LANDING_PAGE_PLAYBOOK.md`](docs/LANDING_PAGE_PLAYBOOK.md).

## Project Structure

```text
src/
├── components/                # Astro components
│   ├── home/HeroSection.astro
│   ├── icons/BrandMark.astro
│   ├── Header.astro
│   ├── Footer.astro
│   └── LanguagePicker.astro
├── content.config.ts          # Zod schemas for content collections
├── content/blog/{en,es}/      # Markdown posts, one folder per locale
├── data/                      # Sidecar JSON data: authors, categories
├── i18n/
│   ├── ui.ts                  # locale registry
│   ├── utils.ts               # typed useTranslations()
│   ├── slugs.ts               # localizedPath(), alternateLinks()
│   └── locales/{en,es}/*.json # translation namespaces
├── layouts/Layout.astro       # head/body shell, SEO, JSON-LD, init scripts
├── lib/
│   ├── animations/            # GSAP setup and page animation modules
│   ├── integrations/          # Cookie consent and Zaraz wrappers
│   ├── contentRouting.ts      # localized content URLs
│   ├── pageLifecycle.ts       # view transition lifecycle helpers
│   ├── seo.ts                 # SEO and JSON-LD helpers
│   └── utils.ts               # cn()
├── pages/                     # File-based routes; Spanish pages under /es
├── styles/global.css          # Tailwind 4 and design tokens
└── types/zaraz.d.ts           # window.zaraz type declarations
```

## Architecture Rules

### Internationalization

Every user-facing UI string goes through `useTranslations()` from
`@/i18n/utils`. Translation keys are inferred from
`src/i18n/locales/{en,es}/*.json`, so unknown keys fail type-check.

When adding a page:

1. Create `src/pages/<slug>.astro` and, if bilingual, the matching Spanish
   route under `src/pages/es/`.
2. Register the route in `src/i18n/slugs.ts`.
3. Add SEO copy in `src/i18n/locales/{en,es}/seo.json`.
4. Pass `alternates: alternateLinks(routeKey, Astro.site!)` to `Layout`.

### Images

Do not commit local image binaries. Masters should live on R2 or another CDN
and should be reasonably sized, high-quality sources for Cloudflare edge
transforms.

Use Astro `<Image />` from `astro:assets`, not raw `<img>`. The configured image
service turns `src`, `widths`, `quality`, and `format` into
`PUBLIC_CDN_URL + "/cdn-cgi/image/..."` URLs. Set `PUBLIC_CDN_URL` to the
Cloudflare R2/CDN custom domain that stores image masters and has Image
Transformations enabled. Include meaningful `alt`, numeric `width` and `height`,
`format`, `quality`, `loading`, and `decoding="async"`. Use `widths` and `sizes`
for fluid responsive images.

Standard image recipes live in [`docs/IMAGE_ASSETS.md`](docs/IMAGE_ASSETS.md).

### Animations

Use GSAP only. Page-scoped animation modules live in
`src/lib/animations/pages/` and should use stable `data-*` hooks instead of
visual class selectors. Bind to `astro:page-load`, clean up on
`astro:before-swap`, and respect `prefers-reduced-motion`.

### Analytics And Consent

Do not call `window.zaraz.track()` directly in components. Use typed wrappers in
`src/lib/integrations/zaraz.ts`.

For declarative CTA tracking, add `data-zaraz-cta="<label>"` to the element.
The delegated listener initialized by `Layout.astro` forwards clicks only when
marketing consent allows it.

## Cloudflare Deployment

The template builds a static Astro site for Cloudflare Pages. It does not use
`@astrojs/cloudflare` by default because basic landing pages, Pages Functions,
and Cloudflare CDN Image Transformations do not need an adapter.

Cloudflare Pages setup:

| Setting           | Value        |
| ----------------- | ------------ |
| Build command     | `pnpm build` |
| Build output      | `dist`       |
| Node package tool | `pnpm`       |

Use Pages Functions for small endpoints. Switch to Workers +
`@astrojs/cloudflare` only when a project needs SSR, Astro Actions, sessions,
Server Islands, or runtime Cloudflare bindings.

Review `public/_headers` before launch. The CSP is intentionally strict and
should only allow the real third-party hosts used by the site.

## Removing Pieces

| Want to remove      | Main files to delete or edit                                                                  |
| ------------------- | --------------------------------------------------------------------------------------------- |
| Spanish locale      | `src/i18n/locales/es/`, `src/pages/es/`, `src/content/blog/es/`, `src/i18n/ui.ts`, `slugs.ts` |
| Cookie banner/Zaraz | `src/lib/integrations/`, related imports/scripts in `Layout.astro`, consent CSS               |
| GSAP                | `src/lib/animations/`, page imports, `data-hero`, `data-hero-reveal`, and `data-reveal` hooks |
| Blog                | `src/pages/blog/`, `src/pages/es/blog/`, `src/content/blog/`, related route and nav keys      |
| Pages Functions     | Remove `functions/` and any form/API routes that depend on them                               |

Each optional piece is wired through named entry points, so searching the import
usually shows every callsite.

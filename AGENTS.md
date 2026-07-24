# astro-cloudflare-starter — Code conventions

This document gives AI agents (Claude Code, Cursor, etc.) the rules they need
to make changes that survive code review in this template.

## 1. Tech Stack

- **Astro 7** — Static site with View Transitions (`<ClientRouter />`).
- **TypeScript** — Strict mode, path alias `@/*` → `./src/*`.
- **Tailwind CSS 4** — Configured via VitePlugin (no PostCSS config file).
- **Cloudflare Pages** — Static-first deployment target; use Pages Functions for small endpoints.
- **Prettier + oxlint** — Format with `pnpm fmt`, lint with `pnpm lint`.

## 2. Code rules (CRITICAL)

- **No `any`** — use explicit types or `unknown`.
- **No `console.log`** in production code.
- **I18n required** — every user-facing string goes through `@/i18n/utils`.
- **Imports** — always `@/*` for internal paths.
- **Tailwind** — no inline `style={{ … }}` when a Tailwind class works.
- **No `window.onload` / `DOMContentLoaded`** — use `astro:page-load`.
- **No arbitrary Tailwind values** (`bg-[#F5A524]`) — extend the ramp instead.
- **No `framer-motion` / `motion/react`** — GSAP only.
- **No `axios`** — use native `fetch`.
- **No extra CSS files** — extend `src/styles/global.css` or use Astro scoped styles.
- **No React hooks** unless the component is explicitly React (avoid React if possible).

## 3. Project commands

```bash
pnpm dev         # http://localhost:4321
pnpm build       # static build → ./dist
pnpm type-check  # astro check
pnpm fmt
pnpm lint
pnpm seo:audit   # validates content collection frontmatter
```

## 4. I18n

`useTranslations()` infers keys from JSON files. When adding a namespace,
register it in `src/i18n/locales/{en,es}/index.ts`.

```ts
import { useTranslations } from "@/i18n/utils";

const lang = "en";
const t = useTranslations(lang);
const title = t("home.hero.title"); // autocomplete + type-checked
```

Routes are localized through `slugs.ts`:

```ts
localizedPath("es", "blog"); // → "/es/blog"
alternateLinks("blog", Astro.site!); // → [{ hreflang, href }, …]
```

## 5. Page lifecycle

`<ClientRouter />` makes navigation SPA-like.

- Hook to **`astro:page-load`**, not `DOMContentLoaded`.
- Listeners that bind in a `<script>` block **must** clean up on
  `astro:before-swap`. Use an `AbortController` whose `signal` is passed to
  every `addEventListener` so a single `controller.abort()` tears them all
  down. See `src/components/Header.astro` for the canonical pattern.
- Do **not** add `transition:persist` to the Header or Footer unless every
  locale-aware label, link, and state inside them is manually refreshed on
  navigation.

## 6. Animations

| Need                                                                | Tool                                                                 |
| ------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Tiny hover/active states, decorative CSS loops                      | Tailwind / CSS                                                       |
| Scroll reveals, staggered grids, pinning, scrubbed motion, SVG draw | GSAP ScrollTrigger (`scrollReveal.ts`, imported from `Layout.astro`) |
| Accordion/dropdown height transitions                               | GSAP or CSS with Astro lifecycle cleanup                             |

Markup hooks should be stable `data-*` attributes — never visual Tailwind
class selectors. Animation files live in `src/lib/animations/`:

- `scrollReveal.ts` — scroll batch reveal for `[data-scroll-reveal]`; imported
  once from `Layout.astro`. Pre-hide hooks live in `global.css` (`.js` gate).
- `pages/<name>.ts` — optional page-specific ScrollTrigger beyond scroll reveal.

Always `gsap.matchMedia()` for `prefers-reduced-motion` and breakpoints. Never
ship `markers: true`.

## 7. Analytics & Zaraz

- Don't call `window.zaraz.track()` directly in components. Use the typed
  wrappers in `@/lib/integrations/zaraz.ts`.
- For declarative CTA tracking, add `data-zaraz-cta="<label>"` to the element
  — the delegated listener (initialized once in `Layout.astro`) forwards the
  click to `trackCTAClick(label)`.
- Every tracking call is gated by the `marketing` consent category.

## 8. Images

- **No local image assets in the repo.** Masters live on the `PUBLIC_CDN_URL`
  Cloudflare R2/CDN custom domain (`https://cdn.acme.example.com/...`). The
  template uses a custom Cloudflare external image service so `<Image />` emits
  `PUBLIC_CDN_URL + "/cdn-cgi/image/..."` responsive URLs without downloading or
  transforming remote images during build.
- Always use Astro `<Image />` from `astro:assets` — never a raw `<img>`.
- Required props on every `<Image />`: meaningful `alt`, numeric `width`,
  numeric `height`, `quality`, `loading`, `decoding="async"`. Omit `format` by
  default so Cloudflare can negotiate `format=auto`; set it only when a fixed
  output format is intentional.
  For fluid layout use `widths` + `sizes`, not `densities`.
- Standard sizes (see `docs/IMAGE_ASSETS.md`):
  - Blog card: `width=720 height=405`, `quality=76`, `widths=[320,480,640,720]`.
  - Blog detail hero: `width=1200 height=675`, `quality=82`, `priority`.
  - Program / 4:3 feature: `width=960 height=720`, `quality=82`.
- Use `priority` on **one** LCP image per page only.

## 9. Adding a page

1. Create `src/pages/<slug>.astro` (and `src/pages/es/<slug-es>.astro` if i18n).
2. Wrap in `<Layout seo={…} />` and pass `alternates: alternateLinks(routeKey, Astro.site!)`.
3. Register the route key in `src/i18n/slugs.ts` and add titles to
   `locales/{en,es}/seo.json`.

## 10. Adding a translation key

1. Add the key to `src/i18n/locales/en/<namespace>.json`.
2. Add the same key to `src/i18n/locales/es/<namespace>.json`.
3. Use `t("namespace.path.to.key")` — autocomplete works automatically.

## 11. Forbidden

- `framer-motion`, `motion/react`, `axios`.
- New CSS files outside `src/styles/global.css` and Astro scoped styles.
- React hooks (`useEffect`, `useState`) unless component is explicitly React.
- Committed image binaries (use the CDN).
- Inline `style={{ … }}` when a Tailwind utility exists.
- Arbitrary Tailwind values (`bg-[#FF0000]`).
- Direct `window.zaraz.*` calls outside `lib/integrations/zaraz.ts`.

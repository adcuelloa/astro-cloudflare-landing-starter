# Architecture

Deep-dive into the patterns that make this template predictable.

## Pages → Layout → SEO

Every page (`src/pages/**/*.astro`) is a thin wrapper around `Layout.astro`:

```
page.astro
  ├─ resolves lang + alternates from slugs.ts
  ├─ calls getPageSeo(lang, key) for static pages
  │   OR contentSeo(...) + breadcrumbSchema + blogPostingSchema for entries
  └─ <Layout seo={…}> … </Layout>
                ▲
                │
       SeoMeta from lib/seo.ts
                │
        Layout.astro renders:
          - <title>, <meta description>
          - canonical, hreflang (incl. x-default)
          - OG + Twitter cards (incl. og:locale alternates)
          - article:published_time / modified_time (for ogType "article")
          - robots noindex,nofollow when seo.noindex
          - stitched JSON-LD: organizationSchema + page-specific schemas
```

The `Layout` also boots client-side modules **once** (init guard via dataset
attribute on `<html>`) and registers Zaraz pageview tracking on
`astro:after-swap`.

## I18n end-to-end

```
Browser request: /es/blog
        │
getLangFromUrl(Astro.url) → "es"
        │
useTranslations("es") returns a typed t() function
        │
t("blog.heading")  ──► looks up locales/es/blog.json → "Notas del equipo."
                       falls back to locales/en/blog.json on missing key
                       finally checks `common.*` for short keys
```

Routes:

```
localizedPath("es", "about")              → "/es/nosotros"
alternateLinks("about", site)             → [
                                              { hreflang: "en", href: "https://…/about" },
                                              { hreflang: "es", href: "https://…/es/nosotros" },
                                            ]
```

The `LanguagePicker` component reads the rendered `<link rel="alternate">`
tags from the page itself — so when you switch language on a blog post, you
land on the translated post, not the locale root.

## Content collections + routing

```
src/content/blog/en/hello-world.md   → id "en/hello-world"
src/content/blog/es/hola-mundo.md    → id "es/hola-mundo"
```

`entryLocale(entry)` returns `"en"` or `"es"` from the id prefix.
`entrySlug(entry)` returns the explicit `urlSlug` from frontmatter, or strips
the locale prefix from the id.

Translations are wired via a Zod `reference("blog")` field. The detail page
calls `getEntries(post.data.translations)` and uses
`localizedCollectionEntryPath()` to build hreflang alternates with no manual
path concatenation.

## Animations lifecycle

`<ClientRouter />` re-fires `astro:page-load` on every navigation. Every
animation module must:

1. Define `cleanup()` that `mm?.revert()` or `ctx?.revert()`.
2. Bind `astro:before-swap` → `cleanup`.
3. Bind `astro:page-load` → `init`.
4. Use a module-level `listenersBound` flag to avoid double-binding when the
   script tag re-runs.

See `lib/animations/scrollReveal.ts` for the canonical ScrollTrigger pattern.
It is imported once from `Layout.astro`, so any page can opt in with
`data-scroll-reveal` while the module still cleans up across view transitions.

## DOM cleanup pattern (Header, LanguagePicker)

```ts
let controller: AbortController | null = null;
let lifecycleBound = false;

function cleanup() {
  controller?.abort();
  controller = null;
}

function init() {
  cleanup();
  const c = new AbortController();
  controller = c;
  el.addEventListener("click", handler, { signal: c.signal });
}

init();
if (!lifecycleBound) {
  lifecycleBound = true;
  document.addEventListener("astro:before-swap", cleanup);
  document.addEventListener("astro:page-load", init);
}
```

This guarantees:

- Every listener bound during init is removed before the next navigation.
- Lifecycle hooks are registered exactly once per page load.

## Consent + analytics flow

```
Page load
   │
Layout inline script: zaraz.set("google_consent_default", denied,denied,…)
   │
initCookieConsent()
   │
  Banner shows → user clicks "Accept all" / "Necessary only"
   │
onConsent / onChange → syncZarazConsent(accepted)
   │
   ├─ window.zaraz.consent.setAll(accepted)
   │      └─ Zaraz at the edge starts/stops marketing tools
   └─ window.zaraz.set("google_consent_update", { ad_storage, … })
          └─ GCMv2 update signal for GA4/Google Ads
```

CTAs declare intent in markup:

```astro
<a href="/contact" data-zaraz-cta="hero-primary">Get started</a>
```

The delegated listener in `initZarazCTAListener()` (single document-level
binding) forwards the click to `trackCTAClick("hero-primary")`.

## Images

`<Image />` from `astro:assets` uses a custom external Cloudflare image
service. The component emits stable image markup without downloading or
transforming remote images at build time, and the browser fetches resized
variants from `PUBLIC_CDN_URL + "/cdn-cgi/image/..."`.

Render-time chain:

```
<Image src="https://cdn.…/blog/hello.webp" width={1200} height={675}
       widths={[480,640,720,960,1200]} sizes="…" quality={82} />
                            │
                Astro emits responsive <img srcset="
                  https://cdn.…/cdn-cgi/image/width=480,…/https://cdn.…/blog/hello.webp 480w,
                  https://cdn.…/cdn-cgi/image/width=640,…/https://cdn.…/blog/hello.webp 640w,
                  …
                ">
```

See `docs/IMAGE_ASSETS.md` for master sizing and per-asset settings.

## CSP and security

`public/_headers` ships strict defaults. When you add a third party
(YouTube embed, Stripe Checkout, Sentry, …) update the relevant CSP
directive. Test in production preview before promoting.

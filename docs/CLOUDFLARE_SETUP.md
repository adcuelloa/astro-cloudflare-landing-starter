# Cloudflare setup guide

Last reviewed against Cloudflare and Astro docs on **2026-08-06**.

This starter is **Cloudflare Workers static-first**:

- `output: "static"` keeps every route prerendered by default.
- `@astrojs/cloudflare` supplies the unified Workers entrypoint.
- Wrangler deploys `dist/` through Workers Static Assets.
- The custom image service continues to emit Cloudflare Image Transformation
  URLs through `PUBLIC_CDN_URL + "/cdn-cgi/image/..."`.

## 1. Why static Workers

Most landing pages are static: content is known at build time, images are fixed
or CDN-hosted, and the only dynamic needs are simple form/API endpoints. Astro is
excellent for this shape because it prerenders pages to static files.

Workers Static Assets keeps the default workflow simple:

```txt
pnpm build -> dist/ -> Cloudflare Workers
```

Static requests are served directly from the asset binding. The adapter
entrypoint is already present if the project later adds an on-demand route,
Astro Action, session, Server Island, or runtime binding.

Sources:
[Astro static output](https://docs.astro.build/en/reference/configuration-reference/#output),
[Astro on Cloudflare Workers](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/),
[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/), and
[Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/).

## 2. Cloudflare account and domain

Recommended setup:

1. Add the production domain as a Cloudflare zone.
2. Point nameservers to Cloudflare.
3. Use Cloudflare DNS for the production apex, `www`, and optional CDN host.
4. Create a Worker from the Git repository or deploy it with Wrangler.
5. Attach the production domain after the first successful deployment.

Typical hostnames:

```txt
example.com       # site
www.example.com   # optional redirect/canonical alias
cdn.example.com   # optional R2 custom domain for image masters
```

Source: [Workers custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/).

## 3. Repository placeholders

Before deploying a real site, replace:

| File                                    | Required change                                                     |
| --------------------------------------- | ------------------------------------------------------------------- |
| `.env.example`                          | Update `PUBLIC_SITE_URL` and `PUBLIC_CDN_URL`.                      |
| `astro.config.mjs`                      | Image domains are derived from `PUBLIC_CDN_URL`.                    |
| `src/lib/seo.ts`                        | Update `SITE_CONFIG` name, email, author, and schema defaults.      |
| `src/i18n/locales/{en,es}/common.json`  | Update brand name, domain, email, phone, and shared UI copy.        |
| `src/i18n/locales/{en,es}/seo.json`     | Update every route title and description.                           |
| `src/lib/integrations/cookieConsent.ts` | Rename the cookie and review consent labels/copy.                   |
| `public/_headers`                       | Replace `cdn.acme.example.com` and add real third-party allowlists. |
| `package.json`                          | Update package `name` and `description`.                            |
| `.node-version`                         | Pin the Node version validated locally and in Cloudflare Builds.    |
| `wrangler.jsonc`                        | Set the final Worker name, bindings, and compatibility date.        |

Keep `PUBLIC_*` variables non-secret. Astro exposes them to client-side code.

## 4. Cloudflare Workers deploy

Set the real Worker name in `wrangler.jsonc`, authenticate Wrangler, then run:

```bash
pnpm deploy
```

The script builds the static Astro site and runs `wrangler deploy`. For a
non-deploying validation use `pnpm build && pnpm exec wrangler deploy --dry-run`.

For Cloudflare Builds connected to Git, use `pnpm build` as the build command
and `pnpm deploy` as the deploy command. Pull requests receive preview versions.

Sources:
[Deploy an existing Astro project](https://developers.cloudflare.com/workers/framework-guides/web-apps/astro/#deploy-an-existing-astro-project)
and [Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/).

## 5. Optional runtime routes

Keep the landing static until it needs a contact endpoint, webhook, Astro
Action, session, Server Island, or Cloudflare binding. Add those as Astro
on-demand routes so they share the existing adapter and Worker deployment;
there is no separate functions directory.

Source: [Astro on-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/).

## 6. Image strategy

Default image strategy:

1. Store high-quality image masters on an R2/CDN custom domain.
2. Keep the Astro site static and deploy it to Cloudflare Workers.
3. Use Astro `<Image />` from `astro:assets`.
4. Let the custom Astro image service emit Cloudflare Image Transformation URLs
   through `PUBLIC_CDN_URL + "/cdn-cgi/image/..."`.
5. Configure a Cache Rule for `/cdn-cgi/image/` so repeated requests hit cache.

This works without `sharp` and without build-time remote image downloads. The
adapter is configured with `imageService: "custom"`, so the browser receives real responsive
variants from Cloudflare's CDN Image Transformations instead of repeated
descriptors pointing at the same master.

`PUBLIC_CDN_URL` is the single image-domain variable. It should point to the
Cloudflare R2/CDN custom domain that stores the source masters and has Image
Transformations enabled, for example `https://cdn.example.com`. Using an
absolute CDN URL lets local `pnpm dev`, preview builds, and production all test
the same Cloudflare transformation path.

Config:

```js
import { defineConfig } from "astro/config";

const cdnBaseUrl = (process.env.PUBLIC_CDN_URL ?? "https://cdn.acme.example.com").replace(
  /\/+$/,
  ""
);
const cdnHostname = new URL(cdnBaseUrl).hostname;

export default defineConfig({
  image: {
    domains: [cdnHostname],
    service: {
      entrypoint: "./src/lib/images/cloudflareImageService.mjs",
      config: {
        baseUrl: cdnBaseUrl,
        defaultFit: "cover",
        defaultFormat: "webp",
        defaultQuality: 82,
        metadata: "none",
        onerror: "redirect",
      },
    },
  },
});
```

Set the CDN once:

```bash
PUBLIC_CDN_URL=https://cdn.example.com pnpm dev
```

Use this by default:

```astro
---
import { Image } from "astro:assets";
---

<Image
  src="https://cdn.example.com/hero.webp"
  alt="Meaningful description"
  width={1200}
  height={675}
  quality={82}
  widths={[480, 720, 960, 1200]}
  sizes="(min-width: 768px) 720px, calc(100vw - 2rem)"
  loading="eager"
  decoding="async"
  priority
/>
```

Expected output shape:

```html
<img
  src="https://cdn.example.com/cdn-cgi/image/width=1200,height=675,fit=cover,quality=82,format=webp,metadata=none,onerror=redirect/https://cdn.example.com/hero.webp"
  srcset="
    https://cdn.example.com/cdn-cgi/image/width=480,height=270,fit=cover,quality=82,format=webp,metadata=none,onerror=redirect/https://cdn.example.com/hero.webp   480w,
    https://cdn.example.com/cdn-cgi/image/width=720,height=405,fit=cover,quality=82,format=webp,metadata=none,onerror=redirect/https://cdn.example.com/hero.webp   720w,
    https://cdn.example.com/cdn-cgi/image/width=1200,height=675,fit=cover,quality=82,format=webp,metadata=none,onerror=redirect/https://cdn.example.com/hero.webp 1200w
  "
  width="1200"
  height="675"
  alt="Meaningful description"
/>
```

Tradeoffs:

- Builds do not download or transform remote images.
- Cloudflare transforms happen on first request and are cached afterward.
- Each unique source + width + height + quality + format combination is a
  unique transformation, so keep the recipe list intentionally small.
- The source master should still be reasonably sized and metadata-stripped.

For landing pages, this keeps the Astro build static while still using the
Cloudflare CDN for resized image delivery.

Sources:
[Astro Images](https://docs.astro.build/en/guides/images/)
[Astro image configuration](https://docs.astro.build/en/reference/configuration-reference/#image),
and [Cloudflare Images features](https://developers.cloudflare.com/images/optimization/features/).

## 7. Optional image processing modes

The default should stay Cloudflare CDN Image Transformations. Use another mode
only when the project has a real need:

| Need                                     | Mode                                          |
| ---------------------------------------- | --------------------------------------------- |
| Static landing + real resized CDN images | Custom Cloudflare image service + Cache Rule  |
| No transformation quota at all           | Switch to `passthroughImageService()`         |
| Build-time image optimization            | Remove custom service and install `sharp`     |
| Astro SSR/runtime image integration      | Workers + `@astrojs/cloudflare` advanced mode |

### `/cdn-cgi/image` Cache Rule

Cloudflare's URL interface uses this shape:

```txt
https://cdn.example.com/cdn-cgi/image/width=960,quality=82,format=webp/https://cdn.example.com/hero.webp
```

Use it when:

- The project wants Cloudflare to transform images at the edge.
- The team accepts the Cloudflare Images transformation quota.
- The source images are public and fetchable by Cloudflare.
- The R2/CDN custom domain has Image Transformations enabled.
- Cache Rules are configured for `/cdn-cgi/image/` on the CDN zone.

Recommended Cache Rule expression:

```txt
starts_with(http.request.uri.path, "/cdn-cgi/image/")
```

Recommended settings:

| Setting                 | Recommendation                                                                |
| ----------------------- | ----------------------------------------------------------------------------- |
| Cache eligibility       | Eligible for cache                                                            |
| Edge TTL                | High TTL for versioned image filenames                                        |
| Browser TTL             | Moderate TTL, for example 1 day to 1 week                                     |
| Cache Deception Armor   | Enabled                                                                       |
| Query string handling   | Ignore query string only if image URLs never use signed/version query strings |
| Cache key normalization | Do not collapse width, quality, or format transformation params               |

Important:

- Cache Rules reduce repeated transformations and cache fragmentation.
- They do not make unlimited unique transformation variants free.
- Keep width/quality/format combinations intentionally small.
- Version image masters by path or filename, not query string.
- Do not ignore the transformation path options in the cache key. Width,
  height, quality, and format live in the path, not in the query string.

Sources:
[Cloudflare Images pricing](https://developers.cloudflare.com/images/pricing/),
[Cache Rules](https://developers.cloudflare.com/cache/how-to/cache-rules/),
[Custom cache keys](https://developers.cloudflare.com/cache/how-to/cache-keys/), and
[Cache Deception Armor](https://developers.cloudflare.com/cache/cache-security/cache-deception-armor/).

## 8. R2 CDN for image masters

Use R2 when the project needs remote media without committing binary assets.

Recommended production shape:

1. Create an R2 bucket, for example `example-assets`.
2. Add a custom domain such as `cdn.example.com`.
3. Upload optimized WebP/JPG/PNG masters following `docs/IMAGE_ASSETS.md`.
4. Add the host to `public/_headers` `img-src`.
5. Enable Image Transformations for the CDN zone.
6. Set `PUBLIC_CDN_URL=https://cdn.example.com`.
7. Use Astro `<Image />` with remote URLs from that CDN.

R2 buckets are private by default. Public access must be enabled explicitly.
Use a custom domain for production. The Cloudflare-managed `r2.dev` URL is for
development and does not provide the same caching, WAF, Access, or bot
management controls. Cloudflare accepts source images from the same zone where
transformations are served by default, so a CDN custom domain that both serves
masters and handles `/cdn-cgi/image/` is the simplest setup.

Sources:
[R2 create buckets](https://developers.cloudflare.com/r2/buckets/create-buckets/),
[R2 public buckets](https://developers.cloudflare.com/r2/buckets/public-buckets/),
and [R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/).

## 9. Headers and redirects

This template ships:

- `public/_headers` for security, CSP, and cache headers.
- `public/_redirects` for simple legacy redirects.

Astro copies `public/` into `dist/`, so Workers Static Assets reads these files
from the deployed output.

Sources:
[Static Assets headers](https://developers.cloudflare.com/workers/static-assets/headers/)
and [Static Assets redirects](https://developers.cloudflare.com/workers/static-assets/redirects/).

## 10. Zaraz, Web Analytics, and consent

This template includes wrappers in `src/lib/integrations/zaraz.ts` and a
cookie-consent bridge in `src/lib/integrations/cookieConsent.ts`.

Recommended setup:

1. Attach the production domain to the Worker.
2. Enable Zaraz or Web Analytics for that zone.
3. If using Zaraz, add third-party tools such as GA4, Meta Pixel, or marketing
   automation inside Zaraz.
4. Assign every tool to the correct consent purpose.
5. Use `data-zaraz-cta="<stable-label>"` in markup for CTA tracking.
6. Disable duplicate SPA pageview tracking if the dashboard tool and the code
   both track client-side navigations.

The code must not call `window.zaraz.track()` directly from components. Use the
typed wrappers so consent gating stays centralized.

Sources:
[Zaraz](https://developers.cloudflare.com/zaraz/),
[Zaraz consent management](https://developers.cloudflare.com/zaraz/consent-management/),
[Zaraz Consent API](https://developers.cloudflare.com/zaraz/consent-management/api/),
and [Cloudflare Web Analytics](https://developers.cloudflare.com/web-analytics/).

## 11. Adding runtime features

The Workers adapter is already configured. Add runtime rendering only when the
project needs:

- SSR/on-demand rendering.
- Astro Actions.
- Sessions.
- Server Islands.
- Runtime access to D1, KV, private R2, Durable Objects, or other bindings from
  Astro components/routes.
- Adapter-managed Cloudflare image services.

After adding or renaming bindings in `wrangler.jsonc`, run
`pnpm wrangler:types`. Keep routes prerendered unless they genuinely need the
runtime.

Sources:
[Astro Cloudflare adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
and [Astro on Cloudflare Workers](https://developers.cloudflare.com/workers/frameworks/framework-guides/astro/).

## 12. Launch workflow

1. `pnpm fmt`
2. `pnpm type-check`
3. `pnpm lint`
4. `pnpm seo:audit`
5. `pnpm build`
6. Check the Workers preview URL.
7. Verify canonical and `hreflang` links.
8. Verify CSP does not block images, scripts, fonts, forms, or frames.
9. Verify image assets are generated and served from `dist/`.
10. Verify CTA destinations and consent behavior.
11. Confirm Web Analytics or Zaraz pageviews are not duplicated.
12. Submit `https://example.com/sitemap-index.xml`.

## 13. Free-first limits to watch

| Product                      | Free-first watchpoint                                                                                                                     |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Cloudflare Workers           | Static assets are served directly; runtime invocations use Workers quotas. Keep routes prerendered unless they need server behavior.      |
| Cloudflare Images transforms | Optional only. Images Free includes 5,000 unique transformations/month when using `/cdn-cgi/image` or Cloudflare image transformations.   |
| R2                           | Standard storage free tier includes 10 GB-month/month, 1M Class A ops/month, 10M Class B ops/month, and free internet egress.             |
| Zaraz                        | 1,000,000 free Zaraz Events/month; if paid usage is not enabled, Zaraz pauses until the next cycle after the free allocation is exceeded. |

Sources:
[Workers limits](https://developers.cloudflare.com/workers/platform/limits/),
[Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/),
[Cloudflare Images pricing](https://developers.cloudflare.com/images/pricing/),
[R2 pricing](https://developers.cloudflare.com/r2/pricing/), and
[Zaraz pricing](https://developers.cloudflare.com/zaraz/pricing-info/).

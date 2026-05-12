# Image asset guide

This guide covers how to prepare and organize image masters before uploading
them to your CDN (this template assumes a Cloudflare R2 bucket served through
`https://cdn.acme.example.com/...`, but the conventions transfer to any CDN).

## Goal

Use the CDN for **high-quality masters**, not original camera files and not
heavily compressed final delivery files. Astro `<Image />` is wired to a custom
Cloudflare image service that emits `PUBLIC_CDN_URL + "/cdn-cgi/image/..."`
URLs for responsive Cloudflare Image Transformations.

```txt
Original source file
  └─ kept outside the CDN if long-term archival is needed

CDN (R2 / S3 / similar)
  └─ cropped, reasonably sized, metadata-stripped WebP master

Astro Image
  └─ https://cdn.acme.example.com/cdn-cgi/image variants generated at the edge
```

## Image modes

The starter defaults to Astro `<Image />` with a custom external image service,
without a Cloudflare adapter:

```astro
<Image src="https://cdn.acme.example.com/hero.webp" widths={[480, 720, 1200]} ... />
```

Prefer this mode for static landing pages that want real resized image delivery:
it deploys cleanly to Cloudflare Pages, avoids build-time image downloads, and
uses Cloudflare's CDN Image Transformations directly.

Astro still provides useful image markup: required `alt`, explicit dimensions,
responsive `srcset` descriptors, `sizes`, `loading`, `decoding`, and
`fetchpriority` when `priority` is used. The custom service turns each requested
width into a `https://cdn.acme.example.com/cdn-cgi/image/width=...` URL.

Cloudflare Images Free includes 5,000 unique transformations per month. Keep
the width, quality, and format combinations small so landing pages stay
free-first.

Decision rule:

| Need                                       | Preferred mode                          |
| ------------------------------------------ | --------------------------------------- |
| Default static landing on Cloudflare Pages | Cloudflare image service + Cache Rule   |
| R2/CDN masters with fixed landing assets   | Cloudflare image service + Cache Rule   |
| No build-time image downloads              | Cloudflare image service or passthrough |
| No transformation quota                    | Astro `passthroughImageService()`       |
| Build-time optimized variants              | Astro default image service + `sharp`   |

Configure the `/cdn-cgi/image/` Cache Rule described in
`docs/CLOUDFLARE_SETUP.md` before launch.

The template uses a single image-domain variable:

```env
PUBLIC_CDN_URL=https://cdn.acme.example.com
```

Use a Cloudflare R2/CDN custom domain here, not an `r2.dev` URL. The same domain
stores source masters, is allowlisted by Astro through `image.domains`, and
serves Image Transformations through `/cdn-cgi/image/` in local dev, preview,
and production.

## Master format

- **WebP** for photo masters.
- Strip EXIF/GPS/metadata before upload.
- Do **not** upload full-size PNGs for photos.
- Use PNG only for raster logos, transparency, screenshots with sharp UI text,
  or graphics where PNG is genuinely the better source.
- Avoid aggressive master compression. Cloudflare re-encodes transformed
  variants, so a low-quality master shows visible double lossy compression
  after delivery.

## Master size table

| Asset type                          | Aspect ratio                | Master size                | Format              | Quality        | Target size       |
| ----------------------------------- | --------------------------- | -------------------------- | ------------------- | -------------- | ----------------- |
| Blog card / blog featured image     | `16:9`                      | `1800×1013`                | WebP                | `q90-92`       | `300 KB – 1.2 MB` |
| Blog detail hero / featured article | `16:9`                      | `1800×1013` or `2000×1125` | WebP                | `q92`          | `500 KB – 1.5 MB` |
| Events / conferences                | `16:9`                      | `1800×1013`                | WebP                | `q90-92`       | `400 KB – 1.5 MB` |
| Home / program feature              | `4:3`                       | `1600×1200`                | WebP                | `q90-92`       | `500 KB – 1.6 MB` |
| Main site hero                      | `16:9`, `3:2`, or editorial | `2200-2400px` long edge    | WebP                | `q92-94`       | `800 KB – 2.5 MB` |
| About / editorial photo             | `3:2`                       | `1800×1200`                | WebP                | `q90-92`       | `500 KB – 1.6 MB` |
| Authors / team portraits            | `1:1`                       | `800×800`                  | WebP                | `q90`          | `80 KB – 350 KB`  |
| Open Graph social image             | `1.91:1`                    | `1200×630`                 | JPG or WebP         | `q88-92`       | `150 KB – 600 KB` |
| Raster logo / transparent graphic   | source                      | actual max rendered size   | PNG or WebP losless | lossless       | depends           |
| Screenshot / UI                     | source                      | `1200-1600px` wide         | PNG or WebP         | lossless / q92 | depends           |

## Folder conventions

Use stable, lowercase paths that match the content type:

```txt
hero/landing.webp
blog/hello-world.webp
blog/design-tokens.webp
events/launch-2026.webp
authors/team.webp
og-image-en.jpg
og-image-es.jpg
```

Prefer descriptive slugs over dates unless the date is part of the content
identity. Avoid spaces, uppercase filenames, query-string cache busting, and
direct R2 public URLs in code or content. Version by filename/path instead:

```txt
hero-v2.webp
case-study/acme-home-v3.webp
```

## Compression commands

Examples using ImageMagick. Review the crop visually before uploading
important hero or program images.

Blog / events 16:9:

```bash
magick input.jpg \
  -auto-orient \
  -resize 1800x1013^ \
  -gravity center \
  -extent 1800x1013 \
  -strip \
  -quality 92 \
  output.webp
```

Programs / home 4:3:

```bash
magick input.jpg \
  -auto-orient \
  -resize 1600x1200^ \
  -gravity center \
  -extent 1600x1200 \
  -strip \
  -quality 92 \
  output.webp
```

Hero 3:2 long edge:

```bash
magick input.jpg \
  -auto-orient \
  -resize 2400x1600^ \
  -gravity center \
  -extent 2400x1600 \
  -strip \
  -quality 94 \
  output.webp
```

Author / portrait 1:1:

```bash
magick input.jpg \
  -auto-orient \
  -resize 800x800^ \
  -gravity center \
  -extent 800x800 \
  -strip \
  -quality 90 \
  output.webp
```

Open Graph:

```bash
magick input.jpg \
  -auto-orient \
  -resize 1200x630^ \
  -gravity center \
  -extent 1200x630 \
  -strip \
  -quality 90 \
  output.jpg
```

## Delivery quality in code

The CDN master is the source image that Cloudflare fetches and transforms. Keep
masters high quality but not camera-original heavy.

Use `<Image />` `quality` to control the Cloudflare delivery payload:

| Use in Astro                 | Recommended output quality |
| ---------------------------- | -------------------------: |
| Small blog cards / grids     |                       `76` |
| Blog detail / program images |                       `82` |
| Main LCP hero                |                    `84–86` |

These values assume the CDN source is a high-quality WebP master from the
table above.

Keep the `widths`, `quality`, and `format` combinations intentionally small.
In the default Cloudflare image service, each `widths` entry becomes a unique
`PUBLIC_CDN_URL + "/cdn-cgi/image/width=..."` URL. Fewer combinations mean fewer
unique edge transformations.

## Required `<Image />` props

```astro
---
import { Image } from "astro:assets";
---

<Image
  src="https://cdn.acme.example.com/blog/hello.webp"
  alt="Stylized welcome graphic with abstract gradient"
  width={1200}
  height={675}
  format="webp"
  quality={82}
  widths={[480, 640, 720, 960, 1200]}
  sizes="(min-width: 768px) 720px, calc(100vw - 2rem)"
  priority
  {/* ← only on the single LCP image per page */}
  loading="eager"
  {/* ← LCP only; otherwise "lazy" */}
  decoding="async"
  class="aspect-video w-full rounded-lg object-cover"
/>
```

Always include: meaningful `alt`, numeric `width`/`height`, `format`,
`quality`, `loading`, `decoding="async"`. For fluid layout images use
`widths` + `sizes` rather than `densities`.

## Fetch priority

Use `priority` on the **single likely LCP image** per page. Astro maps it to
high fetch priority and eager loading. Do **not** use it on image grids,
below-the-fold images, or multiple competing images on the same route.

## View transitions

Use `transition:name` only when the source and destination intentionally share
the same content identity AND a compatible aspect ratio. A shared transition
animates the browser snapshot; it does not change how the CDN image is loaded.

## AVIF

AVIF can be useful for final delivery but is not the default master format
here. Use AVIF masters only for secondary photo sets where storage pressure
matters and the result has been checked visually. Do not use low-quality
AVIF masters for site, hero, program, or editorial images.

---
title: "Hello, World"
urlSlug: "hello-world"
seoTitle: "Hello, World — Acme starter blog"
description: "A first post showing how content collections, frontmatter, hreflang alternates, and JSON-LD work in this template."
pubDate: 2026-01-15T10:00:00.000Z
authors: ["en/acme-team"]
categories: ["en/engineering"]
translations: ["es/hola-mundo"]
image: "https://cdn.acme.example.com/blog/hello-world.webp"
imageAlt: "Stylized welcome graphic with abstract gradient"
noindex: false
---

This is the first post in the Acme starter blog. The frontmatter above declares
everything the SEO and routing helpers need to produce:

- a localized canonical URL
- `hreflang` alternates pointing to its Spanish translation
- a `BlogPosting` JSON-LD object with `author`, `articleSection`, and dates
- breadcrumbs for the index → post path

## How translations are linked

The `translations: ["es/hola-mundo"]` field references another entry in the
same collection. The blog detail page reads that reference and uses
`localizedCollectionEntryPath()` to build a per-language URL — no manual URL
construction needed.

## Reading time

The `readTime` value comes from a remark plugin in `astro.config.mjs`. It runs
once at build time and injects the rounded number of minutes into the entry's
frontmatter.

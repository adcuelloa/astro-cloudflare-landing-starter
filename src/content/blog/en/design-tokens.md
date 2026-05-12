---
title: "Design tokens that survive contact with reality"
urlSlug: "design-tokens"
seoTitle: "Design tokens that survive contact with reality"
description: "How to organize a color, type, and spacing system in Tailwind 4 so designers and engineers stay in sync."
pubDate: 2026-02-20T10:00:00.000Z
authors: ["en/acme-team"]
categories: ["en/design"]
image: "https://cdn.acme.example.com/blog/design-tokens.webp"
imageAlt: "Color swatches arranged on a neutral background"
---

Most token systems break the moment a designer adds one color outside the ramp.
This template keeps that under control by:

1. Defining ramps in `@theme` inside `src/styles/global.css`.
2. Exposing semantic tokens (`--accent-primary`, `--fg-link`) for components.
3. Forbidding arbitrary Tailwind values like `bg-[#F5A524]` — new shades go
   into the ramp.

## Why semantic tokens

Components should not know whether the brand color is sky-700 or sky-800 today.
They reference `--accent-primary` and the ramp underneath can shift without a
component-wide refactor.

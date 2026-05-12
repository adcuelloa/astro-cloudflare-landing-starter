---
title: "Hola, Mundo"
urlSlug: "hola-mundo"
seoTitle: "Hola, Mundo — Blog de la plantilla Acme"
description: "Primer post que muestra cómo funcionan las colecciones de contenido, el frontmatter, los alternates hreflang y JSON-LD en esta plantilla."
pubDate: 2026-01-15T10:00:00.000Z
authors: ["es/acme-team"]
categories: ["es/engineering"]
translations: ["en/hello-world"]
image: "https://cdn.acme.example.com/blog/hello-world.webp"
imageAlt: "Gráfico de bienvenida con gradiente abstracto"
noindex: false
---

Este es el primer post del blog de la plantilla Acme. El frontmatter declara
todo lo que los helpers de SEO y enrutado necesitan para producir:

- una URL canónica localizada
- `hreflang` apuntando a la traducción en inglés
- un objeto JSON-LD `BlogPosting` con `author`, `articleSection` y fechas
- breadcrumbs de índice → post

## Traducciones enlazadas

`translations: ["en/hello-world"]` referencia otra entrada en la misma
colección. La página de detalle lee esa referencia y usa
`localizedCollectionEntryPath()` para construir la URL por idioma — sin
concatenar paths a mano.

## Tiempo de lectura

`readTime` viene de un plugin remark en `astro.config.mjs`. Corre una vez en
build y deja minutos redondeados en el frontmatter de la entrada.

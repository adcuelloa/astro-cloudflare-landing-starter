import type { Locale } from "@/i18n/slugs";
import { ui } from "@/i18n/ui";
import { entrySlug } from "@/lib/contentRouting";

/**
 * SEO helpers — one source of truth for titles, descriptions, OG/Twitter cards,
 * canonical URLs, hreflang alternates, and JSON-LD schema.
 *
 * Pages call `getPageSeo()` for static routes and `contentSeo()` for collection
 * entries, then pass the result to <Layout seo={...} />.
 */

type StructuredDataValue =
  | string
  | number
  | boolean
  | null
  | StructuredDataValue[]
  | { [key: string]: StructuredDataValue };

export type StructuredData = Record<string, StructuredDataValue>;

export type SeoImage = {
  alt?: string;
  url: string;
};

export type SeoMeta = {
  alternates?: ReadonlyArray<{ hreflang: string; href: string }>;
  canonicalUrl?: string;
  description: string;
  image?: SeoImage;
  noindex?: boolean;
  ogType?: "website" | "article";
  publishedTime?: string;
  structuredData?: ReadonlyArray<StructuredData>;
  title: string;
  updatedTime?: string;
};

/**
 * SITE_CONFIG centralizes site identity used by every JSON-LD helper.
 * Override via env vars at build time or edit this object once.
 */
const siteUrl = (import.meta.env.PUBLIC_SITE_URL ?? "https://acme.example.com").replace(/\/+$/, "");

const SITE_CONFIG = {
  name: "Acme",
  url: siteUrl,
  logo: `${siteUrl}/favicon.svg`,
  email: "hello@acme.example.com",
  author: "Acme",
  areaServed: "Global",
} as const;

export type PageSeoKey =
  | "home"
  | "about"
  | "blog"
  | "contact"
  | "legalPrivacy"
  | "legalTerms"
  | "legalCookies";

/** Resolve a static page's title + description from locale JSON. */
export function getPageSeo(lang: Locale, key: PageSeoKey): Pick<SeoMeta, "title" | "description"> {
  return ui[lang].seo[key];
}

/**
 * Build SEO meta for a content collection entry (blog post, etc.).
 * Prefers an explicit `seoTitle` from frontmatter; falls back to "<title> — <site>".
 */
export function contentSeo(data: {
  description: string;
  image?: string;
  imageAlt?: string;
  noindex?: boolean;
  seoTitle?: string;
  title: string;
}): Pick<SeoMeta, "description" | "image" | "noindex" | "title"> {
  return {
    title: data.seoTitle ?? `${data.title} — ${SITE_CONFIG.name}`,
    description: data.description,
    image: data.image ? { url: data.image, alt: data.imageAlt } : undefined,
    noindex: data.noindex,
  };
}

export function contentSlug(entry: { data?: { urlSlug?: string }; id: string }): string {
  return entrySlug(entry);
}

/** Serialize an array of JSON-LD objects into <script> tags for `set:html`. */
export function jsonLdScript(items: ReadonlyArray<StructuredData>): string {
  return items
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`)
    .join("");
}

export function organizationSchema(description: string): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    logo: SITE_CONFIG.logo,
    description,
    email: SITE_CONFIG.email,
    areaServed: SITE_CONFIG.areaServed,
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function blogPostingSchema(data: {
  authors: string[];
  categories: string[];
  description: string;
  image?: string;
  imageAlt?: string;
  lang: Locale;
  published: Date;
  title: string;
  updated?: Date;
  url: string;
}): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: data.title,
    description: data.description,
    mainEntityOfPage: { "@type": "WebPage", "@id": data.url },
    datePublished: data.published.toISOString(),
    dateModified: (data.updated ?? data.published).toISOString(),
    url: data.url,
    image: data.image
      ? [{ "@type": "ImageObject", url: data.image, caption: data.imageAlt ?? data.title }]
      : null,
    author: data.authors.map((name) => ({ "@type": "Person", name })),
    articleSection: data.categories,
    keywords: data.categories.join(", "),
    inLanguage: data.lang,
    isAccessibleForFree: true,
    publisher: { "@type": "Organization", name: SITE_CONFIG.name, url: SITE_CONFIG.url },
  };
}

/** Resolve a relative path to an absolute URL using the site origin. */
export function withSite(path: string, site: URL): string {
  return new URL(path, site).href;
}

export { SITE_CONFIG };

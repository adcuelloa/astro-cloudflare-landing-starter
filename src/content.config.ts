import { defineCollection, reference } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

/**
 * Content collections.
 *
 * Layout convention:
 *   src/content/<collection>/<locale>/<slug>.md
 *
 * The `<locale>` prefix is read by `entryLocale()` in lib/contentRouting.ts
 * and used to build localized URLs and hreflang alternates.
 */

const blog = defineCollection({
  loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    authors: z.array(reference("authors")),
    categories: z.array(reference("categories")),
    /** Linked translations of the same post — used to build hreflang alternates. */
    translations: z.array(reference("blog")).optional(),
    image: z.url().optional(),
    imageAlt: z.string().optional(),
    noindex: z.boolean().default(false),
    /** Optional explicit <title>. Falls back to "<title> — <site>". */
    seoTitle: z.string().max(70).optional(),
    /** Optional URL slug override; otherwise derived from filename. */
    urlSlug: z.string().optional(),
  }),
});

const authors = defineCollection({
  loader: glob({ base: "./src/data/authors", pattern: "**/*.json" }),
  schema: z.object({
    name: z.string(),
    bio: z.string(),
    avatar: z.url().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
  }),
});

const categories = defineCollection({
  loader: glob({ base: "./src/data/categories", pattern: "**/*.json" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    image: z.url().optional(),
  }),
});

export const collections = { blog, authors, categories };

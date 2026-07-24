/**
 * SEO audit — pre-build sanity check for static metadata and content collections.
 *
 * Run via `pnpm seo:audit`. Wire it into CI before `astro build` to catch:
 *   - static titles and descriptions outside recommended search-result lengths
 *   - missing required frontmatter fields
 *   - images that don't have an `imageAlt`
 *   - duplicate `urlSlug` within the same locale
 *   - overly long titles or descriptions
 *   - use of the reserved `slug` key (Astro reserves it; use `urlSlug` instead)
 *
 * Extend `collections` and `requiredFields` to match your content.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const contentRoot = join(root, "src", "content");
const localesRoot = join(root, "src", "i18n", "locales");
const collections = ["blog"];
const requiredFields = ["title", "description", "urlSlug"];
const titleRange = { min: 50, max: 60 };
const descriptionRange = { min: 120, max: 158 };
const errors = [];
const warnings = [];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith(".md") || path.endsWith(".mdx") ? [path] : [];
  });
}

function parseFrontmatter(file) {
  const source = readFileSync(file, "utf8");
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/))
      .filter(Boolean)
      .map((matchLine) => {
        const [, key, rawValue] = matchLine;
        return [key, rawValue.replace(/^["']|["']$/g, "")];
      })
  );
}

function localeFor(file) {
  const parts = relative(contentRoot, file).split("/");
  return parts[1] ?? "unknown";
}

for (const locale of ["en", "es"]) {
  const seo = JSON.parse(readFileSync(join(localesRoot, locale, "seo.json"), "utf8"));

  for (const [page, metadata] of Object.entries(seo)) {
    const label = `${locale}.seo.${page}`;

    if (
      typeof metadata.title !== "string" ||
      metadata.title.length < titleRange.min ||
      metadata.title.length > titleRange.max
    ) {
      errors.push(`${label}.title must be ${titleRange.min}-${titleRange.max} characters`);
    }

    if (
      typeof metadata.description !== "string" ||
      metadata.description.length < descriptionRange.min ||
      metadata.description.length > descriptionRange.max
    ) {
      errors.push(
        `${label}.description must be ${descriptionRange.min}-${descriptionRange.max} characters`
      );
    }
  }
}

for (const collection of collections) {
  const dir = join(contentRoot, collection);
  const seenSlugs = new Map();

  for (const file of walk(dir)) {
    const frontmatter = parseFrontmatter(file);
    const label = relative(root, file);
    const locale = localeFor(file);

    for (const field of requiredFields) {
      if (!frontmatter[field]) errors.push(`${label}: missing ${field}`);
    }

    if (frontmatter.slug) {
      errors.push(`${label}: use urlSlug instead of Astro-reserved slug`);
    }

    if (frontmatter.image && !frontmatter.imageAlt) {
      errors.push(`${label}: image requires imageAlt`);
    }

    if (frontmatter.seoTitle && frontmatter.seoTitle.length > 70) {
      warnings.push(`${label}: seoTitle is longer than 70 characters`);
    }

    if (frontmatter.description && frontmatter.description.length > 170) {
      warnings.push(`${label}: description is longer than 170 characters`);
    }

    const slugKey = `${locale}:${frontmatter.urlSlug}`;
    const existing = seenSlugs.get(slugKey);
    if (existing) {
      errors.push(`${label}: duplicate urlSlug for ${slugKey}; first seen in ${existing}`);
    }
    seenSlugs.set(slugKey, label);
  }
}

if (warnings.length > 0) {
  process.stdout.write(`SEO warnings:\n${warnings.map((item) => `- ${item}`).join("\n")}\n`);
}

if (errors.length > 0) {
  process.stderr.write(`SEO audit failed:\n${errors.map((item) => `- ${item}`).join("\n")}\n`);
  process.exit(1);
}

process.stdout.write("SEO audit passed.\n");

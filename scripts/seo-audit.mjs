import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const appDir = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(appDir, "..");
const LOCALES_DIR = resolve(ROOT, "src/i18n/locales");
const CONTENT_DIR = resolve(ROOT, "src/content");

const TITLE_MIN = 50;
const TITLE_MAX = 60;
const DESC_MIN = 120;
const DESC_MAX = 158;

// noindex pages never appear in search results, so SERP title/description
// length limits don't apply to them.
const NOINDEX_PAGES = new Set(["notFound"]);

function parseFrontmatter(file) {
  const source = readFileSync(file, "utf8");
  const match = source.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  return Object.fromEntries(
    match[1]
      .split("\n")
      .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/))
      .filter(Boolean)
      .map(([, key, rawValue]) => [key, rawValue.replace(/^["']|["']$/g, "")])
  );
}

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return path.endsWith(".md") || path.endsWith(".mdx") ? [path] : [];
  });
}

function checkLocale(lang) {
  const seoPath = resolve(LOCALES_DIR, lang, "seo.json");
  const seoData = JSON.parse(readFileSync(seoPath, "utf-8"));
  const i18nCommon = JSON.parse(readFileSync(resolve(LOCALES_DIR, lang, "common.json"), "utf-8"));
  let allOk = true;
  let staticOk = 0;
  let staticFail = 0;
  let blogOk = 0;
  let blogFail = 0;
  let blogNoImage = 0;
  let blogImageNoAlt = 0;

  console.info(`\n# ${lang.toUpperCase()}\n`);

  // --- Static pages from seo.json ---
  console.info("## Static pages\n");

  for (const [page, seo] of Object.entries(seoData)) {
    if (NOINDEX_PAGES.has(page)) {
      staticOk++;
      console.info(`  ⏭️  ${page} (noindex, skipped)`);
      continue;
    }

    const tLen = seo.title.length;
    const dLen = seo.description.length;

    const tOk = tLen >= TITLE_MIN && tLen <= TITLE_MAX;
    const dOk = dLen >= DESC_MIN && dLen <= DESC_MAX;

    if (tOk && dOk) {
      staticOk++;
      console.info(`  ✅  ${page}`);
    } else {
      staticFail++;
      allOk = false;
      if (!tOk) {
        console.info(`  ❌  ${page}.title (${tLen}) — expected ${TITLE_MIN}–${TITLE_MAX}`);
      }
      if (!dOk) {
        console.info(`  ❌  ${page}.description (${dLen}) — expected ${DESC_MIN}–${DESC_MAX}`);
      }
    }
  }

  // --- Blog posts from content collections ---
  const blogDir = resolve(CONTENT_DIR, "blog", lang);

  if (statSync(blogDir, { throwIfNoEntry: false })?.isDirectory()) {
    const posts = walk(blogDir);
    if (posts.length > 0) {
      console.info("\n## Blog posts\n");

      for (const file of posts) {
        const fm = parseFrontmatter(file);
        const label = relative(ROOT, file);

        if (!fm.title || !fm.description) {
          allOk = false;
          blogFail++;
          console.info(`  ❌  ${label}: missing title or description`);
          continue;
        }

        const effectiveTitle = fm.seoTitle ?? `${fm.title} — Acme`;
        const tLen = effectiveTitle.length;
        const dLen = fm.description.length;

        const tOk = tLen >= TITLE_MIN && tLen <= TITLE_MAX;
        const dOk = dLen >= DESC_MIN && dLen <= DESC_MAX;

        const hasImage = Boolean(fm.image);
        const hasAlt = Boolean(fm.imageAlt);
        const imageAltOk = !hasImage || hasAlt; // schema requires alt when image is set

        if (tOk && dOk && imageAltOk) {
          blogOk++;
          console.info(`  ✅  ${label}`);
        } else {
          blogFail++;
          allOk = false;
          if (!tOk) {
            console.info(`  ❌  ${label} title (${tLen}) — expected ${TITLE_MIN}–${TITLE_MAX}`);
          }
          if (!dOk) {
            console.info(`  ❌  ${label} description (${dLen}) — expected ${DESC_MIN}–${DESC_MAX}`);
          }
          if (hasImage && !hasAlt) {
            console.info(`  ❌  ${label}: image set but imageAlt missing`);
          }
        }

        if (!hasImage) blogNoImage++;
        if (hasImage && !hasAlt) blogImageNoAlt++;
      }
    }
  }

  // --- Social / OG summary ---
  console.info("\n## Social / Open Graph\n");

  const fallbackImage = i18nCommon?.meta?.ogImage;
  if (fallbackImage) {
    console.info(`  ℹ️  Static pages use fallback: cdn.acme.com/${fallbackImage}`);
  } else {
    allOk = false;
    console.info(`  ❌  No ogImage fallback configured in meta.ogImage`);
  }

  if (blogNoImage > 0) {
    console.info(`  ⚠️  ${blogNoImage} blog post(s) without og:image (will use fallback)`);
  }

  if (blogImageNoAlt > 0) {
    console.info(`  ❌  ${blogImageNoAlt} blog post(s) with image but missing imageAlt`);
  }

  const totalOk = staticOk + blogOk;
  const totalFail = staticFail + blogFail;
  console.info(`\n  Pages: ${totalOk} ✅  ${totalFail > 0 ? `${totalFail} ❌` : "0 ❌"}`);

  return allOk;
}

const enOk = checkLocale("en");
const esOk = checkLocale("es");

console.info(`\n${enOk && esOk ? "✅  All pages pass" : "❌  Some pages need attention"}`);
process.exit(enOk && esOk ? 0 : 1);

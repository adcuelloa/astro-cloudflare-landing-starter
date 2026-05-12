// @ts-check

import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { toString } from "mdast-util-to-string";
import getReadingTime from "reading-time";

const siteUrl = (process.env.PUBLIC_SITE_URL ?? "https://acme.example.com").replace(/\/+$/, "");
const cdnBaseUrl = (process.env.PUBLIC_CDN_URL ?? "https://cdn.acme.example.com").replace(
  /\/+$/,
  ""
);
const cdnHostname = new URL(cdnBaseUrl).hostname;

/**
 * Remark plugin that injects `readTime` (minutes, rounded up) into each
 * markdown entry's frontmatter so pages can show "5 min read" without
 * re-parsing the body at runtime.
 */
export function remarkReadingTime() {
  /**
   * @param {unknown} tree
   * @param {{ data?: { astro?: { frontmatter?: Record<string, unknown> } } }} file
   */
  return function (tree, file) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    const frontmatter = file.data?.astro?.frontmatter;
    if (frontmatter) {
      frontmatter.readTime = Math.ceil(readingTime.minutes);
    }
  };
}

export default defineConfig({
  site: siteUrl,
  output: "static",
  trailingSlash: "never",
  integrations: [sitemap()],
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
  markdown: {
    remarkPlugins: [remarkReadingTime],
  },
  build: {
    inlineStylesheets: "always",
    format: "file",
  },
  vite: {
    plugins: [tailwindcss()],
    build: {
      assetsInlineLimit: 1024,
      target: "es2022",
      sourcemap: false,
      chunkSizeWarningLimit: 800,
    },
  },
  i18n: {
    defaultLocale: "en",
    locales: ["en", "es"],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});

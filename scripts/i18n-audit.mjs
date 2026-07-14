import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const root = process.cwd();
const sourceRoot = join(root, "src");
const localesRoot = join(sourceRoot, "i18n", "locales");
const locales = ["en", "es"];
const sourceExtensions = new Set([".astro", ".js", ".jsx", ".mjs", ".ts", ".tsx"]);
const translationPattern = /\bt\(\s*["']([^"']+)["']\s*\)/g;
const pageSeoPattern = /\bgetPageSeo\(\s*[^,]+,\s*["']([^"']+)["']\s*\)/g;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path);
    return [path];
  });
}

function flattenKeys(value, prefix = "") {
  if (Array.isArray(value) || value === null || typeof value !== "object") {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key)
  );
}

function translationKeys(locale) {
  const directory = join(localesRoot, locale);
  return new Set(
    readdirSync(directory)
      .filter((file) => file.endsWith(".json"))
      .flatMap((file) => {
        const namespace = file.replace(/\.json$/, "");
        const data = JSON.parse(readFileSync(join(directory, file), "utf8"));
        return flattenKeys(data, namespace);
      })
  );
}

function usedTranslations() {
  /** @type {Map<string, string[]>} */
  const references = new Map();

  for (const file of walk(sourceRoot)) {
    if (!sourceExtensions.has(file.slice(file.lastIndexOf(".")))) continue;
    const source = readFileSync(file, "utf8");
    const label = relative(root, file);

    for (const match of source.matchAll(translationPattern)) {
      const key = match[1];
      if (!key) continue;
      const files = references.get(key) ?? [];
      files.push(label);
      references.set(key, files);
    }

    for (const match of source.matchAll(pageSeoPattern)) {
      const pageKey = match[1];
      if (!pageKey) continue;

      for (const field of ["title", "description"]) {
        const key = `seo.${pageKey}.${field}`;
        const files = references.get(key) ?? [];
        files.push(label);
        references.set(key, files);
      }
    }
  }

  return references;
}

function printList(title, values) {
  if (values.length === 0) return;
  process.stdout.write(`\n${title}:\n${values.map((value) => `- ${value}`).join("\n")}\n`);
}

/** @type {Map<string, Set<string>>} */
const keysByLocale = new Map(locales.map((locale) => [locale, translationKeys(locale)]));
const defined = new Set();
for (const keys of keysByLocale.values()) {
  for (const key of keys) defined.add(key);
}

const used = usedTranslations();
const usedKeys = new Set(used.keys());
const alphabetical = (a, b) => a.localeCompare(b);
const unused = [...defined].filter((key) => !usedKeys.has(key)).toSorted(alphabetical);
const unknown = [...usedKeys].filter((key) => !defined.has(key)).toSorted(alphabetical);

/** @type {Map<string, string[]>} */
const missingByLocale = new Map(
  locales.map((locale) => {
    const keys = keysByLocale.get(locale) ?? new Set();
    return [locale, [...defined].filter((key) => !keys.has(key)).toSorted(alphabetical)];
  })
);

process.stdout.write(
  `I18n audit: ${usedKeys.size} used keys, ${defined.size} defined keys, ${unused.length} unused keys.\n`
);
printList("Unused keys", unused);
printList(
  "Unknown references",
  unknown.map((key) => `${key} (${used.get(key)?.join(", ") ?? "unknown source"})`)
);

for (const [locale, missing] of missingByLocale) {
  printList(`Missing ${locale} keys`, missing);
}

if (
  process.argv.includes("--strict") &&
  (unused.length > 0 ||
    unknown.length > 0 ||
    [...missingByLocale.values()].some((missing) => missing.length > 0))
) {
  process.exit(1);
}

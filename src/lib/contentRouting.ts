import { type Locale, locales, localizedPath, type RouteKey } from "@/i18n/slugs";

type SluggedEntry = {
  data?: { urlSlug?: string };
  id: string;
};

const isLocale = (value: string): value is Locale => locales.some((locale) => locale === value);

/**
 * Detect the locale of a content collection entry from its `id` prefix.
 * Collection entries are stored under `src/content/<collection>/<locale>/...`.
 */
export function entryLocale(entry: { id: string }): Locale {
  const candidate = entry.id.split("/")[0];
  return isLocale(candidate) ? candidate : "es";
}

/**
 * Prefer an explicit `urlSlug` from frontmatter; fall back to the locale-stripped id.
 */
export function entrySlug(entry: SluggedEntry): string {
  return entry.data?.urlSlug ?? entry.id.replace(/^[a-z]{2}\//, "");
}

export function localizedEntryPath(locale: Locale, route: RouteKey, entry: SluggedEntry): string {
  return `${localizedPath(locale, route)}/${entrySlug(entry)}`;
}

export function localizedCollectionEntryPath(route: RouteKey, entry: SluggedEntry): string {
  return localizedEntryPath(entryLocale(entry), route, entry);
}

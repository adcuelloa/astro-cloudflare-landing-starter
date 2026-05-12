import { type Locale, locales, localizedPath, type RouteKey } from "@/i18n/slugs";

type SluggedEntry = {
  data?: { urlSlug?: string };
  id: string;
};

/**
 * Detect the locale of a content collection entry from its `id` prefix.
 * Collection entries are stored under `src/content/<collection>/<locale>/...`.
 */
export function entryLocale(entry: { id: string }): Locale {
  const candidate = entry.id.split("/")[0];
  return locales.includes(candidate as Locale) ? (candidate as Locale) : "en";
}

/**
 * Prefer an explicit `urlSlug` from frontmatter; fall back to the
 * locale-stripped id. This lets translations use different slugs while
 * sharing the same canonical reference.
 */
export function entrySlug(entry: SluggedEntry): string {
  return entry.data?.urlSlug ?? entry.id.replace(/^[a-z]{2}\//, "");
}

export function localizedEntryPath(locale: Locale, route: RouteKey, entry: SluggedEntry): string {
  return `${localizedPath(locale, route)}/${entrySlug(entry)}`;
}

/** Convenience: derives the locale from the entry itself. */
export function localizedCollectionEntryPath(route: RouteKey, entry: SluggedEntry): string {
  return localizedEntryPath(entryLocale(entry), route, entry);
}

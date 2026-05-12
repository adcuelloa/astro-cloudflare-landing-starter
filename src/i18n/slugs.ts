export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

/**
 * Map of route keys → per-locale URL segments. The empty string for `home`
 * keeps the root page at `/` and `/es`.
 *
 * Add a new route by adding a new key here AND adding a matching entry in
 * `src/i18n/locales/{en,es}/seo.json` so SEO helpers can find its title.
 */
export const routeSegments = {
  home: { en: "", es: "" },
  about: { en: "about", es: "nosotros" },
  blog: { en: "blog", es: "blog" },
  contact: { en: "contact", es: "contacto" },
  legalPrivacy: { en: "privacy", es: "privacidad" },
  legalTerms: { en: "terms", es: "terminos" },
  legalCookies: { en: "cookies", es: "cookies" },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routeSegments;

function localePrefix(locale: Locale): string {
  return locale === defaultLocale ? "" : `/${locale}`;
}

/** Build a localized path for a top-level route. */
export function localizedPath(locale: Locale, route: RouteKey): string {
  const segment = routeSegments[route][locale];
  const prefix = localePrefix(locale);
  return segment ? `${prefix}/${segment}` : prefix || "/";
}

/** Build the full hreflang alternates set for a top-level route. */
export function alternateLinks(
  route: RouteKey,
  site: URL
): Array<{ hreflang: Locale; href: string }> {
  return locales.map((locale) => ({
    hreflang: locale,
    href: new URL(localizedPath(locale, route), site).href,
  }));
}

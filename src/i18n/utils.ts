import { defaultLang, ui } from "./ui";

// 1. Exact shape of your translations
type LocaleSchema = (typeof ui)[typeof defaultLang];

// 2. Only dot-paths
export type NestedPaths<T> = T extends object
  ? {
      [K in keyof T]-?: K extends string ? K | `${K}.${NestedPaths<T[K]>}` : never;
    }[keyof T]
  : never;

export type TranslationKey = NestedPaths<LocaleSchema> | NestedPaths<LocaleSchema["common"]>;

// 3. Infer exact return type from a path
export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export type GetTranslationType<K extends string> =
  PathValue<LocaleSchema, K> extends never
    ? PathValue<LocaleSchema["common"], K>
    : PathValue<LocaleSchema, K>;

export function getLangFromUrl(url: URL) {
  const segments = url.pathname.split("/").filter(Boolean);

  // Handles `/es`, `/es/`, `/es/index.html`, and build-time paths like `/client/es.html`.
  for (const seg of segments) {
    const candidate = seg.replace(/\.html$/, "");
    if (candidate in ui) return candidate as keyof typeof ui;
  }

  return defaultLang;
}

export function useTranslations(lang: keyof typeof ui) {
  // Strict key → exact type. Dynamic key → string fallback.
  function t<K extends TranslationKey>(key: K): GetTranslationType<K>;
  function t(key: string): string;

  function t(key: string): unknown {
    const langLocales = ui[lang] ?? ui[defaultLang];
    const defaultLocales = ui[defaultLang];

    const isRecord = (value: unknown): value is Record<string, unknown> =>
      typeof value === "object" && value !== null;

    const getByPath = (obj: unknown, path: string): unknown => {
      if (!isRecord(obj)) return undefined;
      return path.split(".").reduce<unknown>((acc, part) => {
        return isRecord(acc) ? acc[part] : undefined;
      }, obj);
    };

    // 1. Exact path in current language
    let value = getByPath(langLocales, key);
    if (value !== undefined) return value;

    // 2. Exact path in default language
    value = getByPath(defaultLocales, key);
    if (value !== undefined) return value;

    // 3. Fallback: lookup inside `common` namespace, current language
    value = getByPath(langLocales.common, key);
    if (value !== undefined) return value;

    // 4. Fallback: `common` in default language
    value = getByPath(defaultLocales.common, key);
    if (value !== undefined) return value;

    return "";
  }

  return t;
}

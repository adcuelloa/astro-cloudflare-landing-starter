import { defaultLang, ui } from "./ui";

type LocaleSchema = (typeof ui)[typeof defaultLang];

type Primitive = string | number | boolean | null;

type LeafPaths<T> = T extends Primitive
  ? never
  : T extends readonly unknown[]
    ? never
    : {
        [K in Extract<keyof T, string>]: T[K] extends Primitive | readonly unknown[]
          ? K
          : T[K] extends object
            ? `${K}.${LeafPaths<T[K]>}`
            : K;
      }[Extract<keyof T, string>];

export type TranslationKey = LeafPaths<LocaleSchema>;

export type PathValue<T, P extends string> = P extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? PathValue<T[K], Rest>
    : never
  : P extends keyof T
    ? T[P]
    : never;

export function getLangFromUrl(url: URL) {
  const segments = url.pathname.split("/").filter(Boolean);

  for (const seg of segments) {
    const candidate = seg.replace(/\.html$/, "");
    if (candidate in ui) return candidate as keyof typeof ui;
  }

  return defaultLang;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getByPath(obj: unknown, path: string): unknown {
  if (!isRecord(obj)) return undefined;

  return path.split(".").reduce<unknown>((acc, part) => {
    return isRecord(acc) ? acc[part] : undefined;
  }, obj);
}

export function useTranslations(lang: keyof typeof ui) {
  return function t<K extends TranslationKey>(key: K): PathValue<LocaleSchema, K> {
    const langLocales = ui[lang] ?? ui[defaultLang];
    const defaultLocales = ui[defaultLang];

    const value = getByPath(langLocales, key) ?? getByPath(defaultLocales, key) ?? "";

    return value as PathValue<LocaleSchema, K>;
  };
}

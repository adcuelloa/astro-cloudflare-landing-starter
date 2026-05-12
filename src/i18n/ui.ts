import { locale as enLocale } from "./locales/en";
import { locale as esLocale } from "./locales/es";

type LocaleSchema = typeof enLocale;

const en: LocaleSchema = enLocale;
const es: LocaleSchema = esLocale;

export const ui = {
  en,
  es,
} as const;

export const languages = {
  en: "English",
  es: "Español",
};

export const defaultLang = "en";

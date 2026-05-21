/**
 * GDPR cookie banner and preferences via [Vanilla CookieConsent](https://cookieconsent.orestbida.com/).
 * Marketing tracking is gated through Cloudflare Zaraz, which respects this category.
 *
 * Usage:
 *  - Import and call `initCookieConsent()` once from Layout.astro.
 *  - Place a `data-cookie-settings` attribute on any element (button/link) to
 *    open the preferences modal — the helper handles clicks with delegated listeners.
 */

import { run as runCookieConsent, setLanguage, showPreferences } from "vanilla-cookieconsent";

import { syncZarazConsent } from "@/lib/integrations/zaraz";

import { $$ } from "../dom-selector";

let started = false;
let cookieConsentReady: Promise<void> | null = null;
let activeLanguage: "en" | "es" | null = null;
let settingsListenerBound = false;

function getPageLanguage(): "en" | "es" {
  return window.location.pathname.split("/").filter(Boolean)[0] === "es" ? "es" : "en";
}

/** Re-apply theme class to the consent root if it appears late. */
function styleConsentRoot(): void {
  document.getElementById("cc-main")?.classList.add("cc--theme");
}

export function initCookieConsent(): void {
  if (typeof document === "undefined" || started) return;
  started = true;
  activeLanguage = getPageLanguage();
  document.documentElement.lang = activeLanguage;

  initCookieSettingsListener();

  cookieConsentReady = runCookieConsent({
    mode: "opt-in",
    autoShow: true,
    lazyHtmlGeneration: false,
    root: "#cookie-consent-root",
    onConsent: ({ cookie }) => {
      syncZarazConsent(cookie.categories.includes("marketing"));
    },
    onChange: ({ cookie }) => {
      syncZarazConsent(cookie.categories.includes("marketing"));
    },
    hideFromBots: true,
    disablePageInteraction: false,
    cookie: {
      name: "acme_cookie_consent",
      expiresAfterDays: 365,
      sameSite: "Lax",
    },
    guiOptions: {
      consentModal: {
        layout: "box",
        position: "bottom right",
        flipButtons: false,
        equalWeightButtons: true,
      },
      preferencesModal: {
        layout: "box",
        position: "right",
        flipButtons: false,
        equalWeightButtons: true,
      },
    },
    categories: {
      necessary: {
        readOnly: true,
        enabled: true,
      },
      marketing: {
        enabled: false,
        autoClear: {
          cookies: [{ name: "_fbp" }, { name: "_fbc" }],
          reloadPage: true,
        },
      },
    },
    language: {
      default: activeLanguage,
      translations: {
        en: {
          consentModal: {
            title: "Cookies",
            description:
              "We use necessary cookies for the site to work and, only with your permission, optional marketing cookies for campaign measurement.",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Necessary only",
            showPreferencesBtn: "Customize",
            footer: `<a href="/privacy" class="cc__link">Privacy Policy</a>`,
          },
          preferencesModal: {
            title: "Cookie preferences",
            acceptAllBtn: "Accept all",
            acceptNecessaryBtn: "Reject optional",
            savePreferencesBtn: "Save preferences",
            closeIconLabel: "Close",
            sections: [
              {
                title: "Cookie use",
                description:
                  "You can change your choice at any time from the cookie preferences link in the footer.",
              },
              {
                title: "Strictly necessary",
                description:
                  "Required to save your cookie choice and support basic site operation.",
                linkedCategory: "necessary",
              },
              {
                title: "Marketing",
                description:
                  "Analytics and campaign measurement tools managed through Cloudflare Zaraz. These only run if you accept this option.",
                linkedCategory: "marketing",
              },
            ],
          },
        },
        es: {
          consentModal: {
            title: "Cookies",
            description:
              "Usamos cookies necesarias para el funcionamiento del sitio y, solo con tu permiso, cookies opcionales de marketing para medir campañas.",
            acceptAllBtn: "Aceptar todo",
            acceptNecessaryBtn: "Solo necesarias",
            showPreferencesBtn: "Personalizar",
            footer: `<a href="/es/privacidad" class="cc__link">Política de privacidad</a>`,
          },
          preferencesModal: {
            title: "Preferencias de cookies",
            acceptAllBtn: "Aceptar todo",
            acceptNecessaryBtn: "Rechazar opcionales",
            savePreferencesBtn: "Guardar preferencias",
            closeIconLabel: "Cerrar",
            sections: [
              {
                title: "Uso de cookies",
                description:
                  "Puedes cambiar tu elección en cualquier momento desde el enlace de preferencias del pie de página.",
              },
              {
                title: "Estrictamente necesarias",
                description:
                  "Imprescindibles para guardar tu decisión sobre cookies y el funcionamiento básico del sitio.",
                linkedCategory: "necessary",
              },
              {
                title: "Marketing",
                description:
                  "Herramientas de analítica y medición de campañas gestionadas vía Cloudflare Zaraz. Solo se activan si aceptas esta opción.",
                linkedCategory: "marketing",
              },
            ],
          },
        },
      },
    },
    onModalReady: ({ modalName }) => {
      if (modalName === "consentModal" || modalName === "preferencesModal") {
        styleConsentRoot();
      }
    },
  }).then(() => {
    styleConsentRoot();
    void syncCookieConsentPage();
  });

  document.addEventListener("astro:page-load", () => {
    void syncCookieConsentPage();
  });
}

async function syncCookieConsentPage(): Promise<void> {
  await cookieConsentReady;

  const nextLanguage = getPageLanguage();
  document.documentElement.lang = nextLanguage;

  if (activeLanguage !== nextLanguage) {
    activeLanguage = nextLanguage;
    await setLanguage(nextLanguage, true);
    styleConsentRoot();
  }

  syncCookieSettingsButtons();
}

function syncCookieSettingsButtons(): void {
  $$("[data-cookie-settings]").forEach((el) => {
    el.setAttribute("aria-haspopup", "dialog");
  });
}

function initCookieSettingsListener(): void {
  if (settingsListenerBound) return;
  settingsListenerBound = true;

  document.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof Element)) return;

    const el = target.closest<HTMLElement>("[data-cookie-settings]");
    if (!el) return;

    e.preventDefault();
    await syncCookieConsentPage();
    showPreferences();
  });
}

/**
 * Centralized Zaraz analytics module.
 * All window.zaraz.track() calls live here — one source of truth for event names.
 * Consent gating: every tracking call relies on vanilla-cookieconsent's marketing category.
 * Dashboard: enable auto-injection and disable SPA support; pageviews are triggered below.
 */

const EV_LEAD = "Lead";
const EV_CONTACT = "Contact";
const EV_CTA_CLICK = "CTAClick";

function canTrack(): boolean {
  return typeof window !== "undefined" && typeof window.zaraz !== "undefined";
}

function persistCspNonce(): void {
  const carrier = document.querySelector<HTMLScriptElement>("#zaraz-csp-nonce");
  const nonce = document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce;
  if (carrier && nonce) carrier.setAttribute("nonce", nonce);
}

export function syncZarazConsent(accepted: boolean): void {
  if (typeof window === "undefined" || !window.zaraz) return;

  window.zaraz.consent?.setAll(accepted);

  const gcm = accepted ? "granted" : "denied";
  window.zaraz.set("google_consent_update", {
    ad_storage: gcm,
    ad_user_data: gcm,
    ad_personalization: gcm,
    analytics_storage: gcm,
  });
}

function trackPageView(): void {
  window.zaraz?.spaPageview();
}

export function trackLead(source: string): void {
  if (!canTrack()) return;
  void window.zaraz!.track(EV_LEAD, { source });
}

export function trackContact(channel: string): void {
  if (!canTrack()) return;
  void window.zaraz!.track(EV_CONTACT, { channel });
}

export function trackCTAClick(label: string): void {
  if (!canTrack()) return;
  void window.zaraz!.track(EV_CTA_CLICK, { label, page: location.pathname });
}

let ctaListenerBound = false;

export function initZarazCTAListener(): void {
  if (typeof document === "undefined" || ctaListenerBound) return;
  ctaListenerBound = true;

  persistCspNonce();
  document.addEventListener("astro:after-swap", trackPageView);

  document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    const el = e.target.closest<HTMLElement>("[data-zaraz-cta]");
    if (!el) return;
    const label = el.dataset.zarazCta ?? "unknown";
    trackCTAClick(label);
  });
}

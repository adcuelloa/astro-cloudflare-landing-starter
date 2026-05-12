/**
 * Centralized Zaraz analytics module.
 *
 * All window.zaraz.track() calls live here — one source of truth for event names
 * and properties. Components import typed functions; no magic strings at call sites.
 *
 * Consent gating: every tracking call relies on vanilla-cookieconsent's marketing
 * category. syncZarazConsent() also bridges to the Zaraz Consent API and Google
 * Consent Mode v2 whenever the user's preference changes.
 *
 * Dashboard requirements:
 *  - Enable Zaraz Consent Management and create a "marketing" purpose. Assign
 *    your Meta/GA4 tools to that purpose. Disable Zaraz's built-in consent
 *    modal since vanilla-cookieconsent is the CMP.
 *  - Disable "Single Page Application support" — spaPageview() is fired manually
 *    on astro:after-swap to avoid duplicate pageviews.
 *  - Create custom triggers matching the event names exported below.
 */

// ─── Event name constants ─────────────────────────────────────────────────────
const EV_LEAD = "Lead";
const EV_CONTACT = "Contact";
const EV_CTA_CLICK = "CTAClick";

// ─── Internal guard ───────────────────────────────────────────────────────────
function canTrack(): boolean {
  return typeof window !== "undefined" && typeof window.zaraz !== "undefined";
}

// ─── Consent sync ─────────────────────────────────────────────────────────────
/**
 * Bridge vanilla-cookieconsent's marketing decision to:
 *  1. Zaraz Consent API — controls which tools fire at the edge.
 *  2. Google Consent Mode v2 — informs GA4 and Google Ads about consent status.
 */
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

// ─── SPA page view ────────────────────────────────────────────────────────────
/** Fire a pageview on Astro ClientRouter navigation (astro:after-swap). */
export function trackPageView(): void {
  window.zaraz?.spaPageview();
}

// ─── Conversion events ────────────────────────────────────────────────────────
/** Primary conversion. Maps to Meta "Lead" / GA4 "generate_lead". */
export function trackLead(source: "contact_form" | string): void {
  if (!canTrack()) return;
  void window.zaraz!.track(EV_LEAD, { source });
}

/** High-intent micro-conversion. Maps to Meta "Contact" / GA4 "contact". */
export function trackContact(channel: string): void {
  if (!canTrack()) return;
  void window.zaraz!.track(EV_CONTACT, { channel });
}

/**
 * Mid-funnel signal: primary CTA clicked.
 * Add `data-zaraz-cta="<label>"` on any clickable element — the delegated
 * listener (initZarazCTAListener) will report the click automatically.
 */
export function trackCTAClick(label: string): void {
  if (!canTrack()) return;
  void window.zaraz!.track(EV_CTA_CLICK, { label, page: location.pathname });
}

// ─── Global CTA delegation listener ───────────────────────────────────────────
let ctaListenerBound = false;

/**
 * Single document-level click listener for all [data-zaraz-cta] elements.
 * Call once from Layout.astro. Survives view transitions without rebinding.
 */
export function initZarazCTAListener(): void {
  if (typeof document === "undefined" || ctaListenerBound) return;
  ctaListenerBound = true;

  document.addEventListener("click", (e) => {
    const el = (e.target as Element).closest<HTMLElement>("[data-zaraz-cta]");
    if (!el) return;
    const label = el.dataset.zarazCta ?? "unknown";
    trackCTAClick(label);
  });
}

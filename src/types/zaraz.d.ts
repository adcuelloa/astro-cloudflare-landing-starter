/**
 * Cloudflare Zaraz — global window type declarations.
 * Zaraz is injected at the edge; window.zaraz is always a queue object.
 * All methods are safe to call even before the full Zaraz bundle loads.
 *
 * @see https://developers.cloudflare.com/zaraz/web-api/
 * @see https://developers.cloudflare.com/zaraz/consent-management/api/
 */

export interface ZarazConsent {
  /** Set consent for ALL purposes at once. */
  setAll(value: boolean): void;
  /** Set consent for a single purpose by its dashboard ID. */
  set(purposeId: string, value: boolean): void;
  /** Get consent status for a purpose. Returns undefined if not yet set. */
  get(purposeId: string): boolean | undefined;
  /** Get all purpose consent values as a key→boolean map. */
  getAll(): Record<string, boolean>;
  /** Whether the Zaraz consent API is ready. */
  APIReady: boolean;
}

export interface Zaraz {
  /**
   * Track a custom event. Event names map to triggers in the Zaraz dashboard.
   * @see https://developers.cloudflare.com/zaraz/web-api/track/
   */
  track(eventName: string, properties?: Record<string, string | number | boolean>): Promise<void>;
  /**
   * Set a persistent event property (e.g. Google Consent Mode v2 defaults).
   * @see https://developers.cloudflare.com/zaraz/web-api/set/
   */
  set(key: string, value: unknown): void;
  /**
   * Manually fire a SPA pageview on Astro ClientRouter navigation.
   * NOTE: Disable "Single Page Application support" in Zaraz dashboard Settings
   * to avoid counting pageviews twice.
   */
  spaPageview(): void;
  /**
   * Zaraz Consent API — only available when Consent Management is enabled
   * in the Cloudflare dashboard.
   */
  consent: ZarazConsent;
}

declare global {
  interface Window {
    zaraz?: Zaraz;
  }
}

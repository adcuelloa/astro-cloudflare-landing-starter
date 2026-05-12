/**
 * One-time page lifecycle helpers for Astro's <ClientRouter />.
 *
 * Astro re-fires `astro:page-load` on every navigation but does NOT re-scroll
 * to a `#hash` target the way a full reload would. This module restores that
 * behavior in a way that survives view transitions.
 */

const INIT_ATTR = "data-page-lifecycle";

function scrollToHashIfPresent(): void {
  const raw = location.hash.replace(/^#/, "");
  if (!raw) return;
  const id = decodeURIComponent(raw);
  // Two RAFs: the first lets Astro swap the DOM, the second lets layout settle.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  });
}

export function initPageLifecycle(): void {
  if (typeof document === "undefined") return;
  if (document.documentElement.hasAttribute(INIT_ATTR)) return;
  document.documentElement.setAttribute(INIT_ATTR, "");

  document.addEventListener("astro:page-load", scrollToHashIfPresent);
  queueMicrotask(scrollToHashIfPresent);
}

export function isHomePath(): boolean {
  const p = (location.pathname || "/").replace(/\/$/, "") || "/";
  return p === "/";
}

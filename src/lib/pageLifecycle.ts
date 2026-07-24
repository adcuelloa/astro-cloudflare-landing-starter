import type { TransitionBeforeSwapEvent } from "astro:transitions/client";

const INIT_ATTR = "data-page-lifecycle";
let pendingScrollY: number | null = null;

function captureScrollTarget(event: TransitionBeforeSwapEvent): void {
  pendingScrollY =
    event.navigationType === "traverse" && typeof history.state?.scrollY === "number"
      ? history.state.scrollY
      : 0;
}

function applyPendingScroll(): void {
  if (pendingScrollY === null || location.hash) return;
  window.scrollTo({ left: 0, top: pendingScrollY, behavior: "instant" });
}

function finishPendingScroll(): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      applyPendingScroll();
      pendingScrollY = null;
    });
  });
}

function scrollToHashIfPresent(): void {
  const raw = location.hash.replace(/^#/, "");
  if (!raw) return;
  const id = decodeURIComponent(raw);
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

  document.addEventListener("astro:before-swap", captureScrollTarget);
  document.addEventListener("astro:after-swap", applyPendingScroll);
  document.addEventListener("astro:page-load", finishPendingScroll);
  document.addEventListener("astro:page-load", scrollToHashIfPresent);
  queueMicrotask(scrollToHashIfPresent);
}

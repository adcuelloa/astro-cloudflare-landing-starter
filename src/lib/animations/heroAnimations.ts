/**
 * Hero entrance animation — one-shot fade + rise for `[data-hero-reveal]` nodes
 * inside `[data-hero]`. Reuses across pages and cleans up on view transitions.
 */
import gsap from "gsap";

import { $, $$ } from "@/lib/dom-selector";

let ctx: gsap.Context | null = null;
let activeRoot: HTMLElement | null = null;
let listenersBound = false;

export function cleanupHeroAnimations(): void {
  ctx?.revert();
  ctx = null;
  activeRoot = null;
}

export function initHeroAnimations(): void {
  const root = $("[data-hero]");
  if (!root) {
    cleanupHeroAnimations();
    return;
  }

  if (root === activeRoot && ctx) return;

  cleanupHeroAnimations();
  activeRoot = root;

  const revealTargets = Array.from($$("[data-hero-reveal]", root));
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    gsap.set(revealTargets, { clearProps: "all" });
    return;
  }

  ctx = gsap.context(() => {
    gsap.set(revealTargets, { autoAlpha: 0, y: 18 });
    gsap
      .timeline({ defaults: { ease: "power3.out" } })
      .to(revealTargets, { autoAlpha: 1, y: 0, duration: 0.72, stagger: 0.08 }, 0.18);
  }, root);
}

export function initHero(): void {
  if (typeof document === "undefined") return;
  initHeroAnimations();

  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener("astro:before-swap", cleanupHeroAnimations);
  document.addEventListener("astro:page-load", initHeroAnimations);
}

/**
 * Home page scroll-driven reveals.
 *
 * Marks any element with `data-reveal` and fades it in once when it enters
 * the viewport. Respects `prefers-reduced-motion` and re-binds on every
 * Astro view transition (`astro:page-load`).
 *
 * Why a page-scoped module: ScrollTrigger instances must be killed on
 * navigation or they leak across pages. Importing this file from
 * `pages/index.astro` is enough — `initHomePageAnimations()` runs on import.
 */
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const REVEAL_SELECTOR = "[data-reveal]";

let mm: gsap.MatchMedia | null = null;
let listenersBound = false;

function isHomeRoute(): boolean {
  const path = (location.pathname || "/").replace(/\/$/, "") || "/";
  return path === "/" || path === "/es";
}

export function cleanupHomeAnimations(): void {
  mm?.revert();
  mm = null;
}

export function initHomeAnimations(): void {
  if (typeof document === "undefined" || !isHomeRoute()) {
    cleanupHomeAnimations();
    return;
  }

  cleanupHomeAnimations();

  const revealTargets = gsap.utils.toArray<HTMLElement>(REVEAL_SELECTOR);
  if (revealTargets.length === 0) return;

  mm = gsap.matchMedia();
  mm.add(
    {
      desktop: "(min-width: 768px)",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const desktop = context.conditions?.desktop === true;
      const reduceMotion = context.conditions?.reduceMotion === true;
      if (reduceMotion) {
        gsap.set(revealTargets, { clearProps: "all" });
        return;
      }

      gsap.set(revealTargets, {
        autoAlpha: 0,
        y: desktop ? 34 : 22,
      });

      ScrollTrigger.batch(revealTargets, {
        batchMax: desktop ? 4 : 2,
        interval: 0.08,
        once: true,
        start: "top 84%",
        onEnter: (targets) => {
          gsap.to(targets, {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            ease: "power3.out",
            stagger: 0.08,
            overwrite: true,
          });
        },
      });
    }
  );

  requestAnimationFrame(() => {
    ScrollTrigger.refresh();
  });
}

export function initHomePageAnimations(): void {
  if (typeof document === "undefined") return;
  initHomeAnimations();

  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener("astro:before-swap", cleanupHomeAnimations);
  document.addEventListener("astro:page-load", initHomeAnimations);
}

initHomePageAnimations();

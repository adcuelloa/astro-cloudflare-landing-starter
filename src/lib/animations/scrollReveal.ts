/**
 * Scroll-driven reveals for `[data-scroll-reveal]` elements.
 * Respects `prefers-reduced-motion` and re-binds on every Astro view transition.
 */
import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const REVEAL_SELECTOR = "[data-scroll-reveal]";

let mm: gsap.MatchMedia | null = null;
let listenersBound = false;

export function cleanupScrollRevealAnimations(): void {
  mm?.revert();
  mm = null;
}

export function initScrollRevealAnimations(): void {
  if (typeof document === "undefined") {
    cleanupScrollRevealAnimations();
    return;
  }

  cleanupScrollRevealAnimations();

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

      gsap.set(revealTargets, { autoAlpha: 0, y: desktop ? 34 : 22 });

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

export function initScrollRevealPageAnimations(): void {
  if (typeof document === "undefined") return;
  initScrollRevealAnimations();

  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener("astro:before-swap", cleanupScrollRevealAnimations);
  document.addEventListener("astro:page-load", initScrollRevealAnimations);
}

initScrollRevealPageAnimations();

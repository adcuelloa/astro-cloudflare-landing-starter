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
      any: "",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const desktop = window.matchMedia("(min-width: 768px)").matches;
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
          const defaultTargets: HTMLElement[] = [];
          const customTargets: HTMLElement[] = [];

          for (const target of targets) {
            if (!(target instanceof HTMLElement)) continue;

            const customDelay = target.dataset.revealDelay;
            if (customDelay !== undefined && customDelay !== "") {
              customTargets.push(target);
            } else {
              defaultTargets.push(target);
            }
          }

          if (defaultTargets.length > 0) {
            gsap.to(defaultTargets, {
              autoAlpha: 1,
              y: 0,
              duration: 0.72,
              ease: "power3.out",
              stagger: 0.08,
              overwrite: true,
            });
          }

          for (const target of customTargets) {
            gsap.to(target, {
              autoAlpha: 1,
              y: 0,
              duration: 0.72,
              ease: "power3.out",
              delay: Number.parseFloat(target.dataset.revealDelay ?? "0"),
              overwrite: true,
            });
          }
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

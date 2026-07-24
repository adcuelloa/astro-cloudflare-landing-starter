import gsap from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const REVEAL_SELECTOR = "[data-scroll-reveal]:not(section)";

let mm: gsap.MatchMedia | null = null;
let listenersBound = false;

export function cleanupScrollReveal(): void {
  mm?.revert();
  mm = null;
}

export function initScrollReveal(): void {
  if (typeof document === "undefined") {
    cleanupScrollReveal();
    return;
  }

  cleanupScrollReveal();

  const revealTargets = gsap.utils.toArray<HTMLElement>(REVEAL_SELECTOR);
  if (revealTargets.length === 0) return;

  mm = gsap.matchMedia();
  mm.add(
    {
      all: "",
      reduceMotion: "(prefers-reduced-motion: reduce)",
    },
    (context) => {
      const desktop = window.matchMedia("(min-width: 768px)").matches;
      const reduceMotion = !!context.conditions?.reduceMotion;
      if (reduceMotion) {
        gsap.set(revealTargets, { clearProps: "all" });
        return;
      }

      const yFrom = desktop ? 24 : 22;

      ScrollTrigger.batch(revealTargets, {
        batchMax: desktop ? 4 : 2,
        interval: 0.1,
        once: true,
        start: "top 90%",
        onEnter: (targets) => {
          gsap.fromTo(
            targets,
            { opacity: 0, y: yFrom },
            {
              opacity: 1,
              y: 0,
              duration: 0.72,
              ease: "power3.out",
              stagger: desktop ? 0.1 : 0.06,
              overwrite: true,
            }
          );
        },
      });
    }
  );
}

export function initScrollRevealModule(): void {
  if (typeof document === "undefined") return;
  if (listenersBound) return;
  listenersBound = true;

  document.addEventListener("astro:before-swap", cleanupScrollReveal);
  document.addEventListener("astro:page-load", initScrollReveal);
  initScrollReveal();
}

initScrollRevealModule();

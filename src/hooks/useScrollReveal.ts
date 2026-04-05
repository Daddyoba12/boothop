'use client';

import { useEffect } from 'react';

/**
 * Observes every element with class "reveal" (or "reveal-left" / "reveal-scale")
 * and adds class "visible" once it enters the viewport.
 * Call this hook once in each page component.
 */
export function useScrollReveal() {
  useEffect(() => {
    // Defer slightly so the browser has finished layout/paint before we start
    // observing. This matters in PWA standalone mode where everything renders
    // in a single frame on launch.
    // Double rAF: first frame starts layout, second frame is after paint —
    // needed in PWA standalone where everything renders in a single burst.
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const selector = '.reveal, .reveal-left, .reveal-scale';
        const elements = document.querySelectorAll<HTMLElement>(selector);

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.05, rootMargin: '0px 0px -10px 0px' }
        );

        elements.forEach((el) => observer.observe(el));

        // Safety net: any element still not visible after 800ms gets forced visible.
        // Catches PWA cases where IntersectionObserver fires but callback is delayed.
        const fallback = setTimeout(() => {
          document.querySelectorAll<HTMLElement>('.reveal:not(.visible), .reveal-left:not(.visible), .reveal-scale:not(.visible)')
            .forEach((el) => el.classList.add('visible'));
        }, 800);

        (window as any).__scrollRevealCleanup = () => {
          observer.disconnect();
          clearTimeout(fallback);
        };
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      (window as any).__scrollRevealCleanup?.();
    };
  }, []);
}

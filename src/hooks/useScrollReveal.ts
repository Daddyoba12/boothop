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
    const raf = requestAnimationFrame(() => {
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
        { threshold: 0.08, rootMargin: '0px 0px -20px 0px' }
      );

      elements.forEach((el) => observer.observe(el));

      // Cleanup stored on the window so it can be called from the RAF callback
      (window as any).__scrollRevealCleanup = () => observer.disconnect();
    });

    return () => {
      cancelAnimationFrame(raf);
      (window as any).__scrollRevealCleanup?.();
    };
  }, []);
}

'use client';

import { useEffect } from 'react';

/**
 * Observes every element with class "reveal" (or "reveal-left" / "reveal-scale")
 * and adds class "visible" once it enters the viewport.
 * Call this hook once in each page component.
 */
export function useScrollReveal() {
  useEffect(() => {
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
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

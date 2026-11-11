"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

type RevealTag = "div" | "section" | "li";

export function ScrollReveal({
  as = "div",
  children,
  className = "",
  delay = 0,
  id,
  labelledBy,
}: {
  as?: RevealTag;
  children: ReactNode;
  className?: string;
  delay?: number;
  id?: string;
  labelledBy?: string;
}) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [armed, setArmed] = useState(false);
  const [visible, setVisible] = useState(false);
  const Element = as;

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      // Defer so the effect body never calls setState synchronously.
      queueMicrotask(() => setVisible(true));
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.unobserve(element);
      },
      { rootMargin: "0px 0px -48px 0px", threshold: 0.08 },
    );

    observer.observe(element);
    // Defer so the effect body never calls setState synchronously.
    queueMicrotask(() => setArmed(true));
    return () => observer.disconnect();
  }, []);

  return (
    <Element
      ref={(element: HTMLElement | null) => { elementRef.current = element; }}
      data-scroll-reveal
      data-armed={armed ? "true" : undefined}
      data-visible={visible ? "true" : undefined}
      id={id}
      aria-labelledby={labelledBy}
      className={className}
      style={{ "--scroll-reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Element>
  );
}

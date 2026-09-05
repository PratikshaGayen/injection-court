"use client";

import { useEffect, useRef, useState } from "react";

function prefersReduced() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

/**
 * Adds `is-in` the first time the element enters the viewport.
 * One-shot: things do not un-reveal when you scroll back up.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  threshold = 0.18
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced()) {
      el.classList.add("is-in");
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("is-in");
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return ref;
}

/**
 * Reveals every element matching `selector` inside the container, each on its
 * own entry. For lists whose length is only known at runtime.
 */
export function useRevealChildren<T extends HTMLElement = HTMLDivElement>(
  selector: string,
  deps: unknown[] = []
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>(selector));
    if (prefersReduced()) {
      nodes.forEach((n) => n.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/**
 * Writes the element's scroll-through progress (0→1) to its own `--p`
 * custom property. Drives the pipeline spine.
 */
export function useScrollScrub<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced()) {
      el.style.setProperty("--p", "1");
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // 0 when the top reaches 85% down the screen, 1 once the bottom clears 40%.
      const total = r.height + vh * 0.45;
      const travelled = vh * 0.85 - r.top;
      const p = Math.min(1, Math.max(0, travelled / total));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return ref;
}

/** Document-wide scroll progress, 0→1. Drives the margin rule. */
export function usePageProgress() {
  const [p, setP] = useState(0);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setP(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return p;
}

/** True once the page has scrolled past `after` pixels. */
export function useScrolled(after = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > after);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [after]);
  return scrolled;
}

/** Flips to true `delay` ms after mount. Triggers the hero sequence. */
export function useDelayedFlag(delay: number) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOn(true), prefersReduced() ? 0 : delay);
    return () => clearTimeout(t);
  }, [delay]);
  return on;
}

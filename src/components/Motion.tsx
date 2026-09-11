"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ============================================================================
 * MOTION VOCABULARY
 *
 * Three primitives, and two hard rules.
 *
 *   1. NOTHING TRANSLATES HORIZONTALLY. Content emerges from the environment —
 *      opacity, a few pixels of vertical settle, blur resolving to sharp —
 *      because the camera is already moving, and a section that also flies in
 *      from the side turns one machine into a slideshow.
 *
 *   2. The animation is CSS. JavaScript decides only WHEN, by adding a class;
 *      the compositor decides how. An entrance that holds its element at
 *      opacity 0 until the main thread has a frame to spare is an entrance
 *      that can leave the page blank, and a portfolio that renders blank on a
 *      slow machine is worse than one that never animated at all.
 *
 * Most content on this page does not animate. It is simply there when you
 * arrive. Motion is spent on the few elements that carry an argument.
 * ========================================================================= */

/**
 * Reveal an element the first time it enters the viewport.
 *
 * The element is laid out and painted from the start; only its opacity waits.
 * If the observer never fires — no IntersectionObserver, a script error, a
 * browser we did not anticipate — the element is simply visible, because the
 * hidden state is applied from JavaScript rather than being the default.
 */
function useReveal<T extends HTMLElement>(delay: number) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;

    el.classList.add("settle-armed");

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          el.style.animationDelay = `${delay}s`;
          el.classList.remove("settle-armed");
          el.classList.add("settle-on");
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return ref;
}

/**
 * Type rising from behind a rule. For statements only — the sentence should be
 * worth the second of attention this buys.
 */
export function MaskLines({
  lines,
  className,
  lineClassName,
  delay = 0,
  immediate = false,
}: {
  lines: readonly string[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  /** Hero copy animates on mount; everything else waits for the viewport. */
  immediate?: boolean;
}) {
  const host = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (immediate) return;
    const el = host.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const lineEls = Array.from(el.querySelectorAll<HTMLElement>("[data-line]"));
    for (const l of lineEls) l.style.animationPlayState = "paused";

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          for (const l of lineEls) l.style.animationPlayState = "running";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -10% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [immediate]);

  return (
    <span ref={host} className={className}>
      {lines.map((line, i) => (
        <span key={line} className="block overflow-hidden pb-[0.06em]">
          <span
            data-line
            className={cn("rise-line", lineClassName)}
            style={{ animationDelay: `${delay + i * 0.075}s` }}
          >
            {line}
          </span>
        </span>
      ))}
    </span>
  );
}

/** A rule that draws itself across. Divides, and marks a new measurement. */
export function DrawRule({
  className,
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    el.style.animationPlayState = "paused";

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          el.style.animationPlayState = "running";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -6% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <span
      ref={ref}
      aria-hidden="true"
      className={cn("draw-rule", className)}
      style={{ animationDelay: `${delay}s` }}
    />
  );
}

/**
 * The general-purpose entrance: a few pixels of settle and a blur resolving.
 * Travel is 9px, not 40 — at this scale motion should register as coming into
 * focus rather than as arriving from somewhere else.
 */
export function Emerge({
  children,
  delay = 0,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article" | "section" | "figure" | "header";
}) {
  const ref = useReveal<HTMLElement>(delay);

  return (
    <Tag ref={ref as React.RefObject<never>} className={className}>
      {children}
    </Tag>
  );
}

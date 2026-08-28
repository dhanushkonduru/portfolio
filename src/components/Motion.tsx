"use client";

import { motion, useInView } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ============================================================================
 * MOTION VOCABULARY
 *
 * Three primitives, each with one job. Most content on this site does not
 * animate at all — it is simply there when you arrive. Motion is spent on the
 * few elements that carry an argument, because everything-fades-up is the
 * cheapest and most recognisable tell in generated frontend.
 * ========================================================================= */

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * Type emerging from behind a rule. For statements only — the sentence should
 * be worth the second of attention this buys.
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
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -15% 0px" });
  const reduced = useReducedMotion();
  const play = immediate || inView;

  return (
    <span ref={ref} className={className}>
      {lines.map((line, i) => (
        <span key={line} className="block overflow-hidden pb-[0.06em]">
          {reduced ? (
            <span className={`block ${lineClassName ?? ""}`}>{line}</span>
          ) : (
            <motion.span
              className={`block ${lineClassName ?? ""}`}
              initial={{ y: "110%" }}
              animate={play ? { y: 0 } : { y: "110%" }}
              transition={{ duration: 1.1, delay: delay + i * 0.08, ease: EASE }}
            >
              {line}
            </motion.span>
          )}
        </span>
      ))}
    </span>
  );
}

/**
 * A rule that draws itself across. Used to divide, and to signal that a new
 * measurement is beginning.
 */
export function DrawRule({
  className,
  delay = 0,
  vertical = false,
}: {
  className?: string;
  delay?: number;
  vertical?: boolean;
}) {
  const reduced = useReducedMotion();

  return (
    <motion.span
      aria-hidden="true"
      className={className}
      initial={reduced ? false : { scaleX: vertical ? 1 : 0, scaleY: vertical ? 0 : 1 }}
      whileInView={{ scaleX: 1, scaleY: 1 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.15, delay, ease: EASE }}
      style={{ transformOrigin: vertical ? "top" : "left" }}
    />
  );
}

/**
 * The general-purpose entrance — deliberately restrained, and deliberately
 * rare. Travel is 12px, not 40: at this scale motion should register as
 * settling rather than arriving.
 */
export function Enter({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "article" | "section" | "figure";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  if (reduced) return <Tag className={className}>{children}</Tag>;

  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.9, delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}

"use client";

import { useRef, type ReactNode } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { motionTokens, springs } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

/** Fades and lifts its children into place the first time they are seen. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "p" | "span";
}) {
  const reduced = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={
        reduced
          ? { opacity: 0 }
          : {
              opacity: 0,
              y: motionTokens.distance.lg,
              filter: `blur(${motionTokens.blur}px)`,
            }
      }
      /* The filter is dropped once it has cleared, so nothing below is left
         sitting in its own compositing layer. */
      whileInView={{
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transitionEnd: { filter: "none" },
      }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{
        duration: motionTokens.duration.slow,
        ease: motionTokens.easing.out,
        delay,
      }}
    >
      {children}
    </Tag>
  );
}

/**
 * A statement that rises line by line out of its own baseline. Each line is
 * clipped by its wrapper, so the type appears to come up from behind a rule.
 */
export function RiseLines({
  lines,
  className,
  delay = 0,
  onView = false,
}: {
  lines: ReactNode[];
  className?: string;
  delay?: number;
  /** Wait until scrolled into view instead of playing on mount. */
  onView?: boolean;
}) {
  const reduced = useReducedMotion();
  const play = onView
    ? { whileInView: "shown", viewport: { once: true, margin: "-80px" } }
    : { animate: "shown" };

  return (
    <motion.span
      className={cn("block", className)}
      initial="hidden"
      {...play}
      transition={{ staggerChildren: 0.09, delayChildren: delay }}
    >
      {lines.map((line, i) => (
        <span
          key={i}
          className="block overflow-hidden pb-[0.12em] -mb-[0.12em] pr-[0.06em]"
        >
          <motion.span
            className="block will-change-transform"
            variants={{
              hidden: reduced ? { opacity: 0 } : { y: "108%" },
              shown: {
                y: 0,
                opacity: 1,
                transition: {
                  duration: motionTokens.duration.reveal,
                  ease: motionTokens.easing.out,
                },
              },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** Pulls its child a little toward the cursor. Fine pointers only. */
export function Magnetic({
  children,
  strength = 0.28,
  className,
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduced = useReducedMotion();
  const x = useSpring(useMotionValue(0), springs.magnet);
  const y = useSpring(useMotionValue(0), springs.magnet);

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduced || e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.span>
  );
}

/** The small numbered label that opens every section. */
export function SectionLabel({
  index,
  children,
}: {
  index: string;
  children: ReactNode;
}) {
  return (
    <Reveal className="flex items-center gap-4">
      <span className="t-mark text-accent tabular-nums">{index}</span>
      <span className="h-px w-10 bg-rule-3" aria-hidden="true" />
      <span className="t-mark text-ink-2">{children}</span>
    </Reveal>
  );
}

/** The word in a statement that is set in the serif italic. */
export function Em({ children }: { children: ReactNode }) {
  return <span className="t-serif text-accent">{children}</span>;
}

"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { profile } from "@/data/profile";
import { Reveal, SectionLabel } from "./ui";

const FACTS = [
  { label: "Studying", value: profile.education.degree, note: `${profile.education.school} · ${profile.education.period}` },
  { label: "Based in", value: "Vellore, India", note: "Remote and hybrid friendly" },
  { label: "Focus", value: "LLM systems, backends, unlearning", note: "RAG · agents · evaluation · Django" },
  { label: "Status", value: "Open to 2027 roles", note: "New-grad and internships" },
];

/**
 * The summary, read at the reader's own pace: each word comes up to full
 * strength as it reaches the middle of the screen, so scrolling is reading.
 */
export function About() {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.82", "end 0.5"],
  });
  const words = profile.about.split(" ");

  return (
    <section id="about" className="shell scroll-mt-24 py-28 md:py-44">
      <SectionLabel index="01">About</SectionLabel>

      <p
        ref={ref}
        className="t-lead mt-10 max-w-[30ch] text-ink sm:max-w-[34ch] lg:max-w-[38ch]"
      >
        {words.map((w, i) =>
          reduced ? (
            <span key={i}>{w} </span>
          ) : (
            <Word
              key={i}
              progress={scrollYProgress}
              from={i / words.length}
              to={(i + 3) / words.length}
            >
              {w}
            </Word>
          ),
        )}
      </p>

      <dl className="mt-20 grid gap-x-8 gap-y-10 border-t border-rule-2 pt-9 sm:grid-cols-2 lg:mt-28 lg:grid-cols-4">
        {FACTS.map((f, i) => (
          <Reveal key={f.label} delay={i * 0.07}>
            <dt className="t-mark text-ink-3">{f.label}</dt>
            <dd className="mt-3 text-[1.0625rem] font-medium leading-snug tracking-tight text-ink">
              {f.value}
            </dd>
            <dd className="t-note mt-1.5">{f.note}</dd>
          </Reveal>
        ))}
      </dl>
    </section>
  );
}

function Word({
  children,
  progress,
  from,
  to,
}: {
  children: string;
  progress: MotionValue<number>;
  from: number;
  to: number;
}) {
  const opacity = useTransform(progress, [from, Math.min(1, to)], [0.16, 1]);
  return (
    <>
      <motion.span style={{ opacity }}>{children}</motion.span>{" "}
    </>
  );
}

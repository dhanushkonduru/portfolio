"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import { profile } from "@/data/profile";
import { headlineSkills } from "@/data/skills";
import { motionTokens } from "@/lib/motion-tokens";
import { Em, Magnetic, RiseLines } from "./ui";

/**
 * The first screen: one statement, the model beside it, and four numbers that
 * back the statement up. The model is the canvas behind the page; this only
 * leaves room for it.
 */
export function Hero() {
  const reduced = useReducedMotion();
  const { scrollY } = useScroll();
  /* The statement lifts away a little faster than the page as it leaves. */
  const lift = useTransform(scrollY, [0, 700], [0, reduced ? 0 : -90]);
  const fade = useTransform(scrollY, [0, 520], [1, 0]);
  const { before, accent, after } = profile.headline;

  const enter = (delay: number) => ({
    initial: reduced ? { opacity: 0 } : { opacity: 0, y: motionTokens.distance.md },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: motionTokens.duration.slow,
      ease: motionTokens.easing.out,
      delay,
    },
  });

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-end pb-8 pt-[39svh] sm:pt-40 lg:pt-32"
    >
      <motion.div className="shell" style={{ y: lift, opacity: fade }}>
        <motion.div
          className="flex flex-wrap items-center gap-x-5 gap-y-3"
          {...enter(0.1)}
        >
          {/* The one thing a recruiter needs before anything else. */}
          <p className="inline-flex h-8 items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] pl-3 pr-3.5 text-[0.8125rem] tracking-tight text-ink shadow-[inset_0_1px_0_rgb(255_255_255/0.07)] backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inset-0 rounded-full bg-accent animate-ping-soft" />
              <span className="relative h-1.5 w-1.5 rounded-full bg-accent" />
            </span>
            Open to 2027 roles
          </p>
          <p className="t-mark text-ink-2">
            {profile.role}
            <span className="max-sm:hidden">
              <span className="mx-3 text-rule-3">/</span>
              VIT Vellore ’27
            </span>
          </p>
        </motion.div>

        <h1 className="t-hero mt-6 lg:mt-7">
          <RiseLines
            delay={0.15}
            lines={[
              before,
              <>
                <Em>{accent}</Em> what they
              </>,
              after.replace("what they ", ""),
            ]}
          />
        </h1>

        <div className="mt-8 flex flex-col gap-8 lg:mt-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <motion.p
              className="t-read max-w-[47ch] text-ink-2"
              {...enter(0.55)}
            >
              {profile.positioning}
            </motion.p>

            <motion.div className="mt-8 flex flex-wrap gap-3" {...enter(0.68)}>
              <Magnetic>
                <a href="#work" className="pill pill-solid [--nx:0px] [--ny:3px]">
                  See selected work
                  <ArrowDown size={16} strokeWidth={2} aria-hidden="true" />
                </a>
              </Magnetic>
              <Magnetic>
                <a href={profile.resume.href} download className="pill">
                  Résumé
                  <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
                </a>
              </Magnetic>
            </motion.div>
          </div>

          {/* Tells the visitor the model is theirs to touch, and what it is
              showing them when they do. */}
          <motion.p
            className="t-note max-w-[36ch] text-right max-lg:hidden"
            {...enter(1.1)}
          >
            <span className="text-accent">↗ Point at the model.</span>
            <br />
            It forgets wherever you touch it. Proving that it really has is
            what my research is about.
          </motion.p>
        </div>
      </motion.div>

      <motion.div className="shell mt-12 lg:mt-14" {...enter(0.85)}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-7 border-t border-white/10 pt-7 lg:grid-cols-4">
          {profile.markers.map((m) => (
            <div key={m.label}>
              <dd className="t-figure-sm text-ink">{m.value}</dd>
              <dt className="t-note mt-2 max-w-[24ch]">{m.label}</dt>
            </div>
          ))}
        </dl>
      </motion.div>
    </section>
  );
}

/** The stack, running past once between the hero and the page. */
export function Marquee() {
  const row = [...headlineSkills, ...headlineSkills];
  return (
    <div
      className="relative overflow-hidden border-y border-white/[0.07] bg-void/50 py-5 backdrop-blur-md"
      aria-hidden="true"
    >
      <div className="fade-x">
      <div className="flex w-max animate-marquee items-center">
        {row.map((s, i) => (
          <span key={i} className="flex items-center">
            <span className="px-7 text-[clamp(1.25rem,2.1vw,1.75rem)] font-medium leading-none tracking-[-0.035em] text-ink-2">
              {s}
            </span>
            <span className="text-[clamp(0.8rem,1.1vw,1rem)] leading-none text-accent">
              ✳
            </span>
          </span>
        ))}
      </div>
      </div>
    </div>
  );
}

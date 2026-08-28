"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { profile } from "@/data/profile";
import { STAGES } from "@/system/stages";
import { setClearAmount, setClearRects } from "@/system/stageStore";
import { MaskLines } from "@/components/Motion";
import { TextLink } from "@/components/Kit";

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const headline = useRef<HTMLHeadingElement>(null);
  const foot = useRef<HTMLDivElement>(null);
  const section = useRef<HTMLElement>(null);

  /* The field is told where the words are and opens around them. Legibility
     becomes part of the composition rather than a scrim laid over the art. */
  useEffect(() => {
    const publish = () => {
      const rects: DOMRect[] = [];
      if (headline.current) rects.push(headline.current.getBoundingClientRect());
      if (foot.current) rects.push(foot.current.getBoundingClientRect());
      setClearRects(rects);

      const s = section.current;
      if (s) {
        const r = s.getBoundingClientRect();
        // Fades out as the hero leaves: the clearing belongs to this stage.
        const vis = Math.max(0, Math.min(1, (r.bottom - 60) / window.innerHeight));
        setClearAmount(vis);
      }
    };

    publish();
    const ro = new ResizeObserver(publish);
    if (headline.current) ro.observe(headline.current);

    window.addEventListener("scroll", publish, { passive: true });
    window.addEventListener("resize", publish);
    const t = setTimeout(publish, 400); // after fonts settle

    return () => {
      ro.disconnect();
      window.removeEventListener("scroll", publish);
      window.removeEventListener("resize", publish);
      clearTimeout(t);
      setClearAmount(0);
    };
  }, []);

  return (
    <section
      ref={section}
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-between pb-8 pt-24 md:pb-12 md:pt-28"
    >
      {/* ── upper register: deliberately one-sided. The nav already carries
             the name in this column; repeating it here only collided with it. ── */}
      <div className="frame rail flex justify-start md:justify-end">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.25 }}
          className="md:text-right"
        >
          <p className="t-note">
            <span className="mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-mint align-middle animate-probe" />
            {profile.availability}
          </p>
          <p className="t-note mt-1.5">{profile.location}</p>
        </motion.div>
      </div>

      {/* ── the monument ── */}
      <div className="frame rail relative py-10 md:py-0">
        <h1
          ref={headline}
          className="t-monument max-w-[13ch] text-ink"
        >
          <MaskLines lines={profile.headline} immediate delay={0.18} />
        </h1>
      </div>

      {/* ── lower register ── */}
      <div ref={foot} className="frame rail">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.75 }}
          className="h-px w-full origin-left bg-rule"
        />

        <div className="grid-12 mt-6 items-end gap-y-7">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.85, ease: EASE }}
            className="col-span-12 md:col-span-6"
          >
            <p className="t-mark text-mint">{profile.role}</p>
            <p className="t-read mt-4 max-w-[46ch] text-balance text-ink-2">
              {profile.positioning}
            </p>
          </motion.div>

          {/* Facts hung as marginalia, not boxed into a metric grid. */}
          <motion.dl
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
            className="col-span-12 grid grid-cols-3 gap-x-4 gap-y-3 md:col-span-3 md:flex md:flex-wrap md:gap-x-8"
          >
            {profile.markers.slice(0, 3).map((m) => (
              <div key={m.label}>
                <dt className="sr-only">{m.label}</dt>
                <dd>
                  <span className="t-meta block text-ink">{m.value}</span>
                  <span className="t-note mt-0.5 block">{m.label}</span>
                </dd>
              </div>
            ))}
          </motion.dl>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="col-span-12 flex flex-wrap items-center gap-x-7 gap-y-3 md:col-span-3 md:justify-end"
          >
            <TextLink href="#work" tone="mint" className="t-meta">
              See the work
            </TextLink>
            <TextLink href={profile.resume.href} download className="t-meta">
              Résumé ↓
            </TextLink>
          </motion.div>
        </div>

        {/* Scroll cue doubles as the field's current state readout. */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.3 }}
          className="mt-8 flex items-center gap-3"
        >
          <span className="t-note">Scroll to measure</span>
          <span className="h-px w-10 bg-rule-2" aria-hidden="true" />
          <span className="t-note text-mint">{STAGES[0].state}</span>
        </motion.div>
      </div>
    </section>
  );
}

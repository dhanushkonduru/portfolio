"use client";

import { experience } from "@/data/experience";
import { achievements, certifications } from "@/data/achievements";
import { ArrowUpRight } from "lucide-react";
import { profile } from "@/data/profile";
import { coreSkills } from "@/data/skills";
import { cn } from "@/lib/utils";
import { Em, Reveal, RiseLines, SectionLabel } from "./ui";

export function Experience() {
  return (
    <section id="experience" className="shell scroll-mt-24 py-28 md:py-40">
      <SectionLabel index="04">Experience</SectionLabel>
      <h2 className="t-display mt-8 max-w-[14ch]">
        <RiseLines
          onView
          lines={[
            "Three internships",
            <>
              in three <Em>years.</Em>
            </>,
          ]}
        />
      </h2>

      <ol className="mt-14 border-t border-rule-2 md:mt-20">
        {experience.map((role, i) => (
          <Reveal
            as="li"
            key={role.id}
            delay={Math.min(i, 3) * 0.05}
            className="group grid gap-x-10 gap-y-6 border-b border-rule-2 py-10 transition-colors duration-500 hover:border-rule-3 md:py-12 lg:grid-cols-12"
          >
            <div className="lg:col-span-4">
              <p className="t-meta text-ink-3">{role.period}</p>
              <h3 className="mt-3 text-[clamp(1.4rem,2.2vw,1.9rem)] font-medium leading-tight tracking-[-0.03em] text-ink">
                {role.company}
              </h3>
              <p className="mt-1.5 text-[1.0625rem] tracking-tight text-ink-2">
                {role.title}
              </p>
              <p className="t-note mt-3">
                {role.location === role.mode
                  ? role.location
                  : `${role.location} · ${role.mode}`}
              </p>
            </div>

            <div className="lg:col-span-8">
              <ul className="space-y-4">
                {role.points.map((point) => (
                  <li
                    key={point}
                    className="t-read-sm relative max-w-[72ch] pl-6 text-ink-2"
                  >
                    <span
                      className="absolute left-0 top-[0.72em] h-px w-3 bg-accent"
                      aria-hidden="true"
                    />
                    {point}
                  </li>
                ))}
              </ul>
              <ul className="mt-7 flex flex-wrap gap-2">
                {role.stack.map((s) => (
                  <li key={s} className="chip">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

export function Skills() {
  return (
    <section id="skills" className="shell scroll-mt-24 py-28 md:py-40">
      <SectionLabel index="05">Toolkit</SectionLabel>
      <h2 className="t-display mt-8 max-w-[15ch]">
        <RiseLines
          onView
          lines={[
            "What I reach for,",
            <>
              and what I’ve <Em>won.</Em>
            </>,
          ]}
        />
      </h2>

      {/* A short index, not an inventory: four lines of work and the five
          tools that carry each one. The rest is on the résumé. */}
      <ul className="mt-14 border-t border-rule-2 md:mt-20">
        {coreSkills.map((g, i) => (
          <Reveal
            as="li"
            key={g.id}
            delay={i * 0.06}
            className="grid gap-x-10 gap-y-4 border-b border-rule-2 py-8 md:py-10 lg:grid-cols-12"
          >
            <h3 className="flex items-baseline gap-4 lg:col-span-3">
              <span className="t-meta text-accent">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-[1.0625rem] tracking-tight text-ink-2">
                {g.name}
              </span>
            </h3>
            <ul className="flex flex-wrap gap-x-[0.6em] gap-y-1 text-[clamp(1.2rem,2.25vw,1.9rem)] font-medium leading-[1.22] tracking-[-0.032em] text-ink lg:col-span-9">
              {g.items.map((item, n) => (
                <li key={item} className="flex gap-x-[0.6em]">
                  {item}
                  {n < g.items.length - 1 ? (
                    <span className="font-normal text-rule-3" aria-hidden="true">
                      /
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          </Reveal>
        ))}
      </ul>

      <Reveal className="mt-6 flex justify-end">
        <a
          href={profile.resume.href}
          download
          className="link-rule t-note inline-flex items-center gap-1.5 text-ink-2"
        >
          Full list on the résumé
          <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />
        </a>
      </Reveal>

      <div className="mt-16 grid gap-x-10 gap-y-14 md:mt-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <Reveal className="border-b border-rule-2 pb-5">
            <h3 className="t-title">Hackathons</h3>
          </Reveal>
          <ul>
            {achievements.map((a, i) => (
              <Reveal
                as="li"
                key={a.id}
                delay={i * 0.05}
                className="grid grid-cols-12 items-baseline gap-x-6 gap-y-1 border-b border-rule-2 py-6"
              >
                <span
                  className={cn(
                    "col-span-12 text-[1.25rem] font-medium tracking-tight sm:col-span-4",
                    a.tone === "gold" ? "text-accent" : "text-ink",
                  )}
                >
                  {a.rank}
                </span>
                <span className="col-span-10 sm:col-span-7">
                  <span className="block text-[1.0625rem] leading-snug tracking-tight text-ink">
                    {a.event}
                  </span>
                  <span className="t-note mt-1 block">{a.detail}</span>
                </span>
                <span className="t-note col-span-2 text-right tabular-nums sm:col-span-1">
                  {a.year}
                </span>
              </Reveal>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-5">
          <Reveal className="border-b border-rule-2 pb-5">
            <h3 className="t-title">Certifications</h3>
          </Reveal>
          <ul>
            {certifications.map((c, i) => (
              <Reveal
                as="li"
                key={c.name}
                delay={i * 0.05}
                className="flex items-baseline justify-between gap-6 border-b border-rule-2 py-6"
              >
                <span className="text-[1.0625rem] leading-snug tracking-tight text-ink">
                  {c.name}
                </span>
                <span className="t-note shrink-0 text-right">{c.issuer}</span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

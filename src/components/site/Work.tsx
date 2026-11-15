"use client";

import { useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ArrowUpRight, Plus } from "lucide-react";
import { projects, type Project } from "@/data/projects";
import { ProjectModal } from "@/components/ProjectModal";
import { ProjectVisual, hasVisual } from "@/components/ProjectVisual";
import { motionTokens } from "@/lib/motion-tokens";
import { Em, Reveal, RiseLines, SectionLabel } from "./ui";

/** The four that get a card. Research first, then the three on the résumé. */
const FEATURED = [
  "beyond-the-loss-curve",
  "financial-rag",
  "investment-research",
  "portfolio-ml",
];

const featured = FEATURED.map((id) => projects.find((p) => p.id === id)!);
const rest = projects.filter((p) => !FEATURED.includes(p.id));

export function Work() {
  const [open, setOpen] = useState<Project | null>(null);
  const stack = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: stack,
    offset: ["start start", "end end"],
  });

  return (
    <section id="work" className="scroll-mt-24 py-28 md:py-40">
      <div className="shell">
        <SectionLabel index="02">Selected work</SectionLabel>
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="t-display max-w-[14ch]">
            <RiseLines
              onView
              lines={[
                "Things I built,",
                <>
                  then <Em>measured.</Em>
                </>,
              ]}
            />
          </h2>
          <Reveal className="t-read max-w-[40ch] text-ink-2">
            Each one ships with the evaluation that says whether it works.
            Open any of them for the problem, the decisions and the numbers.
          </Reveal>
        </div>
      </div>

      {/* Each card pins under the header and the next one slides over it, so
          the four read as a deck being dealt. */}
      <div ref={stack} className="shell mt-14 md:mt-20">
        {featured.map((p, i) => (
          <Card
            key={p.id}
            project={p}
            index={i}
            total={featured.length}
            progress={scrollYProgress}
            onOpen={() => setOpen(p)}
          />
        ))}
      </div>

      <div className="shell mt-24 md:mt-36">
        <Reveal className="flex items-baseline justify-between border-b border-rule-2 pb-5">
          <h3 className="t-title">More builds</h3>
          <span className="t-note tabular-nums">
            {String(rest.length).padStart(2, "0")}
          </span>
        </Reveal>

        <ul>
          {rest.map((p, i) => (
            <Reveal as="li" key={p.id} delay={Math.min(i, 4) * 0.05}>
              <button
                type="button"
                onClick={() => setOpen(p)}
                className="group grid w-full grid-cols-12 items-baseline gap-x-6 gap-y-1 border-b border-rule-2 py-6 text-left transition-colors duration-500 hover:border-rule-3 md:py-7"
              >
                <span className="t-meta col-span-2 text-ink-3 max-md:hidden lg:col-span-1">
                  {p.year.split(" ")[0]}
                </span>
                <span className="col-span-11 text-[clamp(1.2rem,2.2vw,1.75rem)] font-medium leading-tight tracking-[-0.03em] text-ink transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-2 md:col-span-6">
                  {p.title}
                </span>
                <span className="t-note col-span-11 md:col-span-3 lg:col-span-4">
                  {p.category}
                </span>
                <span className="col-span-1 col-start-12 row-start-1 flex justify-end text-ink-3 transition-[color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent">
                  <ArrowUpRight size={22} strokeWidth={1.5} aria-hidden="true" />
                </span>
              </button>
            </Reveal>
          ))}
        </ul>
      </div>

      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </section>
  );
}

function Card({
  project,
  index,
  total,
  progress,
  onOpen,
}: {
  project: Project;
  index: number;
  total: number;
  progress: MotionValue<number>;
  onOpen: () => void;
}) {
  const reduced = useReducedMotion();
  /* Once the next card has started over this one, it settles back a step. */
  const settle = 1 - (total - 1 - index) * (1 - motionTokens.scale.card) * 0.6;
  const scale = useTransform(
    progress,
    [index / total, 1],
    [1, reduced ? 1 : settle],
  );
  const github = project.links.find((l) => l.kind === "github");

  return (
    <div
      className="deck:sticky deck:h-[min(43rem,calc(100svh-6.5rem))] deck:pb-6"
      style={{ top: `calc(5.5rem + ${index * 0.9}rem)` }}
    >
      <motion.article
        style={{ scale }}
        className="surface spot relative mb-6 grid origin-top overflow-hidden rounded-[1.75rem] deck:mb-0 deck:h-full grid-cols-1 lg:grid-cols-12"
      >
        <div className="flex min-w-0 flex-col p-7 md:p-10 lg:col-span-6 lg:p-12">
          <div className="flex items-center gap-4">
            <span className="t-meta text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="t-note">{project.category}</span>
            <span className="t-note ml-auto tabular-nums">{project.year}</span>
          </div>

          <h3 className="mt-7 text-[clamp(1.75rem,3.3vw,3rem)] font-medium leading-[1.02] tracking-[-0.04em] text-ink">
            {project.title}
          </h3>
          <p className="t-read mt-5 max-w-[46ch] text-ink-2">
            {project.tagline}
          </p>

          {project.metrics.length ? (
            <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-rule-2 pt-7">
              {project.metrics.slice(0, 2).map((m) => (
                <div key={m.label}>
                  <dd className="t-figure-sm text-accent">{m.value}</dd>
                  <dt className="t-note mt-1.5">{m.label}</dt>
                </div>
              ))}
            </dl>
          ) : null}

          <ul className="mt-7 flex flex-wrap gap-2">
            {project.stack.slice(0, 5).map((s) => (
              <li key={s} className="chip">
                {s}
              </li>
            ))}
          </ul>

          <div className="mt-auto flex flex-wrap gap-3 pt-9">
            <button
              type="button"
              onClick={onOpen}
              className="pill pill-solid [--nx:0px] [--ny:0px] [--nr:90deg]"
            >
              Case study
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
            </button>
            {github ? (
              <a
                href={github.href}
                target="_blank"
                rel="noreferrer"
                className="pill"
              >
                GitHub
                <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </div>

        {/* The diagram is the project's own architecture or its measured
            result, drawn in code. */}
        <div className="flex min-w-0 items-center border-t border-rule-2 bg-pit bg-[radial-gradient(80%_60%_at_50%_0%,rgb(244_243_238/0.04),transparent_70%)] p-6 md:p-8 xl:p-10 lg:col-span-6 lg:border-l lg:border-t-0">
          {hasVisual(project.id) ? (
            <div className="w-full min-w-0">
              <ProjectVisual id={project.id} />
            </div>
          ) : null}
        </div>
      </motion.article>
    </div>
  );
}

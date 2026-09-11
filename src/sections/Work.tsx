"use client";

import { useState } from "react";
import {
  featuredProjects,
  flagshipProjects,
  projects,
  supportingProjects,
  type Project,
} from "@/data/projects";
import { STAGES, type ModuleKey } from "@/core/stages";
import { setHover } from "@/core/store";
import { ProjectVisual, hasVisual } from "@/components/ProjectVisual";
import { ProjectModal } from "@/components/ProjectModal";
import { SectionHead, TextLink } from "@/components/Kit";
import { Emerge, MaskLines } from "@/components/Motion";
import { cn } from "@/lib/utils";

const S = STAGES[3];

/* ============================================================================
 * WORK
 *
 * A project inspection, not a card grid. Each flagship is opened out as a
 * record: the thesis, the diagram that carries the argument, the problem and
 * the approach, then the measured results and the links.
 *
 * Bringing a project into focus lights the subsystem of the machine it
 * exercises — so the assembly behind the reading is annotating what is being
 * read rather than running independently of it.
 * ========================================================================= */

/** Which part of the machine each project actually exercises. */
const BOUND: Record<string, ModuleKey> = {
  "beyond-the-loss-curve": "ai",
  "financial-rag": "data",
  "investment-research": "ai",
  aeroforge: "cooling",
  "hospital-siting": "data",
  "portfolio-ml": "cooling",
  req2test: "io",
  "ai-voice-commerce": "io",
  "speech-benchmark": "ai",
  "mt5-platform": "compute",
  "trek-manager": "compute",
};

export function Work() {
  const [open, setOpen] = useState<Project | null>(null);

  return (
    <section id="work" className="stratum relative scroll-mt-28 py-28 md:py-40">
      <div className="rail px-[clamp(1.25rem,4vw,4rem)] xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane">
          <SectionHead index={S.index} label={S.label} state={S.state} />

          <div className="grid-12 mt-14 gap-y-8 md:mt-20">
            <h2 className="t-statement col-span-12 text-ink lg:col-span-6">
              <MaskLines lines={[`${projects.length} systems, and the`]} />
              <span className="block text-signal">
                decision that made each one worth building.
              </span>
            </h2>

            <p className="t-read col-span-12 max-w-[42ch] self-end text-pretty text-ink-3 lg:col-span-4 lg:col-start-8">
              Two produced patent filings. Every number below is measured; every
              choice is one I can defend line by line.
            </p>
          </div>
        </div>
      </div>

      {/* ── flagships, opened out ──────────────────────────────────────── */}
      {flagshipProjects.map((p, i) => (
        <Plate key={p.id} project={p} n={i + 1} onOpen={() => setOpen(p)} />
      ))}

      {/* ── the register ───────────────────────────────────────────────── */}
      <div className="rail mt-24 px-[clamp(1.25rem,4vw,4rem)] md:mt-36 xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane flex items-center gap-4">
          <span className="t-mark text-ink-4">Also built</span>
          <span className="h-px flex-1 bg-rule" aria-hidden="true" />
          <span className="t-note">
            {featuredProjects.length + supportingProjects.length} systems
          </span>
        </div>
      </div>

      <div className="mt-8">
        {[...featuredProjects, ...supportingProjects].map((p, i) => (
          <RegisterRow
            key={p.id}
            project={p}
            n={i + flagshipProjects.length + 1}
            onOpen={() => setOpen(p)}
          />
        ))}
      </div>

      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </section>
  );
}

/* ============================================================================
 * PLATE — one flagship, inspected.
 * ========================================================================= */

function Plate({
  project,
  n,
  onOpen,
}: {
  project: Project;
  n: number;
  onOpen: () => void;
}) {
  const bound = BOUND[project.id] ?? null;
  const visual = hasVisual(project.id);

  return (
    <article
      className="mt-20 md:mt-32"
      onMouseEnter={() => setHover(bound)}
      onMouseLeave={() => setHover(null)}
    >
      <div className="rail px-[clamp(1.25rem,4vw,4rem)] xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane">
          {/* record header */}
          <header className="flex flex-wrap items-baseline gap-x-6 gap-y-2 border-t border-rule-2 pt-5">
            <span className="t-figure-sm text-signal tabular-nums">
              {String(n).padStart(2, "0")}
            </span>
            <h3 className="t-title flex-1 text-ink">{project.title}</h3>
            <span className="t-note">{project.category}</span>
            <span className="t-note tabular-nums">{project.year}</span>
          </header>

          {/* the thesis */}
          <p className="t-statement mt-10 max-w-[22ch] text-pretty text-ink-2 md:mt-14">
            {project.tagline}
          </p>

          {/* diagram beside the record */}
          <div className="grid-12 mt-12 gap-y-12 md:mt-16">
            {visual ? (
              <div className="col-span-12 lg:col-span-6">
                <Emerge as="figure">
                  <ProjectVisual id={project.id} />
                </Emerge>
              </div>
            ) : null}

            <dl
              className={cn(
                "col-span-12",
                visual ? "lg:col-span-5 lg:col-start-8" : "lg:col-span-8",
              )}
            >
              <Row label="Problem" body={project.problem} />
              <Row label="Approach" body={project.solution} />
              <Row label="My contribution" body={project.contribution} />
            </dl>
          </div>

          {/* technical decisions */}
          {project.technical.length ? (
            <div className="mt-12">
              <p className="t-mark text-ink-4">Technical decisions</p>
              <ul className="mt-5 space-y-3">
                {project.technical.map((line, i) => (
                  <li key={line} className="flex gap-4">
                    <span className="t-note shrink-0 tabular-nums text-rule-3">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="t-read-sm max-w-[72ch] text-pretty text-ink-2">
                      {line}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {/* measured results */}
          {project.metrics.length ? (
            <div className="mt-12 border-t border-rule pt-8">
              <dl className="flex flex-wrap gap-x-12 gap-y-7">
                {project.metrics.map((m) => (
                  <div key={m.label}>
                    <dt className="sr-only">{m.label}</dt>
                    <dd>
                      <span className="t-figure-sm block text-ink">
                        {m.value}
                      </span>
                      <span className="t-note mt-1.5 block max-w-[24ch] leading-snug">
                        {m.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ) : null}

          {/* links and stack */}
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-rule pt-6">
            <button
              type="button"
              onClick={onOpen}
              data-cursor="open"
              className="t-mark text-signal transition-colors duration-300 hover:text-ink"
            >
              Full record →
            </button>
            {project.links.map((l) => (
              <TextLink key={l.href} href={l.href} external className="t-meta">
                {l.label} ↗
              </TextLink>
            ))}
            {project.note ? (
              <span className="t-note ml-auto">{project.note}</span>
            ) : null}
          </div>

          <p className="t-note mt-5">
            {project.stack.map((s, i) => (
              <span key={s}>
                {s}
                {i < project.stack.length - 1 ? (
                  <span className="text-rule-3"> / </span>
                ) : null}
              </span>
            ))}
          </p>
        </div>
      </div>
    </article>
  );
}

function Row({ label, body }: { label: string; body: string }) {
  return (
    <div className="grid-12 gap-y-1.5 border-t border-rule py-5 first:border-t-0 first:pt-0">
      <dt className="t-mark col-span-12 text-ink-4 md:col-span-3">{label}</dt>
      <dd className="t-read-sm col-span-12 max-w-[62ch] text-pretty text-ink-2 md:col-span-9">
        {body}
      </dd>
    </div>
  );
}

/* ============================================================================
 * REGISTER ROW — an index entry, not a card.
 * ========================================================================= */

function RegisterRow({
  project,
  n,
  onOpen,
}: {
  project: Project;
  n: number;
  onOpen: () => void;
}) {
  const bound = BOUND[project.id] ?? null;

  return (
    <div className="border-t border-rule last:border-b">
      <button
        type="button"
        onClick={onOpen}
        onMouseEnter={() => setHover(bound)}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(bound)}
        onBlur={() => setHover(null)}
        data-cursor="open"
        aria-label={`Open the ${project.title} record`}
        className="rail group block w-full px-[clamp(1.25rem,4vw,4rem)] py-6 text-left xl:pr-[clamp(9rem,12vw,14rem)]"
      >
        <span className="lane grid-12 items-baseline gap-y-2">
          <span className="t-note col-span-2 tabular-nums md:col-span-1">
            {String(n).padStart(2, "0")}
          </span>

          <h3 className="t-title col-span-10 text-ink transition-colors duration-300 group-hover:text-signal md:col-span-4">
            {project.title}
          </h3>

          <p className="t-read-sm col-span-12 max-w-[46ch] text-pretty text-ink-3 md:col-span-4 md:col-start-6">
            {project.tagline}
          </p>

          <span className="col-span-12 md:col-span-3 md:text-right">
            {project.metrics.length ? (
              <span className="t-meta block text-ink">
                {project.metrics[0].value}
              </span>
            ) : (
              <span className="t-note block">{project.stack[0]}</span>
            )}
            <span className="t-note mt-1 block">
              {project.metrics.length
                ? project.metrics[0].label
                : project.category}
            </span>
          </span>
        </span>
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  featuredProjects,
  flagshipProjects,
  type Project,
} from "@/data/projects";
import { STAGES } from "@/system/stages";
import { setFocus } from "@/system/stageStore";
import { ProjectVisual } from "@/components/ProjectVisual";
import { ProjectModal } from "@/components/ProjectModal";
import { StageMark, TextLink } from "@/components/Kit";
import { Enter, MaskLines } from "@/components/Motion";

const S = STAGES[3];

export function Work() {
  const [open, setOpen] = useState<Project | null>(null);

  return (
    <section id="work" className="relative scroll-mt-24 py-32 md:py-48">
      <div className="frame rail">
        <StageMark index={S.index} label={S.label} state={S.state} tone="iris" />

        <h2 className="t-statement mt-16 max-w-[24ch] text-balance text-ink md:mt-24">
          <MaskLines lines={["Six systems, and the"]} />
          <span className="block italic text-iris">
            decision that made each one worth building.
          </span>
        </h2>

        <p className="t-note mt-10 max-w-[46ch]">
          Two produced patent filings. Every number below is measured; every
          choice is one I can defend line by line.
        </p>
      </div>

      {/* ── Plates: each flagship gets its own composition ── */}
      <PlateOne project={flagshipProjects[0]} onOpen={() => setOpen(flagshipProjects[0])} />
      <PlateTwo project={flagshipProjects[1]} onOpen={() => setOpen(flagshipProjects[1])} />
      <PlateThree
        project={flagshipProjects[2]}
        onOpen={() => setOpen(flagshipProjects[2])}
      />

      {/* ── The register: an index, not a card grid ── */}
      <div className="frame rail mt-32 md:mt-48">
        <div className="flex items-baseline gap-4">
          <span className="t-mark text-ink-4">Also built</span>
          <span className="h-px flex-1 bg-rule" aria-hidden="true" />
          <span className="t-note">{featuredProjects.length} systems</span>
        </div>
      </div>

      <div className="mt-10">
        {featuredProjects.map((p, i) => (
          <RegisterRow
            key={p.id}
            project={p}
            n={i + 4}
            onOpen={() => setOpen(p)}
          />
        ))}
      </div>

      <ProjectModal project={open} onClose={() => setOpen(null)} />
    </section>
  );
}

/* ============================================================================
 * PLATE 01 — the finding, at the scale of the finding.
 * The two numbers ARE the argument, so they are set as monuments and the
 * chart supports them rather than the other way round.
 * ========================================================================= */

function PlateOne({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: () => void;
}) {
  return (
    <article
      className="mt-28 md:mt-44"
      onMouseEnter={() => setFocus(0)}
      onMouseLeave={() => setFocus(-1)}
    >
      <div className="frame rail">
        <div className="flex items-baseline gap-5 border-t border-rule-2 pt-5">
          <span className="t-figure-sm text-iris">01</span>
          <div className="flex-1">
            <h3 className="t-title text-ink">{project.title}</h3>
            <p className="t-note mt-1">{project.category}</p>
          </div>
          <span className="t-note hidden shrink-0 md:block">{project.year}</span>
        </div>

        <p className="t-statement mt-12 max-w-[20ch] text-balance text-ink-2 md:mt-16">
          Proving a model <span className="text-ink">actually forgot</span>,
          instead of trusting a loss curve that says it did.
        </p>
      </div>

      {/* The confrontation: attacked vs. retrained-from-scratch. */}
      <div className="frame rail mt-16 md:mt-24">
        <div className="grid gap-y-10 border-y border-rule py-12 md:grid-cols-[1fr_auto_1fr] md:gap-x-12 md:py-16">
          <div>
            <p className="t-mark text-amber">Approximate unlearning</p>
            <p className="t-figure mt-5 text-amber">95.2%</p>
            <p className="t-note mt-4 max-w-[24ch]">
              of the &ldquo;forgotten&rdquo; knowledge came back under a brief
              relearning attack. That was the best-scoring method tested.
            </p>
          </div>

          <div className="hidden w-px bg-rule md:block" aria-hidden="true" />

          <div>
            <p className="t-mark text-mint">Retrained from scratch</p>
            <p className="t-figure mt-5 text-mint">28.1%</p>
            <p className="t-note mt-4 max-w-[24ch]">
              under the identical attack. The gap between these two numbers is
              the entire contribution.
            </p>
          </div>
        </div>
      </div>

      <div className="frame rail mt-16 md:mt-20">
        <div className="grid-12 gap-y-12">
          <div className="col-span-12 md:col-span-7">
            <Enter as="figure">
              <ProjectVisual id={project.id} />
            </Enter>
          </div>

          <div className="col-span-12 space-y-9 md:col-span-4 md:col-start-9">
            <Field label="Problem" body={project.problem} />
            <Field label="Approach" body={project.solution} />
            <Field label="My contribution" body={project.contribution} />

            <div className="flex flex-wrap gap-x-7 gap-y-3 pt-2">
              <button
                type="button"
                onClick={onOpen}
                data-cursor="open"
                className="t-meta link-rule text-iris transition-colors duration-300 hover:text-ink"
              >
                Full case study
              </button>
              {project.links.map((l) => (
                <TextLink key={l.href} href={l.href} external className="t-meta">
                  {l.label} ↗
                </TextLink>
              ))}
            </div>
          </div>
        </div>

        <StackLine items={project.stack} />
      </div>
    </article>
  );
}

/* ============================================================================
 * PLATE 02 — a pipeline, so the diagram runs the full measure and the
 * argument is set beneath it in columns, like a plate caption.
 * ========================================================================= */

function PlateTwo({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: () => void;
}) {
  return (
    <article
      className="mt-32 md:mt-48"
      onMouseEnter={() => setFocus(1)}
      onMouseLeave={() => setFocus(-1)}
    >
      <div className="frame rail">
        <div className="flex items-baseline gap-5 border-t border-rule-2 pt-5">
          <span className="t-figure-sm text-iris">02</span>
          <div className="flex-1">
            <h3 className="t-title text-ink">{project.title}</h3>
            <p className="t-note mt-1">{project.category}</p>
          </div>
          <span className="t-note hidden shrink-0 md:block">{project.year}</span>
        </div>
      </div>

      {/* Diagram runs wide — the architecture is the hero here. */}
      <div className="frame rail mt-14 md:mt-20">
        <Enter as="figure">
          <ProjectVisual id={project.id} />
        </Enter>
      </div>

      <div className="frame rail mt-14 md:mt-20">
        <div className="grid-12 gap-y-12">
          <p className="t-statement col-span-12 max-w-[18ch] text-balance text-ink-2 md:col-span-5">
            Every answer walks back to the{" "}
            <span className="text-ink">paragraph that produced it.</span>
          </p>

          <div className="col-span-12 space-y-9 md:col-span-3 md:col-start-7">
            <Field label="Problem" body={project.problem} />
            <Field label="Approach" body={project.solution} />
          </div>

          <div className="col-span-12 md:col-span-3 md:col-start-10">
            <div className="border-t border-rule pt-5">
              <p className="t-figure-sm text-mint">0.71→0.89</p>
              <p className="t-note mt-2.5">
                Faithfulness across a 50-question RAGAS set
              </p>
            </div>
            <div className="mt-8 border-t border-rule pt-5">
              <p className="t-figure-sm text-mint">~40%</p>
              <p className="t-note mt-2.5">
                Token cost removed by contextual compression
              </p>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3">
              <button
                type="button"
                onClick={onOpen}
                data-cursor="open"
                className="t-meta link-rule text-iris transition-colors duration-300 hover:text-ink"
              >
                Full case study
              </button>
              {project.links.map((l) => (
                <TextLink key={l.href} href={l.href} external className="t-meta">
                  {l.label} ↗
                </TextLink>
              ))}
            </div>
          </div>
        </div>

        <StackLine items={project.stack} />
      </div>
    </article>
  );
}

/* ============================================================================
 * PLATE 03 — an orchestration manifest.
 *
 * Neither of the other plates would fit this: the first is a confrontation
 * between two numbers, the second is a pipeline read left to right. An agent
 * system is a *roster* with an order of execution, so the composition is a
 * numbered crew list set against the graph they share.
 * ========================================================================= */

function PlateThree({
  project,
  onOpen,
}: {
  project: Project;
  onOpen: () => void;
}) {
  return (
    <article
      className="mt-32 md:mt-48"
      onMouseEnter={() => setFocus(2)}
      onMouseLeave={() => setFocus(-1)}
    >
      <div className="frame rail">
        <div className="flex items-baseline gap-5 border-t border-rule-2 pt-5">
          <span className="t-figure-sm text-iris">03</span>
          <div className="flex-1">
            <h3 className="t-title text-ink">{project.title}</h3>
            <p className="t-note mt-1">{project.category}</p>
          </div>
          <span className="t-note hidden shrink-0 md:block">{project.year}</span>
        </div>

        <p className="t-statement mt-12 max-w-[19ch] text-balance text-ink-2 md:mt-16">
          A half-failed run{" "}
          <span className="text-ink">resumes</span> instead of starting over.
        </p>
      </div>

      <div className="frame rail mt-16 md:mt-24">
        <div className="grid-12 gap-y-12">
          {/* The crew, in execution order. */}
          <div className="col-span-12 md:col-span-4">
            <p className="t-mark text-ink-4">Agents</p>
            <ol className="mt-6">
              {(project.roster ?? []).map((agent, i) => (
                <li
                  key={agent}
                  className="flex items-baseline gap-5 border-t border-rule py-3.5 last:border-b"
                >
                  <span className="t-note w-6 shrink-0 text-iris">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="t-meta text-ink">{agent}</span>
                </li>
              ))}
            </ol>
            <p className="t-note mt-6 max-w-[30ch]">
              All five share one typed state graph. Deterministic code decides
              what runs next; the model only exercises judgement inside a node.
            </p>
          </div>

          <div className="col-span-12 md:col-span-7 md:col-start-6">
            <Enter as="figure">
              <ProjectVisual id={project.id} />
            </Enter>
          </div>
        </div>

        <div className="grid-12 mt-16 gap-y-10">
          <div className="col-span-12 md:col-span-3">
            <Field label="Problem" body={project.problem} />
          </div>
          <div className="col-span-12 md:col-span-4 md:col-start-5">
            <Field label="Approach" body={project.solution} />
          </div>
          <div className="col-span-12 md:col-span-3 md:col-start-10">
            <Field label="My contribution" body={project.contribution} />
            <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3">
              <button
                type="button"
                onClick={onOpen}
                data-cursor="open"
                className="t-meta link-rule text-iris transition-colors duration-300 hover:text-ink"
              >
                Full case study
              </button>
              {project.links.map((l) => (
                <TextLink key={l.href} href={l.href} external className="t-meta">
                  {l.label} ↗
                </TextLink>
              ))}
            </div>
          </div>
        </div>

        <StackLine items={project.stack} />
      </div>
    </article>
  );
}

/* ---------------------------------------------------------------- register */

function RegisterRow({
  project,
  n,
  onOpen,
}: {
  project: Project;
  n: number;
  onOpen: () => void;
}) {
  return (
    <div
      className="border-t border-rule last:border-b"
      onMouseEnter={() => setFocus(n % 4)}
      onMouseLeave={() => setFocus(-1)}
    >
      <button
        type="button"
        data-cursor="open"
        onClick={onOpen}
        onFocus={() => setFocus(n % 4)}
        aria-label={`Open the ${project.title} case study`}
        className="frame rail group block w-full py-8 text-left md:py-10"
      >
        <div className="grid-12 items-baseline gap-y-3">
          <span className="t-note col-span-2 md:col-span-1">
            {String(n).padStart(2, "0")}
          </span>

          <h3 className="t-title col-span-10 text-ink transition-colors duration-300 group-hover:text-iris md:col-span-4">
            {project.title}
          </h3>

          <p className="t-read-sm col-span-12 max-w-[46ch] text-pretty text-ink-3 md:col-span-4 md:col-start-6">
            {project.tagline}
          </p>

          <div className="col-span-12 md:col-span-3 md:col-start-10 md:text-right">
            {project.metrics.length ? (
              <span className="t-meta text-mint">
                {project.metrics[0].value}
              </span>
            ) : (
              <span className="t-note">{project.stack[0]}</span>
            )}
            <span className="t-note mt-0.5 block">
              {project.metrics.length ? project.metrics[0].label : project.category}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- shared */

function Field({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <h4 className="t-mark text-ink-4">{label}</h4>
      <p className="t-read-sm mt-2.5 text-pretty text-ink-2">{body}</p>
    </div>
  );
}

/** Stack as a single running line of type. Twelve pills would be twelve boxes. */
function StackLine({ items }: { items: readonly string[] }) {
  return (
    <p className="t-note mt-14 border-t border-rule pt-4">
      {items.map((s, i) => (
        <span key={s}>
          {s}
          {i < items.length - 1 ? (
            <span className="text-rule-3"> / </span>
          ) : null}
        </span>
      ))}
    </p>
  );
}

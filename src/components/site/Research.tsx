"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { papers, patents, type Patent } from "@/data/research";
import { cn } from "@/lib/utils";
import { Em, Reveal, RiseLines, SectionLabel } from "./ui";

const unlearning = patents.filter((p) =>
  p.domain.startsWith("Machine unlearning"),
).length;

/**
 * The patent record. Every row carries what a reader checks first — the
 * application number and the publication date — and opens to what the
 * invention does and what was measured.
 */
export function Research() {
  const [open, setOpen] = useState<string | null>(patents[0].id);

  return (
    <section id="research" className="shell scroll-mt-24 py-28 md:py-40">
      <SectionLabel index="03">Patents &amp; research</SectionLabel>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <h2 className="t-display max-w-[15ch]">
          <RiseLines
            onView
            lines={[
              "Five applications.",
              <>
                All <Em>published.</Em>
              </>,
            ]}
          />
        </h2>
        <Reveal className="t-read max-w-[42ch] text-ink-2">
          Co-inventor on five Indian patent applications filed by Vellore
          Institute of Technology. Three of them cover machine unlearning:
          removing data from a trained model, and proving it is gone.
        </Reveal>
      </div>

      <Reveal>
        <dl className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-rule-2 bg-rule-2 shadow-[0_34px_70px_-34px_rgb(0_0_0/0.95)] md:mt-20 md:grid-cols-4">
          {[
            { value: String(patents.length), label: "Applications filed" },
            { value: String(patents.length), label: "Published" },
            { value: String(unlearning), label: "On machine unlearning" },
            { value: "2026", label: "Filed and published" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-panel bg-linear-to-b from-white/[0.03] to-transparent to-45% p-6 shadow-[inset_0_1px_0_rgb(255_255_255/0.065)] md:p-8"
            >
              <dd className="t-figure text-ink">{s.value}</dd>
              <dt className="t-note mt-3">{s.label}</dt>
            </div>
          ))}
        </dl>
      </Reveal>

      <ol className="mt-10 border-t border-rule-2 md:mt-14">
        {patents.map((p, i) => (
          <Reveal as="li" key={p.id} delay={Math.min(i, 3) * 0.05}>
            <Row
              patent={p}
              n={i + 1}
              open={open === p.id}
              onToggle={() => setOpen(open === p.id ? null : p.id)}
            />
          </Reveal>
        ))}
      </ol>

      {/* ── manuscripts ── */}
      <div className="mt-24 md:mt-36">
        <Reveal className="flex items-baseline justify-between border-b border-rule-2 pb-5">
          <h3 className="t-title">Manuscripts</h3>
          <span className="t-note tabular-nums">
            {String(papers.length).padStart(2, "0")}
          </span>
        </Reveal>
        <ul>
          {papers.map((paper, i) => (
            <Reveal
              as="li"
              key={paper.id}
              delay={i * 0.05}
              className="grid gap-x-10 gap-y-3 border-b border-rule-2 py-8 lg:grid-cols-12"
            >
              <div className="lg:col-span-3">
                <p className="t-meta text-ink">{paper.venue}</p>
                <p className="t-note mt-1 text-accent">{paper.status}</p>
                <p className="t-note">{paper.position}</p>
              </div>
              <div className="lg:col-span-9">
                <h4 className="max-w-[52ch] text-[1.125rem] font-medium leading-snug tracking-tight text-ink">
                  {paper.title}
                </h4>
                <p className="t-read-sm mt-3 max-w-[70ch] text-ink-2">
                  {paper.summary}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Row({
  patent,
  n,
  open,
  onToggle,
}: {
  patent: Patent;
  n: number;
  open: boolean;
  onToggle: () => void;
}) {
  const panel = `${patent.id}-panel`;

  return (
    <div
      className={cn(
        "border-b transition-colors duration-500",
        open ? "border-rule-3" : "border-rule-2",
      )}
    >
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panel}
          onClick={onToggle}
          className="group grid w-full grid-cols-12 items-start gap-x-6 gap-y-3 py-7 text-left md:py-9"
        >
          <span className="t-meta col-span-12 pt-1.5 text-ink-3 md:col-span-1">
            {String(n).padStart(2, "0")}
          </span>

          <span className="col-span-10 md:col-span-7">
            <span
              className={cn(
                "block text-[clamp(1.25rem,2.3vw,2rem)] font-medium leading-[1.12] tracking-[-0.032em] transition-colors duration-300",
                open ? "text-ink" : "text-ink-2 group-hover:text-ink",
              )}
            >
              {patent.title}
            </span>
            <span className="t-note mt-3 block">{patent.domain}</span>
          </span>

          <span className="col-span-10 flex flex-col gap-1 md:col-span-3 md:items-end md:pt-1.5 md:text-right">
            <span className="t-meta text-ink">IN {patent.application}</span>
            <span className="t-note">
              <span
                className="mr-2 inline-block h-1.5 w-1.5 -translate-y-px rounded-full bg-accent align-middle"
                aria-hidden="true"
              />
              Published {patent.published}
            </span>
          </span>

          <span className="col-span-2 col-start-11 row-start-2 flex justify-end md:col-span-1 md:col-start-12 md:row-start-1 md:pt-1">
            <span
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                open
                  ? "rotate-45 border-accent bg-accent text-void"
                  : "border-rule-3 text-ink group-hover:border-ink",
              )}
            >
              <Plus size={18} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </span>
        </button>
      </h3>

      {/* Height animates through the grid track, so the panel can be any
          length without measuring it. */}
      <div
        id={panel}
        role="region"
        aria-label={patent.title}
        inert={!open}
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="overflow-hidden">
          <div className="grid grid-cols-12 gap-x-6 gap-y-8 pb-10 md:pb-12">
            <div className="col-span-12 md:col-span-7 md:col-start-2">
              <p className="t-read text-ink-2">{patent.summary}</p>

              {patent.figures.length ? (
                <dl className="mt-8 flex flex-wrap gap-x-12 gap-y-6">
                  {patent.figures.map((f) => (
                    <div key={f.label}>
                      <dd className="t-figure text-accent">{f.value}</dd>
                      <dt className="t-note mt-2 max-w-[26ch]">{f.label}</dt>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>

            <dl className="col-span-12 grid grid-cols-2 gap-x-6 gap-y-5 md:col-span-4 md:grid-cols-1 md:border-l md:border-rule-2 md:pl-6">
              <Meta label="Application">
                Indian Patent Application {patent.application}
              </Meta>
              <Meta label="Filed">{patent.filed}</Meta>
              <Meta label="Published">
                {patent.published}
                {patent.extra ? (
                  <span className="block text-ink-3">{patent.extra}</span>
                ) : null}
              </Meta>
              <Meta label="Inventors">
                {patent.inventors.map((name) => (
                  <span
                    key={name}
                    className={cn(
                      "block",
                      name === "Dhanush Konduru" ? "text-accent" : "",
                    )}
                  >
                    {name}
                  </span>
                ))}
              </Meta>
              <Meta label="Applicant">{patent.applicant}</Meta>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function Meta({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="t-mark text-ink-3">{label}</dt>
      <dd className="t-meta mt-1.5 leading-relaxed text-ink">{children}</dd>
    </div>
  );
}

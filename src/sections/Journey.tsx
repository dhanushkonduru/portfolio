"use client";

import { experience } from "@/data/experience";
import { achievements, certifications } from "@/data/achievements";
import { STAGES } from "@/system/stages";
import { StageMark } from "@/components/Kit";
import { Enter } from "@/components/Motion";
import { cn } from "@/lib/utils";

const S = STAGES[5];

/** Walked forwards. This section is a path, and a path has a direction. */
const path = [...experience].reverse();

export function Journey() {
  return (
    <section id="journey" className="relative scroll-mt-24 py-32 md:py-48">
      <div className="frame rail">
        <StageMark index={S.index} label={S.label} state={S.state} tone="cyan" />

        <div className="mt-14 md:mt-20">
          <p className="t-figure text-cyan">
            2022 <span className="text-rule-3">/</span> 2027
          </p>
          <h2 className="t-title mt-9 max-w-[34ch] text-balance text-ink">
            One degree, three internships, and the research that ran alongside
            both.
          </h2>
          <p className="t-note mt-6 max-w-[38ch]">
            Read forwards. The field behind has collapsed into a single line. This
            is that line, written out.
          </p>
        </div>
      </div>

      {/* ── the path: each stop steps further across the page ── */}
      <ol className="mt-24 md:mt-36">
        {path.map((role, i) => {
          // Two roles started in 2025, so a bare start year printed the same
          // monument twice. Show the span wherever it crosses a year boundary.
          const from = role.start.slice(0, 4);
          const to = role.end.slice(0, 4);
          const year = from === to ? from : `${from}/${to.slice(2)}`;

          // Stepping the indent reads as a traversal, but it has to stop
          // before it reaches the text column.
          const indent =
            ["md:col-start-1", "md:col-start-2", "md:col-start-2", "md:col-start-3"][i] ??
            "md:col-start-1";

          return (
            <li key={role.id} className="border-t border-rule last:border-b">
              <Enter as="article" delay={0.03}>
                <div className="frame rail grid-12 gap-y-6 py-14 md:py-20">
                  <div className={cn("col-span-12 md:col-span-3", indent)}>
                    <p className="font-mono text-[clamp(2rem,3.4vw,3.75rem)] font-medium leading-none tracking-[-0.04em] tabular-nums text-cyan/90">
                      {year}
                    </p>
                    <p className="t-note mt-3">{role.period}</p>
                  </div>

                  <div className="col-span-12 md:col-span-6 md:col-start-7">
                    <h3 className="t-title text-ink">{role.title}</h3>
                    <p className="t-meta mt-2 text-cyan">
                      {role.company}
                      <span className="ml-3 text-ink-4">
                        {role.location}
                        {role.mode !== role.location ? ` · ${role.mode}` : ""}
                      </span>
                    </p>

                    <div className="mt-7 space-y-4">
                      {role.points.map((point) => (
                        <p
                          key={point}
                          className="t-read-sm max-w-[62ch] text-pretty text-ink-2"
                        >
                          {point}
                        </p>
                      ))}
                    </div>

                    <p className="t-note mt-7">
                      {role.stack.map((s, k) => (
                        <span key={s}>
                          {s}
                          {k < role.stack.length - 1 ? (
                            <span className="text-rule-3"> / </span>
                          ) : null}
                        </span>
                      ))}
                    </p>
                  </div>
                </div>
              </Enter>
            </li>
          );
        })}
      </ol>

      {/* ── recognition: the first place is not the same size as the others ── */}
      <div className="frame rail mt-28 md:mt-40">
        <div className="flex items-baseline gap-4">
          <span className="t-mark text-ink-4">Recognition</span>
          <span className="h-px flex-1 bg-rule" aria-hidden="true" />
        </div>

        <div className="grid-12 mt-14 gap-y-12">
          {achievements.map((a, i) => (
            <Enter
              key={a.id}
              delay={i * 0.05}
              as="article"
              className={
                i === 0
                  ? "col-span-12 md:col-span-6"
                  : "col-span-12 sm:col-span-6 md:col-span-3"
              }
            >
              <p className="t-note">{a.year}</p>
              <p
                className={cn(
                  "mt-3",
                  i === 0 ? "t-figure text-amber" : "t-figure-sm text-ink",
                )}
              >
                {a.rank}
              </p>
              <h3
                className={cn(
                  "mt-5 text-pretty text-ink",
                  i === 0 ? "t-read" : "t-read-sm",
                )}
              >
                {a.event}
              </h3>
              <p className="t-note mt-2">{a.detail}</p>
            </Enter>
          ))}
        </div>

        {/* Certifications as one running line — four boxes would be four boxes. */}
        <div className="mt-20 border-t border-rule pt-5">
          <p className="t-mark mb-3 text-ink-4">Certifications</p>
          <p className="t-note leading-relaxed">
            {certifications.map((c, i) => (
              <span key={c.name}>
                <span className="text-ink-2">{c.name}</span>
                <span className="text-ink-4">, {c.issuer}</span>
                {i < certifications.length - 1 ? (
                  <span className="text-rule-3"> / </span>
                ) : null}
              </span>
            ))}
          </p>
        </div>
      </div>
    </section>
  );
}

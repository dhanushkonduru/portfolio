"use client";

import { experience } from "@/data/experience";
import { achievements, certifications } from "@/data/achievements";
import { STAGES } from "@/core/stages";
import { SectionHead } from "@/components/Kit";
import { Emerge } from "@/components/Motion";
import { cn } from "@/lib/utils";

const S = STAGES[5];

/* ============================================================================
 * JOURNEY
 *
 * The camera has pulled back and the machine is reassembling, so this section
 * is the one place the page runs full width: a single line walked forwards,
 * with the years set as the measurement they are.
 * ========================================================================= */

/** Walked forwards. A path has a direction. */
const path = [...experience].reverse();

export function Journey() {
  return (
    <section
      id="journey"
      className="stratum relative scroll-mt-28 py-28 md:py-40"
    >
      <div className="rail px-[clamp(1.25rem,4vw,4rem)] xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane">
          <SectionHead index={S.index} label={S.label} state={S.state} />

          <div className="grid-12 mt-14 items-end gap-y-8 md:mt-20">
            <p className="t-figure col-span-12 text-ink lg:col-span-4">
              2022 <span className="text-rule-3">—</span> 2027
            </p>

            <div className="col-span-12 lg:col-span-6 lg:col-start-6">
              <h2 className="t-title max-w-[36ch] text-balance text-ink">
                One degree, three internships, and the research that ran
                alongside both.
              </h2>
              <p className="t-note mt-4 max-w-[40ch]">
                Read forwards. The assembly behind has collapsed back into one
                machine; this is the line it travelled to get there.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── the path ───────────────────────────────────────────────────── */}
      <ol className="mt-20 md:mt-28">
        {path.map((role, i) => {
          /* Two roles started in 2025, so a bare start year printed the same
             monument twice. Show the span wherever it crosses a boundary. */
          const from = role.start.slice(0, 4);
          const to = role.end.slice(0, 4);
          const year = from === to ? from : `${from}–${to.slice(2)}`;

          return (
            <li key={role.id} className="border-t border-rule last:border-b">
              <Emerge as="article" delay={0.03}>
                <div className="rail px-[clamp(1.25rem,4vw,4rem)] py-10 md:py-14 xl:pr-[clamp(9rem,12vw,14rem)]">
                  <div className="lane grid-12 gap-y-5">
                    <div className="col-span-12 md:col-span-3">
                      <p className="font-mono text-[clamp(1.6rem,2.6vw,2.6rem)] font-medium leading-none tracking-[-0.05em] tabular-nums text-ink-2">
                        {year}
                      </p>
                      <p className="t-note mt-3">{role.period}</p>
                      <p className="t-note mt-1">
                        {role.location}
                        {role.mode !== role.location ? ` · ${role.mode}` : ""}
                      </p>
                    </div>

                    <div className="col-span-12 md:col-span-8 md:col-start-5">
                      <h3 className="t-title text-ink">{role.title}</h3>
                      <p className="t-meta mt-1.5 text-signal">
                        {role.company}
                      </p>

                      <div className="mt-6 space-y-3.5">
                        {role.points.map((point) => (
                          <p
                            key={point}
                            className="t-read-sm max-w-[68ch] text-pretty text-ink-2"
                          >
                            {point}
                          </p>
                        ))}
                      </div>

                      <p className="t-note mt-6">
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
                </div>
              </Emerge>
            </li>
          );
        })}
      </ol>

      {/* ── recognition ────────────────────────────────────────────────── */}
      <div className="rail mt-24 px-[clamp(1.25rem,4vw,4rem)] md:mt-32 xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane">
          <div className="flex items-center gap-4">
            <span className="t-mark text-ink-4">Recognition</span>
            <span className="h-px flex-1 bg-rule" aria-hidden="true" />
          </div>

          <div className="grid-12 mt-10 gap-y-10">
            {achievements.map((a, i) => (
              <Emerge
                key={a.id}
                delay={i * 0.05}
                as="article"
                className={
                  i === 0
                    ? "col-span-12 md:col-span-5"
                    : "col-span-12 sm:col-span-6 md:col-span-3"
                }
              >
                <p className="t-note tabular-nums">{a.year}</p>
                <p
                  className={cn(
                    "mt-2.5",
                    i === 0 ? "t-figure text-signal" : "t-figure-sm text-ink",
                  )}
                >
                  {a.rank}
                </p>
                <h3
                  className={cn(
                    "mt-4 text-pretty text-ink",
                    i === 0 ? "t-read" : "t-read-sm",
                  )}
                >
                  {a.event}
                </h3>
                <p className="t-note mt-2">{a.detail}</p>
              </Emerge>
            ))}
          </div>

          {/* Certifications as one running line. Four boxes would be four boxes. */}
          <div className="mt-16 border-t border-rule pt-5">
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
      </div>
    </section>
  );
}

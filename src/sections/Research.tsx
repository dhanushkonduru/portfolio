"use client";

import { papers, patents, type Patent } from "@/data/research";
import { STAGES } from "@/core/stages";
import { setHover } from "@/core/store";
import { Field, SectionHead } from "@/components/Kit";
import { DrawRule, Emerge, MaskLines } from "@/components/Motion";

const S = STAGES[4];

/* ============================================================================
 * RESEARCH
 *
 * The camera has reached the inner core, so this section reads as a terminal
 * rather than as a page: record identifiers first, hanging labels, monospace
 * throughout, findings given the weight of findings. An archive, not a blog.
 * ========================================================================= */

export function Research() {
  return (
    <section
      id="research"
      className="stratum relative scroll-mt-28 py-28 md:py-44"
      onMouseEnter={() => setHover("compute")}
      onMouseLeave={() => setHover(null)}
    >
      <div className="rail px-[clamp(1.25rem,4vw,4rem)] xl:pr-[clamp(9rem,12vw,14rem)]">
        <SectionHead index={S.index} label={S.label} state={S.state} />

        <div className="grid-12 mt-14 gap-y-10 md:mt-20 lane">
          <h2 className="t-statement col-span-12 text-ink lg:col-span-7 lg:col-start-6">
            <MaskLines lines={["Two invention disclosures."]} />
            <span className="block text-signal">
              Both cleared as patentable.
            </span>
          </h2>

          {/* The identifiers lead. This is a record, not a pitch. */}
          <div className="col-span-12 row-start-1 lg:col-span-5 lg:row-start-1">
            <p className="t-mark text-ink-4">On file</p>
            <ul className="mt-4 space-y-1.5">
              {patents.map((p) => (
                <li key={p.id} className="t-meta text-ink-2">
                  {p.ipr}
                </li>
              ))}
            </ul>
            <p className="t-note mt-6 max-w-[30ch]">
              The assembly behind this section is the specimen. Scrolling drives
              the probe down through it.
            </p>
          </div>
        </div>
      </div>

      {/* ── dossiers ───────────────────────────────────────────────────── */}
      <div className="mt-20 md:mt-32">
        {patents.map((p, i) => (
          <Dossier key={p.id} patent={p} n={i + 1} />
        ))}
      </div>

      {/* ── manuscripts ────────────────────────────────────────────────── */}
      <div className="rail mt-24 px-[clamp(1.25rem,4vw,4rem)] md:mt-36 xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane">
          <div className="flex items-center gap-4">
            <span className="t-mark text-ink-4">Manuscripts</span>
            <span className="h-px flex-1 bg-rule" aria-hidden="true" />
            <span className="t-note">{papers.length} entries</span>
          </div>

          <ul className="mt-8">
            {papers.map((paper) => (
              <li key={paper.id} className="border-t border-rule last:border-b">
                <article className="grid-12 gap-y-4 py-7 md:py-9">
                  <div className="col-span-12 md:col-span-3">
                    <p className="t-meta text-ink-2">{paper.venue}</p>
                    <p className="t-note mt-1 text-signal">{paper.status}</p>
                    <p className="t-note mt-3">{paper.position}</p>
                  </div>

                  <div className="col-span-12 md:col-span-5">
                    <h3 className="t-read text-balance text-ink">
                      {paper.title}
                    </h3>
                    <p className="t-note mt-2.5">{paper.authors}</p>
                    <p className="t-read-sm mt-4 text-pretty text-ink-3">
                      {paper.summary}
                    </p>
                  </div>

                  <div className="col-span-12 md:col-span-3 md:col-start-10">
                    <p className="t-mark text-ink-4">Contribution</p>
                    <p className="t-read-sm mt-2.5 text-pretty text-ink-2">
                      {paper.contribution}
                    </p>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ============================================================================
 * DOSSIER — a laboratory record, not a corporate legal page.
 * ========================================================================= */

function Dossier({ patent, n }: { patent: Patent; n: number }) {
  return (
    <article className="border-t border-rule-2 py-12 last:border-b md:py-16">
      {/* The camera is inside the core here, so the assembly occupies the left
          of the bay and the record is held clear of it. */}
      <div className="rail px-[clamp(1.25rem,4vw,4rem)] xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane">
          <header className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <span className="t-figure-sm text-signal tabular-nums">
              {String(n).padStart(2, "0")}
            </span>
            <span className="t-meta text-ink-2">{patent.ipr}</span>
            <span className="t-note text-signal">{patent.status}</span>
            <span className="t-note w-full md:ml-auto md:w-auto">
              {patent.area}
            </span>
          </header>

          <h3 className="t-title mt-7 max-w-[32ch] text-balance text-ink">
            {patent.title}
          </h3>

          <p className="t-note mt-3">
            {patent.authors}
            <span className="mx-2 text-rule-3">/</span>
            <span className="text-signal">{patent.authorNote}</span>
          </p>

          <dl className="mt-10 md:mt-12">
            <Field label="What it covers" body={patent.summary} />
            <Field label="My contribution" body={patent.contribution} />
          </dl>

          <Emerge>
            <div className="mt-10 md:mt-12">
              <DrawRule className="block h-px w-full bg-rule-2" />
              <div className="grid-12 gap-y-3 py-7">
                <p className="t-mark col-span-12 text-signal md:col-span-3">
                  Finding
                </p>
                <p className="t-read col-span-12 max-w-[62ch] text-pretty text-ink md:col-span-9">
                  {patent.finding}
                </p>
              </div>
              <DrawRule className="block h-px w-full bg-rule-2" />
            </div>
          </Emerge>

          <p className="t-note mt-5 max-w-[70ch]">{patent.searchReport}</p>
        </div>
      </div>
    </article>
  );
}

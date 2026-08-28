"use client";

import { papers, patents, type Patent } from "@/data/research";
import { STAGES } from "@/system/stages";
import { StageMark } from "@/components/Kit";
import { DrawRule, Enter, MaskLines } from "@/components/Motion";

const S = STAGES[4];

/**
 * The laboratory. This section deliberately runs the lightest veil on the
 * page: the field behind it is the specimen, and scrolling here drives the
 * probe down through it. The 3D is the exhibit, not the wallpaper.
 */
export function Research() {
  return (
    <section id="research" className="relative scroll-mt-24 py-32 md:py-52">
      <div className="frame rail">
        <StageMark index={S.index} label={S.label} state={S.state} tone="amber" />

        <div className="grid-12 mt-16 gap-y-10 md:mt-24">
          {/* The record identifiers lead — this is an archive, not a pitch. */}
          <div className="col-span-12 md:col-span-3">
            <p className="t-mark text-ink-4">On file</p>
            <ul className="mt-4 space-y-1.5">
              {patents.map((p) => (
                <li key={p.id} className="t-meta text-ink-2">
                  {p.ipr}
                </li>
              ))}
            </ul>
            <p className="t-note mt-7 max-w-[26ch]">
              The field behind this section is the specimen. Scrolling drives
              the probe down through it.
            </p>
          </div>

          <h2 className="t-statement col-span-12 text-balance text-ink md:col-span-8 md:col-start-5 md:text-right">
            <MaskLines lines={["Two invention disclosures."]} />
            <span className="block italic text-amber">
              Both cleared as patentable.
            </span>
          </h2>
        </div>
      </div>

      {/* ── the dossiers ── */}
      <div className="mt-24 md:mt-36">
        {patents.map((p, i) => (
          <Dossier key={p.id} patent={p} n={i + 1} />
        ))}
      </div>

      {/* ── manuscripts: a bare technical register ── */}
      <div className="frame rail mt-28 md:mt-40">
        <div className="flex items-baseline gap-4">
          <span className="t-mark text-ink-4">Manuscripts</span>
          <span className="h-px flex-1 bg-rule" aria-hidden="true" />
          <span className="t-note">{papers.length} entries</span>
        </div>

        <ul className="mt-10">
          {papers.map((paper) => (
            <li key={paper.id} className="border-t border-rule last:border-b">
              <article className="grid-12 gap-y-4 py-8 md:py-10">
                <div className="col-span-12 md:col-span-3">
                  <p className="t-meta text-ink-2">{paper.venue}</p>
                  <p className="t-note mt-1 text-amber">{paper.status}</p>
                  <p className="t-note mt-3">{paper.position}</p>
                </div>

                <div className="col-span-12 md:col-span-5">
                  <h3 className="t-read text-balance text-ink">{paper.title}</h3>
                  <p className="t-note mt-3">{paper.authors}</p>
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
    </section>
  );
}

/* ============================================================================
 * DOSSIER
 *
 * Styled as a technical record rather than a card: hanging labels in the left
 * column, body in the right, rules top and bottom, identifiers in monospace.
 * A laboratory notebook, not a corporate legal page.
 * ========================================================================= */

function Dossier({ patent, n }: { patent: Patent; n: number }) {
  return (
    <article className="border-t border-rule-2 py-14 last:border-b md:py-20">
      <div className="frame rail">
        {/* record header */}
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
          <span className="t-figure-sm text-amber">
            {String(n).padStart(2, "0")}
          </span>
          <span className="t-meta text-ink-2">{patent.ipr}</span>
          <span className="t-note text-amber">{patent.status}</span>
          <span className="t-note w-full md:ml-auto md:w-auto">{patent.area}</span>
        </div>

        <h3 className="t-title mt-8 max-w-[26ch] text-balance text-ink">
          {patent.title}
        </h3>

        <p className="t-note mt-4">
          {patent.authors}
          <span className="mx-2 text-rule-3">/</span>
          <span className="text-amber">{patent.authorNote}</span>
        </p>

        {/* hanging-label record body */}
        <dl className="mt-12 md:mt-16">
          <Row label="What it covers" body={patent.summary} />
          <Row label="My contribution" body={patent.contribution} />
        </dl>

        {/* the finding, given weight */}
        <Enter>
          <div className="mt-12 md:mt-16">
            <DrawRule className="block h-px w-full bg-rule-2" />
            <div className="grid-12 gap-y-4 py-8">
              <p className="t-mark col-span-12 text-amber md:col-span-2">
                Finding
              </p>
              <p className="t-read col-span-12 max-w-[62ch] text-pretty text-ink md:col-span-9 md:col-start-4">
                {patent.finding}
              </p>
            </div>
            <DrawRule className="block h-px w-full bg-rule-2" />
          </div>
        </Enter>

        <p className="t-note mt-6 max-w-[70ch]">{patent.searchReport}</p>
      </div>
    </article>
  );
}

function Row({ label, body }: { label: string; body: string }) {
  return (
    <div className="grid-12 gap-y-2 border-t border-rule py-6">
      <dt className="t-mark col-span-12 text-ink-4 md:col-span-2">{label}</dt>
      <dd className="t-read-sm col-span-12 max-w-[68ch] text-pretty text-ink-2 md:col-span-9 md:col-start-4">
        {body}
      </dd>
    </div>
  );
}

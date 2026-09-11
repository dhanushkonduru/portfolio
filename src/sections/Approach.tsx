"use client";

import { profile } from "@/data/profile";
import { STAGES, SUBSYSTEMS } from "@/core/stages";
import { setHover } from "@/core/store";
import { Annotation, SectionHead } from "@/components/Kit";
import { DrawRule, Emerge, MaskLines } from "@/components/Motion";

const S = STAGES[1];

/* ============================================================================
 * APPROACH
 *
 * Not a separate page — the same bay, with the column of type moved to the
 * right so the machine occupies the left. What changes between sections is the
 * camera and the composition, never the environment.
 * ========================================================================= */

/** Positions he already takes in his own repositories, quoted back as stance. */
const principles = [
  {
    n: "01",
    title: "Measured, not asserted",
    body: "A growth forecast gets hindcast against an epoch withheld from its calibration. A siting model runs with and without the criterion under test. A retrieval change is kept only if the eval set moves.",
  },
  {
    n: "02",
    title: "Code orchestrates, models judge",
    body: "Agent systems are pipelines of typed stages, not one long prompt. Deterministic code decides what runs next; every stage returns a validated object or raises.",
  },
  {
    n: "03",
    title: "State the constraint",
    body: "MetaTrader 5 gives application developers no API keys, so the architecture doc says so and the design works around it. A status table that admits which phases are only verified against a mock is worth more than one that implies otherwise.",
  },
];

const passages = [
  {
    heading: "Backends, in production",
    body: "At CEEC I built the multi-tenant backend for Tabzy, a cloud ERP/POS product, using custom Django middleware and RBAC so no company can read another company's records. Billing, inventory and orders all run in production. I shipped the API key system end to end, and was the sole backend engineer on BlogSpeed, containerising the service and deploying it to GCP through Cloud Build and Cloud Run.",
  },
  {
    heading: "LLM and agent systems",
    body: "A RAG pipeline over SEC filings that pairs BM25 with dense retrieval, reranks with a cross-encoder, and hands back the chunk IDs behind every answer. A five-agent LangGraph system sharing one typed Pydantic state graph, checkpointed so a run that fails halfway resumes instead of starting over. And req2test, where deterministic code orchestrates the run and the model only exercises judgement inside a typed stage.",
  },
  {
    heading: "Models, measured properly",
    body: "At Centific I benchmarked five models across several NLP tasks through an automated harness, then fine-tuned Phi-3 and DeepSeek with LoRA. On my own work I trained an XGBoost cross-sectional return predictor on S&P 500 names and validated it with expanding-window walk-forward splits, because random k-fold quietly leaks the future into training whenever the data is an ordered time series. The same instinct drives the geospatial work: a Random Forest built-up classifier checked against four independent reference products rather than its own accuracy score.",
  },
  {
    heading: "Applied research",
    body: "Machine unlearning verification. Deleting a record from a database does not delete what a model learned from it, and the standard evidence, a rising loss curve on the deleted rows, turns out to prove almost nothing. Interrogate the model behaviourally, attack your own verdict, gate deployment on the result. Two invention disclosures came out of closing that gap.",
  },
  {
    heading: "Where I'm heading",
    body: "Toward AI platform and applied-research engineering. Teams building retrieval, agents and model infrastructure where the output has to be auditable, because a regulator, a clinician or a portfolio manager is downstream of it.",
  },
];

const record: [string, string][] = [
  ["Education", "Integrated M.Tech, Software Engineering"],
  ["Institution", "VIT Vellore, expected 2027"],
  ["Internships", "CEEC Global · Centific · Aapoon"],
  ["Filings", "Two invention disclosures, first-named"],
];

export function Approach() {
  return (
    <section
      id="approach"
      className="stratum relative scroll-mt-28 py-28 md:py-40"
    >
      <div className="rail px-[clamp(1.25rem,4vw,4rem)] xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane">
          <SectionHead index={S.index} label={S.label} state={S.state} />

          {/* Opening argument, held to the right — the machine has the left. */}
          <div className="grid-12 mt-14 md:mt-20">
            <h2 className="t-statement col-span-12 text-ink lg:col-span-11">
              <MaskLines
                lines={["I build the backend, the", "agents that run on it,"]}
              />
              <span className="mt-1 block text-signal">
                and the proof that both work.
              </span>
            </h2>
          </div>

          <div className="grid-12 mt-16 gap-y-12 md:mt-24">
            <div className="col-span-12 lg:col-span-4">
              <Emerge>
                <Annotation className="lg:sticky lg:top-36">
                  Three internships, two patent filings, and a set of
                  repositories you can open. What follows is what is actually in
                  them.
                </Annotation>
              </Emerge>
            </div>

            <div className="col-span-12 space-y-10 lg:col-span-7 lg:col-start-5">
              {passages.map((p) => (
                <Emerge key={p.heading}>
                  <h3 className="t-mark text-signal">{p.heading}</h3>
                  <p className="t-read mt-3 text-pretty text-ink-2">{p.body}</p>
                </Emerge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── the finding, at the scale it earns ─────────────────────────── */}
      <div className="mt-24 md:mt-36">
        <DrawRule className="block h-px w-full bg-rule" />
        <div className="rail px-[clamp(1.25rem,4vw,4rem)] py-16 md:py-24 xl:pr-[clamp(9rem,12vw,14rem)]">
          <blockquote className="grid-12 lane">
            <div className="col-span-12 lg:col-span-9 lg:col-start-4">
              <p className="t-statement text-pretty text-ink-2">
                &ldquo;Every approximate unlearning objective tested here{" "}
                <span className="text-ink">suppresses</span> the deleted
                knowledge rather than <span className="text-ink">erasing</span>{" "}
                it. That is invisible to a training loss curve, but immediately
                visible once the model is asked the right question.&rdquo;
              </p>
              <footer className="t-note mt-7">
                Beyond the Loss Curve, central finding
              </footer>
            </div>
          </blockquote>
        </div>
        <DrawRule className="block h-px w-full bg-rule" />
      </div>

      {/* ── how the system is put together ─────────────────────────────── */}
      <div className="rail mt-20 px-[clamp(1.25rem,4vw,4rem)] md:mt-28 xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane grid gap-x-10 gap-y-10 md:grid-cols-3">
          {principles.map((p, i) => (
            <Emerge key={p.n} delay={i * 0.05} as="article">
              <div className="flex items-center gap-3">
                <span className="t-mark text-signal tabular-nums">{p.n}</span>
                <span className="h-px flex-1 bg-rule" aria-hidden="true" />
              </div>
              <h3 className="t-title mt-5 text-ink">{p.title}</h3>
              <p className="t-read-sm mt-3 text-pretty text-ink-3">{p.body}</p>
            </Emerge>
          ))}
        </div>
      </div>

      {/* ── the subsystem index ────────────────────────────────────────
             The same six modules the machine carries, written out. Pointing at
             a row lights the module it names, which is how the annotations
             become navigable rather than ornamental — and how the layer works
             at all on a screen too narrow for callouts. */}
      <div className="rail mt-20 px-[clamp(1.25rem,4vw,4rem)] md:mt-28 xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane">
          <div className="flex items-center gap-4">
            <span className="t-mark text-ink-4">Subsystems</span>
            <span className="h-px flex-1 bg-rule" aria-hidden="true" />
            <span className="t-note">{SUBSYSTEMS.length} modules</span>
          </div>

          <ul className="mt-8" onMouseLeave={() => setHover(null)}>
            {SUBSYSTEMS.map((s) => (
              <li key={s.key} className="border-t border-rule last:border-b">
                <div
                  onMouseEnter={() => setHover(s.key)}
                  onFocus={() => setHover(s.key)}
                  onBlur={() => setHover(null)}
                  tabIndex={0}
                  className="grid-12 gap-y-1.5 py-4 outline-none transition-colors duration-400 hover:text-ink focus-visible:text-ink"
                >
                  <span className="t-mark col-span-12 self-center text-ink md:col-span-3">
                    {s.title}
                  </span>
                  <span className="t-note col-span-12 md:col-span-4">
                    {s.lines[0]}
                  </span>
                  <span className="t-note col-span-12 md:col-span-5 md:text-right">
                    {s.lines[1]}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── the record ─────────────────────────────────────────────────── */}
      <div className="rail mt-20 px-[clamp(1.25rem,4vw,4rem)] md:mt-28 xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane">
          <dl>
            {record.map(([k, v]) => (
              <div
                key={k}
                className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 border-t border-rule py-4 last:border-b"
              >
                <dt className="t-mark text-ink-4">{k}</dt>
                <dd className="t-meta text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="t-note mt-5">Based in {profile.location}.</p>
        </div>
      </div>
    </section>
  );
}

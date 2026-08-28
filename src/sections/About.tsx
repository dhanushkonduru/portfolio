"use client";

import { profile } from "@/data/profile";
import { STAGES } from "@/system/stages";
import { Annotation, StageMark } from "@/components/Kit";
import { DrawRule, Enter, MaskLines } from "@/components/Motion";

const S = STAGES[1];

/** Positions he already takes in his own repositories, quoted back as stance. */
const principles = [
  {
    n: "i",
    title: "Measured, not asserted",
    body: "A growth forecast gets hindcast against an epoch withheld from its calibration. A siting model runs with and without the criterion under test. A retrieval change is kept only if the eval set moves.",
  },
  {
    n: "ii",
    title: "Code orchestrates, models judge",
    body: "Agent systems are pipelines of typed stages, not one long prompt. Deterministic code decides what runs next; every stage returns a validated object or raises.",
  },
  {
    n: "iii",
    title: "State the constraint",
    body: "MetaTrader 5 gives application developers no API keys, so the architecture doc says so and the design works around it. A status table that admits which phases are only verified against a mock is worth more than one that implies otherwise.",
  },
];

const record: [string, string][] = [
  ["Education", "Integrated M.Tech, Software Engineering"],
  ["Institution", "VIT Vellore, expected 2027"],
  ["Internships", "CEEC Global · Centific · Aapoon"],
  ["Filings", "Two invention disclosures, first-named"],
];

export function About() {
  return (
    <section id="about" className="relative scroll-mt-24 py-32 md:py-48">
      <div className="frame rail">
        <StageMark index={S.index} label={S.label} state={S.state} tone="mint" />

        {/* Opening argument — pushed right, leaving the left margin open. */}
        <div className="grid-12 mt-16 md:mt-24">
          <h2 className="t-statement col-span-12 text-balance text-ink md:col-span-9 md:col-start-3">
            <MaskLines
              lines={["I build the backend, the", "agents that run on it,"]}
            />
            <span className="mt-1 block italic text-mint">
              and the proof that both work.
            </span>
          </h2>
        </div>

        {/* Body offset right; annotations hang in the left margin. */}
        <div className="grid-12 mt-20 gap-y-14 md:mt-28">
          <div className="col-span-12 md:col-span-3 md:col-start-1">
            <Enter>
              <Annotation className="md:sticky md:top-32">
                Three internships, two patent filings, and a set of
                repositories you can open. What follows is what is actually in
                them.
              </Annotation>
            </Enter>
          </div>

          <div className="col-span-12 space-y-12 md:col-span-7 md:col-start-5">
            <Passage
              heading="Backends, in production"
              body="At CEEC I built the multi-tenant backend for Tabzy, a cloud ERP/POS product, using custom Django middleware and RBAC so no company can read another company's records. Billing, inventory and orders all run in production. I shipped the API key system end to end, and was the sole backend engineer on BlogSpeed, containerising the service and deploying it to GCP through Cloud Build and Cloud Run."
            />
            <Passage
              heading="LLM and agent systems"
              body="A RAG pipeline over SEC filings that pairs BM25 with dense retrieval, reranks with a cross-encoder, and hands back the chunk IDs behind every answer. A five-agent LangGraph system sharing one typed Pydantic state graph, checkpointed so a run that fails halfway resumes instead of starting over. And req2test, where deterministic code orchestrates the run and the model only exercises judgement inside a typed stage."
            />
            <Passage
              heading="Models, measured properly"
              body="At Centific I benchmarked five models across several NLP tasks through an automated harness, then fine-tuned Phi-3 and DeepSeek with LoRA. On my own work I trained an XGBoost cross-sectional return predictor on S&P 500 names and validated it with expanding-window walk-forward splits, because random k-fold quietly leaks the future into training whenever the data is an ordered time series. The same instinct drives the geospatial work: a Random Forest built-up classifier checked against four independent reference products rather than its own accuracy score."
            />
            <Passage
              heading="Applied research"
              body="Machine unlearning verification. Deleting a record from a database does not delete what a model learned from it, and the standard evidence, a rising loss curve on the deleted rows, turns out to prove almost nothing. Interrogate the model behaviourally, attack your own verdict, gate deployment on the result. Two invention disclosures came out of closing that gap."
            />
            <Passage
              heading="Where I'm heading"
              body="Toward AI platform and applied-research engineering. Teams building retrieval, agents and model infrastructure where the output has to be auditable, because a regulator, a clinician or a portfolio manager is downstream of it."
            />
          </div>
        </div>
      </div>

      {/* ── the finding, given the scale it earns ── */}
      <div className="mt-32 md:mt-48">
        <DrawRule className="block h-px w-full bg-rule" />
        <div className="frame rail py-20 md:py-28">
          <div className="grid-12">
            <blockquote className="col-span-12 md:col-span-10 md:col-start-2">
              <p className="t-statement text-balance text-ink-2">
                “Every approximate unlearning objective tested here{" "}
                <span className="text-ink">suppresses</span> the deleted
                knowledge rather than <span className="text-ink">erasing</span>{" "}
                it. That is invisible to a training loss curve, but immediately
                visible once the model is asked the right question.”
              </p>
              <footer className="t-note mt-8">
                Beyond the Loss Curve, central finding
              </footer>
            </blockquote>
          </div>
        </div>
        <DrawRule className="block h-px w-full bg-rule" />
      </div>

      {/* ── principles: hanging numerals, ruled, no containers ── */}
      <div className="frame rail mt-20 md:mt-28">
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-3">
          {principles.map((p, i) => (
            <Enter key={p.n} delay={i * 0.06} as="article">
              <div className="flex items-baseline gap-3">
                <span className="t-note text-mint">{p.n}</span>
                <span className="h-px flex-1 bg-rule" aria-hidden="true" />
              </div>
              <h3 className="t-title mt-5 text-ink">{p.title}</h3>
              <p className="t-read-sm mt-3 text-pretty text-ink-3">{p.body}</p>
            </Enter>
          ))}
        </div>
      </div>

      {/* ── the record: a bare ruled list, not a panel ── */}
      <div className="frame rail mt-24 md:mt-32">
        <dl className="grid-12 gap-y-0">
          {record.map(([k, v]) => (
            <div
              key={k}
              className="col-span-12 flex flex-wrap items-baseline justify-between gap-x-8 gap-y-1 border-t border-rule py-4"
            >
              <dt className="t-mark text-ink-4">{k}</dt>
              <dd className="t-meta text-ink-2">{v}</dd>
            </div>
          ))}
          <div className="col-span-12 border-t border-rule" />
        </dl>
        <p className="t-note mt-6">Based in {profile.location}.</p>
      </div>
    </section>
  );
}

function Passage({ heading, body }: { heading: string; body: string }) {
  return (
    <Enter>
      <h3 className="t-mark text-mint">{heading}</h3>
      <p className="t-read mt-4 text-pretty text-ink-2">{body}</p>
    </Enter>
  );
}

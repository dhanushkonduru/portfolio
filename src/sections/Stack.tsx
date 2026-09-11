"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { skillGroups } from "@/data/skills";
import { STAGES, type ModuleKey } from "@/core/stages";
import { setHover } from "@/core/store";
import { SectionHead } from "@/components/Kit";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const S = STAGES[2];
const EASE = [0.16, 1, 0.3, 1] as const;

/* ============================================================================
 * STACK
 *
 * Not a logo wall. Each domain is bound to the subsystem of the engine that
 * actually does that work, so opening a row lights the corresponding hardware
 * and its callout. The 3D is not illustrating the section; it is the other
 * half of it.
 * ========================================================================= */

const BOUND: Record<string, ModuleKey> = {
  llm: "compute",
  ml: "compute",
  backend: "data",
  languages: "compute",
  data: "data",
  mlops: "cooling",
  cloud: "ring",
};

const MODULE_LABEL: Record<ModuleKey, string> = {
  compute: "Compute core",
  sensor: "Sensor array",
  data: "Data pipelines",
  io: "I/O interface",
  cooling: "Cooling system",
  ring: "Stabilization ring",
};

export function Stack() {
  const [active, setActive] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const focus = (i: number | null) => {
    setActive(i);
    setHover(i === null ? null : (BOUND[skillGroups[i].id] ?? null));
  };

  return (
    <section
      id="stack"
      className="stratum relative scroll-mt-28 py-28 md:py-40"
    >
      <div className="rail px-[clamp(1.25rem,4vw,4rem)] xl:pr-[clamp(9rem,12vw,14rem)]">
        <div className="lane">
          <SectionHead index={S.index} label={S.label} state={S.state} />

          <div className="grid-12 mt-14 items-end gap-y-8 md:mt-20">
            <div className="col-span-12 lg:col-span-5">
              <p className="t-figure text-ink">
                {skillGroups.length}
                <span className="ml-3 text-rule-3">/</span>
                <span className="ml-3 text-ink-4">06</span>
              </p>
              <p className="t-mark mt-4 text-ink-4">
                Domains mapped to modules
              </p>
            </div>

            <p className="t-read col-span-12 max-w-[46ch] text-pretty text-ink-2 lg:col-span-5 lg:col-start-8">
              Every domain below is wired to the part of the assembly that runs
              it. Open one and its module lifts out of the machine. None of this
              is aspirational — all of it appears in work you can open.
            </p>
          </div>
        </div>
      </div>

      {/* Full-bleed index: the rules run edge to edge, the type does not. */}
      <div className="mt-16 md:mt-24" onMouseLeave={() => focus(null)}>
        {skillGroups.map((g, i) => {
          const on = active === i;
          const dim = active !== null && !on;
          const bound = BOUND[g.id];

          return (
            <div key={g.id} className="border-t border-rule last:border-b">
              <button
                type="button"
                aria-expanded={on}
                data-cursor="expand"
                onMouseEnter={() => focus(i)}
                onFocus={() => focus(i)}
                onClick={() => focus(on ? null : i)}
                className={cn(
                  "rail flex w-full items-center gap-5 px-[clamp(1.25rem,4vw,4rem)] text-left transition-opacity duration-500 xl:pr-[clamp(9rem,12vw,14rem)]",
                  dim ? "opacity-30" : "opacity-100",
                )}
              >
                <span className="lane flex w-full items-center gap-5 py-6 md:py-8">
                  <span
                    className={cn(
                      "t-note w-8 shrink-0 tabular-nums transition-colors duration-300",
                      on ? "text-signal" : "",
                    )}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <span
                    className={cn(
                      "t-title flex-1 transition-colors duration-300",
                      on ? "text-signal" : "text-ink",
                    )}
                  >
                    {g.name}
                  </span>

                  <span className="t-note hidden shrink-0 text-right md:block">
                    {MODULE_LABEL[bound]}
                  </span>

                  <span
                    aria-hidden="true"
                    className={cn(
                      "ml-6 hidden h-px shrink-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] sm:block",
                      on ? "w-10 bg-signal" : "w-5 bg-rule-3",
                    )}
                  />

                  <span className="t-note w-7 shrink-0 text-right tabular-nums">
                    {String(g.items.length).padStart(2, "0")}
                  </span>
                </span>
              </button>

              <AnimatePresence initial={false}>
                {on ? (
                  <motion.div
                    initial={reduced ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduced ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="rail px-[clamp(1.25rem,4vw,4rem)] pb-9 xl:pr-[clamp(9rem,12vw,14rem)]">
                      <div className="lane grid-12">
                        <p className="t-read-sm col-span-12 max-w-[52ch] text-pretty text-ink-3 md:col-span-5 md:col-start-2">
                          {g.context}
                        </p>
                        {/* Technologies as running text, not as tags. */}
                        <p className="t-meta col-span-12 mt-5 text-ink-2 md:col-span-5 md:col-start-8 md:mt-0">
                          {g.items.map((item, k) => (
                            <span key={item}>
                              {item}
                              {k < g.items.length - 1 ? (
                                <span className="text-rule-3"> · </span>
                              ) : null}
                            </span>
                          ))}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}

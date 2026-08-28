"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { skillGroups } from "@/data/skills";
import { STAGES } from "@/system/stages";
import { setFocus } from "@/system/stageStore";
import { StageMark } from "@/components/Kit";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { cn } from "@/lib/utils";

const S = STAGES[2];
const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * No proficiency bars, no chips, no panel. An index of domains — and pointing
 * at one pulls its cluster out of the field behind. The 3D is not illustrating
 * the section; it is the section's other half.
 */
export function Stack() {
  const [active, setActive] = useState<number | null>(null);
  const reduced = useReducedMotion();

  const focus = (i: number | null) => {
    setActive(i);
    setFocus(i ?? -1);
  };

  return (
    <section id="stack" className="relative scroll-mt-24 py-32 md:py-48">
      <div className="frame rail">
        <StageMark index={S.index} label={S.label} state={S.state} tone="cyan" />

        <div className="mt-14 flex flex-wrap items-end gap-x-12 gap-y-6 md:mt-20">
          <p className="t-monument text-cyan">{skillGroups.length}</p>
          <div className="max-w-[40ch] pb-3">
            <p className="t-mark text-ink-4">Domains</p>
            <p className="t-read mt-3 text-pretty text-ink-2">
              Point at one and its cluster separates from the field behind.
              Everything listed appears in work you can open. None of it is
              aspirational.
            </p>
          </div>
        </div>
      </div>

      {/* Full-bleed index. The rules run edge to edge; the type does not. */}
      <div
        className="mt-20 md:mt-28"
        onMouseLeave={() => focus(null)}
      >
        {skillGroups.map((g, i) => {
          const isOn = active === i;
          const dim = active !== null && !isOn;

          return (
            <div key={g.id} className="border-t border-rule last:border-b">
              <button
                type="button"
                aria-expanded={isOn}
                data-cursor="expand"
                onMouseEnter={() => focus(i)}
                onFocus={() => focus(i)}
                onClick={() => focus(isOn ? null : i)}
                className={cn(
                  "frame rail group flex w-full items-baseline gap-5 py-7 text-left transition-opacity duration-500 md:py-9",
                  dim ? "opacity-35" : "opacity-100",
                )}
              >
                <span
                  className={cn(
                    "t-note w-8 shrink-0 tabular-nums transition-colors duration-300",
                    isOn ? "text-cyan" : "",
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <span
                  className={cn(
                    "t-title flex-1 transition-colors duration-300",
                    isOn ? "text-cyan" : "text-ink",
                  )}
                >
                  {g.name}
                </span>

                <span className="t-note hidden shrink-0 sm:block">
                  {String(g.items.length).padStart(2, "0")}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOn ? (
                  <motion.div
                    initial={reduced ? false : { height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={reduced ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.55, ease: EASE }}
                    className="overflow-hidden"
                  >
                    <div className="frame rail grid-12 pb-10 md:pb-12">
                      <p className="t-read-sm col-span-12 max-w-[52ch] text-pretty text-ink-3 md:col-span-5 md:col-start-2">
                        {g.context}
                      </p>
                      {/* Technologies as running text, not as tags. */}
                      <p className="t-meta col-span-12 mt-6 text-ink-2 md:col-span-5 md:col-start-8 md:mt-0">
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

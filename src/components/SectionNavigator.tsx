"use client";

import { useSyncExternalStore } from "react";
import { STAGES } from "@/core/stages";
import {
  getActiveIndex,
  getActiveIndexServer,
  subscribeStage,
} from "@/core/store";
import { cn } from "@/lib/utils";

/* ============================================================================
 * SECTION NAVIGATOR
 *
 * The register down the right edge: index, title, and what the machine is
 * doing there. It is a table of contents, not a hover easter egg — every label
 * stays legible, and the active row takes a rule and the accent.
 *
 * Clicking a row hands off to the inertial smoother, which animates the
 * anchor itself. Nothing here jumps.
 * ========================================================================= */

export function SectionNavigator() {
  const active = useSyncExternalStore(
    subscribeStage,
    getActiveIndex,
    getActiveIndexServer,
  );

  return (
    <>
      <nav
        aria-label="Sections"
        className="pointer-events-none fixed right-[clamp(1.25rem,3vw,3rem)] top-1/2 z-40 hidden -translate-y-1/2 xl:block"
      >
        <ul className="flex flex-col items-end gap-5">
          {STAGES.map((s, i) => {
            const on = active === i;
            return (
              <li key={s.id} className="pointer-events-auto">
                <a
                  href={`#${s.id}`}
                  aria-current={on ? "true" : undefined}
                  className="group flex items-start justify-end gap-3.5 text-right"
                >
                  <div className="max-w-[9.5rem]">
                    <span
                      className={cn(
                        "t-mark block transition-colors duration-500",
                        on ? "text-ink" : "text-ink-4 group-hover:text-ink-2",
                      )}
                    >
                      {s.label}
                    </span>
                    <span
                      className={cn(
                        "t-note block leading-tight transition-all duration-500",
                        on
                          ? "max-h-6 opacity-100"
                          : "max-h-6 opacity-0 group-hover:opacity-70",
                      )}
                    >
                      {s.blurb}
                    </span>
                  </div>

                  <span
                    aria-hidden="true"
                    className={cn(
                      "mt-1.5 block h-px shrink-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                      on
                        ? "w-9 bg-signal"
                        : "w-3.5 bg-rule-3 group-hover:w-6 group-hover:bg-ink-4",
                    )}
                  />

                  <span
                    className={cn(
                      "t-note w-5 shrink-0 tabular-nums transition-colors duration-500",
                      on ? "text-signal" : "text-ink-4",
                    )}
                  >
                    {s.index}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Below lg the register folds into one readout at the foot of the
          screen. Same information, one line, and it never covers the type. */}
      <div
        data-hud
        aria-hidden="true"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-rule bg-void/85 px-[clamp(1.25rem,4vw,4rem)] py-2.5 backdrop-blur-[6px] xl:hidden"
      >
        <span className="t-note text-signal tabular-nums">
          {STAGES[active]?.index ?? "01"}
        </span>
        <span className="t-mark text-ink">{STAGES[active]?.label}</span>
        <span className="h-px flex-1 bg-rule-2" />
        <span className="t-note">{STAGES[active]?.blurb}</span>
      </div>
    </>
  );
}

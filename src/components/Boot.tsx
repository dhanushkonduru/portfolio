"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ============================================================================
 * BOOT
 *
 * Initialisation, not a loading screen.
 *
 * It waits on things that are actually happening — the fonts resolving, the
 * WebGL context coming up — rather than animating a fake percentage, and it is
 * capped hard so it can never become a gate. The page content is in the DOM
 * the whole time; this is an overlay on top of a page that has already
 * rendered, so it costs nothing at crawl time and nothing to a reader who
 * arrives after it has gone.
 *
 * Under reduced motion it never renders at all.
 *
 * The fade out is a CSS transition rather than an animated unmount. A tab that
 * has been backgrounded during load gets its rAF budget cut to a frame a
 * second, and a JS-driven exit animation would leave the page behind an opaque
 * overlay for half a minute. A compositor transition plus a timeout cannot.
 * ========================================================================= */

const CAP = 900;

export function Boot() {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<"init" | "online" | "gone">("init");
  const [armed, setArmed] = useState(false);

  useEffect(() => setArmed(true), []);

  useEffect(() => {
    if (reduced) {
      setPhase("gone");
      return;
    }
    let cancelled = false;
    const timers: number[] = [];

    const finish = () => {
      if (cancelled) return;
      setPhase("online");
      /* Long enough for the fade to finish, short enough that a slow frame
         budget cannot hold the page hostage. */
      timers.push(window.setTimeout(() => !cancelled && setPhase("gone"), 620));
    };

    const ready = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>((res) => {
        if (document.querySelector("canvas")) return res();
        const obs = new MutationObserver(() => {
          if (document.querySelector("canvas")) {
            obs.disconnect();
            res();
          }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        timers.push(
          window.setTimeout(() => {
            obs.disconnect();
            res();
          }, CAP),
        );
      }),
    ]);

    ready.then(finish);
    timers.push(window.setTimeout(finish, CAP));

    return () => {
      cancelled = true;
      for (const t of timers) clearTimeout(t);
    };
  }, [reduced]);

  if (reduced || !armed || phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[95] flex items-center justify-center bg-void transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        phase === "online" ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden="true"
    >
      <div className="flex w-[min(26rem,76vw)] flex-col items-center">
        <p className="t-mark text-ink">System Core</p>

        <div className="mt-5 h-px w-full bg-rule">
          <span
            className={`block h-full origin-left bg-signal transition-transform duration-700 ease-[cubic-bezier(0.22,0.61,0.36,1)] ${
              phase === "online" ? "scale-x-100" : "scale-x-[0.72]"
            }`}
          />
        </div>

        <p className="t-note mt-4 tabular-nums">
          {phase === "online" ? "SYSTEM ONLINE" : "INITIALISING…"}
        </p>
      </div>
    </div>
  );
}

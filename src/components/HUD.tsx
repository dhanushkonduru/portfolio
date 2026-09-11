"use client";

import { useEffect, useRef } from "react";
import { profile } from "@/data/profile";
import { STAGES } from "@/core/stages";
import { pulse, readings } from "@/core/store";

/* ============================================================================
 * HUD
 *
 * System metadata around the edges of the bay, and nothing else. Every field
 * is a real property of the running page — the stage index is the scroll
 * position, the frame rate is the measured frame rate — so the chrome is
 * honest rather than ornamental.
 *
 * Written by one rAF straight to the DOM, and deliberately sparse: four short
 * readings, hung in the corners, at the opacity of a serial number.
 * ========================================================================= */

export function HUD() {
  const index = useRef<HTMLSpanElement>(null);
  const state = useRef<HTMLSpanElement>(null);
  const rate = useRef<HTMLSpanElement>(null);
  const scale = useRef<HTMLDivElement>(null);
  const cue = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf = 0;
    let live = true;

    const frame = () => {
      raf = 0;
      if (!live) return;
      raf = requestAnimationFrame(frame);

      const i = Math.min(STAGES.length - 1, Math.round(pulse.p));
      if (index.current) {
        const next = `${STAGES[i].index} / 07`;
        if (index.current.textContent !== next)
          index.current.textContent = next;
      }
      if (state.current) {
        const next = STAGES[i].state.toUpperCase();
        if (state.current.textContent !== next)
          state.current.textContent = next;
      }
      if (rate.current && readings.fps) {
        const next = `${readings.fps} FPS`;
        if (rate.current.textContent !== next) rate.current.textContent = next;
      }
      if (scale.current) {
        scale.current.style.transform = `scaleY(${pulse.progress})`;
      }
      /* The invitation is only an invitation until it has been accepted. */
      if (cue.current) {
        cue.current.style.opacity = String(
          Math.max(0, 1 - Math.min(1, pulse.p / 0.45)),
        );
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      live = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      data-hud
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 hidden xl:block"
    >
      {/* corner registration */}
      {[
        "left-5 top-5 border-l border-t",
        "right-5 top-5 border-r border-t",
        "left-5 bottom-5 border-l border-b",
        "right-5 bottom-5 border-r border-b",
      ].map((c) => (
        <span
          key={c}
          className={`absolute h-3.5 w-3.5 border-rule-3/50 ${c}`}
        />
      ))}

      {/* left gutter: a graduated rule that fills as the page is traversed */}
      <div className="absolute bottom-24 left-5 top-24 w-px bg-rule">
        <div
          ref={scale}
          className="h-full w-full origin-top bg-signal/45"
          style={{ transform: "scaleY(0)" }}
        />
      </div>

      {/* bottom left: what the machine is doing */}
      <div className="absolute bottom-7 left-11 flex items-center gap-3">
        <span className="block h-1 w-1 rounded-full bg-signal animate-pulse-soft" />
        <span className="t-note text-ink-3">System status</span>
        <span ref={state} className="t-note text-ink-2">
          SYSTEM ONLINE
        </span>
      </div>

      {/* bottom centre: the invitation, while it is still one */}
      <div
        ref={cue}
        className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-3 transition-opacity duration-300"
      >
        <span className="t-mark text-ink-4">Scroll to explore</span>
        <span className="h-px w-10 bg-rule-2" />
        <span className="block h-3 w-px bg-signal/50 motion-safe:animate-[scan-y_2.4s_cubic-bezier(0.76,0,0.24,1)_infinite]" />
      </div>

      {/* bottom right: where and how fast */}
      <div className="absolute bottom-7 right-11 flex items-center gap-5">
        <span className="t-note">
          {profile.location.split(",").pop()?.trim()}
        </span>
        <span className="h-px w-5 bg-rule-2" />
        <span ref={rate} className="t-note tabular-nums">
          REAL-TIME
        </span>
        <span className="h-px w-5 bg-rule-2" />
        <span ref={index} className="t-note text-ink-2 tabular-nums">
          01 / 07
        </span>
      </div>
    </div>
  );
}

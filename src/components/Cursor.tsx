"use client";

import { useEffect, useRef, useState } from "react";
import { getHover } from "@/core/store";
import { SUBSYSTEM_BY_KEY } from "@/core/stages";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ============================================================================
 * POINTER
 *
 * The system cursor stays — hiding it costs more usability than it buys. What
 * is added is a small dot that trails it, opening into a ring over anything
 * interactive and into a technical reticle over a part of the machine.
 *
 * Three states, no bigger than they need to be. An oversized animated circle
 * chasing the cursor is the single most recognisable tell in a template.
 * ========================================================================= */

export function Pointer() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const tag = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
  }, [reduced]);

  useEffect(() => {
    if (!enabled) return;
    const d = dot.current;
    const r = ring.current;
    const t = tag.current;
    if (!d || !r || !t) return;

    let tx = window.innerWidth / 2;
    let ty = window.innerHeight / 2;
    let x = tx;
    let y = ty;
    let size = 0;
    let want = 0;
    let mode = "";
    let raf = 0;
    let running = false;

    const tick = () => {
      raf = 0;
      /* Two speeds: the dot is the cursor, the ring has weight behind it. */
      x += (tx - x) * 0.32;
      y += (ty - y) * 0.32;
      size += (want - size) * 0.18;

      d.style.transform = `translate3d(${tx - 2.5}px, ${ty - 2.5}px, 0)`;
      r.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${
        0.2 + size
      })`;
      r.style.opacity = String(Math.min(1, size * 1.6));

      const settled =
        Math.abs(tx - x) < 0.2 &&
        Math.abs(ty - y) < 0.2 &&
        Math.abs(want - size) < 0.004;
      if (settled) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    const wake = () => {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(tick);
    };

    const apply = (next: string, label: string) => {
      if (next === mode) return;
      mode = next;
      want = next === "part" ? 1.3 : next ? 1 : 0;
      r.dataset.mode = next;
      t.textContent = label;
      t.style.opacity = label ? "1" : "0";
    };

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;

      const part = getHover();
      if (part) {
        apply("part", SUBSYSTEM_BY_KEY[part].title.toUpperCase());
      } else {
        const node = (e.target as Element | null)?.closest?.(
          "[data-cursor], a[href], button",
        );
        apply(node ? "link" : "", "");
      }
      wake();
    };

    /* The machine can move a part under a stationary cursor, so the reticle
       has to be able to open without the pointer moving. */
    let poll = 0;
    const watch = () => {
      poll = window.setTimeout(watch, 120);
      const part = getHover();
      if (part) apply("part", SUBSYSTEM_BY_KEY[part].title.toUpperCase());
      else if (mode === "part") apply("", "");
      wake();
    };
    watch();

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      clearTimeout(poll);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[90]"
    >
      <div
        ref={dot}
        className="absolute left-0 top-0 h-[5px] w-[5px] rounded-full bg-signal will-change-transform"
      />
      <div
        ref={ring}
        data-mode=""
        className="group absolute left-0 top-0 flex h-8 w-8 items-center justify-center border border-signal/60 opacity-0 will-change-transform data-[mode=link]:rounded-full data-[mode=part]:border-signal"
      >
        <span
          ref={tag}
          className="t-mark absolute left-[130%] whitespace-nowrap text-[0.5rem] text-signal opacity-0 transition-opacity duration-200"
        />
      </div>
    </div>
  );
}

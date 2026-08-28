"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ============================================================================
 * POINTER
 *
 * The system cursor stays — hiding it costs more usability than it buys. What
 * is added is a reticle that reports what the pointer is over, using the same
 * monospace voice as the rest of the instrument.
 *
 * Elements opt in with data-cursor="link" | "open" | "expand".
 * ========================================================================= */

const LABELS: Record<string, string> = {
  open: "OPEN",
  expand: "MORE",
  link: "",
};

export function Pointer() {
  const ring = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLSpanElement>(null);
  const [enabled, setEnabled] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    setEnabled(true);
  }, [reduced]);

  useEffect(() => {
    if (!enabled) return;
    const el = ring.current;
    const label = text.current;
    if (!el || !label) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let tx = x;
    let ty = y;
    let scale = 1;
    let target = 1;
    let raf = 0;
    let running = false;
    let mode = "";

    const draw = () => {
      el.style.transform = `translate3d(${x - 5}px, ${y - 5}px, 0) scale(${scale})`;
    };

    const tick = () => {
      x += (tx - x) * 0.2;
      y += (ty - y) * 0.2;
      scale += (target - scale) * 0.16;
      draw();

      if (
        Math.abs(tx - x) < 0.1 &&
        Math.abs(ty - y) < 0.1 &&
        Math.abs(target - scale) < 0.004
      ) {
        x = tx;
        y = ty;
        scale = target;
        draw();
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

    const onMove = (e: MouseEvent) => {
      tx = e.clientX;
      ty = e.clientY;

      const node = (e.target as Element | null)?.closest?.(
        "[data-cursor], a[href], button",
      );
      const next = node?.getAttribute?.("data-cursor") ?? (node ? "link" : "");

      if (next !== mode) {
        mode = next;
        target = next ? (LABELS[next] ? 3.4 : 2.6) : 1;
        label.textContent = LABELS[next] ?? "";
        label.style.opacity = LABELS[next] ? "1" : "0";
      }
      wake();
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div
      ref={ring}
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[90] flex h-2.5 w-2.5 items-center justify-center rounded-full border border-mint/80 will-change-transform"
    >
      <span
        ref={text}
        className="pointer-events-none select-none font-mono text-[3px] font-medium tracking-[0.12em] text-mint opacity-0 transition-opacity duration-200"
      />
    </div>
  );
}

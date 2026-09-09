"use client";

import { useEffect, useRef, useState } from "react";
import { readings, setInspect } from "@/system/stageStore";
import { enableSignal, disableSignal, signal } from "@/system/audio";

/* ============================================================================
 * READOUT
 *
 * The apparatus' own instrument panel. Every figure is read from the running
 * system — node and link counts are the real buffer contents, load is the
 * exact alpha the material is using, state is the stage the diagram is in.
 * Nothing here is a decorative number.
 *
 * Values are written straight to the DOM on an interval rather than through
 * React state: this updates several times a second beside a very tall page.
 * ========================================================================= */

function Row({ label, id }: { label: string; id: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6">
      <span className="text-ink-4">{label}</span>
      <span data-readout={id} className="text-ink-2 tabular-nums">
        —
      </span>
    </div>
  );
}

export function Readout() {
  const box = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState(false);
  const [inspecting, setInspecting] = useState(false);

  /* The hero is a cover page and carries no instrumentation. The panel fades
     in once the reader is inside the document. */
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > window.innerHeight * 0.75);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const find = (k: string) => el.querySelector<HTMLElement>(`[data-readout="${k}"]`);
    const nodes = find("nodes"), links = find("links"), state = find("state");
    const load = find("load"), sig = find("signal"), segs = find("segments");
    const pad = (n: number, w = 3) => String(Math.round(n)).padStart(w, "0");

    const id = window.setInterval(() => {
      if (nodes) nodes.textContent = pad(readings.nodes);
      if (links) links.textContent = pad(readings.links);
      if (segs) segs.textContent = `${pad(readings.segments)}%`;
      if (state) state.textContent = `${pad(readings.state + 1, 2)} ${readings.config}`;
      if (load) load.textContent = readings.load.toFixed(2);
      if (sig) sig.textContent = signal.live ? `${pad(readings.signal * 100)}%` : "OFF";
    }, 140);
    return () => window.clearInterval(id);
  }, []);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    if (live) {
      disableSignal();
      setLive(false);
    } else {
      const ok = await enableSignal();
      setLive(ok);
    }
    setBusy(false);
  }

  useEffect(() => () => {
    disableSignal();
    setInspect(false);
  }, []);

  return (
    <div
      ref={box}
      className={`t-note pointer-events-none fixed bottom-6 left-[clamp(1.25rem,4.5vw,4.5rem)] z-20 hidden w-[11.5rem] border border-rule bg-void/92 p-2.5 backdrop-blur-sm transition-opacity duration-700 lg:block ${
        shown ? "opacity-100" : "opacity-0"
      }`}
      aria-hidden={!shown}
    >
      <div className="flex flex-col gap-[3px] text-[0.7rem] leading-relaxed">
        {/* Only the readings that actually move. A static component count and
            an internal ink value were costing three lines of the reader's
            page for nothing. */}
        <Row label="CONFIG" id="state" />
        <Row label="SHELL" id="segments" />
        <Row label="PATHS" id="links" />
      </div>

      {/* Two controls, both opt-in. Inspection opens the machine for
          examination; the microphone is requested here and nowhere else. */}
      <button
        type="button"
        onClick={() => {
          const next = !inspecting;
          setInspecting(next);
          setInspect(next);
        }}
        aria-pressed={inspecting}
        className="pointer-events-auto mt-3 flex w-full items-center justify-between gap-4 border border-rule px-2.5 py-1.5 text-[0.7rem] text-ink-3 transition-colors hover:border-rule-3 hover:text-ink"
      >
        <span>INSPECT</span>
        <span className={inspecting ? "text-mint" : "text-ink-4"}>
          {inspecting ? "● OPEN" : "OFF"}
        </span>
      </button>

      <button
        type="button"
        onClick={toggle}
        aria-pressed={live}
        className="pointer-events-auto mt-1.5 flex w-full items-center justify-between gap-4 border border-rule px-2.5 py-1.5 text-[0.7rem] text-ink-3 transition-colors hover:border-rule-3 hover:text-ink"
      >
        <span>AUDIO</span>
        <span className={live ? "text-mint" : "text-ink-4"}>
          {busy ? "…" : live ? "● LIVE" : "OFF"}
        </span>
      </button>
    </div>
  );
}

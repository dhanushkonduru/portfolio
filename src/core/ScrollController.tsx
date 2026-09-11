"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { makeConfig, pulse, sampleStage, startDriver } from "./store";
import { startScroll } from "./scroll";

/* three.js is fetched only after the page is interactive, and never on the
   server. The content is readable long before the machine arrives. */
const Scene = dynamic(() => import("./Scene").then((m) => m.Scene), {
  ssr: false,
});

/**
 * The single scroll timeline everything else is hung from.
 *
 * The stage driver and the inertial scroll run regardless of whether the 3D
 * does — navigation, the section register and the HUD all read the same `p`,
 * so the page behaves identically with the machine drawn or not. The drawing
 * is additive, and is skipped where it would be a liability: no WebGL context
 * available at all.
 */
export function ScrollController() {
  const [draw, setDraw] = useState(false);

  useEffect(() => {
    const stopDriver = startDriver();
    const stopScroll = startScroll();

    let ok = false;
    try {
      const c = document.createElement("canvas");
      ok = !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch {
      ok = false;
    }
    setDraw(ok);

    return () => {
      stopDriver();
      stopScroll();
    };
  }, []);

  return (
    <>
      {draw ? <Scene /> : <Schematic />}
      <Veil />
    </>
  );
}

/**
 * The bay's dimmer, and the page's pacing control.
 *
 * Where the reading is dense the machine steps back behind a wash of the
 * ground colour; where it is the exhibit the wash lifts entirely. It sits
 * between the canvas and the content, follows the same continuous stage
 * position as everything else, and is written straight to the DOM.
 *
 * A flat dim would flatten the depth with it, so the wash is a radial one:
 * heaviest at the edges of the frame, lightest where the machine is, which
 * reads as atmosphere in the bay rather than as a panel over the art.
 */
function Veil() {
  const el = useRef<HTMLDivElement>(null);
  const flat = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cfg = makeConfig();
    let raf = 0;
    let live = true;
    let shown = 0;

    const frame = () => {
      raf = 0;
      if (!live) return;
      raf = requestAnimationFrame(frame);
      sampleStage(pulse.p, cfg);

      /* The machine crosses the frame while the camera travels between two
         views, and that is the one moment it can pass under a paragraph that
         neither view puts it near. So the bay dims further the further it is
         from a settled view, and lifts again once it arrives. */
      const frac = pulse.p - Math.floor(pulse.p);
      const travelling = 1 - Math.abs(2 * frac - 1);
      const want = Math.min(0.9, cfg.veil + travelling * 0.26);

      shown += (want - shown) * 0.1;
      if (el.current) el.current.style.opacity = shown.toFixed(3);
      /* Below lg the machine has nowhere to stand aside to — the type runs the
         full width of the screen — so a second, flat wash carries it further
         back. Presence is traded for legibility on the screens where
         legibility is scarcest. */
      if (flat.current) {
        flat.current.style.opacity = (0.16 + shown * 0.95).toFixed(3);
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      live = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div
        ref={el}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[5]"
        style={{
          opacity: 0,
          background:
            "radial-gradient(ellipse 66% 58% at 42% 48%, color-mix(in oklab, var(--color-void) 74%, transparent) 0%, color-mix(in oklab, var(--color-void) 92%, transparent) 58%, var(--color-void) 100%)",
        }}
      />
      {/* The second wash exists only below lg, where the type runs the full
          width of the screen and there is no lane for the machine to stand in.
          It is flat rather than radial: on a small screen the machine is
          behind everything, so the dim has to be even. */}
      <div
        ref={flat}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[5] bg-void xl:hidden"
        style={{ opacity: 0.16 }}
      />
    </>
  );
}

/**
 * No WebGL: the machine is drawn flat instead of not at all. Same composition,
 * same rings, same near-invisible construction lines — so the page still reads
 * as a system being inspected rather than as a bare column of text.
 */
function Schematic() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <svg
        viewBox="-200 -200 400 400"
        className="h-[min(88vh,88vw)] w-[min(88vh,88vw)] opacity-45"
        fill="none"
      >
        <g stroke="var(--color-rule-3)" strokeWidth="0.7">
          <circle r="150" />
          <circle r="118" strokeDasharray="12 7" />
          <circle r="86" />
          <circle r="54" strokeDasharray="4 5" />
          <circle r="26" stroke="var(--color-beam)" />
        </g>
        <g stroke="var(--color-rule-2)" strokeWidth="0.6">
          {Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return (
              <line
                key={i}
                x1={(Math.cos(a) * 30).toFixed(2)}
                y1={(Math.sin(a) * 30).toFixed(2)}
                x2={(Math.cos(a) * 150).toFixed(2)}
                y2={(Math.sin(a) * 150).toFixed(2)}
              />
            );
          })}
        </g>
        <g fill="var(--color-beam)" opacity="0.55">
          {Array.from({ length: 5 }, (_, i) => {
            const a = ((i + 0.5) / 5) * Math.PI * 2;
            return (
              <rect
                key={i}
                x={(Math.cos(a) * 118 - 9).toFixed(2)}
                y={(Math.sin(a) * 118 - 6).toFixed(2)}
                width="18"
                height="12"
                rx="2"
              />
            );
          })}
        </g>
      </svg>
    </div>
  );
}

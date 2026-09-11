"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { makeConfig, pulse, sampleStage, startDriver } from "./store";
import { startScroll } from "./scroll";
import { EngineSchematic } from "@/components/EngineSchematic";

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
    const stopDrag = startDrag();

    return () => {
      stopDriver();
      stopScroll();
      stopDrag();
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
 * Drag to turn the engine.
 *
 * A press that lands on the machine's footprint — and not on a link, a button
 * or a panel that scrolls itself — turns the engine by horizontal travel. The
 * renderer relaxes the turn back to rest once the pointer lets go, so the
 * machine can be looked around but never left spun. Vertical travel is left
 * alone entirely: on touch that is the scroll, and it must stay the scroll.
 */
function startDrag() {
  if (!window.matchMedia("(pointer: fine)").matches) return () => {};

  let lastX = 0;
  let pressed = false;

  const onDown = (e: PointerEvent) => {
    if (e.button !== 0) return;
    const el = e.target as Element | null;
    if (
      el?.closest?.("a, button, input, textarea, select, [data-scroll-ignore]")
    )
      return;
    const r = pulse.rect;
    if (r[2] <= r[0]) return;
    if (
      e.clientX < r[0] ||
      e.clientX > r[2] ||
      e.clientY < r[1] ||
      e.clientY > r[3]
    )
      return;
    pressed = true;
    lastX = e.clientX;
    pulse.dragging = true;
    document.body.style.userSelect = "none";
  };

  const onMove = (e: PointerEvent) => {
    if (!pressed) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    pulse.dragYaw = Math.max(-1.4, Math.min(1.4, pulse.dragYaw + dx * 0.0055));
  };

  const onUp = () => {
    if (!pressed) return;
    pressed = false;
    pulse.dragging = false;
    document.body.style.userSelect = "";
  };

  window.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  window.addEventListener("blur", onUp);

  return () => {
    window.removeEventListener("pointerdown", onDown);
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onUp);
    window.removeEventListener("blur", onUp);
    document.body.style.userSelect = "";
  };
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
      /* Below xl the engine is behind the reading rather than beside it, and
         the radial wash above is the wrong tool: it is lightest exactly where
         the machine is. There it is switched off and a flat wash carries all
         the dimming instead. Presence is traded for legibility on the screens
         where legibility is scarcest. */
      if (flat.current) {
        flat.current.style.opacity = Math.min(
          0.86,
          0.22 + shown * 1.15,
        ).toFixed(3);
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
        className="pointer-events-none fixed inset-0 z-[5] max-xl:hidden"
        style={{
          opacity: 0,
          background:
            "radial-gradient(ellipse 66% 58% at 42% 48%, color-mix(in oklab, var(--color-void) 74%, transparent) 0%, color-mix(in oklab, var(--color-void) 92%, transparent) 58%, var(--color-void) 100%)",
        }}
      />
      {/* The second wash exists only below xl, where the type runs the full
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
 * No WebGL: the engine is drawn flat instead of not at all — the same line
 * elevation the hero carries as an inset, at the size of the machine, parting
 * by the same value. The page still reads as an instrument being inspected
 * rather than as a bare column of text.
 */
function Schematic() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
      aria-hidden="true"
    >
      <EngineSchematic
        detail="fallback"
        className="h-[min(86vh,120vw)] opacity-60"
      />
    </div>
  );
}

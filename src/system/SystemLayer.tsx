"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { startStageDriver } from "./stageStore";
import { startScroll } from "./scroll";

/** three.js loads only after the page is interactive, and never on the server. */
const Machine = dynamic(() => import("./Machine").then((m) => m.Machine), {
  ssr: false,
});

/**
 * Behaviour plus the plotter.
 *
 * The stage driver and the inertial scroll run regardless; the drawing is
 * additive and is skipped entirely where it would be a liability — no WebGL,
 * or a viewer who has asked for reduced motion.
 */
export function SystemLayer() {
  const [draw, setDraw] = useState(false);

  useEffect(() => {
    const stopStage = startStageDriver();
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
      stopStage();
      stopScroll();
    };
  }, []);

  return draw ? <Machine /> : null;
}

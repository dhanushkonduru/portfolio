"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { SystemField } from "./SystemField";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * The field runs the height of the page, fixed behind every section, and is
 * the only WebGL context on the site. Sections decide how much of it comes
 * through — that is the page's pacing system.
 */
export function SystemCanvas() {
  const [count, setCount] = useState(0);
  const [visible, setVisible] = useState(true);
  const reduced = useReducedMotion();
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 900;
    const memory = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;

    // Density is art direction as much as budget: a sparse field on a small
    // screen reads as intentional, a dense one reads as noise.
    if (memory !== undefined && memory <= 2) setCount(1400);
    else if (narrow || coarse) setCount(2600);
    else setCount(6200);
  }, []);

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!count) return null;

  return (
    <div
      ref={wrap}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    >
      <Canvas
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 9.6], fov: 44 }}
        frameloop={visible ? "always" : "never"}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: false,
        }}
      >
        <SystemField count={count} reducedMotion={reduced} />
      </Canvas>
    </div>
  );
}

"use client";

import { useCallback, useRef } from "react";
import { useReducedMotion } from "./useReducedMotion";

/**
 * Magnetic pull for buttons. The element leans toward the cursor by a fraction
 * of the offset and springs back on leave. Disabled under reduced motion and
 * on coarse pointers, where there is no cursor to lean toward.
 */
export function useMagnetic<T extends HTMLElement>(strength = 0.28) {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el || reduced) return;
      if (window.matchMedia("(pointer: coarse)").matches) return;

      const rect = el.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      el.style.transform = `translate3d(${x * strength}px, ${y * strength}px, 0)`;
    },
    [reduced, strength],
  );

  const onMouseLeave = useCallback(() => {
    const el = ref.current;
    if (el) el.style.transform = "translate3d(0, 0, 0)";
  }, []);

  return { ref, onMouseMove, onMouseLeave };
}

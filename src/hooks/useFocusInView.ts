"use client";

import { useEffect, type RefObject } from "react";
import { getFocus, setFocus } from "@/core/store";
import type { ModuleKey } from "@/core/stages";

/**
 * Put a subsystem under focus while the given element crosses the middle band
 * of the viewport, and release it when the element leaves — but only if
 * nothing else has taken focus since. This is how the engine follows the
 * project being read rather than the one being pointed at.
 */
export function useFocusInView(
  ref: RefObject<HTMLElement | null>,
  key: ModuleKey | null,
) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !key || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setFocus(key);
          else if (getFocus() === key) setFocus(null);
        }
      },
      { rootMargin: "-42% 0px -42% 0px" },
    );

    io.observe(el);
    return () => {
      io.disconnect();
      if (getFocus() === key) setFocus(null);
    };
  }, [ref, key]);
}

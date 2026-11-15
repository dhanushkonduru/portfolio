"use client";

import { useEffect, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { springs } from "@/lib/motion-tokens";

/**
 * The page-wide finishing touches: a hairline that fills as the page is read,
 * and the one pointer listener that feeds every `.spot` panel its light.
 */
export function Finish() {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, springs.snappy);

  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches) return;

    let frame = 0;
    let last: PointerEvent | null = null;

    const paint = () => {
      frame = 0;
      const panel = (last?.target as Element | null)?.closest?.<HTMLElement>(
        ".spot",
      );
      if (!panel || !last) return;
      const r = panel.getBoundingClientRect();
      panel.style.setProperty("--mx", `${last.clientX - r.left}px`);
      panel.style.setProperty("--my", `${last.clientY - r.top}px`);
    };

    const onMove = (e: PointerEvent) => {
      last = e;
      if (!frame) frame = requestAnimationFrame(paint);
    };

    document.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("pointermove", onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[55] h-px origin-left bg-accent/80"
      style={{ scaleX: progress }}
      aria-hidden="true"
    />
  );
}

const clock = new Intl.DateTimeFormat("en-IN", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** His local time, so a reader in another timezone knows when to write. */
export function LocalTime() {
  const [now, setNow] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => setNow(clock.format(new Date()));
    tick();
    const id = window.setInterval(tick, 20_000);
    return () => window.clearInterval(id);
  }, []);

  /* Empty until mounted: the server's clock is not the reader's. */
  if (!now) return null;
  return (
    <span className="tabular-nums">
      {now} IST
      <span className="sr-only"> local time</span>
    </span>
  );
}

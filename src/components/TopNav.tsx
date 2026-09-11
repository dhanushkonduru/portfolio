"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "@/data/profile";
import { STAGES } from "@/core/stages";
import {
  getActiveIndex,
  getActiveIndexServer,
  pulse,
  subscribeStage,
} from "@/core/store";
import { cn } from "@/lib/utils";

/* ============================================================================
 * TOP NAV
 *
 * The interface a piece of equipment carries: identity at the left, the
 * available views across the top, one control at the right. Small type,
 * generous spacing, a single hairline. It never grows, and it never competes
 * with the machine underneath it.
 * ========================================================================= */

export function TopNav() {
  const active = useSyncExternalStore(
    subscribeStage,
    getActiveIndex,
    getActiveIndexServer,
  );
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  const head = useRef<HTMLElement>(null);

  /* Progress is written straight to the DOM. A state update per scroll frame
     on a page this tall would be indefensible. */
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      raf = 0;
      if (bar.current)
        bar.current.style.transform = `scaleX(${pulse.progress})`;
      if (head.current) {
        head.current.dataset.compact = window.scrollY > 70 ? "true" : "false";
      }
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(paint);
    };
    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <a
        href="#approach"
        className="sr-only focus:not-sr-only focus:fixed focus:left-5 focus:top-5 focus:z-[100] focus:bg-signal focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-void"
      >
        Skip to content
      </a>

      <div
        className="fixed inset-x-0 top-0 z-50 h-px bg-rule"
        aria-hidden="true"
      >
        <div
          ref={bar}
          className="h-full w-full origin-left bg-signal/70"
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      <header
        ref={head}
        data-compact="false"
        className="pointer-events-none fixed inset-x-0 top-0 z-50 pt-5 transition-[padding] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] data-[compact=true]:pt-3"
      >
        {/* The header is fixed and the page runs beneath it. The blur is
            masked rather than clipped, so it dissolves into the bay instead of
            ending in a hard bar. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-28 bg-gradient-to-b from-void via-void/80 to-transparent backdrop-blur-[6px]"
          style={{
            WebkitMaskImage:
              "linear-gradient(to bottom, black 0%, black 52%, transparent 100%)",
            maskImage:
              "linear-gradient(to bottom, black 0%, black 52%, transparent 100%)",
          }}
          aria-hidden="true"
        />

        <div className="rail flex items-start justify-between gap-8 px-[clamp(1.25rem,4vw,4rem)]">
          {/* identity */}
          <a
            href="#top"
            className="pointer-events-auto shrink-0"
            aria-label={`${profile.name}, return to the top`}
          >
            <span className="block text-[0.9375rem] font-medium uppercase tracking-[0.16em] text-ink">
              {profile.name}
            </span>
            <span className="t-mark mt-1.5 block text-ink-4">
              Engineer · Builder · Researcher
            </span>
          </a>

          {/* views */}
          <nav
            aria-label="Primary"
            className="pointer-events-auto hidden items-center gap-7 pt-1 xl:flex"
          >
            {STAGES.map((s, i) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                aria-current={active === i ? "page" : undefined}
                className={cn(
                  "t-mark relative transition-colors duration-400",
                  active === i ? "text-ink" : "text-ink-4 hover:text-ink-2",
                )}
              >
                {s.label}
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute -bottom-2 left-0 h-px bg-signal transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                    active === i ? "w-full opacity-100" : "w-0 opacity-0",
                  )}
                />
              </a>
            ))}
          </nav>

          <div className="pointer-events-auto flex shrink-0 items-center gap-6 pt-0.5">
            <a
              href="#contact"
              className="t-mark hidden text-ink transition-colors duration-300 hover:text-signal sm:inline-flex sm:items-center sm:gap-2"
            >
              Let’s build
              <span aria-hidden="true">→</span>
            </a>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open section index"
              aria-expanded={open}
              className="t-mark text-ink-2 transition-colors hover:text-ink xl:hidden"
            >
              Index
            </button>
          </div>
        </div>
      </header>

      {/* ── mobile / tablet index ─────────────────────────────────────── */}
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[70] bg-void/98 xl:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
          >
            <div
              data-scroll-ignore
              className="flex h-full flex-col overflow-y-auto overscroll-contain px-[clamp(1.25rem,4vw,4rem)] pb-10 pt-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="t-mark text-ink-4">System index</p>
                  <p className="t-note mt-1">07 views</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close section index"
                  autoFocus
                  className="t-mark text-ink-2"
                >
                  Close
                </button>
              </div>

              <ul className="mt-12 flex-1">
                {STAGES.map((s, k) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.45,
                      delay: 0.04 + k * 0.035,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className="border-b border-rule"
                  >
                    <a
                      href={`#${s.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-5 py-5"
                    >
                      <span className="t-note w-6 shrink-0 text-ink-4">
                        {s.index}
                      </span>
                      <span className="t-title text-ink">{s.label}</span>
                      <span className="t-note ml-auto text-right">
                        {s.blurb}
                      </span>
                    </a>
                  </motion.li>
                ))}
              </ul>

              <div className="mt-10 flex flex-col gap-4">
                <div className="flex flex-wrap gap-x-7 gap-y-3">
                  <a
                    href={profile.links.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-meta text-ink"
                  >
                    LinkedIn ↗
                  </a>
                  <a
                    href={profile.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-meta text-ink"
                  >
                    GitHub ↗
                  </a>
                  <a
                    href={profile.resume.href}
                    download
                    className="t-meta text-signal"
                  >
                    Résumé ↓
                  </a>
                </div>
                <a href={profile.links.email} className="t-meta text-ink">
                  {profile.email}
                </a>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

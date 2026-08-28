"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { profile } from "@/data/profile";
import { NAV_STAGES, STAGES } from "@/system/stages";
import {
  getActiveIndex,
  getActiveIndexServer,
  stage,
  subscribeStage,
} from "@/system/stageStore";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

const TONE = ["bg-mint", "bg-mint", "bg-cyan", "bg-iris", "bg-amber", "bg-cyan", "bg-mint"];
const TEXT_TONE = [
  "text-mint",
  "text-mint",
  "text-cyan",
  "text-iris",
  "text-amber",
  "text-cyan",
  "text-mint",
];

export function Nav() {
  const active = useSyncExternalStore(
    subscribeStage,
    getActiveIndex,
    getActiveIndexServer,
  );
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  /* The progress rule is written directly to the DOM — a state update per
     scroll frame on a page this tall would be indefensible. */
  useEffect(() => {
    let raf = 0;
    const paint = () => {
      raf = 0;
      if (bar.current) bar.current.style.transform = `scaleX(${stage.progress})`;
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
        href="#about"
        className="sr-only focus:not-sr-only focus:fixed focus:left-5 focus:top-5 focus:z-[100] focus:bg-mint focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-void"
      >
        Skip to content
      </a>

      {/* Scroll as a single measured rule across the top of the instrument. */}
      <div className="fixed inset-x-0 top-0 z-50 h-px bg-rule" aria-hidden="true">
        <div
          ref={bar}
          className={cn(
            "h-full w-full origin-left transition-colors duration-700",
            TONE[active] ?? "bg-mint",
          )}
          style={{ transform: "scaleX(0)" }}
        />
      </div>

      {/* Header: identity and the two profiles worth clicking. */}
      <header className="frame rail pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-6 pt-5">
        {/* The header is fixed and the page runs beneath it. Without this the
            two sets of type collide on every scroll. */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-24 bg-gradient-to-b from-void via-void/90 to-transparent"
          aria-hidden="true"
        />
        <a
          href="#top"
          className="pointer-events-auto flex items-baseline gap-3"
          aria-label={`${profile.name}, return to index`}
        >
          <span className="t-mark text-mint">{profile.initials}</span>
          <span className="text-[1.0625rem] font-medium tracking-tight text-ink">
            {profile.name}
          </span>
        </a>

        <div className="pointer-events-auto flex items-center gap-6">
          <a
            href={profile.links.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="t-note link-rule hidden text-ink-2 transition-colors hover:text-mint sm:inline-block"
          >
            LinkedIn
          </a>
          <a
            href={profile.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="t-note link-rule hidden text-ink-2 transition-colors hover:text-mint sm:inline-block"
          >
            GitHub
          </a>
          <a
            href={profile.resume.href}
            download
            className="t-note link-rule hidden text-ink-2 transition-colors hover:text-mint sm:inline-block"
          >
            Résumé ↓
          </a>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open index"
            aria-expanded={open}
            className="t-note text-ink-2 transition-colors hover:text-mint lg:hidden"
          >
            Index
          </button>
        </div>
      </header>

      {/* Desktop: a vertical register pinned to the right edge. */}
      <nav
        aria-label="Sections"
        className="pointer-events-none fixed right-[clamp(1.25rem,4.5vw,4.5rem)] top-1/2 z-50 hidden -translate-y-1/2 lg:block"
      >
        <ul className="flex flex-col items-end gap-4">
          {NAV_STAGES.map((s) => {
            const i = STAGES.indexOf(s);
            const isOn = active === i;
            return (
              <li key={s.id} className="pointer-events-auto">
                <a
                  href={`#${s.id}`}
                  aria-current={isOn ? "true" : undefined}
                  className="group flex items-center justify-end gap-3"
                >
                  <span
                    className={cn(
                      "t-note whitespace-nowrap transition-all duration-500",
                      isOn
                        ? cn("opacity-100", TEXT_TONE[i])
                        : "translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
                    )}
                  >
                    {s.label}
                  </span>
                  <span
                    className={cn(
                      "block h-px transition-all duration-500",
                      isOn
                        ? cn("w-8", TONE[i])
                        : "w-3.5 bg-rule-3 group-hover:w-6 group-hover:bg-ink-4",
                    )}
                  />
                  <span
                    className={cn(
                      "t-note w-5 text-right tabular-nums transition-colors duration-500",
                      isOn ? TEXT_TONE[i] : "text-ink-4",
                    )}
                  >
                    {s.index}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Mobile index */}
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[60] bg-void lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              data-scroll-ignore
              className="frame flex h-full flex-col overflow-y-auto overscroll-contain pb-10 pt-6"
            >
              <div className="flex items-start justify-between">
                <span className="t-mark text-ink-4">Index</span>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close index"
                  autoFocus
                  className="t-note text-ink-3"
                >
                  Close
                </button>
              </div>

              <ul className="mt-14 flex-1">
                {NAV_STAGES.map((s, k) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.05 + k * 0.04, ease: EASE }}
                    className="border-b border-rule"
                  >
                    <a
                      href={`#${s.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-5 py-6"
                    >
                      <span className="t-note text-ink-4">{s.index}</span>
                      <span className="t-title text-ink">{s.label}</span>
                      <span className="t-note ml-auto">{s.state}</span>
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
                  <a href={profile.resume.href} download className="t-meta text-mint">
                    Résumé ↓
                  </a>
                </div>
                <a href={profile.links.email} className="t-meta mt-2 text-ink">
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

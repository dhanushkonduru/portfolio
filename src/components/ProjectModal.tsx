"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { Project } from "@/data/projects";
import { ProjectVisual, hasVisual } from "./ProjectVisual";
import { useReducedMotion } from "@/hooks/useReducedMotion";

const EASE = [0.16, 1, 0.3, 1] as const;

/**
 * The full record. A sheet rather than a dialog box: ruled, monospaced at the
 * edges, and set on solid ground so the field does not compete with dense
 * reading.
 */
export function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!project) return;

    const prevOverflow = document.body.style.overflow;
    const prevFocus = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    // The fixed header and the right-edge register sit below this panel but
    // still showed through the backdrop. Take them out while it is open.
    document.documentElement.setAttribute("data-overlay", "true");
    closeBtn.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel.current) return;
      const focusable = panel.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.documentElement.removeAttribute("data-overlay");
      window.removeEventListener("keydown", onKey);
      prevFocus?.focus?.();
    };
  }, [project, onClose]);

  return (
    <AnimatePresence>
      {project ? (
        <motion.div
          className="fixed inset-0 z-[70] flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <button
            type="button"
            aria-label="Close record"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-void/95"
          />

          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="record-title"
            initial={reduced ? { opacity: 0 } : { x: "100%" }}
            animate={reduced ? { opacity: 1 } : { x: 0 }}
            exit={reduced ? { opacity: 0 } : { x: "100%" }}
            transition={{ duration: 0.6, ease: EASE }}
            className="relative flex h-full w-full flex-col border-l border-rule-2 bg-void md:max-w-2xl lg:max-w-3xl"
          >
            <div className="flex items-start justify-between gap-6 border-b border-rule px-6 py-5 md:px-10">
              <div className="min-w-0">
                <p className="t-note">{project.category}</p>
                <h2 id="record-title" className="t-title mt-2 text-balance text-ink">
                  {project.title}
                </h2>
              </div>
              <button
                ref={closeBtn}
                type="button"
                onClick={onClose}
                aria-label="Close record"
                className="t-note mt-1 shrink-0 text-ink-3 transition-colors hover:text-mint"
              >
                Close ✕
              </button>
            </div>

            <div
              data-scroll-ignore
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-10 md:px-10"
            >
              <p className="t-read text-pretty text-ink">{project.tagline}</p>

              <p className="t-note mt-5">
                {project.year}
                {project.associated ? (
                  <>
                    <span className="mx-2 text-rule-3">/</span>
                    <span className="text-amber">Linked filing</span>
                  </>
                ) : null}
              </p>

              {hasVisual(project.id) ? (
                <div className="mt-10">
                  <ProjectVisual id={project.id} />
                </div>
              ) : null}

              {project.metrics.length ? (
                <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-8">
                  {project.metrics.map((m) => (
                    <div key={m.label} className="border-t border-rule pt-4">
                      <dt className="sr-only">{m.label}</dt>
                      <dd>
                        <span className="t-figure-sm block text-mint">
                          {m.value}
                        </span>
                        <span className="t-note mt-2 block">{m.label}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              <dl className="mt-12">
                <Row label="Problem" body={project.problem} />
                <Row label="Approach" body={project.solution} />
                <Row label="Contribution" body={project.contribution} />
              </dl>

              <div className="mt-12">
                <h3 className="t-mark text-ink-4">Technical decisions</h3>
                <ul className="mt-5 space-y-4">
                  {project.technical.map((t, i) => (
                    <li key={t} className="flex gap-4">
                      <span className="t-note shrink-0 pt-0.5 text-rule-3">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="t-read-sm text-pretty text-ink-2">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="t-note mt-12 border-t border-rule pt-4">
                {project.stack.map((s, i) => (
                  <span key={s}>
                    {s}
                    {i < project.stack.length - 1 ? (
                      <span className="text-rule-3"> / </span>
                    ) : null}
                  </span>
                ))}
              </p>

              {project.note ? (
                <p className="t-note mt-8 border-l-2 border-amber/40 pl-4 text-amber">
                  {project.note}
                </p>
              ) : null}
            </div>

            {project.links.length ? (
              <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-rule px-6 py-5 md:px-10">
                {project.links.map((l) => (
                  <a
                    key={l.href}
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="t-meta link-rule text-ink transition-colors hover:text-mint"
                  >
                    {l.label} ↗
                  </a>
                ))}
              </div>
            ) : null}
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function Row({ label, body }: { label: string; body: string }) {
  return (
    <div className="grid gap-y-2 border-t border-rule py-6 md:grid-cols-[8rem_1fr] md:gap-x-8">
      <dt className="t-mark text-ink-4">{label}</dt>
      <dd className="t-read-sm text-pretty text-ink-2">{body}</dd>
    </div>
  );
}

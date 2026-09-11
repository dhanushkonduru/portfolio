"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ============================================================================
 * KIT
 *
 * Deliberately small. There is no Card, no Panel, no Chip — those are what
 * make every section look like the same section. What survives is a section
 * header, a marginal annotation, a labelled field and a text link. Sections
 * build their own compositions out of type, rules and space.
 * ========================================================================= */

/** Section header: index, title, machine state, and a rule that runs out. */
export function SectionHead({
  index,
  label,
  state,
  className,
}: {
  index: string;
  label: string;
  state?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3.5", className)}>
      <span className="t-mark text-signal tabular-nums">{index}</span>
      <span className="t-mark text-ink-2">{label}</span>
      <span className="h-px flex-1 bg-rule" aria-hidden="true" />
      {state ? <span className="t-note hidden sm:inline">{state}</span> : null}
    </div>
  );
}

/**
 * Marginalia. Hung outside the text column on wide screens, folded inline
 * below it on narrow ones — the way a printed annotation behaves.
 */
export function Annotation({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("t-note max-w-[28ch] text-balance", className)}>
      <span className="mr-1.5 text-rule-3" aria-hidden="true">
        ⌐
      </span>
      {children}
    </p>
  );
}

/** A hanging-label record row. The shape every technical field on the page takes. */
export function Field({
  label,
  body,
  className,
}: {
  label: string;
  body: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("grid-12 gap-y-2 border-t border-rule py-5", className)}>
      <dt className="t-mark col-span-12 text-ink-4 md:col-span-3">{label}</dt>
      <dd className="t-read-sm col-span-12 max-w-[68ch] text-pretty text-ink-2 md:col-span-9">
        {body}
      </dd>
    </div>
  );
}

/** Text link with a rule that wipes across on hover. No pills anywhere. */
export function TextLink({
  href,
  children,
  external,
  download,
  className,
  tone = "ink",
}: {
  href: string;
  children: ReactNode;
  external?: boolean;
  download?: boolean;
  className?: string;
  tone?: "ink" | "signal";
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      {...(download ? { download: "" } : null)}
      data-cursor="link"
      className={cn(
        "link-rule inline-block transition-colors duration-300",
        tone === "signal"
          ? "text-signal hover:text-ink"
          : "text-ink hover:text-signal",
        className,
      )}
    >
      {children}
    </a>
  );
}

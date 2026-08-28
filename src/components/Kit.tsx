"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ============================================================================
 * KIT
 *
 * Deliberately small. There is no Card, no Panel, no Chip — those were what
 * made every section look the same. What survives is a rule, a marginal
 * annotation, and a text link. Sections build their own compositions from
 * type and space instead of reaching for a container.
 * ========================================================================= */

/** A stage marker: index, state of the field, and a rule. Never a full header. */
export function StageMark({
  index,
  label,
  state,
  className,
  tone = "mint",
}: {
  index: string;
  label: string;
  state?: string;
  className?: string;
  tone?: "mint" | "cyan" | "iris" | "amber";
}) {
  const toneClass = {
    mint: "text-mint",
    cyan: "text-cyan",
    iris: "text-iris",
    amber: "text-amber",
  }[tone];

  return (
    <div className={cn("flex items-baseline gap-3", className)}>
      <span className={cn("t-mark", toneClass)}>{index}</span>
      <span className="t-mark text-ink-3">{label}</span>
      {state ? (
        <>
          <span className="h-px w-6 shrink-0 self-center bg-rule-2" aria-hidden="true" />
          <span className="t-note hidden sm:inline">{state}</span>
        </>
      ) : null}
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
    <p className={cn("t-note max-w-[26ch] text-balance", className)}>
      <span className="mr-1.5 text-rule-3" aria-hidden="true">
        ⌐
      </span>
      {children}
    </p>
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
  tone?: "ink" | "mint";
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : null)}
      {...(download ? { download: "" } : null)}
      data-cursor="link"
      className={cn(
        "link-rule inline-block transition-colors duration-300",
        tone === "mint"
          ? "text-mint hover:text-ink"
          : "text-ink hover:text-mint",
        className,
      )}
    >
      {children}
    </a>
  );
}

"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Depth on request. The heading and the result are always visible; the
 * working sits behind one control that opens in place. Height is animated
 * by the grid track, which the compositor handles without measuring, and
 * the content is real DOM the whole time — searchable, indexable, readable
 * with the stylesheet off.
 */
export function Disclosure({
  label,
  openLabel,
  children,
  className,
}: {
  label: string;
  openLabel?: string;
  children: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        data-cursor="expand"
        className="t-mark group inline-flex items-center gap-3 text-ink-2 transition-colors duration-300 hover:text-ink"
      >
        <span
          aria-hidden="true"
          className="inline-flex h-4 w-4 items-center justify-center border border-rule-3 text-[0.7rem] leading-none text-signal transition-colors duration-300 group-hover:border-signal"
        >
          {open ? "−" : "+"}
        </span>
        {open && openLabel ? openLabel : label}
      </button>

      <div
        id={id}
        className={cn(
          "grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        )}
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
        aria-hidden={!open}
      >
        <div className="overflow-hidden">{children}</div>
      </div>
    </div>
  );
}

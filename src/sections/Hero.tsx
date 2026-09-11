"use client";

import { profile } from "@/data/profile";
import { STAGES } from "@/core/stages";
import { MaskLines } from "@/components/Motion";
import { TextLink } from "@/components/Kit";

const S = STAGES[0];

/* ============================================================================
 * HOME
 *
 * Three zones, left to right: identity and statement, the engine, navigation
 * and state. The type never crosses the machine — the column stops well short
 * of it and the camera aims a little left of the tower, so the tower stands in
 * the space that is left. That is why the headline stays readable over a
 * three-dimensional object without a scrim laid over it.
 * ========================================================================= */

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-between pb-24 pt-24 [@media(max-height:740px)]:pb-16 md:pt-28 xl:pb-28 xl:pt-32"
    >
      {/* Below xl the engine gets a band of its own at the top of the screen
          and the statement starts under it. This is a different composition,
          not a narrower copy of the desktop one. */}
      {/* The engine's band. On a short phone — an SE is 667px tall — a band
          measured only in vh pushes the call to action under the fold, so the
          band gives way first. */}
      <div
        className="h-[30vh] shrink-0 [@media(max-height:740px)]:h-[11vh] xl:hidden"
        aria-hidden="true"
      />

      {/* On a narrow screen the engine is directly behind the reading copy
          rather than beside it, so the lower part of the hero carries its own
          gradient. Desktop never needs it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[25vh] bg-gradient-to-b from-transparent via-void/92 to-void xl:hidden"
      />

      {/* ── statement ─────────────────────────────────────────────────── */}
      <div className="rail grid-12 relative z-10 flex-1 items-center px-[clamp(1.25rem,4vw,4rem)]">
        <div className="col-span-12 max-w-[32rem] xl:col-span-5">
          <div
            className="settle flex items-center gap-3"
            style={{ animationDelay: "0.15s" }}
          >
            <span
              className="block h-1.5 w-1.5 rounded-full bg-signal"
              aria-hidden="true"
            />
            <span className="h-px w-8 bg-rule-2" aria-hidden="true" />
            <span className="t-mark text-ink-2 tabular-nums">
              {S.index} / 07
            </span>
          </div>

          <p
            className="settle t-mark mt-7 text-ink-4"
            style={{ animationDelay: "0.25s" }}
          >
            Building real-world systems
          </p>

          <h1 className="t-monument mt-4 text-ink">
            <MaskLines lines={profile.headline} immediate delay={0.22} />
          </h1>

          <p
            className="settle t-read mt-7 max-w-[42ch] text-pretty text-ink-2"
            style={{ animationDelay: "0.7s" }}
          >
            I work across three layers: Django backends in production, RAG and
            multi-agent systems built on them, and applied research on machine
            unlearning.
          </p>

          <div
            className="settle mt-9 flex flex-wrap items-center gap-x-8 gap-y-4"
            style={{ animationDelay: "0.85s" }}
          >
            <a href="#work" className="control group" data-cursor="link">
              View my work
              <span
                aria-hidden="true"
                className="transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1"
              >
                →
              </span>
            </a>
            <TextLink href={profile.resume.href} download className="t-meta">
              Download CV ↓
            </TextLink>
          </div>

          <p className="settle t-note mt-6" style={{ animationDelay: "0.95s" }}>
            <span
              className="mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-signal align-middle animate-pulse-soft"
              aria-hidden="true"
            />
            {profile.availability}
          </p>
        </div>
      </div>
    </section>
  );
}

"use client";

import { profile } from "@/data/profile";
import { STAGES } from "@/core/stages";
import { MaskLines } from "@/components/Motion";
import { TextLink } from "@/components/Kit";

const S = STAGES[0];

/* ============================================================================
 * HOME
 *
 * The composition the whole page is built around: identity and statement held
 * in the left third, the machine occupying the rest of the bay, and the
 * readings hung along the bottom edge.
 *
 * The type never crosses the assembly. On desktop the column stops at five of
 * twelve, and the camera aims left of the machine so the machine sits in the
 * space that is left. That is why the headline stays readable over a
 * three-dimensional object without a scrim laid over it.
 * ========================================================================= */

export function Hero() {
  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-between pb-24 pt-24 md:pt-28 xl:pb-28 xl:pt-32"
    >
      {/* Below lg the machine gets a band of its own at the top of the screen
          and the statement starts under it. This is a different composition,
          not a narrower copy of the desktop one. */}
      <div className="h-[27vh] shrink-0 xl:hidden" aria-hidden="true" />

      {/* ── statement ─────────────────────────────────────────────────── */}
      <div className="rail grid-12 flex-1 items-center px-[clamp(1.25rem,4vw,4rem)]">
        <div className="relative z-10 col-span-12 max-w-[34rem] xl:col-span-5">
          <div
            className="settle flex items-center gap-3"
            style={{ animationDelay: "0.15s" }}
          >
            <span className="t-mark text-signal tabular-nums">{S.index}</span>
            <span className="h-px w-8 bg-rule-2" aria-hidden="true" />
            <span className="t-mark text-ink-4">System Core</span>
          </div>

          <h1 className="t-monument mt-8 text-ink">
            <MaskLines lines={profile.headline} immediate delay={0.22} />
          </h1>

          <p
            className="settle t-read mt-8 max-w-[44ch] text-pretty text-ink-2"
            style={{ animationDelay: "0.7s" }}
          >
            {profile.positioning}
          </p>

          <div
            className="settle mt-10 flex flex-wrap items-center gap-x-8 gap-y-4"
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
        </div>
      </div>

      {/* On a narrow screen the machine is directly behind the reading copy
          rather than beside it, so the lower half of the hero carries its own
          gradient. Desktop never needs it: there the type and the assembly
          occupy different parts of the bay. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 top-[25vh] bg-gradient-to-b from-transparent via-void/92 to-void xl:hidden"
      />

      {/* ── readings along the foot ───────────────────────────────────── */}
      <div
        className="settle rail relative z-10 px-[clamp(1.25rem,4vw,4rem)]"
        style={{ animationDelay: "1s" }}
      >
        <div className="h-px w-full bg-rule" aria-hidden="true" />

        <div className="mt-5 flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
          <dl className="flex flex-wrap gap-x-10 gap-y-5">
            {profile.markers.map((m) => (
              <div key={m.label}>
                <dt className="sr-only">{m.label}</dt>
                <dd>
                  <span className="t-figure-sm block text-ink">{m.value}</span>
                  <span className="t-note mt-1.5 block max-w-[15ch] leading-snug">
                    {m.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-1.5 lg:items-end">
            <p className="t-note">
              <span
                className="mr-2 inline-block h-1.5 w-1.5 translate-y-[-1px] rounded-full bg-signal align-middle animate-pulse-soft"
                aria-hidden="true"
              />
              {profile.availability}
            </p>
            <p className="t-note">{profile.location}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

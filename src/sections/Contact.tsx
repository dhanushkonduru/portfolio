"use client";

import { profile } from "@/data/profile";
import { STAGES } from "@/core/stages";
import { Annotation, SectionHead, TextLink } from "@/components/Kit";
import { MaskLines } from "@/components/Motion";

const S = STAGES[6];

const channels = [
  {
    label: "LinkedIn",
    value: "in/dhanushkonduru",
    href: profile.links.linkedin,
  },
  { label: "GitHub", value: "@dhanushkonduru", href: profile.links.github },
  { label: "LeetCode", value: "DhanushKonduru", href: profile.links.leetcode },
];

/* ============================================================================
 * CONTACT
 *
 * The machine has settled into a stable composition, so this section holds
 * almost nothing: one statement, one address at the size of an invitation, and
 * a short ruled register of channels. Nothing here animates beyond the
 * headline arriving.
 * ========================================================================= */

export function Contact() {
  return (
    <section
      id="contact"
      className="relative flex min-h-[92svh] scroll-mt-28 flex-col justify-center py-28 md:py-40"
    >
      <div className="rail px-[clamp(1.25rem,4vw,4rem)] xl:pr-[clamp(9rem,12vw,14rem)]">
        <SectionHead index={S.index} label={S.label} state={S.state} />

        <div className="max-w-[34rem] lg:max-w-[40rem]">
          <h2 className="t-monument mt-14 text-ink md:mt-20">
            <MaskLines lines={["Let's build", "something that", "holds up."]} />
          </h2>
        </div>

        <div className="grid-12 mt-14 gap-y-10 md:mt-20">
          <p className="t-read col-span-12 max-w-[46ch] text-pretty text-ink-2 lg:col-span-5">
            I&apos;m looking for AI platform, applied-research and backend roles
            where the output has to hold up under scrutiny. I&apos;m equally
            glad to talk through the unlearning work with anyone who finds the
            problem interesting.
          </p>

          <div className="col-span-12 lg:col-span-3 lg:col-start-8">
            <Annotation>
              Fastest route is email. Everything above is either open source or
              available on request.
            </Annotation>
          </div>
        </div>

        {/* The address, at the size of an invitation. */}
        <div className="mt-16 md:mt-20">
          <TextLink
            href={profile.links.email}
            tone="signal"
            className="t-statement break-all"
          >
            {profile.email}
          </TextLink>
        </div>

        <ul className="mt-16 max-w-[46rem] md:mt-20">
          {channels.map((c) => (
            <li key={c.label} className="border-t border-rule last:border-b">
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="group flex items-baseline justify-between gap-6 py-4"
              >
                <span className="t-mark text-ink-4">{c.label}</span>
                <span className="t-meta text-ink transition-colors duration-300 group-hover:text-signal">
                  {c.value}
                  <span
                    aria-hidden="true"
                    className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1"
                  >
                    ↗
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
          <a
            href={profile.resume.href}
            download
            className="control"
            data-cursor="link"
          >
            Download CV
            <span aria-hidden="true">↓</span>
          </a>
          <TextLink
            href={`tel:${profile.phone.replace(/\s/g, "")}`}
            className="t-meta"
          >
            {profile.phone}
          </TextLink>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-rule py-8 pb-20 xl:pb-8">
      <div className="rail flex flex-col gap-3 px-[clamp(1.25rem,4vw,4rem)] sm:flex-row sm:items-baseline sm:justify-between xl:pr-[clamp(9rem,12vw,14rem)]">
        <p className="t-note">
          © 2026 {profile.name}, {profile.location}
        </p>
        <p className="t-note">
          Next.js · React Three Fiber · one machine, seven views
        </p>
        <a
          href="#top"
          className="t-note link-rule self-start transition-colors hover:text-signal sm:self-auto"
        >
          Return to top
        </a>
      </div>
    </footer>
  );
}

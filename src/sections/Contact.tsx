"use client";

import { profile } from "@/data/profile";
import { STAGES } from "@/system/stages";
import { Annotation, StageMark, TextLink } from "@/components/Kit";
import { MaskLines } from "@/components/Motion";

const S = STAGES[6];

const channels = [
  { label: "Email", value: profile.email, href: profile.links.email },
  { label: "LinkedIn", value: "in/dhanushkonduru", href: profile.links.linkedin },
  { label: "GitHub", value: "@dhanushkonduru", href: profile.links.github },
  { label: "LeetCode", value: "DhanushKonduru", href: profile.links.leetcode },
];

/** The field has resolved to three points. This section holds nearly nothing. */
export function Contact() {
  return (
    <section
      id="contact"
      className="relative flex min-h-[92svh] scroll-mt-24 flex-col justify-center py-32 md:py-44"
    >
      <div className="frame rail">
        <StageMark index={S.index} label={S.label} state={S.state} tone="mint" />

        <h2 className="t-monument mt-16 max-w-[11ch] text-ink md:mt-24">
          <MaskLines lines={["Let's talk."]} />
        </h2>

        <div className="grid-12 mt-16 gap-y-12 md:mt-24">
          <p className="t-read col-span-12 max-w-[46ch] text-balance text-ink-2 md:col-span-5">
            I&apos;m looking for AI platform, applied-research and backend roles
            where the output has to hold up under scrutiny. I&apos;m equally glad to
            talk through the unlearning work with anyone who finds the problem
            interesting.
          </p>

          <div className="col-span-12 md:col-span-3 md:col-start-10">
            <Annotation>
              Fastest route is email. Everything above is either open source or
              available on request.
            </Annotation>
          </div>
        </div>

        {/* The address, at the size of an invitation. */}
        <div className="mt-20 md:mt-28">
          <TextLink
            href={profile.links.email}
            tone="mint"
            className="t-statement break-all"
          >
            {profile.email}
          </TextLink>
        </div>

        {/* Channels: a ruled register. */}
        <ul className="mt-20 md:mt-28">
          {channels.slice(1).map((c) => (
            <li key={c.label} className="border-t border-rule last:border-b">
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                data-cursor="link"
                className="group flex items-baseline justify-between gap-6 py-5"
              >
                <span className="t-mark text-ink-4">{c.label}</span>
                <span className="t-meta text-ink transition-colors duration-300 group-hover:text-mint">
                  {c.value}
                  <span className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1">
                    ↗
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
          <TextLink href={profile.resume.href} download className="t-meta">
            Download résumé ↓
          </TextLink>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="relative border-t border-rule py-10">
      <div className="frame rail flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="t-note">
          © 2026 {profile.name}, {profile.location}
        </p>
        <p className="t-note">
          Next.js · React Three Fiber · one shader, seven states
        </p>
        <a href="#top" className="t-note link-rule self-start hover:text-mint sm:self-auto">
          Return to index
        </a>
      </div>
    </footer>
  );
}

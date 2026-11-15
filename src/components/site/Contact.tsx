"use client";

import { useState } from "react";
import { ArrowUpRight, Check, Copy } from "lucide-react";
import { profile } from "@/data/profile";
import { LocalTime } from "./Finish";
import { Em, Magnetic, Reveal, RiseLines, SectionLabel } from "./ui";

const LINKS = [
  { label: "GitHub", href: profile.links.github },
  { label: "LinkedIn", href: profile.links.linkedin },
  { label: "LeetCode", href: profile.links.leetcode },
];

/**
 * The last screen. The model comes back behind it, so the page ends where it
 * started, and there is exactly one thing to do: write to him.
 */
export function Contact() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      window.location.href = profile.links.email;
    }
  };

  return (
    <section
      id="contact"
      className="relative flex min-h-[100svh] scroll-mt-24 flex-col justify-between pt-28 md:pt-40"
    >
      <div className="shell">
        <SectionLabel index="06">Contact</SectionLabel>

        <h2 className="t-hero mt-8">
          <RiseLines
            onView
            lines={[
              "Let’s build",
              <>
                something that <Em>holds</Em>
              </>,
              "up.",
            ]}
          />
        </h2>

        <div className="mt-12 flex flex-col gap-10 lg:mt-14 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <p className="t-read max-w-[44ch] text-ink-2">
              {profile.availability}. If you’re hiring for backend, LLM
              systems or applied ML, I’d like to hear about it.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Magnetic>
                <a href={profile.links.email} className="pill pill-solid">
                  {profile.email}
                  <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
                </a>
              </Magnetic>
              <button
                type="button"
                onClick={copy}
                className="pill"
                aria-live="polite"
              >
                {copied ? (
                  <>
                    Copied
                    <Check size={16} strokeWidth={2} aria-hidden="true" />
                  </>
                ) : (
                  <>
                    Copy email
                    <Copy size={15} strokeWidth={2} aria-hidden="true" />
                  </>
                )}
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <ul className="flex flex-wrap gap-x-8 gap-y-3 lg:justify-end">
              {LINKS.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noreferrer"
                    className="link-rule inline-flex items-center gap-1.5 text-[1.125rem] font-medium tracking-tight text-ink"
                  >
                    {l.label}
                    <ArrowUpRight
                      size={17}
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={profile.resume.href}
                  download
                  className="link-rule inline-flex items-center gap-1.5 text-[1.125rem] font-medium tracking-tight text-ink"
                >
                  Résumé
                  <ArrowUpRight size={17} strokeWidth={1.75} aria-hidden="true" />
                </a>
              </li>
            </ul>
          </Reveal>
        </div>
      </div>

      <footer className="shell mt-24 pb-8">
        <div className="flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="t-note">
            © 2026 {profile.name}
            <span className="mx-3 text-rule-3">/</span>
            {profile.location}
            <span className="max-sm:hidden">
              <span className="mx-3 text-rule-3">/</span>
              <LocalTime />
            </span>
          </p>
          <p className="t-note">
            {profile.site}
            <span className="mx-3 text-rule-3">/</span>
            <a href="#top" className="link-rule text-ink-2">
              Back to top ↑
            </a>
          </p>
        </div>
      </footer>
    </section>
  );
}

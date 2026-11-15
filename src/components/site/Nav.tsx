"use client";

import { useEffect, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { profile } from "@/data/profile";
import { motionTokens, springs } from "@/lib/motion-tokens";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#about", label: "About" },
  { href: "#work", label: "Work" },
  { href: "#research", label: "Patents" },
  { href: "#experience", label: "Experience" },
  { href: "#skills", label: "Skills" },
];

/**
 * The header. It gets out of the way while the page is being read downward
 * and comes back the moment the reader scrolls up, which is when they want it.
 */
export function Nav() {
  const { scrollY } = useScroll();
  const reduced = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState("");

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = scrollY.getPrevious() ?? 0;
    setHidden(y > 500 && y > prev);
    setScrolled(y > 40);
    /* Back in the hero, no section is being read. */
    if (y < 240) setActive("");
  });

  /* Mark the section being read. */
  useEffect(() => {
    const nodes = LINKS.map((l) => document.querySelector(l.href)).filter(
      Boolean,
    ) as Element[];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          if (e.isIntersecting) setActive(`#${e.target.id}`);
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    for (const n of nodes) observer.observe(n);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.header
        className="fixed inset-x-0 top-0 z-50"
        animate={{ y: hidden && !open ? "-110%" : 0 }}
        transition={{
          duration: reduced ? 0 : motionTokens.duration.normal,
          ease: motionTokens.easing.out,
        }}
      >
        <div className="shell flex h-[4.5rem] items-center justify-between md:h-20">
          <a
            href="#top"
            className="flex items-center gap-2.5 text-[0.9375rem] font-medium tracking-tight"
            onClick={() => setOpen(false)}
          >
            <span
              className="block h-1.5 w-1.5 rounded-full bg-accent"
              aria-hidden="true"
            />
            {profile.name}
          </a>

          <nav
            aria-label="Sections"
            className={cn(
              "absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-full border px-1.5 py-1.5 transition-[background-color,border-color,box-shadow] duration-700 lg:flex",
              scrolled
                ? "border-white/10 bg-panel/65 shadow-[inset_0_1px_0_rgb(255_255_255/0.07),0_16px_40px_-16px_rgb(0_0_0/0.9)] backdrop-blur-xl backdrop-saturate-150"
                : "border-transparent bg-transparent",
            )}
          >
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                aria-current={active === l.href ? "location" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-1.5 text-[0.875rem] tracking-tight transition-colors duration-300",
                  active === l.href ? "text-ink" : "text-ink-3 hover:text-ink",
                )}
              >
                {/* One marker, shared by every link: it slides to the section
                    being read instead of blinking from one to the next. */}
                {active === l.href ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-full bg-white/[0.1] shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]"
                    transition={reduced ? { duration: 0 } : springs.snappy}
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative">{l.label}</span>
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <a
              href={profile.resume.href}
              download
              className="pill !min-h-10 !px-4 !text-[0.875rem] max-sm:hidden"
            >
              Résumé
            </a>
            <a
              href="#contact"
              className="pill pill-solid !min-h-10 !px-4 !text-[0.875rem] max-lg:hidden"
            >
              Get in touch
            </a>
            <button
              type="button"
              className="pill !min-h-10 !px-4 !text-[0.875rem] lg:hidden"
              aria-expanded={open}
              aria-controls="menu"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open ? (
          <motion.div
            key="menu"
            id="menu"
            className="fixed inset-0 z-40 flex flex-col justify-between bg-void px-[clamp(1.25rem,4vw,3.5rem)] pb-10 pt-28 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionTokens.duration.fast }}
          >
            <motion.ul
              initial="hidden"
              animate="shown"
              transition={{ staggerChildren: motionTokens.stagger }}
            >
              {[...LINKS, { href: "#contact", label: "Contact" }].map((l) => (
                <motion.li
                  key={l.href}
                  variants={{
                    hidden: { opacity: 0, y: motionTokens.distance.md },
                    shown: {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: motionTokens.duration.normal,
                        ease: motionTokens.easing.out,
                      },
                    },
                  }}
                  className="border-b border-rule-2"
                >
                  <a
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="block py-4 text-[2.25rem] font-medium leading-none tracking-[-0.04em]"
                  >
                    {l.label}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
            <a
              href={profile.resume.href}
              download
              className="pill pill-solid w-full"
            >
              Download résumé
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

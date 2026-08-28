"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { profile } from "@/data/profile";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * Initialisation, not a loading screen.
 *
 * It waits on things that are actually happening (fonts resolving, the WebGL
 * context coming up) rather than animating a fake percentage, and it is capped
 * hard at 550ms so it can never become a gate. Under reduced motion it never
 * renders at all. The page content is in the DOM the whole time; this is an
 * overlay, so nothing here costs anything at crawl time.
 */
export function Boot() {
  const reduced = useReducedMotion();
  const [done, setDone] = useState(false);
  const [armed, setArmed] = useState(false);

  useEffect(() => setArmed(true), []);

  useEffect(() => {
    if (reduced) {
      setDone(true);
      return;
    }
    let cancelled = false;
    const finish = () => !cancelled && setDone(true);

    const ready = Promise.all([
      document.fonts?.ready ?? Promise.resolve(),
      new Promise<void>((res) => {
        // The canvas mounts after three.js is fetched and the context is up.
        if (document.querySelector("canvas")) return res();
        const obs = new MutationObserver(() => {
          if (document.querySelector("canvas")) {
            obs.disconnect();
            res();
          }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => {
          obs.disconnect();
          res();
        }, 500);
      }),
    ]);

    // Whichever comes first: genuinely ready, or the cap.
    ready.then(finish);
    const cap = setTimeout(finish, 550);

    return () => {
      cancelled = true;
      clearTimeout(cap);
    };
  }, [reduced]);

  if (reduced || !armed) return null;

  return (
    <AnimatePresence>
      {!done ? (
        <motion.div
          className="fixed inset-0 z-[95] flex items-end bg-void"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="frame rail pb-10">
            <p className="t-mark text-ink-4">{profile.name}</p>
            <div className="mt-4 h-px w-full max-w-md bg-rule">
              <motion.div
                className="h-full origin-left bg-mint"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.55, ease: [0.22, 0.61, 0.36, 1] }}
              />
            </div>
            <p className="t-note mt-4">Initialising system</p>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

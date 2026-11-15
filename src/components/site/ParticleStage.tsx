"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { startScroll } from "@/lib/scroll";

/* three.js is fetched only after the page is interactive, and never on the
   server. The content is readable long before the model arrives. */
const Particles = dynamic(() => import("./Particles"), { ssr: false });

/** The fixed 3D layer behind the page, plus the smooth scroll it rides on. */
export function ParticleStage() {
  useEffect(() => startScroll(), []);

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    >
      <Particles />
    </div>
  );
}

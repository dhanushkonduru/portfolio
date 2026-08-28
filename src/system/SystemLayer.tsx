"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useWebGLSupport } from "@/hooks/useWebGLSupport";
import { startStageDriver } from "./stageStore";
import { startScroll } from "./scroll";

/** three.js loads only after the page is interactive, and never on the server. */
const SystemCanvas = dynamic(
  () => import("./SystemCanvas").then((m) => m.SystemCanvas),
  { ssr: false },
);

/**
 * Without WebGL the page keeps its depth from a slow chromatic field rather
 * than falling back to flat black. The narrative survives; only the
 * transformation is lost.
 */
function StaticField() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <div className="absolute left-1/2 top-1/3 h-[70vmax] w-[70vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(94,233,192,0.08),transparent_62%)]" />
      <div className="absolute left-[70%] top-[62%] h-[52vmax] w-[52vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(124,107,255,0.07),transparent_62%)]" />
      <div className="absolute left-[24%] top-[86%] h-[46vmax] w-[46vmax] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,180,84,0.05),transparent_62%)]" />
    </div>
  );
}

export function SystemLayer() {
  const gl = useWebGLSupport();

  useEffect(() => {
    const stopStage = startStageDriver();
    const stopScroll = startScroll();
    return () => {
      stopStage();
      stopScroll();
    };
  }, []);

  if (gl === "unsupported") return <StaticField />;
  if (gl === "checking") return <StaticField />;
  return <SystemCanvas />;
}

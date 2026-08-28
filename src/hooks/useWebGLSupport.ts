"use client";

import { useEffect, useState } from "react";

export type GLStatus = "checking" | "ok" | "unsupported";

/**
 * Probes for a usable WebGL context once, on mount. Also treats very low
 * device-memory machines as unsupported so they get the static fallback
 * rather than a stuttering canvas.
 */
export function useWebGLSupport(): GLStatus {
  const [status, setStatus] = useState<GLStatus>("checking");

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl2") ??
        canvas.getContext("webgl") ??
        canvas.getContext("experimental-webgl");

      if (!gl) {
        setStatus("unsupported");
        return;
      }

      const memory = (navigator as Navigator & { deviceMemory?: number })
        .deviceMemory;
      setStatus(memory !== undefined && memory <= 2 ? "unsupported" : "ok");
    } catch {
      setStatus("unsupported");
    }
  }, []);

  return status;
}

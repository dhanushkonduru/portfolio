"use client";

import { useEffect } from "react";
import { startStageDriver } from "./stageStore";
import { startScroll } from "./scroll";

/**
 * The field is gone.
 *
 * On paper there is nothing behind the page to light up, so this renders no
 * visual layer at all. It still runs the two things the rest of the site reads
 * from — the stage driver that tells the register which section is active, and
 * the inertial scroll — so removing the canvas cost the page none of its
 * behaviour.
 */
export function SystemLayer() {
  useEffect(() => {
    const stopStage = startStageDriver();
    const stopScroll = startScroll();
    return () => {
      stopStage();
      stopScroll();
    };
  }, []);

  return null;
}

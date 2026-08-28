"use client";

import { STAGE_IDS } from "./stages";
import { scrollMotion } from "./scroll";

/* ============================================================================
 * STAGE STORE
 *
 * Scroll drives one continuous float `p` across the stages. The 3D reads it
 * by reference inside useFrame — scrolling must never trigger a React render,
 * or a 16k-pixel page would re-reconcile on every wheel tick.
 *
 * React consumers that genuinely need it (nav) subscribe through
 * useSyncExternalStore and are notified only when the integer stage changes.
 * ========================================================================= */

export type StageState = {
  /** Continuous position across stages, 0 … STAGES.length - 1. */
  p: number;
  /** Whole-page scroll progress, 0 … 1. */
  progress: number;
  /** Pointer in normalised device coords, -1 … 1. */
  px: number;
  py: number;
  /**
   * Screen-space rectangles the field must keep clear, in NDC
   * (x, y, halfWidth, halfHeight). The hero type registers itself here so the
   * field opens around the words instead of being hidden behind a scrim.
   */
  clear: Float32Array;
  clearCount: number;
  clearAmount: number;
  /** Domain cluster pulled forward by a DOM hover in the Stack section. */
  focus: number;
  focusAmt: number;
  /** Timestamp of the last scroll sample, so energy can decay when it stops. */
  lastMoveAt: number;
  /**
   * Scroll energy, 0..1, and travel direction. Position alone makes the field
   * feel like a slideshow; speed is what makes it feel physical.
   */
  speed: number;
  direction: number;
};

export const stage: StageState = {
  p: 0,
  progress: 0,
  px: 0,
  py: 0,
  clear: new Float32Array(8), // 2 rects × 4
  clearCount: 0,
  clearAmount: 0,
  focus: -1,
  focusAmt: 0,
  speed: 0,
  direction: 1,
  lastMoveAt: 0,
};

/* ---- coarse subscription: integer stage only ---- */

let activeIndex = 0;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

export function subscribeStage(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getActiveIndex() {
  return activeIndex;
}

export function getActiveIndexServer() {
  return 0;
}

/* ---- driver ---- */

let anchors: { id: string; el: HTMLElement }[] = [];
let running = false;
let raf = 0;

function measure() {
  anchors = STAGE_IDS.map((id) => ({
    id,
    el: document.getElementById(id) as HTMLElement,
  })).filter((a) => a.el);
}

/**
 * Map the viewport centre onto the stage axis by interpolating between
 * section centres. Between two sections the value moves continuously, so the
 * field is always mid-transformation rather than snapping at a boundary.
 */
function computeP(): number {
  if (anchors.length < 2) return 0;

  const focus = window.scrollY + window.innerHeight * 0.5;
  const centres = anchors.map((a) => {
    const r = a.el.getBoundingClientRect();
    return window.scrollY + r.top + r.height * 0.5;
  });

  if (focus <= centres[0]) return 0;
  const last = centres.length - 1;
  if (focus >= centres[last]) return last;

  for (let i = 0; i < last; i++) {
    const c0 = centres[i];
    const c1 = centres[i + 1];
    if (focus >= c0 && focus < c1) {
      const span = Math.max(1, c1 - c0);
      return i + (focus - c0) / span;
    }
  }
  return last;
}

let lastY = 0;
let lastT = 0;

function tick() {
  raf = 0;

  stage.p = computeP();

  /* Energy. The smoother reports its own velocity; when it is off (touch,
     reduced motion) derive it from position instead so both paths agree. */
  const now = performance.now();
  const y = window.scrollY;
  let v = scrollMotion.velocity;
  if (!v || now - scrollMotion.at > 120) {
    const dt = Math.max(16, now - lastT);
    v = ((y - lastY) / dt) * 1000;
  }
  lastY = y;
  lastT = now;
  if (Math.abs(v) > 1) stage.direction = v > 0 ? 1 : -1;
  stage.speed = Math.min(1, Math.abs(v) / 2600);
  stage.lastMoveAt = now;

  const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  stage.progress = Math.min(1, Math.max(0, window.scrollY / max));

  const next = Math.round(stage.p);
  if (next !== activeIndex) {
    activeIndex = next;
    emit();
  }
}

function schedule() {
  if (raf) return;
  raf = requestAnimationFrame(tick);
}

function onPointer(e: PointerEvent) {
  stage.px = (e.clientX / window.innerWidth) * 2 - 1;
  stage.py = -((e.clientY / window.innerHeight) * 2 - 1);
}

function onResize() {
  measure();
  schedule();
}

export function startStageDriver() {
  if (running) return () => {};
  running = true;

  measure();
  tick();

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("pointermove", onPointer, { passive: true });

  return () => {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointer);
  };
}

/* ---- clear rects (hero typography) ---- */

/**
 * Publish DOM rectangles the field should avoid, converted to NDC.
 * Called by the hero on mount, resize and scroll while it is on screen.
 */
export function setClearRects(rects: DOMRect[]) {
  const n = Math.min(rects.length, 2);
  for (let i = 0; i < n; i++) {
    const r = rects[i];
    const cx = ((r.left + r.width * 0.5) / window.innerWidth) * 2 - 1;
    const cy = -(((r.top + r.height * 0.5) / window.innerHeight) * 2 - 1);
    const hw = (r.width / window.innerWidth) * 1.0;
    const hh = (r.height / window.innerHeight) * 1.0;
    stage.clear[i * 4] = cx;
    stage.clear[i * 4 + 1] = cy;
    stage.clear[i * 4 + 2] = hw;
    stage.clear[i * 4 + 3] = hh;
  }
  stage.clearCount = n;
}

export function setClearAmount(v: number) {
  stage.clearAmount = v;
}

/** The Stack section hands the field the domain the pointer is over. */
export function setFocus(index: number) {
  stage.focus = index;
  stage.focusAmt = index >= 0 ? 1 : 0;
}

"use client";

import { STAGES, STAGE_IDS, type ModuleKey, type Stage } from "./stages";
import { scrollMotion } from "./scroll";

/* ============================================================================
 * STORE
 *
 * Scroll drives one continuous float `p` across the stages. The 3D reads it by
 * reference inside useFrame — scrolling must never trigger a React render, or
 * a page this tall would re-reconcile on every wheel tick.
 *
 * React consumers that genuinely need it (the navigation, the HUD) subscribe
 * through useSyncExternalStore and are woken only when something discrete
 * changes: the active stage, or the hovered subsystem.
 * ========================================================================= */

export type Pulse = {
  /** Continuous position across stages, 0 … STAGES.length - 1. */
  p: number;
  /** Whole-page scroll progress, 0 … 1. */
  progress: number;
  /** Pointer in normalised device coords, -1 … 1. */
  px: number;
  py: number;
  /** The same pointer, critically damped. Everything visual reads these. */
  sx: number;
  sy: number;
  /** Scroll energy 0..1 and travel direction. */
  speed: number;
  direction: number;
  /** Whether a pointer has ever moved — gates the desktop cursor work. */
  active: boolean;
  /**
   * Yaw added by dragging the engine, radians. Written by the drag handler,
   * relaxed back toward zero by the renderer once the pointer lets go — the
   * machine can be turned to look at, but it is not a toy that stays where it
   * was spun.
   */
  dragYaw: number;
  dragging: boolean;
  /**
   * The engine's footprint on screen, px: x0, y0, x1, y1. Written by the
   * renderer from the projected anchors so the drag handler can tell a press
   * on the machine from a press on the page.
   */
  rect: Float32Array;
};

/* The scene is a dynamically imported chunk and the bundler does not
   guarantee it resolves this module to the same instance the main chunk got.
   A duplicated store means the driver writes one object while the scene reads
   another, so the singletons are pinned to globalThis. */
type Global = typeof globalThis & {
  __dkPulse?: Pulse;
  __dkProjected?: Float32Array;
};
const G = globalThis as Global;

const pulseInit: Pulse = {
  p: 0,
  progress: 0,
  px: 0,
  py: 0,
  sx: 0,
  sy: 0,
  speed: 0,
  direction: 1,
  active: false,
  dragYaw: 0,
  dragging: false,
  rect: new Float32Array(4),
};

export const pulse: Pulse = G.__dkPulse ?? (G.__dkPulse = pulseInit);

/* ---- the bridge between the machine and its annotations ----
   Each subsystem's anchor is projected to screen space by the renderer every
   frame and written here as [x px, y px, presence 0..1, facing 0..1]. The
   HTML callout layer reads this array and writes transforms straight to the
   DOM. That is what attaches the labels to the geometry instead of floating
   them near it, and it costs no React renders at all. */
export const PROJECTED_STRIDE = 4;

export const projected: Float32Array =
  G.__dkProjected ?? (G.__dkProjected = new Float32Array(6 * PROJECTED_STRIDE));

/* ============================ stage sampling ============================ */

/** A stage's numeric fields, interpolated. Allocated once, written in place. */
export type Config = {
  cam: [number, number, number];
  target: [number, number, number];
  spin: number;
  open: number;
  reveal: number;
  scan: number;
  flow: number;
  dust: number;
  veil: number;
  bias: number;
  dock: number;
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Smootherstep. Sections meet without a visible seam at the boundary. */
const ease = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

export function sampleStage(p: number, out: Config): Config {
  const last = STAGES.length - 1;
  const clamped = Math.min(last, Math.max(0, p));
  const i = Math.min(last - 1, Math.floor(clamped));
  const t = ease(Math.min(1, Math.max(0, clamped - i)));

  const a: Stage = STAGES[i];
  const b: Stage = STAGES[Math.min(last, i + 1)];

  for (let k = 0; k < 3; k++) {
    out.cam[k] = lerp(a.camera[k], b.camera[k], t);
    out.target[k] = lerp(a.target[k], b.target[k], t);
  }
  out.spin = lerp(a.spin, b.spin, t);
  out.open = lerp(a.open, b.open, t);
  out.reveal = lerp(a.reveal, b.reveal, t);
  out.scan = lerp(a.scan, b.scan, t);
  out.flow = lerp(a.flow, b.flow, t);
  out.dust = lerp(a.dust, b.dust, t);
  out.veil = lerp(a.veil, b.veil, t);
  out.bias = lerp(a.bias, b.bias, t);
  out.dock = lerp(a.dock, b.dock, t);
  return out;
}

export function makeConfig(): Config {
  return {
    cam: [0, 0, 11],
    target: [0, 0, 0],
    spin: 0,
    open: 0,
    reveal: 0,
    scan: 0,
    flow: 0,
    dust: 0,
    veil: 0,
    bias: 0,
    dock: 0,
  };
}

/**
 * How strongly a subsystem should read right now, 0..1 — the blend of the
 * stages either side of `p`. This is what makes a callout rise as its section
 * arrives instead of switching on at a boundary.
 */
export function calloutWeight(
  key: ModuleKey,
  p: number,
  wide: boolean,
): number {
  const last = STAGES.length - 1;
  const clamped = Math.min(last, Math.max(0, p));
  const i = Math.min(last - 1, Math.floor(clamped));
  const t = ease(Math.min(1, Math.max(0, clamped - i)));
  const has = (s: Stage) =>
    s.callouts.includes(key) ||
    (wide && (s.calloutsWide?.includes(key) ?? false))
      ? 1
      : 0;
  return lerp(has(STAGES[i]), has(STAGES[Math.min(last, i + 1)]), t);
}

/* ======================= discrete subscriptions ======================= */

let activeIndex = 0;
const stageListeners = new Set<() => void>();

export function subscribeStage(fn: () => void) {
  stageListeners.add(fn);
  return () => stageListeners.delete(fn);
}
export function getActiveIndex() {
  return activeIndex;
}
export function getActiveIndexServer() {
  return 0;
}

let hovered: ModuleKey | null = null;
const hoverListeners = new Set<() => void>();

export function subscribeHover(fn: () => void) {
  hoverListeners.add(fn);
  return () => hoverListeners.delete(fn);
}
export function getHover() {
  return hovered;
}
export function getHoverServer(): ModuleKey | null {
  return null;
}

/** Set by the renderer's proximity test and by DOM hover on a bound row. */
export function setHover(key: ModuleKey | null) {
  if (hovered === key) return;
  hovered = key;
  for (const l of hoverListeners) l();
}

/* ============================== driver ============================== */

let anchors: HTMLElement[] = [];
let running = false;
let raf = 0;

function measure() {
  anchors = STAGE_IDS.map((id) => document.getElementById(id)).filter(
    Boolean,
  ) as HTMLElement[];
}

/**
 * Map scroll onto the stage axis.
 *
 * Interpolating between section CENTRES was wrong, and obviously so once the
 * sections were real: a section six viewports tall put its centre three
 * viewports below its heading, so the machine spent the whole of the reading
 * still travelling towards the configuration that section had asked for, and
 * arrived at it just as the reader left.
 *
 * So a stage HOLDS for the body of its section and moves only across a
 * transition band at the boundary. The reader gets a settled machine to read
 * against, and one continuous move between one view and the next.
 */
function computeP(): number {
  const n = anchors.length;
  if (n < 2) return 0;

  const centre = window.scrollY + window.innerHeight * 0.5;
  const tops = anchors.map(
    (el) => window.scrollY + el.getBoundingClientRect().top,
  );

  const last = n - 1;
  if (centre >= tops[last]) return last;

  for (let i = 0; i < last; i++) {
    const start = i === 0 ? 0 : tops[i];
    const end = tops[i + 1];
    if (centre < start || centre >= end) continue;

    /* The band is the shorter of most of the section and one screen: a short
       section cross-fades over itself, a long one over its final screen. */
    const span = Math.max(1, end - start);
    const band = Math.min(span * 0.55, window.innerHeight * 0.95);
    const t = (centre - (end - band)) / band;
    return i + Math.min(1, Math.max(0, t));
  }
  return 0;
}

let lastY = 0;
let lastT = 0;

function tick() {
  raf = 0;
  pulse.p = computeP();

  /* Energy. The smoother reports its own velocity; where it is off (touch,
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
  if (Math.abs(v) > 1) pulse.direction = v > 0 ? 1 : -1;
  pulse.speed = Math.min(1, Math.abs(v) / 2600);

  const max = Math.max(
    1,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  pulse.progress = Math.min(1, Math.max(0, y / max));

  const next = Math.round(pulse.p);
  if (next !== activeIndex) {
    activeIndex = next;
    for (const l of stageListeners) l();
  }
}

function schedule() {
  if (raf) return;
  raf = requestAnimationFrame(tick);
}

function onPointer(e: PointerEvent) {
  pulse.px = (e.clientX / window.innerWidth) * 2 - 1;
  pulse.py = -((e.clientY / window.innerHeight) * 2 - 1);
  pulse.active = true;
}

function onResize() {
  measure();
  schedule();
}

export function startDriver() {
  if (running) return () => {};
  running = true;

  measure();
  tick();

  /* Sections are tall and lazily laid out; re-measure once the fonts and the
     images have settled rather than trusting the first frame. */
  const settle = setTimeout(onResize, 600);

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", onResize);
  window.addEventListener("pointermove", onPointer, { passive: true });

  return () => {
    running = false;
    clearTimeout(settle);
    if (raf) cancelAnimationFrame(raf);
    window.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointer);
  };
}

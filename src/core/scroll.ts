"use client";

/* ============================================================================
 * SCROLL
 *
 * An inertial smoother with the two defects that killed the previous attempt
 * fixed:
 *
 *   1. `scroll-behavior: smooth` is gone from the stylesheet. Leaving it on
 *      meant every per-frame scrollTo() started a *second* browser-owned
 *      animation that fought this one. That was the mush.
 *   2. deltaMode is normalised. Mice and browsers that report DOM_DELTA_LINE
 *      send ~3 per notch, not ~100px, so raw deltaY made scrolling crawl.
 *
 * Touch keeps its native momentum: hijacking it is always worse than the
 * platform. Anything that scrolls on its own opts out with data-scroll-ignore.
 * ========================================================================= */

const LINE_HEIGHT = 16;
const DAMPING = 9.2; // higher settles faster

type Runtime = {
  target: number;
  current: number;
  raf: number;
  running: boolean;
  enabled: boolean;
};

const rt: Runtime = {
  target: 0,
  current: 0,
  raf: 0,
  running: false,
  enabled: false,
};

/** Signed px/s, written every frame. The field reads this as energy. */
export const scrollMotion = { velocity: 0, speed: 0, direction: 1, at: 0 };

function maxScroll() {
  return Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
}

/** Wheel deltas arrive in three different units. Normalise to pixels. */
function pixels(e: WheelEvent) {
  if (e.deltaMode === 1) return e.deltaY * LINE_HEIGHT;
  if (e.deltaMode === 2) return e.deltaY * window.innerHeight;
  return e.deltaY;
}

export function scrollTo(y: number, immediate = false) {
  rt.target = Math.max(0, Math.min(maxScroll(), y));
  if (!rt.enabled || immediate) {
    rt.current = rt.target;
    window.scrollTo(0, rt.target);
    return;
  }
  start();
}

function start() {
  if (rt.running) return;
  rt.running = true;
  rt.raf = requestAnimationFrame(tick);
}

let last = 0;

function tick(now: number) {
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
  last = now;

  const prev = rt.current;
  // Frame-rate independent easing: identical settling on 60Hz and 120Hz.
  rt.current += (rt.target - rt.current) * (1 - Math.exp(-DAMPING * dt));

  const dy = rt.current - prev;
  scrollMotion.velocity = dy / Math.max(dt, 1e-4);
  if (Math.abs(dy) > 0.01) scrollMotion.direction = dy > 0 ? 1 : -1;
  scrollMotion.at = now;

  if (Math.abs(rt.target - rt.current) < 0.25) {
    rt.current = rt.target;
    window.scrollTo(0, rt.current);
    rt.running = false;
    last = 0;
    return;
  }

  window.scrollTo(0, rt.current);
  rt.raf = requestAnimationFrame(tick);
}

export function startScroll() {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  rt.enabled = !reduced && fine;

  rt.target = window.scrollY;
  rt.current = window.scrollY;

  const onWheel = (e: WheelEvent) => {
    if (!rt.enabled || e.ctrlKey) return;
    const el = e.target as Element | null;
    if (el?.closest?.("[data-scroll-ignore]")) return;

    e.preventDefault();
    rt.target = Math.max(0, Math.min(maxScroll(), rt.target + pixels(e)));
    start();
  };

  /* Anchors are animated by this smoother rather than by the browser, so the
     two never run at once. */
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.(
      'a[href^="#"]',
    ) as HTMLAnchorElement | null;
    if (!a) return;
    const id = a.getAttribute("href")!.slice(1);
    const node = id ? document.getElementById(id) : null;
    if (!node) return;
    e.preventDefault();
    const y = window.scrollY + node.getBoundingClientRect().top;
    if (rt.enabled) scrollTo(y);
    else window.scrollTo({ top: y, behavior: reduced ? "auto" : "smooth" });
    history.replaceState(null, "", `#${id}`);
  };

  /* Keyboard, scrollbar drags and touch move the page without going through
     onWheel. Re-sync whenever we are not mid-glide. */
  const resync = () => {
    if (rt.running) return;
    rt.target = window.scrollY;
    rt.current = window.scrollY;
  };

  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("scroll", resync, { passive: true });
  window.addEventListener("resize", resync);
  document.addEventListener("click", onClick);

  return () => {
    cancelAnimationFrame(rt.raf);
    rt.running = false;
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("scroll", resync);
    window.removeEventListener("resize", resync);
    document.removeEventListener("click", onClick);
  };
}

"use client";

import { useEffect, useRef } from "react";
import {
  calloutWeight,
  getFocus,
  getHover,
  projected,
  PROJECTED_STRIDE,
  pulse,
  stageFocus,
  subscribeHover,
} from "@/core/store";
import { SUBSYSTEMS } from "@/core/stages";

/* ============================================================================
 * TECHNICAL CALLOUTS
 *
 * Engineering annotations, attached to the machine rather than floated near
 * it: the renderer projects each subsystem's anchor to screen space every
 * frame, and this layer draws a leader line from that exact point out to its
 * label. Rotate the assembly and the labels follow the parts they name.
 *
 * Presence is continuous. A callout rises as its section arrives and falls as
 * it leaves, and dims when the part it names is on the far side of the
 * assembly — so the layer thins itself out instead of shouting all six at
 * once. Hovering a module raises its own callout to full.
 *
 * Nothing here renders through React. One rAF writes transforms and opacities
 * straight to the DOM, because this updates sixty times a second.
 * ========================================================================= */

export function TechnicalCallouts() {
  const host = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);
  const lines = useRef<(SVGPathElement | null)[]>([]);
  const dots = useRef<(SVGCircleElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let live = true;
    /* Hover arrives as a discrete event but is rendered as a continuous
       value, so a callout brightens rather than snapping on. */
    const boost = SUBSYSTEMS.map(() => 0);
    const shown = SUBSYSTEMS.map(() => 0);

    const stopHover = subscribeHover(() => {});

    const frame = () => {
      raf = 0;
      if (!live) return;
      raf = requestAnimationFrame(frame);

      const w = window.innerWidth;
      const h = window.innerHeight;
      if (svg.current) svg.current.setAttribute("viewBox", `0 0 ${w} ${h}`);

      const hovered = getHover();
      const focused = getFocus() ?? stageFocus(pulse.p);
      const wide = w >= 1500;

      /* The bay has two regions a label may never enter: the reading column
         at the left of the hero, and the navigator's gutter at the right.
         Both are measured, not assumed. */
      const navPad = Math.max(144, Math.min(w * 0.12, 224));
      const docked = pulse.p > 0.6 && pulse.p < 5.5;
      const textEdge = pulse.p < 0.6 ? Math.min(w * 0.42, 64 + 512 + 28) : 14;
      /* While the engine is docked against the lane, every label lives on the
         engine's side of it. A callout drawn over the reading is a caption on
         the wrong picture. */
      const navEdge = docked
        ? Math.max(64, w - navPad - 864) - 18
        : w - navPad - 40;

      /* Placed labels, per side, so later ones can step clear of earlier. */
      const placedL: { y: number; hgt: number }[] = [];
      const placedR: { y: number; hgt: number }[] = [];

      for (let i = 0; i < SUBSYSTEMS.length; i++) {
        const s = SUBSYSTEMS[i];
        const node = nodes.current[i];
        const line = lines.current[i];
        const dot = dots.current[i];
        if (!node || !line || !dot) continue;

        const o = i * PROJECTED_STRIDE;
        const x = projected[o];
        const y = projected[o + 1];
        const onScreen = projected[o + 2];
        const depth = projected[o + 3];

        boost[i] += ((hovered === s.key ? 1 : 0) - boost[i]) * 0.16;

        /* Four levels: a resting presence so the machine always reads as
           annotated, the stage's own emphasis, the reader's focus, and the
           pointer. Never all six at full. */
        const stage = calloutWeight(s.key, pulse.p, wide);
        const focus = focused === s.key ? 0.86 : 0;
        const want =
          onScreen *
          Math.min(
            1,
            Math.max(boost[i], focus, stage * 0.9, 0.14) * (0.4 + depth),
          );
        shown[i] += (want - shown[i]) * 0.12;

        const a = shown[i];
        if (a < 0.012) {
          node.style.opacity = "0";
          line.style.opacity = "0";
          dot.style.opacity = "0";
          continue;
        }

        /* The assembly is often cropped by the frame in the reading sections,
           so a label that would run off the edge is placed on the other side
           of its part instead of being clipped or hidden. */
        const width = node.offsetWidth || 216;
        const hgt = node.offsetHeight || 54;
        let side = s.side;
        if (side === "left" && x + s.offset[0] - width < textEdge)
          side = "right";
        else if (side === "right" && x + s.offset[0] + width > navEdge)
          side = "left";

        const dir = side === "left" ? -1 : 1;
        const flipped = side !== s.side;
        let lx = x + (flipped ? -s.offset[0] : s.offset[0]);
        let ly = y + s.offset[1];

        /* The engine is deliberately cropped by the frame in places, so an
           anchor can sit off-screen. Keep the label inside its allowed band
           and let the leader stretch back to wherever the part actually is. */
        const minLeft = side === "left" ? textEdge : 14;
        const maxRight = side === "right" ? navEdge : w - 14;
        const leftEdge = side === "left" ? lx - width : lx;
        if (leftEdge < minLeft) lx += minLeft - leftEdge;
        const rightEdge = side === "left" ? lx : lx + width;
        if (rightEdge > maxRight) lx -= rightEdge - maxRight;
        ly = Math.min(h - 60, Math.max(96, ly));

        /* Two labels on the same side must not sit on top of each other. The
           later one steps down (or up) until it is clear of the earlier. */
        const placed = side === "left" ? placedL : placedR;
        for (let k = 0; k < 12; k++) {
          const hit = placed.find(
            (q) => Math.abs(q.y - ly) < (q.hgt + hgt) / 2 + 10,
          );
          if (!hit) break;
          ly = hit.y + (ly >= hit.y ? 1 : -1) * ((hit.hgt + hgt) / 2 + 10);
        }
        placed.push({ y: ly, hgt });

        node.style.textAlign = side === "left" ? "right" : "left";
        node.style.opacity = String(a);
        node.style.transform = `translate3d(${lx}px, ${ly}px, 0) translate(${
          side === "left" ? "-100%" : "0"
        }, -50%)`;

        /* An engineering leader: a diagonal out of the part, then a short
           horizontal run into the text. Never a straight diagonal ending in
           the middle of a word. */
        const bend = lx - dir * 26;
        line.setAttribute(
          "d",
          `M ${x + dir * 8} ${y} L ${bend} ${ly} L ${lx - dir * 5} ${ly}`,
        );
        line.style.opacity = String(a * 0.6);

        dot.setAttribute("cx", String(x));
        dot.setAttribute("cy", String(y));
        dot.style.opacity = String(a * 0.85);
        dot.setAttribute("r", String(3 + boost[i] * 2.4));
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      live = false;
      if (raf) cancelAnimationFrame(raf);
      stopHover();
    };
  }, []);

  return (
    <div
      ref={host}
      data-callouts
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-20 hidden xl:block"
    >
      <svg
        ref={svg}
        className="absolute inset-0 h-full w-full overflow-visible"
        preserveAspectRatio="none"
      >
        {SUBSYSTEMS.map((s, i) => (
          <g key={s.key}>
            <path
              ref={(el) => {
                lines.current[i] = el;
              }}
              fill="none"
              stroke="var(--color-rule-3)"
              strokeWidth="1"
              style={{ opacity: 0 }}
            />
            <circle
              ref={(el) => {
                dots.current[i] = el;
              }}
              r="3"
              fill="none"
              stroke="var(--color-signal)"
              strokeWidth="1"
              style={{ opacity: 0 }}
            />
          </g>
        ))}
      </svg>

      {SUBSYSTEMS.map((s, i) => (
        <div
          key={s.key}
          ref={(el) => {
            nodes.current[i] = el;
          }}
          className="absolute left-0 top-0 w-[13.5rem] will-change-transform"
          style={{ opacity: 0 }}
        >
          <p className="t-mark text-signal">{s.title}</p>
          {s.lines.map((line) => (
            <p key={line} className="t-note leading-snug">
              {line}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

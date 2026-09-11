"use client";

import { useEffect, useRef } from "react";
import { makeConfig, pulse, sampleStage } from "@/core/store";
import { cn } from "@/lib/utils";

/* ============================================================================
 * ENGINE SCHEMATIC
 *
 * A line elevation of the Verification Engine, drawn once as SVG: the machine
 * on pages that cannot draw the real one at all.
 *
 * It is not a static drawing. Its part groups read the same stage position
 * as the renderer and part by the same `open` value, so even without WebGL
 * the page shows an instrument that opens as it is inspected.
 * ========================================================================= */

const STROKE = "var(--color-ink-3)";
const FAINT = "var(--color-rule-3)";
const BEAM = "var(--color-beam)";

export function EngineSchematic({
  className,
  detail = "inset",
}: {
  className?: string;
  /** Stroke weight; the full-page fallback draws a little heavier. */
  detail?: "inset" | "fallback";
}) {
  const lower = useRef<SVGGElement>(null);
  const upper = useRef<SVGGElement>(null);
  const top = useRef<SVGGElement>(null);
  const left = useRef<SVGGElement>(null);
  const right = useRef<SVGGElement>(null);
  const core = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const cfg = makeConfig();
    let raf = 0;
    let live = true;
    let open = 0;

    const frame = () => {
      raf = 0;
      if (!live) return;
      raf = requestAnimationFrame(frame);
      sampleStage(pulse.p, cfg);
      open += (cfg.open - open) * 0.08;

      if (lower.current)
        lower.current.style.transform = `translateY(${(open * 10).toFixed(2)}px)`;
      if (upper.current)
        upper.current.style.transform = `translateY(${(-open * 12).toFixed(2)}px)`;
      if (top.current)
        top.current.style.transform = `translateY(${(-open * 19).toFixed(2)}px)`;
      if (left.current)
        left.current.style.transform = `translateX(${(-open * 11).toFixed(2)}px)`;
      if (right.current)
        right.current.style.transform = `translateX(${(open * 11).toFixed(2)}px)`;
      if (core.current) {
        core.current.style.opacity = (0.35 + cfg.reveal * 0.65).toFixed(3);
        core.current.setAttribute("r", (6 + cfg.reveal * 2.5).toFixed(2));
      }
    };

    raf = requestAnimationFrame(frame);
    return () => {
      live = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const w = detail === "fallback" ? 1.1 : 0.9;

  return (
    <svg
      viewBox="0 0 200 300"
      className={cn("block", className)}
      fill="none"
      strokeLinecap="square"
      aria-hidden="true"
    >
      {/* floor and platform */}
      <line x1="10" y1="283" x2="190" y2="283" stroke={FAINT} strokeWidth={w} />
      <rect
        x="38"
        y="264"
        width="124"
        height="16"
        stroke={STROKE}
        strokeWidth={w}
      />
      <line
        x1="50"
        y1="272"
        x2="150"
        y2="272"
        stroke={FAINT}
        strokeWidth={w * 0.7}
      />

      {/* lower housing and nameplate */}
      <rect
        x="62"
        y="216"
        width="76"
        height="48"
        stroke={STROKE}
        strokeWidth={w}
      />
      <rect
        x="80"
        y="232"
        width="40"
        height="12"
        stroke={FAINT}
        strokeWidth={w * 0.8}
      />
      <line
        x1="62"
        y1="222"
        x2="138"
        y2="222"
        stroke={BEAM}
        strokeWidth={w * 0.8}
        opacity="0.6"
      />

      {/* lower stabilisation stack */}
      <g ref={lower} style={{ transition: "none" }}>
        <rect
          x="50"
          y="206"
          width="100"
          height="6"
          stroke={STROKE}
          strokeWidth={w}
        />
        <rect
          x="56"
          y="198"
          width="88"
          height="5"
          stroke={STROKE}
          strokeWidth={w}
        />
        <rect
          x="62"
          y="190"
          width="76"
          height="5"
          stroke={STROKE}
          strokeWidth={w}
        />
      </g>

      {/* the inspection chamber */}
      <rect
        x="72"
        y="120"
        width="56"
        height="68"
        stroke={STROKE}
        strokeWidth={w}
      />
      {[75, 87, 100, 113, 125].map((x) => (
        <line
          key={x}
          x1={x}
          y1="120"
          x2={x}
          y2="188"
          stroke={FAINT}
          strokeWidth={w * 0.7}
        />
      ))}
      <line
        x1="100"
        y1="126"
        x2="100"
        y2="182"
        stroke={STROKE}
        strokeWidth={w * 0.8}
      />
      {[136, 146, 154, 162, 172].map((y) => (
        <line
          key={y}
          x1="92"
          y1={y}
          x2="108"
          y2={y}
          stroke={FAINT}
          strokeWidth={w * 0.7}
        />
      ))}
      <circle
        ref={core}
        cx="100"
        cy="154"
        r="7"
        stroke={BEAM}
        strokeWidth={w}
      />

      {/* upper stabilisation stack */}
      <g ref={upper} style={{ transition: "none" }}>
        <rect
          x="62"
          y="113"
          width="76"
          height="5"
          stroke={STROKE}
          strokeWidth={w}
        />
        <rect
          x="56"
          y="105"
          width="88"
          height="5"
          stroke={STROKE}
          strokeWidth={w}
        />
        <rect
          x="50"
          y="97"
          width="100"
          height="6"
          stroke={STROKE}
          strokeWidth={w}
        />
      </g>

      {/* upper housing, fins, crown, cables */}
      <g ref={top} style={{ transition: "none" }}>
        <rect
          x="64"
          y="58"
          width="72"
          height="38"
          stroke={STROKE}
          strokeWidth={w}
        />
        {[66, 72, 78, 84, 90].map((y) => (
          <g key={y}>
            <line
              x1="56"
              y1={y}
              x2="64"
              y2={y}
              stroke={FAINT}
              strokeWidth={w * 0.8}
            />
            <line
              x1="136"
              y1={y}
              x2="144"
              y2={y}
              stroke={FAINT}
              strokeWidth={w * 0.8}
            />
          </g>
        ))}
        <polygon
          points="70,58 130,58 118,38 82,38"
          stroke={STROKE}
          strokeWidth={w}
        />
        <line
          x1="86"
          y1="34"
          x2="114"
          y2="34"
          stroke={STROKE}
          strokeWidth={w}
        />
        <path
          d="M 92 34 C 60 30, 40 60, 44 128"
          stroke={FAINT}
          strokeWidth={w * 0.8}
        />
        <path
          d="M 108 34 C 140 30, 160 60, 156 128"
          stroke={FAINT}
          strokeWidth={w * 0.8}
        />
      </g>

      {/* docked modules on their arms */}
      <g ref={left} style={{ transition: "none" }}>
        <line
          x1="44"
          y1="142"
          x2="72"
          y2="142"
          stroke={STROKE}
          strokeWidth={w}
        />
        <rect
          x="18"
          y="126"
          width="26"
          height="50"
          stroke={STROKE}
          strokeWidth={w}
        />
        <line
          x1="24"
          y1="134"
          x2="24"
          y2="168"
          stroke={BEAM}
          strokeWidth={w * 0.8}
          opacity="0.6"
        />
      </g>
      <g ref={right} style={{ transition: "none" }}>
        <line
          x1="128"
          y1="142"
          x2="156"
          y2="142"
          stroke={STROKE}
          strokeWidth={w}
        />
        <rect
          x="156"
          y="126"
          width="26"
          height="50"
          stroke={STROKE}
          strokeWidth={w}
        />
        <line
          x1="176"
          y1="134"
          x2="176"
          y2="168"
          stroke={BEAM}
          strokeWidth={w * 0.8}
          opacity="0.6"
        />
      </g>
    </svg>
  );
}

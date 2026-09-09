"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { stage } from "./stageStore";
import { STAGES } from "./stages";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ============================================================================
 * THE PLOTTER
 *
 * A pen plotter drawing on the sheet, not a light behind it.
 *
 * One geodesic wireframe, fixed topology, re-plotted into a different solid
 * for every stage. There is no lighting, no bloom and no additive blending
 * anywhere in here, because paper does not emit — emission is exactly what
 * made the previous particle field read as a screen effect laid behind the
 * page rather than as part of it.
 *
 * The one genuinely non-obvious piece is the clear-region shader below: the
 * ink attenuates PER VERTEX where the drawing crosses a rectangle the page's
 * typography has registered, so the plot opens around the words instead of
 * the whole canvas dimming. That is what makes it read as a technical diagram
 * laid out around its annotations.
 * ========================================================================= */

/** Distinct solids, one per stage, all plotted from the same base direction. */
const PLOTS: ((p: THREE.Vector3, out: THREE.Vector3) => void)[] = [
  // 0 · index — the sphere, observed whole
  (p, o) => o.copy(p).multiplyScalar(2.25),

  // 1 · approach — a torus: the argument turned back on itself
  (p, o) => {
    const u = Math.atan2(p.z, p.x);
    const v = Math.asin(THREE.MathUtils.clamp(p.y, -1, 1)) * 2;
    const R = 1.75,
      r = 0.72;
    o.set(
      (R + r * Math.cos(v)) * Math.cos(u),
      r * Math.sin(v),
      (R + r * Math.cos(v)) * Math.sin(u),
    );
  },

  // 2 · stack — snapped to a lattice: discrete, countable, addressable
  (p, o) => {
    const g = 0.62;
    o.set(
      Math.round((p.x * 2.3) / g) * g,
      Math.round((p.y * 2.3) / g) * g,
      Math.round((p.z * 2.3) / g) * g,
    );
  },

  // 3 · work — a twisted column: layers stacked and under load
  (p, o) => {
    const y = p.y * 2.5;
    const a = Math.atan2(p.z, p.x) + y * 0.55;
    const r = 1.15 + Math.abs(p.y) * 0.25;
    o.set(Math.cos(a) * r, y, Math.sin(a) * r);
  },

  // 4 · research — flattened to the measurement plane, then perturbed
  (p, o) => {
    const r = Math.hypot(p.x, p.z) * 2.5;
    const a = Math.atan2(p.z, p.x);
    o.set(Math.cos(a) * r, Math.sin(r * 2.1) * 0.42 + p.y * 0.12, Math.sin(a) * r);
  },

  // 5 · journey — a helix: the route, not the destination
  (p, o) => {
    const t = (p.y + 1) * Math.PI * 1.6;
    const r = 1.5;
    o.set(Math.cos(t) * r, p.y * 2.4, Math.sin(t) * r + p.x * 0.35);
  },

  // 6 · contact — collapsed to a single ring, the signature
  (p, o) => {
    const u = Math.atan2(p.z, p.x);
    const R = 2.0;
    o.set(Math.cos(u) * R, p.y * 0.16, Math.sin(u) * R);
  },
];

/* ---------------------------------------------------------------- shaders */

const VERT = /* glsl */ `
  uniform vec4 uClear[2];
  uniform float uClearCount;
  uniform float uClearAmt;
  varying float vAtt;

  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec2 ndc = clip.xy / clip.w;

    // Attenuate where the plot crosses a registered clear rectangle. The
    // falloff is deliberately wide so the drawing thins out approaching the
    // type rather than being cut along a hard edge.
    float att = 1.0;
    for (int i = 0; i < 2; i++) {
      float active = step(float(i), uClearCount - 0.5);
      vec4 r = uClear[i];
      vec2 d = abs(ndc - r.xy) / max(r.zw, vec2(1e-4));
      float inside = 1.0 - smoothstep(0.70, 1.45, max(d.x, d.y));
      att *= mix(1.0, mix(1.0, 0.10, inside * uClearAmt), active);
    }

    vAtt = att;
    gl_Position = clip;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform float uAlpha;
  varying float vAtt;

  void main() {
    gl_FragColor = vec4(uInk, uAlpha * vAtt);
  }
`;

/* ------------------------------------------------------------------- plot */

function Plot({ detail, reduced }: { detail: number; reduced: boolean }) {
  const lines = useRef<THREE.LineSegments>(null);
  const group = useRef<THREE.Group>(null);

  const { geometry, targets, material } = useMemo(() => {
    const solid = new THREE.IcosahedronGeometry(1, detail);
    const edges = new THREE.EdgesGeometry(solid, 1);
    const base = edges.getAttribute("position") as THREE.BufferAttribute;
    const n = base.count;

    const dir = new THREE.Vector3();
    const out = new THREE.Vector3();
    const targets = PLOTS.map((plot) => {
      const buf = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        dir.set(base.getX(i), base.getY(i), base.getZ(i)).normalize();
        plot(dir, out);
        buf[i * 3] = out.x;
        buf[i * 3 + 1] = out.y;
        buf[i * 3 + 2] = out.z;
      }
      return buf;
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(targets[0].slice(), 3),
    );

    // One material, one geometry, allocated once and mutated in place.
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
      uniforms: {
        uInk: { value: new THREE.Color("#17160f") },
        uAlpha: { value: reduced ? 0.1 : 0.09 },
        uClear: {
          value: [new THREE.Vector4(0, 0, 0, 0), new THREE.Vector4(0, 0, 0, 0)],
        },
        uClearCount: { value: 0 },
        uClearAmt: { value: 0 },
      },
    });

    solid.dispose();
    edges.dispose();
    return { geometry, targets, material };
  }, [detail, reduced]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame((_, rawDt) => {
    const mesh = lines.current;
    const g = group.current;
    if (!mesh || !g) return;
    const dt = Math.min(rawDt, 1 / 30); // a backgrounded tab must not jump

    const last = STAGES.length - 1;
    const p = THREE.MathUtils.clamp(stage.p, 0, last);
    const i0 = Math.floor(p);
    const i1 = Math.min(i0 + 1, last);
    const raw = p - i0;
    // Smoothstep so the solids settle into each other; a linear blend makes
    // the midpoint of every transition look like neither shape.
    const t = raw * raw * (3 - 2 * raw);

    const a = targets[i0];
    const b = targets[i1];
    const attr = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < arr.length; i++) arr[i] = a[i] + (b[i] - a[i]) * t;
    attr.needsUpdate = true;

    // ---- motion -----------------------------------------------------------
    // Orientation is scroll-led. The drift term is gated on scroll energy, so
    // when the reader stops the drawing settles into a fixed pose instead of
    // turning forever with nothing driving it.
    if (!reduced) {
      const spin = stage.progress * Math.PI * 1.15;
      const settle = Math.min(1, dt * 3.2);
      g.rotation.y += (spin - g.rotation.y) * settle + dt * stage.speed * 0.09;
      // Pointer parallax, deliberately tiny — the object must never chase.
      g.rotation.x += (stage.py * 0.05 + 0.2 - g.rotation.x) * Math.min(1, dt * 2);
      g.rotation.z += (stage.px * 0.03 - g.rotation.z) * Math.min(1, dt * 2);
    }

    // ---- ink load ---------------------------------------------------------
    // Presence sets the resting load; a morph in progress earns a little more,
    // because a transition is the one moment the drawing is the subject.
    const presence =
      STAGES[i0].presence + (STAGES[i1].presence - STAGES[i0].presence) * t;
    const transition = 4 * raw * (1 - raw); // 0 at rest, 1 mid-morph
    const target = THREE.MathUtils.clamp(
      0.045 + presence * 0.085 + transition * 0.05,
      0.04,
      0.2,
    );

    const u = material.uniforms;
    u.uAlpha.value += (target - u.uAlpha.value) * Math.min(1, dt * 2.5);

    // ---- clear regions ----------------------------------------------------
    const rects = u.uClear.value as THREE.Vector4[];
    for (let i = 0; i < 2; i++) {
      rects[i].set(
        stage.clear[i * 4],
        stage.clear[i * 4 + 1],
        stage.clear[i * 4 + 2],
        stage.clear[i * 4 + 3],
      );
    }
    u.uClearCount.value = stage.clearCount;
    u.uClearAmt.value += (stage.clearAmount - u.uClearAmt.value) * Math.min(1, dt * 4);

  });

  return (
    <group ref={group}>
      <lineSegments
        ref={lines}
        geometry={geometry}
        material={material}
        frustumCulled={false}
      />
    </group>
  );
}

/* ------------------------------------------------------------------ canvas */

/**
 * One orthographic context for the whole page, never torn down between
 * sections. Orthographic rather than perspective because a plotter has no
 * vanishing point: parallel lines stay parallel, and that is most of why the
 * result reads as a drawing rather than a render.
 */
export function InkField() {
  const reduced = useReducedMotion();
  const [awake, setAwake] = useState(true);

  const { detail, dpr } = useMemo(() => {
    if (typeof window === "undefined") return { detail: 2, dpr: 1 as number };
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 900;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    // Detail is art direction as much as budget: enough lines to read as a
    // mesh, few enough to stay a drawing.
    if (coarse || narrow) return { detail: 2, dpr: 1 };
    if (mem !== undefined && mem <= 4) return { detail: 2, dpr: 1.5 };
    return { detail: 3, dpr: 2 };
  }, []);

  useEffect(() => {
    const onVis = () => setAwake(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        orthographic
        dpr={[1, dpr]}
        camera={{ position: [0, 0, 10], zoom: 128 }}
        frameloop={awake ? "always" : "never"}
        gl={{ antialias: true, alpha: true, depth: false, stencil: false }}
      >
        <Plot detail={detail} reduced={reduced} />
      </Canvas>
    </div>
  );
}

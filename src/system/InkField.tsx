"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { stage } from "./stageStore";
import { STAGES } from "./stages";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ============================================================================
 * THE PLOTTER
 *
 * A pen plotter drawing on the sheet, not a light source behind it.
 *
 * Everything here is line work: one geodesic wireframe whose vertices are
 * re-plotted into a different solid for every stage, drawn in 1px ink at low
 * opacity. There is no lighting, no bloom and no additive blending, because
 * paper does not emit — the previous field did, and that is precisely what
 * made it read as a screen effect laid behind the page.
 *
 * Topology is fixed and only positions move, so a morph is a lerp between two
 * precomputed buffers rather than a rebuild.
 * ========================================================================= */

/** Distinct solids, one per stage, all plotted from the same base direction. */
const PLOTS: ((p: THREE.Vector3, out: THREE.Vector3) => void)[] = [
  // 0 · dispersed — the sphere, observed whole
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

  // 6 · contact — collapsed to a single ring
  (p, o) => {
    const u = Math.atan2(p.z, p.x);
    const R = 2.0;
    o.set(Math.cos(u) * R, p.y * 0.16, Math.sin(u) * R);
  },
];

function Plot({ detail, reduced }: { detail: number; reduced: boolean }) {
  const lines = useRef<THREE.LineSegments>(null);
  const group = useRef<THREE.Group>(null);

  // Base wireframe and one precomputed target buffer per stage. Built once.
  const { geometry, targets } = useMemo(() => {
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
    solid.dispose();
    edges.dispose();
    return { geometry, targets };
  }, [detail]);

  useFrame((_, dt) => {
    const mesh = lines.current;
    const g = group.current;
    if (!mesh || !g) return;

    const last = STAGES.length - 1;
    const p = THREE.MathUtils.clamp(stage.p, 0, last);
    const i0 = Math.floor(p);
    const i1 = Math.min(i0 + 1, last);
    const raw = p - i0;
    // Smoothstep: the solids should settle into each other, not cross-fade
    // linearly, or the midpoint of every transition looks like neither shape.
    const t = raw * raw * (3 - 2 * raw);

    const a = targets[i0];
    const b = targets[i1];
    const attr = mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    for (let i = 0; i < arr.length; i++) arr[i] = a[i] + (b[i] - a[i]) * t;
    attr.needsUpdate = true;

    // Rotation is scroll-led with a slow constant drift, so the drawing is
    // never quite still but never spins on its own either.
    const spin = stage.progress * Math.PI * 1.15;
    g.rotation.y += (spin - g.rotation.y) * Math.min(1, dt * 3.2) + dt * 0.035;
    g.rotation.x += (stage.py * 0.14 + 0.22 - g.rotation.x) * Math.min(1, dt * 2);
    g.rotation.z += (stage.px * 0.06 - g.rotation.z) * Math.min(1, dt * 2);

    // Ink load: how much of the drawing is on the page here. Stages that carry
    // dense reading pull it back; the clear-rect amount pulls it back further
    // so the plotter never competes with type.
    const presence =
      STAGES[i0].presence + (STAGES[i1].presence - STAGES[i0].presence) * t;
    const target = 0.2 * presence * (1 - stage.clearAmount * 0.55);
    const mat = mesh.material as THREE.LineBasicMaterial;
    mat.opacity += (target - mat.opacity) * Math.min(1, dt * 2.5);
  });

  return (
    <group ref={group}>
      <lineSegments ref={lines} geometry={geometry} frustumCulled={false}>
        <lineBasicMaterial
          color="#17160f"
          transparent
          opacity={reduced ? 0.14 : 0.12}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

/**
 * One orthographic context for the page. Orthographic rather than perspective
 * because a plotter has no vanishing point — parallel lines stay parallel, and
 * that is most of why the result reads as a drawing rather than a render.
 */
export function InkField() {
  const reduced = useReducedMotion();
  const detail = useMemo(() => {
    if (typeof window === "undefined") return 2;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    // Detail is art direction, not a budget: the drawing wants enough lines to
    // read as a mesh and few enough to stay a drawing.
    return coarse || window.innerWidth < 900 ? 2 : 3;
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        orthographic
        dpr={[1, 2]}
        camera={{ position: [0, 0, 10], zoom: 128 }}
        gl={{ antialias: true, alpha: true, depth: false, stencil: false }}
      >
        <Plot detail={detail} reduced={reduced} />
      </Canvas>
    </div>
  );
}

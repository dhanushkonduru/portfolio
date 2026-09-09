import * as THREE from "three";

/* ============================================================================
 * THE VERIFIER — parts catalogue
 *
 * A bench instrument, not a vehicle. A faceted computation core held in a
 * three-axis structural gimbal, interrogated by sensor pods that aim inward at
 * it, reporting to a control plate, inside a shell that opens.
 *
 * Everything is drawn as line work so the machine belongs to the paper: no
 * lit surfaces, no reflections, no bloom. Geometry is procedural and built
 * once — nothing here is loaded or rebuilt per frame.
 * ========================================================================= */

/** A circle in a plane, with graduated ticks — the structural rings. */
export function ringGeo(radius: number, seg = 96, tickEvery = 8, tick = 0.06) {
  const v: number[] = [];
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2;
    const a1 = ((i + 1) / seg) * Math.PI * 2;
    v.push(Math.cos(a0) * radius, Math.sin(a0) * radius, 0);
    v.push(Math.cos(a1) * radius, Math.sin(a1) * radius, 0);
    if (i % tickEvery === 0) {
      v.push(Math.cos(a0) * radius, Math.sin(a0) * radius, 0);
      v.push(Math.cos(a0) * (radius + tick), Math.sin(a0) * (radius + tick), 0);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  return g;
}

/** Faceted core: polyhedron edges. */
export function coreGeo(radius: number, detail = 1) {
  const solid = new THREE.IcosahedronGeometry(radius, detail);
  const e = new THREE.EdgesGeometry(solid, 1);
  solid.dispose();
  return e;
}

/** One shell panel: an annular sector outline, the pieces that open. */
export function panelGeo(r0: number, r1: number, a0: number, a1: number, seg = 14) {
  const v: number[] = [];
  const arc = (r: number) => {
    for (let i = 0; i < seg; i++) {
      const t0 = a0 + ((a1 - a0) * i) / seg;
      const t1 = a0 + ((a1 - a0) * (i + 1)) / seg;
      v.push(Math.cos(t0) * r, Math.sin(t0) * r, 0, Math.cos(t1) * r, Math.sin(t1) * r, 0);
    }
  };
  arc(r0);
  arc(r1);
  v.push(Math.cos(a0) * r0, Math.sin(a0) * r0, 0, Math.cos(a0) * r1, Math.sin(a0) * r1, 0);
  v.push(Math.cos(a1) * r0, Math.sin(a1) * r0, 0, Math.cos(a1) * r1, Math.sin(a1) * r1, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  return g;
}

/** Sensor pod: a small open frame with a sight line aimed at its own origin. */
export function sensorGeo(s = 0.17) {
  const v: number[] = [];
  const box = [
    [-s, -s], [s, -s], [s, -s], [s, s], [s, s], [-s, s], [-s, s], [-s, -s],
  ];
  for (const [x, y] of box) v.push(x, y, 0);
  // Sight line: the pod points back down its own axis, at the core.
  v.push(0, 0, 0, 0, 0, s * 3.2);
  // Crosshair
  v.push(-s * 0.45, 0, 0, s * 0.45, 0, 0, 0, -s * 0.45, 0, 0, s * 0.45, 0);
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  return g;
}

/** Control plate: a square outline with an internal reading grid. */
export function plateGeo(s = 0.95, div = 4) {
  const v: number[] = [];
  v.push(-s, 0, -s, s, 0, -s, s, 0, -s, s, 0, s, s, 0, s, -s, 0, s, -s, 0, s, -s, 0, -s);
  for (let i = 1; i < div; i++) {
    const p = -s + (2 * s * i) / div;
    v.push(p, 0, -s, p, 0, s, -s, 0, p, s, 0, p);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  return g;
}

/** Structural strut: a single braced member between two radii. */
export function strutGeo(r0: number, r1: number) {
  const v = [r0, 0, 0, r1, 0, 0, r0, 0, 0, r0, 0.12, 0, r1, 0, 0, r1, 0.12, 0, r0, 0.12, 0, r1, 0.12, 0];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(v, 3));
  return g;
}

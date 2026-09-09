import * as THREE from "three";

/* ============================================================================
 * THE ENGINE — parts catalogue
 *
 * A compact computational apparatus. The silhouette is deliberately NOT
 * radially symmetric: an open rectangular exoskeleton with a vertical spine,
 * one sensor mast out to the side and a control block on a single corner.
 * Reactors and turbines are discs; this reads as neither.
 *
 * Geometry is procedural, built once, and shared between instances.
 * ========================================================================= */

/** Frame column: a slender chamfered post. */
export function columnGeo(h: number) {
  return new THREE.BoxGeometry(0.13, h, 0.13);
}

/** Frame plate: the top and bottom of the exoskeleton, cut out in the middle. */
export function plateGeo(w: number, d: number, t = 0.08) {
  const shape = new THREE.Shape();
  const hw = w / 2, hd = d / 2, r = 0.1;
  shape.moveTo(-hw + r, -hd);
  shape.lineTo(hw - r, -hd);
  shape.quadraticCurveTo(hw, -hd, hw, -hd + r);
  shape.lineTo(hw, hd - r);
  shape.quadraticCurveTo(hw, hd, hw - r, hd);
  shape.lineTo(-hw + r, hd);
  shape.quadraticCurveTo(-hw, hd, -hw, hd - r);
  shape.lineTo(-hw, -hd + r);
  shape.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  const hole = new THREE.Path();
  hole.absarc(0, 0, Math.min(hw, hd) * 0.52, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -t / 2, 0);
  return g;
}

/** Core plate: one layer of the processor stack, with a machined notch. */
export function corePlateGeo(s: number, t = 0.055) {
  const shape = new THREE.Shape();
  const h = s / 2, c = s * 0.18;
  shape.moveTo(-h + c, -h);
  shape.lineTo(h, -h);
  shape.lineTo(h, h - c);
  shape.lineTo(h - c, h);
  shape.lineTo(-h, h);
  shape.lineTo(-h, -h + c);
  shape.closePath();
  const hole = new THREE.Path();
  hole.absarc(0, 0, s * 0.17, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false });
  g.rotateX(-Math.PI / 2);
  g.translate(0, -t / 2, 0);
  return g;
}

/** Gyro ring: a flat annulus with a rectangular boss on one side. */
export function gyroGeo(r: number, w = 0.055) {
  const g = new THREE.TorusGeometry(r, w, 8, 96);
  g.rotateX(Math.PI / 2);
  return g;
}

/** Sensor head: a small open frame that aims at the core. */
export function sensorHeadGeo() {
  return new THREE.BoxGeometry(0.34, 0.22, 0.1);
}

/** Control block: a chamfered housing that sits on one frame corner. */
export function controlGeo() {
  const g = new THREE.BoxGeometry(0.52, 0.34, 0.4);
  return g;
}

/** Strut: a thin angled member. */
export function strutGeo(len: number) {
  return new THREE.CylinderGeometry(0.022, 0.022, len, 6);
}

/** A rail for the signal bus — thin, square section. */
export function railGeo(len: number) {
  return new THREE.BoxGeometry(0.03, 0.03, len);
}

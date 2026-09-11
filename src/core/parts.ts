import * as THREE from "three";

/* ============================================================================
 * PARTS
 *
 * Every piece of the assembly is machined here from primitives: bevelled
 * annular plates, ring sectors, chamfered housings, fins, bolts and routed
 * conduits. Nothing is imported as a model, so the whole machine costs a few
 * kilobytes of code rather than a few megabytes of GLB, and each part can be
 * driven by the stage configuration instead of baked into a mesh.
 *
 * The assembly's axis is Z — toward the viewer — so rings and plates are built
 * in the XY plane and extruded along Z. All builders return geometry centred
 * on the origin.
 * ========================================================================= */

const EXTRUDE = {
  bevelEnabled: true,
  bevelSegments: 1,
  steps: 1,
} as const;

/** A machined annular plate — the structural layer of the assembly. */
export function annulus(
  inner: number,
  outer: number,
  thickness: number,
  segments = 64,
  bevel = 0.008,
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    ...EXTRUDE,
    depth: thickness,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: segments,
  });
  geo.translate(0, 0, -thickness / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * One sector of a concentric ring. Rings are built from sectors with gaps
 * between them rather than as solid tori — the gaps are what make the
 * assembly read as manufactured segments bolted together.
 */
export function ringSector(
  inner: number,
  outer: number,
  arc: number,
  thickness: number,
  bevel = 0.006,
): THREE.BufferGeometry {
  const a = arc / 2;
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, -a, a, false);
  shape.lineTo(inner * Math.cos(a), inner * Math.sin(a));
  shape.absarc(0, 0, inner, a, -a, true);
  shape.lineTo(outer * Math.cos(-a), outer * Math.sin(-a));

  const geo = new THREE.ExtrudeGeometry(shape, {
    ...EXTRUDE,
    depth: thickness,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: Math.max(6, Math.round((arc / (Math.PI * 2)) * 96)),
  });
  geo.translate(0, 0, -thickness / 2);
  geo.computeVertexNormals();
  return geo;
}

function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const x = w / 2;
  const y = h / 2;
  const s = new THREE.Shape();
  s.moveTo(-x + r, -y);
  s.lineTo(x - r, -y);
  s.quadraticCurveTo(x, -y, x, -y + r);
  s.lineTo(x, y - r);
  s.quadraticCurveTo(x, y, x - r, y);
  s.lineTo(-x + r, y);
  s.quadraticCurveTo(-x, y, -x, y - r);
  s.lineTo(-x, -y + r);
  s.quadraticCurveTo(-x, -y, -x + r, -y);
  return s;
}

/** A chamfered housing. Sharp boxes read as primitives; chamfers read as parts. */
export function chamferBox(
  w: number,
  h: number,
  d: number,
  corner = 0.02,
  bevel = 0.008,
): THREE.BufferGeometry {
  const geo = new THREE.ExtrudeGeometry(roundedRect(w, h, corner), {
    ...EXTRUDE,
    depth: d,
    bevelSize: bevel,
    bevelThickness: bevel,
    curveSegments: 3,
  });
  geo.translate(0, 0, -d / 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * A conduit routed from the hub out to a docking point. Cables do not travel
 * in straight lines between two ports; they leave normal to the face, sag,
 * and arrive normal to the other. Three control points is enough to say that.
 */
export function conduit(
  from: THREE.Vector3,
  to: THREE.Vector3,
  sag: number,
  radius: number,
  segments = 26,
): THREE.BufferGeometry {
  const mid = from.clone().lerp(to, 0.5);
  mid.y -= sag;
  const lift = from.clone().lerp(to, 0.22);
  lift.y += sag * 0.35;

  const curve = new THREE.CatmullRomCurve3(
    [from.clone(), lift, mid, to.clone()],
    false,
    "catmullrom",
    0.4,
  );
  return new THREE.TubeGeometry(curve, segments, radius, 6, false);
}

/* ---------------------------------------------------------------- shared */

/** Precision connector — the bolt that appears wherever two plates meet. */
export const boltGeo = new THREE.CylinderGeometry(0.028, 0.034, 0.062, 6);

/** A single cooling fin. Stacked by instancing. */
export const finGeo = new THREE.BoxGeometry(0.2, 0.16, 0.012);

/** Graduation tick on the outer measurement ring. */
export const tickGeo = new THREE.BoxGeometry(0.012, 0.01, 0.07);

/** Emissive indicator. Small enough that 8 segments is generous. */
export const ledGeo = new THREE.SphereGeometry(0.017, 8, 6);

/** The travelling data packet. */
export const packetGeo = new THREE.SphereGeometry(0.022, 6, 5);

/* ---------------------------------------------------------------- materials
 *
 * Five surfaces, shared by every part that wears them. Most of the machine is
 * dark and metallic; light is what reveals the geometry, so roughness does
 * more work here than colour does.
 */

export function makeMaterials() {
  /* Metal takes almost all of its colour from what it reflects. Pushed to
     full metalness against a dark bay these all went black, so each surface
     keeps enough diffuse to hold its own value and the environment does the
     rest. The machine has to stay dark — but dark and legible, not a
     silhouette. */
  const graphite = new THREE.MeshStandardMaterial({
    color: 0x2c333c,
    metalness: 0.74,
    roughness: 0.42,
  });

  const anodized = new THREE.MeshStandardMaterial({
    color: 0x181d24,
    metalness: 0.6,
    roughness: 0.62,
  });

  const brushed = new THREE.MeshStandardMaterial({
    color: 0x6a7481,
    metalness: 0.86,
    roughness: 0.3,
  });

  const silver = new THREE.MeshStandardMaterial({
    color: 0xc0c9d4,
    metalness: 0.95,
    roughness: 0.22,
  });

  /* The technical translucent: the window into the compute chamber. Not
     transmission — a real refractive pass on a page-wide canvas is not worth
     what it costs, and at this scale it reads the same. */
  const glass = new THREE.MeshStandardMaterial({
    color: 0x2b3a49,
    metalness: 0.2,
    roughness: 0.08,
    transparent: true,
    opacity: 0.26,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  /* Restrained emissive. Brightness is driven per frame from the stage
     configuration, so illumination belongs to the machine's state. */
  const emissive = new THREE.MeshBasicMaterial({
    color: 0xa8d2f8,
    toneMapped: false,
    transparent: true,
    opacity: 0.9,
  });

  const channel = new THREE.MeshBasicMaterial({
    color: 0x5d9ad9,
    toneMapped: false,
    transparent: true,
    opacity: 0.45,
  });

  return { graphite, anodized, brushed, silver, glass, emissive, channel };
}

export type Materials = ReturnType<typeof makeMaterials>;

export function disposeMaterials(m: Materials) {
  for (const mat of Object.values(m)) mat.dispose();
}

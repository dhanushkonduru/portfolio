"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import {
  annulus,
  boltGeo,
  chamferBox,
  conduit,
  finGeo,
  ledGeo,
  lie,
  makeMaterials,
  nameplate,
  packetGeo,
  tickGeo,
} from "./parts";
import { SUBSYSTEMS, type ModuleKey } from "./stages";
import {
  getFocus,
  getHover,
  makeConfig,
  projected,
  PROJECTED_STRIDE,
  pulse,
  sampleStage,
  setHover,
  stageFocus,
} from "./store";

/* ============================================================================
 * THE VERIFICATION ENGINE
 *
 * A bench instrument, standing on Y: a glass inspection chamber holding the
 * compute core, clamped between two stabilisation ring stacks, on a housing
 * that carries its nameplate, under a cooled upper housing and a crown that
 * cables out to four docked modules on telescoping arms. Every part is
 * machined here from primitives. Nothing is imported.
 *
 * States are not keyframes. The stage configuration declares the machine's
 * PARAMETERS — how far it is unlocked, how lit the core is, whether the
 * scanner is running — and every part derives its own transform from them.
 * That is why opening the engine reads as a mechanism, not an animation.
 *
 * Idle is almost still. The core turns very slowly, packets drift along the
 * cables, the seed breathes. Nothing spins for the sake of spinning.
 *
 * One useFrame drives the whole assembly. Per-frame allocation is zero.
 * ========================================================================= */

export type Tier = "high" | "mid" | "low";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (a: number, b: number, rate: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-rate * dt));

/** The four docked modules, by angle around the column. +Z faces the viewer. */
const MODULES: { key: ModuleKey | null; angle: number; window: boolean }[] = [
  { key: "io", angle: 0.38, window: false },
  { key: "sensor", angle: Math.PI - 0.38, window: true },
  { key: "data", angle: -1.0, window: false },
  { key: null, angle: Math.PI + 1.0, window: false },
];

/** Radius at which a sealed module docks. Arms extend it when the engine opens. */
const DOCK = 1.56;
const STRUTS = 6;

export function VerificationEngine({
  tier,
  reduced,
}: {
  tier: Tier;
  reduced: boolean;
}) {
  const finCount = tier === "high" ? 40 : tier === "mid" ? 28 : 16;
  const packetCount = tier === "high" ? 16 : tier === "mid" ? 10 : 6;
  const floaters = tier === "high" ? 4 : tier === "mid" ? 2 : 0;
  const shadows = tier === "high";

  /* ------------------------------------------------------------------ parts */

  const mats = useMemo(() => makeMaterials(), []);

  const geo = useMemo(() => {
    const g = {
      floor: new THREE.CircleGeometry(4.6, 64),
      groove: lie(annulus(2.42, 2.46, 0.004, 96)),
      groove2: lie(annulus(3.1, 3.13, 0.004, 96)),
      plinth: new THREE.CylinderGeometry(1.98, 2.14, 0.28, 48),
      plinthTop: lie(annulus(0.92, 1.76, 0.06, 56)),
      drum: new THREE.CylinderGeometry(1.06, 1.06, 0.86, 40),
      drumSlit: new THREE.TorusGeometry(1.065, 0.012, 6, 64),
      rib: chamferBox(0.07, 0.62, 0.05, 0.012),
      plate: chamferBox(0.96, 0.27, 0.03, 0.02),
      label: new THREE.PlaneGeometry(0.88, 0.215),
      ringA: lie(annulus(0.56, 1.26, 0.06, 56)),
      ringB: lie(annulus(0.6, 1.1, 0.055, 56)),
      ringC: lie(annulus(0.64, 0.95, 0.05, 48)),
      glass: new THREE.CylinderGeometry(0.6, 0.6, 1.8, 40, 1, true),
      cap: lie(annulus(0.18, 0.72, 0.06, 40)),
      capRing: new THREE.TorusGeometry(0.66, 0.02, 6, 48),
      strut: chamferBox(0.08, 1.92, 0.08, 0.015),
      spindle: new THREE.CylinderGeometry(0.045, 0.045, 1.7, 12),
      disc: lie(annulus(0.07, 0.3, 0.018, 40)),
      lattice: new THREE.IcosahedronGeometry(0.28, 1),
      seed: new THREE.SphereGeometry(0.085, 16, 12),
      scanner: new THREE.TorusGeometry(0.57, 0.011, 6, 56),
      upperDrum: new THREE.CylinderGeometry(1.0, 1.0, 0.8, 40),
      band: new THREE.TorusGeometry(1.005, 0.014, 6, 64),
      crown: new THREE.CylinderGeometry(0.55, 0.86, 0.36, 8),
      crownCap: lie(annulus(0.16, 0.58, 0.05, 8)),
      port: new THREE.CylinderGeometry(0.06, 0.06, 0.12, 10),
      armIn: chamferBox(0.5, 0.1, 0.12, 0.015),
      armOut: chamferBox(0.56, 0.08, 0.1, 0.012),
      elbow: new THREE.CylinderGeometry(0.09, 0.09, 0.16, 12),
      body: chamferBox(0.62, 0.92, 0.5, 0.03),
      face: chamferBox(0.04, 0.8, 0.42, 0.02),
      window: chamferBox(0.03, 0.42, 0.3, 0.015),
      strip: new THREE.BoxGeometry(0.012, 0.44, 0.012),
      junction: chamferBox(0.12, 0.1, 0.12, 0.015),
      chip: chamferBox(0.12, 0.12, 0.05, 0.015),
      /* Connector sockets on the I/O face, sensor apertures on the array. */
      socket: new THREE.CylinderGeometry(0.028, 0.028, 0.05, 10),
      aperture: new THREE.TorusGeometry(0.046, 0.008, 6, 20),
    };
    g.socket.rotateZ(Math.PI / 2);
    g.aperture.rotateY(Math.PI / 2);
    g.drumSlit.rotateX(Math.PI / 2);
    g.capRing.rotateX(Math.PI / 2);
    g.scanner.rotateX(Math.PI / 2);
    g.band.rotateX(Math.PI / 2);
    g.floor.rotateX(-Math.PI / 2);
    return g;
  }, []);

  /* Cables leave the crown's ports, arc outward and drop to ports on the
     upper housing. Both ends ride the same assembly, so they never part. */
  const cables = useMemo(() => {
    const tubes: THREE.BufferGeometry[] = [];
    const curves: THREE.CatmullRomCurve3[] = [];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const from = new THREE.Vector3(
        Math.cos(a) * 0.36,
        2.36,
        Math.sin(a) * 0.36,
      );
      const to = new THREE.Vector3(
        Math.cos(a) * 1.02,
        1.42,
        Math.sin(a) * 1.02,
      );
      const lift = new THREE.Vector3(
        Math.cos(a) * 0.7,
        2.62,
        Math.sin(a) * 0.7,
      );
      const swing = new THREE.Vector3(
        Math.cos(a) * 1.28,
        2.05,
        Math.sin(a) * 1.28,
      );
      const curve = new THREE.CatmullRomCurve3(
        [from, lift, swing, to],
        false,
        "catmullrom",
        0.5,
      );
      curves.push(curve);
      tubes.push(new THREE.TubeGeometry(curve, 28, 0.022, 6, false));
    }
    const merged = mergeGeometries(tubes, false)!;
    for (const t of tubes) t.dispose();

    const SAMPLES = 64;
    const table = new Float32Array(curves.length * SAMPLES * 3);
    const v = new THREE.Vector3();
    curves.forEach((c, ci) => {
      for (let i = 0; i < SAMPLES; i++) {
        c.getPointAt(i / (SAMPLES - 1), v);
        const o = (ci * SAMPLES + i) * 3;
        table[o] = v.x;
        table[o + 1] = v.y;
        table[o + 2] = v.z;
      }
    });
    return { merged, table, samples: SAMPLES, routes: curves.length };
  }, []);

  /* The flex conduit from each module's top into its arm's junction box.
     One geometry, instanced by the four carriages. */
  const flex = useMemo(
    () =>
      conduit(
        new THREE.Vector3(0.36, 0.5, 0.12),
        new THREE.Vector3(-0.34, 0.16, 0.12),
        -0.28,
        0.018,
        20,
      ),
    [],
  );

  const plateTex = useMemo(() => nameplate(), []);
  const plateMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: plateTex ?? undefined,
        color: plateTex ? 0xffffff : 0x1b2027,
        roughness: 0.55,
        metalness: 0.35,
      }),
    [plateTex],
  );

  /* One emissive per subsystem, so a part can brighten without every other
     part brightening with it. */
  const glow = useMemo(() => {
    const make = () =>
      new THREE.MeshBasicMaterial({
        color: 0xa9d2f7,
        toneMapped: false,
        transparent: true,
        opacity: 0.4,
      });
    return {
      cooling: make(),
      sensor: make(),
      compute: make(),
      ring: make(),
      data: make(),
      io: make(),
      aux: make(),
    } as Record<ModuleKey | "aux", THREE.MeshBasicMaterial>;
  }, []);

  const latticeMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: 0x9fcdf7,
        wireframe: true,
        toneMapped: false,
        transparent: true,
        opacity: 0.3,
      }),
    [],
  );

  useLayoutEffect(() => {
    return () => {
      for (const x of Object.values(geo)) x.dispose();
      for (const x of Object.values(mats)) x.dispose();
      for (const x of Object.values(glow)) x.dispose();
      cables.merged.dispose();
      flex.dispose();
      plateTex?.dispose();
      plateMat.dispose();
      latticeMat.dispose();
    };
  }, [geo, mats, glow, cables, flex, plateTex, plateMat, latticeMat]);

  /* -------------------------------------------------------------- transforms */

  const root = useRef<THREE.Group>(null);
  const lowerStack = useRef<THREE.Group>(null);
  const upperStack = useRef<THREE.Group>(null);
  const upper = useRef<THREE.Group>(null);
  const core = useRef<THREE.Group>(null);
  const seedRef = useRef<THREE.Mesh>(null);
  const lampRef = useRef<THREE.PointLight>(null);
  const scannerRef = useRef<THREE.Mesh>(null);
  const strutRefs = useRef<(THREE.Group | null)[]>([]);
  const carriageRefs = useRef<(THREE.Group | null)[]>([]);
  const anchorRefs = useRef<(THREE.Object3D | null)[]>([]);
  const packetRef = useRef<THREE.InstancedMesh>(null);
  const floatRef = useRef<THREE.InstancedMesh>(null);
  const finRef = useRef<THREE.InstancedMesh>(null);
  const boltRef = useRef<THREE.InstancedMesh>(null);
  const tickRef = useRef<THREE.InstancedMesh>(null);
  const ribRef = useRef<THREE.InstancedMesh>(null);

  /* Static instancing — fins, bolts, graduations and ribs never move relative
     to the part they are fixed to, so their matrices are written once. */
  useLayoutEffect(() => {
    const d = new THREE.Object3D();

    if (finRef.current) {
      const n = finRef.current.count;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        d.position.set(Math.cos(a) * 1.09, 1.6, Math.sin(a) * 1.09);
        d.rotation.set(0, -a, 0);
        d.updateMatrix();
        finRef.current.setMatrixAt(i, d.matrix);
      }
      finRef.current.instanceMatrix.needsUpdate = true;
    }

    if (boltRef.current) {
      const n = boltRef.current.count;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        d.position.set(Math.cos(a) * 1.88, -2.13, Math.sin(a) * 1.88);
        d.rotation.set(0, 0, 0);
        d.updateMatrix();
        boltRef.current.setMatrixAt(i, d.matrix);
      }
      boltRef.current.instanceMatrix.needsUpdate = true;
    }

    if (tickRef.current) {
      const n = tickRef.current.count;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const long = i % 6 === 0;
        d.position.set(Math.cos(a) * 2.78, -2.44, Math.sin(a) * 2.78);
        d.rotation.set(0, -a, 0);
        d.scale.set(1, 1, long ? 2.4 : 1);
        d.updateMatrix();
        tickRef.current.setMatrixAt(i, d.matrix);
      }
      d.scale.set(1, 1, 1);
      tickRef.current.instanceMatrix.needsUpdate = true;
    }

    if (ribRef.current) {
      /* Eight on the lower housing, eight on the upper, held off the surface. */
      let k = 0;
      for (const [y, r] of [
        [-1.6, 1.075],
        [1.6, 1.02],
      ]) {
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
          d.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
          d.rotation.set(0, -a + Math.PI / 2, 0);
          d.updateMatrix();
          ribRef.current.setMatrixAt(k++, d.matrix);
        }
      }
      ribRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  const floatSeeds = useMemo(
    () =>
      Array.from({ length: floaters }, (_, i) => ({
        r: 2.3 + (i % 3) * 0.35,
        phase: (i / Math.max(1, floaters)) * Math.PI * 2 + 0.7,
        rate: 0.02 + (i % 3) * 0.008,
        y: -0.6 + i * 0.7,
        size: 0.5 + ((i * 37) % 10) / 24,
      })),
    [floaters],
  );

  /* -------------------------------------------------------------- the loop */

  const cfg = useMemo(makeConfig, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const lift = useRef<Record<string, number>>({});
  const px = useRef(0);
  const py = useRef(0);
  const openS = useRef(0);
  const presentYaw = useRef(0);

  useFrame((state, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const t = state.clock.elapsedTime;
    sampleStage(pulse.p, cfg);

    /* Pointer, damped. Raw pointer on a transform reads as a toy; damped at
       this rate it reads as an object with mass. */
    const rate = reduced ? 0 : 3.2;
    px.current = reduced ? 0 : damp(px.current, pulse.px, rate, dt);
    py.current = reduced ? 0 : damp(py.current, pulse.py, rate, dt);
    pulse.sx = px.current;
    pulse.sy = py.current;

    /* A turned engine returns to rest on its own, slowly, once released. */
    if (!pulse.dragging) pulse.dragYaw = damp(pulse.dragYaw, 0, 0.55, dt);

    const idle = reduced ? 0 : t;
    const hovered = getHover();
    const focused = getFocus() ?? stageFocus(pulse.p);

    /* Mechanical state is itself damped: a stage boundary asks the machine to
       open, and the machine takes a moment to do it. */
    openS.current = damp(openS.current, cfg.open, reduced ? 60 : 2.2, dt);
    const open = openS.current;
    const rev = cfg.reveal;
    const scan = cfg.scan;

    /* ---- presentation ----
       While docked against the reading lane the engine is cropped by the
       frame, so a module that lights on the far side lights for nobody. When
       the reader's focus is a docked module, the engine turns to present it —
       slowly, the way a turntable does, and only by as much as it takes. */
    const present = MODULES.find((m) => m.key && m.key === focused);
    const wantYaw = present ? present.angle - 0.42 : 0;
    presentYaw.current = damp(
      presentYaw.current,
      wantYaw * cfg.dock,
      reduced ? 60 : 1.1,
      dt,
    );

    /* ---- the engine as a whole ---- */
    if (root.current) {
      root.current.rotation.y =
        cfg.spin + presentYaw.current + px.current * 0.07 + pulse.dragYaw;
      root.current.rotation.x = -py.current * 0.03;
    }

    /* ---- unlocking ---- */
    if (lowerStack.current) lowerStack.current.position.y = -1.15 - open * 0.42;
    if (upperStack.current) upperStack.current.position.y = 1.15 + open * 0.5;
    if (upper.current) upper.current.position.y = open * 0.74;

    for (let i = 0; i < STRUTS; i++) {
      const s = strutRefs.current[i];
      if (!s) continue;
      s.position.x = 0.66 + open * 0.22;
      s.rotation.z = -open * 0.16;
    }

    /* ---- the core ---- */
    if (core.current) {
      core.current.rotation.y =
        idle * 0.06 +
        (hovered === "compute" ? 0.2 : focused === "compute" ? 0.1 : 0);
    }
    if (seedRef.current) {
      const breath = 1 + Math.sin(idle * 1.1) * 0.04;
      seedRef.current.scale.setScalar(breath * (0.85 + rev * 0.3));
    }
    if (lampRef.current)
      lampRef.current.intensity = 0.4 + rev * 2.6 + scan * 0.8;
    latticeMat.opacity = 0.12 + rev * 0.5;
    mats.glass.opacity = 0.2 + open * 0.08 + scan * 0.06;
    mats.glass.emissive.setHex(0x1f3d5c);
    mats.glass.emissiveIntensity = scan * 0.55;

    /* ---- the measurement pass ---- */
    if (scannerRef.current) {
      const u = (Math.sin(idle * 0.75) + 1) * 0.5;
      scannerRef.current.position.y = -0.72 + u * 1.44;
      (scannerRef.current.material as THREE.MeshBasicMaterial).opacity =
        scan * 0.85;
      scannerRef.current.visible = scan > 0.01;
    }

    /* ---- subsystem illumination ---- */
    const key = (k: ModuleKey | "aux", base: number) => {
      const want = hovered === k ? 1 : focused === k ? 0.62 : 0;
      const cur = lift.current[k] ?? 0;
      const next = damp(cur, want, 6, dt);
      lift.current[k] = next;
      glow[k].opacity = base + next * 0.55;
      return next;
    };
    key("compute", 0.3 + rev * 0.65);
    key("cooling", 0.14 + rev * 0.3);
    key("ring", 0.16 + rev * 0.3);
    key("aux", 0.1 + rev * 0.25 + cfg.flow * 0.1);

    /* ---- the docked modules ---- */
    for (let i = 0; i < MODULES.length; i++) {
      const c = carriageRefs.current[i];
      if (!c) continue;
      const m = MODULES[i];
      const l = m.key ? key(m.key, 0.16 + rev * 0.34 + cfg.flow * 0.12) : 0;
      c.position.x = DOCK + open * 0.42 + l * 0.06;
      /* A tiny mechanical settle, out of phase per module: the engine is
         powered, not frozen. */
      c.position.y = Math.sin(idle * 0.3 + i * 1.7) * 0.004;
      c.rotation.y = -open * 0.12;
    }

    /* ---- packets on the crown cables ---- */
    if (packetRef.current) {
      const { table, samples, routes } = cables;
      const speed = 0.08 + cfg.flow * 0.42;
      for (let i = 0; i < packetCount; i++) {
        const route = i % routes;
        const offset = Math.floor(i / routes) / Math.ceil(packetCount / routes);
        const u = (idle * speed + offset + route * 0.21) % 1;
        const si = Math.min(samples - 1, Math.floor(u * (samples - 1)));
        const o = (route * samples + si) * 3;
        dummy.position.set(table[o], table[o + 1], table[o + 2]);
        dummy.scale.setScalar(0.5 + Math.sin(u * Math.PI) * 0.7);
        dummy.updateMatrix();
        packetRef.current.setMatrixAt(i, dummy.matrix);
      }
      packetRef.current.instanceMatrix.needsUpdate = true;
      (packetRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.2 + cfg.flow * 0.7;
      dummy.scale.setScalar(1);
    }

    /* ---- detached components, drifting ---- */
    if (floatRef.current && floaters) {
      for (let i = 0; i < floaters; i++) {
        const f = floatSeeds[i];
        const a = f.phase + idle * f.rate;
        const r = f.r + open * 0.4;
        dummy.position.set(
          Math.cos(a) * r,
          f.y + Math.sin(idle * 0.25 + f.phase) * 0.08,
          Math.sin(a) * r,
        );
        dummy.rotation.set(a * 0.5, a, a * 0.3);
        dummy.scale.setScalar(f.size);
        dummy.updateMatrix();
        floatRef.current.setMatrixAt(i, dummy.matrix);
      }
      floatRef.current.instanceMatrix.needsUpdate = true;
      dummy.scale.setScalar(1);
    }

    /* ---- annotations: project the anchors, pick by proximity, publish the
       footprint. World matrices are last frame's; a label trails its part by
       16ms, which nobody can see, and a second traversal to close that gap is
       not a trade worth making. ---- */
    const { width, height } = state.size;
    let nearest: ModuleKey | null = null;
    let nearestD = 0.11;
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;

    for (let i = 0; i < SUBSYSTEMS.length; i++) {
      const a = anchorRefs.current[i];
      if (!a) continue;
      a.getWorldPosition(vec);
      const wx = vec.x;
      const wy = vec.y;
      const wz = vec.z;
      vec.project(state.camera);

      const onScreen =
        vec.z < 1 &&
        vec.x > -1.25 &&
        vec.x < 1.25 &&
        vec.y > -1.2 &&
        vec.y < 1.2;

      const o = i * PROJECTED_STRIDE;
      const sxp = (vec.x * 0.5 + 0.5) * width;
      const syp = (-vec.y * 0.5 + 0.5) * height;
      projected[o] = sxp;
      projected[o + 1] = syp;
      projected[o + 2] = onScreen ? 1 : 0;
      const d = state.camera.position.distanceTo(vec.set(wx, wy, wz));
      projected[o + 3] = THREE.MathUtils.clamp(1 - (d - 3) / 10, 0.25, 1);

      if (onScreen) {
        x0 = Math.min(x0, sxp);
        y0 = Math.min(y0, syp);
        x1 = Math.max(x1, sxp);
        y1 = Math.max(y1, syp);
        if (!reduced && pulse.active) {
          /* `vec` now holds the world position again (for the depth term
             above), so the comparison is made from the projected pixels. */
          const dx = (sxp / width) * 2 - 1 - pulse.px;
          const dy = -((syp / height) * 2 - 1) - pulse.py;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < nearestD) {
            nearestD = dist;
            nearest = SUBSYSTEMS[i].key;
          }
        }
      }
    }

    if (x0 < x1) {
      pulse.rect[0] = x0 - 80;
      pulse.rect[1] = y0 - 120;
      pulse.rect[2] = x1 + 80;
      pulse.rect[3] = y1 + 160;
    } else {
      pulse.rect[0] = pulse.rect[2] = 0;
    }

    setHover(nearest);
  });

  const anchor = (i: number) => (el: THREE.Object3D | null) => {
    anchorRefs.current[i] = el;
  };
  const anchorIndex = (k: ModuleKey) =>
    SUBSYSTEMS.findIndex((s) => s.key === k);

  /* ------------------------------------------------------------------ scene */

  return (
    <>
      {/* ── the bay floor: the one thing that does not turn with the engine ── */}
      <mesh
        geometry={geo.floor}
        position={[0, -2.46, 0]}
        receiveShadow={shadows}
      >
        {/* The bay floor is the darkest thing in the scene. It exists to
            receive the engine's shadow and carry two faint graduated rings,
            and it must never read as a lit platform. */}
        <meshStandardMaterial
          color={0x05070a}
          roughness={0.9}
          metalness={0.12}
          envMapIntensity={0.18}
        />
      </mesh>
      <mesh
        geometry={geo.groove}
        material={mats.channel}
        position={[0, -2.445, 0]}
      />
      <mesh
        geometry={geo.groove2}
        material={mats.channel}
        position={[0, -2.445, 0]}
      />
      <instancedMesh
        ref={tickRef}
        args={[tickGeo, mats.silver, 72]}
        frustumCulled={false}
      />

      <group ref={root}>
        {/* ── plinth ─────────────────────────────────────────────────── */}
        <mesh
          geometry={geo.plinth}
          material={mats.anodized}
          position={[0, -2.3, 0]}
          castShadow={shadows}
          receiveShadow={shadows}
        />
        <mesh
          geometry={geo.plinthTop}
          material={mats.graphite}
          position={[0, -2.14, 0]}
          receiveShadow={shadows}
        />
        <instancedMesh
          ref={boltRef}
          args={[boltGeo, mats.silver, 20]}
          frustumCulled={false}
        />

        {/* ── lower housing, with the nameplate ──────────────────────── */}
        <mesh
          geometry={geo.drum}
          material={mats.graphite}
          position={[0, -1.6, 0]}
          castShadow={shadows}
          receiveShadow={shadows}
        />
        <mesh
          geometry={geo.drumSlit}
          material={glow.ring}
          position={[0, -1.24, 0]}
        />
        <mesh
          geometry={geo.plate}
          material={mats.silver}
          position={[0, -1.56, 1.07]}
        />
        <mesh
          geometry={geo.label}
          material={plateMat}
          position={[0, -1.56, 1.09]}
        />
        <instancedMesh
          ref={ribRef}
          args={[geo.rib, mats.brushed, 16]}
          frustumCulled={false}
          castShadow={shadows}
        />

        {/* ── lower stabilisation stack ──────────────────────────────── */}
        <group ref={lowerStack}>
          <mesh
            geometry={geo.ringA}
            material={mats.brushed}
            castShadow={shadows}
          />
          <mesh
            geometry={geo.ringB}
            material={mats.graphite}
            position={[0, 0.085, 0]}
            castShadow={shadows}
          />
          <mesh
            geometry={geo.ringC}
            material={mats.brushed}
            position={[0, 0.165, 0]}
            castShadow={shadows}
          />
          <object3D
            ref={anchor(anchorIndex("ring"))}
            position={[0.95, 0.06, 0.72]}
          />
        </group>

        {/* ── the inspection chamber ─────────────────────────────────── */}
        <group>
          <mesh
            geometry={geo.cap}
            material={mats.graphite}
            position={[0, -0.93, 0]}
          />
          <mesh
            geometry={geo.cap}
            material={mats.graphite}
            position={[0, 0.93, 0]}
          />
          <mesh
            geometry={geo.capRing}
            material={mats.silver}
            position={[0, -0.9, 0]}
          />
          <mesh
            geometry={geo.capRing}
            material={mats.silver}
            position={[0, 0.9, 0]}
          />

          {Array.from({ length: STRUTS }, (_, i) => (
            <group
              key={i}
              rotation={[0, (i / STRUTS) * Math.PI * 2 + Math.PI / 6, 0]}
            >
              <group
                ref={(el) => {
                  strutRefs.current[i] = el;
                }}
                position={[0.66, 0, 0]}
              >
                <mesh
                  geometry={geo.strut}
                  material={mats.brushed}
                  castShadow={shadows}
                />
              </group>
            </group>
          ))}

          <mesh geometry={geo.glass} material={mats.glass} />

          <group ref={core}>
            <mesh geometry={geo.spindle} material={mats.silver} />
            {[-0.6, -0.3, 0, 0.3, 0.6].map((y) => (
              <mesh
                key={y}
                geometry={geo.disc}
                material={mats.brushed}
                position={[0, y, 0]}
              />
            ))}
            <mesh geometry={geo.lattice} material={latticeMat} />
            <mesh ref={seedRef} geometry={geo.seed} material={glow.compute} />
          </group>

          <pointLight
            ref={lampRef}
            color={0x9ec8f5}
            intensity={1.2}
            distance={5}
            decay={2}
          />

          <mesh ref={scannerRef} geometry={geo.scanner}>
            <meshBasicMaterial
              color={0xbfe0ff}
              toneMapped={false}
              transparent
              opacity={0}
            />
          </mesh>

          <object3D
            ref={anchor(anchorIndex("compute"))}
            position={[0, 0.02, 0.68]}
          />
        </group>

        {/* ── upper stabilisation stack ──────────────────────────────── */}
        <group ref={upperStack}>
          <mesh
            geometry={geo.ringC}
            material={mats.brushed}
            castShadow={shadows}
          />
          <mesh
            geometry={geo.ringB}
            material={mats.graphite}
            position={[0, 0.08, 0]}
            castShadow={shadows}
          />
          <mesh
            geometry={geo.ringA}
            material={mats.brushed}
            position={[0, 0.16, 0]}
            castShadow={shadows}
          />
        </group>

        {/* ── upper housing, cooling, crown, cables ──────────────────── */}
        <group ref={upper}>
          <mesh
            geometry={geo.upperDrum}
            material={mats.anodized}
            position={[0, 1.6, 0]}
            castShadow={shadows}
            receiveShadow={shadows}
          />
          <mesh
            geometry={geo.band}
            material={glow.cooling}
            position={[0, 1.24, 0]}
          />
          <instancedMesh
            ref={finRef}
            args={[finGeo, mats.brushed, finCount]}
            frustumCulled={false}
            castShadow={shadows}
          />
          <mesh
            geometry={geo.crown}
            material={mats.graphite}
            position={[0, 2.15, 0]}
            castShadow={shadows}
          />
          <mesh
            geometry={geo.crownCap}
            material={mats.silver}
            position={[0, 2.34, 0]}
          />
          {[0, 1, 2, 3].map((i) => {
            const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
            return (
              <mesh
                key={i}
                geometry={geo.port}
                material={mats.silver}
                position={[Math.cos(a) * 0.36, 2.36, Math.sin(a) * 0.36]}
              />
            );
          })}
          <mesh geometry={cables.merged} material={mats.anodized} />
          <instancedMesh
            ref={packetRef}
            args={[packetGeo, mats.emissive, packetCount]}
            frustumCulled={false}
          />
          <object3D
            ref={anchor(anchorIndex("cooling"))}
            position={[-0.55, 1.62, 0.95]}
          />
        </group>

        {/* ── docked modules on telescoping arms ─────────────────────── */}
        {MODULES.map((m, i) => (
          <group key={i} rotation={[0, -m.angle, 0]}>
            {/* inner arm: fixed to the column */}
            <mesh
              geometry={geo.armIn}
              material={mats.graphite}
              position={[0.92, 0.12, 0]}
              castShadow={shadows}
            />

            <group
              ref={(el) => {
                carriageRefs.current[i] = el;
              }}
              position={[DOCK, 0, 0]}
            >
              <mesh
                geometry={geo.armOut}
                material={mats.brushed}
                position={[-0.5, 0.12, 0]}
                castShadow={shadows}
              />
              <mesh
                geometry={geo.elbow}
                material={mats.silver}
                position={[-0.24, 0.12, 0]}
                rotation={[Math.PI / 2, 0, 0]}
              />
              <mesh
                geometry={geo.junction}
                material={mats.anodized}
                position={[-0.34, 0.16, 0.12]}
              />
              <mesh geometry={flex} material={mats.anodized} />

              <mesh
                geometry={geo.body}
                material={mats.graphite}
                position={[0.31, 0, 0]}
                castShadow={shadows}
                receiveShadow={shadows}
              />
              <mesh
                geometry={geo.face}
                material={mats.brushed}
                position={[0.63, 0, 0]}
                castShadow={shadows}
              />
              {m.window ? (
                <mesh
                  geometry={geo.window}
                  material={mats.glass}
                  position={[0.66, 0.1, 0]}
                />
              ) : null}
              <mesh
                geometry={geo.strip}
                material={glow[m.key ?? "aux"]}
                position={[0.655, m.window ? -0.3 : 0, 0.14]}
              />
              <mesh
                geometry={ledGeo}
                material={glow[m.key ?? "aux"]}
                position={[0.66, 0.36, -0.14]}
              />
              {m.key === "io"
                ? [-0.16, -0.06, 0.04, 0.14].map((z) => (
                    <mesh
                      key={z}
                      geometry={geo.socket}
                      material={mats.anodized}
                      position={[0.665, -0.3, z]}
                    />
                  ))
                : null}
              {m.key === "sensor"
                ? [-0.17, -0.05].map((z) => (
                    <mesh
                      key={z}
                      geometry={geo.aperture}
                      material={mats.silver}
                      position={[0.665, -0.3, z]}
                    />
                  ))
                : null}
              {m.key ? (
                <object3D
                  ref={anchor(anchorIndex(m.key))}
                  position={[0.4, 0.28, 0.28]}
                />
              ) : null}
            </group>
          </group>
        ))}

        {/* ── detached components ───────────────────────────────────── */}
        {floaters > 0 ? (
          <instancedMesh
            ref={floatRef}
            args={[geo.chip, mats.brushed, floaters]}
            frustumCulled={false}
          />
        ) : null}
      </group>
    </>
  );
}

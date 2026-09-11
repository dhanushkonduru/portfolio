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
  makeMaterials,
  packetGeo,
  ringSector,
  tickGeo,
} from "./parts";
import { DOCK_RADIUS, SUBSYSTEMS, type ModuleKey } from "./stages";
import {
  getHover,
  makeConfig,
  projected,
  PROJECTED_STRIDE,
  pulse,
  readings,
  sampleStage,
  setHover,
} from "./store";

/* ============================================================================
 * SYSTEM CORE
 *
 * An AI infrastructure assembly: a compute chamber inside a shroud that opens,
 * held in layered structural plates, ringed by segmented rotors, with six
 * subsystem modules docked around it and conduits routed back to the hub.
 *
 * States are not keyframes. The stage configuration declares the machine's
 * PARAMETERS — how far the shroud is open, how far the rings have separated,
 * how hard the channels are running — and every part derives its own transform
 * from them. That is why it reads as a mechanism rather than an animation.
 *
 * One useFrame drives the whole assembly. Per-frame allocation is zero.
 * ========================================================================= */

export type Tier = "high" | "mid" | "low";

const MODULES = SUBSYSTEMS.filter((s) => s.key !== "compute");
const HUB = SUBSYSTEMS[0];

/** Conduit endpoints, in assembly space. */
const HUB_PORT = 0.56;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (a: number, b: number, rate: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-rate * dt));

export function SystemCore({
  tier,
  reduced,
}: {
  tier: Tier;
  reduced: boolean;
}) {
  const finCount = tier === "high" ? 9 : tier === "mid" ? 6 : 4;
  const ribCount = tier === "low" ? 2 : 3;
  const floaters = tier === "high" ? 7 : tier === "mid" ? 4 : 0;
  const shadows = tier === "high";

  /* ------------------------------------------------------------------ parts */

  const mats = useMemo(() => makeMaterials(), []);

  const geo = useMemo(() => {
    const g = {
      plateInner: annulus(0.78, 1.38, 0.055, 56),
      plateMid: annulus(1.26, 1.74, 0.05, 56),
      dockRing: annulus(1.8, 2.08, 0.12, 64),
      measureRing: annulus(2.62, 2.67, 0.028, 72),
      rotorA: ringSector(1.04, 1.24, 0.44, 0.1),
      rotorB: ringSector(1.46, 1.63, 0.62, 0.08),
      shell: new THREE.CylinderGeometry(0.56, 0.56, 0.74, 32, 1, true),
      cap: annulus(0.14, 0.58, 0.045, 32),
      window: new THREE.CylinderGeometry(0.5, 0.5, 0.52, 24, 1, true),
      petal: ringSector(0.62, 0.86, 1.72, 0.66),
      lattice: new THREE.IcosahedronGeometry(0.3, 1),
      seed: new THREE.SphereGeometry(0.1, 16, 12),
      chamfer: new THREE.TorusGeometry(0.575, 0.018, 6, 40),
      body: chamferBox(0.46, 0.34, 0.3, 0.03),
      face: chamferBox(0.1, 0.3, 0.26, 0.02),
      strip: new THREE.BoxGeometry(0.012, 0.2, 0.012),
      pylon: chamferBox(0.14, 0.14, 0.12, 0.02),
      chip: chamferBox(0.12, 0.12, 0.05, 0.015),
      ribbon: annulus(1.39, 1.405, 0.001, 72),
      ribbon2: annulus(2.29, 2.305, 0.001, 80),
    };
    g.shell.rotateX(Math.PI / 2);
    g.window.rotateX(Math.PI / 2);
    return g;
  }, []);

  /* Conduits are routed once and merged into a single buffer: six tubes as six
     draw calls would be six draw calls for something that never moves apart. */
  const conduits = useMemo(() => {
    const curves: THREE.CatmullRomCurve3[] = [];
    const tubes: THREE.BufferGeometry[] = [];

    for (const s of MODULES) {
      const dir = new THREE.Vector3(Math.cos(s.angle), Math.sin(s.angle), 0);
      const from = dir.clone().multiplyScalar(HUB_PORT);
      from.z = 0.14;
      const to = dir.clone().multiplyScalar(DOCK_RADIUS - 0.24);
      to.z = 0.2;

      const mid = from.clone().lerp(to, 0.5).multiplyScalar(0.94);
      mid.z = -0.12;

      const curve = new THREE.CatmullRomCurve3(
        [from, mid, to],
        false,
        "catmullrom",
        0.5,
      );
      curves.push(curve);
      tubes.push(new THREE.TubeGeometry(curve, 22, 0.018, 5, false));
    }

    const merged = mergeGeometries(tubes, false)!;
    for (const t of tubes) t.dispose();

    /* Packets read a precomputed table rather than calling getPointAt, which
       does an arc-length lookup per call. 64 samples per route is finer than
       a packet can be seen to step. */
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

  /* Per-module emissive, so a module can brighten without every other module
     brightening with it. */
  const moduleMats = useMemo(
    () =>
      MODULES.map(
        () =>
          new THREE.MeshBasicMaterial({
            color: 0x9fcdf7,
            toneMapped: false,
            transparent: true,
            opacity: 0.55,
          }),
      ),
    [],
  );

  useLayoutEffect(() => {
    const g = geo;
    const m = mats;
    const mm = moduleMats;
    const c = conduits;
    return () => {
      for (const x of Object.values(g)) x.dispose();
      for (const x of Object.values(m)) x.dispose();
      for (const x of mm) x.dispose();
      c.merged.dispose();
    };
  }, [geo, mats, moduleMats, conduits]);

  /* -------------------------------------------------------------- transforms */

  const root = useRef<THREE.Group>(null);
  const rotorA = useRef<THREE.Group>(null);
  const rotorB = useRef<THREE.Group>(null);
  const measure = useRef<THREE.Group>(null);
  const plateA = useRef<THREE.Group>(null);
  const plateB = useRef<THREE.Group>(null);
  const dock = useRef<THREE.Group>(null);
  const petals = useRef<THREE.Group>(null);
  const latticeRef = useRef<THREE.Mesh>(null);
  const seedRef = useRef<THREE.Mesh>(null);
  const lampRef = useRef<THREE.PointLight>(null);
  const moduleRefs = useRef<(THREE.Group | null)[]>([]);
  const floatRef = useRef<THREE.InstancedMesh>(null);
  const packetRef = useRef<THREE.InstancedMesh>(null);
  const boltRef = useRef<THREE.InstancedMesh>(null);
  const tickRef = useRef<THREE.InstancedMesh>(null);
  const ribbonA = useRef<THREE.Mesh>(null);
  const ribbonB = useRef<THREE.Mesh>(null);

  /* Static instancing — connectors and graduations never move relative to the
     plate they are bolted to, so their matrices are written once. */
  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();

    if (boltRef.current) {
      const n = boltRef.current.count;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        dummy.position.set(1.94 * Math.cos(a), 1.94 * Math.sin(a), 0);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        boltRef.current.setMatrixAt(i, dummy.matrix);
      }
      boltRef.current.instanceMatrix.needsUpdate = true;
    }

    if (tickRef.current) {
      const n = tickRef.current.count;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const long = i % 6 === 0;
        dummy.position.set(2.72 * Math.cos(a), 2.72 * Math.sin(a), 0);
        dummy.rotation.set(0, 0, a);
        dummy.scale.set(long ? 3.4 : 1.6, 1, 1);
        dummy.updateMatrix();
        tickRef.current.setMatrixAt(i, dummy.matrix);
      }
      dummy.scale.set(1, 1, 1);
      tickRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  /* Detached components: radius, phase, rate and size, fixed per piece. */
  const floatSeeds = useMemo(
    () =>
      Array.from({ length: floaters }, (_, i) => ({
        r: 2.95 + (i % 3) * 0.28,
        phase: (i / Math.max(1, floaters)) * Math.PI * 2,
        rate: 0.035 + (i % 4) * 0.012,
        z: ((i % 5) - 2) * 0.22,
        size: 0.45 + ((i * 37) % 10) / 22,
      })),
    [floaters],
  );

  /* -------------------------------------------------------------- the loop */

  const cfg = useMemo(makeConfig, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const vec = useMemo(() => new THREE.Vector3(), []);
  const lift = useRef<number[]>(MODULES.map(() => 0));
  const px = useRef(0);
  const py = useRef(0);
  const fpsAcc = useRef({ t: 0, n: 0 });

  const packetCount = tier === "low" ? 12 : tier === "mid" ? 18 : 24;

  useFrame((state, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const t = state.clock.elapsedTime;
    sampleStage(pulse.p, cfg);

    /* Pointer, damped. Raw pointer on a 3D transform reads as a toy; damped
       at this rate it reads as an object with mass. */
    const rate = reduced ? 0 : 3.2;
    px.current = reduced ? 0 : damp(px.current, pulse.px, rate, dt);
    py.current = reduced ? 0 : damp(py.current, pulse.py, rate, dt);
    pulse.sx = px.current;
    pulse.sy = py.current;

    const idle = reduced ? 0 : t;
    const hovered = getHover();

    /* ---- the assembly as a whole ---- */
    if (root.current) {
      root.current.rotation.y = cfg.spin + px.current * 0.1;
      root.current.rotation.x = cfg.tilt - py.current * 0.07;
      root.current.rotation.z = Math.sin(idle * 0.11) * 0.013;
      root.current.position.y = Math.sin(idle * 0.26) * 0.03;
      root.current.position.x = px.current * 0.05;
      root.current.scale.setScalar(cfg.scale);
    }

    /* ---- rotors. Differential rates: a machine, not a turntable. ---- */
    if (rotorA.current) rotorA.current.rotation.z = idle * 0.055;
    if (rotorB.current) rotorB.current.rotation.z = -idle * 0.038 + 0.4;
    if (measure.current) measure.current.rotation.z = idle * 0.021;

    /* ---- structural plates separate along the axis ---- */
    const sp = cfg.spread;
    if (plateA.current) plateA.current.position.z = -0.3 - sp * 0.72;
    if (plateB.current) plateB.current.position.z = 0.26 + sp * 0.6;
    if (dock.current) dock.current.position.z = 0.14 + sp * 0.18;
    if (rotorA.current) rotorA.current.position.z = -0.08 - sp * 0.34;
    if (rotorB.current) rotorB.current.position.z = 0.1 + sp * 0.3;
    if (measure.current) measure.current.position.z = -sp * 0.5;

    /* ---- the shroud opens ---- */
    if (petals.current) {
      const kids = petals.current.children;
      for (let i = 0; i < kids.length; i++) {
        const inner = kids[i].children[0];
        if (!inner) continue;
        inner.position.x = cfg.open * 0.26;
        inner.rotation.y = -cfg.open * 0.78;
      }
    }

    /* ---- internal illumination ---- */
    const rev = cfg.reveal;
    if (latticeRef.current) {
      const s = 1 + Math.sin(idle * 1.4) * 0.018;
      latticeRef.current.scale.setScalar(s);
      latticeRef.current.rotation.x = idle * 0.16;
      latticeRef.current.rotation.y = idle * 0.11;
      (latticeRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.14 + rev * 0.5;
    }
    if (seedRef.current) {
      (seedRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.3 + rev * 0.68;
      seedRef.current.scale.setScalar(0.85 + rev * 0.3);
    }
    if (lampRef.current) lampRef.current.intensity = 0.35 + rev * 2.4;
    mats.glass.opacity = 0.16 + cfg.open * 0.2;

    /* ---- data channels ---- */
    const flowLevel = cfg.flow;
    mats.channel.opacity = 0.1 + rev * flowLevel * 0.42;
    if (ribbonA.current) ribbonA.current.rotation.z = idle * 0.14;
    if (ribbonB.current) ribbonB.current.rotation.z = -idle * 0.09;

    /* ---- modules ---- */
    let nearest: ModuleKey | null = null;
    let nearestD = 0.085;

    for (let i = 0; i < MODULES.length; i++) {
      const g = moduleRefs.current[i];
      if (!g) continue;
      const s = MODULES[i];

      const wanted = hovered === s.key ? 1 : 0;
      lift.current[i] = damp(lift.current[i], wanted, 6, dt);
      const out = DOCK_RADIUS + sp * 0.38 + lift.current[i] * 0.075;

      g.position.set(Math.cos(s.angle) * out, Math.sin(s.angle) * out, 0.2);
      g.rotation.z = s.angle;
      g.rotation.y = lift.current[i] * 0.1;

      moduleMats[i].opacity =
        0.2 + rev * 0.4 + lift.current[i] * 0.4 + flowLevel * 0.15;
    }

    /* ---- packets travelling the routes ---- */
    if (packetRef.current) {
      const { table, samples, routes } = conduits;
      const speed = 0.12 + flowLevel * 0.55;
      for (let i = 0; i < packetCount; i++) {
        const route = i % routes;
        const offset = Math.floor(i / routes) / Math.ceil(packetCount / routes);
        const u = (t * speed + offset + route * 0.13) % 1;
        const si = Math.min(samples - 1, Math.floor(u * (samples - 1)));
        const o = (route * samples + si) * 3;
        dummy.position.set(table[o], table[o + 1], table[o + 2]);
        const fade = Math.sin(u * Math.PI);
        dummy.scale.setScalar(0.4 + fade * 0.8);
        dummy.updateMatrix();
        packetRef.current.setMatrixAt(i, dummy.matrix);
      }
      packetRef.current.instanceMatrix.needsUpdate = true;
      (packetRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.25 + flowLevel * 0.7;
    }

    /* ---- detached components ---- */
    if (floatRef.current && floaters) {
      for (let i = 0; i < floaters; i++) {
        const f = floatSeeds[i];
        const a = f.phase + idle * f.rate;
        const r = f.r + sp * 0.5;
        dummy.position.set(
          Math.cos(a) * r,
          Math.sin(a) * r,
          f.z + Math.sin(idle * 0.4 + f.phase) * 0.1,
        );
        dummy.rotation.set(a * 0.6, a * 0.4, a);
        dummy.scale.setScalar(f.size);
        dummy.updateMatrix();
        floatRef.current.setMatrixAt(i, dummy.matrix);
      }
      floatRef.current.instanceMatrix.needsUpdate = true;
      dummy.scale.setScalar(1);
    }

    /* ---- annotations: project the anchors, and pick by proximity ----
       The world matrices read here are the ones three computed for the last
       rendered frame, so a label trails its part by a single frame. Forcing a
       second traversal of the whole assembly every frame to close a 16ms gap
       nobody can see is not a trade worth making. */
    if (root.current) {
      const { width, height } = state.size;
      for (let i = 0; i < SUBSYSTEMS.length; i++) {
        const s = SUBSYSTEMS[i];
        if (i === 0) {
          vec.set(...HUB.anchor);
          vec.applyMatrix4(root.current.matrixWorld);
        } else {
          const g = moduleRefs.current[i - 1];
          if (!g) continue;
          g.getWorldPosition(vec);
        }

        const wx = vec.x;
        const wy = vec.y;
        const wz = vec.z;
        vec.project(state.camera);

        /* Behind the camera, or outside the frustum with a margin: the label
           is withheld rather than pinned to an edge. */
        const onScreen =
          vec.z < 1 &&
          vec.x > -1.25 &&
          vec.x < 1.25 &&
          vec.y > -1.2 &&
          vec.y < 1.2;

        const o = i * PROJECTED_STRIDE;
        projected[o] = (vec.x * 0.5 + 0.5) * width;
        projected[o + 1] = (-vec.y * 0.5 + 0.5) * height;
        projected[o + 2] = onScreen ? 1 : 0;
        /* Depth, normalised into a presence falloff: a module on the far side
           of the assembly should not shout as loudly as one facing us. */
        const d = state.camera.position.distanceTo(vec.set(wx, wy, wz));
        projected[o + 3] = THREE.MathUtils.clamp(1 - (d - 4) / 9, 0.25, 1);

        if (onScreen && !reduced && pulse.active && i > 0) {
          const dx = (projected[o] / width) * 2 - 1 - pulse.px;
          const dy = -((projected[o + 1] / height) * 2 - 1) - pulse.py;
          const dist = dx * dx + dy * dy;
          if (dist < nearestD * nearestD) {
            nearestD = Math.sqrt(dist);
            nearest = s.key;
          }
        }
      }
    }

    setHover(nearest);

    /* ---- readings ---- */
    const acc = fpsAcc.current;
    acc.t += dt;
    acc.n += 1;
    if (acc.t >= 0.5) {
      readings.fps = Math.round(acc.n / acc.t);
      acc.t = 0;
      acc.n = 0;
    }
  });

  /* ------------------------------------------------------------------ scene */

  return (
    <group ref={root}>
      {/* ── structural plates ───────────────────────────────────────── */}
      <group ref={plateA}>
        <mesh
          geometry={geo.plateInner}
          material={mats.graphite}
          castShadow={shadows}
          receiveShadow={shadows}
        />
      </group>

      <group ref={plateB}>
        <mesh
          geometry={geo.plateMid}
          material={mats.anodized}
          castShadow={shadows}
          receiveShadow={shadows}
        />
      </group>

      {/* ── docking ring, with its connectors ───────────────────────── */}
      <group ref={dock}>
        <mesh
          geometry={geo.dockRing}
          material={mats.graphite}
          castShadow={shadows}
          receiveShadow={shadows}
        />
        <instancedMesh
          ref={boltRef}
          args={[boltGeo, mats.silver, 24]}
          frustumCulled={false}
        />
      </group>

      {/* ── rotors: segmented rings, counter-rotating ───────────────── */}
      <group ref={rotorA}>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh
            key={i}
            geometry={geo.rotorA}
            material={mats.brushed}
            rotation={[0, 0, (i / 9) * Math.PI * 2]}
            castShadow={shadows}
          />
        ))}
      </group>

      <group ref={rotorB}>
        {Array.from({ length: 7 }, (_, i) => (
          <mesh
            key={i}
            geometry={geo.rotorB}
            material={mats.graphite}
            rotation={[0, 0, (i / 7) * Math.PI * 2]}
            castShadow={shadows}
          />
        ))}
      </group>

      {/* ── outer measurement ring ──────────────────────────────────── */}
      <group ref={measure}>
        <mesh geometry={geo.measureRing} material={mats.brushed} />
        <instancedMesh
          ref={tickRef}
          args={[tickGeo, mats.silver, 72]}
          frustumCulled={false}
        />
      </group>

      {/* ── data channels ───────────────────────────────────────────── */}
      <mesh ref={ribbonA} geometry={geo.ribbon} material={mats.channel} />
      <mesh ref={ribbonB} geometry={geo.ribbon2} material={mats.channel} />

      {/* ── conduits, merged ────────────────────────────────────────── */}
      <mesh geometry={conduits.merged} material={mats.anodized} />

      <instancedMesh
        ref={packetRef}
        args={[packetGeo, mats.emissive, packetCount]}
        frustumCulled={false}
      />

      {/* ── the compute chamber ─────────────────────────────────────── */}
      <group>
        <mesh
          geometry={geo.shell}
          material={mats.anodized}
          castShadow={shadows}
          receiveShadow={shadows}
        />
        <mesh
          geometry={geo.cap}
          material={mats.graphite}
          position={[0, 0, 0.37]}
        />
        <mesh
          geometry={geo.cap}
          material={mats.graphite}
          position={[0, 0, -0.37]}
        />
        <mesh
          geometry={geo.chamfer}
          material={mats.silver}
          position={[0, 0, 0.33]}
        />
        <mesh
          geometry={geo.chamfer}
          material={mats.silver}
          position={[0, 0, -0.33]}
        />
        <mesh geometry={geo.window} material={mats.glass} />

        <mesh ref={latticeRef} geometry={geo.lattice}>
          <meshBasicMaterial
            color={0x9fcdf7}
            wireframe
            toneMapped={false}
            transparent
            opacity={0.3}
          />
        </mesh>
        <mesh ref={seedRef} geometry={geo.seed}>
          <meshBasicMaterial
            color={0xd7ebff}
            toneMapped={false}
            transparent
            opacity={0.7}
          />
        </mesh>
        <pointLight
          ref={lampRef}
          color={0x9ec8f5}
          intensity={1.2}
          distance={5.5}
          decay={2}
        />

        {/* shroud: three petals that swing clear */}
        <group ref={petals}>
          {[0, 1, 2].map((i) => (
            <group key={i} rotation={[0, 0, (i / 3) * Math.PI * 2 + 0.5]}>
              <group>
                <mesh
                  geometry={geo.petal}
                  material={mats.graphite}
                  castShadow={shadows}
                />
              </group>
            </group>
          ))}
        </group>
      </group>

      {/* ── docked subsystem modules ────────────────────────────────── */}
      {MODULES.map((s, i) => (
        <group
          key={s.key}
          ref={(el) => {
            moduleRefs.current[i] = el;
          }}
        >
          <mesh
            geometry={geo.body}
            material={mats.graphite}
            castShadow={shadows}
            receiveShadow={shadows}
          />
          <mesh
            geometry={geo.face}
            material={mats.brushed}
            position={[0.26, 0, 0]}
            castShadow={shadows}
          />
          <mesh
            geometry={geo.strip}
            material={moduleMats[i]}
            position={[0.32, 0, 0]}
          />
          <mesh
            geometry={ledGeo}
            material={moduleMats[i]}
            position={[0.3, 0.11, 0.09]}
          />
          <mesh
            geometry={geo.pylon}
            material={mats.anodized}
            position={[-0.27, 0, 0]}
          />
          <mesh
            geometry={geo.chip}
            material={mats.silver}
            position={[0, 0, 0.17]}
          />

          {/* Cooling wears a full fin stack; every other module wears ribs. */}
          <Fins
            count={s.key === "cooling" ? finCount : ribCount}
            material={mats.brushed}
            shadows={shadows}
          />
        </group>
      ))}

      {/* ── detached components ─────────────────────────────────────── */}
      {floaters > 0 ? (
        <instancedMesh
          ref={floatRef}
          args={[geo.chip, mats.brushed, floaters]}
          frustumCulled={false}
        />
      ) : null}
    </group>
  );
}

/** A fin stack, instanced. Cooling geometry is repetition — so is instancing. */
function Fins({
  count,
  material,
  shadows,
}: {
  count: number;
  material: THREE.Material;
  shadows: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const d = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      d.position.set(-0.04, 0, -0.16 + (i / Math.max(1, count - 1)) * 0.32);
      d.rotation.set(0, Math.PI / 2, 0);
      d.updateMatrix();
      ref.current.setMatrixAt(i, d.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  }, [count]);

  return (
    <instancedMesh
      ref={ref}
      args={[finGeo, material, count]}
      castShadow={shadows}
      frustumCulled={false}
    />
  );
}

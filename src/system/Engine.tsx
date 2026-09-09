"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { stage, readings } from "./stageStore";
import { signal } from "./audio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  columnGeo, plateGeo, corePlateGeo, gyroGeo,
  sensorHeadGeo, controlGeo, strutGeo, railGeo,
} from "./engineParts";

/* ============================================================================
 * THE ENGINE
 *
 * A computational apparatus that comes apart. Seven subsystems, each with its
 * own geometry, material and mechanical role:
 *
 *   A01 CORE       a twisted stack of processor plates on the vertical spine
 *   B02 FRAME      an open rectangular exoskeleton, four columns and two decks
 *   C03 ROTOR      two gyro rings running on the spine
 *   D04 SENSING    an asymmetric mast aimed inward at the core
 *   E05 CONTROL    a chamfered block on a single frame corner
 *   F06 SIGNAL     rails carrying between control, core and sensor
 *   G07 SUPPORT    angled struts bracing the deck to the columns
 *
 * Nothing here emits. There is no bloom, no additive blending and no glowing
 * core: the machine is revealed by a key light and read through silhouette,
 * occlusion and material separation. It must never be the brightest thing on
 * the page — the typography is.
 * ========================================================================= */

type Config = {
  label: string;
  /** Frame columns and decks push outward. */
  frame: number;
  /** Core plates fan apart along the spine. */
  fan: number;
  /** Whole-assembly radial separation. */
  explode: number;
  /** Sensor mast extension. */
  mast: number;
  /** Control block offset. */
  control: number;
  /** Signal rails present, 0..1. */
  bus: number;
  /** Gyro ring separation and tilt. */
  gyro: number;
  /** Technical annotation layer, 0..1. */
  guides: number;
};

const CONFIGS: Config[] = [
  // 00 hero · COMPLETE — assembled, closed, barely moving
  { label: "COMPLETE", frame: 0, fan: 0, explode: 0, mast: 0, control: 0, bus: 0.1, gyro: 0, guides: 0 },
  // 01 approach · CALIBRATION — small adjustments, rings align
  { label: "CALIBRATION", frame: 0.1, fan: 0.08, explode: 0.04, mast: 0.15, control: 0.05, bus: 0.3, gyro: 0.25, guides: 0.2 },
  // 02 stack · EXPOSURE — the outer frame opens
  { label: "EXPOSURE", frame: 0.55, fan: 0.3, explode: 0.18, mast: 0.5, control: 0.35, bus: 0.55, gyro: 0.5, guides: 0.4 },
  // 03 work · VALIDATION — everything aligns into a verified configuration
  { label: "VALIDATION", frame: 0.4, fan: 0.45, explode: 0.14, mast: 0.7, control: 0.4, bus: 0.95, gyro: 0.7, guides: 0.75 },
  // 04 research · EXPLODED — the major event, full architecture visible
  { label: "EXPLODED", frame: 1, fan: 1, explode: 1, mast: 1, control: 1, bus: 0.7, gyro: 1, guides: 1 },
  // 05 journey · RECONSTRUCTION — components return, housing closes
  { label: "RECONSTRUCTION", frame: 0.3, fan: 0.22, explode: 0.12, mast: 0.35, control: 0.2, bus: 0.5, gyro: 0.35, guides: 0.35 },
  // 06 contact · RESOLVED — compact and quiet, the closing signature
  { label: "RESOLVED", frame: 0, fan: 0, explode: 0, mast: 0, control: 0, bus: 0.05, gyro: 0, guides: 0 },
];

const lerp = THREE.MathUtils.lerp;

function token(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/* Clear regions, injected into the standard material so the machine yields
   locally where the page has registered type instead of the whole scene
   dimming. Standard PBR keeps its shading; only opacity is attenuated. */
function withClearZones(mat: THREE.MeshStandardMaterial) {
  mat.transparent = true;
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uClear = { value: [new THREE.Vector4(), new THREE.Vector4()] };
    shader.uniforms.uClearCount = { value: 0 };
    shader.uniforms.uClearAmt = { value: 0 };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n varying float vAtt;\n uniform vec4 uClear[2];\n uniform float uClearCount;\n uniform float uClearAmt;`)
      .replace("#include <fog_vertex>", `#include <fog_vertex>
        vec2 ndc = gl_Position.xy / gl_Position.w;
        float att = 1.0;
        for (int i = 0; i < 2; i++) {
          float on = step(float(i), uClearCount - 0.5);
          vec4 r = uClear[i];
          vec2 dd = abs(ndc - r.xy) / max(r.zw, vec2(1e-4));
          float inside = 1.0 - smoothstep(0.75, 1.5, max(dd.x, dd.y));
          att *= mix(1.0, mix(1.0, 0.16, inside * uClearAmt), on);
        }
        vAtt = att;`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n varying float vAtt;`)
      .replace("#include <opaque_fragment>", `#include <opaque_fragment>\n gl_FragColor.a *= vAtt;`);
    (mat as THREE.MeshStandardMaterial & { userData: { shader?: THREE.WebGLProgramParametersWithUniforms } }).userData.shader = shader;
  };
  return mat;
}

function pushClear(mat: THREE.MeshStandardMaterial, dt: number) {
  const sh = (mat as THREE.MeshStandardMaterial & { userData: { shader?: { uniforms: Record<string, { value: unknown }> } } })
    .userData.shader;
  if (!sh) return;
  const rects = sh.uniforms.uClear.value as THREE.Vector4[];
  for (let k = 0; k < 2; k++) {
    rects[k].set(stage.clear[k * 4], stage.clear[k * 4 + 1], stage.clear[k * 4 + 2], stage.clear[k * 4 + 3]);
  }
  sh.uniforms.uClearCount.value = stage.clearCount;
  const cur = sh.uniforms.uClearAmt.value as number;
  sh.uniforms.uClearAmt.value = cur + (stage.clearAmount - cur) * Math.min(1, dt * 4);
}

function Apparatus({ reduced, quality }: { reduced: boolean; quality: number }) {
  const root = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  const plateRefs = useRef<(THREE.Mesh | null)[]>([]);
  const colRefs = useRef<(THREE.Mesh | null)[]>([]);
  const deckRefs = useRef<(THREE.Mesh | null)[]>([]);
  const gyroRefs = useRef<(THREE.Mesh | null)[]>([]);
  const mastRef = useRef<THREE.Group>(null);
  const ctrlRef = useRef<THREE.Mesh>(null);
  const busRef = useRef<THREE.Group>(null);
  const inspRef = useRef(0);

  const PLATES = 5;
  const H = 2.5;

  const geos = useMemo(
    () => ({
      col: columnGeo(H),
      deck: plateGeo(1.9, 1.9),
      plate: corePlateGeo(0.86),
      gyroA: gyroGeo(1.12),
      gyroB: gyroGeo(0.86, 0.04),
      head: sensorHeadGeo(),
      ctrl: controlGeo(),
      strut: strutGeo(0.9),
      rail: railGeo(1.5),
      mastArm: strutGeo(1.4),
    }),
    [],
  );

  /* Three materials, and the structure is readable because they differ:
     graphite frame, machined metal for anything that moves, matte ceramic
     for the control housing. */
  const mats = useMemo(() => {
    const graphite = withClearZones(
      new THREE.MeshStandardMaterial({ color: new THREE.Color("#3f454c"), metalness: 0.6, roughness: 0.62 }),
    );
    const machined = withClearZones(
      new THREE.MeshStandardMaterial({ color: new THREE.Color("#9aa2ab"), metalness: 0.95, roughness: 0.28 }),
    );
    const ceramic = withClearZones(
      new THREE.MeshStandardMaterial({ color: new THREE.Color("#c8c2b4"), metalness: 0.08, roughness: 0.8 }),
    );
    // The only colour in the machine, and only on the sensing subsystem.
    const accent = withClearZones(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(token("--color-cyan", "#56c6f5")).multiplyScalar(0.55),
        metalness: 0.4,
        roughness: 0.5,
      }),
    );
    return { graphite, machined, ceramic, accent };
  }, []);

  useFrame((_, rawDt) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 30);
    const last = CONFIGS.length - 1;
    const p = THREE.MathUtils.clamp(stage.p, 0, last);
    const i0 = Math.floor(p);
    const i1 = Math.min(i0 + 1, last);
    const raw = p - i0;
    const t = raw * raw * (3 - 2 * raw);
    const A = CONFIGS[i0], B = CONFIGS[i1];
    const m = (k: keyof Config) => lerp(A[k] as number, B[k] as number, t);

    let insp = inspRef.current;
    insp += (stage.inspect - insp) * Math.min(1, dt * 2);
    const frame = Math.min(1.3, m("frame") + insp * 0.3);
    const fan = Math.min(1.3, m("fan") + insp * 0.3);
    const explode = Math.min(1.3, m("explode") + insp * 0.25);
    const mast = m("mast");
    const control = m("control");
    const gyro = m("gyro");
    const now = performance.now() * 0.001;
    const idle = (reduced ? 0 : 1) * (1 - insp * 0.7);
    const sig = signal.level;

    // ---- A01 core: the stack fans along the spine and twists ----
    for (let i = 0; i < PLATES; i++) {
      const q = plateRefs.current[i];
      if (!q) continue;
      const k = i - (PLATES - 1) / 2;
      q.position.y = k * (0.13 + fan * 0.42);
      // Each plate is rotated a fixed amount from its neighbour, so the stack
      // reads as machined rather than merely repeated.
      q.rotation.y = k * 0.28 + now * 0.07 * idle + fan * k * 0.22;
      q.scale.setScalar(1 - Math.abs(k) * 0.06);
    }
    if (coreRef.current) {
      coreRef.current.position.set(0, Math.sin(now * 1.1) * 0.004 * idle + sig * 0.02, 0);
    }

    // ---- B02 frame: columns move out, decks separate vertically ----
    for (let i = 0; i < 4; i++) {
      const c = colRefs.current[i];
      if (!c) continue;
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const d = 1.02 + frame * 0.85 + explode * 0.7;
      c.position.set(Math.cos(a) * d, 0, Math.sin(a) * d);
      c.rotation.z = frame * 0.14 * (i % 2 ? 1 : -1);
    }
    for (let i = 0; i < 2; i++) {
      const d = deckRefs.current[i];
      if (!d) continue;
      const s = i === 0 ? 1 : -1;
      d.position.y = s * (H / 2 + frame * 0.75 + explode * 0.5);
      d.rotation.y = now * 0.05 * idle * s + frame * 0.2 * s;
    }

    // ---- C03 rotor: gyro rings separate and tilt ----
    for (let i = 0; i < 2; i++) {
      const r = gyroRefs.current[i];
      if (!r) continue;
      const s = i === 0 ? 1 : -1;
      r.position.y = s * gyro * 0.62;
      r.rotation.y = now * (0.18 + i * 0.12) * idle * s;
      r.rotation.z = gyro * 0.34 * s;
      r.rotation.x = gyro * 0.16 * -s;
    }

    // ---- D04 sensing: the mast extends and keeps its head on the core ----
    if (mastRef.current) {
      mastRef.current.position.x = -1.45 - mast * 1.15 - explode * 0.6;
      mastRef.current.position.y = 0.35 + mast * 0.5;
      mastRef.current.rotation.z = -0.18 - mast * 0.16;
    }

    // ---- E05 control: the block slides off its corner ----
    if (ctrlRef.current) {
      ctrlRef.current.position.set(
        0.92 + control * 1.35 + explode * 0.6,
        -0.62 - control * 0.55,
        0.62 + control * 0.8,
      );
      ctrlRef.current.rotation.y = 0.4 + control * 0.3;
    }

    // ---- F06 signal: the bus is present in proportion to activity ----
    if (busRef.current) {
      const b = m("bus");
      busRef.current.scale.setScalar(0.001 + b);
      busRef.current.rotation.y = now * 0.04 * idle;
    }

    // ---- placement across the page ----
    const place = [
      [1.9, 0.0, 0.72],
      [1.3, 0.15, 0.62],
      [-0.5, 0.1, 0.58],
      [-1.8, 0.2, 0.62],
      [0.3, 0, 0.5],
      [1.4, 0.15, 0.58],
      [0, 0, 0.52],
    ];
    const c0 = place[i0], c1 = place[i1];
    const ox = lerp(c0[0], c1[0], t);
    const oy = lerp(c0[1], c1[1], t);
    const sc = lerp(c0[2], c1[2], t);
    const ease = Math.min(1, dt * 2.2);
    g.position.x += (ox + stage.px * 0.16 - g.position.x) * ease;
    g.position.y += (oy + stage.py * 0.1 - g.position.y) * ease;
    g.scale.setScalar(g.scale.x + (sc - g.scale.x) * ease);
    if (!reduced) {
      // A specimen being turned slowly on a bench, not a camera move.
      const spin = 0.5 + stage.progress * Math.PI * 0.8;
      g.rotation.y += (spin + stage.px * 0.14 - g.rotation.y) * Math.min(1, dt * 2.2);
      g.rotation.x += (0.16 - stage.py * 0.1 - g.rotation.x) * Math.min(1, dt * 2);
    }

    Object.values(mats).forEach((mm) => pushClear(mm, dt));

    readings.nodes = 4 + PLATES + 2 + 2 + 1;
    readings.links = Math.round(m("bus") * 6);
    readings.segments = Math.round(frame * 100);
    readings.load = 0.3 + explode * 0.4;
    readings.state = i0;
    readings.signal = sig;
    readings.config = A.label;
    readings.explode = explode;
    inspRef.current = insp;
  });

  const reg =
    <T,>(arr: React.RefObject<(T | null)[]>, i: number) =>
    (el: T | null) => {
      arr.current[i] = el;
    };

  return (
    <group ref={root}>
      {/* B02 FRAME */}
      {Array.from({ length: 4 }, (_, i) => (
        <mesh key={`c${i}`} ref={reg(colRefs, i)} geometry={geos.col} material={mats.graphite} castShadow />
      ))}
      {Array.from({ length: 2 }, (_, i) => (
        <mesh key={`d${i}`} ref={reg(deckRefs, i)} geometry={geos.deck} material={mats.graphite} />
      ))}

      {/* A01 CORE */}
      <group ref={coreRef}>
        {Array.from({ length: PLATES }, (_, i) => (
          <mesh key={`p${i}`} ref={reg(plateRefs, i)} geometry={geos.plate} material={i === 2 ? mats.machined : mats.graphite} />
        ))}
      </group>

      {/* C03 ROTOR */}
      {Array.from({ length: 2 }, (_, i) => (
        <mesh key={`g${i}`} ref={reg(gyroRefs, i)} geometry={i === 0 ? geos.gyroA : geos.gyroB} material={mats.machined} />
      ))}

      {/* D04 SENSING — the asymmetry that makes the silhouette its own */}
      <group ref={mastRef}>
        <mesh geometry={geos.mastArm} material={mats.machined} rotation={[0, 0, Math.PI / 2]} />
        <mesh geometry={geos.head} material={mats.accent} position={[0.75, 0, 0]} />
      </group>

      {/* E05 CONTROL */}
      <mesh ref={ctrlRef} geometry={geos.ctrl} material={mats.ceramic} />

      {/* F06 SIGNAL */}
      <group ref={busRef}>
        <mesh geometry={geos.rail} material={mats.machined} position={[0.62, -0.4, 0]} rotation={[0, 0.5, 0]} />
        <mesh geometry={geos.rail} material={mats.machined} position={[-0.62, 0.3, 0.2]} rotation={[0, -0.6, 0]} />
      </group>

      {/* G07 SUPPORT */}
      {quality > 0
        ? Array.from({ length: 3 }, (_, i) => {
            const a = (i / 3) * Math.PI * 2;
            return (
              <mesh
                key={`s${i}`}
                geometry={geos.strut}
                material={mats.graphite}
                position={[Math.cos(a) * 0.7, -H / 2 + 0.35, Math.sin(a) * 0.7]}
                rotation={[0.5, a, 0.3]}
              />
            );
          })
        : null}
    </group>
  );
}

/** Studio environment at low intensity — enough to describe metal, not to light the page. */
function Studio() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.5;
    return () => {
      env.texture.dispose();
      pmrem.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);
  return null;
}

export function Engine() {
  const reduced = useReducedMotion();
  const [awake, setAwake] = useState(true);

  const cfg = useMemo(() => {
    if (typeof window === "undefined") return { dpr: 1, span: 7.4, quality: 1 };
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 900;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (coarse || narrow) return { dpr: 1, span: 9.6, quality: 0 };
    if (mem !== undefined && mem <= 4) return { dpr: 1.4, span: 7.4, quality: 1 };
    return { dpr: 2, span: 7.4, quality: 1 };
  }, []);

  useEffect(() => {
    const onVis = () => setAwake(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, cfg.dpr]}
        camera={{ position: [0, 0.9, 9.5], fov: 32 }}
        frameloop={awake ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Studio />
        {/* Key, fill, rim. Nothing in the scene emits. */}
        <directionalLight position={[4, 6, 5]} intensity={2.4} color={"#fff6e8"} />
        <directionalLight position={[-5, 1, -3]} intensity={0.9} color={"#8fa8c8"} />
        <hemisphereLight args={["#4a525c", "#0a0b0d", 0.5]} />
        <Apparatus reduced={reduced} quality={cfg.quality} />
      </Canvas>
    </div>
  );
}

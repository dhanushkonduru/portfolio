"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { stage, readings } from "./stageStore";
import { signal } from "./audio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { coreGeo, ringGeo, panelGeo, sensorGeo, plateGeo, strutGeo } from "./machineParts";

/* ============================================================================
 * THE VERIFIER
 *
 * A bench instrument: a faceted computation core held in a three-axis
 * structural gimbal, interrogated by sensor pods aimed inward at it, reporting
 * to a control plate, inside a shell that opens.
 *
 * States are not keyframes. Each state declares the machine's PARAMETERS —
 * how far the shell is open, how far the rings have spread, how much the
 * assembly is exploded — and every part derives its own transform from them.
 * That is why it reads as a mechanism rather than an animation: the parts move
 * because the machine is in a configuration, not because they were told to.
 *
 * All line work, no lit surfaces, so it belongs to the paper.
 * ========================================================================= */

type Config = {
  label: string;
  shellOpen: number;
  shellOp: number;
  ringSpread: number;
  ringTilt: number;
  explode: number;
  sensorOut: number;
  sensorOp: number;
  coreScale: number;
  coreOp: number;
  plateOp: number;
  plateDrop: number;
  signal: number;
  guideOp: number;
};

const CONFIGS: Config[] = [
  // 00 index · IDLE — closed, compact, one clean form
  { label: "IDLE", shellOpen: 0, shellOp: 0.9, ringSpread: 0, ringTilt: 0, explode: 0,
    sensorOut: 0, sensorOp: 0.3, coreScale: 1, coreOp: 0.85, plateOp: 0.2, plateDrop: 0, signal: 0, guideOp: 0 },
  // 01 approach · STARTUP — the shell parts, structure becomes visible
  { label: "STARTUP", shellOpen: 0.35, shellOp: 1, ringSpread: 0.18, ringTilt: 0.1, explode: 0.05,
    sensorOut: 0.2, sensorOp: 0.7, coreScale: 1.05, coreOp: 0.95, plateOp: 0.5, plateDrop: 0.15, signal: 0.1, guideOp: 0.15 },
  // 02 stack · SYSTEM — subsystems separate and address each other
  { label: "SYSTEM", shellOpen: 0.8, shellOp: 0.85, ringSpread: 0.5, ringTilt: 0.35, explode: 0.2,
    sensorOut: 0.55, sensorOp: 0.95, coreScale: 1.1, coreOp: 1, plateOp: 0.8, plateDrop: 0.4, signal: 0.4, guideOp: 0.3 },
  // 03 work · ACTIVE — reassembled into an advanced running configuration
  { label: "ACTIVE", shellOpen: 0.5, shellOp: 0.9, ringSpread: 0.32, ringTilt: 0.85, explode: 0.1,
    sensorOut: 0.7, sensorOp: 1, coreScale: 1.16, coreOp: 1, plateOp: 0.7, plateDrop: 0.3, signal: 0.95, guideOp: 0.35 },
  // 04 research · ANALYSIS — full exploded view, everything measured
  { label: "ANALYSIS", shellOpen: 1, shellOp: 0.7, ringSpread: 1, ringTilt: 0.5, explode: 1,
    sensorOut: 1, sensorOp: 1, coreScale: 1.02, coreOp: 1, plateOp: 0.9, plateDrop: 1, signal: 0.35, guideOp: 1 },
  // 05 journey · INTELLIGENCE — the parts reorganise into a network
  { label: "INTELLIGENCE", shellOpen: 0.45, shellOp: 0.5, ringSpread: 0.62, ringTilt: 1.1, explode: 0.35,
    sensorOut: 0.85, sensorOp: 1, coreScale: 1.05, coreOp: 0.9, plateOp: 0.45, plateDrop: 0.5, signal: 1, guideOp: 0.5 },
  // 06 contact · RESOLUTION — everything collapses to one ring: the signature
  { label: "RESOLUTION", shellOpen: 0, shellOp: 0, ringSpread: 0, ringTilt: 0, explode: 0,
    sensorOut: 0, sensorOp: 0, coreScale: 0.12, coreOp: 0.15, plateOp: 0, plateDrop: 0, signal: 0, guideOp: 0 },
];

/* Colours come from the design tokens at runtime rather than being written
   into the scene. The machine then follows the sheet automatically instead of
   having to be re-coloured whenever the ground changes. */
function token(name: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

const ACCENT_VARS = [
  "--color-mint",
  "--color-mint",
  "--color-cyan",
  "--color-iris",
  "--color-amber",
  "--color-iris",
  "--color-mint",
];

const CLEAR_CHUNK = /* glsl */ `
  uniform vec4 uClear[2];
  uniform float uClearCount;
  uniform float uClearAmt;
  varying float vAtt;
  float clearAtt(vec2 ndc) {
    float att = 1.0;
    for (int i = 0; i < 2; i++) {
      float on = step(float(i), uClearCount - 0.5);
      vec4 r = uClear[i];
      vec2 d = abs(ndc - r.xy) / max(r.zw, vec2(1e-4));
      float inside = 1.0 - smoothstep(0.70, 1.45, max(d.x, d.y));
      att *= mix(1.0, mix(1.0, 0.08, inside * uClearAmt), on);
    }
    return att;
  }
`;

const VERT = /* glsl */ `
  ${CLEAR_CHUNK}
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vAtt = clearAtt(clip.xy / clip.w);
    gl_Position = clip;
  }
`;
const FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform float uAlpha;
  varying float vAtt;
  void main() { gl_FragColor = vec4(uInk, uAlpha * vAtt); }
`;

function inkMaterial(color: string, alpha: number) {
  return new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uInk: { value: new THREE.Color(color) },
      uAlpha: { value: alpha },
      uClear: { value: [new THREE.Vector4(), new THREE.Vector4()] },
      uClearCount: { value: 0 },
      uClearAmt: { value: 0 },
    },
  });
}

const lerp = THREE.MathUtils.lerp;

function Verifier({ detail, inkScale, reduced }: { detail: number; inkScale: number; reduced: boolean }) {
  const root = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.LineSegments>(null);
  const plateRef = useRef<THREE.LineSegments>(null);
  const ringRefs = useRef<(THREE.LineSegments | null)[]>([]);
  const panelRefs = useRef<(THREE.LineSegments | null)[]>([]);
  const sensorRefs = useRef<(THREE.LineSegments | null)[]>([]);

  const PANELS = 6;
  const SENSORS = 4;

  const built = useMemo(() => {
    const core = coreGeo(0.82, detail);
    const rings = [ringGeo(1.5), ringGeo(1.72, 96, 12), ringGeo(1.28, 72, 6)];
    const panels = Array.from({ length: PANELS }, (_, i) =>
      panelGeo(1.95, 2.35, (i / PANELS) * Math.PI * 2 + 0.04, ((i + 1) / PANELS) * Math.PI * 2 - 0.04),
    );
    const sensor = sensorGeo();
    const plate = plateGeo(1.05, 4);
    const struts = strutGeo(0.9, 1.45);
    // Signal paths: sensor → core, rewritten each frame.
    const signalGeo = new THREE.BufferGeometry();
    signalGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SENSORS * 6), 3));
    return { core, rings, panels, sensor, plate, struts, signalGeo };
  }, [detail]);

  const mats = useMemo(
    () => ({
      core: inkMaterial(token("--color-ink", "#f2f3f5"), 0.3),
      ring: inkMaterial(token("--color-ink", "#f2f3f5"), 0.22),
      panel: inkMaterial(token("--color-ink", "#f2f3f5"), 0.2),
      sensor: inkMaterial(token("--color-mint", "#5ee9c0"), 0.3),
      plate: inkMaterial(token("--color-ink-4", "#767f8c"), 0.16),
      signal: inkMaterial(token("--color-mint", "#5ee9c0"), 0),
      strut: inkMaterial(token("--color-ink", "#f2f3f5"), 0.18),
    }),
    [],
  );

  useEffect(
    () => () => {
      Object.values(mats).forEach((m) => m.dispose());
      built.core.dispose();
      built.rings.forEach((g) => g.dispose());
      built.panels.forEach((g) => g.dispose());
      built.sensor.dispose();
      built.plate.dispose();
      built.struts.dispose();
      built.signalGeo.dispose();
    },
    [built, mats],
  );

  const tmp = useMemo(() => ({ c: new THREE.Color(), c2: new THREE.Color() }), []);
  const accents = useMemo(
    () => ACCENT_VARS.map((v, i) => token(v, ["#5ee9c0", "#5ee9c0", "#56c6f5", "#a79bff", "#ffb454", "#a79bff", "#5ee9c0"][i])),
    [],
  );
  const inspRef = useRef(0);

  useFrame((_, rawDt) => {
    const g = root.current;
    readings.config = g ? 'HASREF' : 'NOREF';
    if (!g) return;
    let insp = inspRef.current;
    const dt = Math.min(rawDt, 1 / 30);
    const last = CONFIGS.length - 1;
    const p = THREE.MathUtils.clamp(stage.p, 0, last);
    const i0 = Math.floor(p);
    const i1 = Math.min(i0 + 1, last);
    const raw = p - i0;
    const t = raw * raw * (3 - 2 * raw);
    const A = CONFIGS[i0];
    const B = CONFIGS[i1];
    const m = (k: keyof Config) => lerp(A[k] as number, B[k] as number, t);

    const shellOpen = m("shellOpen");
    const ringSpread = m("ringSpread");
    const ringTilt = m("ringTilt");
    // Inspection opens the assembly beyond its scroll configuration and slows
    // the resting motion, so a held pointer can actually examine it.
    insp += (stage.inspect - insp) * Math.min(1, dt * 2);
    const explode = Math.min(1.35, m("explode") + insp * 0.45);
    const sensorOut = m("sensorOut");
    const coreScale = m("coreScale");
    const plateDrop = m("plateDrop");
    const sig = signal.level;
    const now = performance.now() * 0.001;

    // Resting motion: the instrument is powered, never inert, but the movement
    // is at the threshold of noticeable. Audio adds a few percent on top.
    const idle = (reduced ? 0 : 1) * (1 - insp * 0.75);
    const vib = (reduced ? 0 : 1) * (0.006 + sig * 0.02);

    // ---- core ----
    if (coreRef.current) {
      const c = coreRef.current;
      c.scale.setScalar(coreScale * (1 + Math.sin(now * 0.9) * 0.006 * idle + sig * 0.05));
      c.rotation.y = now * 0.12 * idle;
      c.rotation.x = Math.sin(now * 0.4) * 0.06 * idle;
      c.position.set(Math.sin(now * 7) * vib, Math.cos(now * 6.3) * vib, 0);
    }

    // ---- structural rings: spread along their own normals, then tilt ----
    const NORMALS: [number, number, number][] = [
      [0, 0, 1],
      [1, 0, 0],
      [0, 1, 0],
    ];
    for (let i = 0; i < 3; i++) {
      const r = ringRefs.current[i];
      if (!r) continue;
      const dirv = NORMALS[i];
      const off = (i - 1) * (ringSpread * 1.15 + explode * 0.75);
      r.position.set(dirv[0] * off, dirv[1] * off, dirv[2] * off);
      // Base orientation puts each ring on its own plane; tilt opens the gimbal.
      r.rotation.set(
        i === 2 ? Math.PI / 2 : 0,
        i === 1 ? Math.PI / 2 : 0,
        0,
      );
      r.rotateZ(ringTilt * (0.35 + i * 0.22) + now * 0.05 * idle * (i % 2 ? -1 : 1));
      r.scale.setScalar(1 + explode * 0.12);
    }

    // ---- shell: panels swing outward on their own radius ----
    for (let i = 0; i < PANELS; i++) {
      const q = panelRefs.current[i];
      if (!q) continue;
      const a = ((i + 0.5) / PANELS) * Math.PI * 2;
      const push = shellOpen * 1.15 + explode * 1.5;
      q.position.set(Math.cos(a) * push, Math.sin(a) * push, shellOpen * 0.25 - explode * 0.4);
      q.rotation.set(shellOpen * 0.55, 0, 0);
      q.rotation.z = shellOpen * 0.12;
    }

    // ---- sensor pods: ride outward, always aimed at the core ----
    for (let i = 0; i < SENSORS; i++) {
      const s = sensorRefs.current[i];
      if (!s) continue;
      const a = (i / SENSORS) * Math.PI * 2 + Math.PI / 4;
      const d = 1.2 + sensorOut * 1.0 + explode * 1.1;
      s.position.set(Math.cos(a) * d, Math.sin(a) * d * 0.55, Math.sin(a * 2) * 0.35);
      s.lookAt(0, 0, 0);
      const sArr = built.signalGeo.getAttribute("position").array as Float32Array;
      sArr[i * 6] = s.position.x;
      sArr[i * 6 + 1] = s.position.y;
      sArr[i * 6 + 2] = s.position.z;
      sArr[i * 6 + 3] = 0;
      sArr[i * 6 + 4] = 0;
      sArr[i * 6 + 5] = 0;
    }
    built.signalGeo.getAttribute("position").needsUpdate = true;

    if (plateRef.current) {
      plateRef.current.position.y = -1.35 - plateDrop * 1.4;
      plateRef.current.rotation.y = now * 0.04 * idle;
    }

    // ---- placement on the sheet ----
    const stages = [
      [0, 0, 9.6, 1.3],
      [1.5, 0.35, 7.6, 1.05],
      [0, 0.15, 10.2, 0.95],
      [-2.1, 0.5, 7.4, 1.1],
      [0, 0, 6.8, 1.2],
      [0.4, 0.5, 8.6, 1.0],
      [0, 0, 7.4, 0.9],
    ];
    const c0 = stages[i0];
    const c1 = stages[i1];
    const ox = -lerp(c0[0], c1[0], t) * 0.85;
    const oy = -lerp(c0[1], c1[1], t) * 0.85;
    const depth = lerp(c0[2], c1[2], t);
    const size = lerp(c0[3], c1[3], t);
    const sc = (9.6 / depth) * size * 1.1;
    const ease = Math.min(1, dt * 2.4);
    g.position.x += (ox + stage.px * 0.1 - g.position.x) * ease;
    g.position.y += (oy + stage.py * 0.07 - g.position.y) * ease;
    g.scale.setScalar(g.scale.x + (sc - g.scale.x) * ease);
    if (!reduced) {
      const spin = stage.progress * Math.PI * 0.9;
      g.rotation.y += (spin - g.rotation.y) * Math.min(1, dt * 3) + dt * stage.speed * 0.06;
      g.rotation.x += (stage.py * 0.06 + 0.26 - g.rotation.x) * Math.min(1, dt * 2);
      g.rotation.z += (stage.px * 0.03 - g.rotation.z) * Math.min(1, dt * 2);
    }

    // ---- ink ----
    const base = 0.46 * inkScale;
    const setA = (mat: THREE.ShaderMaterial, target: number) => {
      const u = mat.uniforms;
      u.uAlpha.value += (target - u.uAlpha.value) * Math.min(1, dt * 2.5);
      const rects = u.uClear.value as THREE.Vector4[];
      for (let k = 0; k < 2; k++) {
        rects[k].set(stage.clear[k * 4], stage.clear[k * 4 + 1], stage.clear[k * 4 + 2], stage.clear[k * 4 + 3]);
      }
      u.uClearCount.value = stage.clearCount;
      u.uClearAmt.value += (stage.clearAmount - u.uClearAmt.value) * Math.min(1, dt * 4);
    };
    setA(mats.core, base * m("coreOp") * 1.1);
    setA(mats.ring, base * 0.72);
    setA(mats.panel, base * m("shellOp") * 0.68);
    setA(mats.sensor, base * m("sensorOp") * 0.9);
    setA(mats.plate, base * m("plateOp") * 0.6);
    setA(mats.signal, base * m("signal") * 0.85);
    setA(mats.strut, base * 0.5);
    tmp.c.set(accents[i0]).lerp(tmp.c2.set(accents[i1]), t);
    (mats.sensor.uniforms.uInk.value as THREE.Color).copy(tmp.c);
    (mats.signal.uniforms.uInk.value as THREE.Color).copy(tmp.c);

    // ---- readings + label anchors ----
    readings.nodes = SENSORS + 3 + PANELS + 2;
    readings.links = Math.round(SENSORS * m("signal"));
    readings.segments = Math.round(shellOpen * 100);
    readings.load = mats.core.uniforms.uAlpha.value;
    readings.state = i0;
    readings.signal = sig;
    readings.config = A.label;
    readings.explode = explode;
    inspRef.current = insp;
  });

  const reg = (arr: React.RefObject<(THREE.LineSegments | null)[]>, i: number) => (el: THREE.LineSegments | null) => {
    arr.current[i] = el;
  };

  return (
    <group ref={root}>
      <lineSegments ref={coreRef} geometry={built.core} material={mats.core} frustumCulled={false} />
      <lineSegments ref={plateRef} geometry={built.plate} material={mats.plate} frustumCulled={false} />
      <lineSegments geometry={built.struts} material={mats.strut} frustumCulled={false} />
      <lineSegments geometry={built.signalGeo} material={mats.signal} frustumCulled={false} />
      {built.rings.map((geo, i) => (
        <lineSegments key={`r${i}`} ref={reg(ringRefs, i)} geometry={geo} material={mats.ring} frustumCulled={false} />
      ))}
      {built.panels.map((geo, i) => (
        <lineSegments key={`p${i}`} ref={reg(panelRefs, i)} geometry={geo} material={mats.panel} frustumCulled={false} />
      ))}
      {Array.from({ length: SENSORS }, (_, i) => (
        <lineSegments key={`s${i}`} ref={reg(sensorRefs, i)} geometry={built.sensor} material={mats.sensor} frustumCulled={false} />
      ))}
    </group>
  );
}

function Fit({ span }: { span: number }) {
  const camera = useThree((s) => s.camera) as THREE.OrthographicCamera;
  const size = useThree((s) => s.size);
  useEffect(() => {
    camera.zoom = Math.min(size.width, size.height) / span;
    camera.updateProjectionMatrix();
  }, [camera, size, span]);
  return null;
}

export function Machine() {
  const reduced = useReducedMotion();
  const [awake, setAwake] = useState(true);

  const cfg = useMemo(() => {
    if (typeof window === "undefined") return { detail: 1, dpr: 1, span: 7.6, ink: 1 };
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 900;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (coarse || narrow) return { detail: 0, dpr: 1, span: 9.8, ink: 0.6 };
    if (mem !== undefined && mem <= 4) return { detail: 1, dpr: 1.5, span: 7.6, ink: 1 };
    return { detail: 1, dpr: 2, span: 7.6, ink: 1 };
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
        dpr={[1, cfg.dpr]}
        camera={{ position: [0, 0, 10], zoom: 128 }}
        frameloop={awake ? "always" : "never"}
        gl={{ antialias: true, alpha: true, depth: false, stencil: false }}
      >
        <Fit span={cfg.span} />
        <Verifier detail={cfg.detail} inkScale={cfg.ink} reduced={reduced} />
      </Canvas>
    </div>
  );
}

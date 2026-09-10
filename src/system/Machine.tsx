"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { stage } from "./stageStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  annulusGeo,
  coilGeo,
  hexCoreGeo,
  hexFillGeo,
  circulationGeo,
  sensorGeo,
  plateGeo,
} from "./machineParts";

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
    sensorOut: 0, sensorOp: 0, coreScale: 1, coreOp: 0.9, plateOp: 0.2, plateDrop: 0, signal: 0, guideOp: 0 },
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

function Verifier({
  detail,
  inkScale,
  reduced,
  flowCount,
}: {
  detail: number;
  inkScale: number;
  reduced: boolean;
  flowCount: number;
}) {
  const root = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Group>(null);
  const containRef = useRef<THREE.LineSegments>(null);
  const innerRef = useRef<THREE.LineSegments>(null);
  const flowRef = useRef<THREE.LineSegments>(null);
  const plateRef = useRef<THREE.LineSegments>(null);
  const coilRefs = useRef<(THREE.LineSegments | null)[]>([]);
  const sensorRefs = useRef<(THREE.LineSegments | null)[]>([]);
  const inspRef = useRef(0);

  const COILS = 10;
  const SENSORS = 4;

  const built = useMemo(() => {
    const gap = 0.055;
    const coils = Array.from({ length: COILS }, (_, i) =>
      coilGeo(
        1.34,
        1.9,
        (i / COILS) * Math.PI * 2 + gap,
        ((i + 1) / COILS) * Math.PI * 2 - gap,
        detail > 0 ? 3 : 2,
      ),
    );
    const signalGeo = new THREE.BufferGeometry();
    signalGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(SENSORS * 6), 3));
    return {
      contain: annulusGeo(2.02, 2.36),
      inner: annulusGeo(1.02, 1.2, 96, 8),
      core: hexCoreGeo(0.66),
      coreFill: hexFillGeo(0.52),
      flow: circulationGeo(2.62, 5),
      coils,
      sensor: sensorGeo(),
      plate: plateGeo(1.05, 4),
      signalGeo,
    };
  }, [detail]);

  const mats = useMemo(() => {
    const m = {
      contain: inkMaterial(token("--color-ink", "#f2f3f5"), 0.3),
      coil: inkMaterial(token("--color-cyan", "#56c6f5"), 0.24),
      inner: inkMaterial(token("--color-ink", "#f2f3f5"), 0.24),
      core: inkMaterial(token("--color-iris", "#a79bff"), 0.3),
      flow: inkMaterial(token("--color-mint", "#5ee9c0"), 0.12),
      sensor: inkMaterial(token("--color-cyan", "#56c6f5"), 0),
      plate: inkMaterial(token("--color-ink-4", "#767f8c"), 0.14),
      signal: inkMaterial(token("--color-amber", "#ffb454"), 0),
    };
    // The one solid in the entire scene. A fill, not a glow: no additive
    // blending and no bloom, so the core reads as live without the page
    // turning into science fiction.
    const fill = inkMaterial(token("--color-iris", "#a79bff"), 0.05);
    fill.side = THREE.DoubleSide;
    return { ...m, fill };
  }, []);

  const accents = useMemo(
    () =>
      ACCENT_VARS.map((v, i) =>
        token(v, ["#5ee9c0", "#5ee9c0", "#56c6f5", "#a79bff", "#ffb454", "#a79bff", "#5ee9c0"][i]),
      ),
    [],
  );
  const tmp = useMemo(() => ({ c: new THREE.Color(), c2: new THREE.Color() }), []);

  useFrame((_, rawDt) => {
    const g = root.current;
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

    insp += (stage.inspect - insp) * Math.min(1, dt * 2);
    const shellOpen = m("shellOpen");
    const ringSpread = m("ringSpread");
    const explode = Math.min(1.35, m("explode") + insp * 0.45);
    const sensorOut = m("sensorOut");
    const coreScale = m("coreScale");
    const plateDrop = m("plateDrop");
    const sig = 0;
    const now = performance.now() * 0.001;
    const idle = (reduced ? 0 : 1) * (1 - insp * 0.75);
    const vib = (reduced ? 0 : 1) * (0.004 + sig * 0.016);

    // ---- core ----
    if (coreRef.current) {
      const c = coreRef.current;
      c.scale.setScalar(coreScale * (1 + Math.sin(now * 0.9) * 0.008 * idle + sig * 0.05));
      c.rotation.z = now * 0.16 * idle;
      c.position.set(Math.sin(now * 7) * vib, Math.cos(now * 6.3) * vib, 0);
    }

    // ---- containment and inner ring, counter-rotating ----
    if (containRef.current) {
      containRef.current.rotation.z = now * 0.045 * idle;
      containRef.current.scale.setScalar(1 + explode * 0.16);
    }
    if (innerRef.current) {
      innerRef.current.rotation.z = -now * 0.09 * idle;
      innerRef.current.scale.setScalar(1 - ringSpread * 0.08 + explode * 0.1);
    }
    if (flowRef.current) {
      flowRef.current.rotation.z = now * 0.22 * idle;
      flowRef.current.scale.setScalar(1 + explode * 0.2);
    }

    // ---- coil poles: seated at rest, swung out as the device opens ----
    for (let i = 0; i < COILS; i++) {
      const q = coilRefs.current[i];
      if (!q) continue;
      const a = ((i + 0.5) / COILS) * Math.PI * 2;
      const push = shellOpen * 0.85 + explode * 1.25;
      q.position.set(Math.cos(a) * push, Math.sin(a) * push, shellOpen * 0.18 - explode * 0.3);
      // Each pole tips about its own tangent, so the array fans rather than
      // sliding as one piece.
      q.rotation.set(Math.sin(a) * shellOpen * 0.5, -Math.cos(a) * shellOpen * 0.5, 0);
    }

    // ---- probes: absent while the device is closed ----
    for (let i = 0; i < SENSORS; i++) {
      const sN = sensorRefs.current[i];
      if (!sN) continue;
      const a = (i / SENSORS) * Math.PI * 2 + Math.PI / 4;
      const d = 1.3 + sensorOut * 1.05 + explode * 1.05;
      sN.position.set(Math.cos(a) * d, Math.sin(a) * d * 0.62, Math.sin(a * 2) * 0.3);
      sN.lookAt(0, 0, 0);
      const arr = built.signalGeo.getAttribute("position").array as Float32Array;
      arr[i * 6] = sN.position.x;
      arr[i * 6 + 1] = sN.position.y;
      arr[i * 6 + 2] = sN.position.z;
      arr[i * 6 + 3] = 0;
      arr[i * 6 + 4] = 0;
      arr[i * 6 + 5] = 0;
    }
    built.signalGeo.getAttribute("position").needsUpdate = true;

    if (plateRef.current) {
      plateRef.current.position.y = -1.5 - plateDrop * 1.4;
      plateRef.current.rotation.y = now * 0.04 * idle;
    }

    // ---- placement ----
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
    const sc = (9.6 / depth) * size * 1.05;
    const ease = Math.min(1, dt * 2.4);
    g.position.x += (ox + stage.px * 0.1 - g.position.x) * ease;
    g.position.y += (oy + stage.py * 0.07 - g.position.y) * ease;
    g.scale.setScalar(g.scale.x + (sc - g.scale.x) * ease);
    if (!reduced) {
      // Held at a shallow tilt so it reads as a disc in space rather than a
      // badge stamped on the page, and turns slowly with the scroll.
      const spin = stage.progress * Math.PI * 0.55;
      g.rotation.y += (spin - g.rotation.y) * Math.min(1, dt * 3) + dt * stage.speed * 0.05;
      g.rotation.x += (0.28 + stage.py * 0.05 - g.rotation.x) * Math.min(1, dt * 2);
      g.rotation.z += (stage.px * 0.025 - g.rotation.z) * Math.min(1, dt * 2);
    }

    // ---- ink ----
    const base = 0.58 * inkScale;
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
    setA(mats.contain, base * 1.0);
    setA(mats.coil, base * m("shellOp") * 0.88);
    setA(mats.inner, base * 0.85);
    setA(mats.core, base * m("coreOp") * 1.35);
    setA(mats.fill, base * m("coreOp") * (0.17 + sig * 0.08));
    setA(mats.flow, base * (0.26 + m("signal") * 0.34));
    setA(mats.sensor, base * m("sensorOp") * 0.85);
    setA(mats.plate, base * m("plateOp") * 0.55);
    setA(mats.signal, base * m("signal") * 0.8);
    tmp.c.set(accents[i0]).lerp(tmp.c2.set(accents[i1]), t);
    (mats.signal.uniforms.uInk.value as THREE.Color).copy(tmp.c);

    inspRef.current = insp;
  });

  const reg =
    (arr: React.RefObject<(THREE.LineSegments | null)[]>, i: number) =>
    (el: THREE.LineSegments | null) => {
      arr.current[i] = el;
    };

  return (
    <group ref={root}>
      <lineSegments ref={containRef} geometry={built.contain} material={mats.contain} frustumCulled={false} />
      <lineSegments ref={innerRef} geometry={built.inner} material={mats.inner} frustumCulled={false} />
      <lineSegments ref={flowRef} geometry={built.flow} material={mats.flow} frustumCulled={false} />
      <lineSegments ref={plateRef} geometry={built.plate} material={mats.plate} frustumCulled={false} />
      <lineSegments geometry={built.signalGeo} material={mats.signal} frustumCulled={false} />

      <group ref={coreRef}>
        <mesh geometry={built.coreFill} material={mats.fill} frustumCulled={false} />
        <lineSegments geometry={built.core} material={mats.core} frustumCulled={false} />
      </group>

      {built.coils.map((geo, i) => (
        <lineSegments key={`c${i}`} ref={reg(coilRefs, i)} geometry={geo} material={mats.coil} frustumCulled={false} />
      ))}
      {Array.from({ length: SENSORS }, (_, i) => (
        <lineSegments key={`s${i}`} ref={reg(sensorRefs, i)} geometry={built.sensor} material={mats.sensor} frustumCulled={false} />
      ))}

      <Flow count={flowCount} inkScale={inkScale} />
    </group>
  );
}

/* ---------------------------------------------------------------- field ---
 * A sparse accent field across the whole sheet. The machine is the subject;
 * this is the room it sits in. Points are drawn soft but never additively —
 * they read as flecks in the ground rather than as lights.
 * ------------------------------------------------------------------------ */

const FIELD_VERT = /* glsl */ `
  ${CLEAR_CHUNK}
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  attribute float aDepth;
  uniform float uTime;
  uniform float uScroll;
  varying vec3 vColor;
  varying float vDim;
  void main() {
    vec3 p = position;
    // Three depth layers. Near stars drift faster and shift more with scroll,
    // far ones barely move — that difference is the parallax.
    float near = 1.0 - aDepth;
    p.y += sin(uTime * (0.08 + near * 0.12) + aPhase) * (0.06 + near * 0.16);
    p.x += cos(uTime * (0.06 + near * 0.08) + aPhase * 1.7) * (0.05 + near * 0.12);
    p.y += uScroll * (0.6 + near * 2.4);
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    vAtt = clearAtt(clip.xy / clip.w);
    vColor = aColor;
    vDim = 0.45 + near * 0.55;
    gl_PointSize = aSize * (0.6 + near * 0.7);
    gl_Position = clip;
  }
`;

const FIELD_FRAG = /* glsl */ `
  uniform float uAlpha;
  varying vec3 vColor;
  varying float vAtt;
  varying float vDim;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.16, d);
    gl_FragColor = vec4(vColor, uAlpha * vAtt * a * vDim);
  }
`;

function Field({ count, inkScale }: { count: number; inkScale: number }) {
  const mat = useRef<THREE.ShaderMaterial>(null);

  const { geo, material } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const size = new Float32Array(count);
    const phase = new Float32Array(count);
    const depth = new Float32Array(count);
    const palette = [
      new THREE.Color(token("--color-mint", "#5ee9c0")),
      new THREE.Color(token("--color-cyan", "#56c6f5")),
      new THREE.Color(token("--color-iris", "#a79bff")),
      new THREE.Color(token("--color-amber", "#ffb454")),
      new THREE.Color(token("--color-ink", "#f2f3f5")),
    ];
    // Weighted so the field reads as neutral with colour in it, not as confetti.
    const pick = [0, 1, 2, 3, 4, 4, 4, 4];
    for (let i = 0; i < count; i++) {
      const layer = i % 3; // 0 near, 1 mid, 2 far
      depth[i] = layer / 2;
      pos[i * 3] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 17;
      pos[i * 3 + 2] = -2 - layer * 2.5;
      const c = palette[pick[i % pick.length]];
      col[i * 3] = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
      size[i] = 0.9 + Math.random() * 1.9;
      phase[i] = Math.random() * Math.PI * 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geo.setAttribute("aDepth", new THREE.BufferAttribute(depth, 1));
    const material = new THREE.ShaderMaterial({
      vertexShader: FIELD_VERT,
      fragmentShader: FIELD_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uAlpha: { value: 0.46 * inkScale },
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uClear: { value: [new THREE.Vector4(), new THREE.Vector4()] },
        uClearCount: { value: 0 },
        uClearAmt: { value: 0 },
      },
    });
    return { geo, material };
  }, [count, inkScale]);

  useFrame((_, dt) => {
    const u = material.uniforms;
    u.uTime.value += Math.min(dt, 1 / 30);
    u.uScroll.value = stage.progress;
    const rects = u.uClear.value as THREE.Vector4[];
    for (let k = 0; k < 2; k++) {
      rects[k].set(stage.clear[k * 4], stage.clear[k * 4 + 1], stage.clear[k * 4 + 2], stage.clear[k * 4 + 3]);
    }
    u.uClearCount.value = stage.clearCount;
    u.uClearAmt.value += (stage.clearAmount - u.uClearAmt.value) * Math.min(1, dt * 4);
  });

  return <points ref={mat as never} geometry={geo} material={material} frustumCulled={false} />;
}


/* ----------------------------------------------------------------- flow ---
 * Material moving through the device. Each element is drawn in from outside,
 * spirals inward through the coil gaps, converges on the core, then ejects
 * along the axis and fades. It lives inside the machine's group, so it
 * inherits the tilt and turns with it rather than floating independently.
 *
 * The whole path is parametric in the vertex shader — one phase value per
 * element, nothing written back from the CPU.
 * ------------------------------------------------------------------------ */

const FLOW_VERT = /* glsl */ `
  attribute float aPhase;
  attribute float aSpeed;
  attribute float aAngle;
  attribute float aTurns;
  attribute float aSize;
  attribute float aTone;
  attribute float aStartY;

  uniform float uTime;
  uniform float uRate;
  uniform vec2 uMouse;

  varying float vFade;
  varying float vTone;
  varying float vHot;

  void main() {
    float p = fract(aPhase + uTime * aSpeed * uRate);
    float inb = smoothstep(0.0, 0.66, p);
    float ej = smoothstep(0.66, 1.0, p);

    // Inbound: a decaying spiral. Ejection: held on the axis and thrown clear.
    float r = mix(3.5, 0.40, pow(inb, 1.55));
    float ang = aAngle + inb * aTurns * 6.28318;
    float y = mix(aStartY, 0.0, inb) + ej * 3.4 * sign(aStartY);

    vec3 pos = vec3(cos(ang) * r, y, sin(ang) * r);
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);

    // Pointer disturbs the stream locally, in screen space so it tracks the
    // cursor rather than some point in the machine's own frame.
    vec2 ndc = clip.xy / clip.w;
    vec2 d = ndc - uMouse;
    float push = smoothstep(0.34, 0.0, length(d));
    clip.xy += normalize(d + 1e-5) * push * 0.10 * clip.w;

    vHot = push;
    vTone = aTone;
    // Fade in on entry, out on ejection: elements arrive and leave, never pop.
    vFade = smoothstep(0.0, 0.08, p) * (1.0 - ej);

    gl_Position = clip;
    gl_PointSize = aSize * (1.0 + push * 0.8) * (30.0 / -(modelViewMatrix * vec4(pos, 1.0)).z);
  }
`;

const FLOW_FRAG = /* glsl */ `
  uniform vec3 uCyan;
  uniform vec3 uAmber;
  uniform vec3 uInk;
  uniform float uAlpha;
  varying float vFade;
  varying float vTone;
  varying float vHot;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float a = pow(1.0 - d * 2.0, 2.6);
    vec3 c = mix(uInk, mix(uCyan, uAmber, step(0.82, vTone)), 0.22 + vHot * 0.5);
    gl_FragColor = vec4(c, a * vFade * uAlpha * (0.5 + vHot * 0.9));
  }
`;

function Flow({ count, inkScale }: { count: number; inkScale: number }) {
  const rate = useRef(1);

  const { geo, material } = useMemo(() => {
    const phase = new Float32Array(count);
    const speed = new Float32Array(count);
    const angle = new Float32Array(count);
    const turns = new Float32Array(count);
    const size = new Float32Array(count);
    const tone = new Float32Array(count);
    const startY = new Float32Array(count);
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      phase[i] = Math.random();
      speed[i] = 0.045 + Math.random() * 0.075;
      angle[i] = Math.random() * Math.PI * 2;
      turns[i] = 0.7 + Math.random() * 1.1;
      size[i] = 0.9 + Math.random() * 1.5;
      tone[i] = Math.random();
      startY[i] = (Math.random() - 0.5) * 3.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    geo.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1));
    geo.setAttribute("aTurns", new THREE.BufferAttribute(turns, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aTone", new THREE.BufferAttribute(tone, 1));
    geo.setAttribute("aStartY", new THREE.BufferAttribute(startY, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);

    const material = new THREE.ShaderMaterial({
      vertexShader: FLOW_VERT,
      fragmentShader: FLOW_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uRate: { value: 1 },
        uMouse: { value: new THREE.Vector2(9, 9) },
        uAlpha: { value: 0.6 * inkScale },
        uCyan: { value: new THREE.Color(token("--color-cyan", "#56c6f5")) },
        uAmber: { value: new THREE.Color(token("--color-amber", "#ffb454")) },
        uInk: { value: new THREE.Color(token("--color-ink", "#f2f3f5")) },
      },
    });
    return { geo, material };
  }, [count, inkScale]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const u = material.uniforms;
    u.uTime.value += dt;

    // Interaction: the closer the pointer is to the device and the faster the
    // reader is moving, the harder it runs. Eased, so it spins up and down.
    const prox = 1 - Math.min(1, Math.hypot(stage.px, stage.py) / 1.1);
    const target = 1 + prox * 1.4 + stage.speed * 1.8 + 0;
    rate.current += (target - rate.current) * Math.min(1, dt * 1.6);
    u.uRate.value = rate.current;
    (u.uMouse.value as THREE.Vector2).set(stage.px, stage.py);
  });

  return <points geometry={geo} material={material} frustumCulled={false} />;
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
    if (typeof window === "undefined")
      return { detail: 1, dpr: 1, span: 7.6, ink: 1, field: 460, flow: 700 };
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 900;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (coarse || narrow) return { detail: 0, dpr: 1, span: 9.8, ink: 0.6, field: 220, flow: 260 };
    if (mem !== undefined && mem <= 4) return { detail: 1, dpr: 1.5, span: 7.6, ink: 1, field: 460, flow: 700 };
    return { detail: 1, dpr: 2, span: 7.6, ink: 1, field: 760, flow: 1300 };
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
        <Field count={cfg.field} inkScale={cfg.ink} />
        <Verifier
          detail={cfg.detail}
          inkScale={cfg.ink}
          reduced={reduced}
          flowCount={cfg.flow}
        />
      </Canvas>
    </div>
  );
}

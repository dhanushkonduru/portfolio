"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { stage, readings } from "./stageStore";
import { STAGES } from "./stages";
import { signal } from "./audio";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ============================================================================
 * THE APPARATUS
 *
 * A live engineering diagram plotted onto the sheet — not an object behind the
 * page. Six layers, all drawn as ink line work under an orthographic camera:
 *
 *   1 primary structure     the deformable solid
 *   2 secondary connections chords across the structure, drawn where the
 *                           argument is about systems and interconnection
 *   3 reference axes        the frame the model is measured in
 *   4 construction lines    projections from the structure to the guides
 *   5 measurement guides    a dimension bracket that tracks the live extent
 *   6 annotation markers    square nodes at structural vertices
 *
 * Every layer shares one clear-region term so the whole apparatus composes
 * around the typography instead of the canvas dimming as a block. Nothing here
 * is lit, blended additively or bloomed: paper does not emit.
 * ========================================================================= */

const PLOTS: ((p: THREE.Vector3, out: THREE.Vector3) => void)[] = [
  (p, o) => o.copy(p).multiplyScalar(2.25),
  (p, o) => {
    const u = Math.atan2(p.z, p.x);
    const v = Math.asin(THREE.MathUtils.clamp(p.y, -1, 1)) * 2;
    const R = 1.75, r = 0.72;
    o.set((R + r * Math.cos(v)) * Math.cos(u), r * Math.sin(v), (R + r * Math.cos(v)) * Math.sin(u));
  },
  (p, o) => {
    const g = 0.62;
    o.set(Math.round((p.x * 2.3) / g) * g, Math.round((p.y * 2.3) / g) * g, Math.round((p.z * 2.3) / g) * g);
  },
  (p, o) => {
    const y = p.y * 2.5;
    const a = Math.atan2(p.z, p.x) + y * 0.55;
    const r = 1.15 + Math.abs(p.y) * 0.25;
    o.set(Math.cos(a) * r, y, Math.sin(a) * r);
  },
  (p, o) => {
    const r = Math.hypot(p.x, p.z) * 2.5;
    const a = Math.atan2(p.z, p.x);
    o.set(Math.cos(a) * r, Math.sin(r * 2.1) * 0.42 + p.y * 0.12, Math.sin(a) * r);
  },
  (p, o) => {
    const t = (p.y + 1) * Math.PI * 1.6, r = 1.5;
    o.set(Math.cos(t) * r, p.y * 2.4, Math.sin(t) * r + p.x * 0.35);
  },
  (p, o) => {
    const u = Math.atan2(p.z, p.x), R = 2.0;
    o.set(Math.cos(u) * R, p.y * 0.16, Math.sin(u) * R);
  },
];

/** Shared clear-region attenuation. Injected into every layer's vertex stage. */
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

const LINE_VERT = /* glsl */ `
  ${CLEAR_CHUNK}
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vAtt = clearAtt(clip.xy / clip.w);
    gl_Position = clip;
  }
`;

const LINE_FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform float uAlpha;
  varying float vAtt;
  void main() { gl_FragColor = vec4(uInk, uAlpha * vAtt); }
`;

const NODE_VERT = /* glsl */ `
  ${CLEAR_CHUNK}
  uniform float uSize;
  attribute float aAccent;
  varying float vAccent;
  void main() {
    vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vAtt = clearAtt(clip.xy / clip.w);
    vAccent = aAccent;
    gl_PointSize = uSize * (1.0 + aAccent * 0.5);
    gl_Position = clip;
  }
`;

/* Points stay square. A round mask would read as a dot; a square reads as a
   plotted node marker, which is what a drawing of this kind uses. */
const NODE_FRAG = /* glsl */ `
  uniform vec3 uInk;
  uniform vec3 uAccent;
  uniform float uAlpha;
  varying float vAtt;
  varying float vAccent;
  void main() {
    vec3 c = mix(uInk, uAccent, vAccent);
    gl_FragColor = vec4(c, uAlpha * vAtt * (0.75 + vAccent * 0.25));
  }
`;

const ACCENTS = ["#17614a", "#17614a", "#1c5a85", "#4a3ea6", "#915212", "#1c5a85", "#17614a"];

function clearUniforms() {
  return {
    uClear: { value: [new THREE.Vector4(), new THREE.Vector4()] },
    uClearCount: { value: 0 },
    uClearAmt: { value: 0 },
  };
}

function Diagram({
  detail,
  nodeCount,
  reduced,
  inkScale,
}: {
  detail: number;
  nodeCount: number;
  reduced: boolean;
  inkScale: number;
}) {
  const group = useRef<THREE.Group>(null);
  const guides = useRef<THREE.LineSegments>(null);

  const built = useMemo(() => {
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
        buf.set([out.x, out.y, out.z], i * 3);
      }
      return buf;
    });

    // ---- 1 · primary structure ----
    const primaryGeo = new THREE.BufferGeometry();
    primaryGeo.setAttribute("position", new THREE.BufferAttribute(targets[0].slice(), 3));

    // ---- 6 · annotation markers ----
    // Nodes sit on real structural vertices, evenly sampled so they read as
    // chosen points on the model rather than scattered dust.
    const step = Math.max(1, Math.floor(n / nodeCount));
    const nodeIdx: number[] = [];
    for (let i = 0; i < n && nodeIdx.length < nodeCount; i += step) nodeIdx.push(i);
    const nodeGeo = new THREE.BufferGeometry();
    nodeGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nodeIdx.length * 3), 3));
    const accent = new Float32Array(nodeIdx.length);
    for (let i = 0; i < nodeIdx.length; i++) accent[i] = i % 7 === 0 ? 1 : 0;
    nodeGeo.setAttribute("aAccent", new THREE.BufferAttribute(accent, 1));

    // ---- 2 · secondary connections ----
    // Fixed pairs chosen once, so the network is a property of the model and
    // not a different random graph every frame.
    const pairs: [number, number][] = [];
    for (let i = 0; i < nodeIdx.length; i++) {
      const j = (i * 7 + 3) % nodeIdx.length;
      if (i !== j) pairs.push([i, j]);
    }
    const chordGeo = new THREE.BufferGeometry();
    chordGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(pairs.length * 6), 3));

    // ---- 3 · reference axes ----
    const ax: number[] = [];
    const L = 3.4;
    ax.push(-L, 0, 0, L, 0, 0, 0, -L, 0, 0, L, 0, 0, 0, -L, 0, 0, L);
    for (let t = -3; t <= 3; t++) {
      if (!t) continue;
      ax.push(t, -0.09, 0, t, 0.09, 0); // ticks on X
      ax.push(-0.09, t, 0, 0.09, t, 0); // ticks on Y
    }
    const axisGeo = new THREE.BufferGeometry();
    axisGeo.setAttribute("position", new THREE.Float32BufferAttribute(ax, 3));

    // ---- 4 + 5 · construction lines and measurement guides ----
    // Seven segments, rewritten each frame from the model's live extent.
    const guideGeo = new THREE.BufferGeometry();
    guideGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(7 * 6), 3));

    solid.dispose();
    edges.dispose();
    return { primaryGeo, nodeGeo, chordGeo, axisGeo, guideGeo, targets, nodeIdx, pairs, n };
  }, [detail, nodeCount]);

  const mats = useMemo(() => {
    const mk = (alpha: number) =>
      new THREE.ShaderMaterial({
        vertexShader: LINE_VERT,
        fragmentShader: LINE_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        uniforms: { uInk: { value: new THREE.Color("#17160f") }, uAlpha: { value: alpha }, ...clearUniforms() },
      });
    const node = new THREE.ShaderMaterial({
      vertexShader: NODE_VERT,
      fragmentShader: NODE_FRAG,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uInk: { value: new THREE.Color("#17160f") },
        uAccent: { value: new THREE.Color(ACCENTS[0]) },
        uAlpha: { value: 0.5 },
        uSize: { value: 3.4 },
        ...clearUniforms(),
      },
    });
    return { primary: mk(0.28), chord: mk(0.0), axis: mk(0.1), guide: mk(0.12), node };
  }, []);

  useEffect(
    () => () => {
      Object.values(built).forEach((v) => v instanceof THREE.BufferGeometry && v.dispose());
      Object.values(mats).forEach((m) => m.dispose());
    },
    [built, mats],
  );

  const tmpAccent = useMemo(() => new THREE.Color(), []);

  useFrame((_, rawDt) => {
    const g = group.current;
    if (!g) return;
    const dt = Math.min(rawDt, 1 / 30);

    const last = STAGES.length - 1;
    const p = THREE.MathUtils.clamp(stage.p, 0, last);
    const i0 = Math.floor(p);
    const i1 = Math.min(i0 + 1, last);
    const raw = p - i0;
    const t = raw * raw * (3 - 2 * raw);

    // ---- primary structure: morph ----
    const a = built.targets[i0];
    const b = built.targets[i1];
    const pAttr = built.primaryGeo.getAttribute("position") as THREE.BufferAttribute;
    const pos = pAttr.array as Float32Array;

    // Audio perturbs node positions by single-digit percentages. At silence
    // the term is exactly zero and the structure sits at its plotted state.
    const sig = signal.level;
    const wob = reduced ? 0 : sig * 0.085;
    const clock = performance.now() * 0.0006;

    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (let i = 0; i < pos.length; i += 3) {
      let x = a[i] + (b[i] - a[i]) * t;
      let y = a[i + 1] + (b[i + 1] - a[i + 1]) * t;
      const z = a[i + 2] + (b[i + 2] - a[i + 2]) * t;
      if (wob > 0) {
        // Deterministic per-vertex phase: purposeful movement, not noise.
        const ph = i * 0.017;
        x += Math.sin(clock + ph) * wob;
        y += Math.cos(clock * 1.3 + ph) * wob;
      }
      pos[i] = x; pos[i + 1] = y; pos[i + 2] = z;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    pAttr.needsUpdate = true;

    // ---- annotation markers ----
    const nAttr = built.nodeGeo.getAttribute("position") as THREE.BufferAttribute;
    const nArr = nAttr.array as Float32Array;
    for (let k = 0; k < built.nodeIdx.length; k++) {
      const src = built.nodeIdx[k] * 3;
      nArr[k * 3] = pos[src];
      nArr[k * 3 + 1] = pos[src + 1];
      nArr[k * 3 + 2] = pos[src + 2];
    }
    nAttr.needsUpdate = true;

    // ---- secondary connections ----
    const cAttr = built.chordGeo.getAttribute("position") as THREE.BufferAttribute;
    const cArr = cAttr.array as Float32Array;
    for (let k = 0; k < built.pairs.length; k++) {
      const [i, j] = built.pairs[k];
      cArr[k * 6] = nArr[i * 3];
      cArr[k * 6 + 1] = nArr[i * 3 + 1];
      cArr[k * 6 + 2] = nArr[i * 3 + 2];
      cArr[k * 6 + 3] = nArr[j * 3];
      cArr[k * 6 + 4] = nArr[j * 3 + 1];
      cArr[k * 6 + 5] = nArr[j * 3 + 2];
    }
    cAttr.needsUpdate = true;

    // ---- measurement guides, from the live extent ----
    const gAttr = built.guideGeo.getAttribute("position") as THREE.BufferAttribute;
    const gArr = gAttr.array as Float32Array;
    const gx = maxX + 0.55;
    const tick = 0.13;
    const seg = (k: number, x1: number, y1: number, x2: number, y2: number) => {
      gArr[k * 6] = x1; gArr[k * 6 + 1] = y1; gArr[k * 6 + 2] = 0;
      gArr[k * 6 + 3] = x2; gArr[k * 6 + 4] = y2; gArr[k * 6 + 5] = 0;
    };
    seg(0, gx, minY, gx, maxY);                 // dimension line
    seg(1, gx - tick, minY, gx + tick, minY);   // end tick
    seg(2, gx - tick, maxY, gx + tick, maxY);   // end tick
    seg(3, maxX, minY, gx, minY);               // construction line
    seg(4, maxX, maxY, gx, maxY);               // construction line
    seg(5, minX, maxY + 0.4, maxX, maxY + 0.4); // span above
    seg(6, minX, maxY + 0.4 - tick, minX, maxY + 0.4 + tick);
    gAttr.needsUpdate = true;

    // ---- spatial composition ----
    const c0 = STAGES[i0].camera;
    const c1 = STAGES[i1].camera;
    const ox = -(c0[0] + (c1[0] - c0[0]) * t) * 0.85;
    const oy = -(c0[1] + (c1[1] - c0[1]) * t) * 0.85;
    const depth = c0[2] + (c1[2] - c0[2]) * t;
    const size = STAGES[i0].size + (STAGES[i1].size - STAGES[i0].size) * t;
    const sc = (9.6 / depth) * size * 1.45;
    const ease = Math.min(1, dt * 2.4);
    g.position.x += (ox + stage.px * 0.1 - g.position.x) * ease;
    g.position.y += (oy + stage.py * 0.07 - g.position.y) * ease;
    g.scale.setScalar(g.scale.x + (sc - g.scale.x) * ease);

    if (!reduced) {
      const spin = stage.progress * Math.PI * 1.15;
      g.rotation.y += (spin - g.rotation.y) * Math.min(1, dt * 3.2) + dt * stage.speed * 0.09;
      g.rotation.x += (stage.py * 0.05 + 0.2 - g.rotation.x) * Math.min(1, dt * 2);
      g.rotation.z += (stage.px * 0.03 - g.rotation.z) * Math.min(1, dt * 2);
    }
    if (guides.current) guides.current.rotation.set(0, 0, 0); // guides stay in plane

    // ---- ink load per layer ----
    const presence = STAGES[i0].presence + (STAGES[i1].presence - STAGES[i0].presence) * t;
    const transition = 4 * raw * (1 - raw);
    // On a small screen the diagram shares the column with the reading, so it
    // gives way — the page is the document, the apparatus is the annotation.
    const load =
      THREE.MathUtils.clamp(0.2 + presence * 0.14 + transition * 0.06, 0.18, 0.42) *
      inkScale;

    // Connections belong to the parts of the argument about systems and
    // interconnection; elsewhere they recede almost completely.
    const netWeight = [0.05, 0.15, 0.55, 0.9, 0.35, 0.6, 0.1];
    const net = netWeight[i0] + (netWeight[i1] - netWeight[i0]) * t;

    tmpAccent.set(ACCENTS[i0]).lerp(new THREE.Color(ACCENTS[i1]), t);

    const push = (m: THREE.ShaderMaterial, target: number) => {
      const u = m.uniforms;
      u.uAlpha.value += (target - u.uAlpha.value) * Math.min(1, dt * 2.5);
      const r = u.uClear.value as THREE.Vector4[];
      for (let i = 0; i < 2; i++) {
        r[i].set(stage.clear[i * 4], stage.clear[i * 4 + 1], stage.clear[i * 4 + 2], stage.clear[i * 4 + 3]);
      }
      u.uClearCount.value = stage.clearCount;
      u.uClearAmt.value += (stage.clearAmount - u.uClearAmt.value) * Math.min(1, dt * 4);
    };
    push(mats.primary, load);
    push(mats.chord, load * net * 0.6);
    push(mats.axis, load * 0.34);
    push(mats.guide, load * 0.5);
    push(mats.node, load * 1.5 + sig * 0.1);
    (mats.node.uniforms.uAccent.value as THREE.Color).copy(tmpAccent);

    // ---- readings ----
    readings.nodes = built.nodeIdx.length;
    readings.links = Math.round(built.pairs.length * net);
    readings.segments = built.n / 2;
    readings.load = mats.primary.uniforms.uAlpha.value;
    readings.state = i0;
    readings.signal = sig;
  });

  return (
    <group ref={group}>
      <lineSegments geometry={built.axisGeo} material={mats.axis} frustumCulled={false} />
      <lineSegments ref={guides} geometry={built.guideGeo} material={mats.guide} frustumCulled={false} />
      <lineSegments geometry={built.chordGeo} material={mats.chord} frustumCulled={false} />
      <lineSegments geometry={built.primaryGeo} material={mats.primary} frustumCulled={false} />
      <points geometry={built.nodeGeo} material={mats.node} frustumCulled={false} />
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

export function Apparatus() {
  const reduced = useReducedMotion();
  const [awake, setAwake] = useState(true);

  const cfg = useMemo(() => {
    if (typeof window === "undefined")
      return { detail: 2, dpr: 1, span: 7.2, nodes: 30, ink: 1 };
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 900;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (coarse || narrow) return { detail: 2, dpr: 1, span: 9.4, nodes: 24, ink: 0.55 };
    if (mem !== undefined && mem <= 4) return { detail: 2, dpr: 1.5, span: 7.2, nodes: 34, ink: 1 };
    return { detail: 3, dpr: 2, span: 7.2, nodes: 46, ink: 1 };
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
        <Diagram
          detail={cfg.detail}
          nodeCount={cfg.nodes}
          reduced={reduced}
          inkScale={cfg.ink}
        />
      </Canvas>
    </div>
  );
}

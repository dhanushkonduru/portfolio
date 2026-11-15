"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ============================================================================
 * THE MODEL
 *
 * One cloud of points, fixed behind the whole page. It is the thing the work
 * is about, drawn three ways as the page is read:
 *
 *   a model      — a breathing sphere, in the hero and again at the end
 *   a landscape  — the loss surface the work happens on, behind the projects
 *   a vortex     — everything settling toward one answer, behind the research
 *
 * And it does the one thing the research is about. Point at it and it forgets:
 * the points under the cursor are pushed out of the model and go dark, and
 * close again when the cursor leaves.
 *
 * All of the motion is in the vertex shader. The CPU sets six uniforms a
 * frame and nothing else, so thirty thousand points cost about what one mesh
 * does.
 * ========================================================================= */

type Tier = "high" | "mid" | "low";

function detectTier(): Tier {
  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  if ((memory !== undefined && memory <= 2) || cores <= 2) return "low";
  if (coarse || window.innerWidth < 900 || cores <= 4) return "mid";
  return "high";
}

const COUNT: Record<Tier, number> = { high: 34000, mid: 17000, low: 8000 };
const MAX_DPR: Record<Tier, number> = { high: 1.75, mid: 1.5, low: 1 };

/** Deterministic, so the cloud is the same cloud on every visit. */
function mulberry(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildGeometry(count: number): THREE.BufferGeometry {
  const rand = mulberry(20260914);
  const sphere = new Float32Array(count * 3);
  const land = new Float32Array(count * 3);
  const disc = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);

  const golden = Math.PI * (3 - Math.sqrt(5));
  const cols = Math.round(Math.sqrt(count * 1.9));
  const rows = Math.ceil(count / cols);

  for (let i = 0; i < count; i++) {
    const o = i * 3;

    /* a model: an even shell, so the noise in the shader has a clean surface
       to move. */
    const y = 1 - (i / (count - 1)) * 2;
    const ring = Math.sqrt(1 - y * y);
    const theta = golden * i;
    const r = 2 + (rand() - 0.5) * 0.06;
    sphere[o] = Math.cos(theta) * ring * r;
    sphere[o + 1] = y * r;
    sphere[o + 2] = Math.sin(theta) * ring * r;

    /* a loss landscape: points in rows, so the surface reads as contours. */
    const cx = (i % cols) / (cols - 1);
    const cz = Math.floor(i / cols) / (rows - 1);
    const x = (cx - 0.5) * 17;
    const z = -7.5 + cz * 10.5;
    const basin =
      1.15 * Math.exp(-((x - 2.6) ** 2 + (z + 2) ** 2) / 3.2) +
      0.8 * Math.exp(-((x + 3.4) ** 2 + (z + 3.2) ** 2) / 4.5) -
      0.55 * Math.exp(-((x + 0.4) ** 2 + (z + 0.2) ** 2) / 2.4);
    land[o] = x;
    land[o + 1] = -2.05 + basin;
    land[o + 2] = z;

    /* a vortex: a disc with two arms, kept flat here and tilted in the
       shader after it has been turned. */
    const rr = 0.5 + Math.pow(rand(), 0.62) * 3.9;
    const arm = (i % 2) * Math.PI + rr * 1.05 + (rand() - 0.5) * 0.9;
    disc[o] = Math.cos(arm) * rr;
    disc[o + 1] = (rand() - 0.5) * 0.34 * (1 - rr / 4.8);
    disc[o + 2] = Math.sin(arm) * rr;

    seed[i * 4] = rand();
    seed[i * 4 + 1] = rand();
    seed[i * 4 + 2] = rand();
    seed[i * 4 + 3] = rand();
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(sphere, 3));
  geo.setAttribute("aLand", new THREE.BufferAttribute(land, 3));
  geo.setAttribute("aDisc", new THREE.BufferAttribute(disc, 3));
  geo.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  /* The shader moves every point, so the bounds computed from `position`
     would be wrong. Culling is turned off on the mesh instead. */
  return geo;
}

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uMorph;
  uniform float uSize;
  uniform float uForget;
  uniform vec3 uPointer;

  attribute vec3 aLand;
  attribute vec3 aDisc;
  attribute vec4 aSeed;

  varying float vAlpha;
  varying float vHeat;

  /* Simplex noise, Ashima Arts / Ian McEwan. */
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  vec3 turnY(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x * c + p.z * s, p.y, -p.x * s + p.z * c);
  }
  vec3 turnX(vec3 p, float a) {
    float c = cos(a);
    float s = sin(a);
    return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
  }

  /* Each point leaves for the next formation at its own moment, so a morph
     reads as a migration instead of a crossfade. */
  float leave(float m, float delay) {
    float t = clamp((m - delay * 0.45) / 0.55, 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }

  void main() {
    /* a model */
    vec3 a = position;
    float swell = snoise(a * 0.62 + vec3(0.0, uTime * 0.11, 0.0));
    float ripple = snoise(a * 1.9 - vec3(uTime * 0.07));
    a += normalize(a) * (swell * 0.36 + ripple * 0.07);
    a = turnY(a, uTime * 0.06);

    /* a landscape */
    vec3 b = aLand;
    b.y += snoise(vec3(b.x * 0.3, b.z * 0.3, uTime * 0.06)) * 0.5;

    /* a vortex: the inner orbits turn faster than the outer ones */
    vec3 c = aDisc;
    c = turnY(c, uTime * 0.22 / (0.5 + length(c.xz) * 0.55));
    c = turnX(c, 1.12);
    c = turnY(c, -0.32);

    vec3 p = mix(a, b, leave(uMorph, aSeed.x));
    p = mix(p, c, leave(uMorph - 1.0, aSeed.x));
    p = mix(p, a, leave(uMorph - 2.0, aSeed.x));

    vec4 world = modelMatrix * vec4(p, 1.0);

    /* Forgetting. Whatever is under the pointer is pushed out of the model
       and goes dark; the edge of the hole is what lights up. */
    vec3 away = world.xyz - uPointer;
    float reach = 1.0 - smoothstep(0.0, 1.05, length(away.xy));
    float gone = reach * uForget;
    world.xyz += normalize(vec3(away.xy, away.z * 0.35) + 0.0001) * gone * 0.85;
    vHeat = gone * (1.0 - gone) * 4.0;

    vec4 view = viewMatrix * world;
    gl_Position = projectionMatrix * view;

    float depth = -view.z;
    gl_PointSize = uSize * (0.55 + aSeed.y * 0.9) * (7.5 / depth);

    /* Nearer points are brighter, so the form has a front and a back. */
    float near = 1.0 - smoothstep(4.5, 11.5, depth);
    vAlpha = (0.28 + near * 0.72) * (0.55 + aSeed.z * 0.45) * (1.0 - gone * 0.92);
    /* A few points in every hundred carry the accent all the time. */
    vHeat = max(vHeat, step(0.94, aSeed.w) * 0.9);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uFade;
  uniform vec3 uBase;
  uniform vec3 uAccent;

  varying float vAlpha;
  varying float vHeat;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    float disc = 1.0 - smoothstep(0.18, 0.5, d);
    if (disc < 0.01) discard;
    vec3 colour = mix(uBase, uAccent, clamp(vHeat, 0.0, 1.0));
    gl_FragColor = vec4(colour, disc * vAlpha * uFade);
  }
`;

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (a: number, b: number, rate: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-rate * dt));

function Cloud({ count, reduced }: { count: number; reduced: boolean }) {
  const points = useRef<THREE.Points>(null);
  const { size, gl } = useThree();

  const geometry = useMemo(() => buildGeometry(count), [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uMorph: { value: 0 },
          uSize: { value: 2 },
          uFade: { value: 0 },
          uForget: { value: 0 },
          uPointer: { value: new THREE.Vector3(99, 99, 0) },
          uBase: { value: new THREE.Color("#f4f3ee") },
          uAccent: { value: new THREE.Color("#c8f53c") },
        },
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  /* Scroll and pointer are read from the window: the canvas sits behind the
     page with pointer events off, so it never sees either itself. */
  const input = useRef({
    x: 0,
    y: 0,
    seen: false,
    marks: { work: 1e9, research: 1e9, contact: 1e9 },
  });

  useEffect(() => {
    const measure = () => {
      const top = (id: string) => {
        const el = document.getElementById(id);
        return el ? el.getBoundingClientRect().top + window.scrollY : 1e9;
      };
      input.current.marks = {
        work: top("work"),
        research: top("research"),
        contact: top("contact"),
      };
    };
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      input.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      input.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
      input.current.seen = true;
    };
    const onLeave = () => {
      input.current.seen = false;
    };

    measure();
    const settle = window.setTimeout(measure, 800);
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    return () => {
      window.clearTimeout(settle);
      observer.disconnect();
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const live = useRef({ morph: 0, fade: 0, forget: 0, px: 0, py: 0, t: 0 });

  useFrame((state, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const u = material.uniforms;
    const s = live.current;
    const y = window.scrollY;
    const vh = window.innerHeight;
    const { work, research, contact } = input.current.marks;
    const wide = size.width >= 1024;

    /* Where the page is, as three handovers. */
    const toLand = smooth(vh * 0.12, Math.min(work, vh * 0.95), y);
    const toVortex = smooth(research - vh * 0.9, research - vh * 0.1, y);
    const toModel = smooth(contact - vh * 1.0, contact - vh * 0.25, y);
    const morph = toLand + toVortex + toModel;

    /* It is the subject in the hero and at the end, and steps back to a
       sixth of that behind anything that has to be read. */
    const intro = 1 - smooth(vh * 0.1, vh * 0.7, y);
    const want = Math.max(intro, toModel * 0.78, 0.15 + toVortex * 0.04);

    const rate = reduced ? 60 : 4;
    s.morph = damp(s.morph, morph, rate, dt);
    /* It steps back fast and comes forward slowly, so jumping from the hero
       into a section never leaves the bright model sitting over the text. */
    s.fade = damp(s.fade, want, reduced ? 60 : want < s.fade ? 7 : 2.4, dt);
    if (!reduced) s.t += dt;

    u.uTime.value = s.t;
    u.uMorph.value = s.morph;
    u.uFade.value = s.fade;
    u.uSize.value = (wide ? 2.5 : 1.9) * gl.getPixelRatio();

    /* Pointer on the plane the model sits in. */
    const cam = state.camera as THREE.PerspectiveCamera;
    const halfH = Math.tan((cam.fov * Math.PI) / 360) * cam.position.z;
    const halfW = halfH * cam.aspect;
    s.px = damp(s.px, input.current.x * halfW, 9, dt);
    s.py = damp(s.py, input.current.y * halfH, 9, dt);
    u.uPointer.value.set(s.px, s.py, 0);

    /* It only forgets while it is a model. A hole in a landscape is noise. */
    const isModel = Math.max(1 - toLand, toModel);
    const forgetting = input.current.seen && !reduced ? isModel : 0;
    s.forget = damp(s.forget, forgetting, 5, dt);
    u.uForget.value = s.forget;

    /* Composition: beside the headline in the hero, centred everywhere else. */
    const p = points.current;
    if (p) {
      const hero = 1 - toLand;
      /* Sized to the frame, so the whole model is always inside it: never
         more than about a third of the width, on any aspect ratio. */
      const scale = wide
        ? Math.min(0.9, (halfW * 0.36) / 2.4)
        : Math.min(0.62, (halfW * 0.8) / 2.4);
      const x = wide ? halfW - 2.4 * scale - halfW * 0.07 : 0;
      const yy = wide ? 0.25 : halfH * 0.42;
      /* At the end it stands clear of the closing paragraph, to the right. */
      p.position.x = lerp(wide ? toModel * halfW * 0.3 : 0, x, hero);
      p.position.y = lerp(toModel * (wide ? -0.2 : 0), yy, hero);
      p.scale.setScalar(lerp(lerp(1, wide ? 1.12 : 0.74, toModel), scale, hero));
      p.rotation.y = reduced ? 0 : s.px * 0.035;
      p.rotation.x = reduced ? 0 : -s.py * 0.03;
    }
  });

  return (
    <points
      ref={points}
      geometry={geometry}
      material={material}
      frustumCulled={false}
    />
  );
}

export default function Particles() {
  const reduced = useReducedMotion();
  const [tier, setTier] = useState<Tier | null>(null);
  const [awake, setAwake] = useState(true);

  useEffect(() => {
    setTier(detectTier());
    /* A hidden tab has no reason to hold a GPU. */
    const onVisibility = () => setAwake(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!tier) return null;

  return (
    <Canvas
      dpr={[1, MAX_DPR[tier]]}
      frameloop={awake ? "always" : "never"}
      camera={{ position: [0, 0, 7.5], fov: 45, near: 0.1, far: 40 }}
      gl={{
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
        stencil: false,
        depth: false,
      }}
    >
      <Cloud count={COUNT[tier]} reduced={reduced} />
    </Canvas>
  );
}

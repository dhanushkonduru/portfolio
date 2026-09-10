"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { stage, readings } from "./stageStore";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/* ============================================================================
 * THE CORE
 *
 * A perspective, physically-shaded reactor: machined housing rings, radial
 * segment blocks, and an inverted triangular core that is genuinely emissive
 * rather than merely bright, so the bloom pass has something real to bleed.
 *
 * The particle field is one BufferGeometry driven entirely on the GPU. Orbit,
 * scroll dispersion and cursor repulsion are all computed in the vertex
 * shader from per-point attributes — nothing is written back from the CPU, so
 * the point count costs almost nothing per frame.
 * ========================================================================= */

const SPARK_VERT = /* glsl */ `
  attribute float aAngle;
  attribute float aRadius;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aY;
  attribute float aLayer;

  uniform float uTime;
  uniform float uScroll;
  uniform float uBurst;
  uniform vec3 uMouse;
  uniform float uPixelRatio;

  varying float vLayer;
  varying float vHot;

  void main() {
    // Orbit. Scroll widens the radius and speeds the sweep, so the field
    // disperses outward as the page moves rather than merely fading.
    float spread = 1.0 + uScroll * 0.85 + uBurst * 0.5;
    float a = aAngle + uTime * aSpeed * (1.0 + uScroll * 1.4);
    float r = aRadius * spread;

    vec3 pos = vec3(cos(a) * r, aY * (1.0 + uScroll * 0.7), sin(a) * r);
    // Gentle turbulence so orbits never look like clean rails.
    pos.y += sin(uTime * 0.7 + aAngle * 3.0) * 0.09 * (1.0 + aLayer);
    pos.x += cos(uTime * 0.5 + aAngle * 2.0) * 0.05;

    // Cursor force field: push out of a soft radius, and remember how hard so
    // the fragment stage can brighten what was disturbed.
    vec2 d = pos.xy - uMouse.xy;
    float dist = length(d);
    float push = smoothstep(1.9, 0.0, dist);
    pos.xy += normalize(d + 1e-5) * push * 0.85;
    vHot = push;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (14.0 / -mv.z) * (1.0 + push * 0.6);
    vLayer = aLayer;
  }
`;

const SPARK_FRAG = /* glsl */ `
  uniform vec3 uCool;
  uniform vec3 uHot;
  varying float vLayer;
  varying float vHot;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    // Tight centre, long soft tail — reads as a spark, not a fogged disc.
    float a = pow(1.0 - d * 2.0, 2.4);
    vec3 c = mix(uCool, uHot, clamp(vLayer * 0.6 + vHot, 0.0, 1.0));
    gl_FragColor = vec4(c, a * (0.16 + vLayer * 0.28));
  }
`;

function Sparks({ count, reduced }: { count: number; reduced: boolean }) {
  const mat = useRef<THREE.ShaderMaterial>(null);
  const mouse = useRef(new THREE.Vector3());
  const burst = useRef(0);
  const lastProgress = useRef(0);

  const { geo, material } = useMemo(() => {
    const angle = new Float32Array(count);
    const radius = new Float32Array(count);
    const speed = new Float32Array(count);
    const size = new Float32Array(count);
    const y = new Float32Array(count);
    const layer = new Float32Array(count);
    const pos = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const l = Math.random();
      layer[i] = l;
      angle[i] = Math.random() * Math.PI * 2;
      // Three bands: a dense shell hugging the housing, a mid drift, and a
      // sparse far haze that gives the field depth.
      const band = i % 3;
      radius[i] = band === 0 ? 2.1 + Math.random() * 0.9 : band === 1 ? 3.0 + Math.random() * 1.8 : 4.5 + Math.random() * 3.4;
      speed[i] = (0.06 + Math.random() * 0.22) * (band === 0 ? 1.4 : 1);
      size[i] = (band === 0 ? 1.6 : band === 1 ? 1.1 : 0.7) * (0.6 + Math.random());
      y[i] = (Math.random() - 0.5) * (band === 2 ? 4.5 : 1.7);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("aAngle", new THREE.BufferAttribute(angle, 1));
    geo.setAttribute("aRadius", new THREE.BufferAttribute(radius, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speed, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(size, 1));
    geo.setAttribute("aY", new THREE.BufferAttribute(y, 1));
    geo.setAttribute("aLayer", new THREE.BufferAttribute(layer, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30);

    const material = new THREE.ShaderMaterial({
      vertexShader: SPARK_VERT,
      fragmentShader: SPARK_FRAG,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uScroll: { value: 0 },
        uBurst: { value: 0 },
        uMouse: { value: new THREE.Vector3(99, 99, 0) },
        uPixelRatio: { value: 1 },
        uCool: { value: new THREE.Color(0.22, 0.55, 1.0) },
        uHot: { value: new THREE.Color(0.85, 0.97, 1.25) },
      },
    });
    return { geo, material };
  }, [count]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const u = material.uniforms;
    u.uTime.value += reduced ? dt * 0.15 : dt;
    u.uPixelRatio.value = state.gl.getPixelRatio();

    // Scroll, eased rather than mapped straight through.
    u.uScroll.value += (stage.progress - u.uScroll.value) * Math.min(1, dt * 2.2);

    // A fast scroll throws a temporary burst, which then decays on its own.
    const delta = Math.abs(stage.progress - lastProgress.current);
    lastProgress.current = stage.progress;
    burst.current = Math.max(burst.current - dt * 1.4, Math.min(1, delta * 55));
    u.uBurst.value = burst.current + 0 * 0.3;

    // Cursor into world space on the z=0 plane, smoothed so it never twitches.
    const target = new THREE.Vector3(stage.px, stage.py, 0.5).unproject(state.camera);
    const dir = target.sub(state.camera.position).normalize();
    const hit = state.camera.position.clone().add(dir.multiplyScalar(-state.camera.position.z / dir.z));
    mouse.current.lerp(hit, Math.min(1, dt * 3.5));
    (u.uMouse.value as THREE.Vector3).copy(mouse.current);
  });

  return <points geometry={geo} material={material} frustumCulled={false} ref={mat as never} />;
}

function Housing({ reduced }: { reduced: boolean }) {
  const g = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const segs = useRef<THREE.Group>(null);

  const mats = useMemo(() => {
    const steel = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#6b747d"),
      metalness: 1,
      roughness: 0.22,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#22262b"),
      metalness: 0.9,
      roughness: 0.42,
    });
    // Values above 1 are what the bloom pass keys on.
    const glow = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 1.45, 2.3) });
    const rim = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.1, 0.34, 0.62) });
    return { steel, dark, glow, rim };
  }, []);

  const geos = useMemo(
    () => ({
      outer: new THREE.TorusGeometry(2.05, 0.2, 20, 120),
      mid: new THREE.TorusGeometry(1.55, 0.1, 14, 96),
      inner: new THREE.TorusGeometry(1.1, 0.15, 16, 80),
      seg: new THREE.BoxGeometry(0.46, 0.2, 0.34),
      tri: new THREE.CylinderGeometry(0.62, 0.62, 0.14, 3),
      halo: new THREE.TorusGeometry(0.78, 0.02, 8, 48),
    }),
    [],
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const now = performance.now() * 0.001;
    const idle = reduced ? 0 : 1;
    if (g.current) {
      // Parallax: the housing leans toward the cursor, never chases it.
      g.current.rotation.y += (stage.px * 0.22 - g.current.rotation.y) * Math.min(1, dt * 1.8);
      g.current.rotation.x += (-stage.py * 0.16 + 0.05 - g.current.rotation.x) * Math.min(1, dt * 1.8);
      g.current.position.z += (-1.6 - stage.progress * 2.2 - g.current.position.z) * Math.min(1, dt * 1.6);
    }
    if (segs.current) segs.current.rotation.z = -now * 0.12 * idle + stage.progress * 1.4;
    if (core.current) {
      const s = 1 + Math.sin(now * 1.6) * 0.02 + 0 * 0.12;
      core.current.scale.setScalar(s);
      core.current.rotation.z = Math.PI + now * 0.05 * idle;
    }
    readings.load = 0.5 + stage.progress * 0.4;
    readings.signal = 0;
  });

  return (
    <group ref={g} position={[1.75, 0.1, -1.6]}>
      <mesh geometry={geos.outer} material={mats.steel} />
      <mesh geometry={geos.mid} material={mats.dark} rotation={[0, 0, 0.2]} />
      <mesh geometry={geos.inner} material={mats.steel} />

      {/* Radial segment blocks — the mechanical teeth around the housing. */}
      <group ref={segs}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <mesh
              key={i}
              geometry={geos.seg}
              material={i % 3 === 0 ? mats.steel : mats.dark}
              position={[Math.cos(a) * 1.82, Math.sin(a) * 1.82, 0]}
              rotation={[0, 0, a]}
            />
          );
        })}
      </group>

      {/* The core: an inverted triangle, flat to camera. */}
      <mesh ref={core} geometry={geos.tri} material={mats.glow} rotation={[Math.PI / 2, 0, Math.PI]} />
      <mesh geometry={geos.halo} material={mats.rim} />
      <pointLight position={[0, 0, 1.1]} intensity={22} distance={7} color={"#9fdcff"} />
      <pointLight position={[3.2, 2.2, 3.4]} intensity={9} distance={16} color={"#3d7bff"} />
      <pointLight position={[-3.4, -1.8, 2.6]} intensity={6} distance={16} color={"#7fe6ff"} />
    </group>
  );
}


/**
 * Metal needs something to reflect. With metalness at 1 and no environment a
 * surface renders almost black, which is why the housing read as glowing tube
 * rather than machined steel. This generates one procedurally — no HDR file to
 * ship, and it is built once then dimmed so it describes the metal without
 * lighting the whole scene.
 */
function Environment() {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = env.texture;
    scene.environmentIntensity = 0.35;
    return () => {
      env.texture.dispose();
      pmrem.dispose();
      scene.environment = null;
    };
  }, [gl, scene]);
  return null;
}

/** Bloom, owned here so the scene renders through the composer. */
function Bloom({ strength }: { strength: number }) {
  const { gl, scene, camera, size } = useThree();
  const composer = useMemo(() => {
    const c = new EffectComposer(gl);
    c.addPass(new RenderPass(scene, camera));
    c.addPass(
      new UnrealBloomPass(new THREE.Vector2(size.width, size.height), strength, 0.45, 0.82),
    );
    c.addPass(new OutputPass());
    return c;
  }, [gl, scene, camera, size.width, size.height, strength]);

  useEffect(() => composer.setSize(size.width, size.height), [composer, size]);
  useFrame(() => composer.render(), 1);
  return null;
}

export function Reactor() {
  const reduced = useReducedMotion();
  const [awake, setAwake] = useState(true);

  const cfg = useMemo(() => {
    if (typeof window === "undefined") return { count: 4000, dpr: 1, bloom: 0.5 };
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const narrow = window.innerWidth < 900;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    if (coarse || narrow) return { count: 2200, dpr: 1, bloom: 0.4 };
    if (mem !== undefined && mem <= 4) return { count: 5000, dpr: 1.3, bloom: 0.5 };
    return { count: 11000, dpr: 1.7, bloom: 0.58 };
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
        camera={{ position: [0, 0, 7.4], fov: 42 }}
        frameloop={awake ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Environment />
        <ambientLight intensity={0.14} />
        <Housing reduced={reduced} />
        <Sparks count={cfg.count} reduced={reduced} />
        <Bloom strength={cfg.bloom} />
      </Canvas>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  PerformanceMonitor,
} from "@react-three/drei";
import * as THREE from "three";
import { VerificationEngine, type Tier } from "./VerificationEngine";
import { ParticleField } from "./ParticleField";
import { CameraRig } from "./CameraRig";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { pulse } from "./store";

/* ============================================================================
 * SCENE
 *
 * The only WebGL context on the site, fixed behind every section, running the
 * full height of the page. The engine is continuous; the sections scroll past
 * it.
 *
 * Quality is decided once, from what the device actually reports, and drives
 * geometry counts, particle budget, pixel ratio, antialiasing and shadows
 * together. A phone gets a simpler machine, not a smaller photograph of the
 * same one.
 * ========================================================================= */

function detectTier(): Tier {
  if (typeof navigator === "undefined") return "mid";

  const memory = (navigator as Navigator & { deviceMemory?: number })
    .deviceMemory;
  const cores = navigator.hardwareConcurrency ?? 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const narrow = window.innerWidth < 900;

  if ((memory !== undefined && memory <= 2) || cores <= 2) return "low";
  if (coarse || narrow || cores <= 4) return "mid";
  return "high";
}

/**
 * The key light leans a little toward the pointer. It is the "lighting
 * response" the brief asks for, and it is the whole of it: a few tenths of a
 * unit on an object several units across, enough that the highlights move
 * when the visitor does and nothing else changes.
 */
/**
 * Keeps the tone-mapping exposure in step with the breakpoint, so rotating a
 * phone or dragging a desktop window across 1280 does not leave the engine
 * lit for the other layout.
 */
function Exposure() {
  const { gl, size } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = window.innerWidth < 1280 ? 0.62 : 1.18;
  }, [gl, size.width]);
  return null;
}

function KeyLight({
  shadows,
  reduced,
}: {
  shadows: boolean;
  reduced: boolean;
}) {
  const ref = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    if (!ref.current || reduced) return;
    ref.current.position.set(5 + pulse.sx * 0.9, 8 + pulse.sy * 0.5, 6);
  });
  return (
    <directionalLight
      ref={ref}
      position={[5, 8, 6]}
      intensity={3.2}
      color={0xdce8f7}
      castShadow={shadows}
      shadow-mapSize={[1536, 1536]}
      shadow-bias={-0.0018}
      shadow-normalBias={0.025}
      shadow-camera-near={2}
      shadow-camera-far={26}
      shadow-camera-left={-4.5}
      shadow-camera-right={4.5}
      shadow-camera-top={4.5}
      shadow-camera-bottom={-4.5}
    />
  );
}

const PARTICLES: Record<Tier, number> = { high: 1100, mid: 340, low: 160 };

const MAX_DPR: Record<Tier, number> = { high: 1.4, mid: 1.25, low: 1 };

export function Scene() {
  const reduced = useReducedMotion();
  const [tier, setTier] = useState<Tier | null>(null);
  const [awake, setAwake] = useState(true);
  /**
   * Resolution is not decided once and hoped for. The device tier sets the
   * ceiling; if the machine cannot actually hold frame rate there, the
   * renderer drops its pixel ratio rather than letting the page stutter.
   * Nothing about the composition changes — only how many pixels it costs.
   */
  const [dpr, setDpr] = useState(1);

  useEffect(() => {
    const t = detectTier();
    setTier(t);
    setDpr(MAX_DPR[t]);
  }, []);

  /* A hidden tab has no reason to hold a GPU. */
  useEffect(() => {
    const onVisibility = () => setAwake(!document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  if (!tier) return null;

  const shadows = tier === "high" && !reduced;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
      data-engine
    >
      <Canvas
        dpr={dpr}
        frameloop={awake ? "always" : "never"}
        shadows={shadows ? "soft" : false}
        camera={{ position: [0.4, 0.9, 11.2], fov: 38, near: 0.3, far: 60 }}
        gl={{
          antialias: tier !== "low",
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          /* Held just above one on a desktop: the bay stays dark, and the
             exposure is what lets the machining read inside it rather than
             bloom. Below xl the engine sits behind the reading instead of
             beside it, so it is exposed down at the source — a darker
             machine, not a lit one with a grey sheet over it. */
          gl.toneMappingExposure = window.innerWidth < 1280 ? 0.62 : 1.18;
        }}
      >
        <PerformanceMonitor
          onDecline={() => setDpr(1)}
          onIncline={() => setDpr(MAX_DPR[tier])}
        />

        <Exposure />

        <CameraRig reduced={reduced} />

        {/* ── lighting ──────────────────────────────────────────────────
            A key that reveals the machining, a cold fill that keeps the dark
            side readable, and a rim that separates the silhouette from the
            bay. Nothing here is coloured for effect; it is all one cool
            white at three temperatures. */}
        <ambientLight intensity={0.32} color={0x93abc6} />

        <KeyLight shadows={shadows} reduced={reduced} />

        <directionalLight
          position={[-7, 1.5, 4]}
          intensity={1.1}
          color={0x6b87a8}
        />

        <directionalLight
          position={[-2, 5, -8]}
          intensity={2.2}
          color={0x8dbcf0}
        />

        {/* ── reflections ───────────────────────────────────────────────
            Baked once from a handful of emissive panels. Metal with nothing
            to reflect reads as plastic, and a downloaded HDRI is a network
            request the page does not need to make. */}
        <Environment resolution={128} frames={1}>
          <color attach="background" args={["#05070a"]} />
          {/* A bay has a ceiling. The strongest reflection on a standing
              machine comes from above, so the largest panel is overhead. */}
          <Lightformer
            intensity={5}
            color="#dcebfb"
            position={[0, 7, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            scale={[12, 12, 1]}
          />
          <Lightformer
            intensity={3.2}
            color="#c9dcf2"
            position={[0, 3, -7]}
            scale={[14, 4, 1]}
          />
          <Lightformer
            intensity={2.6}
            color="#7290b2"
            position={[-7, 1, 2]}
            rotation={[0, Math.PI / 2, 0]}
            scale={[8, 6, 1]}
          />
          <Lightformer
            intensity={3.4}
            color="#b3d4f2"
            position={[7, -0.5, 1]}
            rotation={[0, -Math.PI / 2, 0]}
            scale={[6, 6, 1]}
          />
          <Lightformer
            form="ring"
            intensity={3.2}
            color="#cfe4f8"
            position={[0, 0, -4.5]}
            scale={3.2}
          />
        </Environment>

        <VerificationEngine tier={tier} reduced={reduced} />
        <ParticleField count={PARTICLES[tier]} reduced={reduced} />
      </Canvas>
    </div>
  );
}

"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeConfig, pulse, sampleStage } from "./store";

/* ============================================================================
 * PARTICLE FIELD
 *
 * Data, not decoration — and deliberately sparse. Particles occupy a column
 * of air around the engine rather than filling the frame, because their job
 * is to describe the depth of the bay and the activity of the machine, not to
 * be the thing you look at.
 *
 * Drift is computed in the vertex shader. Moving a thousand points on the CPU
 * every frame is a thousand writes and a buffer upload for something a sine
 * wave can do for free on the GPU.
 * ========================================================================= */

const VERT = /* glsl */ `
  attribute vec3 aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uDust;
  uniform vec2 uPointer;
  varying float vFade;

  void main() {
    vec3 p = position;

    /* Each point drifts on its own three phases, so the field never reads as
       one mass moving together. */
    float rate = 0.14 + aSeed.z * 0.2;
    p.x += sin(uTime * rate + aSeed.x * 6.28318) * 0.12;
    p.y += cos(uTime * rate * 0.82 + aSeed.y * 6.28318) * 0.16;
    p.z += sin(uTime * rate * 0.6 + aSeed.z * 6.28318) * 0.12;

    /* A shallow push away from the cursor. Restrained: the point of it is that
       you notice the field is aware of you, not that you can shove it. */
    p.xy += uPointer * (0.06 + aSeed.z * 0.1);

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float dist = -mv.z;
    gl_PointSize = uSize * (1.0 + aSeed.x * 0.9) * (7.0 / max(dist, 0.6));

    /* Fade the near plane and the far field: points that pass through the
       camera read as dirt on the lens. */
    vFade = smoothstep(1.2, 3.6, dist) * (1.0 - smoothstep(11.0, 19.0, dist));
    vFade *= uDust * (0.35 + aSeed.y * 0.65);
  }
`;

const FRAG = /* glsl */ `
  varying float vFade;
  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r = dot(d, d);
    if (r > 0.25) discard;
    float soft = 1.0 - smoothstep(0.04, 0.25, r);
    gl_FragColor = vec4(vec3(0.74, 0.84, 0.97), soft * vFade * 0.85);
  }
`;

export function ParticleField({
  count,
  reduced,
}: {
  count: number;
  reduced: boolean;
}) {
  const points = useRef<THREE.Points>(null);
  const cfg = useMemo(makeConfig, []);

  const geometry = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      /* A standing column of air around a standing machine: points sit just
         outside the engine's envelope and thin out with height, the way dust
         does in a lit bay. */
      const r = 1.3 + Math.pow(Math.random(), 0.55) * 3.4;
      const theta = Math.random() * Math.PI * 2;
      const y = -2.3 + Math.pow(Math.random(), 0.8) * 6.4;

      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = r * Math.sin(theta);

      seed[i * 3] = Math.random();
      seed[i * 3 + 1] = Math.random();
      seed[i * 3 + 2] = Math.random();
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    g.computeBoundingSphere();
    return g;
  }, [count]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uSize: { value: 1.5 },
          uDust: { value: 0 },
          uPointer: { value: new THREE.Vector2() },
        },
      }),
    [],
  );

  useLayoutEffect(() => {
    const g = geometry;
    const m = material;
    return () => {
      g.dispose();
      m.dispose();
    };
  }, [geometry, material]);

  useFrame((state, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    sampleStage(pulse.p, cfg);
    const u = material.uniforms;

    if (!reduced) u.uTime.value = state.clock.elapsedTime;

    /* Activity rises with the stage and with how hard the page is being
       scrolled — the field is a readout of the machine's load. */
    const want = cfg.dust * (0.72 + pulse.speed * 0.4);
    u.uDust.value += (want - u.uDust.value) * (1 - Math.exp(-3 * dt));

    const p = u.uPointer.value as THREE.Vector2;
    if (!reduced) {
      p.x += (pulse.px - p.x) * (1 - Math.exp(-2 * dt));
      p.y += (pulse.py - p.y) * (1 - Math.exp(-2 * dt));
    }

    if (points.current && !reduced) {
      points.current.rotation.y = state.clock.elapsedTime * 0.01;
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

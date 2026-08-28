"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { FIELD_FRAG, FIELD_VERT } from "./shaders";
import { STAGES } from "./stages";
import { stage } from "./stageStore";

const LAST = STAGES.length - 1;

/** The journey route. Must stay identical to pathAt() in the vertex shader. */
const PATH = [
  new THREE.Vector3(-4.8, -2.1, -1.1),
  new THREE.Vector3(-2.4, -0.8, 0.9),
  new THREE.Vector3(0, 0.25, -0.7),
  new THREE.Vector3(2.4, 1.15, 0.9),
  new THREE.Vector3(4.8, 2.1, -0.4),
];

const _pa = new THREE.Vector3();
const _tmp = new THREE.Vector3();
function pathAt(t: number, out: THREE.Vector3) {
  const u = Math.min(0.9999, Math.max(0, t)) * 4;
  const i = Math.floor(u);
  return out.copy(PATH[i]).lerp(_pa.copy(PATH[i + 1]), u - i);
}

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Ken Perlin's smootherstep — no second-derivative kink at the ends. */
function smootherstep(e0: number, e1: number, x: number) {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

export function SystemField({
  count,
  reducedMotion,
}: {
  count: number;
  reducedMotion: boolean;
}) {
  const material = useRef<THREE.ShaderMaterial>(null);
  const pathLine = useRef<THREE.LineSegments>(null);
  const mesh = useRef<THREE.LineSegments>(null);
  const arch = useRef<THREE.LineSegments>(null);
  const camLook = useRef(new THREE.Vector3());
  const camPos = useRef(new THREE.Vector3());
  const speed = useRef(0);
  const { camera, viewport } = useThree();

  const pointer = useRef(new THREE.Vector2());
  const camTarget = useRef(new THREE.Vector3(...STAGES[0].camera));
  const reveal = useRef(0);

  /* ---------------- geometry: direction + seed, nothing per-state ---------- */
  const geometry = useMemo(() => {
    const dir = new Float32Array(count * 3);
    const seed = new Float32Array(count * 3);
    const id = new Float32Array(count);
    const group = new Float32Array(count);

    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
      // Fibonacci sphere: even coverage, so every state inherits an even
      // distribution instead of clumping wherever Math.random() happened to.
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;

      dir[i * 3] = Math.cos(theta) * r;
      dir[i * 3 + 1] = y;
      dir[i * 3 + 2] = Math.sin(theta) * r;

      seed[i * 3] = Math.random();
      seed[i * 3 + 1] = Math.random();
      seed[i * 3 + 2] = Math.random();

      id[i] = i / (count - 1);
      group[i] = i % 7;
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(dir.slice(), 3));
    g.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 3));
    g.setAttribute("aId", new THREE.BufferAttribute(id, 1));
    g.setAttribute("aGroup", new THREE.BufferAttribute(group, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 12);
    return g;
  }, [count]);

  /* The journey path, drawn once. Visible only while the field is a path. */
  const pathGeometry = useMemo(() => {
    const k = [
      new THREE.Vector3(-4.8, -2.1, -1.1),
      new THREE.Vector3(-2.4, -0.8, 0.9),
      new THREE.Vector3(0, 0.25, -0.7),
      new THREE.Vector3(2.4, 1.15, 0.9),
      new THREE.Vector3(4.8, 2.1, -0.4),
    ];
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 4; i++) {
      for (let s = 0; s < 24; s++) {
        pts.push(k[i].clone().lerp(k[i + 1], s / 24));
        pts.push(k[i].clone().lerp(k[i + 1], (s + 1) / 24));
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  /* Axis-aligned lattice edges. The particles snap to this same grid in the
     structure state, so the segments read as the relationships between them
     rather than as separate decoration. */
  const meshGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const N = 3;
    const step = 1 / 1.2;
    for (let x = -N; x <= N; x++)
      for (let y = -N; y <= N; y++)
        for (let z = -N; z <= N; z++) {
          const a = new THREE.Vector3(x * step, y * step * 1.18, z * step);
          if (a.length() > 3.1 || a.length() < 1.1) continue;
          if (x < N) {
            pts.push(a.clone(), a.clone().setX((x + 1) * step));
          }
          if (y < N) {
            pts.push(a.clone(), a.clone().setY((y + 1) * step * 1.18));
          }
        }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  /* The architecture. Four slabs on discrete floors, matching the columns the
     particles occupy in the same state, so the wireframe reads as the building
     those points belong to rather than as another layer on top. */
  const archGeometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const push = (a: THREE.Vector3, b: THREE.Vector3) => pts.push(a, b);

    for (let col = 0; col < 4; col++) {
      const x = (col - 1.5) * 2.5;
      const z = ((col % 2) - 0.5) * 1.7;
      const hw = 0.66;
      const top = 2.7;
      const bot = -2.7;

      // uprights
      for (const sx of [-hw, hw])
        for (const sz of [-hw, hw])
          push(
            new THREE.Vector3(x + sx, bot, z + sz),
            new THREE.Vector3(x + sx, top, z + sz),
          );

      // floors, on the same discrete steps the particles quantise to
      for (let f = 0; f <= 6; f++) {
        const y = bot + ((top - bot) * f) / 6;
        const c = [
          new THREE.Vector3(x - hw, y, z - hw),
          new THREE.Vector3(x + hw, y, z - hw),
          new THREE.Vector3(x + hw, y, z + hw),
          new THREE.Vector3(x - hw, y, z + hw),
        ];
        for (let i = 0; i < 4; i++) push(c[i], c[(i + 1) % 4]);
      }
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uShapeA: { value: 0 },
      uShapeB: { value: 0 },
      uMix: { value: 0 },
      uSizeA: { value: 1 },
      uSizeB: { value: 1 },
      // Fewer points over the same volume reads as a thinner field, so the
      // point scale compensates: density and weight stay in proportion.
      uSize: { value: count < 3200 ? 3.3 : 2.9 },
      uPixelRatio: { value: 1 },
      uPointer: { value: new THREE.Vector2() },
      uProbe: { value: 4 },
      uProbeStrength: { value: 0 },
      uAccentA: { value: new THREE.Vector3(...STAGES[0].accent) },
      uAccentB: { value: new THREE.Vector3(...STAGES[0].accent) },
      uClear: { value: [new THREE.Vector4(), new THREE.Vector4()] },
      uClearCount: { value: 0 },
      uClearAmount: { value: 0 },
      uReveal: { value: 0 },
      uPresence: { value: 1 },
      uFocus: { value: -1 },
      uFocusAmt: { value: 0 },
      uSpeed: { value: 0 },
      uDensity: { value: 1 },
    }),
    [count],
  );

  useFrame((_, delta) => {
    const m = material.current;
    if (!m) return;

    const d = Math.min(delta, 0.05); // a backgrounded tab must not lurch
    const u = m.uniforms;

    /* Frame-rate independent easing. A fixed per-frame factor makes every
       transition twice as fast on a 120Hz display and crawl on a throttled
       tab; this converges in wall-clock time instead. */
    const k = (rate: number) => 1 - Math.exp(-rate * d);

    u.uTime.value += reducedMotion ? 0 : d;
    u.uPixelRatio.value = viewport.dpr;

    /* Entry: the field resolves in rather than popping. */
    reveal.current += (1 - reveal.current) * (reducedMotion ? 1 : k(3.5));
    u.uReveal.value = reveal.current;

    /* ---- stage blend ------------------------------------------------- */
    const p = Math.max(0, Math.min(LAST, stage.p));
    const a = Math.min(LAST, Math.floor(p));
    const b = Math.min(LAST, a + 1);

    // Hold each state through the middle of its section, then transform
    // decisively between. A linear mix would leave the field permanently
    // half-way between two ideas and read as mush.
    const mix = smootherstep(0.2, 0.8, p - a);

    const SA = STAGES[a];
    const SB = STAGES[b];

    u.uShapeA.value = SA.shape;
    u.uShapeB.value = SB.shape;
    u.uMix.value = mix;
    u.uSizeA.value = SA.size;
    u.uSizeB.value = SB.size;

    // Presence replaces the old section backgrounds: the field steps back
    // where the reading is dense instead of being covered by a panel.
    u.uPresence.value = SA.presence + (SB.presence - SA.presence) * mix;
    u.uDensity.value = SA.density + (SB.density - SA.density) * mix;

    (u.uAccentA.value as THREE.Vector3).set(...SA.accent);
    (u.uAccentB.value as THREE.Vector3).set(...SB.accent);

    /* ---- the probe -----------------------------------------------------
       Scrolling the research section IS the probe descending through the
       specimen. That is the one interaction the whole site argues for. */
    const probeT = clamp01(p - 3.5);
    u.uProbe.value = 3.6 - probeT * 7.2;
    u.uProbeStrength.value = reducedMotion
      ? 0.35
      : Math.max(0, 1 - Math.abs(p - 4) / 0.85);

    /* ---- pointer, eased ---- */
    const kp = k(2.6);
    pointer.current.x += (stage.px - pointer.current.x) * kp;
    pointer.current.y += (stage.py - pointer.current.y) * kp;
    (u.uPointer.value as THREE.Vector2).copy(pointer.current);

    /* ---- hero typography clearance ---- */
    u.uClearCount.value = stage.clearCount;
    u.uClearAmount.value += (stage.clearAmount - u.uClearAmount.value) * k(8);
    const rects = u.uClear.value as THREE.Vector4[];
    for (let i = 0; i < 2; i++) {
      rects[i].set(
        stage.clear[i * 4],
        stage.clear[i * 4 + 1],
        stage.clear[i * 4 + 2],
        stage.clear[i * 4 + 3],
      );
    }

    /* ---- energy ------------------------------------------------------
       stage.speed only updates while scroll events fire, so it has to decay
       on its own once the page settles. */
    const idle = performance.now() - stage.lastMoveAt > 90;
    const wantSpeed = idle ? 0 : stage.speed;
    speed.current += (wantSpeed - speed.current) * k(idle ? 3.2 : 9);
    u.uSpeed.value = speed.current;

    /* ---- domain focus (Stack hover, Work hover) ---- */
    u.uFocus.value = stage.focus;
    u.uFocusAmt.value += (stage.focusAmt - u.uFocusAmt.value) * k(6);

    /* ---- camera choreography ------------------------------------------
       Slow, and never pointed anywhere but the centre of the specimen. */
    camTarget.current.set(
      SA.camera[0] + (SB.camera[0] - SA.camera[0]) * mix,
      SA.camera[1] + (SB.camera[1] - SA.camera[1]) * mix,
      SA.camera[2] + (SB.camera[2] - SA.camera[2]) * mix,
    );

    /* Through the journey the camera stops observing and starts travelling:
       it rides the route and looks along it, so the timeline is somewhere you
       move rather than something you read. */
    const ride = Math.max(0, 1 - Math.abs(p - 5) / 0.9);
    camLook.current.set(0, 0, 0);
    if (ride > 0.001) {
      const t = clamp01(p - 4.5);
      pathAt(t, camPos.current);
      camTarget.current.lerp(
        _tmp.set(camPos.current.x * 0.55, camPos.current.y * 0.7 + 0.4, 5.6),
        ride,
      );
      camLook.current.lerp(camPos.current, ride * 0.85);
    }

    /* A camera that parks at a waypoint reads as a slideshow. Give it a slow
       dolly across each chapter so it is always moving, even while the state
       is being held. */
    const sub = p - Math.floor(p);
    camTarget.current.z += (0.5 - sub) * 0.7;
    camTarget.current.y += (sub - 0.5) * 0.22;

    /* Focusing a project pulls the camera toward its slab and closes the
       distance slightly: attention, expressed as depth. */
    if (u.uFocusAmt.value > 0.01 && a === 3) {
      const slabX = (Math.max(0, u.uFocus.value) - 1.5) * 2.5;
      camTarget.current.x += (slabX - camTarget.current.x) * 0.35 * u.uFocusAmt.value;
      camTarget.current.z -= 0.9 * u.uFocusAmt.value;
    }

    /* Moving fast pulls the camera back: more of the world, less detail. */
    camTarget.current.z += speed.current * 1.1;

    camera.position.lerp(camTarget.current, reducedMotion ? 1 : k(2.4));
    camera.lookAt(camLook.current);

    /* ---- the connection lattice (structure state) ---- */
    if (mesh.current) {
      const mat = mesh.current.material as THREE.LineBasicMaterial;
      const want = Math.max(0, 1 - Math.abs(p - 1) / 0.85) * 0.16;
      mat.opacity += (want - mat.opacity) * k(4);
      mesh.current.visible = mat.opacity > 0.004;
    }

    /* ---- the architecture (Work chapter) ---- */
    if (arch.current) {
      const mat = arch.current.material as THREE.LineBasicMaterial;
      const want = Math.max(0, 1 - Math.abs(p - 3) / 0.9) * 0.3;
      mat.opacity += (want - mat.opacity) * k(4);
      arch.current.visible = mat.opacity > 0.004;
    }

    /* ---- the journey line ---- */
    if (pathLine.current) {
      const mat = pathLine.current.material as THREE.LineBasicMaterial;
      const want = Math.max(0, 1 - Math.abs(p - 5) / 0.7) * 0.5;
      mat.opacity += (want - mat.opacity) * k(5);
      pathLine.current.visible = mat.opacity > 0.004;
    }
  });

  return (
    <group>
      <points geometry={geometry} frustumCulled={false}>
        <shaderMaterial
          ref={material}
          uniforms={uniforms}
          vertexShader={FIELD_VERT}
          fragmentShader={FIELD_FRAG}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <lineSegments ref={mesh} geometry={meshGeometry} frustumCulled={false}>
        <lineBasicMaterial
          color="#5ee9c0"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </lineSegments>

      <lineSegments ref={arch} geometry={archGeometry} frustumCulled={false}>
        <lineBasicMaterial
          color="#7c6bff"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </lineSegments>

      <lineSegments ref={pathLine} geometry={pathGeometry} frustumCulled={false}>
        <lineBasicMaterial
          color="#56c6f5"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

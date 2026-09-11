"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { makeConfig, pulse, sampleStage } from "./store";

/* ============================================================================
 * CAMERA RIG
 *
 * Scroll moves the camera, not the sections. Position and aim are both
 * critically damped toward the sampled stage, so a fast flick arrives without
 * overshoot and a slow scroll reads as a continuous dolly rather than a cut.
 *
 * Two things are added on top, both deliberately small: the camera follows the
 * pointer a little, and it breathes. Neither is large enough to be noticed on
 * its own; together they are the difference between a rendered image and a
 * camera in a room.
 * ========================================================================= */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const damp = (a: number, b: number, rate: number, dt: number) =>
  lerp(a, b, 1 - Math.exp(-rate * dt));

export function CameraRig({ reduced }: { reduced: boolean }) {
  const cfg = useMemo(makeConfig, []);
  const aim = useMemo(() => new THREE.Vector3(0, 0.05, 0), []);
  const px = useRef(0);
  const py = useRef(0);
  const fov = useRef(0);

  useFrame((state, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const t = state.clock.elapsedTime;
    const cam = state.camera as THREE.PerspectiveCamera;

    sampleStage(pulse.p, cfg);

    /* Composition is not the same problem on every screen. Below xl the type
       runs the full width, so the engine is centred, pushed back a little,
       and lifted into a band of its own at the top of the hero. A tower is
       the right shape for that: it crops cleanly against the top edge. */
    /* The breakpoint is read from the viewport, not the canvas. The canvas
       sits beside the scrollbar and comes up fifteen pixels short, so at
       exactly 1280 it would take the narrow path while the stylesheet — which
       measures the viewport, scrollbar included — takes the desktop one. The
       two layers must agree, so both read the same number. */
    const w = state.size.width;
    const narrow = window.innerWidth < 1280;
    /* On a phone the hero keeps the engine close enough to read as an
       object, but a docked stage puts it behind the words, so it retreats
       further the more the page is being read. */
    const dolly = narrow ? 1.42 + cfg.dock * 0.55 : 1;
    const offset = narrow ? 0.1 : 1;

    const wantFov = narrow ? 44 : 38;
    if (fov.current !== wantFov) {
      fov.current = wantFov;
      cam.fov = wantFov;
      cam.updateProjectionMatrix();
    }

    const rate = reduced ? 0 : 2.6;
    px.current = damp(px.current, reduced ? 0 : pulse.px, rate, dt);
    py.current = damp(py.current, reduced ? 0 : pulse.py, rate, dt);

    const breath = reduced ? 0 : 1;
    /* A docked stage keeps the camera on the engine's axis: the placement
       below is exact only from there, and the three-quarter view a lateral
       camera would give is already provided by the stage's yaw. */
    const wx =
      lerp(cfg.cam[0], 0, cfg.dock) +
      px.current * 0.42 +
      Math.sin(t * 0.13) * 0.05 * breath;
    const wy =
      cfg.cam[1] + py.current * 0.26 + Math.sin(t * 0.19) * 0.05 * breath;
    const wz = cfg.cam[2] * dolly;

    const settle = reduced ? 60 : 3.4;
    cam.position.x = damp(cam.position.x, wx, settle, dt);
    cam.position.y = damp(cam.position.y, wy, settle, dt);
    cam.position.z = damp(cam.position.z, wz, settle, dt);

    /* Bias is a screen fraction, so it is converted through the frustum's own
       half-width at this distance. Aiming the camera away from the assembly by
       that much is what slides the assembly across the frame. */
    const halfWidth =
      Math.tan((wantFov * Math.PI) / 360) * (w / state.size.height) * wz;

    /* Aiming below the engine lifts it up the frame; the hero leaves the
       matching space open above the headline. */
    const halfHeight = Math.tan((wantFov * Math.PI) / 360) * wz;
    /* The band shrinks on a short screen, so the lift that puts the engine
       inside it shrinks with it. */
    const riseY = narrow ? (window.innerHeight < 740 ? 0.44 : 0.3) : 0;

    /* Docking. The reading lane is 54rem wide and right-aligned inside the
       rail, so its left edge is a function of the viewport that can be
       computed exactly, not guessed. The engine's envelope, arms extended and a
       module turned toward the camera, is about 2.75 units either side of its
       axis; the bias that puts that edge a gap left of the
       lane is derived from the frustum at this distance. Between a composed
       stage and a docked one the two placements are simply blended. */
    const navPad = Math.max(144, Math.min(w * 0.12, 224));
    const laneLeft = Math.max(64, w - navPad - 864);
    const rightEdge = laneLeft - 44;
    const envelopePx = (2.75 / halfWidth) * (w / 2);
    const dockedBias = (rightEdge - envelopePx - w / 2) / (w / 2);
    const bias = narrow ? cfg.bias : lerp(cfg.bias, dockedBias, cfg.dock);

    aim.x = damp(aim.x, -bias * offset * halfWidth, settle, dt);
    aim.y = damp(aim.y, cfg.target[1] - riseY * halfHeight, settle, dt);
    aim.z = damp(aim.z, cfg.target[2], settle, dt);
    cam.lookAt(aim);
  });

  return null;
}

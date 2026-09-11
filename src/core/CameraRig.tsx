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

const damp = (a: number, b: number, rate: number, dt: number) =>
  a + (b - a) * (1 - Math.exp(-rate * dt));

export function CameraRig({ reduced }: { reduced: boolean }) {
  const cfg = useMemo(makeConfig, []);
  const aim = useMemo(() => new THREE.Vector3(-1.15, 0, 0), []);
  const px = useRef(0);
  const py = useRef(0);
  const fov = useRef(0);

  useFrame((state, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const t = state.clock.elapsedTime;
    const cam = state.camera as THREE.PerspectiveCamera;

    sampleStage(pulse.p, cfg);

    /* Composition is not the same problem on every screen. A narrow viewport
       has no room for the machine to sit off-centre beside a column of type,
       so it is centred and pushed back instead of being cropped. */
    const w = state.size.width;
    const narrow = w < 1280;
    const dolly = narrow ? 1.3 : 1;
    /* Below xl the type runs full width and the machine is behind it, so the
       sideways placement is collapsed almost to nothing. */
    const offset = narrow ? 0.12 : 1;

    const wantFov = narrow ? 46 : 38;
    if (fov.current !== wantFov) {
      fov.current = wantFov;
      cam.fov = wantFov;
      cam.updateProjectionMatrix();
    }

    const rate = reduced ? 0 : 2.6;
    px.current = damp(px.current, reduced ? 0 : pulse.px, rate, dt);
    py.current = damp(py.current, reduced ? 0 : pulse.py, rate, dt);

    const breath = reduced ? 0 : 1;
    const wx =
      cfg.cam[0] + px.current * 0.42 + Math.sin(t * 0.13) * 0.05 * breath;
    const wy =
      cfg.cam[1] + py.current * 0.3 + Math.sin(t * 0.19) * 0.06 * breath;
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

    /* Below xl the page is one column, so the machine is given a band of its
       own at the top of the screen rather than being pushed sideways into a
       lane that does not exist. Aiming below the assembly lifts it up the
       frame; the hero leaves the matching space open. */
    const halfHeight = Math.tan((wantFov * Math.PI) / 360) * wz;
    const riseY = narrow ? 0.62 : 0;

    aim.x = damp(aim.x, -cfg.bias * offset * halfWidth, settle, dt);
    aim.y = damp(aim.y, cfg.target[1] - riseY * halfHeight, settle, dt);
    aim.z = damp(aim.z, cfg.target[2], settle, dt);
    cam.lookAt(aim);
  });

  return null;
}

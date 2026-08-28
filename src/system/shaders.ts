/* ============================================================================
 * FIELD SHADERS
 *
 * Seven states, generated procedurally from a per-particle direction and seed.
 * Nothing is precomputed per state on the CPU: the vertex shader evaluates the
 * two states either side of the scroll position and mixes them, so a
 * transformation is exact and free at any point between stages.
 *
 * Written against GLSL ES 1.00 — constant loop bounds, no dynamic breaks.
 * ========================================================================= */

export const FIELD_VERT = /* glsl */ `
  uniform float uTime;
  uniform float uShapeA;
  uniform float uShapeB;
  uniform float uMix;
  uniform float uSizeA;
  uniform float uSizeB;
  uniform float uSize;
  uniform float uPixelRatio;
  uniform vec2  uPointer;
  uniform float uProbe;
  uniform float uProbeStrength;
  uniform vec3  uAccentA;
  uniform vec3  uAccentB;
  uniform vec4  uClear[2];
  uniform float uClearCount;
  uniform float uClearAmount;
  uniform float uReveal;
  uniform float uPresence;
  uniform float uFocus;      // index of a focused cluster, -1 for none
  uniform float uFocusAmt;
  uniform float uSpeed;      // scroll energy, 0..1
  uniform float uDensity;    // fraction of the budget actually drawn

  attribute vec3  aDir;      // unit vector, evenly distributed
  attribute vec3  aSeed;     // three independent randoms
  attribute float aId;       // 0..1 ordinal
  attribute float aGroup;    // 0..6 domain

  varying vec3  vColor;
  varying float vAlpha;
  varying float vBand;

  /* The journey path: five milestones, walked end to end. */
  vec3 pathAt(float t) {
    vec3 k0 = vec3(-4.8, -2.1, -1.1);
    vec3 k1 = vec3(-2.4, -0.8,  0.9);
    vec3 k2 = vec3( 0.0,  0.25,-0.7);
    vec3 k3 = vec3( 2.4,  1.15, 0.9);
    vec3 k4 = vec3( 4.8,  2.1, -0.4);

    float u = clamp(t, 0.0, 0.9999) * 4.0;
    float i = floor(u);
    float f = u - i;

    vec3 a = i < 0.5 ? k0 : (i < 1.5 ? k1 : (i < 2.5 ? k2 : k3));
    vec3 b = i < 0.5 ? k1 : (i < 1.5 ? k2 : (i < 2.5 ? k3 : k4));
    return mix(a, b, f);
  }

  vec3 shape(float s, out float alpha, out float mark) {
    alpha = 1.0;
    mark = 0.0;

    /* 0 — DISPERSED. Unresolved. Nothing has been measured yet. */
    if (s < 0.5) {
      vec3 p = aDir * (3.5 + aSeed.x * 3.7);
      p += (aSeed - 0.5) * 1.3;
      alpha = 0.50 + aSeed.y * 0.5;
      return p;
    }

    /* 1 — LATTICE. Structure asserts itself; a few points stay loose. */
    if (s < 1.5) {
      vec3 p = aDir * (2.5 + aSeed.x * 1.7);
      p.y *= 1.18;
      vec3 g = floor(p * 1.2 + 0.5) / 1.2;
      float lock = step(0.18, aSeed.y);
      p = mix(p, g, lock * 0.92);
      alpha = 0.44 + aSeed.z * 0.55;
      return p;
    }

    /* 2 — DOMAINS. Seven discrete clusters. Grouping is the whole message,
       so the geometry says it without a single label. */
    if (s < 2.5) {
      float a = (aGroup / 7.0) * 6.28318 + 0.35;
      vec3 c = vec3(cos(a) * 4.1, (fract(aGroup * 0.41) - 0.5) * 2.9, sin(a) * 2.3);
      vec3 p = c + (aSeed - 0.5) * 1.2;

      /* Hovering a domain in the DOM pulls its cluster forward. */
      float hit = 1.0 - step(0.5, abs(aGroup - uFocus));
      p += normalize(c) * hit * uFocusAmt * 0.85;
      alpha = (0.46 + aSeed.y * 0.5) * mix(1.0, 0.35 + hit * 0.9, uFocusAmt);
      return p;
    }

    /* 3 — ARCHITECTURE. Orthogonal slabs on discrete floors: a building
       section rather than a cloud. */
    if (s < 3.5) {
      float col = mod(aGroup, 4.0);
      vec3 c = vec3((col - 1.5) * 2.5, 0.0, (mod(aGroup, 2.0) - 0.5) * 1.7);
      vec3 b = (aSeed - 0.5) * vec3(1.3, 5.6, 1.3);
      b.y = floor(b.y * 2.6) / 2.6;

      /* A project hovered in the DOM pulls its slab forward and holds the
         rest back, so the architecture reorganises around it. */
      float hit = 1.0 - step(0.5, abs(col - uFocus));
      vec3 p = c + b;
      p.z += hit * uFocusAmt * 1.5;
      p.y *= 1.0 + hit * uFocusAmt * 0.12;
      alpha = (0.42 + aSeed.z * 0.55) * mix(1.0, 0.3 + hit * 1.0, uFocusAmt);
      return p;
    }

    /* 4 — EVIDENCE. A specimen with one owner's records marked. The probe
       plane descends; what it passes is displaced and fades. This is the
       argument the whole site is built on. */
    if (s < 4.5) {
      vec3 p = aDir * (2.5 + aSeed.x * 0.55);
      p.y *= 1.32;
      float align = dot(aDir, normalize(vec3(0.58, 0.26, -0.77)));
      mark = smoothstep(0.54, 0.71, align);
      float erased = mark * step(p.y, uProbe);
      p += aDir * erased * (0.5 + aSeed.y * 0.75);
      alpha = (0.52 + aSeed.z * 0.5) * (1.0 - erased * 0.78);
      return p;
    }

    /* 5 — PATH. Everything collapses onto one line through time. */
    if (s < 5.5) {
      vec3 p = pathAt(aId) + (aSeed - 0.5) * 0.36;
      alpha = 0.48 + aSeed.y * 0.55;
      return p;
    }

    /* 6 — RESOLVED. Complexity converges on three points. Calm. */
    float k = floor(aGroup / 2.5);
    vec3 c = vec3((k - 1.0) * 2.1, 0.0, 0.0);
    float keep = step(0.74, aSeed.x);
    vec3 p = c + aDir * (0.30 + aSeed.y * 0.45) + aDir * keep * 2.6;
    alpha = (0.26 + aSeed.z * 0.4) * (0.32 + keep * 0.68);
    return p;
  }

  void main() {
    /* Density. A hard cull would pop as the value moves, so the threshold has
       a soft shoulder and points fade out as the field thins. */
    float live = smoothstep(uDensity, uDensity - 0.14, aSeed.x);
    if (live < 0.004) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0); // outside clip space: discarded
      gl_PointSize = 0.0;
      return;
    }

    float alphaA, alphaB, markA, markB;
    vec3 pA = shape(uShapeA, alphaA, markA);
    vec3 pB = shape(uShapeB, alphaB, markB);

    vec3 pos   = mix(pA, pB, uMix);
    float alpha = mix(alphaA, alphaB, uMix);
    float mark  = mix(markA, markB, uMix);

    /* Slow drift so a held state still breathes. Three sines beat a noise
       texture here — the motion only has to read as alive. */
    float d = sin(pos.x * 0.7 + uTime * 0.21)
            * sin(pos.y * 0.8 - uTime * 0.17)
            * sin(pos.z * 0.9 + uTime * 0.19);
    pos += normalize(pos + 1e-4) * d * 0.16;

    /* Energy. Moving fast pushes the field open; at rest it settles. This is
       what makes the world feel physical rather than stepped. */
    pos += normalize(pos + 1e-4) * uSpeed * 0.42;

    /* Depth-weighted parallax: the field must read as a volume. */
    float depth = clamp((pos.z + 5.0) / 10.0, 0.0, 1.0);
    pos.x += uPointer.x * 0.55 * depth;
    pos.y += uPointer.y * 0.38 * depth;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vec4 clip = projectionMatrix * mv;

    /* The field opens around the typography instead of hiding behind a
       scrim. Legibility becomes part of the composition. */
    if (uClearAmount > 0.001) {
      vec2 ndc = clip.xy / max(1e-4, abs(clip.w));
      for (int i = 0; i < 2; i++) {
        float slotOn = step(float(i) + 0.5, uClearCount);
        vec4 R = uClear[i];
        vec2 delta = ndc - R.xy;
        vec2 q = abs(delta) - R.zw;
        float sd = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
        float push = smoothstep(0.26, -0.08, sd);
        float len = length(delta);
        vec2 dir = len > 1e-4 ? delta / len : vec2(0.0, 1.0);
        ndc += dir * push * 0.34 * uClearAmount * slotOn;
      }
      clip.xy = ndc * abs(clip.w);
    }

    gl_Position = clip;

    /* The probe band: only lit while the evidence stage is on screen. */
    float band = smoothstep(0.32, 0.0, abs(pos.y - uProbe)) * uProbeStrength;
    vBand = band;

    float sizeMul = mix(uSizeA, uSizeB, uMix);
    float base = uSize * sizeMul * (0.5 + aSeed.x * 0.9);
    gl_PointSize = (base + band * 2.2) * (1.0 + uSpeed * 0.5) * uPixelRatio * (11.0 / -mv.z);

    /* Colour is positional. The stage accent leads; a small proportion of
       points burn to near-white so the field has highlights, not a wash. */
    vec3 accent = mix(uAccentA, uAccentB, uMix);
    vec3 neutral = vec3(0.42, 0.46, 0.52);
    vec3 col = mix(neutral, accent, 0.28 + aSeed.y * 0.45);
    col = mix(col, vec3(1.0), pow(aSeed.z, 7.0) * 0.75);
    col = mix(col, vec3(1.0, 0.706, 0.329), mark * 0.92);
    col = mix(col, accent, band * 0.8);

    vColor = col;
    vAlpha = alpha * uReveal * uPresence * live * (1.0 + uSpeed * 0.35);
  }
`;

export const FIELD_FRAG = /* glsl */ `
  precision mediump float;

  varying vec3  vColor;
  varying float vAlpha;
  varying float vBand;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = dot(uv, uv);
    if (d > 0.25) discard;

    float a = pow(1.0 - d * 4.0, 1.9);
    gl_FragColor = vec4(vColor, a * vAlpha * (1.0 + vBand * 0.5));
  }
`;

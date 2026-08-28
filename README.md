# Dhanush Konduru — Portfolio

An interactive exhibition of an engineer's work, built around one idea taken
from the research it presents: **scroll is the probe.**

A single WebGL field runs the height of the page. It is not a backdrop — it is
the specimen being measured, and descending the page drives the measurement.
Seven states, one shader, one draw call.

```bash
npm install
npm run dev      # http://localhost:3000
```

---

## The concept

Dhanush's patents are about proving a model actually forgot something instead of
trusting a loss curve that says it did. The site makes the same argument
spatially: you scroll, the field resolves, and in the research section the probe
descends through a specimen whose marked records dissolve as it passes.

**Colour is positional, not decorative.** Each stage owns one accent, so the
temperature of the page tells you where you are in the argument — and it leaves
and returns:

| Stage | State of the field | Accent |
|---|---|---|
| 00 Index | Dispersed — nothing measured yet | mint |
| 01 Approach | Structure forms; a lattice locks in | mint |
| 02 Stack | Seven domains separate into clusters | cyan |
| 03 Work | Orthogonal slabs — architecture | iris |
| 04 Research | Specimen, marked wedge, probe descending | amber |
| 05 Journey | Everything collapses onto one path | cyan |
| 06 Contact | Converged on three points. Calm | mint |

---

## Stack

| | |
|---|---|
| Framework | Next.js 15 (App Router) · React 19 · TypeScript (strict) |
| Styling | Tailwind CSS v4 — role-named tokens in `src/app/globals.css` |
| 3D | Three.js · React Three Fiber — one custom shader, one draw call |
| Motion | Framer Motion + an inertial scroll smoother (`src/system/scroll.ts`) |
| Type | Instrument Serif · JetBrains Mono · Inter Tight, self-hosted |

First Load JS is **181 kB**; three.js is behind `next/dynamic` and never enters
the initial bundle.

### Three voices

- **Instrument Serif** — the thinking voice. Statements, arguments, findings.
- **JetBrains Mono** — the measuring voice. Indices, IDs, data, annotations.
- **Inter Tight** — reading copy, and nothing else.

Typography utilities are named by **role**, not size (`t-monument`,
`t-statement`, `t-figure`, `t-mark`, `t-note`), so a section can only reach for
the voice appropriate to what it is saying.

---

## `src/system/` — the field

| File | Role |
|---|---|
| `stages.ts` | The seven states: shape, accent, camera, density. Sections and nav derive from this, so they cannot drift out of sync. |
| `stageStore.ts` | Scroll → one continuous float `p` across stages. Read by reference inside `useFrame`; scrolling never triggers a React render. |
| `shaders.ts` | Seven shapes generated procedurally in the vertex shader. |
| `SystemField.tsx` | Blending, camera choreography, the probe. |
| `SystemCanvas.tsx` | Density budget, visibility pausing. |
| `SystemLayer.tsx` | Lazy load, WebGL detection, static fallback. |

**No per-state position buffers.** The vertex shader evaluates the two states
either side of the scroll position and mixes them, so a transformation is exact
and free at any point between stages, and adding a state costs one `if` branch.

Two interactions make the field part of the product rather than scenery:

- **The hero type is published to the shader as NDC rectangles.** The field
  opens around the words instead of hiding behind a scrim — legibility becomes
  part of the composition.
- **Hovering a domain in the Stack section** pulls that cluster out of the
  field. The DOM and the 3D are two halves of one component.

All easing is frame-rate independent (`1 - exp(-k·dt)`), so nothing runs at
double speed on a 120 Hz display or crawls on a throttled tab.

---

## Composition rules

There is no `Card`, no `Panel`, no `Chip`. Those are what made every section
look the same. What survives is a rule, a marginal annotation, and a text link.

**Every section opens differently, on purpose:**

- **About** — statement indented to column three, marginalia hung in the left margin
- **Stack** — an index page: monumental count, small lede, the list dominating
- **Work** — a wide statement with the note hung beneath it
- **Research** — right-aligned, led by the record identifiers
- **Journey** — the span of years leads; the sentence is demoted
- **Contact** — a monument and almost nothing else

On desktop the right page margin is reserved for the section register, so the
page is **deliberately asymmetric** rather than accidentally colliding with it.

Motion is three primitives (`MaskLines`, `DrawRule`, `Enter`) and most content
does not animate at all. Everything-fades-up is the cheapest tell in generated
frontend.

---

## Updating the content

All content lives in `src/data/`. You should never edit a component to change
what the site says.

| File | What it holds |
|---|---|
| `profile.ts` | Name, headline, positioning, links, SEO, hero markers |
| `experience.ts` | Internships and education — drives the path |
| `projects.ts` | Every project, tiered 1 / 2 / 3 |
| `research.ts` | Both invention disclosures and the three manuscripts |
| `skills.ts` | The seven domains — also the field's cluster count |
| `achievements.ts` | Placements and certifications |

**Tier 1** projects get a full plate with their own composition and diagram;
**tier 2** appear in the register; **tier 3** in the compact list. Every tier
opens the same full record, so detail is never lost — only the space it gets up
front changes. Set `note` when a repository is private rather than linking
somewhere that 404s.

`src/components/ProjectVisual.tsx` maps a project id to an inline SVG plate.
Each is drawn from that project's real measured output — the unlearning chart
plots the actual three-seed relearning-attack results, not illustrative numbers.

---

## Performance & accessibility

- One WebGL context for the whole site; rendering stops when the tab is hidden.
- Density scales with the device (6,200 / 2,600 / 1,400 points), and point size
  compensates so a sparse field still reads as intentional.
- `prefers-reduced-motion` freezes the probe, stops rotation and drift, and
  disables every entrance.
- No WebGL → a static chromatic field. The narrative survives.
- Every text colour clears **WCAG AA** on the base: 18.2 / 8.8 / 6.6 / 5.0, with
  accents at 13.3 (mint), 11.4 (amber), 10.4 (cyan), 8.4 (iris).
- One `h1`, no heading-level jumps, focus trap and restore in the record sheet.

---

## Deployment

```bash
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

Drives `metadataBase`, Open Graph, `sitemap.xml` and `robots.txt`. The OG card
at `/opengraph-image` is generated at build time from the same profile data.

---

## Notes for future edits

- **There is no `scroll-behavior` in the stylesheet, and there must not be.**
  `src/system/scroll.ts` animates the page (and anchors) itself; leaving
  `scroll-behavior: smooth` on `html` makes the browser start a second,
  competing animation on every one of those frames. That is what made scrolling
  feel like mush the first time.
- Wheel `deltaMode` is normalised (`1` = lines × 16, `2` = pages × viewport).
  Taking `deltaY` raw makes scrolling crawl on mice that report line units.
- Touch is never hijacked, and any panel that scrolls itself opts out with
  `data-scroll-ignore`.
- Scroll **velocity** feeds `stage.speed`, which drives field dispersion, point
  size and camera pull-back. Position alone made it feel like a slideshow.
- `overflow-x: hidden` lives on `html`, not `body`. On `body` it makes body a
  scroll container and silently breaks `position: sticky`.
- `rail` sets an explicit `width: 100%`: inside a flex column, `margin-inline:
  auto` otherwise collapses the box to fit-content.
- GLSL ES reserves more words than you expect — `active` among them.
- `<line>` in JSX resolves to the SVG element, not `THREE.Line`. Use
  `lineSegments`.
- Colour literals exist outside the CSS tokens in three places — the SVG plates,
  the shader uniforms, and the OG card — because none can read CSS variables.
- The footer year is a literal so server and client cannot disagree across a New
  Year boundary. Bump it manually.

# Dhanush Konduru — Portfolio

An interactive inspection of an engineer's work, built around one object:
**the Verification Engine.**

A single WebGL instrument runs the height of the page — a glass inspection
chamber holding a compute core, clamped between stabilisation ring stacks,
cooled from above, with four modules docked on telescoping arms. It is not a
backdrop and it is not seven separate animations: it is one machine, observed
from seven positions, and scrolling moves the camera between them while the
machine unlocks, opens, measures and seals again.

```bash
npm install
npm run dev      # http://localhost:3000
```

---

## The concept

Dhanush's patents are about proving a model actually forgot something instead
of trusting a loss curve that says it did. The site makes the same argument
spatially: the machine is there to be inspected, its subsystems are named after
the parts of his work that they actually run, and every reading the interface
reports about itself is measured rather than asserted.

**One environment, seven views.** Each section declares the machine's
configuration — where the camera stands, how far the shroud is open, how far
the rings have separated, how hard the data channels are running — and every
part derives its own transform from those parameters. Nothing is keyframed.

| Stage       | View                | Configuration                                            |
| ----------- | ------------------- | -------------------------------------------------------- |
| 01 Home     | The big picture     | Sealed, still, right of the statement                    |
| 02 Approach | How I think         | Camera closer; the first latches release                 |
| 03 Stack    | Tools I use         | Fully unlocked: stacks part, struts retract, arms extend |
| 04 Work     | Things I've built   | Cables at full rate, the module for each project lit     |
| 05 Research | Papers & ideas      | Camera at the chamber; the scanner ring runs the core    |
| 06 Journey  | Growth & milestones | Pulling back, the machine closing up                     |
| 07 Contact  | Let's collaborate   | Sealed again, at rest                                    |

**Nothing translates horizontally.** No section slides in from the side. The
camera is already moving; content emerges in place through opacity, a few
pixels of vertical settle, and blur resolving to sharp.

---

## Stack

|           |                                                                     |
| --------- | ------------------------------------------------------------------- |
| Framework | Next.js 15 (App Router) · React 19 · TypeScript (strict)            |
| Styling   | Tailwind CSS v4 — role-named tokens in `src/app/globals.css`        |
| 3D        | Three.js · React Three Fiber — procedural geometry, no model files  |
| Motion    | CSS animations + an inertial scroll smoother (`src/core/scroll.ts`) |
| Type      | Inter Tight · JetBrains Mono, self-hosted by `next/font`            |

First Load JS is **187 kB**; three.js sits behind `next/dynamic` and never
enters the initial bundle.

### Two voices

- **Inter Tight** — the whole typographic ramp, from the hero statement down to
  reading copy. Geometric, tight, engineered.
- **JetBrains Mono** — the measuring voice. Indices, IDs, units, annotations,
  and every reading the system reports about itself.

Typography utilities are named by **role**, not size (`t-monument`,
`t-statement`, `t-figure`, `t-mark`, `t-note`), so a section can only reach for
the voice appropriate to what it is saying.

---

## `src/core/` — the machine

| File                     | Role                                                                                                                                                                                |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stages.ts`              | The seven views and the six named subsystems. The nav, the navigator, the scroll-spy and the 3D all derive from this, so they cannot drift out of sync.                             |
| `store.ts`               | Scroll → one continuous float `p` across stages, plus the drag yaw and the engine's screen footprint. Read by reference inside `useFrame`; scrolling never triggers a React render. |
| `parts.ts`               | Every piece machined from primitives: bevelled annular plates, chamfered housings, fins, bolts, routed conduits, and the nameplate drawn to a canvas.                               |
| `VerificationEngine.tsx` | The instrument and the single frame loop that drives it: unlocking, the core, the scanner pass, the cables, the anchors. Zero per-frame allocation.                                 |
| `CameraRig.tsx`          | Critically damped position and aim, plus pointer follow and camera breathing.                                                                                                       |
| `ParticleField.tsx`      | A sparse shell of data particles; drift is computed in the vertex shader.                                                                                                           |
| `Scene.tsx`              | Lighting, baked reflections, device tier, adaptive pixel ratio.                                                                                                                     |
| `ScrollController.tsx`   | Lazy load, WebGL detection, static schematic fallback, and the bay's dimmer.                                                                                                        |

**No model files.** The whole machine is a few kilobytes of code rather than a
few megabytes of GLB, and because it is built from parameters it can be driven
by the stage configuration instead of being baked into a mesh. The one piece of
text on it — the nameplate — is drawn to a canvas once and applied as a map.

**The fallback is a reading, not a picture.** Without WebGL the page draws
`EngineSchematic`, a line elevation whose part groups part by the same `open`
value the real engine uses, so the instrument still opens as it is inspected.

**Reflections are baked once from a handful of emissive panels** rather than
downloaded as an HDRI. Metal with nothing to reflect reads as plastic, and this
is a network request the page does not need to make.

**Three levels of depth.** What a section shows first is the claim and the
result; the working sits behind one `Disclosure` control that opens in place.
The content is real DOM either way, so it stays searchable and readable with
the stylesheet off.

**Terminology is fixed.** The two filings are _invention disclosures_ whose
patentability was cleared by a prior-art search. They are never called patents.

**Idle is almost still.** The core turns very slowly, packets drift along the
crown cables, the seed breathes and each module settles by a few thousandths of
a unit out of phase. Nothing spins for the sake of spinning.

**Drag turns it; it turns back.** A press on the engine's footprint yaws it by
horizontal travel, and the renderer relaxes the yaw to rest once the pointer
lets go. Vertical travel is never touched: on touch that is the scroll.

Three more things make the machine part of the product rather than scenery:

- **The callouts are attached to the geometry.** The renderer projects each
  subsystem's anchor to screen space every frame and the HTML layer draws a
  leader line from that exact point. Rotate the assembly and the labels follow
  the parts they name.
- **The engine follows what you are reading.** The project crossing the middle
  of the viewport, the domain row that is open, the stage's own emphasis — each
  puts a subsystem under _focus_, and the module lights and its callout rises.
  Hover is a separate, stronger channel, so the two never fight.
- **Hovering a module** lifts it out of its dock, brightens its indicator, and
  raises its callout to full.

All easing is frame-rate independent (`1 - exp(-k·dt)`), so nothing runs at
double speed on a 120 Hz display or crawls on a throttled tab.

---

## Composition rules

There is no `Card`, no `Panel`, no `Chip`. Those are what made every section
look the same. What survives is a section header, a marginal annotation, a
labelled field and a text link.

**The bay is divided, not layered.** On wide screens the right margin belongs
to the section navigator and the left belongs to the machine, which is
deliberately cropped by the frame while you read. Reading sections hold their
column in the `lane` between the two. That is why body copy never sits on top
of the assembly without the page resorting to a scrim over the art.

Below `xl` there is no lane to stand in, so the composition changes rather than
shrinking. The engine takes a band of its own at the top of the hero, retreats
further the more a section is being read, and is **exposed down at the source**
— `toneMappingExposure` drops to 0.62 — rather than being covered with a grey
sheet. The desktop dimmer is a radial wash, lightest where the machine is,
which is right beside a column of type and exactly wrong behind one; below `xl`
it is switched off and a flat wash carries the dimming instead.

A headline's line breaks are drawn for a wide measure too. Below `sm` they are
dropped and the sentence flows, because a designed break re-wraps into a ragged
mess on a phone and runs the end of one line into the start of the next.

Motion is three primitives (`MaskLines`, `DrawRule`, `Emerge`) and most content
does not animate at all. **The animation itself is CSS; JavaScript decides only
when.** An entrance that holds its element at opacity 0 until the main thread
has a frame to spare is an entrance that can leave the page blank.

---

## Updating the content

All content lives in `src/data/`. You should never edit a component to change
what the site says.

| File              | What it holds                                         |
| ----------------- | ----------------------------------------------------- |
| `profile.ts`      | Name, headline, positioning, links, SEO, hero markers |
| `experience.ts`   | Internships and education — drives the path           |
| `projects.ts`     | Every project, tiered 1 / 2 / 3                       |
| `research.ts`     | Both invention disclosures and the three manuscripts  |
| `skills.ts`       | The domains, each bound to a module of the machine    |
| `achievements.ts` | Placements and certifications                         |

**Tier 1** projects get a full plate with their own diagram; tiers 2 and 3
appear in the register. Every tier opens the same full record, so detail is
never lost — only the space it gets up front changes. Set `note` when a
repository is private rather than linking somewhere that 404s.

`src/components/ProjectVisual.tsx` maps a project id to an inline SVG plate.
Each is drawn from that project's real measured output — the unlearning chart
plots the actual three-seed relearning-attack results, not illustrative numbers.

The binding between a domain or a project and the module it lights lives in the
`BOUND` map at the top of `Stack.tsx` and `Work.tsx`. Add a project, add a line.

---

## Performance & accessibility

- One WebGL context for the whole site; rendering stops when the tab is hidden.
- Device tier decides geometry counts, particle budget, antialiasing and
  shadows together, and `PerformanceMonitor` drops the pixel ratio if the
  machine cannot hold frame rate at the tier's ceiling.
- Repeated geometry is instanced; the six conduits are merged into one buffer;
  packets read a precomputed sample table rather than calling `getPointAt`.
- `prefers-reduced-motion` stops the rotation, the drift, the camera breathing
  and the pointer follow, skips the boot sequence entirely, and collapses every
  entrance — while leaving the design intact.
- No WebGL → a static schematic of the same machine. The composition survives.
- Every text colour clears **WCAG AA** on the ground: 17.8 / 8.0 / 5.5 / 4.8,
  with the accent at 13.7. `ink-4` carries the smallest type on the page, so it
  is the step that gets checked rather than eyeballed.
- One `h1`, no heading-level jumps, visible focus, and focus trap and restore in
  the record sheet.

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
  `src/core/scroll.ts` animates the page (and anchors) itself; leaving
  `scroll-behavior: smooth` on `html` makes the browser start a second,
  competing animation on every one of those frames. That is what made scrolling
  feel like mush the first time.
- **Stages hold; they do not lerp between section centres.** A section six
  viewports tall put its centre three viewports below its heading, so the
  machine spent the whole of the reading still travelling toward the
  configuration that section had asked for. `computeP` holds a stage through
  the body of its section and moves only across a band at the boundary.
- **`bias` is a screen fraction, not a world offset.** A fixed world offset
  moves the machine by a different number of pixels on every aspect ratio,
  which is exactly how type and geometry end up on top of each other on
  somebody else's monitor. It is converted through the frustum's own
  half-width in `CameraRig`.
- Metal takes almost all of its colour from what it reflects. Pushed to full
  metalness against a dark bay, every surface went black; each one now keeps
  enough diffuse to hold its own value.
- Wheel `deltaMode` is normalised (`1` = lines × 16, `2` = pages × viewport).
  Taking `deltaY` raw makes scrolling crawl on mice that report line units.
- Touch is never hijacked, and any panel that scrolls itself opts out with
  `data-scroll-ignore`.
- `overflow-x: hidden` lives on `html`, not `body`. On `body` it makes body a
  scroll container and silently breaks `position: sticky`.
- `rail` sets an explicit `width: 100%`: inside a flex column, `margin-inline:
auto` otherwise collapses the box to fit-content.
- `<line>` in JSX resolves to the SVG element, not `THREE.Line`. Use
  `lineSegments`.
- Colour literals exist outside the CSS tokens in three places — the SVG plates,
  the three.js materials, and the OG card — because none can read CSS variables.
- The footer year is a literal so server and client cannot disagree across a New
  Year boundary. Bump it manually.

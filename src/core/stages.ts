/* ============================================================================
 * STAGES — one continuous inspection
 *
 * The page is not seven pages. It is one machine — the Verification Engine —
 * observed from seven positions, and scrolling moves the camera between them.
 * Every value here is a state of the MACHINE, not a keyframe of an animation:
 * the parts move because the engine is in a configuration, not because they
 * were told to.
 *
 * Section order is stage order. The top nav, the section navigator, the
 * scroll-spy and the 3D all derive from this file, so they cannot drift out of
 * sync.
 * ========================================================================= */

/** Named subsystems. Callouts, hover targets and stage focus all use these. */
export type ModuleKey =
  "cooling" | "sensor" | "compute" | "ring" | "data" | "io";

export type Stage = {
  id: string;
  /** 01 … 07 */
  index: string;
  /** Top-nav and navigator label. */
  label: string;
  /** One line under the label in the section navigator. */
  blurb: string;
  /** The machine's own word for what it is doing here. */
  state: string;

  /* ---- camera (Y up) ---- */
  camera: [number, number, number];
  target: [number, number, number];
  /**
   * Where the engine sits across the frame, as a fraction of the viewport's
   * half-width. Negative puts it left, positive right, past 1 crops it against
   * the edge. A screen fraction rather than a world offset on purpose: a world
   * offset moves the machine by a different number of pixels on every aspect
   * ratio, which is how type and geometry end up on top of each other on
   * somebody else's monitor.
   */
  bias: number;
  /**
   * 1 docks the engine against the reading lane instead: its right edge is
   * held a fixed gap left of where the lane actually starts on this screen,
   * whatever the aspect ratio. Reading stages dock; the two composed views at
   * either end of the page use `bias`.
   */
  dock: number;

  /* ---- machine configuration, 0..1 unless noted ---- */
  /** Yaw of the whole engine, radians. */
  spin: number;
  /**
   * How far the engine is unlocked: ring stacks part, struts retract, arms
   * extend, the crown lifts. 0 is the sealed machine, 1 is fully opened for
   * inspection.
   */
  open: number;
  /** Internal illumination — the core, the lattice, the module indicators. */
  reveal: number;
  /** The measurement pass: the scanner ring travels the chamber. */
  scan: number;
  /** Rate of packets travelling the cables. */
  flow: number;
  /** Particle activity. */
  dust: number;
  /**
   * How far the bay is dimmed over the machine. The page's pacing control:
   * where the reading is dense the engine steps back, where it is the exhibit
   * it comes forward. Nothing is ever fully covered.
   */
  veil: number;
  /** Subsystem lit for this stage. */
  focus: ModuleKey | null;
  /** Callouts raised to full presence here. */
  callouts: ModuleKey[];
  /**
   * Callouts that are also raised, but only where the frame is wide enough
   * for them to sit clear of the type. The reference composition carries all
   * six around the engine; at 1280 there is room for three.
   */
  calloutsWide?: ModuleKey[];
};

export const STAGES: Stage[] = [
  {
    id: "top",
    index: "01",
    label: "Home",
    blurb: "The big picture",
    state: "System online",
    camera: [0.4, 1.15, 11.2],
    target: [0, 0.38, 0],
    bias: 0.3,
    dock: 0,
    spin: 0,
    open: 0,
    reveal: 0.36,
    scan: 0,
    flow: 0.3,
    dust: 0.45,
    veil: 0,
    focus: null,
    callouts: ["cooling", "compute", "ring"],
    calloutsWide: ["sensor", "data", "io"],
  },
  {
    id: "approach",
    index: "02",
    label: "Approach",
    blurb: "How I think",
    state: "Inspection",
    camera: [1.8, 1.5, 8.8],
    target: [0, 0.3, 0],
    bias: -0.74,
    dock: 1,
    spin: 0.42,
    open: 0.14,
    reveal: 0.5,
    scan: 0,
    flow: 0.4,
    dust: 0.55,
    veil: 0.56,
    focus: "cooling",
    callouts: ["cooling"],
  },
  {
    id: "stack",
    index: "03",
    label: "Stack",
    blurb: "Tools I use",
    state: "Unlocked",
    camera: [-1.4, 0.7, 8.0],
    target: [0, 0.1, 0],
    bias: -0.8,
    dock: 1,
    spin: -0.55,
    open: 1,
    reveal: 0.7,
    scan: 0.08,
    flow: 0.55,
    dust: 0.65,
    veil: 0.52,
    focus: "sensor",
    callouts: ["sensor"],
  },
  {
    id: "work",
    index: "04",
    label: "Work",
    blurb: "Things I've built",
    state: "Under load",
    camera: [1.5, -0.1, 6.4],
    target: [0, 0, 0],
    bias: -1.0,
    dock: 1,
    spin: 0.85,
    open: 0.62,
    reveal: 0.86,
    scan: 0.3,
    flow: 1,
    dust: 0.8,
    veil: 0.6,
    focus: "io",
    callouts: ["io"],
  },
  {
    id: "research",
    index: "05",
    label: "Research",
    blurb: "Papers & ideas",
    state: "Measuring",
    camera: [0.35, 0.15, 5.2],
    target: [0, 0, 0],
    bias: -1.22,
    dock: 1,
    spin: 0.25,
    open: 0.78,
    reveal: 1,
    scan: 1,
    flow: 0.7,
    dust: 1,
    veil: 0.5,
    focus: "compute",
    callouts: ["compute"],
  },
  {
    id: "journey",
    index: "06",
    label: "Journey",
    blurb: "Growth & milestones",
    state: "Reassembling",
    camera: [-1.9, 1.7, 9.6],
    target: [0, 0.2, 0],
    bias: -0.82,
    dock: 1,
    spin: -0.95,
    open: 0.28,
    reveal: 0.55,
    scan: 0,
    flow: 0.5,
    dust: 0.55,
    veil: 0.56,
    focus: "ring",
    callouts: ["ring"],
  },
  {
    id: "contact",
    index: "07",
    label: "Contact",
    blurb: "Let's collaborate",
    state: "Sealed",
    camera: [0, 1.0, 11.8],
    target: [0, 0.36, 0],
    bias: 0.27,
    dock: 0,
    spin: 0.18,
    open: 0,
    reveal: 0.42,
    scan: 0,
    flow: 0.24,
    dust: 0.32,
    veil: 0.12,
    focus: null,
    callouts: [],
  },
];

export const STAGE_IDS = STAGES.map((s) => s.id);

/** Nav entries. The top nav carries every stage, Home included. */
export const NAV_STAGES = STAGES;

/* ============================================================================
 * SUBSYSTEMS
 *
 * Each callout names a real part of the engine and a real part of his work.
 * The 3D places an anchor object on the part itself, so a label is attached
 * to geometry, not floated near it: open the machine and the label goes with
 * the component it names.
 * ========================================================================= */

export type Subsystem = {
  key: ModuleKey;
  index: string;
  title: string;
  lines: string[];
  /** Which side of the anchor the label prefers. */
  side: "left" | "right";
  /** Where the label sits relative to the projected anchor, in px. */
  offset: [number, number];
};

export const SUBSYSTEMS: Subsystem[] = [
  {
    key: "cooling",
    index: "01",
    title: "Cooling System",
    lines: ["Monitoring · Drift · Tracking", "MLflow · DVC · Evidently AI"],
    side: "left",
    offset: [-150, -36],
  },
  {
    key: "sensor",
    index: "02",
    title: "Sensor Array",
    lines: ["Inputs · Retrieval · Evaluation", "Hybrid search · RAGAS"],
    side: "left",
    offset: [-146, 4],
  },
  {
    key: "compute",
    index: "03",
    title: "Compute Core",
    lines: ["Models · Agents · Inference", "PyTorch · LangGraph · LoRA"],
    side: "left",
    offset: [-160, 72],
  },
  {
    key: "ring",
    index: "04",
    title: "Stabilization Ring",
    lines: ["Verification · Reliability · Scale", "Docker · CI/CD · Cloud Run"],
    side: "right",
    offset: [152, 28],
  },
  {
    key: "data",
    index: "05",
    title: "Data Pipelines",
    lines: ["Processing · Storage · Serving", "Django · FastAPI · PostgreSQL"],
    side: "right",
    offset: [150, -24],
  },
  {
    key: "io",
    index: "06",
    title: "I/O Interface",
    lines: ["APIs · Integrations", "REST · API keys · RBAC"],
    side: "right",
    offset: [148, 18],
  },
];

export const SUBSYSTEM_BY_KEY = Object.fromEntries(
  SUBSYSTEMS.map((s) => [s.key, s]),
) as Record<ModuleKey, Subsystem>;

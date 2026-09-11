/* ============================================================================
 * STAGES — one continuous camera journey
 *
 * The page is not seven pages. It is one machine, observed from seven
 * positions, and scrolling interpolates between them. Every value here is a
 * state of the SYSTEM, not a keyframe of an animation: the parts move because
 * the machine is in a configuration, not because they were told to.
 *
 * Section order is stage order. `sections.ts` re-exports this file, so the
 * top nav, the section navigator, the scroll-spy and the 3D can never
 * disagree about what the page contains.
 * ========================================================================= */

/** Named subsystems. Callouts, hover targets and stage focus all use these. */
export type ModuleKey = "compute" | "ai" | "data" | "io" | "cooling" | "power";

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

  /* ---- camera ---- */
  camera: [number, number, number];
  target: [number, number, number];
  /**
   * Where the assembly sits across the frame, as a fraction of the viewport's
   * half-width. Negative puts it left, positive right, and anything past 1
   * crops it against the edge.
   *
   * This is a screen fraction rather than a world offset on purpose: a fixed
   * world offset moves the machine by a different number of pixels on every
   * aspect ratio, which is exactly how type and geometry end up on top of
   * each other on somebody else's monitor.
   */
  bias: number;

  /* ---- system configuration, all 0..1 unless noted ---- */
  /** Additional yaw of the whole assembly, radians. */
  spin: number;
  /** Additional pitch of the whole assembly, radians. */
  tilt: number;
  /** How far the concentric rings separate along their own axis. */
  spread: number;
  /** How far the hub shroud opens. */
  open: number;
  /** How strongly the internal illumination reads. */
  reveal: number;
  /** Rate of travelling data pulses along the channels. */
  flow: number;
  /** Particle activity. */
  dust: number;
  /**
   * How large the assembly reads on screen here. Reading sections need the
   * machine present but out of the column, so it draws back rather than being
   * cropped by the type.
   */
  scale: number;
  /**
   * How far the bay is dimmed over the machine, 0..1. This is the page's
   * pacing control: where the reading is dense the machine steps back, where
   * it is the exhibit it comes forward. Nothing is ever fully covered.
   */
  veil: number;
  /** Subsystem pulled forward and lit for this stage. */
  focus: ModuleKey | null;
  /** Callouts raised to full presence here. */
  callouts: ModuleKey[];
};

export const STAGES: Stage[] = [
  {
    id: "top",
    index: "01",
    label: "Home",
    blurb: "Full assembly",
    state: "System online",
    camera: [0.2, 0.5, 10.4],
    target: [0, 0, 0],
    bias: 0.42,
    spin: 0,
    tilt: 0,
    spread: 0,
    open: 0,
    reveal: 0.34,
    flow: 0.3,
    dust: 0.5,
    scale: 1.0,
    veil: 0.0,
    focus: null,
    callouts: ["compute", "ai", "cooling"],
  },
  {
    id: "approach",
    index: "02",
    label: "Approach",
    blurb: "Outer shell",
    state: "Inspection",
    camera: [1.9, 1.0, 8.8],
    target: [0, 0.05, 0],
    bias: -0.9,
    spin: 0.11,
    tilt: 0.06,
    spread: 0.26,
    open: 0.2,
    reveal: 0.5,
    flow: 0.42,
    dust: 0.6,
    scale: 1.0,
    veil: 0.6,
    focus: "cooling",
    callouts: ["cooling"],
  },
  {
    id: "stack",
    index: "03",
    label: "Stack",
    blurb: "Subsystems",
    state: "Separated",
    camera: [-1.5, 0.5, 8.0],
    target: [0, 0, 0],
    bias: -0.95,
    spin: 0.24,
    tilt: -0.04,
    spread: 0.72,
    open: 0.55,
    reveal: 0.74,
    flow: 0.58,
    dust: 0.7,
    scale: 1.0,
    veil: 0.58,
    focus: "compute",
    callouts: ["compute"],
  },
  {
    id: "work",
    index: "04",
    label: "Work",
    blurb: "Modules under load",
    state: "Under load",
    camera: [2.0, -0.7, 8.5],
    target: [0, -0.05, 0],
    bias: -0.98,
    spin: -0.15,
    tilt: 0.1,
    spread: 0.42,
    open: 0.4,
    reveal: 0.8,
    flow: 1,
    dust: 0.85,
    scale: 1.0,
    veil: 0.62,
    focus: "io",
    callouts: ["io"],
  },
  {
    id: "research",
    index: "05",
    label: "Research",
    blurb: "Inner core",
    state: "Under probe",
    camera: [0.1, 0.35, 6.4],
    target: [0, 0, 0],
    bias: -1.22,
    spin: 0.32,
    tilt: -0.02,
    spread: 0.92,
    open: 1,
    reveal: 1,
    flow: 0.78,
    dust: 1,
    scale: 1.0,
    veil: 0.48,
    focus: "ai",
    callouts: ["ai", "compute"],
  },
  {
    id: "journey",
    index: "06",
    label: "Journey",
    blurb: "Reassembly",
    state: "Reassembling",
    camera: [-1.2, 1.7, 10.0],
    target: [0, 0.1, 0],
    bias: -0.95,
    spin: 0.54,
    tilt: 0.13,
    spread: 0.34,
    open: 0.28,
    reveal: 0.56,
    flow: 0.5,
    dust: 0.6,
    scale: 1.0,
    veil: 0.56,
    focus: "power",
    callouts: ["power"],
  },
  {
    id: "contact",
    index: "07",
    label: "Contact",
    blurb: "Stable state",
    state: "Resolved",
    camera: [0, 0.25, 11.3],
    target: [0, 0, 0],
    bias: 0.32,
    spin: 0.28,
    tilt: 0,
    spread: 0,
    open: 0,
    reveal: 0.44,
    flow: 0.24,
    dust: 0.35,
    scale: 1.0,
    veil: 0.26,
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
 * Each callout names a real part of the assembly and a real part of his work.
 * `anchor` is the point on the machine the leader line is drawn to, in local
 * model space — the callouts are attached to geometry, not floated near it.
 * ========================================================================= */

export type Subsystem = {
  key: ModuleKey;
  title: string;
  lines: string[];
  /** Local-space anchor on the assembly. */
  anchor: [number, number, number];
  /** Which side of the anchor the label sits on. */
  side: "left" | "right";
  /**
   * Where the label sits relative to the projected anchor, in px. The hub is
   * pushed well clear because its anchor is in the middle of the assembly;
   * the docked modules only need a short run off the edge.
   */
  offset: [number, number];
  /** Angle around the docking ring, radians — where the module is built. */
  angle: number;
};

/** Radius of the docking ring the subsystem modules are bolted to. */
export const DOCK_RADIUS = 1.95;

const dock = (deg: number): [number, number, number] => {
  const a = (deg * Math.PI) / 180;
  return [
    +(DOCK_RADIUS * Math.cos(a)).toFixed(4),
    +(DOCK_RADIUS * Math.sin(a)).toFixed(4),
    0.2,
  ];
};

export const SUBSYSTEMS: Subsystem[] = [
  {
    key: "compute",
    title: "Compute Core",
    lines: ["Scalable infrastructure", "Django · FastAPI · PostgreSQL"],
    anchor: [0, 0.6, 0.46],
    side: "right",
    offset: [58, -338],
    angle: 0,
  },
  {
    key: "ai",
    title: "AI Module",
    lines: ["Models · Agents · Inference", "PyTorch · LangGraph · LoRA"],
    anchor: dock(62),
    side: "right",
    offset: [104, -34],
    angle: (62 * Math.PI) / 180,
  },
  {
    key: "data",
    title: "Data Pipelines",
    lines: ["Retrieval · Evaluation", "Hybrid search · RAGAS · reranking"],
    anchor: dock(124),
    side: "left",
    offset: [-104, -34],
    angle: (124 * Math.PI) / 180,
  },
  {
    key: "io",
    title: "I/O Interface",
    lines: ["APIs · Integrations", "REST · API keys · RBAC"],
    anchor: dock(180),
    side: "left",
    offset: [-118, 6],
    angle: Math.PI,
  },
  {
    key: "cooling",
    title: "Cooling System",
    lines: ["Monitoring · Drift · Tracking", "MLflow · DVC · Evidently AI"],
    anchor: dock(236),
    side: "left",
    offset: [-104, 56],
    angle: (236 * Math.PI) / 180,
  },
  {
    key: "power",
    title: "Power & Control",
    lines: ["Reliability · Safety · Scale", "Docker · CI/CD · Cloud Run"],
    anchor: dock(298),
    side: "right",
    offset: [118, 44],
    angle: (298 * Math.PI) / 180,
  },
];

export const SUBSYSTEM_BY_KEY = Object.fromEntries(
  SUBSYSTEMS.map((s) => [s.key, s]),
) as Record<ModuleKey, Subsystem>;

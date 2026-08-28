/* ============================================================================
 * STAGES
 *
 * The page is one continuous measurement. Each stage is a state the field
 * resolves into, plus the accent that owns that part of the argument and the
 * camera that observes it.
 *
 * Stage order is the section order — `sections.ts` is derived from this file,
 * so the nav, the scroll-spy and the 3D can never drift out of sync.
 * ========================================================================= */

export type Stage = {
  id: string;
  index: string;
  /** Nav label. */
  label: string;
  /** What the field is doing here — used as the section's own eyebrow. */
  state: string;
  /** Shape branch in the vertex shader. */
  shape: number;
  /** Positional accent, linear 0–1 RGB (bypasses colour management). */
  accent: [number, number, number];
  /** Camera position for this stage. */
  camera: [number, number, number];
  /** Point size multiplier. Density and scale are art direction, not defaults. */
  size: number;
  /**
   * How present the field is here, 0..1. This replaces the old section
   * backgrounds: rather than laying a panel over the art, the field itself
   * steps back where the reading is dense and comes forward where it is the
   * exhibit. Nothing is ever covered.
   */
  presence: number;
  /**
   * Fraction of the point budget actually drawn here, 0..1.
   *
   * This is the difference between seven arrangements of one particle field
   * and seven genuinely different physical states. Where structure carries a
   * chapter (the lattice in Approach, the architecture in Work, the route in
   * Journey) the points step aside instead of competing with it.
   */
  density: number;
};

/** sRGB hex → 0–1 triple, written straight to the framebuffer. */
function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export const MINT = rgb("#5ee9c0");
export const CYAN = rgb("#56c6f5");
export const IRIS = rgb("#7c6bff");
export const AMBER = rgb("#ffb454");

export const STAGES: Stage[] = [
  {
    id: "top",
    index: "00",
    label: "Index",
    state: "Dispersed",
    shape: 0,
    accent: MINT,
    camera: [0, 0, 9.6],
    size: 1.0,
    presence: 1.0,
    density: 1.0,
  },
  {
    id: "about",
    index: "01",
    label: "Approach",
    state: "Structure forms",
    shape: 1,
    accent: MINT,
    camera: [1.5, 0.35, 7.6],
    size: 1.05,
    presence: 0.5,
    density: 0.62,
  },
  {
    id: "stack",
    index: "02",
    label: "Stack",
    state: "Domains separate",
    shape: 2,
    accent: CYAN,
    camera: [0, 0.15, 10.2],
    size: 0.95,
    presence: 0.55,
    density: 0.82,
  },
  {
    id: "work",
    index: "03",
    label: "Work",
    state: "Systems assemble",
    shape: 3,
    accent: IRIS,
    camera: [-2.1, 0.5, 7.4],
    size: 1.1,
    presence: 0.3,
    density: 0.34,
  },
  {
    id: "research",
    index: "04",
    label: "Research",
    state: "Evidence under probe",
    shape: 4,
    accent: AMBER,
    camera: [0, 0, 6.8],
    size: 1.2,
    presence: 0.85,
    density: 0.95,
  },
  {
    id: "journey",
    index: "05",
    label: "Journey",
    state: "One path",
    shape: 5,
    accent: CYAN,
    camera: [0.4, 0.5, 8.6],
    size: 1.0,
    presence: 0.45,
    density: 0.4,
  },
  {
    id: "contact",
    index: "06",
    label: "Contact",
    state: "Resolved",
    shape: 6,
    accent: MINT,
    camera: [0, 0, 7.4],
    size: 0.9,
    presence: 1.0,
    density: 0.22,
  },
];

/** Nav entries — everything after the hero. */
export const NAV_STAGES = STAGES.slice(1);

export const STAGE_IDS = STAGES.map((s) => s.id);
